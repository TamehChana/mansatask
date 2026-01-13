'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useProduct, useProductMutations } from '@/hooks/products/useProducts';
import { BackButton } from '@/components/ui/BackButton';
import { getUserFriendlyErrorMessage } from '@/utils/error-messages';
import { useToast } from '@/components/ui/ToastProvider';

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const { product, isLoading, error } = useProduct(id);
  const { delete: deleteProduct, isDeleting } = useProductMutations();
  const { showToast } = useToast();

  const handleDelete = async () => {
    if (!product) return;
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      await deleteProduct(id);
      showToast('Product deleted successfully.', 'success');
      router.push('/products');
    } catch (error) {
      showToast(getUserFriendlyErrorMessage(error), 'error');
    }
  };

  const formattedPrice = product
    ? new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF', // CFA Franc
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number(product.price))
    : '';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-surface border-b border-gray-200">
          <div className="max-w-content mx-auto px-6 py-8">
            <BackButton href="/products" label="Back to Products" className="text-text-secondary hover:text-text-primary" />
            <div className="flex justify-between items-center mt-4">
              <div>
                <h1 className="text-h1 text-text-primary">Product Details</h1>
                <p className="text-text-secondary mt-2 text-body">View and manage your product</p>
              </div>
              {product && (
                <div className="flex gap-2">
                  <Link
                    href={`/products/${id}/edit`}
                    className="bg-primary text-white px-4 py-2 rounded-button hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-medium transition-fast shadow-soft hover:shadow-soft-md"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-error text-white px-4 py-2 rounded-button hover:bg-error-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-fast shadow-soft"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-content mx-auto px-6 py-8">
          <div className="bg-surface rounded-card shadow-soft p-8 border border-gray-100">
            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <p className="text-text-secondary">Loading product...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <div className="rounded-md bg-error-red/10 border border-error-red/20 p-4 text-error-red">
                  <p className="text-small">
                    {getUserFriendlyErrorMessage(error)}
                  </p>
                </div>
                <Link
                  href="/products"
                  className="mt-4 inline-block text-accent hover:text-accent-dark"
                >
                  ← Back to Products
                </Link>
              </div>
            )}

            {/* Product Details */}
            {product && !isLoading && !error && (
              <div className="space-y-6">
                {/* Product Image */}
                {product.imageUrl && (() => {
                  // Extract key from S3 URL if it's an S3 URL
                  let imageSrc = product.imageUrl;
                  if (product.imageUrl.startsWith('https://') && product.imageUrl.includes('.s3.')) {
                    const keyMatch = product.imageUrl.match(/\.amazonaws\.com\/(.+)$/);
                    if (keyMatch && keyMatch[1]) {
                      const apiBaseUrl = typeof window !== 'undefined' 
                        ? (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
                            ? 'http://localhost:3000/api'
                            : `${window.location.protocol}//${window.location.hostname}:3000/api`)
                        : '/api';
                      imageSrc = `${apiBaseUrl}/products/image/${keyMatch[1]}`;
                    }
                  } else if (!product.imageUrl.startsWith('http://') && !product.imageUrl.startsWith('https://')) {
                    imageSrc = `${typeof window !== 'undefined' ? window.location.origin : ''}${product.imageUrl}`;
                  }
                  
                  return (
                    <div className="w-full">
                      <img
                        src={imageSrc}
                        alt={product.name}
                        className="w-full h-auto max-h-96 object-contain rounded-card border border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  );
                })()}

                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-h2 text-text-primary">
                      {product.name}
                    </h2>
                    {(() => {
                      // Treat very high numbers (999999) as unlimited stock
                      const isUnlimited = product.quantity >= 999999;
                      const displayQuantity = isUnlimited ? null : product.quantity;
                      
                      if (displayQuantity === null || displayQuantity === undefined) {
                        return null; // Don't show badge for unlimited stock
                      }
                      
                      return (
                        <span className={`inline-flex items-center px-3 py-1 rounded text-small font-medium ${
                          displayQuantity === 0
                            ? 'bg-error-red/10 text-error-red'
                            : displayQuantity > 0 && displayQuantity <= 5
                              ? 'bg-warning-amber/10 text-warning-amber'
                              : 'bg-success-green/10 text-success-green'
                        }`}>
                          {displayQuantity === 0
                            ? 'Out of Stock'
                            : `${displayQuantity} ${displayQuantity === 1 ? 'unit' : 'units'} available`}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-2xl font-semibold text-accent">
                    {formattedPrice}
                  </p>
                </div>

                {product.description && (
                  <div>
                    <h3 className="text-small font-medium text-text-secondary mb-2">
                      Description
                    </h3>
                    <p className="text-text-primary whitespace-pre-wrap">
                      {product.description}
                    </p>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-6">
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-small font-medium text-text-secondary">
                        Created At
                      </dt>
                      <dd className="mt-1 text-small text-text-primary">
                        {new Date(product.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-small font-medium text-text-secondary">
                        Last Updated
                      </dt>
                      <dd className="mt-1 text-small text-text-primary">
                        {new Date(product.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

