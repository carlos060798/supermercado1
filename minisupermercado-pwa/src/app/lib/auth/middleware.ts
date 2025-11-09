import { NextRequest } from 'next/server'
import { AuthUtils } from './utils'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string
    email: string
    role: string
  }
}

export async function authenticateRequest(request: NextRequest): Promise<{ user: any } | { error: string }> {
  try {
    const authHeader = request.headers.get('authorization')
    const token = AuthUtils.extractTokenFromHeader(authHeader || '')

    if (!token) {
      return { error: 'No token provided' }
    }

    const decoded = AuthUtils.verifyToken(token)
    const user = await UserModel.findById(decoded.userId)

    if (!user || !user.active) {
      return { error: 'User not found or inactive' }
    }

    return {
      user: {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    }
  } catch (error) {
    return { error: 'Invalid token' }
  }
}

export function requireRole(allowedRoles: string[]) {
  return (user: { role: string }) => {
    if (!allowedRoles.includes(user.role)) {
      throw new Error('Insufficient permissions')
    }
  }
}
