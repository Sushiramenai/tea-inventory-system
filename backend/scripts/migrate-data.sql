-- This script migrates the data from old field names to new field names

-- First, update product_inventory table
-- Update temporary columns with data
UPDATE product_inventory SET name_new = tea_name WHERE name_new IS NULL;
UPDATE product_inventory SET size_new = quantity_size WHERE size_new IS NULL;
UPDATE product_inventory SET price_new = 0 WHERE price_new IS NULL; -- Default price
UPDATE product_inventory SET stock_quantity = physical_count WHERE stock_quantity = 0;
UPDATE product_inventory SET reorder_level = reorder_threshold WHERE reorder_level = 0;

-- Ensure all products have SKUs
UPDATE product_inventory SET sku = 'SKU-' || substr(id, 1, 8) WHERE sku IS NULL;

-- Now update raw_materials table
-- First add the missing columns if they don't exist
ALTER TABLE raw_materials ADD COLUMN name_new TEXT;
ALTER TABLE raw_materials ADD COLUMN sku_new TEXT;
ALTER TABLE raw_materials ADD COLUMN stock_quantity REAL DEFAULT 0;
ALTER TABLE raw_materials ADD COLUMN unit_cost REAL DEFAULT 0;
ALTER TABLE raw_materials ADD COLUMN reorder_level REAL DEFAULT 0;
ALTER TABLE raw_materials ADD COLUMN reorder_quantity REAL DEFAULT 0;
ALTER TABLE raw_materials ADD COLUMN supplier TEXT;

-- Copy data from old columns to new columns
UPDATE raw_materials SET name_new = item_name;
UPDATE raw_materials SET sku_new = 'MAT-' || substr(id, 1, 8);
UPDATE raw_materials SET stock_quantity = COALESCE(total_quantity, count);
UPDATE raw_materials SET reorder_level = reorder_threshold;

-- Create new tables with proper structure
CREATE TABLE product_inventory_final (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    size TEXT NOT NULL,
    price REAL NOT NULL,
    stock_quantity REAL NOT NULL DEFAULT 0,
    reorder_level REAL NOT NULL DEFAULT 0,
    reorder_quantity REAL NOT NULL DEFAULT 0,
    category TEXT,
    barcode TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL,
    updated_by TEXT,
    CONSTRAINT product_inventory_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE raw_materials_final (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    stock_quantity REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    unit_cost REAL NOT NULL DEFAULT 0,
    reorder_level REAL NOT NULL DEFAULT 0,
    reorder_quantity REAL NOT NULL DEFAULT 0,
    supplier TEXT,
    category TEXT,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL,
    updated_by TEXT,
    CONSTRAINT raw_materials_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Copy data to final tables
INSERT INTO product_inventory_final (id, name, sku, size, price, stock_quantity, reorder_level, reorder_quantity, category, barcode, created_at, updated_at, updated_by)
SELECT 
    id, 
    COALESCE(name_new, tea_name), 
    sku, 
    COALESCE(size_new, quantity_size), 
    COALESCE(price_new, 0),
    stock_quantity, 
    reorder_level, 
    reorder_quantity,
    category, 
    barcode, 
    created_at, 
    updated_at, 
    updated_by
FROM product_inventory;

INSERT INTO raw_materials_final (id, name, sku, stock_quantity, unit, unit_cost, reorder_level, reorder_quantity, supplier, category, notes, created_at, updated_at, updated_by)
SELECT 
    id, 
    COALESCE(name_new, item_name), 
    COALESCE(sku_new, 'MAT-' || substr(id, 1, 8)), 
    stock_quantity, 
    unit, 
    unit_cost, 
    reorder_level, 
    reorder_quantity,
    supplier,
    category, 
    notes, 
    created_at, 
    updated_at, 
    updated_by
FROM raw_materials;

-- Drop old tables and rename new ones
DROP TABLE product_inventory;
DROP TABLE raw_materials;

ALTER TABLE product_inventory_final RENAME TO product_inventory;
ALTER TABLE raw_materials_final RENAME TO raw_materials;

-- Create unique indexes
CREATE UNIQUE INDEX product_inventory_sku_key ON product_inventory(sku);
CREATE UNIQUE INDEX raw_materials_sku_key ON raw_materials(sku);

-- Drop old indexes if they exist
DROP INDEX IF EXISTS product_inventory_tea_name_size_format_quantity_size_key;
DROP INDEX IF EXISTS raw_materials_item_name_category_key;