import { useMutation, useQuery } from '@tanstack/react-query';
import { paymentsService } from '@/services/payments/payments.service';
import type { InitiatePaymentDto } from '@/types/payment';
import { TransactionStatus } from '@/types/payment';

// Generate idempotency key for payment requests
function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Initiate payment mutation
 */
export function useInitiatePayment() {
  const mutation = useMutation({
    mutationFn: ({
      data,
      idempotencyKey,
    }: {
      data: InitiatePaymentDto;
      idempotencyKey: string;
    }) => paymentsService.initiatePayment(data, idempotencyKey),
  });

  return {
    initiatePayment: (data: InitiatePaymentDto) => {
      // Generate idempotency key on the client side
      const idempotencyKey = generateIdempotencyKey();
      return mutation.mutateAsync({ data, idempotencyKey });
    },
    isPending: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
  };
}

/**
 * Get payment status by external reference (public)
 */
export function usePaymentStatus(externalReference: string | null) {
  const {
    data: paymentStatus,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['payment-status', externalReference],
    queryFn: () => paymentsService.getPaymentStatus(externalReference!),
    enabled: !!externalReference,
    refetchInterval: (query) => {
      // Poll every 3 seconds if status is PENDING or PROCESSING
      const status = query.state.data?.status;
      if (
        status === TransactionStatus.PENDING ||
        status === TransactionStatus.PROCESSING
      ) {
        return 3000; // 3 seconds
      }
      return false; // Stop polling if final status
    },
    staleTime: 1000, // 1 second
  });

  return {
    paymentStatus,
    isLoading,
    error,
    refetch,
  };
}

