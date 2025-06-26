-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'fulfillment',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "product_inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tea_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "size_format" TEXT NOT NULL,
    "quantity_size" TEXT NOT NULL,
    "sku" TEXT,
    "barcode" TEXT,
    "physical_count" REAL NOT NULL DEFAULT 0,
    "reorder_threshold" REAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "updated_by" TEXT,
    CONSTRAINT "product_inventory_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "raw_materials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "count" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "quantity_per_unit" REAL,
    "total_quantity" REAL,
    "reorder_threshold" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "updated_by" TEXT,
    CONSTRAINT "raw_materials_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bill_of_materials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "raw_material_id" TEXT NOT NULL,
    "quantity_required" REAL NOT NULL,
    "unit_override" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "bill_of_materials_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product_inventory" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bill_of_materials_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "production_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "quantity_requested" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requested_by" TEXT NOT NULL,
    "requested_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_by" TEXT,
    "completed_at" DATETIME,
    "notes" TEXT,
    CONSTRAINT "production_requests_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product_inventory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "production_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "production_requests_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "production_request_materials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "request_id" TEXT NOT NULL,
    "raw_material_id" TEXT NOT NULL,
    "quantity_consumed" REAL NOT NULL,
    "quantity_available_at_request" REAL NOT NULL,
    CONSTRAINT "production_request_materials_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "production_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "production_request_materials_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "product_inventory_sku_key" ON "product_inventory"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_inventory_tea_name_size_format_quantity_size_key" ON "product_inventory"("tea_name", "size_format", "quantity_size");

-- CreateIndex
CREATE UNIQUE INDEX "raw_materials_item_name_category_key" ON "raw_materials"("item_name", "category");

-- CreateIndex
CREATE UNIQUE INDEX "bill_of_materials_product_id_raw_material_id_key" ON "bill_of_materials"("product_id", "raw_material_id");

-- CreateIndex
CREATE UNIQUE INDEX "production_request_materials_request_id_raw_material_id_key" ON "production_request_materials"("request_id", "raw_material_id");
