import { useMutation } from '@tanstack/react-query';
import { productsService } from '@/services/products/products.service';
import type { ImageUploadResponse } from '@/types/product';

/**
 * Hook for uploading product images
 */
export function useImageUpload() {
  const mutation = useMutation({
    mutationFn: (file: File) => productsService.uploadImage(file),
  });

  return {
    uploadImage: mutation.mutateAsync,
    isUploading: mutation.isPending,
    uploadError: mutation.error,
    uploadSuccess: mutation.isSuccess,
  };
}


