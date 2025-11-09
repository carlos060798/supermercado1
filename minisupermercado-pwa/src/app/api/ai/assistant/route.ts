import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'
import { AIBalancer } from '@/lib/ai/balancer'
import { SaleModel, ProductModel } from '@/lib/database/models'
import { z } from 'zod'

const assistantSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  context: z.object({
    includeInventory: z.boolean().optional(),
    includeSales: z.boolean().optional(),
    timeRange: z.enum(['today', 'week', 'month']).optional(),
  }).optional(),
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
    const { question, context } = assistantSchema.parse(body)

    // Build context information
    let contextInfo = ''

    if (context?.includeInventory) {
      const products = await ProductModel.findAll({ active: true })
      const lowStockProducts = products.filter(p => p.stock <= p.minStock)
      
      contextInfo += `\nInventario actual:
- Total de productos: ${products.length}
- Productos con stock bajo: ${lowStockProducts.length}
- Productos con stock bajo: ${lowStockProducts.map(p => `${p.name} (${p.stock} unidades)`).join(', ')}
      `
    }

    if (context?.includeSales) {
      const timeRange = context.timeRange || 'today'
      let startDate = new Date()
      
      switch (timeRange) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1)
          break
        default: // today
          startDate.setHours(0, 0, 0, 0)
      }

      const sales = await SaleModel.findAll({
        startDate,
        endDate: new Date(),
      })

      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total.toNumber(), 0)
      
      contextInfo += `\nDatos de ventas (${timeRange}):
- Total de ventas: ${sales.length}
- Ingresos totales: $${totalRevenue.toFixed(2)}
- Promedio por venta: $${sales.length > 0 ? (totalRevenue / sales.length).toFixed(2) : '0.00'}
      `
    }

    const aiBalancer = new AIBalancer()
    
    const prompt = `
Eres un asistente inteligente para un sistema de minisupermercado. Tu trabajo es ayudar al usuario con consultas sobre ventas, inventario, y gestión del negocio.

Contexto del negocio:${contextInfo}

Pregunta del usuario: ${question}

Por favor, proporciona una respuesta útil y específica. Si necesitas más información para dar una respuesta completa, explica qué información adicional sería útil.

Responde en español y de manera concisa pero informativa.
    `

    const result = await aiBalancer.generateResponse(prompt, 'assistant')

    return NextResponse.json({
      success: true,
      response: result.response,
      provider: result.provider,
    })
  } catch (error) {
    console.error('AI Assistant error:', error)
    
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
        error: error instanceof Error ? error.message : 'AI assistant failed' 
      },
      { status: 500 }
    )
  }
}