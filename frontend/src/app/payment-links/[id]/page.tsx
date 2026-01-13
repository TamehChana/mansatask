'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { QRCodeDisplay } from '@/components/payment-links/QRCodeDisplay';
import {
  usePaymentLink,
  usePaymentLinkMutations,
} from '@/hooks/payment-links/usePaymentLinks';
import { BackButton } from '@/components/ui/BackButton';
import { getUserFriendlyErrorMessage } from '@/utils/error-messages';
import { useToast } from '@/components/ui/ToastProvider';

export default function PaymentLinkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const { paymentLink, isLoading, error } = usePaymentLink(id);
  const { delete: deletePaymentLink, isDeleting } = usePaymentLinkMutations();
  const { showToast } = useToast();

  const handleDelete = async () => {
    if (!paymentLink) return;
    if (!confirm(`Are you sure you want to delete "${paymentLink.title}"?`)) {
      return;
    }

    try {
      await deletePaymentLink(id);
      showToast('Payment link deleted successfully.', 'success');
      router.push('/payment-links');
    } catch (error) {
      showToast(getUserFriendlyErrorMessage(error), 'error');
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

  const publicUrl = paymentLink
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/payment/${paymentLink.slug}`
    : '';

  const isExpired =
    paymentLink?.expiresAt &&
    new Date(paymentLink.expiresAt) < new Date();

  const isExhausted =
    paymentLink?.maxUses !== null &&
    paymentLink?.maxUses !== undefined &&
    paymentLink?.currentUses >= paymentLink.maxUses;

  const statusBadge = !paymentLink?.isActive
    ? 'Inactive'
    : isExpired
      ? 'Expired'
      : isExhausted
        ? 'Exhausted'
        : 'Active';

  const statusColor =
    !paymentLink?.isActive || isExpired || isExhausted
      ? 'bg-gray-100 text-gray-800'
      : 'bg-green-100 text-green-800';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-surface border-b border-gray-200">
          <div className="max-w-content mx-auto px-6 py-8">
            <BackButton href="/payment-links" label="Back to Payment Links" className="text-text-secondary hover:text-text-primary" />
            <div className="flex justify-between items-center mt-4">
              <div>
                <h1 className="text-h1 text-text-primary">
                  Payment Link Details
                </h1>
                <p className="text-text-secondary mt-2 text-body">View and manage your payment link</p>
              </div>
              {paymentLink && (
                <div className="flex gap-2">
                  <Link
                    href={`/payment-links/${id}/edit`}
                    className="bg-primary text-white px-4 py-2 rounded-button hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-medium transition-fast shadow-soft hover:shadow-soft-md"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-error text-white px-4 py-2 rounded-button hover:bg-error-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-fast shadow-soft"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
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

            {/* Payment Link Details */}
            {paymentLink && !isLoading && !error && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-h2 text-text-primary">
                      {paymentLink.title}
                    </h2>
                    <span
                      className={`px-3 py-1 text-small font-medium rounded-button ${statusColor}`}
                    >
                      {statusBadge}
                    </span>
                  </div>
                  <p className="text-2xl font-semibold text-accent">
                    {formattedPrice}
                  </p>
                </div>

                {/* Public URL */}
                {publicUrl && (
                  <div className="bg-accent/10 border border-accent/20 rounded-card p-4 mb-6">
                    <label className="block text-small font-medium text-text-primary mb-2">
                      Public Payment Link URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={publicUrl}
                        readOnly
                        className="flex-1 px-3 py-2 bg-surface border border-gray-300 rounded-button text-small font-mono focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(publicUrl);
                          alert('URL copied to clipboard!');
                        }}
                        className="px-4 py-2 bg-accent text-white rounded-button hover:bg-accent-dark text-small font-medium transition-fast shadow-soft"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                {/* QR Code */}
                {publicUrl && (
                  <div className="mb-6">
                    <QRCodeDisplay url={publicUrl} />
                  </div>
                )}

                {paymentLink.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Description
                    </h3>
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {paymentLink.description}
                    </p>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-6">
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Slug
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono">
                        {paymentLink.slug}
                      </dd>
                    </div>
                    {paymentLink.maxUses !== null &&
                      paymentLink.maxUses !== undefined && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">
                            Usage
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {paymentLink.currentUses} / {paymentLink.maxUses}{' '}
                            uses
                          </dd>
                        </div>
                      )}
                    {paymentLink.expiresAt && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Expires At
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(paymentLink.expiresAt).toLocaleDateString(
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
                    )}
                    {paymentLink.expiresAfterDays && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Expires After
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {paymentLink.expiresAfterDays} days
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Created At
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(paymentLink.createdAt).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          },
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Last Updated
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(paymentLink.updatedAt).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          },
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

