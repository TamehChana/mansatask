'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { PaymentLink } from '@/types/payment-link';
import { useProducts } from '@/hooks/products/useProducts';

const paymentLinkSchema = z
  .object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    description: z.string().optional(),
    amount: z
      .number()
      .min(0.01, 'Amount must be greater than 0')
      .max(999999999.99, 'Amount is too large'),
    productId: z.string().uuid('Invalid product ID').optional().or(z.literal('')),
    expiresAfterDays: z
      .number()
      .min(1, 'Expires after days must be at least 1')
      .max(365, 'Expires after days cannot exceed 365')
      .optional()
      .or(z.literal(undefined)),
    expiresAt: z.string().optional().or(z.literal('')),
    maxUses: z
      .number()
      .min(1, 'Max uses must be at least 1')
      .optional()
      .or(z.literal(undefined)),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => !data.expiresAfterDays || !data.expiresAt,
    {
      message: 'Cannot specify both expires after days and expires at',
      path: ['expiresAt'],
    },
  );

type PaymentLinkFormData = z.infer<typeof paymentLinkSchema>;

interface PaymentLinkFormProps {
  paymentLink?: PaymentLink;
  onSubmit: (data: PaymentLinkFormData) => void | Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

/**
 * Payment Link Form Component
 * Reusable form for creating and editing payment links
 */
export function PaymentLinkForm({
  paymentLink,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save Payment Link',
}: PaymentLinkFormProps) {
  const { products, isLoading: isLoadingProducts } = useProducts();
  const [expirationType, setExpirationType] = useState<'none' | 'days' | 'date'>(
    paymentLink?.expiresAfterDays
      ? 'days'
      : paymentLink?.expiresAt
        ? 'date'
        : 'none',
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PaymentLinkFormData>({
    resolver: zodResolver(paymentLinkSchema),
    defaultValues: paymentLink
      ? {
          title: paymentLink.title,
          description: paymentLink.description || '',
          amount: Number(paymentLink.amount),
          productId: paymentLink.productId || '',
          expiresAfterDays: paymentLink.expiresAfterDays || undefined,
          expiresAt: paymentLink.expiresAt
            ? new Date(paymentLink.expiresAt).toISOString().split('T')[0]
            : '',
          maxUses: paymentLink.maxUses || undefined,
          isActive: paymentLink.isActive ?? true,
        }
      : {
          isActive: true,
        },
  });

  const selectedProductId = watch('productId');
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Auto-fill amount from product
  const handleProductChange = (productId: string) => {
    setValue('productId', productId || '');
    if (productId) {
      const product = products.find((p) => p.id === productId);
      if (product) {
        setValue('amount', Number(product.price));
      }
    }
  };

  // Handle expiration type change
  const handleExpirationTypeChange = (type: 'none' | 'days' | 'date') => {
    setExpirationType(type);
    if (type === 'none') {
      setValue('expiresAfterDays', undefined);
      setValue('expiresAt', '');
    } else if (type === 'days') {
      setValue('expiresAt', '');
    } else if (type === 'date') {
      setValue('expiresAfterDays', undefined);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title Field */}
      <div>
        <label
          htmlFor="title"
          className="block text-small font-medium text-text-secondary mb-1"
        >
          Title <span className="text-error">*</span>
        </label>
        <input
          {...register('title')}
          id="title"
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-button shadow-soft focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-body"
          placeholder="Enter payment link title"
        />
        {errors.title && (
          <p className="mt-1 text-small text-error">{errors.title.message}</p>
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
          placeholder="Enter payment link description"
        />
        {errors.description && (
          <p className="mt-1 text-small text-error">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Product Selection (Optional) */}
      <div>
        <label
          htmlFor="productId"
          className="block text-small font-medium text-text-secondary mb-1"
        >
          Link to Product (Optional)
        </label>
        <select
          {...register('productId')}
          id="productId"
          onChange={(e) => handleProductChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-button shadow-soft focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-body"
          disabled={isLoadingProducts}
        >
          <option value="">No product (standalone payment link)</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} - {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(Number(product.price))}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-text-secondary">
          Select a product to link this payment link to (optional)
        </p>
      </div>

      {/* Amount Field */}
      <div>
        <label
          htmlFor="amount"
          className="block text-small font-medium text-text-secondary mb-1"
        >
          Amount (CFA) <span className="text-error">*</span>
        </label>
        <input
          {...register('amount', { valueAsNumber: true })}
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          className="w-full px-3 py-2 border border-gray-300 rounded-button shadow-soft focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-body"
          placeholder="0.00"
        />
        {errors.amount && (
          <p className="mt-1 text-small text-error">{errors.amount.message}</p>
        )}
        <p className="mt-1 text-xs text-text-secondary">
          Amount in CFA (West African CFA Franc)
        </p>
        {selectedProduct && (
          <p className="mt-1 text-xs text-accent">
            Amount auto-filled from selected product
          </p>
        )}
      </div>

      {/* Expiration Options */}
      <div>
        <label className="block text-small font-medium text-text-secondary mb-2">
          Expiration (Optional)
        </label>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                checked={expirationType === 'none'}
                onChange={() => handleExpirationTypeChange('none')}
                className="mr-2"
              />
              <span className="text-small text-text-primary">No expiration</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={expirationType === 'days'}
                onChange={() => handleExpirationTypeChange('days')}
                className="mr-2"
              />
              <span className="text-small text-text-primary">Expires after days</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={expirationType === 'date'}
                onChange={() => handleExpirationTypeChange('date')}
                className="mr-2"
              />
              <span className="text-small text-text-primary">Expires at date</span>
            </label>
          </div>

          {expirationType === 'days' && (
            <div>
              <input
                {...register('expiresAfterDays', { valueAsNumber: true })}
                type="number"
                min="1"
                max="365"
                className="w-full px-3 py-2 border border-gray-300 rounded-button shadow-soft focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-body"
                placeholder="Number of days (1-365)"
              />
              {errors.expiresAfterDays && (
                <p className="mt-1 text-small text-error">
                  {errors.expiresAfterDays.message}
                </p>
              )}
            </div>
          )}

          {expirationType === 'date' && (
            <div>
              <input
                {...register('expiresAt')}
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-button shadow-soft focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-body"
              />
              {errors.expiresAt && (
                <p className="mt-1 text-small text-error">
                  {errors.expiresAt.message}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Max Uses Field */}
      <div>
        <label
          htmlFor="maxUses"
          className="block text-small font-medium text-text-secondary mb-1"
        >
          Max Uses (Optional)
        </label>
        <input
          {...register('maxUses', { valueAsNumber: true })}
          id="maxUses"
          type="number"
          min="1"
          className="w-full px-3 py-2 border border-gray-300 rounded-button shadow-soft focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-body"
          placeholder="Maximum number of times link can be used"
        />
        {errors.maxUses && (
          <p className="mt-1 text-small text-error">{errors.maxUses.message}</p>
        )}
        <p className="mt-1 text-xs text-text-secondary">
          Maximum number of times this payment link can be used (leave empty
          for unlimited)
        </p>
      </div>

      {/* Active Status */}
      <div>
        <label className="flex items-center">
          <input
            {...register('isActive')}
            type="checkbox"
            className="mr-2"
          />
          <span className="text-small font-medium text-text-primary">Active</span>
        </label>
        <p className="mt-1 text-xs text-text-secondary">
          Only active payment links can accept payments
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



