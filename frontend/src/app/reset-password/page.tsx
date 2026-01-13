'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuth } from '@/hooks/auth/useAuth';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { getUserFriendlyErrorMessage } from '@/utils/error-messages';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const { resetPassword, isResettingPassword, resetPasswordError, resetPasswordSuccess } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!token) {
      router.push('/forgot-password');
    }
  }, [token, router]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;
    
    // Backend only expects token and password (confirmPassword is validated on frontend)
    await resetPassword({
      token,
      password: data.password,
    });
  };

  if (!token) {
    return null;
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your new password"
      footerText="Remember your password?"
      footerLink="/login"
      footerLinkText="Sign in"
    >
      {resetPasswordSuccess ? (
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
                  Password reset successful
                </h3>
                <div className="mt-2 text-small">
                  <p>Your password has been reset. You can now sign in.</p>
                </div>
              </div>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-block text-small font-medium text-accent hover:text-primary transition-colors"
          >
            Go to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Error Message */}
          {resetPasswordError && (
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
                    {getUserFriendlyErrorMessage(resetPasswordError)}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-small font-medium text-text-secondary mb-1"
            >
              New password
            </label>
            <div className="mt-1">
              <input
                {...register('password')}
                id="password"
                type="password"
                autoComplete="new-password"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-input shadow-sm placeholder-text-secondary focus:outline-none focus:ring-accent focus:border-accent text-body"
              />
              {errors.password && (
                <p className="mt-1 text-small text-error">
                  {errors.password.message}
                </p>
              )}
              <p className="mt-1 text-xs text-text-secondary">
                Must be at least 8 characters
              </p>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-small font-medium text-text-secondary mb-1"
            >
              Confirm new password
            </label>
            <div className="mt-1">
              <input
                {...register('confirmPassword')}
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-input shadow-sm placeholder-text-secondary focus:outline-none focus:ring-accent focus:border-accent text-body"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-small text-error">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isResettingPassword}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-button shadow-soft text-small font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed transition-fast"
            >
              {isResettingPassword ? 'Resetting password...' : 'Reset password'}
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
