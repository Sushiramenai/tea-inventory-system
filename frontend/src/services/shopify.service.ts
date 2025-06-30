import { api } from './api';

export interface ShopifyOrderItem {
  id: string;
  orderId: string;
  productId: string;
  shopifySku: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    size: string;
    sku: string;
    stockQuantity: number;
    binLocation?: string;
  };
  reservation?: {
    id: string;
    quantity: number;
  };
  availableToPromise?: number;
  canFulfill?: boolean;
}

export interface ShopifyOrder {
  id: string;
  shopifyOrderId: string;
  shopifyOrderNumber: string;
  customerName: string;
  customerEmail?: string;
  shippingMethod: string;
  status: 'pending' | 'ready_to_ship' | 'shipped' | 'cancelled';
  tags?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt: string;
  processedById?: string;
  processedBy?: {
    id: string;
    username: string;
  };
  items: ShopifyOrderItem[];
  canFulfill?: boolean;
}

export interface PickListItem {
  product: {
    id: string;
    name: string;
    sku: string;
    size: string;
    binLocation?: string;
  };
  totalQuantity: number;
  orders: Array<{
    orderId: string;
    orderNumber: string;
    quantity: number;
  }>;
}

export interface PackingSlip {
  orderNumber: string;
  customerName: string;
  shippingMethod: string;
  orderDate: string;
  items: Array<{
    sku: string;
    name: string;
    size: string;
    quantity: number;
  }>;
  specialInstructions?: string;
  brewingInstructions: string;
}

export interface StockReservation {
  id: string;
  productId: string;
  quantity: number;
  reservationType: 'shopify_order' | 'manual';
  orderItemId?: string;
  notes?: string;
  expiresAt?: string;
  createdAt: string;
}

export const shopifyService = {
  async syncOrders(): Promise<{ message: string; orders: ShopifyOrder[] }> {
    return api.post('/shopify/sync');
  },

  async getOrders(filters?: {
    status?: string;
    shippingMethod?: string;
    tags?: string;
  }): Promise<{ orders: ShopifyOrder[] }> {
    return api.get('/shopify/orders', filters);
  },

  async updateOrderStatus(
    id: string,
    status: 'pending' | 'ready_to_ship' | 'shipped' | 'cancelled',
    notes?: string
  ): Promise<{ order: ShopifyOrder }> {
    return api.put(`/shopify/orders/${id}/status`, { status, notes });
  },

  async generatePickList(orderIds: string[]): Promise<{
    pickList: PickListItem[];
    totalOrders: number;
    generatedAt: string;
  }> {
    return api.post('/shopify/pick-list', { orderIds });
  },

  async generatePackingSlip(orderId: string): Promise<{ packingSlip: PackingSlip }> {
    return api.get(`/shopify/orders/${orderId}/packing-slip`);
  },

  async createReservation(
    productId: string,
    quantity: number,
    notes?: string
  ): Promise<{ reservation: StockReservation }> {
    return api.post('/shopify/reservations', { productId, quantity, notes });
  },

  async releaseReservation(id: string): Promise<{ message: string }> {
    return api.delete(`/shopify/reservations/${id}`);
  },
};