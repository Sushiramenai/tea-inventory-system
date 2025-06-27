// User types
export enum UserRole {
  admin = 'admin',
  fulfillment = 'fulfillment',
  production = 'production',
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

// Product types
export enum ProductCategory {
  tea = 'tea',
  teaware = 'teaware',
  accessory = 'accessory',
}

export enum ProductSizeFormat {
  family = 'family',
  pouch = 'pouch',
  wholesale = 'wholesale',
  tin = 'tin',
  refill = 'refill',
}

export interface ProductInventory {
  id: string;
  name: string;
  sku: string;
  size: string;
  price: number;
  stockQuantity: number;
  reorderLevel: number;
  reorderQuantity: number;
  category: ProductCategory;
  barcode?: string;
  createdAt: string;
  updatedAt: string;
  updatedById?: string;
  updatedBy?: {
    id: string;
    username: string;
  };
  isLowStock?: boolean;
  billOfMaterials?: BillOfMaterial[];
}

// Raw material types
export enum MaterialCategory {
  tea = 'tea',
  tins = 'tins',
  tin_label = 'tin_label',
  refill_label = 'refill_label',
  pouch_label = 'pouch_label',
  pouches = 'pouches',
  boxes = 'boxes',
  stickers = 'stickers',
  teabags = 'teabags',
  other = 'other',
}

export enum MaterialUnit {
  boxes = 'boxes',
  kg = 'kg',
  pcs = 'pcs',
  rolls = 'rolls',
  teabags = 'teabags',
}

export interface RawMaterial {
  id: string;
  itemName: string;
  category: MaterialCategory;
  count: number;
  unit: MaterialUnit;
  quantityPerUnit?: number;
  totalQuantity?: number;
  reorderThreshold: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  updatedById?: string;
  updatedBy?: {
    id: string;
    username: string;
  };
  isLowStock?: boolean;
}

// Bill of Materials
export interface BillOfMaterial {
  id: string;
  productId: string;
  rawMaterialId: string;
  quantityRequired: number;
  unitOverride?: string;
  createdAt: string;
  updatedAt: string;
  product?: ProductInventory;
  rawMaterial?: RawMaterial;
}

// Production Request types
export enum RequestStatus {
  pending = 'pending',
  in_progress = 'in_progress',
  completed = 'completed',
  cancelled = 'cancelled',
}

export interface ProductionRequestMaterial {
  id: string;
  requestId: string;
  rawMaterialId: string;
  quantityConsumed: number;
  quantityAvailableAtRequest: number;
  rawMaterial: RawMaterial;
  isAvailable?: boolean;
}

export interface ProductionRequest {
  id: string;
  requestNumber: string;
  productId: string;
  quantityRequested: number;
  status: RequestStatus;
  requestedById: string;
  requestedAt: string;
  completedById?: string;
  completedAt?: string;
  notes?: string;
  product: ProductInventory;
  requestedBy: {
    id: string;
    username: string;
  };
  completedBy?: {
    id: string;
    username: string;
  };
  materials: ProductionRequestMaterial[];
  allMaterialsAvailable?: boolean;
}

// Dashboard types
export interface DashboardStats {
  products: {
    total: number;
    lowStock: number;
  };
  rawMaterials?: {
    total: number;
    lowStock: number;
  };
  productionRequests: {
    pending: number;
    inProgress: number;
    completedToday: number;
  };
  recentProductUpdates?: Array<{
    id: string;
    teaName: string;
    quantitySize: string;
    physicalCount: number;
    updatedAt: string;
  }>;
  recentMaterialUpdates?: Array<{
    id: string;
    itemName: string;
    totalQuantity: number;
    unit: string;
    updatedAt: string;
  }>;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}