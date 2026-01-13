'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuth } from '@/hooks/auth/useAuth';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { getUserFriendlyErrorMessage } from '@/utils/error-messages';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const {
    forgotPassword,
    isForgotPasswordLoading,
    forgotPasswordError,
    forgotPasswordSuccess,
  } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    await forgotPassword(data);
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email address and we'll send you a reset link"
      footerText="Remember your password?"
      footerLink="/login"
      footerLinkText="Sign in"
    >
      {forgotPasswordSuccess ? (
        <div className="text-center space-y-4">
          <div className="rounded-md bg-success-green/10 border border-success-green/20 p-4 text-success-green">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-small font-medium">
                  Password reset email sent
                </h3>
                <div className="mt-2 text-small">
                  <p>
                    If an account exists with that email, we've sent password
                    reset instructions to your inbox.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-block text-small font-medium text-accent hover:text-primary transition-colors"
          >
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Error Message */}
          {forgotPasswordError && (
            <div className="rounded-md bg-error-red/10 border border-error-red/20 p-4 text-error-red">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5"
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
                  <h3 className="text-small font-medium">
                    {getUserFriendlyErrorMessage(forgotPasswordError)}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-small font-medium text-text-secondary mb-1"
            >
              Email address
            </label>
            <div className="mt-1">
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-input shadow-sm placeholder-text-secondary focus:outline-none focus:ring-accent focus:border-accent text-body"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-small text-error">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isForgotPasswordLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-button shadow-soft text-small font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed transition-fast"
            >
              {isForgotPasswordLoading
                ? 'Sending reset link...'
                : 'Send reset link'}
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}



