/**
 * Utility function to get the correct image URL for product images
 * Handles S3 URLs, local storage paths, and constructs API proxy URLs
 */

/**
 * Get the API base URL from environment
 * Uses the same pattern as api-client.ts for consistency
 */
function getApiBaseUrl(): string {
  // Use NEXT_PUBLIC_API_URL if available (same pattern as api-client.ts)
  // This should be set to the full backend URL including /api (e.g., https://backend.onrender.com/api)
  return process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' 
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : '/api')
    : '/api');
}

/**
 * Get the correct image URL for displaying product images
 * @param imageUrl - The image URL from the database (could be S3 URL, local path, etc.)
 * @returns The URL to use for the <img> src attribute
 */
export function getProductImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;

  const apiBaseUrl = getApiBaseUrl();

  // Handle S3 URLs - extract key and use API proxy
  // Format examples:
  // - https://bucket.s3.region.amazonaws.com/products/userId/timestamp-random.ext
  // - https://s3.region.amazonaws.com/bucket/products/userId/timestamp-random.ext
  if (imageUrl.startsWith('https://') && imageUrl.includes('.s3.')) {
    let key: string | null = null;

    // Try pattern 1: https://bucket.s3.region.amazonaws.com/key
    const pattern1Match = imageUrl.match(/\.amazonaws\.com\/(.+)$/);
    if (pattern1Match && pattern1Match[1]) {
      key = pattern1Match[1];
    } else {
      // Try pattern 2: https://s3.region.amazonaws.com/bucket/key
      const pattern2Match = imageUrl.match(/amazonaws\.com\/[^\/]+\/(.+)$/);
      if (pattern2Match && pattern2Match[1]) {
        key = pattern2Match[1];
      }
    }

    if (key) {
      // Decode URL-encoded key if needed (S3 URLs are sometimes encoded)
      try {
        key = decodeURIComponent(key);
      } catch (e) {
        // If decoding fails, use original key
      }
      // Use API proxy endpoint (more reliable, handles authentication if needed)
      return `${apiBaseUrl}/products/image/${encodeURIComponent(key)}`;
    }

    // Fallback to direct S3 URL if we can't extract key
    return imageUrl;
  }

  // If it's already a full HTTP/HTTPS URL (non-S3), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Handle local storage paths
  // If it starts with /uploads/ or uploads/, extract the path
  if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('uploads/')) {
    const path = imageUrl.replace(/^\/?uploads\//, '');
    return `${apiBaseUrl}/products/image/${encodeURIComponent(path)}`;
  }

  // If it looks like a storage key (starts with products/), use API proxy
  if (imageUrl.startsWith('products/')) {
    return `${apiBaseUrl}/products/image/${encodeURIComponent(imageUrl)}`;
  }

  // Default: assume it's a storage key and use API proxy
  return `${apiBaseUrl}/products/image/${encodeURIComponent(imageUrl)}`;
}

