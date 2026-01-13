'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { PaymentProvider } from '@/types/payment';

const paymentSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerPhone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(
      /^(\+237|0)[0-9]{9}$/,
      'Phone number must be in Cameroon format (+237XXXXXXXXX or 0XXXXXXXXX)',
    ),
  customerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  paymentProvider: z.enum(['MTN', 'VODAFONE', 'AIRTELTIGO'], {
    errorMap: () => ({ message: 'Please select a payment provider' }),
  }),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  onSubmit: (data: PaymentFormData) => void | Promise<void>;
  isLoading?: boolean;
  error?: unknown;
}

/**
 * Payment Form Component
 * Form for customers to enter payment details
 */
export function PaymentForm({
  onSubmit,
  isLoading = false,
  error,
}: PaymentFormProps) {
  const [showError, setShowError] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
  });

  const handleFormSubmit = async (data: PaymentFormData) => {
    setShowError(false);
    try {
      await onSubmit({
        ...data,
        customerEmail: data.customerEmail || undefined,
      });
    } catch (error) {
      setShowError(true);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Error Message */}
      {(showError || error) && (
        <div className="rounded-md bg-red-50 p-4">
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
                {error instanceof Error
                  ? error.message
                  : 'Failed to initiate payment. Please try again.'}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Customer Name Field */}
      <div>
        <label
          htmlFor="customerName"
          className="block text-small font-medium text-text-secondary mb-1"
        >
          Full Name <span className="text-error">*</span>
        </label>
        <input
          {...register('customerName')}
          id="customerName"
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-button shadow-soft focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-body"
          placeholder="Enter your full name"
        />
        {errors.customerName && (
          <p className="mt-1 text-small text-error">
            {errors.customerName.message}
          </p>
        )}
      </div>

      {/* Customer Phone Field */}
      <div>
        <label
          htmlFor="customerPhone"
          className="block text-small font-medium text-text-secondary mb-1"
        >
          Phone Number <span className="text-error">*</span>
        </label>
        <input
          {...register('customerPhone')}
          id="customerPhone"
          type="tel"
          className="w-full px-3 py-2 border border-gray-300 rounded-button shadow-soft focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-body"
          placeholder="+237XXXXXXXXX or 0XXXXXXXXX"
        />
        {errors.customerPhone && (
          <p className="mt-1 text-small text-error">
            {errors.customerPhone.message}
          </p>
        )}
        <p className="mt-1 text-xs text-text-secondary">
          Enter your mobile money number (Cameroon format)
        </p>
      </div>

      {/* Customer Email Field (Optional) */}
      <div>
        <label
          htmlFor="customerEmail"
          className="block text-small font-medium text-text-secondary mb-1"
        >
          Email Address (Optional)
        </label>
        <input
          {...register('customerEmail')}
          id="customerEmail"
          type="email"
          className="w-full px-3 py-2 border border-gray-300 rounded-button shadow-soft focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-body"
          placeholder="you@example.com"
        />
        {errors.customerEmail && (
          <p className="mt-1 text-small text-error">
            {errors.customerEmail.message}
          </p>
        )}
        <p className="mt-1 text-xs text-text-secondary">
          We'll send you a receipt if provided
        </p>
      </div>

      {/* Payment Provider Selection */}
      <div>
        <label
          htmlFor="paymentProvider"
          className="block text-small font-medium text-text-secondary mb-1"
        >
          Payment Provider <span className="text-error">*</span>
        </label>
        <select
          {...register('paymentProvider')}
          id="paymentProvider"
          className="w-full px-3 py-2 border border-gray-300 rounded-button shadow-soft focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-body"
        >
          <option value="">Select payment provider</option>
          <option value="MTN">MTN Mobile Money</option>
          <option value="VODAFONE">Vodafone Cash</option>
          <option value="AIRTELTIGO">AirtelTigo Money</option>
        </select>
        {errors.paymentProvider && (
          <p className="mt-1 text-small text-error">
            {errors.paymentProvider.message}
          </p>
        )}
        <p className="mt-1 text-xs text-text-secondary">
          Select your mobile money provider
        </p>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white py-3 px-4 rounded-button hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed font-medium text-body transition-fast shadow-soft hover:shadow-soft-md"
        >
          {isLoading ? 'Processing Payment...' : 'Pay Now'}
        </button>
      </div>
    </form>
  );
}

