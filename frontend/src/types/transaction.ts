// Transaction Types

import { TransactionStatus, PaymentProvider } from './payment';

export interface Transaction {
  id: string;
  userId: string;
  paymentLinkId: string;
  externalReference: string;
  providerTransactionId?: string | null;
  status: TransactionStatus;
  provider: PaymentProvider;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  amount: string; // Decimal from backend (CFA)
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
  paymentLink?: {
    id: string;
    title: string;
    slug: string;
  };
}

export interface ListTransactionsDto {
  status?: TransactionStatus;
  provider?: PaymentProvider;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface TransactionsResponse {
  data: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}




