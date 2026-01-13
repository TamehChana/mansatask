import apiClient from '@/lib/api-client';
import type {
  InitiatePaymentDto,
  PaymentResponse,
  PaymentStatusResponse,
} from '@/types/payment';

/**
 * Payments Service
 * Handles all payment-related API calls
 */
export const paymentsService = {
  /**
   * Initiate a payment (public endpoint)
   * Requires Idempotency-Key header
   */
  async initiatePayment(
    data: InitiatePaymentDto,
    idempotencyKey: string,
  ): Promise<PaymentResponse> {
    // Generate idempotency key if not provided (client-side)
    const response = await apiClient.post<PaymentResponse>(
      '/payments/initiate',
      data,
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      },
    );
    return response.data;
  },

  /**
   * Get payment status by external reference (public endpoint)
   */
  async getPaymentStatus(
    externalReference: string,
  ): Promise<PaymentStatusResponse> {
    const response = await apiClient.get<PaymentStatusResponse>(
      `/payments/status/${externalReference}`,
    );
    return response.data;
  },

  /**
   * Get payment by ID (protected endpoint - for authenticated users)
   */
  async getPaymentById(id: string): Promise<PaymentStatusResponse> {
    const response = await apiClient.get<PaymentStatusResponse>(
      `/payments/${id}`,
    );
    return response.data;
  },
};



