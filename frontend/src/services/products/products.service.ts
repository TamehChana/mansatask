import apiClient from '@/lib/api-client';
import type { Product, CreateProductDto, UpdateProductDto, ImageUploadResponse } from '@/types/product';

/**
 * Products Service
 * Handles all product-related API calls
 */
export const productsService = {
  /**
   * Get all products for the authenticated user
   */
  async getAll(): Promise<Product[]> {
    const response = await apiClient.get<Product[]>('/products');
    return response.data;
  },

  /**
   * Get a single product by ID
   */
  async getById(id: string): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  },

  /**
   * Create a new product
   */
  async create(data: CreateProductDto): Promise<Product> {
    const response = await apiClient.post<Product>('/products', data);
    return response.data;
  },

  /**
   * Update a product
   */
  async update(id: string, data: UpdateProductDto): Promise<Product> {
    const response = await apiClient.patch<Product>(`/products/${id}`, data);
    return response.data;
  },

  /**
   * Delete a product (soft delete)
   */
  async delete(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/products/${id}`);
    return response.data;
  },

  /**
   * Upload product image
   */
  async uploadImage(file: File): Promise<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post<ImageUploadResponse>(
      '/products/upload-image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  },
};



