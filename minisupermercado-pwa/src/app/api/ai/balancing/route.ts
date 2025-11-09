interface AIProvider {
  name: string
  endpoint: (prompt: string) => Promise<string>
  available: boolean
  priority: number
}

export class AIBalancer {
  private providers: AIProvider[] = []

  constructor() {
    this.initializeProviders()
  }

  private initializeProviders() {
    // OpenAI Provider
    if (process.env.OPENAI_API_KEY) {
      this.providers.push({
        name: 'openai',
        endpoint: this.callOpenAI.bind(this),
        available: true,
        priority: 1,
      })
    }

    // Claude Provider
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.push({
        name: 'claude',
        endpoint: this.callClaude.bind(this),
        available: true,
        priority: 2,
      })
    }

    // Groq Provider
    if (process.env.GROQ_API_KEY) {
      this.providers.push({
        name: 'groq',
        endpoint: this.callGroq.bind(this),
        available: true,
        priority: 3,
      })
    }

    // Sort by priority
    this.providers.sort((a, b) => a.priority - b.priority)
  }

  async generateResponse(prompt: string, type: 'assistant' | 'prediction' | 'insight' = 'assistant'): Promise<{
    response: string
    provider: string
    tokens?: number
  }> {
    for (const provider of this.providers) {
      if (!provider.available) continue

      try {
        const response = await provider.endpoint(prompt)
        
        // Log successful AI call
        await this.logAICall(type, prompt, response, provider.name, true)
        
        return {
          response,
          provider: provider.name,
        }
      } catch (error) {
        console.error(`AI Provider ${provider.name} failed:`, error)
        
        // Log failed AI call
        await this.logAICall(type, prompt, '', provider.name, false, error instanceof Error ? error.message : 'Unknown error')
        
        // Try next provider
        continue
      }
    }

    throw new Error('All AI providers are unavailable')
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  private async callClaude(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.content[0].text
  }

  private async callGroq(prompt: string): Promise<string> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  private async logAICall(
    type: string,
    prompt: string,
    response: string,
    provider: string,
    success: boolean,
    error?: string
  ) {
    try {
      await prisma.aILog.create({
        data: {
          type,
          prompt,
          response,
          provider,
          success,
          error,
        },
      })
    } catch (logError) {
      console.error('Failed to log AI call:', logError)
    }
  }
} 