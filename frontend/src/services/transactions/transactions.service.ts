import apiClient from '@/lib/api-client';
import type {
  TransactionsResponse,
  Transaction,
  ListTransactionsDto,
} from '@/types/transaction';

/**
 * Transactions Service
 * Handles all transaction-related API calls
 */
export const transactionsService = {
  /**
   * Get all transactions for the authenticated user (with filters and pagination)
   */
  async getAll(
    params?: ListTransactionsDto,
  ): Promise<TransactionsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.provider) queryParams.append('provider', params.provider);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    const url = `/transactions${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get<TransactionsResponse>(url);
    return response.data;
  },

  /**
   * Get a single transaction by ID
   */
  async getById(id: string): Promise<Transaction> {
    const response = await apiClient.get<Transaction>(`/transactions/${id}`);
    return response.data;
  },
};



