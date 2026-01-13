'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string;
}

/**
 * Reusable Back Button Component
 * Provides consistent back navigation across the app
 */
export function BackButton({ href, label, className = '' }: BackButtonProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    if (href) {
      // Let Link handle navigation
      return;
    }
    e.preventDefault();
    router.back();
  };

  const buttonContent = (
    <span className="inline-flex items-center text-small font-medium text-text-secondary hover:text-text-primary transition-fast">
      <svg
        className="w-4 h-4 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      {label || 'Back'}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`inline-block mb-4 ${className}`}
        onClick={handleClick}
      >
        {buttonContent}
      </Link>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-block mb-4 ${className}`}
      type="button"
    >
      {buttonContent}
    </button>
  );
}

