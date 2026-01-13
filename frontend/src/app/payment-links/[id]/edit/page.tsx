'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PaymentLinkForm } from '@/components/payment-links/PaymentLinkForm';
import {
  usePaymentLink,
  usePaymentLinkMutations,
} from '@/hooks/payment-links/usePaymentLinks';
import type { UpdatePaymentLinkDto } from '@/types/payment-link';
import { BackButton } from '@/components/ui/BackButton';
import { getUserFriendlyErrorMessage } from '@/utils/error-messages';

export default function EditPaymentLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const { paymentLink, isLoading: isLoadingPaymentLink, error } =
    usePaymentLink(id);
  const { update, isUpdating, updateError } = usePaymentLinkMutations();

  const handleSubmit = async (data: UpdatePaymentLinkDto) => {
    // Clean up the data: remove empty strings, convert date to ISO format
    const submitData: UpdatePaymentLinkDto = {
      title: data.title,
      description: data.description || undefined,
      amount: data.amount,
      productId: data.productId || undefined,
      expiresAfterDays: data.expiresAfterDays || undefined,
      expiresAt: data.expiresAt
        ? new Date(data.expiresAt).toISOString()
        : undefined,
      maxUses: data.maxUses || undefined,
      isActive: data.isActive,
    };

    try {
      await update({ id, data: submitData });
    } catch (error) {
      // Error is handled by the mutation and will be shown via updateError
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-surface border-b border-gray-200">
          <div className="max-w-content mx-auto px-6 py-8">
            <BackButton href={`/payment-links/${id}`} label="Back to Payment Link" className="text-text-secondary hover:text-text-primary" />
            <h1 className="text-h1 text-text-primary mt-4">
              Edit Payment Link
            </h1>
            <p className="text-text-secondary mt-2 text-body">Update your payment link details</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-content mx-auto px-6 py-8">
          <div className="bg-surface rounded-card shadow-soft p-8 border border-gray-100">
            {/* Loading State */}
            {isLoadingPaymentLink && (
              <div className="text-center py-12">
                <p className="text-text-secondary">Loading payment link...</p>
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
                  href="/payment-links"
                  className="mt-4 inline-block text-accent hover:text-accent-dark"
                >
                  ← Back to Payment Links
                </Link>
              </div>
            )}

            {/* Edit Form */}
            {paymentLink && !isLoadingPaymentLink && !error && (
              <>
                {/* Error Message */}
                {updateError && (
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
                        <h3 className="text-sm font-medium text-error-red">
                          {getUserFriendlyErrorMessage(updateError)}
                        </h3>
                      </div>
                    </div>
                  </div>
                )}

                <PaymentLinkForm
                  paymentLink={paymentLink}
                  onSubmit={handleSubmit}
                  isLoading={isUpdating}
                  submitLabel="Update Payment Link"
                />
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

