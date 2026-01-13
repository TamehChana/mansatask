// Product Types

export interface Product {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  price: string; // Decimal from backend (CFA)
  imageUrl?: string | null; // Product image URL (S3 or local)
  quantity: number; // Available units (0 = out of stock)
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  quantity?: number; // Available units (0 = out of stock, undefined = unlimited)
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  quantity?: number; // Available units (0 = out of stock, undefined = unlimited)
}

export interface ImageUploadResponse {
  imageUrl: string;
  key: string;
  storageType: 's3' | 'local';
}



