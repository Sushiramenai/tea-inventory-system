import { api } from './api';
import { ProductInventory, PaginationParams } from '../types';

export interface ProductsResponse {
  products: ProductInventory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ProductFilters extends PaginationParams {
  search?: string;
  category?: string;
  lowStock?: boolean;
}

export interface CreateProductData {
  name: string;
  sku: string;
  size: string;
  price: number;
  stockQuantity: number;
  reorderLevel: number;
  reorderQuantity: number;
  category?: string;
  barcode?: string;
}

export interface UpdateProductData {
  name?: string;
  size?: string;
  price?: number;
  stockQuantity?: number;
  reorderLevel?: number;
  reorderQuantity?: number;
  category?: string;
  barcode?: string;
}

export const productsService = {
  async getProducts(filters?: ProductFilters): Promise<ProductsResponse> {
    return api.get<ProductsResponse>('/products', filters);
  },

  async getProductById(id: string): Promise<{ product: ProductInventory }> {
    return api.get<{ product: ProductInventory }>(`/products/${id}`);
  },

  async getProductBySku(sku: string): Promise<{ product: ProductInventory }> {
    return api.get<{ product: ProductInventory }>(`/products/by-sku/${sku}`);
  },

  async createProduct(data: CreateProductData): Promise<{ product: ProductInventory }> {
    return api.post<{ product: ProductInventory }>('/products', data);
  },

  async updateProduct(id: string, data: UpdateProductData): Promise<{ product: ProductInventory }> {
    return api.put<{ product: ProductInventory }>(`/products/${id}`, data);
  },

  async deleteProduct(id: string): Promise<void> {
    return api.delete(`/products/${id}`);
  },

  async exportProducts(filters?: ProductFilters): Promise<Blob> {
    const response = await fetch(`/api/products/export?${new URLSearchParams(filters as any)}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to export products');
    }
    return response.blob();
  },
};