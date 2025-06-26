import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { createBillOfMaterialSchema, updateBillOfMaterialSchema } from '../utils/validation';

export async function getBillOfMaterialsByProduct(req: Request, res: Response): Promise<Response> {
  try {
    const { productId } = req.params;
    
    const product = await prisma.productInventory.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({
        error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
      });
    }

    const materials = await prisma.billOfMaterial.findMany({
      where: { productId },
      include: {
        rawMaterial: true,
      },
    });

    return res.json({
      productId,
      productName: product.teaName,
      materials,
    });
  } catch (error) {
    console.error('Get BoM error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch bill of materials' },
    });
  }
}

export async function createBillOfMaterial(req: Request, res: Response): Promise<Response> {
  try {
    const data = createBillOfMaterialSchema.parse(req.body);
    
    // Check if product exists
    const product = await prisma.productInventory.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      return res.status(404).json({
        error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
      });
    }

    // Check if raw material exists
    const rawMaterial = await prisma.rawMaterial.findUnique({
      where: { id: data.rawMaterialId },
    });

    if (!rawMaterial) {
      return res.status(404).json({
        error: { code: 'MATERIAL_NOT_FOUND', message: 'Raw material not found' },
      });
    }

    // Check if combination already exists
    const existing = await prisma.billOfMaterial.findFirst({
      where: {
        productId: data.productId,
        rawMaterialId: data.rawMaterialId,
      },
    });

    if (existing) {
      return res.status(400).json({
        error: { 
          code: 'BOM_EXISTS', 
          message: 'This material is already in the product recipe',
        },
      });
    }

    const bom = await prisma.billOfMaterial.create({
      data,
      include: {
        rawMaterial: true,
      },
    });

    return res.status(201).json({ bom });
  } catch (error) {
    console.error('Create BoM error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create bill of material entry' },
    });
  }
}

export async function updateBillOfMaterial(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    const data = updateBillOfMaterialSchema.parse(req.body);

    const bom = await prisma.billOfMaterial.update({
      where: { id },
      data,
      include: {
        rawMaterial: true,
      },
    });

    return res.json({ bom });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: { code: 'BOM_NOT_FOUND', message: 'Bill of material entry not found' },
      });
    }
    
    console.error('Update BoM error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update bill of material entry' },
    });
  }
}

export async function deleteBillOfMaterial(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;

    await prisma.billOfMaterial.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: { code: 'BOM_NOT_FOUND', message: 'Bill of material entry not found' },
      });
    }
    
    console.error('Delete BoM error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete bill of material entry' },
    });
  }
}