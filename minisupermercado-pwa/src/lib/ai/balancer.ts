import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import Groq from 'groq-sdk'

// OpenAI Configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Anthropic Configuration
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Groq Configuration
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export interface AIResponse {
  content: string
  provider: string
  usage?: any
}

export interface AIProvider {
  name: string
  generateResponse: (prompt: string, context?: string) => Promise<AIResponse>
}

class OpenAIProvider implements AIProvider {
  name = 'openai'

  async generateResponse(prompt: string, context?: string): Promise<AIResponse> {
    try {
      const fullPrompt = context ? `${context}\n\n${prompt}` : prompt
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente especializado en gestión de supermercados. Ayuda con inventario, ventas, análisis de datos y recomendaciones de negocio.'
          },
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      })

      return {
        content: completion.choices[0]?.message?.content || 'No se pudo generar respuesta',
        provider: 'openai',
        usage: completion.usage
      }
    } catch (error) {
      throw new Error(`Error con OpenAI: ${error}`)
    }
  }
}

class AnthropicProvider implements AIProvider {
  name = 'anthropic'

  async generateResponse(prompt: string, context?: string): Promise<AIResponse> {
    try {
      const fullPrompt = context ? `${context}\n\n${prompt}` : prompt
      
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Eres un asistente especializado en gestión de supermercados. Ayuda con inventario, ventas, análisis de datos y recomendaciones de negocio.\n\n${fullPrompt}`
          }
        ]
      })

      return {
        content: message.content[0]?.text || 'No se pudo generar respuesta',
        provider: 'anthropic',
        usage: message.usage
      }
    } catch (error) {
      throw new Error(`Error con Anthropic: ${error}`)
    }
  }
}

class GroqProvider implements AIProvider {
  name = 'groq'

  async generateResponse(prompt: string, context?: string): Promise<AIResponse> {
    try {
      const fullPrompt = context ? `${context}\n\n${prompt}` : prompt
      
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente especializado en gestión de supermercados. Ayuda con inventario, ventas, análisis de datos y recomendaciones de negocio.'
          },
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        model: 'llama3-8b-8192',
        max_tokens: 1000,
        temperature: 0.7,
      })

      return {
        content: completion.choices[0]?.message?.content || 'No se pudo generar respuesta',
        provider: 'groq',
        usage: completion.usage
      }
    } catch (error) {
      throw new Error(`Error con Groq: ${error}`)
    }
  }
}

// Provider instances
const providers: AIProvider[] = [
  new GroqProvider(), // Groq es gratis y rápido
  new OpenAIProvider(),
  new AnthropicProvider(),
]

export class AIBalancer {
  private currentProviderIndex = 0
  private providerStats: Map<string, { success: number; errors: number; avgResponseTime: number }> = new Map()

  async generateResponse(prompt: string, context?: string): Promise<AIResponse> {
    const startTime = Date.now()
    
    for (let i = 0; i < providers.length; i++) {
      const provider = providers[this.currentProviderIndex]
      
      try {
        const response = await provider.generateResponse(prompt, context)
        const responseTime = Date.now() - startTime
        
        // Actualizar estadísticas
        this.updateProviderStats(provider.name, true, responseTime)
        
        // Rotar al siguiente proveedor para el próximo request
        this.currentProviderIndex = (this.currentProviderIndex + 1) % providers.length
        
        return response
      } catch (error) {
        console.error(`Error con proveedor ${provider.name}:`, error)
        this.updateProviderStats(provider.name, false, 0)
        
        // Intentar con el siguiente proveedor
        this.currentProviderIndex = (this.currentProviderIndex + 1) % providers.length
      }
    }
    
    throw new Error('Todos los proveedores de IA fallaron')
  }

  private updateProviderStats(providerName: string, success: boolean, responseTime: number) {
    const stats = this.providerStats.get(providerName) || { success: 0, errors: 0, avgResponseTime: 0 }
    
    if (success) {
      stats.success++
      stats.avgResponseTime = (stats.avgResponseTime + responseTime) / 2
    } else {
      stats.errors++
    }
    
    this.providerStats.set(providerName, stats)
  }

  getProviderStats() {
    return Object.fromEntries(this.providerStats)
  }
}

// Instancia global del balancer
export const aiBalancer = new AIBalancer()

// Funciones de conveniencia
export const generateAIResponse = (prompt: string, context?: string) => {
  return aiBalancer.generateResponse(prompt, context)
}

export const generateSalesInsights = async (salesData: any[]) => {
  const context = `Datos de ventas: ${JSON.stringify(salesData.slice(0, 10))}`
  const prompt = 'Analiza estos datos de ventas y proporciona insights sobre tendencias, productos más vendidos, y recomendaciones para mejorar las ventas.'
  
  return generateAIResponse(prompt, context)
}

export const generateInventoryRecommendations = async (products: any[]) => {
  const context = `Inventario actual: ${JSON.stringify(products.slice(0, 20))}`
  const prompt = 'Analiza este inventario y proporciona recomendaciones sobre qué productos reabastecer, cuáles tienen exceso de stock, y sugerencias de precios.'
  
  return generateAIResponse(prompt, context)
}

export const generateBusinessReport = async (data: any) => {
  const context = `Datos del negocio: ${JSON.stringify(data)}`
  const prompt = 'Genera un reporte ejecutivo con análisis de rendimiento, oportunidades de mejora, y estrategias para el crecimiento del negocio.'
  
  return generateAIResponse(prompt, context)
}
