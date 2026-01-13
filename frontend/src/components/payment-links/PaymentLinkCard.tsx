'use client';

import Link from 'next/link';
import { useToast } from '@/components/ui/ToastProvider';

interface PaymentLinkCardProps {
  paymentLink: {
    id: string;
    title: string;
    description?: string | null;
    amount: string;
    slug: string;
    isActive: boolean;
    expiresAt?: string | null;
    maxUses?: number | null;
    currentUses: number;
  };
}

/**
 * Payment Link Card Component
 * Displays a single payment link in a card format
 */
export function PaymentLinkCard({ paymentLink }: PaymentLinkCardProps) {
  const { showToast } = useToast();

  const formattedPrice = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF', // CFA Franc
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(paymentLink.amount));

  const isExpired =
    paymentLink.expiresAt &&
    new Date(paymentLink.expiresAt) < new Date();

  const isExhausted =
    paymentLink.maxUses !== null &&
    paymentLink.maxUses !== undefined &&
    paymentLink.currentUses >= paymentLink.maxUses;

  const statusBadge = !paymentLink.isActive
    ? 'Inactive'
    : isExpired
      ? 'Expired'
      : isExhausted
        ? 'Exhausted'
        : 'Active';

  const statusColor =
    !paymentLink.isActive || isExpired || isExhausted
      ? 'bg-gray-100 text-gray-800'
      : 'bg-green-100 text-green-800';

  const publicPath = `/payment/${paymentLink.slug}`;

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}${publicPath}`
        : publicPath;

    try {
      await navigator.clipboard.writeText(url);
      showToast('Payment link copied to clipboard.', 'success');
    } catch {
      showToast('Failed to copy link. Please copy it manually.', 'error');
    }
  };

  return (
    <Link
      href={`/payment-links/${paymentLink.id}`}
      className="block bg-surface rounded-card shadow-soft hover:shadow-soft-md transition-fast p-6 border border-gray-100 hover-lift"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-text-primary">
              {paymentLink.title}
            </h3>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-button ${statusColor}`}
            >
              {statusBadge}
            </span>
          </div>
          <span className="text-xl font-semibold text-accent">
            {formattedPrice}
          </span>
        </div>
      </div>

      {paymentLink.description && (
        <p className="text-small text-text-secondary line-clamp-2 mb-4">
          {paymentLink.description}
        </p>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
        <div className="flex justify-between items-center text-xs text-text-secondary gap-2">
          <span className="truncate">Slug: {paymentLink.slug}</span>
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center text-accent hover:text-accent-dark font-medium transition-fast"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16h8M8 12h4m-6 8h10a2 2 0 002-2V8a2 2 0 00-2-2h-3.586a1 1 0 01-.707-.293L9.586 4.293A1 1 0 008.879 4H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Copy link
          </button>
        </div>
        {paymentLink.maxUses && (
          <div className="text-xs text-text-secondary">
            Uses: {paymentLink.currentUses} / {paymentLink.maxUses}
          </div>
        )}
        {paymentLink.expiresAt && (
          <div className="text-xs text-text-secondary">
            Expires:{' '}
            {new Date(paymentLink.expiresAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </div>
        )}
        <div className="pt-2">
          <span className="text-small text-accent hover:text-accent-dark font-medium inline-flex items-center">
            View details
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}



