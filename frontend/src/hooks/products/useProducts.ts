import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { productsService } from '@/services/products/products.service';
import type { CreateProductDto, UpdateProductDto } from '@/types/product';

/**
 * Get all products
 */
export function useProducts() {
  const {
    data: products,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsService.getAll(),
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    products: products || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Get a single product by ID
 */
export function useProduct(id: string) {
  const {
    data: product,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['products', id],
    queryFn: () => productsService.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    product,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Product mutations
 */
export function useProductMutations() {
  const router = useRouter();
  const queryClient = useQueryClient();

  /**
   * Create product mutation
   */
  const createMutation = useMutation({
    mutationFn: (data: CreateProductDto) => productsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      router.push('/products');
    },
  });

  /**
   * Update product mutation
   */
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductDto }) =>
      productsService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', variables.id] });
      router.push('/products');
    },
  });

  /**
   * Delete product mutation
   */
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
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



