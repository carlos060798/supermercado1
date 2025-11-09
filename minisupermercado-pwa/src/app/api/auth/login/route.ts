import { NextRequest, NextResponse } from 'next/server'
import { AuthUtils } from '@/lib/auth/utils'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const { email, password } = loginSchema.parse(body)

    // Authenticate user
    const user = await AuthUtils.validateUser(email, password)

    // Generate JWT token
    const token = AuthUtils.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    
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
        error: error instanceof Error ? error.message : 'Authentication failed' 
      },
      { status: 401 }
    )
  }
}