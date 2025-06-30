import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { RequestStatus } from '../constants/enums';

// Mock Shopify data for testing - in production this would come from Shopify API
const mockShopifyOrders = [
  {
    shopifyOrderId: 'shop-1001',
    shopifyOrderNumber: '#1001',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    shippingMethod: 'Standard',
    tags: 'VIP',
    items: [
      { sku: 'PROD-GREEN-001', quantity: 2, price: 29.99 },
      { sku: 'PROD-BLACK-001', quantity: 1, price: 27.99 }
    ]
  },
  {
    shopifyOrderId: 'shop-1002',
    shopifyOrderNumber: '#1002',
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com',
    shippingMethod: 'Express',
    tags: null,
    items: [
      { sku: 'PROD-GREEN-TIN-001', quantity: 3, price: 45.99 }
    ]
  },
  {
    shopifyOrderId: 'shop-1003',
    shopifyOrderNumber: '#1003',
    customerName: 'Bob Wilson',
    customerEmail: 'bob@example.com',
    shippingMethod: 'Priority',
    tags: 'Wholesale',
    items: [
      { sku: 'PROD-BLACK-BOX-001', quantity: 5, price: 24.99 },
      { sku: 'PROD-SAMPLER-001', quantity: 10, price: 29.99 }
    ]
  }
];

export async function syncShopifyOrders(req: Request, res: Response): Promise<Response> {
  try {
    // In production, this would fetch from Shopify API
    // For now, we'll use mock data
    const newOrders = [];
    
    for (const mockOrder of mockShopifyOrders) {
      // Check if order already exists
      const existingOrder = await prisma.shopifyOrder.findUnique({
        where: { shopifyOrderId: mockOrder.shopifyOrderId }
      });
      
      if (!existingOrder) {
        // Match SKUs to products
        const orderItems = [];
        for (const item of mockOrder.items) {
          const product = await prisma.productInventory.findUnique({
            where: { sku: item.sku }
          });
          
          if (product) {
            orderItems.push({
              productId: product.id,
              shopifySku: item.sku,
              quantity: item.quantity,
              price: item.price
            });
          }
        }
        
        if (orderItems.length > 0) {
          const order = await prisma.shopifyOrder.create({
            data: {
              shopifyOrderId: mockOrder.shopifyOrderId,
              shopifyOrderNumber: mockOrder.shopifyOrderNumber,
              customerName: mockOrder.customerName,
              customerEmail: mockOrder.customerEmail,
              shippingMethod: mockOrder.shippingMethod,
              status: 'pending',
              tags: mockOrder.tags,
              syncedAt: new Date(),
              items: {
                create: orderItems
              }
            },
            include: {
              items: {
                include: {
                  product: true
                }
              }
            }
          });
          
          // Create stock reservations
          for (const item of order.items) {
            await prisma.stockReservation.create({
              data: {
                productId: item.productId,
                quantity: item.quantity,
                reservationType: 'shopify_order',
                orderItemId: item.id
              }
            });
          }
          
          newOrders.push(order);
        }
      }
    }
    
    return res.json({
      message: `Synced ${newOrders.length} new orders`,
      orders: newOrders
    });
  } catch (error) {
    console.error('Sync Shopify orders error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to sync Shopify orders' }
    });
  }
}

export async function getShopifyOrders(req: Request, res: Response): Promise<Response> {
  try {
    const { status, shippingMethod, tags } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    if (shippingMethod) where.shippingMethod = shippingMethod;
    if (tags) where.tags = { contains: tags as string };
    
    const orders = await prisma.shopifyOrder.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
            reservation: true
          }
        },
        processedBy: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Calculate available to promise for each item
    const ordersWithAvailability = await Promise.all(
      orders.map(async (order) => {
        const itemsWithAvailability = await Promise.all(
          order.items.map(async (item) => {
            const totalReservations = await prisma.stockReservation.aggregate({
              where: { productId: item.productId },
              _sum: { quantity: true }
            });
            
            const availableToPromise = item.product.stockQuantity - (totalReservations._sum.quantity || 0);
            
            return {
              ...item,
              availableToPromise,
              canFulfill: availableToPromise >= 0
            };
          })
        );
        
        return {
          ...order,
          items: itemsWithAvailability,
          canFulfill: itemsWithAvailability.every(item => item.canFulfill)
        };
      })
    );
    
    return res.json({ orders: ordersWithAvailability });
  } catch (error) {
    console.error('Get Shopify orders error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch Shopify orders' }
    });
  }
}

