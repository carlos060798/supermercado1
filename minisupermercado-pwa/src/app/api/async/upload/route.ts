import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { ProductModel, SaleModel } from '@/lib/database/models'
import { z } from 'zod'

const syncUploadSchema = z.object({
  products: z.array(z.object({
    id: z.string(),
    localId: z.string().optional(),
    name: z.string(),
    code: z.string(),
    barcode: z.string().optional(),
    price: z.number(),
    cost: z.number().optional(),
    stock: z.number(),
    minStock: z.number(),
    maxStock: z.number().optional(),
    category: z.string(),
    brand: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    unit: z.string().optional(),
    active: z.boolean().optional(),
    lastModified: z.string(),
    action: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  })).optional(),
  sales: z.array(z.object({
    id: z.string(),
    localId: z.string().optional(),
    saleNumber: z.string(),
    date: z.string(),
    subtotal: z.number(),
    tax: z.number(),
    discount: z.number().optional(),
    total: z.number(),
    paymentMethod: z.string(),
    userId: z.string(),
    customerId: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED']).optional(),
    items: z.array(z.object({
      productId: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
      discount: z.number().optional(),
      subtotal: z.number(),
    })),
    lastModified: z.string(),
    action: z.enum(['CREATE', 'UPDATE']),
  })).optional(),
  lastSyncTimestamp: z.string().optional(),
})

// POST /api/sync/upload - Upload offline changes to server
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
    const syncData = syncUploadSchema.parse(body)

    const results = {
      products: { processed: 0, errors: 0, conflicts: [] as any[] },
      sales: { processed: 0, errors: 0, conflicts: [] as any[] },
    }

    // Process product changes
    if (syncData.products) {
      for (const productData of syncData.products) {
        try {
          switch (productData.action) {
            case 'CREATE':
              // Check if product already exists
              const existingProduct = await ProductModel.findByCode(productData.code)
              if (existingProduct) {
                results.products.conflicts.push({
                  localId: productData.localId,
                  serverId: existingProduct.id,
                  reason: 'Product code already exists',
                  data: productData,
                })
                continue
              }

              await ProductModel.create({
                name: productData.name,
                code: productData.code,
                barcode: productData.barcode,
                price: productData.price,
                cost: productData.cost,
                stock: productData.stock,
                minStock: productData.minStock,
                maxStock: productData.maxStock,
                category: productData.category,
                brand: productData.brand,
                description: productData.description,
                image: productData.image,
                unit: productData.unit || 'unidad',
              })
              results.products.processed++
              break

            case 'UPDATE':
              // Check if product exists
              const productToUpdate = await ProductModel.findById(productData.id)
              if (!productToUpdate) {
                results.products.conflicts.push({
                  localId: productData.localId,
                  serverId: productData.id,
                  reason: 'Product not found on server',
                  data: productData,
                })
                continue
              }

              // Check for newer version on server
              const lastModified = new Date(productData.lastModified)
              if (productToUpdate.updatedAt > lastModified) {
                results.products.conflicts.push({
                  localId: productData.localId,
                  serverId: productData.id,
                  reason: 'Server version is newer',
                  serverData: productToUpdate,
                  clientData: productData,
                })
                continue
              }

              await ProductModel.update(productData.id, {
                name: productData.name,
                code: productData.code,
                barcode: productData.barcode,
                price: productData.price,
                cost: productData.cost,
                stock: productData.stock,
                minStock: productData.minStock,
                maxStock: productData.maxStock,
                category: productData.category,
                brand: productData.brand,
                description: productData.description,
                image: productData.image,
                unit: productData.unit,
                active: productData.active,
              })
              results.products.processed++
              break

            case 'DELETE':
              await ProductModel.delete(productData.id)
              results.products.processed++
              break
          }
        } catch (error) {
          console.error('Product sync error:', error)
          results.products.errors++
        }
      }
    }

    // Process sales changes
    if (syncData.sales) {
      for (const saleData of syncData.sales) {
        try {
          switch (saleData.action) {
            case 'CREATE':
              // Check if sale number already exists
              const existingSale = await prisma.sale.findUnique({
                where: { saleNumber: saleData.saleNumber }
              })
              
              if (existingSale) {
                results.sales.conflicts.push({
                  localId: saleData.localId,
                  serverId: existingSale.id,
                  reason: 'Sale number already exists',
                  data: saleData,
                })
                continue
              }

              await SaleModel.create({
                saleNumber: saleData.saleNumber,
                subtotal: saleData.subtotal,
                tax: saleData.tax,
                discount: saleData.discount || 0,
                total: saleData.total,
                paymentMethod: saleData.paymentMethod,
                userId: saleData.userId,
                customerId: saleData.customerId,
                notes: saleData.notes,
                items: saleData.items,
              })
              results.sales.processed++
              break

            case 'UPDATE':
              // Sales typically shouldn't be updated after creation
              // This is mainly for status changes
              const saleToUpdate = await SaleModel.findById(saleData.id)
              if (!saleToUpdate) {
                results.sales.conflicts.push({
                  localId: saleData.localId,
                  serverId: saleData.id,
                  reason: 'Sale not found on server',
                  data: saleData,
                })
                continue
              }

              // Note: Implement sale status updates if needed
              results.sales.processed++
              break
          }
        } catch (error) {
          console.error('Sale sync error:', error)
          results.sales.errors++
        }
      }
    }

    // Update sync timestamp for user
    const syncTimestamp = new Date().toISOString()
    
    // Store sync record (implement if needed for sync history)
    await prisma.aILog.create({
      data: {
        type: 'sync_upload',
        prompt: `User ${authResult.user.userId} uploaded sync data`,
        response: JSON.stringify(results),
        provider: 'system',
        success: true,
        userId: authResult.user.userId,
      },
    })

    return NextResponse.json({
      success: true,
      results,
      syncTimestamp,
      message: `Processed ${results.products.processed} products and ${results.sales.processed} sales`,
    })
  } catch (error) {
    console.error('Sync upload error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid sync data format',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sync upload failed' 
      },
      { status: 500 }
    )
  }
}