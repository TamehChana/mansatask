/**
 * Utility function to get the correct image URL for product images
 * Always uses the backend proxy endpoint to retrieve images from S3 or local storage
 * This avoids CORS and ORB (Opaque Response Blocking) issues
 */

/**
 * Get the API base URL - always returns a valid URL
 */
function getApiBaseUrl(): string {
  // Hardcoded production backend URL as primary fallback
  const PRODUCTION_API_URL = 'https://payment-link-backend.onrender.com/api';
  
  // Check environment variable (may be undefined if not set at build time)
  const envApiUrl = typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : null;
  
  if (typeof window !== 'undefined') {
    // Client-side: Use environment variable if available
    if (envApiUrl && envApiUrl.trim() !== '') {
      return envApiUrl;
    }
    
    // Fallback: Use localhost for development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000/api';
    }
    
    // Production fallback: Always use hardcoded backend URL
    return PRODUCTION_API_URL;
  }
  
  // Server-side: Use environment variable or production URL
  return envApiUrl && envApiUrl.trim() !== '' ? envApiUrl : PRODUCTION_API_URL;
}

/**
 * Get the correct image URL for displaying product images
 * Always routes through backend proxy to avoid CORS/ORB issues
 * @param imageUrl - The image URL from the database (S3 URL, local path, or storage key)
 * @returns The URL to use for the <img> src attribute (always through backend proxy)
 */
export function getProductImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl || typeof imageUrl !== 'string') return null;

  const apiBaseUrl = getApiBaseUrl();
  
  // Ensure apiBaseUrl is never empty
  if (!apiBaseUrl || apiBaseUrl.trim() === '') {
    console.error('API base URL is empty, using fallback');
    // Final fallback
    const fallbackUrl = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:3000/api'
      : 'https://payment-link-backend.onrender.com/api';
    
    // Continue with fallback
    const key = extractStorageKey(imageUrl);
    return key ? `${fallbackUrl}/products/image/${encodeURIComponent(key)}` : null;
  }

  // Extract storage key from any format
  const key = extractStorageKey(imageUrl);
  if (!key) {
    console.error('Could not extract storage key from imageUrl:', imageUrl);
    return null;
  }

  // Always use backend proxy endpoint
  return `${apiBaseUrl}/products/image/${encodeURIComponent(key)}`;
}

/**
 * Extract storage key from various image URL formats
 */
function extractStorageKey(imageUrl: string): string | null {
  if (!imageUrl) return null;

  // Handle S3 URLs: https://bucket.s3.region.amazonaws.com/products/userId/timestamp.ext
  if (imageUrl.startsWith('https://') && imageUrl.includes('.s3.')) {
    // Try pattern 1: https://bucket.s3.region.amazonaws.com/key
    const pattern1Match = imageUrl.match(/\.amazonaws\.com\/(.+)$/);
    if (pattern1Match && pattern1Match[1]) {
      try {
        return decodeURIComponent(pattern1Match[1]);
      } catch (e) {
        return pattern1Match[1];
      }
    }
    
    // Try pattern 2: https://s3.region.amazonaws.com/bucket/key
    const pattern2Match = imageUrl.match(/amazonaws\.com\/[^\/]+\/(.+)$/);
    if (pattern2Match && pattern2Match[1]) {
      try {
        return decodeURIComponent(pattern2Match[1]);
      } catch (e) {
        return pattern2Match[1];
      }
    }
    
    // If we can't extract, return null (shouldn't happen)
    return null;
  }

  // Handle local storage paths: /uploads/products/userId/timestamp.ext
  if (imageUrl.startsWith('/uploads/')) {
    return imageUrl.replace(/^\/uploads\//, '');
  }
  
  if (imageUrl.startsWith('uploads/')) {
    return imageUrl.replace(/^uploads\//, '');
  }

  // If it's just a storage key (starts with products/), use it directly
  if (imageUrl.startsWith('products/')) {
    return imageUrl;
  }

  // If it's already a full HTTP/HTTPS URL (non-S3), we can't extract key
  // This shouldn't happen if images are stored in S3 or local storage
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    console.warn('Unexpected image URL format (full HTTP URL):', imageUrl);
    // Try to extract path from URL
    try {
      const url = new URL(imageUrl);
      const path = url.pathname;
      // Remove leading slash if present
      return path.startsWith('/') ? path.slice(1) : path;
    } catch (e) {
      // If URL parsing fails, return as-is (might be a storage key)
      return imageUrl;
    }
  }

  // Default: assume it's a storage key
  return imageUrl;
}
