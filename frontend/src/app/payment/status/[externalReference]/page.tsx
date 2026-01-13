'use client';

import { use } from 'react';
import { usePaymentStatus } from '@/hooks/payments/usePayments';
import { TransactionStatus } from '@/types/payment';
import { useDownloadReceiptByExternalReference } from '@/hooks/receipts/useReceipts';
import Link from 'next/link';
import { useState } from 'react';
import { BackButton } from '@/components/ui/BackButton';

export default function PaymentStatusPage({
  params,
}: {
  params: Promise<{ externalReference: string }>;
}) {
  const resolvedParams = use(params);
  const externalReference = resolvedParams.externalReference;
  const { paymentStatus, isLoading, error } = usePaymentStatus(externalReference);
  const downloadReceipt = useDownloadReceiptByExternalReference();
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const formattedAmount = paymentStatus
    ? new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF', // CFA Franc
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(paymentStatus.amount)
    : '';

  const getStatusMessage = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.PENDING:
        return 'Payment is pending. Please check your mobile money account.';
      case TransactionStatus.PROCESSING:
        return 'Payment is being processed. Please wait...';
      case TransactionStatus.SUCCESS:
        return 'Payment successful! Thank you for your payment.';
      case TransactionStatus.FAILED:
        return 'Payment failed. Please try again.';
      case TransactionStatus.CANCELLED:
        return 'Payment was cancelled.';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.SUCCESS:
        return 'bg-green-100 text-green-800 border-green-200';
      case TransactionStatus.FAILED:
      case TransactionStatus.CANCELLED:
        return 'bg-red-100 text-red-800 border-red-200';
      case TransactionStatus.PROCESSING:
      case TransactionStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDownloadReceipt = async () => {
    if (!externalReference) return;
    
    setDownloadError(null);
    try {
      await downloadReceipt.mutateAsync(externalReference);
    } catch (error) {
      setDownloadError(
        error instanceof Error
          ? error.message
          : 'Failed to download receipt. Please try again.',
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-gray-200">
        <div className="max-w-content mx-auto px-6 py-8">
          <h1 className="text-h1 text-text-primary">
            Payment Status
          </h1>
          <p className="text-text-secondary mt-2 text-body">Track your payment progress</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-content mx-auto px-6 py-8">
        <div className="bg-surface rounded-card shadow-soft p-8 border border-gray-100">
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
              <p className="text-text-secondary">Loading payment status...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="rounded-md bg-red-50 p-4">
                <h3 className="text-h3 text-error mb-2">
                  Error Loading Payment
                </h3>
                <p className="text-small text-error">
                  {error instanceof Error
                    ? error.message
                    : 'Failed to load payment status. Please try again.'}
                </p>
              </div>
            </div>
          )}

          {/* Payment Status */}
          {paymentStatus && !isLoading && !error && (
            <div className="space-y-6">
              {/* Status Badge */}
              <div
                className={`rounded-lg border-2 p-6 ${getStatusColor(paymentStatus.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      {paymentStatus.status}
                    </h2>
                    <p className="text-lg">
                      {getStatusMessage(paymentStatus.status)}
                    </p>
                  </div>
                  {paymentStatus.status === TransactionStatus.SUCCESS && (
                    <svg
                      className="h-12 w-12 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                  {paymentStatus.status === TransactionStatus.FAILED && (
                    <svg
                      className="h-12 w-12 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-h3 text-text-primary mb-4">
                  Payment Details
                </h3>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-small font-medium text-text-secondary">
                      Amount
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-accent">
                      {formattedAmount}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-small font-medium text-text-secondary">
                      Provider
                    </dt>
                    <dd className="mt-1 text-small text-text-primary">
                      {paymentStatus.provider}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-small font-medium text-text-secondary">
                      Transaction Reference
                    </dt>
                    <dd className="mt-1 text-small text-text-primary font-mono">
                      {paymentStatus.externalReference}
                    </dd>
                  </div>
                  {paymentStatus.providerTransactionId && (
                    <div>
                      <dt className="text-small font-medium text-text-secondary">
                        Provider Transaction ID
                      </dt>
                      <dd className="mt-1 text-small text-text-primary font-mono">
                        {paymentStatus.providerTransactionId}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-small font-medium text-text-secondary">
                      Customer Name
                    </dt>
                    <dd className="mt-1 text-small text-text-primary">
                      {paymentStatus.customerName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-small font-medium text-text-secondary">
                      Phone Number
                    </dt>
                    <dd className="mt-1 text-small text-text-primary">
                      {paymentStatus.customerPhone}
                    </dd>
                  </div>
                  {paymentStatus.customerEmail && (
                    <div>
                      <dt className="text-small font-medium text-text-secondary">
                        Email
                      </dt>
                      <dd className="mt-1 text-small text-text-primary">
                        {paymentStatus.customerEmail}
                      </dd>
                    </div>
                  )}
                  {paymentStatus.failureReason && (
                    <div className="sm:col-span-2">
                      <dt className="text-small font-medium text-error">
                        Failure Reason
                      </dt>
                      <dd className="mt-1 text-small text-error">
                        {paymentStatus.failureReason}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-small font-medium text-text-secondary">
                      Created At
                    </dt>
                    <dd className="mt-1 text-small text-text-primary">
                      {new Date(paymentStatus.createdAt).toLocaleString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        },
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-small font-medium text-text-secondary">
                      Last Updated
                    </dt>
                    <dd className="mt-1 text-small text-text-primary">
                      {new Date(paymentStatus.updatedAt).toLocaleString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        },
                      )}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 pt-6">
                {paymentStatus.status === TransactionStatus.SUCCESS && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleDownloadReceipt}
                        disabled={downloadReceipt.isPending}
                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-body font-medium rounded-button text-white bg-success hover:bg-success-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success disabled:opacity-50 disabled:cursor-not-allowed transition-fast shadow-soft hover:shadow-soft-md"
                      >
                        {downloadReceipt.isPending ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
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
                            Downloading...
                          </>
                        ) : (
                          <>
                            <svg
                              className="h-5 w-5 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            Download Receipt
                          </>
                        )}
                      </button>
                      <Link
                        href="/"
                        className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-body font-medium rounded-button text-text-secondary bg-surface hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-fast"
                      >
                        Return to Home
                      </Link>
                    </div>
                    {downloadError && (
                      <div className="rounded-card bg-red-50 p-4">
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
                              Download Failed
                            </h3>
                            <div className="mt-2 text-small text-error">
                              <p>{downloadError}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {(paymentStatus.status === TransactionStatus.FAILED ||
                  paymentStatus.status === TransactionStatus.CANCELLED) && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/"
                      className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-body font-medium rounded-button text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-fast shadow-soft hover:shadow-soft-md"
                    >
                      Try Again
                    </Link>
                    <Link
                      href="/"
                      className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-body font-medium rounded-button text-text-secondary bg-surface hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-fast"
                    >
                      Return to Home
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


