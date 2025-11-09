import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // In a stateless JWT setup, logout is handled client-side by removing the token
    // However, we can add the token to a blacklist if needed
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Logout error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Logout failed' 
      },
      { status: 500 }
    )
  }
}

// src/app/api/auth/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { UserModel } from '@/lib/database/models'

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const user = await UserModel.findById(authResult.user.userId)
    
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
    console.error('Profile error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get profile' 
      },
      { status: 500 }
    )
  }
}