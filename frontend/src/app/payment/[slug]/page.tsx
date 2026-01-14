'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { usePaymentLinkBySlug } from '@/hooks/payment-links/usePaymentLinks';
import { useInitiatePayment } from '@/hooks/payments/usePayments';
import { PaymentProvider } from '@/types/payment';
import { PaymentForm, type PaymentFormData } from '@/components/payment/PaymentForm';
import { useToast } from '@/components/ui/ToastProvider';
import { getUserFriendlyErrorMessage } from '@/utils/error-messages';

export default function PublicPaymentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();
  const { paymentLink, isLoading, error } = usePaymentLinkBySlug(slug);
  const { initiatePayment, isPending, error: paymentError } =
    useInitiatePayment();
  const { showToast } = useToast();

  const handlePayment = async (data: PaymentFormData) => {
    if (!paymentLink) return;

    try {
      const response = await initiatePayment({
        slug: paymentLink.slug,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        paymentProvider: data.paymentProvider,
      });

      showToast('Payment initiated. Please confirm on your mobile money.', 'success');
      // Redirect to payment status page
      router.push(`/payment/status/${response.externalReference}`);
    } catch (error) {
      // Error is handled by the form component
      showToast(
        getUserFriendlyErrorMessage(error),
        'error',
      );
    }
  };

  const formattedPrice = paymentLink
    ? new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF', // CFA Franc
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number(paymentLink.amount))
    : '';

  const isExpired =
    paymentLink?.expiresAt &&
    new Date(paymentLink.expiresAt) < new Date();

  const isExhausted =
    paymentLink?.maxUses !== null &&
    paymentLink?.maxUses !== undefined &&
    paymentLink?.currentUses >= paymentLink.maxUses;

  const isValid = paymentLink?.isActive && !isExpired && !isExhausted;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-gray-200">
        <div className="max-w-content mx-auto px-6 py-8">
          <h1 className="text-h1 text-text-primary">
            Payment Link
          </h1>
          <p className="text-text-secondary mt-2 text-body">Complete your payment securely</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-content mx-auto px-6 py-8">
        <div className="bg-surface rounded-card shadow-soft p-8 border border-gray-100">
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <p className="text-text-secondary">Loading payment link...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="rounded-md bg-error-red/10 border border-error-red/20 p-4 text-error-red">
                <h3 className="text-h3 font-medium mb-2">
                  {getUserFriendlyErrorMessage(error)}
                </h3>
                <p className="text-small mt-2">
                  The payment link you're looking for may not exist, has been removed, or is not available.
                </p>
              </div>
            </div>
          )}

          {/* Payment Link Details & Form */}
          {paymentLink && !isLoading && !error && (
            <div className="space-y-6">
              {/* Invalid State */}
              {!isValid && (
                <div className="rounded-card bg-red-50 border border-red-200 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-error"
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
                      <h3 className="text-small font-medium text-error">
                        {!paymentLink.isActive
                          ? 'This payment link is not active'
                          : isExpired
                            ? 'This payment link has expired'
                            : isExhausted
                              ? 'This payment link has reached maximum uses'
                              : 'This payment link is not available'}
                      </h3>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Link Info */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-h2 text-text-primary mb-2">
                  {paymentLink.title}
                </h2>
                <p className="text-2xl font-semibold text-accent mb-4">
                  {formattedPrice}
                </p>
                {paymentLink.description && (
                  <p className="text-text-primary whitespace-pre-wrap">
                    {paymentLink.description}
                  </p>
                )}
              </div>

              {/* Payment Form */}
              {isValid && (
                <div>
                  <h3 className="text-h3 text-text-primary mb-4">
                    Payment Details
                  </h3>
                  <PaymentForm
                    onSubmit={handlePayment}
                    isLoading={isPending}
                    error={paymentError}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}



