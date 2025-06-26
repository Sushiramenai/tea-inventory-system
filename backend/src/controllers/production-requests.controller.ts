import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { createProductionRequestSchema, updateProductionRequestSchema, completeProductionRequestSchema, productionRequestQuerySchema } from '../utils/validation';
import { Prisma } from '@prisma/client';
import { RequestStatus } from '../constants/enums';

export async function getProductionRequests(req: Request, res: Response): Promise<Response> {
  try {
    const query = productionRequestQuerySchema.parse(req.query);
    const { page, limit, status, productId, requestedBy, dateFrom, dateTo } = query;
    
    const where: Prisma.ProductionRequestWhereInput = {
      ...(status && { status }),
      ...(productId && { productId }),
      ...(requestedBy && { requestedById: requestedBy }),
      ...(dateFrom && { requestedAt: { gte: dateFrom } }),
      ...(dateTo && { requestedAt: { lte: dateTo } }),
    };

    const requests = await prisma.productionRequest.findMany({
      where,
      include: {
        product: true,
        requestedBy: {
          select: { id: true, username: true },
        },
        completedBy: {
          select: { id: true, username: true },
        },
        materials: {
          include: {
            rawMaterial: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { requestedAt: 'desc' },
    });

    // Add material availability status
    const requestsWithAvailability = await Promise.all(
      requests.map(async (request) => {
        const materialsWithAvailability = request.materials.map(material => ({
          ...material,
          isAvailable: material.quantityConsumed <= material.rawMaterial.stockQuantity,
        }));

        const allMaterialsAvailable = materialsWithAvailability.every(m => m.isAvailable);

        return {
          ...request,
          materials: materialsWithAvailability,
          allMaterialsAvailable,
        };
      })
    );

    return res.json(requestsWithAvailability);
  } catch (error) {
    console.error('Get production requests error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch production requests' },
    });
  }
}

export async function getProductionRequestById(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    
    const request = await prisma.productionRequest.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            billOfMaterials: {
              include: {
                rawMaterial: true,
              },
            },
          },
        },
        requestedBy: {
          select: { id: true, username: true, email: true },
        },
        completedBy: {
          select: { id: true, username: true, email: true },
        },
        materials: {
          include: {
            rawMaterial: true,
          },
        },
      },
    });

    if (!request) {
      return res.status(404).json({
        error: { code: 'REQUEST_NOT_FOUND', message: 'Production request not found' },
      });
    }

    return res.json(request);
  } catch (error) {
    console.error('Get production request error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch production request' },
    });
  }
}

export async function createProductionRequest(req: Request, res: Response): Promise<Response> {
  try {
    const data = createProductionRequestSchema.parse(req.body);
    
    // Get product with BoM
    const product = await prisma.productInventory.findUnique({
      where: { id: data.productId },
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

    if (product.billOfMaterials.length === 0) {
      return res.status(400).json({
        error: { 
          code: 'NO_BOM', 
          message: 'Product has no bill of materials defined. Please add materials to this product before creating a production request.',
        },
      });
    }

    // Calculate required materials and check availability
    const materialsCheck = await Promise.all(
      product.billOfMaterials.map(async (bom) => {
        const required = Number(bom.quantityRequired) * Number(data.quantityRequested);
        const available = Number(bom.rawMaterial.stockQuantity);
        
        return {
          rawMaterialId: bom.rawMaterialId,
          itemName: bom.rawMaterial.name,
          required,
          available,
          sufficient: available >= required,
        };
      })
    );


    // Create the production request with materials in a transaction
    const request = await prisma.$transaction(async (tx) => {
      // Create the request
      const newRequest = await tx.productionRequest.create({
        data: {
          productId: data.productId,
          quantityRequested: data.quantityRequested,
          requestedById: req.user!.id,
          notes: data.notes,
          status: RequestStatus.pending,
        },
      });

      // Create material records
      await tx.productionRequestMaterial.createMany({
        data: materialsCheck.map(material => ({
          requestId: newRequest.id,
          rawMaterialId: material.rawMaterialId,
          quantityConsumed: material.required,
          quantityAvailableAtRequest: material.available,
        })),
      });

      return newRequest;
    });

    // Fetch complete request with all relations
    const completeRequest = await prisma.productionRequest.findUnique({
      where: { id: request.id },
      include: {
        product: true,
        requestedBy: {
          select: { id: true, username: true },
        },
        materials: {
          include: {
            rawMaterial: true,
          },
        },
      },
    });

    return res.status(201).json(completeRequest);
  } catch (error) {
    console.error('Create production request error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create production request' },
    });
  }
}

