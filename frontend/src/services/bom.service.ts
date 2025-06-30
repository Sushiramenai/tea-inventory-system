import { api } from './api';
import { BillOfMaterial, RawMaterial } from '../types';

export interface CreateBOMData {
  productId: string;
  rawMaterialId: string;
  quantityRequired: number;
  unitOverride?: string;
}

export interface UpdateBOMData {
  quantityRequired?: number;
  unitOverride?: string;
}

export interface BOMWithDetails extends BillOfMaterial {
  rawMaterial: RawMaterial;
}

export const bomService = {
  async getBOMByProductId(productId: string): Promise<BOMWithDetails[]> {
    return api.get<BOMWithDetails[]>(`/bom/product/${productId}`);
  },

  async createBOM(data: CreateBOMData): Promise<{ material: BillOfMaterial }> {
    return api.post<{ material: BillOfMaterial }>('/bom', data);
  },

  async updateBOM(id: string, data: UpdateBOMData): Promise<{ material: BillOfMaterial }> {
    return api.put<{ material: BillOfMaterial }>(`/bom/${id}`, data);
  },

  async deleteBOM(id: string): Promise<void> {
    return api.delete(`/bom/${id}`);
  },
};