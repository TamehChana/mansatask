import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { paymentLinksService } from '@/services/payment-links/payment-links.service';
import type {
  CreatePaymentLinkDto,
  UpdatePaymentLinkDto,
} from '@/types/payment-link';

/**
 * Get all payment links
 */
export function usePaymentLinks() {
  const {
    data: paymentLinks,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['payment-links'],
    queryFn: () => paymentLinksService.getAll(),
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    paymentLinks: paymentLinks || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Get a single payment link by ID
 */
export function usePaymentLink(id: string) {
  const {
    data: paymentLink,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['payment-links', id],
    queryFn: () => paymentLinksService.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    paymentLink,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Get a payment link by slug (public)
 */
export function usePaymentLinkBySlug(slug: string) {
  const {
    data: paymentLink,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['payment-links', 'public', slug],
    queryFn: () => paymentLinksService.getBySlug(slug),
    enabled: !!slug,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    paymentLink,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Payment link mutations
 */
export function usePaymentLinkMutations() {
  const router = useRouter();
  const queryClient = useQueryClient();

  /**
   * Create payment link mutation
   */
  const createMutation = useMutation({
    mutationFn: (data: CreatePaymentLinkDto) =>
      paymentLinksService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-links'] });
      router.push('/payment-links');
    },
  });

  /**
   * Update payment link mutation
   */
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePaymentLinkDto;
    }) => paymentLinksService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payment-links'] });
      queryClient.invalidateQueries({
        queryKey: ['payment-links', variables.id],
      });
      router.push('/payment-links');
    },
  });

  /**
   * Delete payment link mutation
   */
  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentLinksService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-links'] });
    },
  });

  return {
    create: createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    delete: deleteMutation.mutate,
    deleteAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  };
}




