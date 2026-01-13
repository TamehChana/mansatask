'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuth } from '@/hooks/auth/useAuth';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { getUserFriendlyErrorMessage } from '@/utils/error-messages';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser, isRegistering, registerError, resetRegisterError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Watch form fields to clear error when user starts typing after an error
  const name = watch('name');
  const email = watch('email');
  const password = watch('password');
  const confirmPassword = watch('confirmPassword');
  const [hasError, setHasError] = useState(false);

  // Track when error occurs
  useEffect(() => {
    if (registerError) {
      setHasError(true);
    }
  }, [registerError]);

  // Clear error when user starts typing after an error occurred
  useEffect(() => {
    if (hasError && registerError && (name || email || password || confirmPassword)) {
      resetRegisterError();
      setHasError(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, email, password, confirmPassword]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      // Success toast is shown in useAuth hook's onSuccess callback
    } catch (error) {
      // Error is handled by React Query and will be available in registerError
      // Errors are already user-friendly, no need to log to console
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start accepting payments with mobile money"
      footerText="Already have an account?"
      footerLink="/login"
      footerLinkText="Sign in"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Error Message - Only show if there's actually an error */}
        {registerError && (
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
                  {getUserFriendlyErrorMessage(registerError)}
                </h3>
              </div>
            </div>
          </div>
        )}

        {/* Name Field */}
        <div>
          <label
            htmlFor="name"
            className="block text-small font-medium text-text-secondary mb-1"
          >
            Full name
          </label>
          <div className="mt-1">
            <input
              {...register('name')}
              id="name"
              type="text"
              autoComplete="name"
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-input shadow-sm placeholder-text-secondary focus:outline-none focus:ring-accent focus:border-accent text-body"
              placeholder="John Doe"
            />
            {errors.name && (
              <p className="mt-1 text-small text-error">{errors.name.message}</p>
            )}
          </div>
        </div>

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
          <label
            htmlFor="password"
            className="block text-small font-medium text-text-secondary mb-1"
          >
            Password
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
            Confirm password
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
            disabled={isRegistering}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-button shadow-soft text-small font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed transition-fast"
          >
            {isRegistering ? 'Creating account...' : 'Create account'}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}



