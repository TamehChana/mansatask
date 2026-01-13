import { Controller, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('email')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  /**
   * Test email endpoint (for development/testing)
   * POST /email/test
   */
  @Post('test')
  @UseGuards(JwtAuthGuard)
  async testEmail(@Body() body: { to: string }) {
    try {
      await this.emailService.sendPaymentSuccessEmail({
        customerName: 'Test Customer',
        customerEmail: body.to || 'test@example.com',
        merchantName: 'Test Merchant',
        amount: 10000,
        transactionReference: 'TEST-REF-12345',
        paymentDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        paymentMethod: 'MTN',
      });

      return {
        success: true,
        message: 'Test email sent successfully',
      };
    } catch (error) {
      this.logger.error(`Test email failed: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Failed to send test email: ${error.message}`,
        error: error.message,
      };
    }
  }
}


