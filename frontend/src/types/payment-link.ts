// Payment Link Types

export interface PaymentLink {
  id: string;
  userId: string;
  productId?: string | null;
  title: string;
  description?: string | null;
  amount: string; // Decimal from backend (CFA)
  slug: string;
  isActive: boolean;
  expiresAt?: string | null;
  expiresAfterDays?: number | null;
  maxUses?: number | null;
  currentUses: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreatePaymentLinkDto {
  title: string;
  description?: string;
  amount: number;
  productId?: string;
  expiresAfterDays?: number;
  expiresAt?: string; // ISO date string
  maxUses?: number;
  isActive?: boolean;
}

export interface UpdatePaymentLinkDto {
  title?: string;
  description?: string;
  amount?: number;
  productId?: string;
  expiresAfterDays?: number;
  expiresAt?: string; // ISO date string
  maxUses?: number;
  isActive?: boolean;
}




