'use client';

import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  footerText?: string;
  footerLink?: string;
  footerLinkText?: string;
}

/**
 * Layout component for authentication pages
 * Provides consistent styling and structure
 */
export function AuthLayout({
  children,
  title,
  subtitle,
  footerText,
  footerLink,
  footerLinkText,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-block p-3 bg-accent/10 rounded-full mb-4">
            <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-h1 text-text-primary">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-body text-text-secondary">{subtitle}</p>
          )}
        </div>

        {/* Form Container */}
        <div className="bg-surface rounded-card shadow-soft p-8 border border-gray-100">
          {children}
        </div>

        {/* Footer Links */}
        {(footerText || footerLink) && (
          <div className="text-center text-sm">
            {footerText && <span className="text-gray-600">{footerText} </span>}
            {footerLink && footerLinkText && (
              <Link
                href={footerLink}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                {footerLinkText}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

