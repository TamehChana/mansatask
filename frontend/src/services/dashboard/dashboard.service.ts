import apiClient from '@/lib/api-client';

export interface DashboardStats {
  totalRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  cancelledTransactions: number;
  totalPaymentLinks: number;
  activePaymentLinks: number;
  totalProducts: number;
  recentTransactions: Array<{
    id: string;
    externalReference: string;
    status: string;
    provider: string;
    amount: number;
    customerName: string;
    customerPhone: string;
    customerEmail?: string | null;
    createdAt: string;
  }>;
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardStats;
}

/**
 * Dashboard service for fetching dashboard statistics
 */
export const dashboardService = {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardResponse> {
    const response = await apiClient.get<DashboardResponse>('/dashboard/stats');
    return response.data;
  },
};


