import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { RequestStatus } from '../constants/enums';

export async function getDashboardStats(req: Request, res: Response): Promise<Response> {
  try {
    const userRole = req.user!.role;
    const stats: any = {};

    // Product stats - visible to all
    const [productTotal, productLowStock] = await Promise.all([
      prisma.productInventory.count(),
      prisma.productInventory.count({
        where: {
          stockQuantity: { lt: prisma.productInventory.fields.reorderLevel },
        },
      }),
    ]);

    stats.products = {
      total: productTotal,
      lowStock: productLowStock,
    };

    // Raw material stats - visible to production and admin
    if (userRole === 'production' || userRole === 'admin') {
      const [materialTotal, materialLowStock] = await Promise.all([
        prisma.rawMaterial.count(),
        prisma.rawMaterial.count({
          where: {
            stockQuantity: { lt: prisma.rawMaterial.fields.reorderLevel },
          },
        }),
      ]);

      stats.rawMaterials = {
        total: materialTotal,
        lowStock: materialLowStock,
      };
    }

    // Production request stats - visible to all
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pendingRequests, inProgressRequests, completedToday] = await Promise.all([
      prisma.productionRequest.count({
        where: { status: RequestStatus.pending },
      }),
      prisma.productionRequest.count({
        where: { status: RequestStatus.in_progress },
      }),
      prisma.productionRequest.count({
        where: {
          status: RequestStatus.completed,
          completedAt: { gte: today },
        },
      }),
    ]);

    stats.productionRequests = {
      pending: pendingRequests,
      inProgress: inProgressRequests,
      completedToday,
    };

    // Recent activity based on role
    if (userRole === 'fulfillment' || userRole === 'admin') {
      const recentProducts = await prisma.productInventory.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          size: true,
          stockQuantity: true,
          updatedAt: true,
        },
      });
      stats.recentProductUpdates = recentProducts;
    }

    if (userRole === 'production' || userRole === 'admin') {
      const recentMaterials = await prisma.rawMaterial.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          stockQuantity: true,
          unit: true,
          updatedAt: true,
        },
      });
      stats.recentMaterialUpdates = recentMaterials;
    }

    return res.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch dashboard statistics' },
    });
  }
}

export async function getLowStockReport(_req: Request, res: Response): Promise<Response> {
  try {
    const [products, rawMaterials] = await Promise.all([
      prisma.productInventory.findMany({
        where: {
          stockQuantity: { lt: prisma.productInventory.fields.reorderLevel },
        },
        select: {
          id: true,
          name: true,
          size: true,
          sku: true,
          stockQuantity: true,
          reorderLevel: true,
        },
        orderBy: {
          stockQuantity: 'asc',
        },
      }),
      prisma.rawMaterial.findMany({
        where: {
          stockQuantity: { lt: prisma.rawMaterial.fields.reorderLevel },
        },
        select: {
          id: true,
          name: true,
          category: true,
          stockQuantity: true,
          unit: true,
          reorderLevel: true,
        },
        orderBy: {
          stockQuantity: 'asc',
        },
      }),
    ]);

    const productsWithDeficit = products.map(p => ({
      ...p,
      deficit: Number(p.reorderLevel) - Number(p.stockQuantity),
    }));

    const materialsWithDeficit = rawMaterials.map(m => ({
      ...m,
      deficit: Number(m.reorderLevel) - Number(m.stockQuantity),
    }));

    return res.json({
      products: productsWithDeficit,
      rawMaterials: materialsWithDeficit,
    });
  } catch (error) {
    console.error('Get low stock report error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch low stock report' },
    });
  }
}