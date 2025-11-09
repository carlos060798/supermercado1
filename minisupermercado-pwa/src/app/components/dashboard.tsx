"use client"

import { useState } from "react"

import {
  ShoppingCart,
  Package,
  TrendingUp,
  DollarSign,
  Users,
  AlertTriangle,
  Plus,
  FileText,
  Calculator,
} from "lucide-react"
import { Badge } from "./ui/badge"
import { ProductManagement } from "./product-management"
import { SalesRegistration } from "./sales-registration"
import { ReportsInterface } from "./reports-interface"
import { CashClosing } from "./cash-closing"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")

  // Mock data - replace with real data from your backend
  const stats = {
    totalProducts: 287,
    lowStock: 12,
    todaySales: 1250.5,
    totalUsers: 3,
  }

  const recentSales = [
    { id: 1, product: "Coca Cola 500ml", quantity: 5, total: 12.5, time: "14:30" },
    { id: 2, product: "Pan Integral", quantity: 2, total: 8.0, time: "14:25" },
    { id: 3, product: "Leche Entera 1L", quantity: 3, total: 15.75, time: "14:20" },
  ]

  const lowStockProducts = [
    { name: "Arroz 1kg", stock: 3, minStock: 10 },
    { name: "Aceite Girasol", stock: 2, minStock: 8 },
    { name: "Detergente", stock: 1, minStock: 5 },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Sistema de Inventario</h1>
              <p className="text-muted-foreground">Minisupermercado El Progreso</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                <Users className="w-3 h-3 mr-1" />
                {stats.totalUsers} usuarios activos
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-fit lg:grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Productos</span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Ventas</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Reportes</span>
            </TabsTrigger>
            <TabsTrigger value="closing" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">Cierre</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.totalProducts}</div>
                  <p className="text-xs text-muted-foreground">productos registrados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{stats.lowStock}</div>
                  <p className="text-xs text-muted-foreground">productos con stock bajo</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">${stats.todaySales.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">ingresos del día</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">usuarios registrados</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Recent Sales */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Ventas Recientes
                  </CardTitle>
                  <CardDescription>Últimas transacciones registradas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentSales.map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{sale.product}</p>
                          <p className="text-xs text-muted-foreground">Cantidad: {sale.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">${sale.total.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{sale.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4 bg-transparent"
                    onClick={() => setActiveTab("sales")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Nueva Venta
                  </Button>
                </CardContent>
              </Card>

              {/* Low Stock Alert */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    Alertas de Stock
                  </CardTitle>
                  <CardDescription>Productos que necesitan reposición</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lowStockProducts.map((product, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">Stock mínimo: {product.minStock}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="destructive" className="text-xs">
                            {product.stock} restantes
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4 bg-transparent"
                    onClick={() => setActiveTab("products")}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Gestionar Productos
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="sales">
            <SalesRegistration />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsInterface />
          </TabsContent>

          <TabsContent value="closing">
            <CashClosing />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
