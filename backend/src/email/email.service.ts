import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
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
  private templatesDir: string;
  private senderEmail: string;

  constructor(private readonly configService: ConfigService) {
    // Initialize SendGrid
    const emailConfig = this.configService.get('config.email');
    
    // Get API key from EMAIL_PASS (SendGrid API key)
    const apiKey = (emailConfig.pass || '').replace(/\s/g, '');
    
    if (!apiKey) {
      this.logger.warn('SendGrid API key not found. Email sending will fail.');
    } else {
      // Set SendGrid API key
      sgMail.setApiKey(apiKey);
      this.logger.log('✅ SendGrid initialized successfully');
    }

    // Get sender email
    this.senderEmail = emailConfig.from || emailConfig.user || '';

    // Templates directory
    this.templatesDir = path.join(process.cwd(), 'src', 'email', 'templates');
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
      const attachments: Array<{ content: string; filename: string; type: string }> = [];
      
      if (data.receiptBuffer) {
        // Use buffer if provided (preferred for S3 files)
        attachments.push({
          content: data.receiptBuffer.toString('base64'),
          filename: `receipt-${data.transactionReference}.pdf`,
          type: 'application/pdf',
        });
      } else if (data.receiptPath) {
        // Fallback to file path (for local storage)
        // Check if file exists before attaching
        if (fs.existsSync(data.receiptPath)) {
          const fileBuffer = fs.readFileSync(data.receiptPath);
          attachments.push({
            content: fileBuffer.toString('base64'),
            filename: `receipt-${data.transactionReference}.pdf`,
            type: 'application/pdf',
          });
        } else {
          this.logger.warn(`Receipt file not found at path: ${data.receiptPath}`);
        }
      }

      const msg = {
        to: data.customerEmail,
        from: this.senderEmail,
        subject: `Payment Successful - ${data.transactionReference}`,
        html,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      this.logger.log(`Sending email from: ${msg.from} to: ${msg.to}`);
      const [response] = await sgMail.send(msg);
      this.logger.log(`Payment success email sent successfully. Status: ${response.statusCode}`);
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

      const msg = {
        to: data.customerEmail,
        from: this.senderEmail,
        subject: `Payment Failed - ${data.transactionReference}`,
        html,
      };

      const [response] = await sgMail.send(msg);
      this.logger.log(`Payment failed email sent. Status: ${response.statusCode}`);
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
        
        if (!emailConfig || !emailConfig.pass) {
          throw new Error('Email configuration is missing. Please check EMAIL_PASS (SendGrid API key) in .env file');
        }

        const msg = {
          to: data.email,
          from: this.senderEmail,
          subject: 'Password Reset Request - MANSATASK',
          html,
        };

        this.logger.log(`Sending password reset email from: ${msg.from} to: ${msg.to}`);
        
        const [response] = await sgMail.send(msg);
        this.logger.log(`Password reset email sent successfully. Status: ${response.statusCode}`);
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
    attachments?: Array<{ content: string; filename: string; type: string }>,
  ): Promise<void> {
    try {
      const msg = {
        to,
        from: this.senderEmail,
        subject,
        html,
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
      };

      const [response] = await sgMail.send(msg);
      this.logger.log(`Email sent. Status: ${response.statusCode}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw error;
    }
  }
}

