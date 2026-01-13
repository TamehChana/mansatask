'use client';

import Link from 'next/link';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string | null;
    price: string;
    imageUrl?: string | null;
    quantity: number;
  };
}

/**
 * Product Card Component
 * Displays a single product in a card format
 */
export function ProductCard({ product }: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF', // CFA Franc
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(product.price));

  // Get image URL - handle both S3 URLs and local paths
  // If S3 URL fails, fallback to proxy endpoint
  const getImageUrl = () => {
    if (!product.imageUrl) return null;
    
    // Extract key from S3 URL if it's an S3 URL
    // Format: https://bucket.s3.region.amazonaws.com/products/userId/timestamp-random.ext
    if (product.imageUrl.startsWith('https://') && product.imageUrl.includes('.s3.')) {
      // Extract the key part (everything after .amazonaws.com/)
      const keyMatch = product.imageUrl.match(/\.amazonaws\.com\/(.+)$/);
      if (keyMatch && keyMatch[1]) {
        // Use proxy endpoint as primary (more reliable)
        const apiBaseUrl = typeof window !== 'undefined' 
          ? (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
              ? 'http://localhost:3000/api'
              : `${window.location.protocol}//${window.location.hostname}:3000/api`)
          : '/api';
        return `${apiBaseUrl}/products/image/${keyMatch[1]}`;
      }
      // Fallback to direct S3 URL if we can't extract key
      return product.imageUrl;
    }
    
    // If it's already a full URL (non-S3), return as is
    if (product.imageUrl.startsWith('http://') || product.imageUrl.startsWith('https://')) {
      return product.imageUrl;
    }
    
    // If it's a local path, construct full URL
    if (product.imageUrl.startsWith('/uploads/')) {
      return `${typeof window !== 'undefined' ? window.location.origin : ''}${product.imageUrl}`;
    }
    return product.imageUrl;
  };

  const imageUrl = getImageUrl();

  return (
    <Link
      href={`/products/${product.id}`}
      className="block bg-surface rounded-card shadow-soft hover:shadow-soft-md transition-fast border border-gray-100 hover-lift overflow-hidden"
    >
      {/* Product Image */}
      {imageUrl ? (
        <div className="w-full h-48 bg-gray-100 overflow-hidden">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide image if it fails to load
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
          <svg
            className="w-16 h-16 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-text-primary">{product.name}</h3>
          <span className="text-xl font-semibold text-accent">{formattedPrice}</span>
        </div>
        {product.description && (
          <p className="text-small text-text-secondary line-clamp-2 mb-4">{product.description}</p>
        )}
        <div className="mb-4">
          {(() => {
            // Treat very high numbers (999999) as unlimited stock
            const isUnlimited = product.quantity >= 999999;
            const displayQuantity = isUnlimited ? null : product.quantity;
            
            if (displayQuantity === null || displayQuantity === undefined) {
              return null; // Don't show badge for unlimited stock
            }
            
            return (
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
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
        <div className="mt-4 pt-4 border-t border-gray-200">
          <span className="text-small text-accent hover:text-accent-dark font-medium inline-flex items-center">
            View details
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}



