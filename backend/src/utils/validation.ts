import { z } from 'zod';
import { UserRole, ProductCategory, ProductSizeFormat, MaterialCategory, MaterialUnit, RequestStatus } from '../constants/enums';

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(UserRole),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
});

// Product schemas
export const createProductSchema = z.object({
  teaName: z.string().min(1).max(255),
  category: z.nativeEnum(ProductCategory),
  sizeFormat: z.nativeEnum(ProductSizeFormat),
  quantitySize: z.string().min(1).max(50),
  sku: z.string().max(50).optional(),
  barcode: z.string().max(100).optional(),
  physicalCount: z.number().min(0).default(0),
  reorderThreshold: z.number().min(0).default(0),
});

export const updateProductSchema = createProductSchema.partial().omit({ teaName: true, sizeFormat: true, quantitySize: true });

// Raw material schemas
export const createRawMaterialSchema = z.object({
  itemName: z.string().min(1).max(255),
  category: z.nativeEnum(MaterialCategory),
  count: z.number().min(0).default(0),
  unit: z.nativeEnum(MaterialUnit),
  quantityPerUnit: z.number().positive().optional(),
  reorderThreshold: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export const updateRawMaterialSchema = createRawMaterialSchema.partial().omit({ itemName: true, category: true });

// Bill of Materials schemas
export const createBillOfMaterialSchema = z.object({
  productId: z.string().uuid(),
  rawMaterialId: z.string().uuid(),
  quantityRequired: z.number().positive(),
  unitOverride: z.string().max(20).optional(),
});

export const updateBillOfMaterialSchema = z.object({
  quantityRequired: z.number().positive(),
  unitOverride: z.string().max(20).optional(),
});

// Production request schemas
export const createProductionRequestSchema = z.object({
  productId: z.string().uuid(),
  quantityRequested: z.number().positive(),
  notes: z.string().optional(),
});

export const updateProductionRequestSchema = z.object({
  status: z.nativeEnum(RequestStatus).optional(),
  notes: z.string().optional(),
});

export const completeProductionRequestSchema = z.object({
  notes: z.string().optional(),
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const productQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  category: z.nativeEnum(ProductCategory).optional(),
  lowStock: z.coerce.boolean().optional(),
});

export const rawMaterialQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  category: z.nativeEnum(MaterialCategory).optional(),
  lowStock: z.coerce.boolean().optional(),
});

export const productionRequestQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(RequestStatus).optional(),
  productId: z.string().uuid().optional(),
  requestedBy: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});