import { NextRequest, NextResponse } from 'next/server'
import { SaleModel } from '@/lib/database/models'
import { authenticateRequest, requireRole } from '@/lib/auth/middleware'
import { z } from 'zod'

const updateSaleSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED']).optional(),
  notes: z.string().optional(),
})

// GET /api/sales/[id] - Get sale by ID
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

    const sale = await SaleModel.findById(params.id)
    
    if (!sale) {
      return NextResponse.json(
        { success: false, error: 'Sale not found' },
        { status: 404 }
      )
    }

    // Check if user can access this sale (own sale or admin/manager)
    if (sale.userId !== authResult.user.userId && !['ADMIN', 'MANAGER'].includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      sale,
    })
  } catch (error) {
    console.error('Get sale error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get sale' 
      },
      { status: 500 }
    )
  }
}

// PUT /api/sales/[id] - Update sale (mainly for status changes)
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

    // Check permissions (only ADMIN and MANAGER can update sales)
    try {
      requireRole(['ADMIN', 'MANAGER'])(authResult.user)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updateData = updateSaleSchema.parse(body)

    const sale = await SaleModel.findById(params.id)
    if (!sale) {
      return NextResponse.json(
        { success: false, error: 'Sale not found' },
        { status: 404 }
      )
    }

    // Note: Updating sale status might require additional business logic
    // For example, if changing from COMPLETED to CANCELLED, we might need to restore stock
    
    return NextResponse.json({
      success: true,
      message: 'Sale updated successfully (implementation pending)',
      sale,
    })
  } catch (error) {
    console.error('Update sale error:', error)
    
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
        error: 'Failed to update sale' 
      },
      { status: 500 }
    )
  }
}