import { useQuery } from '@tanstack/react-query';
import { transactionsService } from '@/services/transactions/transactions.service';
import type { ListTransactionsDto } from '@/types/transaction';

/**
 * Get all transactions (with filters and pagination)
 */
export function useTransactions(params?: ListTransactionsDto) {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['transactions', params],
    queryFn: () => transactionsService.getAll(params),
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    transactions: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Get a single transaction by ID
 */
export function useTransaction(id: string) {
  const {
    data: transaction,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['transactions', id],
    queryFn: () => transactionsService.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    transaction,
    isLoading,
    error,
    refetch,
  };
}




