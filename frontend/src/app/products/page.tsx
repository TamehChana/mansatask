'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useProducts, useProductMutations } from '@/hooks/products/useProducts';
import { ProductCard } from '@/components/products/ProductCard';
import { useState } from 'react';
import { BackButton } from '@/components/ui/BackButton';
import { getUserFriendlyErrorMessage } from '@/utils/error-messages';
import { useToast } from '@/components/ui/ToastProvider';

export default function ProductsPage() {
  const { products, isLoading, error } = useProducts();
  const { delete: deleteProduct, isDeleting } = useProductMutations();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteProduct(id);
      showToast('Product deleted successfully.', 'success');
    } catch (error) {
      showToast(getUserFriendlyErrorMessage(error), 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-surface border-b border-gray-200">
          <div className="max-w-content-lg mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <BackButton href="/dashboard" label="Back to Dashboard" />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4">
              <div>
                <h1 className="text-2xl sm:text-h1 text-text-primary">Products</h1>
                <p className="text-text-secondary mt-2 text-sm sm:text-body">Manage your product catalog</p>
              </div>
              <Link
                href="/products/create"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-primary text-white px-4 sm:px-6 py-3 rounded-button hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-medium transition-fast shadow-soft hover:shadow-soft-md text-sm sm:text-base"
              >
                + Create Product
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-content-lg mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12" aria-live="polite" aria-busy="true">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading products...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div 
              className="bg-red-50 border border-red-200 rounded-card p-4 mb-6"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-error"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-error mb-1">
                    Unable to load products
                  </h3>
                  <p className="text-sm text-red-700">
                    {getUserFriendlyErrorMessage(error)}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 text-sm font-medium text-red-800 hover:text-red-900 underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                    aria-label="Retry loading products"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && products.length === 0 && (
            <div className="text-center py-16">
              <div className="max-w-lg mx-auto">
                <div className="mb-6">
                  <svg
                    className="mx-auto h-20 w-20 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Build your product catalog
                </h2>
                <p className="text-sm text-gray-500 mb-2">
                  Create products to sell and link them to payment links for easy customer purchases.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Products can include images, descriptions, and pricing information.
                </p>
                <div className="text-left max-w-md mx-auto mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs font-medium text-blue-900 mb-1 flex items-center">
                    <svg
                      className="h-4 w-4 mr-1.5 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Quick tip
                  </p>
                  <p className="text-xs text-blue-700">
                    You can reuse products across multiple payment links, making it easy to sell the same item to different customers.
                  </p>
                </div>
                <Link
                  href="/products/create"
                  className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-fast"
                  aria-label="Create your first product"
                >
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create Your First Product
                </Link>
              </div>
            </div>
          )}

          {/* Products Grid */}
          {!isLoading && !error && products.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {products.map((product) => (
                <div key={product.id} className="relative group">
                  <ProductCard product={product} />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(product.id, product.name);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleDelete(product.id, product.name);
                        }
                      }}
                      disabled={deletingId === product.id || isDeleting}
                      className="bg-red-600 text-white p-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Delete product"
                      aria-label={`Delete product: ${product.name}`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}



