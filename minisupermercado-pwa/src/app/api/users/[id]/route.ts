import { NextRequest, NextResponse } from 'next/server'
import { UserModel } from '@/lib/database/models'
import { authenticateRequest, requireRole } from '@/lib/auth/middleware'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']).optional(),
  active: z.boolean().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
})

// GET /api/users/[id] - Get user by ID
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

    // Users can view their own profile, or admins/managers can view any user
    const canView = params.id === authResult.user.userId || 
                   ['ADMIN', 'MANAGER'].includes(authResult.user.role)

    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const user = await UserModel.findById(params.id)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error('Get user error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get user' 
      },
      { status: 500 }
    )
  }
}