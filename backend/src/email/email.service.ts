import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { SendMailOptions } from 'nodemailer';
import * as handlebars from 'handlebars';
import type { TemplateDelegate } from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export interface PaymentSuccessEmailData {
  customerName: string;
  customerEmail: string;
  merchantName: string;
  amount: number;
  transactionReference: string;
  paymentDate: string;
  paymentMethod: string;
  receiptPath?: string; // Deprecated: Use receiptBuffer instead
  receiptBuffer?: Buffer; // Preferred: Receipt PDF as buffer
}

export interface PaymentFailedEmailData {
  customerName: string;
  customerEmail: string;
  merchantName: string;
  amount: number;
  transactionReference: string;
  paymentDate: string;
  failureReason?: string;
}

export interface PasswordResetEmailData {
  email: string;
  resetLink: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templatesDir: string;

  constructor(private readonly configService: ConfigService) {
    // Initialize Nodemailer transporter
    const emailConfig = this.configService.get('config.email');
    
    // Remove spaces from App Password if present
    const appPassword = (emailConfig.pass || '').replace(/\s/g, '');
    
    // Port 465 requires secure: true (SSL), port 587 uses secure: false (TLS)
    const isSecure = emailConfig.port === 465;
    
    // SMTP configuration for SendGrid (works with Gmail too)
    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: isSecure, // true for 465 (SSL), false for 587 (TLS)
      auth: {
        user: emailConfig.user,
        pass: appPassword,
      },
      // Extended timeouts
      connectionTimeout: 45000, // 45 seconds
      greetingTimeout: 45000,
      socketTimeout: 45000,
      // TLS options
      tls: {
        // Don't reject unauthorized certificates
        rejectUnauthorized: false,
        // Allow legacy TLS versions if needed
        minVersion: 'TLSv1',
      },
      // Connection pooling
      pool: false, // Disable pooling - create fresh connection each time
      maxConnections: 1,
      maxMessages: 1,
      // Require TLS for port 587
      requireTLS: !isSecure && emailConfig.port === 587,
    } as nodemailer.TransportOptions);

    // Templates directory
    this.templatesDir = path.join(process.cwd(), 'src', 'email', 'templates');

    // Verify transporter connection (non-blocking, don't wait for it)
    // Run in next tick to not block constructor
    setImmediate(() => {
      this.verifyConnection().catch((error) => {
        this.logger.error(`Email verification error: ${error.message}`);
      });
    });
  }

  /**
   * Verify email transporter connection
   * Note: Verification is optional and non-blocking. If it fails, email sending will still be attempted.
   */
  private async verifyConnection() {
    try {
      const emailConfig = this.configService.get('config.email');
      this.logger.log(`Verifying email connection to ${emailConfig.host}:${emailConfig.port} as ${emailConfig.user}`);
      // Extended timeout for Gmail on cloud hosts
      const verifyPromise = this.transporter.verify();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email verification timeout after 30 seconds')), 30000)
      );
      await Promise.race([verifyPromise, timeoutPromise]);
      this.logger.log('✅ Email transporter connection verified successfully');
    } catch (error) {
      // Log as warning instead of error - verification failure doesn't mean email won't work
      this.logger.warn(`⚠️ Email transporter verification failed: ${error.message}. Email sending will still be attempted.`);
      if (error.response) {
        this.logger.warn(`SMTP Response: ${error.response}`);
      }
    }
  }

  /**
   * Load and compile Handlebars template
   */
  private async loadTemplate(templateName: string): Promise<TemplateDelegate> {
    const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    
    // Register helpers
    handlebars.registerHelper('currentYear', () => {
      return new Date().getFullYear();
    });
    
    return handlebars.compile(templateContent);
  }

  /**
   * Format amount in CFA
   */
  private formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Send payment success email with receipt attachment
   */
  async sendPaymentSuccessEmail(data: PaymentSuccessEmailData): Promise<void> {
    try {
      this.logger.log(`Attempting to send payment success email to: ${data.customerEmail}`);
      
      const template = await this.loadTemplate('payment-success');
      const html = template({
        ...data,
        formattedAmount: this.formatAmount(data.amount),
      });

      const emailConfig = this.configService.get('config.email');
      
      if (!emailConfig || !emailConfig.user || !emailConfig.pass) {
        throw new Error('Email configuration is missing. Please check EMAIL_USER and EMAIL_PASS in .env file');
      }

      // Handle receipt attachment - prefer buffer over path
      const attachments: SendMailOptions['attachments'] = [];
      
      if (data.receiptBuffer) {
        // Use buffer if provided (preferred for S3 files)
        attachments.push({
          filename: `receipt-${data.transactionReference}.pdf`,
          content: data.receiptBuffer,
          contentType: 'application/pdf',
        });
      } else if (data.receiptPath) {
        // Fallback to file path (for local storage)
        // Check if file exists before attaching
        if (fs.existsSync(data.receiptPath)) {
          attachments.push({
            filename: `receipt-${data.transactionReference}.pdf`,
            path: data.receiptPath,
            contentType: 'application/pdf',
          });
        } else {
          this.logger.warn(`Receipt file not found at path: ${data.receiptPath}`);
        }
      }

      const mailOptions: nodemailer.SendMailOptions = {
        from: emailConfig.from || emailConfig.user,
        to: data.customerEmail,
        subject: `Payment Successful - ${data.transactionReference}`,
        html,
        attachments,
      };

      this.logger.log(`Sending email from: ${mailOptions.from} to: ${mailOptions.to}`);
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Payment success email sent successfully. Message ID: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send payment success email: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send payment failed email
   */
  async sendPaymentFailedEmail(data: PaymentFailedEmailData): Promise<void> {
    try {
      const template = await this.loadTemplate('payment-failed');
      const html = template({
        ...data,
        formattedAmount: this.formatAmount(data.amount),
      });

      const emailConfig = this.configService.get('config.email');
      const mailOptions: nodemailer.SendMailOptions = {
        from: emailConfig.from || emailConfig.user,
        to: data.customerEmail,
        subject: `Payment Failed - ${data.transactionReference}`,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Payment failed email sent: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send payment failed email: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send password reset email with retry logic
   */
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Attempting to send password reset email to: ${data.email} (attempt ${attempt}/${maxRetries})`);
        
        const template = await this.loadTemplate('password-reset');
        const html = template({
          ...data,
        });

        const emailConfig = this.configService.get('config.email');
        
        if (!emailConfig || !emailConfig.user || !emailConfig.pass) {
          throw new Error('Email configuration is missing. Please check EMAIL_USER and EMAIL_PASS in .env file');
        }

        const mailOptions: nodemailer.SendMailOptions = {
          from: emailConfig.from || emailConfig.user,
          to: data.email,
          subject: 'Password Reset Request - MANSATASK',
          html,
        };

        this.logger.log(`Sending password reset email from: ${mailOptions.from} to: ${mailOptions.to}`);
        
        // Try to send with a fresh connection if previous attempts failed
        if (attempt > 1) {
          // Close existing connection and create new transporter
          try {
            this.transporter.close();
          } catch (e) {
            // Ignore close errors
          }
          // Recreate transporter for retry
          const appPassword = (emailConfig.pass || '').replace(/\s/g, '');
          const isSecure = emailConfig.port === 465;
          this.transporter = nodemailer.createTransport({
            host: emailConfig.host,
            port: emailConfig.port,
            secure: isSecure,
            auth: {
              user: emailConfig.user,
              pass: appPassword,
            },
            connectionTimeout: 30000,
            greetingTimeout: 30000,
            socketTimeout: 30000,
            tls: {
              rejectUnauthorized: false,
              minVersion: 'TLSv1',
            },
            pool: true,
            maxConnections: 1,
            maxMessages: 3,
            requireTLS: !isSecure && emailConfig.port === 587,
          });
        }

        const info = await this.transporter.sendMail(mailOptions);
        this.logger.log(`Password reset email sent successfully. Message ID: ${info.messageId}`);
        return; // Success - exit retry loop
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Password reset email attempt ${attempt} failed: ${error.message}`);
        
        // If not the last attempt, wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 1s, 2s, 4s max
          this.logger.log(`Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // All retries failed
    this.logger.error(`Failed to send password reset email after ${maxRetries} attempts: ${lastError?.message}`, lastError?.stack);
    throw lastError || new Error('Failed to send password reset email');
  }

  /**
   * Send generic email (for future use)
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    attachments?: SendMailOptions['attachments'],
  ): Promise<void> {
    try {
      const emailConfig = this.configService.get('config.email');
      const mailOptions: nodemailer.SendMailOptions = {
        from: emailConfig.from || emailConfig.user,
        to,
        subject,
        html,
        attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw error;
    }
  }
}

