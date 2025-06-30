import { api } from './api';
import { RawMaterial, PaginationParams } from '../types';

export interface RawMaterialsResponse {
  materials: RawMaterial[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface RawMaterialFilters extends PaginationParams {
  search?: string;
  category?: string;
  lowStock?: boolean;
}

export interface CreateRawMaterialData {
  name: string;
  sku: string;
  stockQuantity: number;
  unit: string;
  unitCost: number;
  reorderLevel: number;
  reorderQuantity: number;
  supplier?: string;
  category?: string;
  notes?: string;
}

export interface UpdateRawMaterialData {
  stockQuantity?: number;
  unit?: string;
  unitCost?: number;
  reorderLevel?: number;
  reorderQuantity?: number;
  supplier?: string;
  category?: string;
  notes?: string;
}

export const rawMaterialsService = {
  async getRawMaterials(filters?: RawMaterialFilters): Promise<RawMaterialsResponse> {
    return api.get<RawMaterialsResponse>('/raw-materials', filters);
  },

  async getAllRawMaterials(): Promise<{ materials: RawMaterial[] }> {
    return api.get<{ materials: RawMaterial[] }>('/raw-materials/all');
  },

  async getRawMaterialById(id: string): Promise<{ material: RawMaterial }> {
    return api.get<{ material: RawMaterial }>(`/raw-materials/${id}`);
  },

  async createRawMaterial(data: CreateRawMaterialData): Promise<{ material: RawMaterial }> {
    return api.post<{ material: RawMaterial }>('/raw-materials', data);
  },

  async updateRawMaterial(id: string, data: UpdateRawMaterialData): Promise<{ material: RawMaterial }> {
    return api.put<{ material: RawMaterial }>(`/raw-materials/${id}`, data);
  },

  async deleteRawMaterial(id: string): Promise<void> {
    return api.delete(`/raw-materials/${id}`);
  },

  async exportRawMaterials(filters?: RawMaterialFilters): Promise<Blob> {
    const response = await fetch(`/api/raw-materials/export?${new URLSearchParams(filters as any)}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to export raw materials');
    }
    return response.blob();
  },
};