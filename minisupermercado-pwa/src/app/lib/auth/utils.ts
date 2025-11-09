import jwt from 'jsonwebtoken'
import { UserModel } from '../database/models'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

export const AuthUtils = {
  generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
  },

  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (error) {
      throw new Error('Invalid token')
    }
  },

  async validateUser(email: string, password: string) {
    const user = await UserModel.findByEmail(email)
    
    if (!user || !user.active) {
      throw new Error('Invalid credentials')
    }

    const isValidPassword = await UserModel.validatePassword(password, user.password)
    
    if (!isValidPassword) {
      throw new Error('Invalid credentials')
    }

    // Update last login
    await UserModel.updateLastLogin(user.id)

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }
  },

  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    return authHeader.substring(7)
  },
}
