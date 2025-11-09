import { NextRequest, NextResponse } from 'next/server'
import { ProductModel } from '@/lib/database/models'
import { authenticateRequest, requireRole } from '@/lib/auth/middleware'
import { z } from 'zod'

const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  code: z.string().min(1, 'Product code is required'),
  barcode: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  cost: z.number().min(0, 'Cost must be positive').optional(),
  stock: z.number().int().min(0, 'Stock must be a positive integer'),
  minStock: z.number().int().min(0, 'Minimum stock must be a positive integer').optional(),
  maxStock: z.number().int().min(0, 'Maximum stock must be a positive integer').optional(),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  unit: z.string().optional(),
})

const productFiltersSchema = z.object({
  category: z.string().optional(),
  active: z.string().optional(),
  lowStock: z.string().optional(),
  search: z.string().optional(),
})

// GET /api/products - Get all products with filters
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
    const filters = productFiltersSchema.parse({
      category: searchParams.get('category'),
      active: searchParams.get('active'),
      lowStock: searchParams.get('lowStock'),
      search: searchParams.get('search'),
    })

    const processedFilters = {
      category: filters.category,
      active: filters.active ? filters.active === 'true' : undefined,
      lowStock: filters.lowStock ? filters.lowStock === 'true' : undefined,
      search: filters.search,
    }

    const products = await ProductModel.findAll(processedFilters)

    return NextResponse.json({
      success: true,
      products,
      count: products.length,
    })
  } catch (error) {
    console.error('Get products error:', error)
    
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
        error: 'Failed to get products' 
      },
      { status: 500 }
    )
  }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    // Check permissions (only ADMIN and MANAGER can create products)
    try {
      requireRole(['ADMIN', 'MANAGER'])(authResult.user)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const productData = createProductSchema.parse(body)

    // Check if product code already exists
    const existingProduct = await ProductModel.findByCode(productData.code)
    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product code already exists' },
        { status: 409 }
      )
    }

    // Check if barcode already exists (if provided)
    if (productData.barcode) {
      const existingBarcode = await ProductModel.findByBarcode(productData.barcode)
      if (existingBarcode) {
        return NextResponse.json(
          { success: false, error: 'Barcode already exists' },
          { status: 409 }
        )
      }
    }

    const product = await ProductModel.create({
      ...productData,
      minStock: productData.minStock || 5,
      unit: productData.unit || 'unidad',
    })

    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error) {
    console.error('Create product error:', error)
    
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
        error: error instanceof Error ? error.message : 'Failed to create product' 
      },
      { status: 500 }
    )
  }
}