const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'ready_to_ship', 'shipped', 'cancelled']),
  notes: z.string().optional()
});

export async function updateOrderStatus(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    const validation = updateOrderStatusSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: validation.error.errors[0]?.message || 'Validation error' }
      });
    }
    
    const { status, notes } = validation.data;
    
    // If cancelling, release reservations
    if (status === 'cancelled') {
      const order = await prisma.shopifyOrder.findUnique({
        where: { id },
        include: { items: true }
      });
      
      if (order) {
        for (const item of order.items) {
          await prisma.stockReservation.deleteMany({
            where: { orderItemId: item.id }
          });
        }
      }
    }
    
    const updatedOrder = await prisma.shopifyOrder.update({
      where: { id },
      data: {
        status,
        notes,
        processedById: req.user!.id
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
    
    return res.json({ order: updatedOrder });
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update order status' }
    });
  }
}

export async function generatePickList(req: Request, res: Response): Promise<Response> {
  try {
    const { orderIds } = req.body;
    
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Order IDs are required' }
      });
    }
    
    const orders = await prisma.shopifyOrder.findMany({
      where: {
        id: { in: orderIds },
        status: { in: ['pending', 'ready_to_ship'] }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
    
    // Group items by product and bin location
    const pickItems: Record<string, {
      product: any;
      totalQuantity: number;
      orders: Array<{ orderId: string; orderNumber: string; quantity: number }>;
    }> = {};
    
    for (const order of orders) {
      for (const item of order.items) {
        const key = item.productId;
        
        if (!pickItems[key]) {
          pickItems[key] = {
            product: item.product,
            totalQuantity: 0,
            orders: []
          };
        }
        
        pickItems[key].totalQuantity += item.quantity;
        pickItems[key].orders.push({
          orderId: order.id,
          orderNumber: order.shopifyOrderNumber,
          quantity: item.quantity
        });
      }
    }
    
    // Sort by bin location
    const sortedPickList = Object.values(pickItems).sort((a, b) => {
      const locA = a.product.binLocation || 'ZZZ';
      const locB = b.product.binLocation || 'ZZZ';
      return locA.localeCompare(locB);
    });
    
    return res.json({
      pickList: sortedPickList,
      totalOrders: orders.length,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Generate pick list error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to generate pick list' }
    });
  }
}

export async function generatePackingSlip(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    
    const order = await prisma.shopifyOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
    
    if (!order) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Order not found' }
      });
    }
    
    const packingSlip = {
      orderNumber: order.shopifyOrderNumber,
      customerName: order.customerName,
      shippingMethod: order.shippingMethod,
      orderDate: order.createdAt,
      items: order.items.map(item => ({
        sku: item.product.sku,
        name: item.product.name,
        size: item.product.size,
        quantity: item.quantity
      })),
      specialInstructions: order.notes,
      brewingInstructions: 'Enjoy your premium tea! For best results, steep in water heated to the recommended temperature for each tea type.'
    };
    
    return res.json({ packingSlip });
  } catch (error) {
    console.error('Generate packing slip error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to generate packing slip' }
    });
  }
}

const createReservationSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  notes: z.string().optional()
});

export async function createStockReservation(req: Request, res: Response): Promise<Response> {
  try {
    const validation = createReservationSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: validation.error.errors[0]?.message || 'Validation error' }
      });
    }
    
    const { productId, quantity, notes } = validation.data;
    
    // Check available stock
    const product = await prisma.productInventory.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Product not found' }
      });
    }
    
    const totalReservations = await prisma.stockReservation.aggregate({
      where: { productId },
      _sum: { quantity: true }
    });
    
    const availableToPromise = product.stockQuantity - (totalReservations._sum.quantity || 0);
    
    if (availableToPromise < quantity) {
      return res.status(400).json({
        error: { 
          code: 'INSUFFICIENT_STOCK', 
          message: `Only ${availableToPromise} units available to reserve`
        }
      });
    }
    
    const reservation = await prisma.stockReservation.create({
      data: {
        productId,
        quantity,
        reservationType: 'manual',
        notes,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });
    
    return res.json({ reservation });
  } catch (error) {
    console.error('Create stock reservation error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create stock reservation' }
    });
  }
}

export async function releaseStockReservation(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    
    await prisma.stockReservation.delete({
      where: { id }
    });
    
    return res.json({ message: 'Reservation released successfully' });
  } catch (error) {
    console.error('Release stock reservation error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to release stock reservation' }
    });
  }
}