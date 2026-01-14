import apiClient from '@/lib/api-client';
import type {
  PaymentLink,
  CreatePaymentLinkDto,
  UpdatePaymentLinkDto,
} from '@/types/payment-link';

/**
 * Payment Links Service
 * Handles all payment link-related API calls
 */
export const paymentLinksService = {
  /**
   * Get all payment links for the authenticated user
   */
  async getAll(): Promise<PaymentLink[]> {
    const response = await apiClient.get<PaymentLink[]>('/payment-links');
    return response.data;
  },

  /**
   * Get a single payment link by ID
   */
  async getById(id: string): Promise<PaymentLink> {
    const response = await apiClient.get<PaymentLink>(`/payment-links/${id}`);
    return response.data;
  },

  /**
   * Get a payment link by slug (public)
   */
  async getBySlug(slug: string): Promise<PaymentLink> {
    const response = await apiClient.get<PaymentLink>(
      `/payment-links/public/${slug}`,
    );
    return response.data;
  },

  /**
   * Create a new payment link
   */
  async create(data: CreatePaymentLinkDto): Promise<PaymentLink> {
    const response = await apiClient.post<PaymentLink>('/payment-links', data);
    return response.data;
  },

  /**
   * Update a payment link
   */
  async update(
    id: string,
    data: UpdatePaymentLinkDto,
  ): Promise<PaymentLink> {
    const response = await apiClient.patch<PaymentLink>(
      `/payment-links/${id}`,
      data,
    );
    return response.data;
  },

  /**
   * Delete a payment link (soft delete)
   */
  async delete(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/payment-links/${id}`,
    );
    return response.data;
  },
};




