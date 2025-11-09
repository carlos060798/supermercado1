import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/connection'
import { authenticateRequest } from '@/lib/auth/middleware'
import { z } from 'zod'

const monthlyReportSchema = z.object({
  year: z.string().optional(),
  month: z.string().optional(),
})

// GET /api/reports/monthly - Get monthly sales report
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const params = monthlyReportSchema.parse({
      year: searchParams.get('year'),
      month: searchParams.get('month'),
    })

    const now = new Date()
    const year = parseInt(params.year || now.getFullYear().toString())
    const month = parseInt(params.month || (now.getMonth() + 1).toString())

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    // Get sales for the month
    const sales = await prisma.sale.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Calculate daily breakdown
    const dailyBreakdown: Record<string, { sales: number; revenue: number }> = {}
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {}
    const userSales: Record<string, { name: string; sales: number; revenue: number }> = {}

    let totalRevenue = 0
    let totalSales = 0

    sales.forEach(sale => {
      const day = sale.date.getDate().toString().padStart(2, '0')
      const revenue = sale.total.toNumber()
      
      totalRevenue += revenue
      totalSales += 1

      // Daily breakdown
      if (!dailyBreakdown[day]) {
        dailyBreakdown[day] = { sales: 0, revenue: 0 }
      }
      dailyBreakdown[day].sales += 1
      dailyBreakdown[day].revenue += revenue

      // Product sales
      sale.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.product.name,
            quantity: 0,
            revenue: 0,
          }
        }
        productSales[item.productId].quantity += item.quantity
        productSales[item.productId].revenue += item.subtotal.toNumber()
      })

      // User sales
      if (!userSales[sale.userId]) {
        userSales[sale.userId] = {
          name: sale.user.name,
          sales: 0,
          revenue: 0,
        }
      }
      userSales[sale.userId].sales += 1
      userSales[sale.userId].revenue += revenue
    })

    const report = {
      period: `${year}-${month.toString().padStart(2, '0')}`,
      summary: {
        totalSales,
        totalRevenue,
        averageTicket: totalSales > 0 ? totalRevenue / totalSales : 0,
        daysWithSales: Object.keys(dailyBreakdown).length,
      },
      dailyBreakdown: Object.entries(dailyBreakdown).map(([day, data]) => ({
        day: parseInt(day),
        ...data,
      })).sort((a, b) => a.day - b.day),
      topProducts: Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
      userPerformance: Object.values(userSales)
        .sort((a, b) => b.revenue - a.revenue),
    }

    return NextResponse.json({
      success: true,
      report,
    })
  } catch (error) {
    console.error('Monthly report error:', error)
    
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
        error: 'Failed to generate monthly report' 
      },
      { status: 500 }
    )
  }
}