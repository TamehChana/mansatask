import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard/dashboard.service';
import type { DashboardStats } from '@/services/dashboard/dashboard.service';

/**
 * Dashboard Hook
 * Fetches dashboard statistics from the backend API
 */
export function useDashboard() {
  const {
    data: dashboardData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const response = await dashboardService.getDashboardStats();
      return response.data;
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
  });

  // Default values while loading
  const stats: DashboardStats = dashboardData || {
    totalRevenue: 0,
    totalTransactions: 0,
    successfulTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    cancelledTransactions: 0,
    totalPaymentLinks: 0,
    activePaymentLinks: 0,
    totalProducts: 0,
    recentTransactions: [],
  };

  const recentTransactions = stats.recentTransactions || [];

  return {
    stats,
    recentTransactions,
    isLoading,
    error,
  };
}


