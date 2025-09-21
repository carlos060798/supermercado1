'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'
import { Label } from '@/app/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowLeft,
  Calculator,
  CreditCard,
  DollarSign
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  price: number
  stock: number
  barcode?: string
}

interface SaleItem {
  productId: string
  productName: string
  quantity: number
  price: number
  subtotal: number
}

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [notes, setNotes] = useState('')
  const router = useRouter()

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      // En una implementación real, esto vendría de la API
      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Coca Cola 500ml',
          price: 2.50,
          stock: 25,
          barcode: '1234567890123'
        },
        {
          id: '2',
          name: 'Pan Integral',
          price: 1.20,
          stock: 3,
          barcode: '1234567890124'
        },
        {
          id: '3',
          name: 'Leche Entera 1L',
          price: 3.00,
          stock: 15,
          barcode: '1234567890125'
        },
        {
          id: '4',
          name: 'Galletas Oreo',
          price: 2.80,
          stock: 8,
          barcode: '1234567890126'
        },
        {
          id: '5',
          name: 'Agua Mineral 500ml',
          price: 1.50,
          stock: 20,
          barcode: '1234567890127'
        }
      ]
      setProducts(mockProducts)
    } catch (error) {
      console.error('Error cargando productos:', error)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.includes(searchTerm)
  )

  const addToCart = () => {
    if (!selectedProduct) return

    const existingItem = saleItems.find(item => item.productId === selectedProduct.id)
    
    if (existingItem) {
      setSaleItems(saleItems.map(item =>
        item.productId === selectedProduct.id
          ? {
              ...item,
              quantity: item.quantity + quantity,
              subtotal: (item.quantity + quantity) * item.price
            }
          : item
      ))
    } else {
      const newItem: SaleItem = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity,
        price: selectedProduct.price,
        subtotal: quantity * selectedProduct.price
      }
      setSaleItems([...saleItems, newItem])
    }

    // Actualizar stock del producto
    setProducts(products.map(p =>
      p.id === selectedProduct.id
        ? { ...p, stock: p.stock - quantity }
        : p
    ))

    setSelectedProduct(null)
    setQuantity(1)
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    const item = saleItems.find(item => item.productId === productId)
    if (!item) return

    const quantityDiff = newQuantity - item.quantity
    const product = products.find(p => p.id === productId)
    if (!product) return

    // Verificar si hay suficiente stock
    if (product.stock < quantityDiff) {
      alert('No hay suficiente stock disponible')
      return
    }

    setSaleItems(saleItems.map(item =>
      item.productId === productId
        ? {
            ...item,
            quantity: newQuantity,
            subtotal: newQuantity * item.price
          }
        : item
    ))

    // Actualizar stock
    setProducts(products.map(p =>
      p.id === productId
        ? { ...p, stock: p.stock - quantityDiff }
        : p
    ))
  }

  const removeFromCart = (productId: string) => {
    const item = saleItems.find(item => item.productId === productId)
    if (!item) return

    setSaleItems(saleItems.filter(item => item.productId !== productId))

    // Restaurar stock
    setProducts(products.map(p =>
      p.id === productId
        ? { ...p, stock: p.stock + item.quantity }
        : p
    ))
  }

  const calculateTotal = () => {
    return saleItems.reduce((total, item) => total + item.subtotal, 0)
  }

  const calculateTax = () => {
    return calculateTotal() * 0.12 // 12% IVA
  }

  const calculateFinalTotal = () => {
    return calculateTotal() + calculateTax()
  }

  const processSale = async () => {
    if (saleItems.length === 0) {
      alert('No hay productos en la venta')
      return
    }

    try {
      const saleData = {
        items: saleItems,
        subtotal: calculateTotal(),
        tax: calculateTax(),
        total: calculateFinalTotal(),
        paymentMethod,
        notes
      }

      // En una implementación real, esto se enviaría a la API
      console.log('Procesando venta:', saleData)
      
      // Limpiar la venta
      setSaleItems([])
      setNotes('')
      
      alert('Venta procesada exitosamente')
    } catch (error) {
      console.error('Error procesando venta:', error)
      alert('Error al procesar la venta')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <ShoppingCart className="h-8 w-8 text-blue-600 mr-3 ml-4" />
              <h1 className="text-xl font-semibold text-gray-900">Punto de Venta</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel de productos */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Productos Disponibles</CardTitle>
                <CardDescription>
                  Busca y selecciona productos para agregar a la venta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    placeholder="Buscar productos por nombre o código de barras..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {filteredProducts.map((product) => (
                      <Card 
                        key={product.id} 
                        className={`cursor-pointer transition-colors ${
                          selectedProduct?.id === product.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setSelectedProduct(product)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{product.name}</h3>
                              <p className="text-sm text-gray-500">Stock: {product.stock}</p>
                              <p className="text-sm text-gray-500">Código: {product.barcode}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">${product.price.toFixed(2)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {selectedProduct && (
                    <Card className="bg-blue-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{selectedProduct.name}</h3>
                            <p className="text-sm text-gray-500">${selectedProduct.price.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button onClick={addToCart}>
                              Agregar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel de venta */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Resumen de Venta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Items de la venta */}
                  <div className="max-h-64 overflow-y-auto">
                    {saleItems.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No hay productos en la venta</p>
                    ) : (
                      <div className="space-y-2">
                        {saleItems.map((item) => (
                          <div key={item.productId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.productName}</p>
                              <p className="text-xs text-gray-500">${item.price.toFixed(2)} c/u</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center text-sm">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeFromCart(item.productId)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${item.subtotal.toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Totales */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IVA (12%):</span>
                      <span>${calculateTax().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>${calculateFinalTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Método de pago */}
                  <div>
                    <Label htmlFor="payment">Método de Pago</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-2" />
                            Efectivo
                          </div>
                        </SelectItem>
                        <SelectItem value="CARD">
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Tarjeta
                          </div>
                        </SelectItem>
                        <SelectItem value="TRANSFER">Transferencia</SelectItem>
                        <SelectItem value="MIXED">Mixto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Notas */}
                  <div>
                    <Label htmlFor="notes">Notas (opcional)</Label>
                    <Input
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Notas adicionales..."
                    />
                  </div>

                  {/* Botón de procesar venta */}
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={processSale}
                    disabled={saleItems.length === 0}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Procesar Venta - ${calculateFinalTotal().toFixed(2)}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
