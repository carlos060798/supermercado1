import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { AIBalancer } from '@/lib/ai/balancer'
import { SaleModel, ProductModel } from '@/lib/database/models'

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    // Get recent data for insights
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30) // Last 30 days

    const [sales, products] = await Promise.all([
      SaleModel.findAll({ startDate, endDate }),
      ProductModel.findAll({ active: true })
    ])

    // Generate insights about the business
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total.toNumber(), 0)
    const averageTicket = sales.length > 0 ? totalRevenue / sales.length : 0
    const lowStockProducts = products.filter(p => p.stock <= p.minStock)
    
    // Product performance analysis
    const productPerformance: Record<string, { name: string; quantity: number; revenue: number }> = {}
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productPerformance[item.productId]) {
          productPerformance[item.productId] = {
            name: item.product.name,
            quantity: 0,
            revenue: 0
          }
        }
        productPerformance[item.productId].quantity += item.quantity
        productPerformance[item.productId].revenue += item.subtotal.toNumber()
      })
    })

    const topPerformers = Object.values(productPerformance)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    const poorPerformers = Object.values(productPerformance)
      .sort((a, b) => a.revenue - b.revenue)
      .slice(0, 5)

    // Payment method analysis
    const paymentMethods: Record<string, number> = {}
    sales.forEach(sale => {
      paymentMethods[sale.paymentMethod] = (paymentMethods[sale.paymentMethod] || 0) + 1
    })

    const prompt = `
Analiza estos datos del minisupermercado de los últimos 30 días y genera insights valiosos:

DATOS DE RENDIMIENTO:
- Total de ventas: ${sales.length}
- Ingresos totales: ${totalRevenue.toFixed(2)}
- Ticket promedio: ${averageTicket.toFixed(2)}
- Productos con stock bajo: ${lowStockProducts.length}

TOP 5 PRODUCTOS MÁS RENTABLES:
${topPerformers.map((p, i) => `${i+1}. ${p.name}: ${p.quantity} unidades, ${p.revenue.toFixed(2)}`).join('\n')}

5 PRODUCTOS CON MENOR RENDIMIENTO:
${poorPerformers.map((p, i) => `${i+1}. ${p.name}: ${p.quantity} unidades, ${p.revenue.toFixed(2)}`).join('\n')}

MÉTODOS DE PAGO:
${Object.entries(paymentMethods).map(([method, count]) => `${method}: ${count} ventas`).join('\n')}

PRODUCTOS CON STOCK BAJO:
${lowStockProducts.map(p => `- ${p.name}: ${p.stock} unidades (mín: ${p.minStock})`).join('\n')}

Por favor, genera insights y recomendaciones prácticas sobre:
1. Oportunidades de mejora en ventas
2. Optimización de inventario
3. Estrategias de precios
4. Productos a promover o descontinuar
5. Mejoras operativas

Responde en formato JSON con la estructura:
{
  "salesInsights": ["insight1", "insight2"],
  "inventoryInsights": ["insight1", "insight2"],
  "pricingInsights": ["insight1", "insight2"],
  "productRecommendations": {
    "promote": ["producto1", "producto2"],
    "discontinue": ["producto3", "producto4"]
  },
  "operationalInsights": ["insight1", "insight2"],
  "keyActions": ["accion1", "accion2"],
  "riskAlerts": ["alerta1", "alerta2"]
}
    `

    const aiBalancer = new AIBalancer()
    const result = await aiBalancer.generateResponse(prompt, 'insight')

    // Try to parse JSON response
    let parsedInsights
    try {
      parsedInsights = JSON.parse(result.response)
    } catch {
      // If not valid JSON, create structured response
      parsedInsights = {
        salesInsights: [result.response],
        inventoryInsights: [],
        pricingInsights: [],
        productRecommendations: { promote: [], discontinue: [] },
        operationalInsights: [],
        keyActions: [],
        riskAlerts: lowStockProducts.length > 0 ? [`${lowStockProducts.length} productos con stock bajo`] : []
      }
    }

    return NextResponse.json({
      success: true,
      insights: parsedInsights,
      provider: result.provider,
      generatedAt: new Date().toISOString(),
      dataRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        salesAnalyzed: sales.length,
        productsAnalyzed: products.length
      }
    })
  } catch (error) {
    console.error('AI Insights error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'AI insights failed' 
      },
      { status: 500 }
    )
  }
}