import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { createProductSchema, updateProductSchema, productQuerySchema } from '../utils/validation';
import { Prisma } from '@prisma/client';

export async function getProducts(req: Request, res: Response): Promise<Response> {
  try {
    const query = productQuerySchema.parse(req.query);
    const { page, limit, search, category, lowStock } = query;
    
    const where: Prisma.ProductInventoryWhereInput = {
      ...(search && {
        OR: [
          { teaName: { contains: search } },
          { sku: { contains: search } },
        ],
      }),
      ...(category && { category }),
      ...(lowStock && {
        physicalCount: { lt: prisma.productInventory.fields.reorderThreshold },
      }),
    };

    const [products, total] = await Promise.all([
      prisma.productInventory.findMany({
        where,
        include: {
          updatedBy: {
            select: { id: true, username: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.productInventory.count({ where }),
    ]);

    const productsWithLowStock = products.map(product => ({
      ...product,
      isLowStock: product.physicalCount < product.reorderThreshold,
    }));

    return res.json({
      products: productsWithLowStock,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch products' },
    });
  }
}

export async function getProductBySku(req: Request, res: Response): Promise<Response> {
  try {
    const { sku } = req.params;
    
    const product = await prisma.productInventory.findUnique({
      where: { sku },
      include: {
        billOfMaterials: {
          include: {
            rawMaterial: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
      });
    }

    return res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch product' },
    });
  }
}

export async function getProductById(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    
    const product = await prisma.productInventory.findUnique({
      where: { id },
      include: {
        billOfMaterials: {
          include: {
            rawMaterial: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
      });
    }

    return res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch product' },
    });
  }
}

export async function createProduct(req: Request, res: Response): Promise<Response> {
  try {
    const data = createProductSchema.parse(req.body);
    
    // Check if product with same combination already exists
    const existing = await prisma.productInventory.findFirst({
      where: {
        teaName: data.teaName,
        sizeFormat: data.sizeFormat,
        quantitySize: data.quantitySize,
      },
    });

    if (existing) {
      return res.status(400).json({
        error: { 
          code: 'PRODUCT_EXISTS', 
          message: 'Product with this name, format, and size already exists',
        },
      });
    }

    // Check if SKU is unique
    if (data.sku) {
      const skuExists = await prisma.productInventory.findUnique({
        where: { sku: data.sku },
      });

      if (skuExists) {
        return res.status(400).json({
          error: { code: 'SKU_EXISTS', message: 'SKU already in use' },
        });
      }
    }

    const product = await prisma.productInventory.create({
      data: {
        ...data,
        updatedById: req.user!.id,
      },
    });

    return res.status(201).json({ product });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create product' },
    });
  }
}

export async function updateProduct(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    const data = updateProductSchema.parse(req.body);

    // Check if SKU is being changed and already exists
    if (data.sku) {
      const skuExists = await prisma.productInventory.findFirst({
        where: {
          sku: data.sku,
          NOT: { id },
        },
      });

      if (skuExists) {
        return res.status(400).json({
          error: { code: 'SKU_EXISTS', message: 'SKU already in use' },
        });
      }
    }

    const product = await prisma.productInventory.update({
      where: { id },
      data: {
        ...data,
        updatedById: req.user!.id,
      },
    });

    return res.json({ product });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
      });
    }
    
    console.error('Update product error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update product' },
    });
  }
}

export async function deleteProduct(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;

    // Check if product is used in any production requests
    const productionRequests = await prisma.productionRequest.findFirst({
      where: { productId: id },
    });

    if (productionRequests) {
      return res.status(400).json({
        error: { 
          code: 'PRODUCT_IN_USE', 
          message: 'Cannot delete product that has production requests',
        },
      });
    }

    await prisma.productInventory.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
      });
    }
    
    console.error('Delete product error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete product' },
    });
  }
}

export async function exportProducts(req: Request, res: Response): Promise<Response | void> {
  try {
    const query = productQuerySchema.parse(req.query);
    const { search, category, lowStock } = query;
    
    const where: Prisma.ProductInventoryWhereInput = {
      ...(search && {
        OR: [
          { teaName: { contains: search } },
          { sku: { contains: search } },
        ],
      }),
      ...(category && { category }),
      ...(lowStock && {
        physicalCount: { lt: prisma.productInventory.fields.reorderThreshold },
      }),
    };

    const products = await prisma.productInventory.findMany({
      where,
      orderBy: [{ category: 'asc' }, { teaName: 'asc' }],
    });

    // Create CSV content
    const headers = ['Tea Name', 'Category', 'Size Format', 'Quantity Size', 'SKU', 'Barcode', 'Physical Count', 'Reorder Threshold', 'Low Stock'];
    const rows = products.map(product => [
      product.teaName,
      product.category,
      product.sizeFormat,
      product.quantitySize,
      product.sku || '',
      product.barcode || '',
      product.physicalCount.toString(),
      product.reorderThreshold.toString(),
      product.physicalCount < product.reorderThreshold ? 'Yes' : 'No',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="product-inventory-${new Date().toISOString().split('T')[0]}.csv"`);
    return res.send(csv);
  } catch (error) {
    console.error('Export products error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to export products' },
    });
  }
}