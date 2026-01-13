'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Product } from '@/types/product';
import { useImageUpload } from '@/hooks/products/useImageUpload';
import { useToast } from '@/components/ui/ToastProvider';

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  price: z
    .number()
    .min(0.01, 'Price must be greater than 0')
    .max(999999999.99, 'Price is too large'),
  imageUrl: z.string().url().optional().or(z.literal('')),
  quantity: z
    .preprocess(
      (val) => {
        // Convert NaN, null, or empty string to undefined
        if (val === null || val === '' || (typeof val === 'number' && isNaN(val))) {
          return undefined;
        }
        return val;
      },
      z.number().int().min(0, 'Quantity must be 0 or greater').optional(),
    )
    .optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData) => void | Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

/**
 * Product Form Component
 * Reusable form for creating and editing products
 */
export function ProductForm({
  product,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save Product',
}: ProductFormProps) {
  const { uploadImage, isUploading } = useImageUpload();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    product?.imageUrl || null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
          defaultValues: product
            ? {
                name: product.name,
                description: product.description || '',
                price: Number(product.price),
                imageUrl: product.imageUrl || '',
                // If quantity is 999999 (unlimited), show as empty (undefined)
                quantity: product.quantity && product.quantity < 999999 ? product.quantity : undefined,
              }
            : undefined,
  });

  const imageUrl = watch('imageUrl');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.', 'error');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showToast('Image file size must be less than 5MB.', 'error');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    try {
      const result = await uploadImage(file);
      setValue('imageUrl', result.imageUrl);
      showToast('Image uploaded successfully.', 'success');
    } catch (error) {
      showToast('Failed to upload image. Please try again.', 'error');
      setSelectedFile(null);
      setPreviewUrl(product?.imageUrl || null);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setValue('imageUrl', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Image Upload Field */}
      <div>
        <label
          htmlFor="image"
          className="block text-small font-medium text-text-secondary mb-1"
        >
          Product Image (Optional)
        </label>
        <div className="mt-1">
          {previewUrl ? (
            <div className="relative">
              <div className="relative w-full h-48 rounded-card overflow-hidden border border-gray-200 bg-gray-50">
                <img
                  src={previewUrl}
                  alt="Product preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-error text-white rounded-full p-2 hover:bg-error-dark transition-fast shadow-soft"
                  aria-label="Remove image"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              {isUploading && (
                <div className="mt-2 text-small text-text-secondary">
                  Uploading image...
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-card bg-gray-50 hover:border-accent transition-fast cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="mt-2 text-small text-text-secondary">
                  <span className="font-medium text-accent">Click to upload</span> or drag and drop
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  PNG, JPG, GIF, WebP up to 5MB
                </p>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            id="image"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
        </div>
        {errors.imageUrl && (
          <p className="mt-1 text-small text-error">{errors.imageUrl.message}</p>
        )}
        <input type="hidden" {...register('imageUrl')} />
      </div>

      {/* Name Field */}
      <div>
        <label
          htmlFor="name"
          className="block text-small font-medium text-text-secondary mb-1"
        >
          Product Name <span className="text-error">*</span>
        </label>
        <input
          {...register('name')}
          id="name"
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-button shadow-soft focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-body"
          placeholder="Enter product name"
        />
        {errors.name && (
          <p className="mt-1 text-small text-error">{errors.name.message}</p>
        )}
      </div>

      {/* Description Field */}
      <div>
        <label
          htmlFor="description"
          className="block text-small font-medium text-text-secondary mb-1"
        >
          Description (Optional)
        </label>
        <textarea
          {...register('description')}
          id="description"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-button shadow-soft focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-body"
          placeholder="Enter product description"
        />
        {errors.description && (
          <p className="mt-1 text-small text-error">{errors.description.message}</p>
        )}
      </div>

      {/* Price Field */}
      <div>
        <label
          htmlFor="price"
          className="block text-small font-medium text-text-secondary mb-1"
        >
          Price (CFA) <span className="text-error">*</span>
        </label>
        <div className="relative">
          <input
            {...register('price', { valueAsNumber: true })}
            id="price"
            type="number"
            step="0.01"
            min="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-button shadow-soft focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-body"
            placeholder="0.00"
          />
        </div>
        {errors.price && (
          <p className="mt-1 text-small text-error">{errors.price.message}</p>
        )}
        <p className="mt-1 text-xs text-text-secondary">
          Amount in CFA (West African CFA Franc)
        </p>
      </div>

      {/* Quantity Field */}
      <div>
        <label
          htmlFor="quantity"
          className="block text-small font-medium text-text-secondary mb-1"
        >
          Available Units (Optional)
        </label>
        <div className="relative">
          <input
            {...register('quantity', { valueAsNumber: true })}
            id="quantity"
            type="number"
            step="1"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-button shadow-soft focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-body"
            placeholder="Leave empty for unlimited"
          />
        </div>
        {errors.quantity && (
          <p className="mt-1 text-small text-error">{errors.quantity.message}</p>
        )}
        <p className="mt-1 text-xs text-text-secondary">
          Number of units available for purchase. Leave empty for unlimited stock. Set to 0 for out of stock.
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-primary text-white py-2 px-4 rounded-button hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-fast shadow-soft hover:shadow-soft-md"
        >
          {isLoading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}



