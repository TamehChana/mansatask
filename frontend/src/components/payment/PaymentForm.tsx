'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PaymentProvider } from '@/types/payment';

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
  paymentProvider: z.nativeEnum(PaymentProvider, {
    message: 'Please select a payment provider',
  }),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

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
    defaultValues: {
      paymentProvider: PaymentProvider.MTN,
    },
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
      {(showError || !!error) && (
        <div 
          className="rounded-md bg-red-50 border border-red-200 p-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
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
              <h3 className="text-sm font-medium text-red-800 mb-1">
                Payment Failed
              </h3>
              <p className="text-sm text-red-700">
                {error instanceof Error
                  ? error.message
                  : 'Failed to initiate payment. Please check your details and try again.'}
              </p>
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
          Full Name <span className="text-error" aria-label="required">*</span>
        </label>
        <input
          {...register('customerName')}
          id="customerName"
          type="text"
          aria-required="true"
          aria-invalid={errors.customerName ? 'true' : 'false'}
          aria-describedby={errors.customerName ? 'customerName-error' : 'customerName-hint'}
          className="w-full px-3 py-2 border border-gray-300 rounded-button shadow-soft focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-body"
          placeholder="Enter your full name"
        />
        {errors.customerName && (
          <p id="customerName-error" className="mt-1 text-small text-error" role="alert">
            {errors.customerName.message}
          </p>
        )}
        {!errors.customerName && (
          <p id="customerName-hint" className="sr-only">
            Enter your full legal name as it appears on your identification
          </p>
        )}
      </div>

      {/* Customer Phone Field */}
      <div>
        <label
          htmlFor="customerPhone"
          className="block text-small font-medium text-text-secondary mb-1"
        >
          Phone Number <span className="text-error" aria-label="required">*</span>
        </label>
        <input
          {...register('customerPhone')}
          id="customerPhone"
          type="tel"
          aria-required="true"
          aria-invalid={errors.customerPhone ? 'true' : 'false'}
          aria-describedby={errors.customerPhone ? 'customerPhone-error' : 'customerPhone-hint'}
          className="w-full px-3 py-2 border border-gray-300 rounded-button shadow-soft focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-body"
          placeholder="+237XXXXXXXXX or 0XXXXXXXXX"
        />
        {errors.customerPhone && (
          <p id="customerPhone-error" className="mt-1 text-small text-error" role="alert">
            {errors.customerPhone.message}
          </p>
        )}
        <p id="customerPhone-hint" className="mt-1 text-xs text-text-secondary">
          Enter your mobile money number (Cameroon format: +237XXXXXXXXX or 0XXXXXXXXX)
        </p>
      </div>

      {/* Customer Email Field (Optional) */}
      <div>
        <label
          htmlFor="customerEmail"
          className="block text-small font-medium text-text-secondary mb-1"
        >
          Email Address <span className="text-text-secondary text-xs">(Optional)</span>
        </label>
        <input
          {...register('customerEmail')}
          id="customerEmail"
          type="email"
          aria-required="false"
          aria-invalid={errors.customerEmail ? 'true' : 'false'}
          aria-describedby={errors.customerEmail ? 'customerEmail-error' : 'customerEmail-hint'}
          className="w-full px-3 py-2 border border-gray-300 rounded-button shadow-soft focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-body"
          placeholder="you@example.com"
        />
        {errors.customerEmail && (
          <p id="customerEmail-error" className="mt-1 text-small text-error" role="alert">
            {errors.customerEmail.message}
          </p>
        )}
        <p id="customerEmail-hint" className="mt-1 text-xs text-text-secondary">
          We'll send you a receipt if provided
        </p>
      </div>

      {/* Payment Provider Selection */}
      <div>
        <label
          htmlFor="paymentProvider"
          className="block text-small font-medium text-text-secondary mb-1"
        >
          Payment Provider <span className="text-error" aria-label="required">*</span>
        </label>
        <select
          {...register('paymentProvider')}
          id="paymentProvider"
          aria-required="true"
          aria-invalid={errors.paymentProvider ? 'true' : 'false'}
          aria-describedby={errors.paymentProvider ? 'paymentProvider-error' : 'paymentProvider-hint'}
          className="w-full px-3 py-2 border border-gray-300 rounded-button shadow-soft focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-body"
        >
          <option value="MTN">MTN Mobile Money</option>
        </select>
        {errors.paymentProvider && (
          <p id="paymentProvider-error" className="mt-1 text-small text-error" role="alert">
            {errors.paymentProvider.message}
          </p>
        )}
        <p id="paymentProvider-hint" className="mt-1 text-xs text-text-secondary">
          Select your mobile money provider
        </p>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          aria-label={isLoading ? 'Processing payment, please wait' : 'Submit payment'}
          aria-busy={isLoading}
          className="w-full bg-primary text-white py-3 px-4 rounded-button hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed font-medium text-body transition-fast shadow-soft hover:shadow-soft-md"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing Payment...
            </span>
          ) : (
            'Pay Now'
          )}
        </button>
      </div>
    </form>
  );
}

