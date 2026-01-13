'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuth } from '@/hooks/auth/useAuth';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { getUserFriendlyErrorMessage } from '@/utils/error-messages';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { loginAsync, isLoggingIn, loginError, resetLoginError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Watch form fields to clear error when user starts typing after an error
  const email = watch('email');
  const password = watch('password');
  const [hasError, setHasError] = useState(false);

  // Clear error when user starts typing after an error occurred
  useEffect(() => {
    if (loginError) {
      setHasError(true);
    }
  }, [loginError]);

  useEffect(() => {
    // Only clear error if user is typing after an error occurred
    if (hasError && loginError && (email || password)) {
      resetLoginError();
      setHasError(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Use loginAsync to properly await the mutation
      // Success toast is shown in useAuth hook's onSuccess callback
      await loginAsync(data);
    } catch (error) {
      // Error is handled by React Query and will be available in loginError
      // Errors are already user-friendly, no need to log to console
    }
  };

  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Enter your credentials to access your payment links"
      footerText="Don't have an account?"
      footerLink="/register"
      footerLinkText="Sign up"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Error Message - Only show if there's actually an error */}
        {loginError && (
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
                  {getUserFriendlyErrorMessage(loginError)}
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
              <p className="mt-1 text-small text-error">{errors.email.message}</p>
            )}
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-small font-medium text-text-secondary mb-1"
            >
              Password
            </label>
            <div className="text-small">
              <Link
                href="/forgot-password"
                className="font-medium text-accent hover:text-primary transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>
          <div className="mt-1">
            <input
              {...register('password')}
              id="password"
              type="password"
              autoComplete="current-password"
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-input shadow-sm placeholder-text-secondary focus:outline-none focus:ring-accent focus:border-accent text-body"
            />
            {errors.password && (
              <p className="mt-1 text-small text-error">
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-button shadow-soft text-small font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed transition-fast"
          >
            {isLoggingIn ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}



