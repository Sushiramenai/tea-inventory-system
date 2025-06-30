import { api } from './api';

export enum AdjustmentType {
  received = 'received',
  damage = 'damage',
  sample = 'sample',
  count_correction = 'count_correction',
  other = 'other',
}

export interface CreateAdjustmentData {
  rawMaterialId: string;
  adjustmentType: AdjustmentType;
  adjustmentAmount: number;
  reason: string;
}

export interface InventoryAdjustment {
  id: string;
  rawMaterialId: string;
  adjustmentType: string;
  quantityBefore: number;
  quantityAfter: number;
  reason: string;
  adjustedById: string;
  adjustedAt: string;
  adjustedBy?: {
    id: string;
    username: string;
  };
  rawMaterial?: {
    id: string;
    name: string;
    sku: string;
  };
}

export const inventoryAdjustmentsService = {
  async createAdjustment(data: CreateAdjustmentData): Promise<{ adjustment: InventoryAdjustment; material: any }> {
    return api.post<{ adjustment: InventoryAdjustment; material: any }>('/inventory-adjustments', data);
  },

  async getMaterialAdjustments(materialId: string): Promise<InventoryAdjustment[]> {
    return api.get<InventoryAdjustment[]>(`/inventory-adjustments/material/${materialId}`);
  },

  async getRecentAdjustments(): Promise<InventoryAdjustment[]> {
    return api.get<InventoryAdjustment[]>('/inventory-adjustments');
  },
};