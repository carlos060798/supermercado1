"use client"

import { useState } from "react"


import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  BarChart3,
  PieChart,
  Filter,
  RefreshCw,
} from "lucide-react"
import { CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Progress } from "./ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Button } from "./ui/button"

interface SalesReport {
  date: string
  totalSales: number
  totalRevenue: number
  topProducts: { name: string; quantity: number; revenue: number }[]
  hourlyData: { hour: string; sales: number; revenue: number }[]
}

interface InventoryReport {
  totalProducts: number
  lowStockCount: number
  outOfStockCount: number
  totalValue: number
  categoryBreakdown: { category: string; count: number; value: number }[]
  topSellingProducts: { name: string; sold: number; revenue: number }[]
}

export function ReportsInterface() {
  const [dateRange, setDateRange] = useState("today")
  const [reportType, setReportType] = useState("sales")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  // Mock data - replace with real data from your backend
  const salesReport: SalesReport = {
    date: "2024-01-15",
    totalSales: 47,
    totalRevenue: 1250.75,
    topProducts: [
      { name: "Coca Cola 500ml", quantity: 12, revenue: 30.0 },
      { name: "Pan Integral", quantity: 8, revenue: 32.0 },
      { name: "Leche Entera 1L", quantity: 6, revenue: 31.5 },
      { name: "Arroz 1kg", quantity: 5, revenue: 18.75 },
      { name: "Aceite Girasol 1L", quantity: 4, revenue: 34.0 },
    ],
    hourlyData: [
      { hour: "08:00", sales: 3, revenue: 45.5 },
      { hour: "09:00", sales: 5, revenue: 67.25 },
      { hour: "10:00", sales: 8, revenue: 125.0 },
      { hour: "11:00", sales: 12, revenue: 189.5 },
      { hour: "12:00", sales: 15, revenue: 245.75 },
      { hour: "13:00", sales: 4, revenue: 78.25 },
    ],
  }

  const inventoryReport: InventoryReport = {
    totalProducts: 287,
    lowStockCount: 12,
    outOfStockCount: 3,
    totalValue: 15420.5,
    categoryBreakdown: [
      { category: "Bebidas", count: 45, value: 2340.5 },
      { category: "Panadería", count: 32, value: 1890.25 },
      { category: "Lácteos", count: 28, value: 3250.75 },
      { category: "Granos", count: 67, value: 4120.0 },
      { category: "Limpieza", count: 23, value: 1890.0 },
      { category: "Snacks", count: 92, value: 1929.0 },
    ],
    topSellingProducts: [
      { name: "Coca Cola 500ml", sold: 156, revenue: 390.0 },
      { name: "Pan Integral", sold: 134, revenue: 536.0 },
      { name: "Leche Entera 1L", sold: 98, revenue: 514.5 },
      { name: "Arroz 1kg", sold: 87, revenue: 326.25 },
      { name: "Aceite Girasol 1L", sold: 76, revenue: 646.0 },
    ],
  }

  const generateReport = async () => {
    setIsGenerating(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsGenerating(false)
  }

  const exportToExcel = (type: string) => {
    // Simulate Excel export
    console.log(`Exporting ${type} report to Excel...`)
    // In real implementation, this would trigger a download
  }

  const exportToPDF = (type: string) => {
    // Simulate PDF export
    console.log(`Exporting ${type} report to PDF...`)
    // In real implementation, this would trigger a download
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reportes</h2>
          <p className="text-muted-foreground">Análisis detallado de ventas e inventario</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateReport} disabled={isGenerating}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "Generando..." : "Actualizar"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros de Reporte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="report-type">Tipo de Reporte</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Ventas</SelectItem>
                  <SelectItem value="inventory">Inventario</SelectItem>
                  <SelectItem value="products">Productos</SelectItem>
                  <SelectItem value="financial">Financiero</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-range">Período</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="yesterday">Ayer</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mes</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === "custom" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="start-date">Fecha Inicio</Label>
                  <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">Fecha Fin</Label>
                  <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reports Content */}
      <Tabs value={reportType} onValueChange={setReportType}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Ventas</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Inventario</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Productos</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Financiero</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          {/* Sales Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{salesReport.totalSales}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline w-3 h-3 mr-1" />
                  +12% vs ayer
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">${salesReport.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline w-3 h-3 mr-1" />
                  +8% vs ayer
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  ${(salesReport.totalRevenue / salesReport.totalSales).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  <TrendingDown className="inline w-3 h-3 mr-1" />
                  -3% vs ayer
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Productos Más Vendidos</CardTitle>
                <CardDescription>Top 5 productos del período seleccionado</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportToExcel("top-products")}>
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportToPDF("top-products")}>
                  <FileText className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesReport.topProducts.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{product.quantity}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">${product.revenue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Hourly Sales */}
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Hora</CardTitle>
              <CardDescription>Distribución de ventas durante el día</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesReport.hourlyData.map((data, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-16 text-sm font-medium">{data.hour}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">{data.sales} ventas</span>
                        <span className="text-sm font-medium">${data.revenue.toFixed(2)}</span>
                      </div>
                      <Progress
                        value={(data.revenue / Math.max(...salesReport.hourlyData.map((d) => d.revenue))) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          {/* Inventory Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{inventoryReport.totalProducts}</div>
                <p className="text-xs text-muted-foreground">productos registrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
                <TrendingDown className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{inventoryReport.lowStockCount}</div>
                <p className="text-xs text-muted-foreground">necesitan reposición</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
                <TrendingDown className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{inventoryReport.outOfStockCount}</div>
                <p className="text-xs text-muted-foreground">productos agotados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">${inventoryReport.totalValue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">valor del inventario</p>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Inventario por Categoría</CardTitle>
                <CardDescription>Distribución de productos y valor por categoría</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportToExcel("inventory-categories")}>
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-center">Productos</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">% del Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryReport.categoryBreakdown.map((category, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{category.category}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{category.count}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold">${category.value.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        {((category.value / inventoryReport.totalValue) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Productos Más Vendidos (Histórico)</CardTitle>
                <CardDescription>Ranking de productos por ventas totales</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportToExcel("product-ranking")}>
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ranking</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Vendidos</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryReport.topSellingProducts.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Badge variant={index < 3 ? "default" : "secondary"}>#{index + 1}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-center">{product.sold}</TableCell>
                      <TableCell className="text-right font-bold text-primary">${product.revenue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardContent className="py-12 text-center">
              <PieChart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Reporte Financiero</h3>
              <p className="text-muted-foreground mb-4">
                Esta sección incluirá análisis financiero detallado, márgenes de ganancia, costos y proyecciones.
              </p>
              <Badge variant="secondary">Próximamente</Badge>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
