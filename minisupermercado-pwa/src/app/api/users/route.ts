import { NextRequest, NextResponse } from 'next/server'
import { UserModel } from '@/lib/database/models'
import { authenticateRequest, requireRole } from '@/lib/auth/middleware'
import { z } from 'zod'

const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']).optional(),
})

const usersFiltersSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']).optional(),
  active: z.string().optional(),
  search: z.string().optional(),
})

// GET /api/users - Get all users (Admin/Manager only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    // Check permissions (only ADMIN and MANAGER can view users)
    try {
      requireRole(['ADMIN', 'MANAGER'])(authResult.user)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const filters = usersFiltersSchema.parse({
      role: searchParams.get('role'),
      active: searchParams.get('active'),
      search: searchParams.get('search'),
    })

    // Build where clause
    const where: any = {}
    
    if (filters.role) {
      where.role = filters.role
    }
    
    if (filters.active !== undefined) {
      where.active = filters.active === 'true'
    }
    
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      success: true,
      users,
      count: users.length,
    })
  } catch (error) {
    console.error('Get users error:', error)
    
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
        error: 'Failed to get users' 
      },
      { status: 500 }
    )
  }
}

// POST /api/users - Create new user (Admin/Manager only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    // Check permissions (only ADMIN and MANAGER can create users)
    try {
      requireRole(['ADMIN', 'MANAGER'])(authResult.user)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const userData = createUserSchema.parse(body)

    // Additional permission check: only ADMIN can create ADMIN users
    if (userData.role === 'ADMIN' && authResult.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only administrators can create admin users' },
        { status: 403 }
      )
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(userData.email)
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists' },
        { status: 409 }
      )
    }

    // Create user
    const newUser = await UserModel.create({
      email: userData.email,
      name: userData.name,
      password: userData.password,
      role: userData.role || 'CASHIER',
    })

    return NextResponse.json({
      success: true,
      user: newUser,
    })
  } catch (error) {
    console.error('Create user error:', error)
    
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
        error: error instanceof Error ? error.message : 'Failed to create user' 
      },
      { status: 500 }
    )
  }
}