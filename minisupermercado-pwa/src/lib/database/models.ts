import { prisma } from './connection'
import { User, Product, Sale, SaleItem, CashSession, InventoryMovement, AIConversation } from '@prisma/client'

// User Models
export const UserModel = {
  async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    return prisma.user.create({ data })
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } })
  },

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } })
  },

  async update(id: string, data: Partial<User>) {
    return prisma.user.update({ where: { id }, data })
  },

  async delete(id: string) {
    return prisma.user.delete({ where: { id } })
  },

  async findAll() {
    return prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
  }
}

// Product Models
export const ProductModel = {
  async create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    return prisma.product.create({ data })
  },

  async findById(id: string) {
    return prisma.product.findUnique({ where: { id } })
  },

  async findByBarcode(barcode: string) {
    return prisma.product.findUnique({ where: { barcode } })
  },

  async update(id: string, data: Partial<Product>) {
    return prisma.product.update({ where: { id }, data })
  },

  async delete(id: string) {
    return prisma.product.delete({ where: { id } })
  },

  async findAll() {
    return prisma.product.findMany({ 
      where: { isActive: true },
      orderBy: { name: 'asc' } 
    })
  },

  async findLowStock() {
    return prisma.product.findMany({
      where: {
        isActive: true,
        stock: { lte: prisma.product.fields.minStock }
      },
      orderBy: { stock: 'asc' }
    })
  },

  async updateStock(id: string, quantity: number) {
    return prisma.product.update({
      where: { id },
      data: { stock: { increment: quantity } }
    })
  }
}

// Sale Models
export const SaleModel = {
  async create(data: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>) {
    return prisma.sale.create({ 
      data,
      include: {
        items: {
          include: { product: true }
        },
        user: true
      }
    })
  },

  async findById(id: string) {
    return prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true }
        },
        user: true
      }
    })
  },

  async findByDateRange(startDate: Date, endDate: Date) {
    return prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        items: {
          include: { product: true }
        },
        user: true
      },
      orderBy: { createdAt: 'desc' }
    })
  },

  async findByUser(userId: string) {
    return prisma.sale.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  },

  async getDailyStats(date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        items: {
          include: { product: true }
        }
      }
    })

    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0)
    const totalItems = sales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    )

    return {
      totalSales,
      totalItems,
      salesCount: sales.length,
      sales
    }
  }
}

// Cash Session Models
export const CashSessionModel = {
  async create(data: Omit<CashSession, 'id' | 'openedAt' | 'closedAt'>) {
    return prisma.cashSession.create({ data })
  },

  async findOpenSession(userId: string) {
    return prisma.cashSession.findFirst({
      where: {
        userId,
        status: 'OPEN'
      },
      include: {
        sales: {
          include: {
            items: {
              include: { product: true }
            }
          }
        }
      }
    })
  },

  async closeSession(id: string, endAmount: number, notes?: string) {
    return prisma.cashSession.update({
      where: { id },
      data: {
        status: 'CLOSED',
        endAmount,
        closedAt: new Date(),
        notes
      }
    })
  },

  async getSessionStats(id: string) {
    const session = await prisma.cashSession.findUnique({
      where: { id },
      include: {
        sales: {
          include: {
            items: {
              include: { product: true }
            }
          }
        }
      }
    })

    if (!session) return null

    const totalSales = session.sales.reduce((sum, sale) => sum + Number(sale.total), 0)
    const totalItems = session.sales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    )

    return {
      ...session,
      totalSales,
      totalItems,
      salesCount: session.sales.length
    }
  }
}

// Inventory Movement Models
export const InventoryMovementModel = {
  async create(data: Omit<InventoryMovement, 'id' | 'createdAt'>) {
    return prisma.inventoryMovement.create({ 
      data,
      include: {
        product: true,
        user: true
      }
    })
  },

  async findByProduct(productId: string) {
    return prisma.inventoryMovement.findMany({
      where: { productId },
      include: {
        product: true,
        user: true
      },
      orderBy: { createdAt: 'desc' }
    })
  },

  async findByDateRange(startDate: Date, endDate: Date) {
    return prisma.inventoryMovement.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        product: true,
        user: true
      },
      orderBy: { createdAt: 'desc' }
    })
  }
}

// AI Conversation Models
export const AIConversationModel = {
  async create(data: Omit<AIConversation, 'id' | 'createdAt' | 'updatedAt'>) {
    return prisma.aIConversation.create({ data })
  },

  async findByUser(userId: string) {
    return prisma.aIConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    })
  },

  async update(id: string, data: Partial<AIConversation>) {
    return prisma.aIConversation.update({ where: { id }, data })
  },

  async delete(id: string) {
    return prisma.aIConversation.delete({ where: { id } })
  }
}
