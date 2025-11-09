import { NextRequest, NextResponse } from 'next/server'
import { SaleModel, ProductModel } from '@/lib/database/models'
import { authenticateRequest } from '@/lib/auth/middleware'
import { z } from 'zod'

const createSaleSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0, 'Unit price must be positive'),
    discount: z.number().min(0, 'Discount must be positive').optional(),
  })).min(1, 'At least one item is required'),
  paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'MIXED']),
  discount: z.number().min(0, 'Discount must be positive').optional(),
  customerId: z.string().optional(),
  notes: z.string().optional(),
})

const salesFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  userId: z.string().optional(),
  paymentMethod: z.string().optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
})

// GET /api/sales - Get all sales with filters
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
    const filters = salesFiltersSchema.parse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      userId: searchParams.get('userId'),
      paymentMethod: searchParams.get('paymentMethod'),
      status: searchParams.get('status'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })

    const processedFilters: any = {}

    if (filters.startDate) {
      processedFilters.startDate = new Date(filters.startDate)
    }
    
    if (filters.endDate) {
      processedFilters.endDate = new Date(filters.endDate)
    }
    
    if (filters.userId) {
      processedFilters.userId = filters.userId
    }
    
    if (filters.paymentMethod) {
      processedFilters.paymentMethod = filters.paymentMethod
    }
    
    if (filters.status) {
      processedFilters.status = filters.status
    }

    const sales = await SaleModel.findAll(processedFilters)

    // Apply pagination if requested
    const page = parseInt(filters.page || '1')
    const limit = parseInt(filters.limit || '50')
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit

    const paginatedSales = sales.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      sales: paginatedSales,
      pagination: {
        page,
        limit,
        total: sales.length,
        totalPages: Math.ceil(sales.length / limit),
      },
    })
  } catch (error) {
    console.error('Get sales error:', error)
    
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
        error: 'Failed to get sales' 
      },
      { status: 500 }
    )
  }
}

// POST /api/sales - Create new sale
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
    const saleData = createSaleSchema.parse(body)

    // Validate all products exist and have sufficient stock
    for (const item of saleData.items) {
      const product = await ProductModel.findById(item.productId)
      
      if (!product || !product.active) {
        return NextResponse.json(
          { success: false, error: `Product ${item.productId} not found or inactive` },
          { status: 400 }
        )
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Insufficient stock for product ${product.name}. Available: ${product.stock}, Required: ${item.quantity}` 
          },
          { status: 400 }
        )
      }
    }

    // Calculate totals
    const subtotal = saleData.items.reduce((sum, item) => {
      const itemSubtotal = (item.quantity * item.unitPrice) - (item.discount || 0)
      return sum + itemSubtotal
    }, 0)

    const globalDiscount = saleData.discount || 0
    const discountedSubtotal = subtotal - globalDiscount
    const tax = discountedSubtotal * 0.12 // 12% IVA
    const total = discountedSubtotal + tax

    // Generate sale number
    const saleNumber = await SaleModel.generateSaleNumber()

    // Prepare sale items with calculated subtotals
    const items = saleData.items.map(item => ({
      ...item,
      discount: item.discount || 0,
      subtotal: (item.quantity * item.unitPrice) - (item.discount || 0),
    }))

    // Create the sale
    const sale = await SaleModel.create({
      saleNumber,
      subtotal: discountedSubtotal,
      tax,
      discount: globalDiscount,
      total,
      paymentMethod: saleData.paymentMethod,
      userId: authResult.user.userId,
      customerId: saleData.customerId,
      notes: saleData.notes,
      items,
    })

    // Get the complete sale with relations
    const completeSale = await SaleModel.findById(sale.id)

    return NextResponse.json({
      success: true,
      sale: completeSale,
    })
  } catch (error) {
    console.error('Create sale error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid input data',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create sale' 
      },
      { status: 500 }
    )
  }
}