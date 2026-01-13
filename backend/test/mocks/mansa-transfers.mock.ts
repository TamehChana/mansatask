import { Injectable } from '@nestjs/common';
import { PaymentProvider } from '@prisma/client';
import { MansaTransfersService } from '../../src/payments/services/mansa-transfers.service';

/**
 * Mock MansaTransfersService for E2E tests
 * Returns successful responses without making actual API calls
 */
@Injectable()
export class MockMansaTransfersService {
  /**
   * Mock authentication - always succeeds
   */
  private async authenticate(): Promise<string> {
    return 'mock-auth-token';
  }

  /**
   * Mock getAuthHeaders - returns mock headers
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    await this.authenticate();
    return {
      'Authorization': 'Bearer mock-auth-token',
      'Content-Type': 'application/json',
    };
  }

  /**
   * Mock initiatePayment - returns successful response
   */
  async initiatePayment(
    amount: number,
    customerPhone: string,
    customerName: string,
    provider: PaymentProvider,
    externalReference: string,
    customerEmail?: string | null,
  ): Promise<{
    providerTransactionId: string;
    status: string;
    message?: string;
  }> {
    // Return a mock transaction ID based on external reference
    const providerTransactionId = `PROV-${externalReference}-${Date.now()}`;
    
    return {
      providerTransactionId,
      status: 'PENDING',
      message: 'Payment initiated successfully (mocked)',
    };
  }

  /**
   * Mock checkPaymentStatus - returns PENDING status
   */
  async checkPaymentStatus(
    providerTransactionId: string,
  ): Promise<{
    status: string;
    message?: string;
  }> {
    return {
      status: 'PENDING',
      message: 'Payment status checked (mocked)',
    };
  }

  /**
   * Mock testAuthentication - always succeeds in tests
   */
  async testAuthentication(): Promise<{
    success: boolean;
    message: string;
  }> {
    return {
      success: true,
      message: 'Authentication successful (mocked)',
    };
  }

  /**
   * Mock getApiLogs - returns empty array
   */
  getApiLogs(): any[] {
    return [];
  }
}

