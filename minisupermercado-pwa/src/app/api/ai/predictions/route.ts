import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { AIBalancer } from '@/lib/ai/balancer'
import { SaleModel, ProductModel } from '@/lib/database/models'
import { z } from 'zod'

const predictionSchema = z.object({
  type: z.enum(['sales', 'stock', 'demand']),
  period: z.enum(['week', 'month', 'quarter']),
  productId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, period, productId } = predictionSchema.parse(body)

    // Get historical data
    const endDate = new Date()
    const startDate = new Date()
    
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 28) // 4 weeks of history
        break
      case 'month':
        startDate.setMonth(startDate.getMonth() - 3) // 3 months of history
        break
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 12) // 12 months of history
        break
    }

    const sales = await SaleModel.findAll({
      startDate,
      endDate,
    })

    let prompt = ''

    switch (type) {
      case 'sales':
        const weeklyRevenue: Record<string, number> = {}
        
        sales.forEach(sale => {
          const week = getWeekKey(sale.date)
          weeklyRevenue[week] = (weeklyRevenue[week] || 0) + sale.total.toNumber()
        })

        prompt = `
Analiza estos datos históricos de ventas semanales y predice las ventas para la próxima ${period}:

Datos históricos (por semana):
${Object.entries(weeklyRevenue).map(([week, revenue]) => `${week}: $${revenue.toFixed(2)}`).join('\n')}

Por favor, proporciona:
1. Predicción de ingresos para la próxima ${period}
2. Factores que podrían influir en las ventas
3. Recomendaciones para mejorar las ventas

Responde en formato JSON con la estructura:
{
  "prediction": number,
  "confidence": "alta|media|baja",
  "factors": ["factor1", "factor2"],
  "recommendations": ["rec1", "rec2"]
}
        `
        break

      case 'stock':
        if (!productId) {
          return NextResponse.json(
            { success: false, error: 'Product ID required for stock predictions' },
            { status: 400 }
          )
        }

        const product = await ProductModel.findById(productId)
        if (!product) {
          return NextResponse.json(
            { success: false, error: 'Product not found' },
            { status: 404 }
          )
        }

        // Calculate product sales velocity
        const productSales = sales.flatMap(sale => 
          sale.items.filter(item => item.productId === productId)
        )

        const totalSold = productSales.reduce((sum, item) => sum + item.quantity, 0)
        const daysAnalyzed = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        const dailyVelocity = totalSold / daysAnalyzed

        prompt = `
Analiza estos datos de ventas del producto "${product.name}" y predice cuándo se agotará el stock:

Datos del producto:
- Stock actual: ${product.stock} unidades
- Stock mínimo: ${product.minStock} unidades
- Unidades vendidas en ${daysAnalyzed} días: ${totalSold}
- Velocidad de venta diaria promedio: ${dailyVelocity.toFixed(2)} unidades/día

Por favor, proporciona:
1. Días estimados hasta agotar el stock actual
2. Días estimados hasta llegar al stock mínimo
3. Cantidad recomendada para el próximo pedido
4. Fecha recomendada para hacer el pedido

Responde en formato JSON con la estructura:
{
  "daysToStockOut": number,
  "daysToMinStock": number,
  "recommendedOrder": number,
  "orderDate": "YYYY-MM-DD",
  "confidence": "alta|media|baja"
}
        `
        break

      case 'demand':
        // Analyze demand patterns
        const productDemand: Record<string, number> = {}
        
        sales.forEach(sale => {
          sale.items.forEach(item => {
            productDemand[item.product.name] = (productDemand[item.product.name] || 0) + item.quantity
          })
        })

        const topProducts = Object.entries(productDemand)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)

        prompt = `
Analiza estos patrones de demanda de productos y predice las tendencias futuras:

Top 10 productos más vendidos (últimos ${Math.ceil(daysAnalyzed)} días):
${topProducts.map(([name, quantity], index) => `${index + 1}. ${name}: ${quantity} unidades`).join('\n')}

Datos adicionales:
- Total de ventas analizadas: ${sales.length}
- Período analizado: ${daysAnalyzed} días
- Productos únicos vendidos: ${Object.keys(productDemand).length}

Por favor, proporciona:
1. Productos con demanda creciente
2. Productos con demanda decreciente
3. Nuevas oportunidades de productos
4. Recomendaciones de inventario

Responde en formato JSON con la estructura:
{
  "growing": ["producto1", "producto2"],
  "declining": ["producto3", "producto4"],
  "opportunities": ["nueva categoria", "producto sugerido"],
  "recommendations": ["rec1", "rec2"]
}
        `
        break
    }

    const aiBalancer = new AIBalancer()
    const result = await aiBalancer.generateResponse(prompt, 'prediction')

    // Try to parse JSON response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(result.response)
    } catch {
      // If not valid JSON, return as text
      parsedResponse = { analysis: result.response }
    }

    return NextResponse.json({
      success: true,
      prediction: parsedResponse,
      provider: result.provider,
      type,
      period,
    })
  } catch (error) {
    console.error('AI Predictions error:', error)
    
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
        error: error instanceof Error ? error.message : 'AI predictions failed' 
      },
      { status: 500 }
    )
  }
}

function getWeekKey(date: Date): string {
  const year = date.getFullYear()
  const week = getWeekNumber(date)
  return `${year}-W${week.toString().padStart(2, '0')}`
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
