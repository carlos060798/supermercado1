import { NextRequest, NextResponse } from 'next/server'
import { SaleModel, ProductModel } from '@/lib/database/models'
import { authenticateRequest } from '@/lib/auth/middleware'
import { z } from 'zod'
import * as XLSX from 'xlsx'

const excelReportSchema = z.object({
  type: z.enum(['sales', 'products', 'inventory']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  format: z.enum(['xlsx', 'csv']).optional(),
})

// GET /api/reports/excel - Generate Excel/CSV reports
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
    const params = excelReportSchema.parse({
      type: searchParams.get('type'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      format: searchParams.get('format'),
    })

    let data: any[] = []
    let filename = ''
    
    const format = params.format || 'xlsx'

    switch (params.type) {
      case 'sales':
        const salesFilters: any = {}
        
        if (params.startDate) {
          salesFilters.startDate = new Date(params.startDate)
        }
        
        if (params.endDate) {
          salesFilters.endDate = new Date(params.endDate)
        }

        const sales = await SaleModel.findAll(salesFilters)
        
        data = sales.map(sale => ({
          'Número de Venta': sale.saleNumber,
          'Fecha': sale.date.toLocaleDateString(),
          'Hora': sale.date.toLocaleTimeString(),
          'Subtotal': sale.subtotal.toNumber(),
          'Impuesto': sale.tax.toNumber(),
          'Descuento': sale.discount.toNumber(),
          'Total': sale.total.toNumber(),
          'Método de Pago': sale.paymentMethod,
          'Vendedor': sale.user.name,
          'Estado': sale.status,
          'Notas': sale.notes || '',
        }))
        
        filename = `ventas_${new Date().toISOString().split('T')[0]}`
        break

      case 'products':
        const products = await ProductModel.findAll({ active: true })
        
        data = products.map(product => ({
          'Código': product.code,
          'Nombre': product.name,
          'Categoría': product.category,
          'Marca': product.brand || '',
          'Precio': product.price.toNumber(),
          'Costo': product.cost?.toNumber() || 0,
          'Stock': product.stock,
          'Stock Mínimo': product.minStock,
          'Stock Máximo': product.maxStock || '',
          'Unidad': product.unit,
          'Código de Barras': product.barcode || '',
          'Descripción': product.description || '',
          'Activo': product.active ? 'Sí' : 'No',
        }))
        
        filename = `productos_${new Date().toISOString().split('T')[0]}`
        break

      case 'inventory':
        const inventoryProducts = await ProductModel.findAll({ active: true })
        
        data = inventoryProducts.map(product => {
          const stockValue = product.stock * product.price.toNumber()
          const costValue = product.stock * (product.cost?.toNumber() || 0)
          const stockStatus = product.stock <= product.minStock ? 'Bajo' : 'Normal'
          
          return {
            'Código': product.code,
            'Nombre': product.name,
            'Categoría': product.category,
            'Stock Actual': product.stock,
            'Stock Mínimo': product.minStock,
            'Estado Stock': stockStatus,
            'Precio Unitario': product.price.toNumber(),
            'Costo Unitario': product.cost?.toNumber() || 0,
            'Valor Total (Precio)': stockValue,
            'Valor Total (Costo)': costValue,
            'Margen': product.cost ? ((product.price.toNumber() - product.cost.toNumber()) / product.price.toNumber() * 100).toFixed(2) + '%' : '',
          }
        })
        
        filename = `inventario_${new Date().toISOString().split('T')[0]}`
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid report type' },
          { status: 400 }
        )
    }

    // Create workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(data)
    
    // Set column widths
    const columnWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }))
    worksheet['!cols'] = columnWidths
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte')

    // Generate buffer
    const buffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: format as any 
    })

    // Set headers for file download
    const headers = new Headers()
    headers.set('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    headers.set('Content-Disposition', `attachment; filename="${filename}.${format}"`)

    return new NextResponse(buffer, { headers })
  } catch (error) {
    console.error('Excel report error:', error)
    
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
        error: 'Failed to generate Excel report' 
      },
      { status: 500 }
    )
  }
}