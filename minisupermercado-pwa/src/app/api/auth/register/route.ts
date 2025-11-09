import { NextRequest, NextResponse } from 'next/server'
import { UserModel } from '@/lib/database/models'
import { authenticateRequest, requireRole } from '@/lib/auth/middleware'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Authenticate request (only authenticated users can create new users)
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
    
    // Validate input
    const userData = registerSchema.parse(body)

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
    console.error('Registration error:', error)
    
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
        error: error instanceof Error ? error.message : 'Registration failed' 
      },
      { status: 500 }
    )
  }
}