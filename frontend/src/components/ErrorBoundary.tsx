'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div 
            className="min-h-screen flex items-center justify-center bg-gray-50"
            role="alert"
            aria-live="assertive"
          >
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
              <div className="flex items-start mb-4">
                <svg
                  className="h-6 w-6 text-red-600 mr-3 flex-shrink-0"
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
                  <h1 className="text-2xl font-bold text-red-600 mb-2">
                    Something went wrong
                  </h1>
                  <p className="text-gray-600">
                    We're sorry, but something unexpected happened. Please try refreshing the page.
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.location.reload()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.location.reload();
                  }
                }}
                aria-label="Refresh page to retry loading the application"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors font-medium"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}


