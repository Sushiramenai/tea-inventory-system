// Since SQLite doesn't support enums, we define them as constants

export const UserRole = {
  admin: 'admin',
  fulfillment: 'fulfillment',
  production: 'production',
} as const;

export const ProductCategory = {
  tea: 'tea',
  teaware: 'teaware',
  accessory: 'accessory',
} as const;

export const ProductSizeFormat = {
  family: 'family',
  pouch: 'pouch',
  wholesale: 'wholesale',
  tin: 'tin',
  refill: 'refill',
} as const;

export const MaterialCategory = {
  tea: 'tea',
  tins: 'tins',
  tin_label: 'tin_label',
  refill_label: 'refill_label',
  pouch_label: 'pouch_label',
  pouches: 'pouches',
  boxes: 'boxes',
  stickers: 'stickers',
  teabags: 'teabags',
  other: 'other',
} as const;

export const MaterialUnit = {
  boxes: 'boxes',
  kg: 'kg',
  pcs: 'pcs',
  rolls: 'rolls',
  teabags: 'teabags',
} as const;

export const RequestStatus = {
  pending: 'pending',
  in_progress: 'in_progress',
  completed: 'completed',
  cancelled: 'cancelled',
} as const;

export const AuditAction = {
  create: 'create',
  update: 'update',
  delete: 'delete',
} as const;

// Type exports
export type UserRole = typeof UserRole[keyof typeof UserRole];
export type ProductCategory = typeof ProductCategory[keyof typeof ProductCategory];
export type ProductSizeFormat = typeof ProductSizeFormat[keyof typeof ProductSizeFormat];
export type MaterialCategory = typeof MaterialCategory[keyof typeof MaterialCategory];
export type MaterialUnit = typeof MaterialUnit[keyof typeof MaterialUnit];
export type RequestStatus = typeof RequestStatus[keyof typeof RequestStatus];
export type AuditAction = typeof AuditAction[keyof typeof AuditAction];