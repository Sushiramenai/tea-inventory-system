import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { createRawMaterialSchema, updateRawMaterialSchema, rawMaterialQuerySchema } from '../utils/validation';
import { Prisma } from '@prisma/client';

export async function getRawMaterials(req: Request, res: Response): Promise<Response> {
  try {
    const query = rawMaterialQuerySchema.parse(req.query);
    const { page, limit, search, category, lowStock } = query;
    
    const where: Prisma.RawMaterialWhereInput = {
      ...(search && {
        itemName: { contains: search },
      }),
      ...(category && { category }),
      ...(lowStock && {
        totalQuantity: { lt: prisma.rawMaterial.fields.reorderThreshold },
      }),
    };

    const [materials, total] = await Promise.all([
      prisma.rawMaterial.findMany({
        where,
        include: {
          updatedBy: {
            select: { id: true, username: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ category: 'asc' }, { itemName: 'asc' }],
      }),
      prisma.rawMaterial.count({ where }),
    ]);

    const materialsWithLowStock = materials.map(material => ({
      ...material,
      isLowStock: (material.totalQuantity || 0) < material.reorderThreshold,
    }));

    return res.json({
      materials: materialsWithLowStock,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get raw materials error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch raw materials' },
    });
  }
}

export async function getRawMaterialById(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    
    const material = await prisma.rawMaterial.findUnique({
      where: { id },
      include: {
        billOfMaterials: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!material) {
      return res.status(404).json({
        error: { code: 'MATERIAL_NOT_FOUND', message: 'Raw material not found' },
      });
    }

    return res.json({ material });
  } catch (error) {
    console.error('Get raw material error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch raw material' },
    });
  }
}

export async function createRawMaterial(req: Request, res: Response): Promise<Response> {
  try {
    const data = createRawMaterialSchema.parse(req.body);
    
    // Check if material with same name and category already exists
    const existing = await prisma.rawMaterial.findFirst({
      where: {
        itemName: data.itemName,
        category: data.category,
      },
    });

    if (existing) {
      return res.status(400).json({
        error: { 
          code: 'MATERIAL_EXISTS', 
          message: 'Material with this name and category already exists',
        },
      });
    }

    // Calculate total quantity if quantity per unit is provided
    let totalQuantity: number | undefined;
    if (data.quantityPerUnit) {
      totalQuantity = data.count * data.quantityPerUnit;
    } else {
      totalQuantity = data.count;
    }

    const material = await prisma.rawMaterial.create({
      data: {
        ...data,
        totalQuantity,
        updatedById: req.user!.id,
      },
    });

    return res.status(201).json({ material });
  } catch (error) {
    console.error('Create raw material error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create raw material' },
    });
  }
}

export async function updateRawMaterial(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    const data = updateRawMaterialSchema.parse(req.body);

    // Get current material to calculate new total if needed
    const current = await prisma.rawMaterial.findUnique({
      where: { id },
    });

    if (!current) {
      return res.status(404).json({
        error: { code: 'MATERIAL_NOT_FOUND', message: 'Raw material not found' },
      });
    }

    // Calculate new total quantity
    const count = data.count !== undefined ? data.count : current.count;
    const quantityPerUnit = data.quantityPerUnit !== undefined ? data.quantityPerUnit : current.quantityPerUnit;
    
    let totalQuantity: number;
    if (quantityPerUnit) {
      totalQuantity = Number(count) * Number(quantityPerUnit);
    } else {
      totalQuantity = Number(count);
    }

    const material = await prisma.rawMaterial.update({
      where: { id },
      data: {
        ...data,
        totalQuantity,
        updatedById: req.user!.id,
      },
    });

    return res.json({ material });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: { code: 'MATERIAL_NOT_FOUND', message: 'Raw material not found' },
      });
    }
    
    console.error('Update raw material error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update raw material' },
    });
  }
}

export async function deleteRawMaterial(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;

    // Check if material is used in any bill of materials
    const billOfMaterials = await prisma.billOfMaterial.findFirst({
      where: { rawMaterialId: id },
    });

    if (billOfMaterials) {
      return res.status(400).json({
        error: { 
          code: 'MATERIAL_IN_USE', 
          message: 'Cannot delete material that is used in product recipes',
        },
      });
    }

    // Check if material is used in any production requests
    const productionRequests = await prisma.productionRequestMaterial.findFirst({
      where: { rawMaterialId: id },
    });

    if (productionRequests) {
      return res.status(400).json({
        error: { 
          code: 'MATERIAL_IN_USE', 
          message: 'Cannot delete material that has been used in production requests',
        },
      });
    }

    await prisma.rawMaterial.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: { code: 'MATERIAL_NOT_FOUND', message: 'Raw material not found' },
      });
    }
    
    console.error('Delete raw material error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete raw material' },
    });
  }
}

export async function exportRawMaterials(req: Request, res: Response): Promise<Response | void> {
  try {
    const query = rawMaterialQuerySchema.parse(req.query);
    const { search, category, lowStock } = query;
    
    const where: Prisma.RawMaterialWhereInput = {
      ...(search && {
        itemName: { contains: search },
      }),
      ...(category && { category }),
      ...(lowStock && {
        totalQuantity: { lt: prisma.rawMaterial.fields.reorderThreshold },
      }),
    };

    const materials = await prisma.rawMaterial.findMany({
      where,
      orderBy: [{ category: 'asc' }, { itemName: 'asc' }],
    });

    // Create CSV content
    const headers = ['Item Name', 'Category', 'Count', 'Unit', 'Quantity per Unit', 'Total Quantity', 'Reorder Threshold', 'Low Stock', 'Notes'];
    const rows = materials.map(material => [
      material.itemName,
      material.category,
      material.count.toString(),
      material.unit,
      material.quantityPerUnit?.toString() || '',
      material.totalQuantity?.toString() || material.count.toString(),
      material.reorderThreshold.toString(),
      (material.totalQuantity || 0) < material.reorderThreshold ? 'Yes' : 'No',
      material.notes || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="raw-materials-${new Date().toISOString().split('T')[0]}.csv"`);
    return res.send(csv);
  } catch (error) {
    console.error('Export raw materials error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to export raw materials' },
    });
  }
}