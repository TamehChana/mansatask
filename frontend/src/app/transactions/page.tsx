'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navigation } from '@/components/dashboard/Navigation';
import { useTransactions } from '@/hooks/transactions/useTransactions';
import type { ListTransactionsDto } from '@/types/transaction';
import { TransactionStatus, PaymentProvider } from '@/types/payment';

export default function TransactionsPage() {
  const [filters, setFilters] = useState<ListTransactionsDto>({
    page: 1,
    limit: 20,
  });
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | ''>('');
  const [providerFilter, setProviderFilter] = useState<PaymentProvider | ''>('');

  const { transactions, pagination, isLoading, error } = useTransactions({
    ...filters,
    status: statusFilter || undefined,
    provider: providerFilter || undefined,
  });

  const handleStatusFilterChange = (status: TransactionStatus | '') => {
    setStatusFilter(status);
    setFilters({ ...filters, page: 1 }); // Reset to page 1 when filter changes
  };

  const handleProviderFilterChange = (provider: PaymentProvider | '') => {
    setProviderFilter(provider);
    setFilters({ ...filters, page: 1 }); // Reset to page 1 when filter changes
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
              <h1 className="text-2xl sm:text-h1 text-text-primary">
                Transactions
              </h1>
              <p className="text-text-secondary mt-2 text-sm sm:text-body">View and manage all your payment transactions</p>
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="max-w-content-lg mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {/* Filters */}
            <div className="bg-surface rounded-card shadow-soft p-4 sm:p-6 mb-6 border border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                  <label
                    htmlFor="status"
                    className="block text-small font-medium text-text-secondary mb-2"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    value={statusFilter}
                    onChange={(e) =>
                      handleStatusFilterChange(
                        e.target.value as TransactionStatus | '',
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-button shadow-soft focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-body"
                  >
                    <option value="">All Statuses</option>
                    <option value={TransactionStatus.PENDING}>Pending</option>
                    <option value={TransactionStatus.PROCESSING}>
                      Processing
                    </option>
                    <option value={TransactionStatus.SUCCESS}>Success</option>
                    <option value={TransactionStatus.FAILED}>Failed</option>
                    <option value={TransactionStatus.CANCELLED}>
                      Cancelled
                    </option>
                  </select>
                </div>

                {/* Provider Filter */}
                <div>
                  <label
                    htmlFor="provider"
                    className="block text-small font-medium text-text-secondary mb-2"
                  >
                    Provider
                  </label>
                  <select
                    id="provider"
                    value={providerFilter}
                    onChange={(e) =>
                      handleProviderFilterChange(
                        e.target.value as PaymentProvider | '',
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-button shadow-soft focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-body"
                  >
                    <option value="">All Providers</option>
                    <option value={PaymentProvider.MTN}>MTN</option>
                    <option value={PaymentProvider.VODAFONE}>Vodafone</option>
                    <option value={PaymentProvider.AIRTELTIGO}>
                      AirtelTigo
                    </option>
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setStatusFilter('');
                      setProviderFilter('');
                      setFilters({ page: 1, limit: 20 });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-button text-small font-medium text-text-secondary bg-surface hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-fast"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                <p className="text-text-secondary">Loading transactions...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-card p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-error"
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
                    <p className="text-small font-medium text-error">
                      {error instanceof Error
                        ? error.message
                        : 'Unable to load transactions. Please check your connection and try again.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Transactions Table */}
            {!isLoading && !error && (
              <div className="bg-surface rounded-card shadow-soft overflow-hidden border border-gray-100">
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
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
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No transactions
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No transactions found matching your filters.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Card View */}
                    <div className="lg:hidden divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="p-4 hover:bg-gray-50"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-text-primary">
                                {transaction.customerName}
                              </div>
                              <div className="text-xs text-text-secondary font-mono mt-1">
                                {transaction.externalReference}
                              </div>
                            </div>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                transaction.status,
                              )}`}
                            >
                              {transaction.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                            <div>
                              <div className="text-xs text-text-secondary">Amount</div>
                              <div className="font-medium text-text-primary">
                                {new Intl.NumberFormat('fr-FR', {
                                  style: 'currency',
                                  currency: 'XOF',
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                }).format(Number(transaction.amount))}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-text-secondary">Provider</div>
                              <div className="font-medium text-text-primary">
                                {transaction.provider}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-text-secondary">Phone</div>
                              <div className="text-text-primary">
                                {transaction.customerPhone}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-text-secondary">Date</div>
                              <div className="text-text-primary">
                                {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <Link
                              href={`/transactions/${transaction.id}`}
                              className="text-sm font-medium text-accent hover:text-accent-dark"
                            >
                              View Details →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reference
                            </th>
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
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {transactions.map((transaction) => (
                            <tr
                              key={transaction.id}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-mono text-gray-900">
                                  {transaction.externalReference}
                                </div>
                              </td>
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
                                    transaction.status,
                                  )}`}
                                >
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
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link
                                  href={`/transactions/${transaction.id}`}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  View
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                          <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={!pagination.hasPreviousPage}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={!pagination.hasNextPage}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-gray-700">
                              Showing{' '}
                              <span className="font-medium">
                                {(pagination.page - 1) * pagination.limit + 1}
                              </span>{' '}
                              to{' '}
                              <span className="font-medium">
                                {Math.min(
                                  pagination.page * pagination.limit,
                                  pagination.total,
                                )}
                              </span>{' '}
                              of{' '}
                              <span className="font-medium">
                                {pagination.total}
                              </span>{' '}
                              results
                            </p>
                          </div>
                          <div>
                            <nav
                              className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                              aria-label="Pagination"
                            >
                              <button
                                onClick={() =>
                                  handlePageChange(pagination.page - 1)
                                }
                                disabled={!pagination.hasPreviousPage}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <span className="sr-only">Previous</span>
                                <svg
                                  className="h-5 w-5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                Page {pagination.page} of{' '}
                                {pagination.totalPages}
                              </span>
                              <button
                                onClick={() =>
                                  handlePageChange(pagination.page + 1)
                                }
                                disabled={!pagination.hasNextPage}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <span className="sr-only">Next</span>
                                <svg
                                  className="h-5 w-5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </nav>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}



