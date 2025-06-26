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
  itemName: string;
  category: string;
  count: number;
  unit: string;
  quantityPerUnit?: number;
  reorderThreshold: number;
  notes?: string;
}

export interface UpdateRawMaterialData {
  count?: number;
  unit?: string;
  quantityPerUnit?: number;
  reorderThreshold?: number;
  notes?: string;
}

export const rawMaterialsService = {
  async getRawMaterials(filters?: RawMaterialFilters): Promise<RawMaterialsResponse> {
    return api.get<RawMaterialsResponse>('/raw-materials', filters);
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