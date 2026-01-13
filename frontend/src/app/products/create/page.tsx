'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ProductForm } from '@/components/products/ProductForm';
import { useProductMutations } from '@/hooks/products/useProducts';
import type { CreateProductDto } from '@/types/product';
import { BackButton } from '@/components/ui/BackButton';
import { getUserFriendlyErrorMessage } from '@/utils/error-messages';

export default function CreateProductPage() {
  const router = useRouter();
  const { create, isCreating, createError } = useProductMutations();

  const handleSubmit = async (data: CreateProductDto & { imageUrl?: string }) => {
    try {
      const submitData: CreateProductDto = {
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl || undefined,
        quantity: data.quantity !== undefined ? data.quantity : undefined,
      };
      await create(submitData);
      router.push('/products');
    } catch (error) {
      // Error is handled by the mutation and will be shown via createError
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-surface border-b border-gray-200">
          <div className="max-w-content mx-auto px-6 py-8">
            <BackButton href="/products" label="Back to Products" className="text-text-secondary hover:text-text-primary" />
            <h1 className="text-h1 text-text-primary mt-4">Create Product</h1>
            <p className="text-text-secondary mt-2 text-body">Add a new product to your catalog</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-content mx-auto px-6 py-8">
          <div className="bg-surface rounded-card shadow-soft p-8 border border-gray-100">
            {/* Error Message */}
            {createError && (
              <div className="mb-6 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {getUserFriendlyErrorMessage(createError)}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <ProductForm
              onSubmit={handleSubmit}
              isLoading={isCreating}
              submitLabel="Create Product"
            />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}



