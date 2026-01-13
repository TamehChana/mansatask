'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  usePaymentLinks,
  usePaymentLinkMutations,
} from '@/hooks/payment-links/usePaymentLinks';
import { PaymentLinkCard } from '@/components/payment-links/PaymentLinkCard';
import { useState } from 'react';
import { BackButton } from '@/components/ui/BackButton';
import { getUserFriendlyErrorMessage } from '@/utils/error-messages';
import { useToast } from '@/components/ui/ToastProvider';

export default function PaymentLinksPage() {
  const { paymentLinks, isLoading, error } = usePaymentLinks();
  const { delete: deletePaymentLink, isDeleting } = usePaymentLinkMutations();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      await deletePaymentLink(id);
      showToast('Payment link deleted successfully.', 'success');
    } catch (error) {
      showToast(getUserFriendlyErrorMessage(error), 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-surface border-b border-gray-200">
          <div className="max-w-content-lg mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <BackButton href="/dashboard" label="Back to Dashboard" />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4">
              <div>
                <h1 className="text-2xl sm:text-h1 text-text-primary">
                  Payment Links
                </h1>
                <p className="text-text-secondary mt-2 text-sm sm:text-body">Create and manage your payment links</p>
              </div>
              <Link
                href="/payment-links/create"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-primary text-white px-4 sm:px-6 py-3 rounded-button hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-medium transition-fast shadow-soft hover:shadow-soft-md text-sm sm:text-base"
              >
                + Create Payment Link
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-content-lg mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading payment links...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-card p-4 mb-6">
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
                  <p className="text-small font-medium text-error">
                    {getUserFriendlyErrorMessage(error)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && paymentLinks.length === 0 && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No payment links
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new payment link.
                </p>
                <div className="mt-6">
                  <Link
                    href="/payment-links/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    + Create Payment Link
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Payment Links Grid */}
          {!isLoading && !error && paymentLinks.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {paymentLinks.map((paymentLink) => (
                <div key={paymentLink.id} className="relative group">
                  <PaymentLinkCard paymentLink={paymentLink} />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(paymentLink.id, paymentLink.title);
                      }}
                      disabled={
                        deletingId === paymentLink.id || isDeleting
                      }
                      className="bg-red-600 text-white p-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete payment link"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}



