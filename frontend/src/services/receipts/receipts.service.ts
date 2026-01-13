import apiClient from '@/lib/api-client';
import type { Receipt, ReceiptResponse } from '@/types/receipt';

/**
 * Receipt service for managing receipts
 */
export const receiptsService = {
  /**
   * Generate receipt for a transaction
   */
  async generateReceipt(transactionId: string): Promise<ReceiptResponse> {
    const response = await apiClient.post<ReceiptResponse>(
      `/receipts/generate/${transactionId}`,
    );
    return response.data;
  },

  /**
   * Get receipt by transaction ID
   */
  async getReceipt(transactionId: string): Promise<ReceiptResponse> {
    const response = await apiClient.get<ReceiptResponse>(
      `/receipts/${transactionId}`,
    );
    return response.data;
  },

  /**
   * Download receipt PDF (authenticated)
   */
  async downloadReceipt(transactionId: string): Promise<Blob> {
    const response = await apiClient.get(`/receipts/${transactionId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Download receipt PDF by external reference (public)
   */
  async downloadReceiptByExternalReference(
    externalReference: string,
  ): Promise<Blob> {
    const response = await apiClient.get(
      `/receipts/public/${externalReference}/download`,
      {
        responseType: 'blob',
      },
    );
    return response.data;
  },
};
