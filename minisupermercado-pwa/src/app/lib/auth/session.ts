import { cookies } from 'next/headers'
import { AuthUtils } from './utils'

export const SessionManager = {
  async getSession() {
    try {
      const cookieStore = cookies()
      const token = cookieStore.get('token')?.value

      if (!token) {
        return null
      }

      const decoded = AuthUtils.verifyToken(token)
      const user = await UserModel.findById(decoded.userId)

      if (!user || !user.active) {
        return null
      }

      return {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    } catch (error) {
      return null
    }
  },

  setSession(token: string) {
    const cookieStore = cookies()
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
  },

  clearSession() {
    const cookieStore = cookies()
    cookieStore.delete('token')
  },
}