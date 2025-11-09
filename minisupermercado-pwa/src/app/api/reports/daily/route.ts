import { NextRequest, NextResponse } from 'next/server'
import { SaleModel } from '@/lib/database/models'
import { authenticateRequest } from '@/lib/auth/middleware'
import { z } from 'zod'

const dailyReportSchema = z.object({
  date: z.string().optional(),
  userId: z.string().optional(),
})

// GET /api/reports/daily - Get daily sales report
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
    const params = dailyReportSchema.parse({
      date: searchParams.get('date'),
      userId: searchParams.get('userId'),
    })

    const reportDate = params.date ? new Date(params.date) : new Date()
    const userId = params.userId || undefined

    const dailySummary = await SaleModel.getDailySummary(reportDate, userId)

    // Calculate additional metrics
    const paymentMethods = {
      cash: 0,
      card: 0,
      transfer: 0,
      mixed: 0,
    }

    const hourlyBreakdown: Record<string, { sales: number; revenue: number }> = {}
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {}

    dailySummary.sales.forEach(sale => {
      // Payment methods breakdown
      const method = sale.paymentMethod.toLowerCase() as keyof typeof paymentMethods
      if (paymentMethods.hasOwnProperty(method)) {
        paymentMethods[method] += sale.total.toNumber()
      }

      // Hourly breakdown
      const hour = sale.date.getHours()
      const hourKey = `${hour}:00-${hour + 1}:00`
      
      if (!hourlyBreakdown[hourKey]) {
        hourlyBreakdown[hourKey] = { sales: 0, revenue: 0 }
      }
      
      hourlyBreakdown[hourKey].sales += 1
      hourlyBreakdown[hourKey].revenue += sale.total.toNumber()

      // Product sales breakdown
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
    })

    // Get top selling products
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    const report = {
      date: reportDate.toISOString().split('T')[0],
      summary: {
        totalSales: dailySummary.totalSales,
        totalRevenue: dailySummary.totalRevenue,
        averageTicket: dailySummary.averageTicket,
        totalCash: dailySummary.totalCash,
        totalCard: dailySummary.totalCard,
      },
      paymentMethods,
      hourlyBreakdown: Object.entries(hourlyBreakdown).map(([hour, data]) => ({
        hour,
        ...data,
      })),
      topProducts,
      rawSales: dailySummary.sales.map(sale => ({
        id: sale.id,
        saleNumber: sale.saleNumber,
        total: sale.total.toNumber(),
        paymentMethod: sale.paymentMethod,
        time: sale.date.toISOString(),
        itemsCount: sale.items.length,
      })),
    }

    return NextResponse.json({
      success: true,
      report,
    })
  } catch (error) {
    console.error('Daily report error:', error)
    
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
        error: 'Failed to generate daily report' 
      },
      { status: 500 }
    )
  }
}