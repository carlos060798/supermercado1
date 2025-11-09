import { NextRequest, NextResponse } from 'next/server'
import { ProductModel } from '@/lib/database/models'
import { authenticateRequest, requireRole } from '@/lib/auth/middleware'
import { z } from 'zod'

const updateProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').optional(),
  code: z.string().min(1, 'Product code is required').optional(),
  barcode: z.string().optional(),
  price: z.number().min(0, 'Price must be positive').optional(),
  cost: z.number().min(0, 'Cost must be positive').optional(),
  stock: z.number().int().min(0, 'Stock must be a positive integer').optional(),
  minStock: z.number().int().min(0, 'Minimum stock must be a positive integer').optional(),
  maxStock: z.number().int().min(0, 'Maximum stock must be a positive integer').optional(),
  category: z.string().min(1, 'Category is required').optional(),
  brand: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  unit: z.string().optional(),
  active: z.boolean().optional(),
})

// GET /api/products/[id] - Get product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateRequest(request)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const product = await ProductModel.findById(params.id)
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error) {
    console.error('Get product error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get product' 
      },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateRequest(request)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    // Check permissions (only ADMIN and MANAGER can update products)
    try {
      requireRole(['ADMIN', 'MANAGER'])(authResult.user)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updateData = updateProductSchema.parse(body)

    // Check if product exists
    const existingProduct = await ProductModel.findById(params.id)
    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if new code conflicts with existing products
    if (updateData.code && updateData.code !== existingProduct.code) {
      const codeExists = await ProductModel.findByCode(updateData.code)
      if (codeExists) {
        return NextResponse.json(
          { success: false, error: 'Product code already exists' },
          { status: 409 }
        )
      }
    }

    // Check if new barcode conflicts with existing products
    if (updateData.barcode && updateData.barcode !== existingProduct.barcode) {
      const barcodeExists = await ProductModel.findByBarcode(updateData.barcode)
      if (barcodeExists) {
        return NextResponse.json(
          { success: false, error: 'Barcode already exists' },
          { status: 409 }
        )
      }
    }

    const updatedProduct = await ProductModel.update(params.id, updateData)

    return NextResponse.json({
      success: true,
      product: updatedProduct,
    })
  } catch (error) {
    console.error('Update product error:', error)
    
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
        error: error instanceof Error ? error.message : 'Failed to update product' 
      },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Soft delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticateRequest(request)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    // Check permissions (only ADMIN can delete products)
    try {
      requireRole(['ADMIN'])(authResult.user)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const product = await ProductModel.findById(params.id)
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    await ProductModel.delete(params.id)

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    })
  } catch (error) {
    console.error('Delete product error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete product' 
      },
      { status: 500 }
    )
  }
}