'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useDashboard } from '@/hooks/dashboard/useDashboard';
import { useUserProfile } from '@/hooks/users/useUsers';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Navigation } from '@/components/dashboard/Navigation';
import Link from 'next/link';
import { TransactionStatus } from '@/types/payment';

export default function DashboardPage() {
  const { stats, recentTransactions, isLoading } = useDashboard();
  const { profile } = useUserProfile();

  const formattedRevenue = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF', // CFA Franc
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(stats.totalRevenue);

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.SUCCESS:
        return 'bg-green-100 text-green-800';
      case TransactionStatus.FAILED:
        return 'bg-red-100 text-red-800';
      case TransactionStatus.PENDING:
      case TransactionStatus.PROCESSING:
        return 'bg-yellow-100 text-yellow-800';
      case TransactionStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.SUCCESS:
        return (
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
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case TransactionStatus.FAILED:
        return (
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      default:
        return (
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col lg:flex-row">
        {/* Sidebar Navigation */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <Navigation />
        </aside>
        {/* Mobile Navigation */}
        <Navigation />

        {/* Main Content */}
        <main className="flex-1 overflow-auto lg:ml-0">
          {/* Header */}
          <header className="bg-surface border-b border-gray-200">
            <div className="max-w-content-lg mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
              <h1 className="text-2xl sm:text-h1 text-text-primary">Dashboard</h1>
              <p className="text-text-secondary mt-2 text-sm sm:text-body">Overview of your payment link business</p>
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {/* Phone Number Reminder */}
            {profile && !profile.phone && (
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-amber-600 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-amber-800">
                          Add your phone number
                        </h3>
                        <p className="mt-1 text-sm text-amber-700">
                          Your phone number will appear on receipts for your customers.
                        </p>
                      </div>
                      <Link
                        href="/profile"
                        className="ml-4 flex-shrink-0 inline-flex items-center text-sm font-medium text-amber-800 hover:text-amber-900"
                      >
                        Add now
                        <svg
                          className="ml-1 h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12" aria-live="polite" aria-busy="true">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" aria-hidden="true"></div>
                <p className="text-gray-600">Loading dashboard...</p>
              </div>
            )}

            {/* Dashboard Content */}
            {!isLoading && (
              <>
                {/* Quick Actions */}
                <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Link
                    href="/products/create"
                    className="inline-flex items-center justify-center px-4 sm:px-6 py-3 bg-primary text-white rounded-button hover:bg-primary-dark font-medium shadow-soft hover:shadow-soft-md transition-fast text-sm sm:text-base"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create Product
                  </Link>
                  <Link
                    href="/payment-links/create"
                    className="inline-flex items-center justify-center px-4 sm:px-6 py-3 bg-accent text-white rounded-button hover:bg-accent-dark font-medium shadow-soft hover:shadow-soft-md transition-fast text-sm sm:text-base"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create Payment Link
                  </Link>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 lg:mb-8">
                  <StatsCard
                    title="Total Revenue"
                    value={formattedRevenue}
                    icon={
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    }
                    description="From successful payments"
                  />
                  <StatsCard
                    title="Total Transactions"
                    value={stats.totalTransactions}
                    icon={
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    }
                    description={`${stats.successfulTransactions} successful`}
                  />
                  <StatsCard
                    title="Payment Links"
                    value={stats.totalPaymentLinks}
                    icon={
                      <svg
                        className="w-6 h-6"
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
                    }
                    description={`${stats.activePaymentLinks} active`}
                  />
                  <StatsCard
                    title="Products"
                    value={stats.totalProducts}
                    icon={
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    }
                  />
                </div>

                {/* Transaction Status Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <StatsCard
                    title="Pending"
                    value={stats.pendingTransactions}
                    description="Awaiting processing"
                  />
                  <StatsCard
                    title="Successful"
                    value={stats.successfulTransactions}
                    description="Completed payments"
                  />
                  <StatsCard
                    title="Failed"
                    value={stats.failedTransactions}
                    description="Unsuccessful payments"
                  />
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Recent Transactions
                    </h2>
                    <Link
                      href="/transactions"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View All →
                    </Link>
                  </div>
                  <div className="overflow-x-auto">
                    {recentTransactions.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-500">No transactions yet</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Transactions will appear here once customers make
                          payments
                        </p>
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Provider
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {recentTransactions.map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {transaction.customerName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {transaction.customerPhone}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {new Intl.NumberFormat('fr-FR', {
                                    style: 'currency',
                                    currency: 'XOF',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  }).format(Number(transaction.amount))}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {transaction.provider}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                    transaction.status as TransactionStatus,
                                  )}`}
                                >
                                  <span className="mr-1">
                                    {getStatusIcon(transaction.status as TransactionStatus)}
                                  </span>
                                  {transaction.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(
                                  transaction.createdAt,
                                ).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
