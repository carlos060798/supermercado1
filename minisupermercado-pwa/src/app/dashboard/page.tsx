'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Settings, 
  LogOut,
  Wifi,
  WifiOff,
  Sync,
  AlertTriangle
} from 'lucide-react'
import { Alert, AlertDescription } from '@/app/components/ui/alert'

interface DashboardStats {
  totalSales: number
  totalProducts: number
  lowStockItems: number
  todayRevenue: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalProducts: 0,
    lowStockItems: 0,
    todayRevenue: 0
  })
  const [isOnline, setIsOnline] = useState(true)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // Verificar estado de conexión
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cargar estadísticas
    loadStats()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [router])

  const loadStats = async () => {
    try {
      // En una implementación real, esto vendría de la API
      // Por ahora, usamos datos mock
      setStats({
        totalSales: 1247,
        totalProducts: 89,
        lowStockItems: 5,
        todayRevenue: 1250.50
      })
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const handleSync = async () => {
    // Implementar sincronización manual
    console.log('Sincronizando...')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">MiniSuper</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Estado de conexión */}
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <Wifi className="h-3 w-3 mr-1" />
                    Online
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Offline
                  </Badge>
                )}
              </div>
              
              <Button variant="outline" size="sm" onClick={handleSync}>
                <Sync className="h-4 w-4 mr-1" />
                Sincronizar
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alertas */}
        {!isOnline && (
          <Alert className="mb-6">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Estás trabajando offline. Los datos se sincronizarán cuando vuelva la conexión.
            </AlertDescription>
          </Alert>
        )}

        {stats.lowStockItems > 0 && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Tienes {stats.lowStockItems} productos con stock bajo. Revisa el inventario.
            </AlertDescription>
          </Alert>
        )}

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.todayRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalSales} ventas totales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                En inventario
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lowStockItems}</div>
              <p className="text-xs text-muted-foreground">
                Necesitan reabastecimiento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isOnline ? 'Online' : 'Offline'}
              </div>
              <p className="text-xs text-muted-foreground">
                Conexión {isOnline ? 'activa' : 'perdida'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Acciones rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/sales')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-blue-600" />
                Nueva Venta
              </CardTitle>
              <CardDescription>
                Registrar una nueva venta
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/products')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2 text-green-600" />
                Inventario
              </CardTitle>
              <CardDescription>
                Gestionar productos
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/reports')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                Reportes
              </CardTitle>
              <CardDescription>
                Ver estadísticas y análisis
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/settings')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-gray-600" />
                Configuración
              </CardTitle>
              <CardDescription>
                Ajustes del sistema
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  )
}
