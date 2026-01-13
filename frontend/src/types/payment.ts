// Payment Types

export enum PaymentProvider {
  MTN = 'MTN',
  VODAFONE = 'VODAFONE',
  AIRTELTIGO = 'AIRTELTIGO',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface InitiatePaymentDto {
  paymentLinkId?: string;
  slug?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  paymentProvider: PaymentProvider;
}

export interface PaymentResponse {
  externalReference: string;
  status: TransactionStatus;
  providerTransactionId: string | null;
  amount: number;
  paymentProvider: PaymentProvider;
}

export interface PaymentStatusResponse {
  id: string;
  externalReference: string;
  status: TransactionStatus;
  provider: PaymentProvider;
  amount: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  providerTransactionId?: string | null;
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
  paymentLink?: {
    id: string;
    title: string;
    amount: string;
  };
}

