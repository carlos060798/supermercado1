import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { ProductModel, SaleModel } from '@/lib/database/models'
import { z } from 'zod'

const syncDownloadSchema = z.object({
  lastSyncTimestamp: z.string().optional(),
  includeProducts: z.boolean().optional(),
  includeSales: z.boolean().optional(),
  includeOwnSalesOnly: z.boolean().optional(),
})

// GET /api/sync/download - Download server changes since last sync
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const params = syncDownloadSchema.parse({
      lastSyncTimestamp: searchParams.get('lastSyncTimestamp'),
      includeProducts: searchParams.get('includeProducts') === 'true',
      includeSales: searchParams.get('includeSales') === 'true',
      includeOwnSalesOnly: searchParams.get('includeOwnSalesOnly') === 'true',
    })

    const lastSync = params.lastSyncTimestamp ? new Date(params.lastSyncTimestamp) : new Date(0)
    const syncData: any = {
      products: [],
      sales: [],
      syncTimestamp: new Date().toISOString(),
    }

    // Get updated products
    if (params.includeProducts !== false) {
      const products = await prisma.product.findMany({
        where: {
          updatedAt: {
            gt: lastSync,
          },
        },
        orderBy: { updatedAt: 'asc' },
      })

      syncData.products = products.map(product => ({
        id: product.id,
        name: product.name,
        code: product.code,
        barcode: product.barcode,
        price: product.price.toNumber(),
        cost: product.cost?.toNumber(),
        stock: product.stock,
        minStock: product.minStock,
        maxStock: product.maxStock,
        category: product.category,
        brand: product.brand,
        description: product.description,
        image: product.image,
        unit: product.unit,
        active: product.active,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      }))
    }

    // Get updated sales
    if (params.includeSales !== false) {
      const salesWhere: any = {
        updatedAt: {
          gt: lastSync,
        },
      }

      // If user only wants their own sales
      if (params.includeOwnSalesOnly) {
        salesWhere.userId = authResult.user.userId
      }

      const sales = await prisma.sale.findMany({
        where: salesWhere,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { updatedAt: 'asc' },
      })

      syncData.sales = sales.map(sale => ({
        id: sale.id,
        saleNumber: sale.saleNumber,
        date: sale.date.toISOString(),
        subtotal: sale.subtotal.toNumber(),
        tax: sale.tax.toNumber(),
        discount: sale.discount.toNumber(),
        total: sale.total.toNumber(),
        paymentMethod: sale.paymentMethod,
        userId: sale.userId,
        customerId: sale.customerId,
        notes: sale.notes,
        status: sale.status,
        synced: sale.synced,
        items: sale.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          productCode: item.product.code,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toNumber(),
          discount: item.discount.toNumber(),
          subtotal: item.subtotal.toNumber(),
        })),
        user: sale.user,
        createdAt: sale.createdAt.toISOString(),
        updatedAt: sale.updatedAt.toISOString(),
      }))
    }

    // Log sync download
    await prisma.aILog.create({
      data: {
        type: 'sync_download',
        prompt: `User ${authResult.user.userId} downloaded sync data`,
        response: `Downloaded ${syncData.products.length} products and ${syncData.sales.length} sales`,
        provider: 'system',
        success: true,
        userId: authResult.user.userId,
      },
    })

    return NextResponse.json({
      success: true,
      data: syncData,
      statistics: {
        productsCount: syncData.products.length,
        salesCount: syncData.sales.length,
        lastSyncTimestamp: params.lastSyncTimestamp,
        newSyncTimestamp: syncData.syncTimestamp,
      },
    })
  } catch (error) {
    console.error('Sync download error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sync download failed' 
      },
      { status: 500 }
    )
  }
}

// POST /api/sync/download - Manual sync trigger
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const body = await request.json()
    const params = syncDownloadSchema.parse(body)

    // Use the same logic as GET but with POST data
    const result = await GET(request)
    
    return result
  } catch (error) {
    console.error('Manual sync error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Manual sync failed' 
      },
      { status: 500 }
    )
  }
}