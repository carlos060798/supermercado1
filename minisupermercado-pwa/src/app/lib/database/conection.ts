import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// src/lib/database/models.ts
import { prisma } from './connection'
import bcrypt from 'bcryptjs'

// User model functions
export const UserModel = {
  async create(data: {
    email: string
    name: string
    password: string
    role?: 'ADMIN' | 'MANAGER' | 'CASHIER'
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 12)
    return prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
      },
    })
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    })
  },

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
      },
    })
  },

  async validatePassword(plainPassword: string, hashedPassword: string) {
    return bcrypt.compare(plainPassword, hashedPassword)
  },

  async updateLastLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: { updatedAt: new Date() },
    })
  },
}

// Product model functions
export const ProductModel = {
  async create(data: {
    name: string
    code: string
    barcode?: string
    price: number
    cost?: number
    stock: number
    minStock?: number
    maxStock?: number
    category: string
    brand?: string
    description?: string
    image?: string
    unit?: string
  }) {
    return prisma.product.create({
      data,
    })
  },

  async findAll(filters?: {
    category?: string
    active?: boolean
    lowStock?: boolean
    search?: string
  }) {
    const where: any = {}
    
    if (filters?.category) {
      where.category = filters.category
    }
    
    if (filters?.active !== undefined) {
      where.active = filters.active
    }
    
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { barcode: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    if (filters?.lowStock) {
      return products.filter(product => product.stock <= product.minStock)
    }

    return products
  },

  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
    })
  },

  async findByCode(code: string) {
    return prisma.product.findUnique({
      where: { code },
    })
  },

  async findByBarcode(barcode: string) {
    return prisma.product.findUnique({
      where: { barcode },
    })
  },

  async update(id: string, data: Partial<{
    name: string
    code: string
    barcode?: string
    price: number
    cost?: number
    stock: number
    minStock: number
    maxStock?: number
    category: string
    brand?: string
    description?: string
    image?: string
    unit: string
    active: boolean
  }>) {
    return prisma.product.update({
      where: { id },
      data,
    })
  },

  async updateStock(id: string, quantity: number, type: 'SALE' | 'PURCHASE' | 'ADJUSTMENT') {
    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      throw new Error('Product not found')
    }

    const newStock = type === 'SALE' 
      ? product.stock - quantity 
      : product.stock + quantity

    if (newStock < 0) {
      throw new Error('Insufficient stock')
    }

    // Update product stock and create movement record
    const [updatedProduct] = await prisma.$transaction([
      prisma.product.update({
        where: { id },
        data: { stock: newStock },
      }),
      prisma.stockMovement.create({
        data: {
          productId: id,
          type,
          quantity,
          previousStock: product.stock,
          newStock,
        },
      }),
    ])

    return updatedProduct
  },

  async delete(id: string) {
    return prisma.product.update({
      where: { id },
      data: { active: false },
    })
  },
}

// Sale model functions
export const SaleModel = {
  async create(data: {
    saleNumber: string
    subtotal: number
    tax: number
    discount?: number
    total: number
    paymentMethod: string
    userId: string
    customerId?: string
    notes?: string
    items: Array<{
      productId: string
      quantity: number
      unitPrice: number
      discount?: number
      subtotal: number
    }>
  }) {
    return prisma.$transaction(async (tx) => {
      // Create the sale
      const sale = await tx.sale.create({
        data: {
          saleNumber: data.saleNumber,
          subtotal: data.subtotal,
          tax: data.tax,
          discount: data.discount || 0,
          total: data.total,
          paymentMethod: data.paymentMethod,
          userId: data.userId,
          customerId: data.customerId,
          notes: data.notes,
        },
      })

      // Create sale items and update stock
      for (const item of data.items) {
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            subtotal: item.subtotal,
          },
        })

        // Update product stock
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        })

        if (!product) {
          throw new Error(`Product ${item.productId} not found`)
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.name}`)
        }

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: product.stock - item.quantity },
        })

        // Create stock movement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'SALE',
            quantity: item.quantity,
            previousStock: product.stock,
            newStock: product.stock - item.quantity,
            reference: sale.id,
          },
        })
      }

      return sale
    })
  },

  async findAll(filters?: {
    startDate?: Date
    endDate?: Date
    userId?: string
    paymentMethod?: string
    status?: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'
  }) {
    const where: any = {}
    
    if (filters?.startDate && filters?.endDate) {
      where.date = {
        gte: filters.startDate,
        lte: filters.endDate,
      }
    }
    
    if (filters?.userId) {
      where.userId = filters.userId
    }
    
    if (filters?.paymentMethod) {
      where.paymentMethod = filters.paymentMethod
    }
    
    if (filters?.status) {
      where.status = filters.status
    }

    return prisma.sale.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    })
  },

  async findById(id: string) {
    return prisma.sale.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
                barcode: true,
              },
            },
          },
        },
      },
    })
  },

  async generateSaleNumber() {
    const today = new Date()
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '')
    
    const lastSale = await prisma.sale.findFirst({
      where: {
        saleNumber: {
          startsWith: datePrefix,
        },
      },
      orderBy: { saleNumber: 'desc' },
    })

    let sequence = 1
    if (lastSale) {
      const lastSequence = parseInt(lastSale.saleNumber.slice(-4))
      sequence = lastSequence + 1
    }

    return `${datePrefix}${sequence.toString().padStart(4, '0')}`
  },

  async getDailySummary(date: Date, userId?: string) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const where: any = {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: 'COMPLETED',
    }

    if (userId) {
      where.userId = userId
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    const totalSales = sales.length
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total.toNumber(), 0)
    const totalCash = sales
      .filter(sale => sale.paymentMethod === 'CASH')
      .reduce((sum, sale) => sum + sale.total.toNumber(), 0)
    const totalCard = sales
      .filter(sale => sale.paymentMethod === 'CARD')
      .reduce((sum, sale) => sum + sale.total.toNumber(), 0)

    return {
      date: date.toISOString().slice(0, 10),
      totalSales,
      totalRevenue,
      totalCash,
      totalCard,
      averageTicket: totalSales > 0 ? totalRevenue / totalSales : 0,
      sales,
    }
  },
}

// Customer model functions
export const CustomerModel = {
  async create(data: {
    name: string
    email?: string
    phone?: string
    address?: string
    document?: string
  }) {
    return prisma.customer.create({
      data,
    })
  },

  async findAll(search?: string) {
    const where: any = { active: true }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { document: { contains: search, mode: 'insensitive' } },
      ]
    }

    return prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
    })
  },

  async findById(id: string) {
    return prisma.customer.findUnique({
      where: { id },
    })
  },

  async update(id: string, data: Partial<{
    name: string
    email?: string
    phone?: string
    address?: string
    document?: string
  }>) {
    return prisma.customer.update({
      where: { id },
      data,
    })
  },

  async delete(id: string) {
    return prisma.customer.update({
      where: { id },
      data: { active: false },
    })
  },
}