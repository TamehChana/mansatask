'use client';

import { use } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navigation } from '@/components/dashboard/Navigation';
import { useTransaction } from '@/hooks/transactions/useTransactions';
import { TransactionStatus } from '@/types/payment';
import { useReceipt, useGenerateReceipt, useDownloadReceipt } from '@/hooks/receipts/useReceipts';
import { BackButton } from '@/components/ui/BackButton';

export default function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const { transaction, isLoading, error } = useTransaction(id);
  const { data: receipt, isLoading: isLoadingReceipt } = useReceipt(id);
  const generateReceipt = useGenerateReceipt();
  const downloadReceipt = useDownloadReceipt();

  const formattedAmount = transaction
    ? new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF', // CFA Franc
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number(transaction.amount))
    : '';

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.SUCCESS:
        return 'bg-green-100 text-green-800 border-green-200';
      case TransactionStatus.FAILED:
        return 'bg-red-100 text-red-800 border-red-200';
      case TransactionStatus.PENDING:
      case TransactionStatus.PROCESSING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case TransactionStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.SUCCESS:
        return (
          <svg
            className="h-6 w-6 text-green-600"
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
        );
      case TransactionStatus.FAILED:
        return (
          <svg
            className="h-6 w-6 text-red-600"
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
        );
      default:
        return (
          <svg
            className="h-6 w-6 text-yellow-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getStatusMessage = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.SUCCESS:
        return 'Payment completed successfully';
      case TransactionStatus.FAILED:
        return 'Payment failed';
      case TransactionStatus.PENDING:
        return 'Payment is pending';
      case TransactionStatus.PROCESSING:
        return 'Payment is being processed';
      case TransactionStatus.CANCELLED:
        return 'Payment was cancelled';
      default:
        return 'Unknown status';
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col lg:flex-row">
        {/* Sidebar Navigation - Hidden on mobile, shown on desktop */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <Navigation />
        </aside>
        {/* Mobile Navigation */}
        <Navigation />

        {/* Main Content */}
        <main className="flex-1 overflow-auto lg:ml-0">
          {/* Header */}
          <header className="bg-surface border-b border-gray-200">
            <div className="max-w-content-lg mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
              <BackButton href="/transactions" label="Back to Transactions" className="text-text-secondary hover:text-text-primary" />
              <h1 className="text-2xl sm:text-h1 text-text-primary mt-4">
                Transaction Details
              </h1>
              <p className="text-text-secondary mt-2 text-sm sm:text-body">View complete transaction information</p>
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="max-w-content-lg mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <div className="bg-surface rounded-card shadow-soft p-4 sm:p-6 lg:p-8 border border-gray-100">
              {/* Loading State */}
              {isLoading && (
                <div className="text-center py-12" aria-live="polite" aria-busy="true">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4" aria-hidden="true"></div>
                  <p className="text-text-secondary">Loading transaction...</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="text-center py-12" role="alert" aria-live="assertive">
                  <div className="rounded-md bg-red-50 border border-red-200 p-4 max-w-md mx-auto">
                    <div className="flex items-start mb-3">
                      <svg
                        className="h-6 w-6 text-error mr-3 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="flex-1">
                        <h3 className="text-h3 text-error mb-2">
                          Error Loading Transaction
                        </h3>
                        <p className="text-small text-red-700 mb-4">
                          {error instanceof Error
                            ? error.message
                            : 'Failed to load transaction. Please try again.'}
                        </p>
                        <Link
                          href="/transactions"
                          className="text-sm font-medium text-red-800 hover:text-red-900 underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                          aria-label="Go back to transactions list"
                        >
                          ← Back to Transactions
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Details */}
              {transaction && !isLoading && !error && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Status Badge */}
                  <div
                    className={`rounded-lg border-2 p-4 sm:p-6 ${getStatusColor(
                      transaction.status,
                    )}`}
                  >
                    <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <h2 className="text-xl sm:text-2xl font-bold mb-2">
                          {transaction.status}
                        </h2>
                        <p className="text-base sm:text-lg">
                          {getStatusMessage(transaction.status)}
                        </p>
                        <p className="text-xl sm:text-2xl font-semibold mt-2">
                          {formattedAmount}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusIcon(transaction.status)}
                      </div>
                    </div>
                  </div>

                  {/* Transaction Information */}
                  <div className="border-t border-gray-200 pt-4 sm:pt-6">
                    <h3 className="text-lg sm:text-h3 text-text-primary mb-3 sm:mb-4">
                      Transaction Information
                    </h3>
                    <dl className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-small font-medium text-text-secondary">
                          Transaction ID
                        </dt>
                        <dd className="mt-1 text-small text-text-primary font-mono break-all">
                          {transaction.id}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-small font-medium text-text-secondary">
                          External Reference
                        </dt>
                        <dd className="mt-1 text-small text-text-primary font-mono break-all">
                          {transaction.externalReference}
                        </dd>
                      </div>
                      {transaction.providerTransactionId && (
                        <div>
                          <dt className="text-small font-medium text-text-secondary">
                            Provider Transaction ID
                          </dt>
                          <dd className="mt-1 text-small text-text-primary font-mono break-all">
                            {transaction.providerTransactionId}
                          </dd>
                        </div>
                      )}
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
                          {transaction.provider}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-small font-medium text-text-secondary">
                          Status
                        </dt>
                        <dd className="mt-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              transaction.status,
                            )}`}
                          >
                            {transaction.status}
                          </span>
                        </dd>
                      </div>
                      {transaction.failureReason && (
                        <div className="sm:col-span-2">
                          <dt className="text-small font-medium text-error">
                            Failure Reason
                          </dt>
                          <dd className="mt-1 text-small text-error">
                            {transaction.failureReason}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Customer Information */}
                  <div className="border-t border-gray-200 pt-4 sm:pt-6">
                    <h3 className="text-lg sm:text-h3 text-text-primary mb-3 sm:mb-4">
                      Customer Information
                    </h3>
                    <dl className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-small font-medium text-text-secondary">
                          Name
                        </dt>
                        <dd className="mt-1 text-small text-text-primary">
                          {transaction.customerName}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-small font-medium text-text-secondary">
                          Phone
                        </dt>
                        <dd className="mt-1 text-small text-text-primary">
                          {transaction.customerPhone}
                        </dd>
                      </div>
                      {transaction.customerEmail && (
                        <div>
                          <dt className="text-small font-medium text-text-secondary">
                            Email
                          </dt>
                          <dd className="mt-1 text-small text-text-primary">
                            {transaction.customerEmail}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Payment Link Information */}
                  {transaction.paymentLink && (
                    <div className="border-t border-gray-200 pt-4 sm:pt-6">
                      <h3 className="text-lg sm:text-h3 text-text-primary mb-3 sm:mb-4">
                        Payment Link
                      </h3>
                      <dl className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
                        <div>
                          <dt className="text-small font-medium text-text-secondary">
                            Title
                          </dt>
                          <dd className="mt-1 text-small text-text-primary">
                            {transaction.paymentLink.title}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-small font-medium text-text-secondary">
                            Slug
                          </dt>
                          <dd className="mt-1 text-small text-text-primary font-mono break-all">
                            {transaction.paymentLink.slug}
                          </dd>
                        </div>
                        <div className="sm:col-span-2">
                          <Link
                            href={`/payment-links/${transaction.paymentLink.id}`}
                            className="text-accent hover:text-accent-dark text-small font-medium"
                          >
                            View Payment Link →
                          </Link>
                        </div>
                      </dl>
                    </div>
                  )}

                  {/* Receipt Section */}
                  {transaction.status === TransactionStatus.SUCCESS && (
                    <div className="border-t border-gray-200 pt-4 sm:pt-6">
                      <h3 className="text-lg sm:text-h3 text-text-primary mb-3 sm:mb-4">
                        Receipt
                      </h3>
                      {isLoadingReceipt ? (
                        <div className="flex items-center text-text-secondary">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent mr-2"></div>
                          Checking receipt...
                        </div>
                      ) : receipt ? (
                        <div className="bg-success/10 border border-success/20 rounded-card p-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-small font-medium text-success">
                                Receipt Number: {receipt.receiptNumber}
                              </p>
                              <p className="text-xs text-success mt-1">
                                Generated on{' '}
                                {new Date(receipt.createdAt).toLocaleString(
                                  'en-US',
                                  {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  },
                                )}
                              </p>
                            </div>
                            <button
                              onClick={() => downloadReceipt.mutate(id)}
                              disabled={downloadReceipt.isPending}
                              aria-label={downloadReceipt.isPending ? 'Downloading receipt, please wait' : 'Download receipt PDF'}
                              aria-busy={downloadReceipt.isPending}
                              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-small font-medium rounded-button text-white bg-success hover:bg-success-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success disabled:opacity-50 disabled:cursor-not-allowed transition-fast shadow-soft"
                            >
                              {downloadReceipt.isPending ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="h-4 w-4 mr-2"
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
                          </div>
                        </div>
                      ) : (
                        <div className="bg-warning/10 border border-warning/20 rounded-card p-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-small font-medium text-warning">
                                Receipt not yet generated
                              </p>
                              <p className="text-xs text-warning mt-1">
                                Generate a receipt for this successful transaction
                              </p>
                            </div>
                            <button
                              onClick={() => generateReceipt.mutate(id)}
                              disabled={generateReceipt.isPending}
                              aria-label={generateReceipt.isPending ? 'Generating receipt, please wait' : 'Generate receipt'}
                              aria-busy={generateReceipt.isPending}
                              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-small font-medium rounded-button text-white bg-warning hover:bg-warning-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warning disabled:opacity-50 disabled:cursor-not-allowed transition-fast shadow-soft"
                            >
                              {generateReceipt.isPending ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="h-4 w-4 mr-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                  Generate Receipt
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="border-t border-gray-200 pt-4 sm:pt-6">
                    <h3 className="text-lg sm:text-h3 text-text-primary mb-3 sm:mb-4">
                      Timestamps
                    </h3>
                    <dl className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-small font-medium text-text-secondary">
                          Created At
                        </dt>
                        <dd className="mt-1 text-small text-text-primary">
                          {new Date(transaction.createdAt).toLocaleString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            },
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-small font-medium text-text-secondary">
                          Last Updated
                        </dt>
                        <dd className="mt-1 text-small text-text-primary">
                          {new Date(transaction.updatedAt).toLocaleString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            },
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}


