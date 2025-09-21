"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Plus, Minus, Trash2, Search, Scan, DollarSign, Receipt, CheckCircle } from "lucide-react"

interface Product {
  id: number
  name: string
  price: number
  stock: number
  barcode?: string
}

interface SaleItem {
  product: Product
  quantity: number
  subtotal: number
}

interface Sale {
  id: number
  items: SaleItem[]
  total: number
  paymentMethod: string
  timestamp: Date
  cashier: string
}

export function SalesRegistration() {
  const [cart, setCart] = useState<SaleItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [receivedAmount, setReceivedAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)

  // Mock products data - replace with real data from your backend
  const products: Product[] = [
    { id: 1, name: "Coca Cola 500ml", price: 2.5, stock: 45, barcode: "7501055363057" },
    { id: 2, name: "Pan Integral", price: 4.0, stock: 15, barcode: "7501234567890" },
    { id: 3, name: "Leche Entera 1L", price: 5.25, stock: 28, barcode: "7501055123456" },
    { id: 4, name: "Arroz 1kg", price: 3.75, stock: 3, barcode: "7501234567891" },
    { id: 5, name: "Aceite Girasol 1L", price: 8.5, stock: 12, barcode: "7501234567892" },
    { id: 6, name: "Detergente 1kg", price: 12.0, stock: 8, barcode: "7501234567893" },
  ]

  const filteredProducts = products.filter(
    (product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.barcode?.includes(searchTerm),
  )

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id)

    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        updateQuantity(product.id, existingItem.quantity + 1)
      }
    } else {
      const newItem: SaleItem = {
        product,
        quantity: 1,
        subtotal: product.price,
      }
      setCart([...cart, newItem])
    }
    setSearchTerm("")
  }

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart(
      cart.map((item) => {
        if (item.product.id === productId) {
          return {
            ...item,
            quantity: Math.min(newQuantity, item.product.stock),
            subtotal: item.product.price * Math.min(newQuantity, item.product.stock),
          }
        }
        return item
      }),
    )
  }

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product.id !== productId))
  }

  const clearCart = () => {
    setCart([])
    setReceivedAmount("")
  }

  const processSale = async () => {
    if (cart.length === 0) return

    setIsProcessing(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const newSale: Sale = {
      id: Date.now(),
      items: [...cart],
      total: cartTotal,
      paymentMethod,
      timestamp: new Date(),
      cashier: "Usuario Actual", // Replace with actual user
    }

    setLastSale(newSale)
    setShowSuccessDialog(true)
    clearCart()
    setIsProcessing(false)
  }

  const change =
    paymentMethod === "cash" && receivedAmount ? Math.max(0, Number.parseFloat(receivedAmount) - cartTotal) : 0

  const canProcessSale =
    cart.length > 0 && (paymentMethod !== "cash" || (receivedAmount && Number.parseFloat(receivedAmount) >= cartTotal))

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Product Search and Selection */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Buscar Productos
            </CardTitle>
            <CardDescription>Busca por nombre o escanea el código de barras</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar producto o código de barras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Scan className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Product Results */}
        {searchTerm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resultados de Búsqueda</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredProducts.length > 0 ? (
                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer"
                      onClick={() => addToCart(product)}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Stock: {product.stock} • ${product.price.toFixed(2)}
                        </p>
                        {product.barcode && (
                          <p className="text-xs text-muted-foreground font-mono">{product.barcode}</p>
                        )}
                      </div>
                      <Button size="sm" className="ml-4">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No se encontraron productos</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Access Products */}
        {!searchTerm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Productos Populares</CardTitle>
              <CardDescription>Acceso rápido a productos más vendidos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {products.slice(0, 6).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer"
                    onClick={() => addToCart(product)}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{product.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        ${product.price.toFixed(2)} • Stock: {product.stock}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Shopping Cart and Checkout */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Carrito
              </span>
              {cartItemsCount > 0 && <Badge variant="secondary">{cartItemsCount} items</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length > 0 ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.product.name}</h4>
                        <p className="text-xs text-muted-foreground">${item.product.price.toFixed(2)} c/u</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">${item.subtotal.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total:</span>
                    <span className="text-2xl font-bold text-primary">${cartTotal.toFixed(2)}</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="payment-method">Método de Pago</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Efectivo</SelectItem>
                          <SelectItem value="card">Tarjeta</SelectItem>
                          <SelectItem value="transfer">Transferencia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {paymentMethod === "cash" && (
                      <div className="space-y-2">
                        <Label htmlFor="received-amount">Monto Recibido</Label>
                        <Input
                          id="received-amount"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={receivedAmount}
                          onChange={(e) => setReceivedAmount(e.target.value)}
                        />
                        {receivedAmount && Number.parseFloat(receivedAmount) >= cartTotal && (
                          <div className="flex justify-between text-sm">
                            <span>Cambio:</span>
                            <span className="font-bold text-primary">${change.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={clearCart}
                      disabled={isProcessing}
                    >
                      Limpiar
                    </Button>
                    <Button className="flex-1" onClick={processSale} disabled={!canProcessSale || isProcessing}>
                      {isProcessing ? (
                        "Procesando..."
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4 mr-2" />
                          Procesar Venta
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Carrito vacío</p>
                <p className="text-sm text-muted-foreground">Busca y agrega productos para comenzar una venta</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <CheckCircle className="w-5 h-5" />
              Venta Procesada
            </DialogTitle>
            <DialogDescription>La venta se ha registrado exitosamente</DialogDescription>
          </DialogHeader>
          {lastSale && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Venta #:</span>
                  <span className="font-mono">{lastSale.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-bold text-primary">${lastSale.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Método:</span>
                  <span className="capitalize">{lastSale.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fecha:</span>
                  <span>{lastSale.timestamp.toLocaleString()}</span>
                </div>
                {paymentMethod === "cash" && change > 0 && (
                  <div className="flex justify-between font-bold">
                    <span>Cambio:</span>
                    <span>${change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuccessDialog(false)}>
              Cerrar
            </Button>
            <Button>
              <Receipt className="w-4 h-4 mr-2" />
              Imprimir Recibo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
