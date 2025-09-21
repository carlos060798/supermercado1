import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, JWTPayload } from './utils'

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

export const withAuth = (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
  return async (req: NextRequest): Promise<NextResponse> => {
    const user = getUserFromRequest(req)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const authenticatedReq = req as AuthenticatedRequest
    authenticatedReq.user = user

    return handler(authenticatedReq)
  }
}

export const withRole = (allowedRoles: string[]) => {
  return (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
    return async (req: NextRequest): Promise<NextResponse> => {
      const user = getUserFromRequest(req)
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'No autorizado' },
          { status: 401 }
        )
      }

      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { success: false, error: 'Permisos insuficientes' },
          { status: 403 }
        )
      }

      const authenticatedReq = req as AuthenticatedRequest
      authenticatedReq.user = user

      return handler(authenticatedReq)
    }
  }
}

export const optionalAuth = (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
  return async (req: NextRequest): Promise<NextResponse> => {
    const user = getUserFromRequest(req)
    const authenticatedReq = req as AuthenticatedRequest
    authenticatedReq.user = user || undefined

    return handler(authenticatedReq)
  }
}
