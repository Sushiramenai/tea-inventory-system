-- Add new fields to existing tables
ALTER TABLE "product_inventory" ADD COLUMN "bin_location" TEXT;
ALTER TABLE "raw_materials" ADD COLUMN "bin_location" TEXT;

ALTER TABLE "production_requests" ADD COLUMN "quantity_produced" REAL;
ALTER TABLE "production_requests" ADD COLUMN "priority" TEXT DEFAULT 'normal';
ALTER TABLE "production_requests" ADD COLUMN "production_notes" TEXT;
ALTER TABLE "production_requests" ADD COLUMN "started_at" DATETIME;
ALTER TABLE "production_requests" ADD COLUMN "batch_number" TEXT;

-- CreateTable Production Time Logs
CREATE TABLE "production_time_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "request_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "production_time_logs_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "production_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable Shopify Orders
CREATE TABLE "shopify_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopify_order_id" TEXT NOT NULL,
    "shopify_order_number" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT,
    "shipping_method" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tags" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "synced_at" DATETIME NOT NULL,
    "processed_by" TEXT,
    CONSTRAINT "shopify_orders_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable Shopify Order Items
CREATE TABLE "shopify_order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "shopify_sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    CONSTRAINT "shopify_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "shopify_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "shopify_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product_inventory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable Stock Reservations
CREATE TABLE "stock_reservations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "reservation_type" TEXT NOT NULL,
    "order_item_id" TEXT,
    "notes" TEXT,
    "expires_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_reservations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product_inventory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stock_reservations_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "shopify_order_items" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable Inventory Adjustments
CREATE TABLE "inventory_adjustments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT,
    "raw_material_id" TEXT,
    "adjustment_type" TEXT NOT NULL,
    "quantity_before" REAL NOT NULL,
    "quantity_after" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "adjusted_by" TEXT NOT NULL,
    "adjusted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_adjustments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product_inventory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "inventory_adjustments_adjusted_by_fkey" FOREIGN KEY ("adjusted_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable Inventory Counts
CREATE TABLE "inventory_counts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "count_date" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable Inventory Count Items
CREATE TABLE "inventory_count_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "count_id" TEXT NOT NULL,
    "product_id" TEXT,
    "raw_material_id" TEXT,
    "system_quantity" REAL NOT NULL,
    "counted_quantity" REAL,
    "variance" REAL,
    "notes" TEXT,
    CONSTRAINT "inventory_count_items_count_id_fkey" FOREIGN KEY ("count_id") REFERENCES "inventory_counts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "shopify_orders_shopify_order_id_key" ON "shopify_orders"("shopify_order_id");
CREATE UNIQUE INDEX "stock_reservations_order_item_id_key" ON "stock_reservations"("order_item_id");