export async function updateProductionRequest(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    const data = updateProductionRequestSchema.parse(req.body);

    // Get current request
    const current = await prisma.productionRequest.findUnique({
      where: { id },
    });

    if (!current) {
      return res.status(404).json({
        error: { code: 'REQUEST_NOT_FOUND', message: 'Production request not found' },
      });
    }

    // Check permissions based on status change
    if (data.status === RequestStatus.in_progress) {
      // Only production team can start production
      if (req.user!.role !== 'production' && req.user!.role !== 'admin') {
        return res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Only production team can start production' },
        });
      }
    }

    // Don't allow changes to completed requests
    if (current.status === RequestStatus.completed) {
      return res.status(400).json({
        error: { code: 'REQUEST_COMPLETED', message: 'Cannot modify completed requests' },
      });
    }

    const request = await prisma.productionRequest.update({
      where: { id },
      data: {
        status: data.status,
        notes: data.notes,
      },
      include: {
        product: true,
        requestedBy: {
          select: { id: true, username: true },
        },
        materials: {
          include: {
            rawMaterial: true,
          },
        },
      },
    });

    return res.json(request);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: { code: 'REQUEST_NOT_FOUND', message: 'Production request not found' },
      });
    }
    
    console.error('Update production request error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update production request' },
    });
  }
}

export async function completeProductionRequest(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    const data = completeProductionRequestSchema.parse(req.body);

    // Only production team can complete requests
    if (req.user!.role !== 'production' && req.user!.role !== 'admin') {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Only production team can complete production' },
      });
    }

    // Get request with all details
    const request = await prisma.productionRequest.findUnique({
      where: { id },
      include: {
        product: true,
        materials: {
          include: {
            rawMaterial: true,
          },
        },
      },
    });

    if (!request) {
      return res.status(404).json({
        error: { code: 'REQUEST_NOT_FOUND', message: 'Production request not found' },
      });
    }

    if (request.status === RequestStatus.completed) {
      return res.status(400).json({
        error: { code: 'ALREADY_COMPLETED', message: 'Request is already completed' },
      });
    }

    if (request.status === RequestStatus.cancelled) {
      return res.status(400).json({
        error: { code: 'REQUEST_CANCELLED', message: 'Cannot complete cancelled request' },
      });
    }

    // Check material availability one more time
    const insufficientMaterials = [];
    for (const material of request.materials) {
      const currentQuantity = Number(material.rawMaterial.stockQuantity);
      if (currentQuantity < Number(material.quantityConsumed)) {
        insufficientMaterials.push({
          itemName: material.rawMaterial.name,
          required: material.quantityConsumed,
          available: currentQuantity,
        });
      }
    }

    if (insufficientMaterials.length > 0) {
      return res.status(400).json({
        error: { 
          code: 'INSUFFICIENT_MATERIALS', 
          message: 'Insufficient raw materials',
          details: { insufficientMaterials },
        },
      });
    }

    // Complete the request in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update raw material quantities
      const materialUpdates = [];
      for (const material of request.materials) {
        const newQuantity = Number(material.rawMaterial.stockQuantity) - Number(material.quantityConsumed);

        await tx.rawMaterial.update({
          where: { id: material.rawMaterialId },
          data: {
            stockQuantity: newQuantity,
          },
        });

        materialUpdates.push({
          itemName: material.rawMaterial.name,
          consumed: material.quantityConsumed,
          remaining: newQuantity,
        });
      }

      // Update product inventory
      const newProductCount = Number(request.product.stockQuantity) + Number(request.quantityRequested);
      const updatedProduct = await tx.productInventory.update({
        where: { id: request.productId },
        data: {
          stockQuantity: newProductCount,
        },
      });

      // Mark request as completed
      const completedRequest = await tx.productionRequest.update({
        where: { id },
        data: {
          status: RequestStatus.completed,
          completedById: req.user!.id,
          completedAt: new Date(),
          notes: data.notes || request.notes,
        },
      });

      return {
        request: completedRequest,
        productUpdate: {
          sku: updatedProduct.sku,
          previousCount: request.product.stockQuantity,
          newCount: newProductCount,
        },
        materialUpdates,
      };
    });

    return res.json(result.request);
  } catch (error) {
    console.error('Complete production request error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to complete production request' },
    });
  }
}