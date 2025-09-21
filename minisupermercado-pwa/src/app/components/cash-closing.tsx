"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
// If this import fails, check that the file exists at src/components/ui/dialog.tsx or dialog/index.tsx
// If your Dialog component is located elsewhere, update the import path accordingly, e.g.:
// } from "../ui/dialog"
// or
// } from "../../ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  Calculator,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  Smartphone,
} from "lucide-react"

interface DailySummary {
  date: string
  openingCash: number
  totalSales: number
  cashSales: number
  cardSales: number
  transferSales: number
  expectedCash: number
  actualCash: number
  difference: number
  totalTransactions: number
  averageTicket: number
  topProducts: { name: string; quantity: number; revenue: number }[]
  hourlyBreakdown: { hour: string; sales: number; revenue: number }[]
}

interface CashClosing {
  id: number
  date: string
  cashier: string
  summary: DailySummary
  notes: string
  status: "open" | "closed"
  closedAt?: Date
}

export function CashClosing() {
  const [actualCash, setActualCash] = useState("")
  const [notes, setNotes] = useState("")
  const [isClosing, setIsClosing] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [selectedClosing, setSelectedClosing] = useState<CashClosing | null>(null)

  // Mock data - replace with real data from your backend
  const todaySummary: DailySummary = {
    date: "2024-01-15",
    openingCash: 200.0,
    totalSales: 1250.75,
    cashSales: 750.25,
    cardSales: 350.5,
    transferSales: 150.0,
    expectedCash: 950.25, // opening + cash sales
    actualCash: 0, // to be filled by user
    difference: 0,
    totalTransactions: 47,
    averageTicket: 26.61,
    topProducts: [
      { name: "Coca Cola 500ml", quantity: 12, revenue: 30.0 },
      { name: "Pan Integral", quantity: 8, revenue: 32.0 },
      { name: "Leche Entera 1L", quantity: 6, revenue: 31.5 },
    ],
    hourlyBreakdown: [
      { hour: "08:00-09:00", sales: 3, revenue: 45.5 },
      { hour: "09:00-10:00", sales: 5, revenue: 67.25 },
      { hour: "10:00-11:00", sales: 8, revenue: 125.0 },
      { hour: "11:00-12:00", sales: 12, revenue: 189.5 },
      { hour: "12:00-13:00", sales: 15, revenue: 245.75 },
      { hour: "13:00-14:00", sales: 4, revenue: 78.25 },
    ],
  }

  const previousClosings: CashClosing[] = [
    {
      id: 1,
      date: "2024-01-14",
      cashier: "María González",
      summary: {
        ...todaySummary,
        date: "2024-01-14",
        totalSales: 1180.5,
        actualCash: 920.25,
        difference: -5.0,
      },
      notes: "Faltaron $5.00 - posible error en cambio",
      status: "closed",
      closedAt: new Date("2024-01-14T18:30:00"),
    },
    {
      id: 2,
      date: "2024-01-13",
      cashier: "Carlos Ruiz",
      summary: {
        ...todaySummary,
        date: "2024-01-13",
        totalSales: 1320.75,
        actualCash: 1050.75,
        difference: 0,
      },
      notes: "Cierre perfecto",
      status: "closed",
      closedAt: new Date("2024-01-13T18:15:00"),
    },
  ]

  const calculateDifference = () => {
    if (!actualCash) return 0
    return Number.parseFloat(actualCash) - todaySummary.expectedCash
  }

  const handleCloseCash = async () => {
    setIsClosing(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setShowConfirmDialog(false)
    setShowSuccessDialog(true)
    setIsClosing(false)
  }

  const difference = calculateDifference()
  const isDifferenceSignificant = Math.abs(difference) > 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cierre de Caja</h2>
          <p className="text-muted-foreground">Resumen del día y cierre de operaciones</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Clock className="w-3 h-3 mr-1" />
            {new Date().toLocaleDateString()}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Daily Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sales Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">${todaySummary.totalSales.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">{todaySummary.totalTransactions} transacciones</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">${todaySummary.averageTicket.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">por transacción</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Efectivo Esperado</CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">${todaySummary.expectedCash.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">apertura + ventas efectivo</p>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Desglose por Método de Pago</CardTitle>
              <CardDescription>Distribución de ventas por forma de pago</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Banknote className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Efectivo</p>
                      <p className="text-sm text-muted-foreground">
                        {Math.round((todaySummary.cashSales / todaySummary.totalSales) * 100)}% del total
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">${todaySummary.cashSales.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Tarjeta</p>
                      <p className="text-sm text-muted-foreground">
                        {Math.round((todaySummary.cardSales / todaySummary.totalSales) * 100)}% del total
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">${todaySummary.cardSales.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Transferencia</p>
                      <p className="text-sm text-muted-foreground">
                        {Math.round((todaySummary.transferSales / todaySummary.totalSales) * 100)}% del total
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">${todaySummary.transferSales.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Productos Más Vendidos Hoy</CardTitle>
              <CardDescription>Top 3 productos del día</CardDescription>
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
                  {todaySummary.topProducts.map((product, index) => (
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
        </div>

        {/* Cash Closing Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Cierre de Caja
              </CardTitle>
              <CardDescription>Conteo final del efectivo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Apertura:</span>
                  <span className="font-medium">${todaySummary.openingCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Ventas en efectivo:</span>
                  <span className="font-medium">${todaySummary.cashSales.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Efectivo esperado:</span>
                  <span className="text-primary">${todaySummary.expectedCash.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="actual-cash">Efectivo contado *</Label>
                <Input
                  id="actual-cash"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                />
              </div>

              {actualCash && (
                <div
                  className={`p-3 rounded-lg ${
                    isDifferenceSignificant
                      ? difference > 0
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-destructive/10 border border-destructive/20"
                      : "bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Diferencia:</span>
                    <div className="flex items-center gap-2">
                      {isDifferenceSignificant &&
                        (difference > 0 ? (
                          <TrendingUp className="w-4 h-4 text-primary" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-destructive" />
                        ))}
                      <span
                        className={`font-bold ${
                          isDifferenceSignificant
                            ? difference > 0
                              ? "text-primary"
                              : "text-destructive"
                            : "text-foreground"
                        }`}
                      >
                        {difference > 0 ? "+" : ""}${difference.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {isDifferenceSignificant && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {difference > 0 ? "Sobrante en caja" : "Faltante en caja"}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notas del cierre</Label>
                <Textarea
                  id="notes"
                  placeholder="Observaciones, incidencias o comentarios..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button className="w-full" onClick={() => setShowConfirmDialog(true)} disabled={!actualCash}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Cerrar Caja
              </Button>
            </CardContent>
          </Card>

          {/* Previous Closings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Cierres Anteriores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {previousClosings.map((closing) => (
                  <div
                    key={closing.id}
                    className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                    onClick={() => setSelectedClosing(closing)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{closing.date}</span>
                      <Badge
                        variant={Math.abs(closing.summary.difference) > 1 ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {closing.summary.difference > 0 ? "+" : ""}${closing.summary.difference.toFixed(2)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {closing.cashier} • ${closing.summary.totalSales.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Confirmar Cierre de Caja
            </DialogTitle>
            <DialogDescription>
              Esta acción cerrará definitivamente las operaciones del día. Verifica que todos los datos sean correctos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Efectivo esperado:</span>
                <span className="font-bold">${todaySummary.expectedCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Efectivo contado:</span>
                <span className="font-bold">${Number.parseFloat(actualCash || "0").toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span>Diferencia:</span>
                <span
                  className={`font-bold ${
                    isDifferenceSignificant ? (difference > 0 ? "text-primary" : "text-destructive") : "text-foreground"
                  }`}
                >
                  {difference > 0 ? "+" : ""}${difference.toFixed(2)}
                </span>
              </div>
            </div>
            {isDifferenceSignificant && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Diferencia significativa detectada</p>
                  <p className="text-xs text-muted-foreground">Revisa el conteo antes de proceder con el cierre</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isClosing}>
              Cancelar
            </Button>
            <Button onClick={handleCloseCash} disabled={isClosing}>
              {isClosing ? "Cerrando..." : "Confirmar Cierre"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <CheckCircle className="w-5 h-5" />
              Cierre Completado
            </DialogTitle>
            <DialogDescription>El cierre de caja se ha registrado exitosamente</DialogDescription>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-lg font-bold text-primary mb-2">Caja cerrada correctamente</p>
            <p className="text-sm text-muted-foreground">
              Fecha: {new Date().toLocaleDateString()} • Hora: {new Date().toLocaleTimeString()}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuccessDialog(false)}>
              Cerrar
            </Button>
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              Imprimir Resumen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Previous Closing Detail Dialog */}
      {selectedClosing && (
        <Dialog open={!!selectedClosing} onOpenChange={() => setSelectedClosing(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Cierre del {selectedClosing.date}</DialogTitle>
              <DialogDescription>Cajero: {selectedClosing.cashier}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Ventas totales:</span>
                  <span className="font-bold">${selectedClosing.summary.totalSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Efectivo esperado:</span>
                  <span className="font-bold">${selectedClosing.summary.expectedCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Efectivo contado:</span>
                  <span className="font-bold">${selectedClosing.summary.actualCash.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span>Diferencia:</span>
                  <span
                    className={`font-bold ${
                      Math.abs(selectedClosing.summary.difference) > 1
                        ? selectedClosing.summary.difference > 0
                          ? "text-primary"
                          : "text-destructive"
                        : "text-foreground"
                    }`}
                  >
                    {selectedClosing.summary.difference > 0 ? "+" : ""}${selectedClosing.summary.difference.toFixed(2)}
                  </span>
                </div>
              </div>
              {selectedClosing.notes && (
                <div>
                  <Label>Notas:</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedClosing.notes}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedClosing(null)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
