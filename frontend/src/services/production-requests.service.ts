import { api } from './api';
import { ProductionRequest, PaginationParams, RequestStatus } from '../types';

export interface ProductionRequestsResponse {
  requests: ProductionRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ProductionRequestFilters extends PaginationParams {
  status?: RequestStatus;
  productId?: string;
  requestedBy?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateProductionRequestData {
  productId: string;
  quantityRequested: number;
  notes?: string;
}

export interface UpdateProductionRequestData {
  status?: RequestStatus;
  notes?: string;
}

export interface CompleteProductionRequestData {
  notes?: string;
}

export interface MaterialCheck {
  rawMaterialId: string;
  itemName: string;
  required: number;
  available: number;
  sufficient: boolean;
}

export interface CreateProductionRequestResponse {
  request: ProductionRequest;
  materialsCheck: {
    allAvailable: boolean;
    materials: MaterialCheck[];
  };
}

export interface CompleteProductionRequestResponse {
  request: ProductionRequest;
  inventoryUpdates: {
    productUpdated: {
      sku?: string;
      previousCount: number;
      newCount: number;
    };
    materialsConsumed: Array<{
      itemName: string;
      consumed: number;
      remaining: number;
    }>;
  };
}

export const productionRequestsService = {
  async getProductionRequests(filters?: ProductionRequestFilters): Promise<ProductionRequestsResponse> {
    return api.get<ProductionRequestsResponse>('/production-requests', filters);
  },

  async getProductionRequestById(id: string): Promise<{ request: ProductionRequest }> {
    return api.get<{ request: ProductionRequest }>(`/production-requests/${id}`);
  },

  async createProductionRequest(data: CreateProductionRequestData): Promise<CreateProductionRequestResponse> {
    return api.post<CreateProductionRequestResponse>('/production-requests', data);
  },

  async updateProductionRequest(id: string, data: UpdateProductionRequestData): Promise<{ request: ProductionRequest }> {
    return api.put<{ request: ProductionRequest }>(`/production-requests/${id}`, data);
  },

  async completeProductionRequest(id: string, data?: CompleteProductionRequestData): Promise<CompleteProductionRequestResponse> {
    return api.post<CompleteProductionRequestResponse>(`/production-requests/${id}/complete`, data || {});
  },
};