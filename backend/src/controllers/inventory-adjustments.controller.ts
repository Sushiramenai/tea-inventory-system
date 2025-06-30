import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { createInventoryAdjustmentSchema } from '../utils/validation';

export async function createAdjustment(req: Request, res: Response): Promise<Response> {
  try {
    const data = createInventoryAdjustmentSchema.parse(req.body);
    
    // Start a transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get current material state
      const material = await tx.rawMaterial.findUnique({
        where: { id: data.rawMaterialId },
      });

      if (!material) {
        throw new Error('Material not found');
      }

      const quantityBefore = material.stockQuantity;
      const quantityAfter = quantityBefore + data.adjustmentAmount;

      if (quantityAfter < 0) {
        throw new Error('Adjustment would result in negative stock');
      }

      // Create adjustment record
      const adjustment = await tx.inventoryAdjustment.create({
        data: {
          rawMaterialId: data.rawMaterialId,
          adjustmentType: data.adjustmentType,
          quantityBefore,
          quantityAfter,
          reason: data.reason,
          adjustedById: req.user!.id,
        },
      });

      // Update material stock
      const updatedMaterial = await tx.rawMaterial.update({
        where: { id: data.rawMaterialId },
        data: { 
          stockQuantity: quantityAfter,
          updatedById: req.user!.id,
        },
      });

      return { adjustment, material: updatedMaterial };
    });

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('Create adjustment error:', error);
    
    if (error.message === 'Material not found') {
      return res.status(404).json({
        error: { code: 'MATERIAL_NOT_FOUND', message: error.message },
      });
    }
    
    if (error.message === 'Adjustment would result in negative stock') {
      return res.status(400).json({
        error: { code: 'INVALID_ADJUSTMENT', message: error.message },
      });
    }
    
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create adjustment' },
    });
  }
}

export async function getMaterialAdjustments(req: Request, res: Response): Promise<Response> {
  try {
    const { materialId } = req.params;
    
    const adjustments = await prisma.inventoryAdjustment.findMany({
      where: { rawMaterialId: materialId },
      include: {
        adjustedBy: {
          select: { id: true, username: true },
        },
      },
      orderBy: { adjustedAt: 'desc' },
      take: 50,
    });

    return res.json(adjustments);
  } catch (error) {
    console.error('Get material adjustments error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch adjustments' },
    });
  }
}

export async function getRecentAdjustments(_req: Request, res: Response): Promise<Response> {
  try {
    const adjustments = await prisma.inventoryAdjustment.findMany({
      where: {
        rawMaterialId: { not: null },
      },
      include: {
        adjustedBy: {
          select: { id: true, username: true },
        },
      },
      orderBy: { adjustedAt: 'desc' },
      take: 100,
    });

    return res.json(adjustments);
  } catch (error) {
    console.error('Get recent adjustments error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch adjustments' },
    });
  }
}