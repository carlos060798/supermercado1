'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog'
import { Label } from '@/app/components/ui/label'
import { Textarea } from '@/app/components/ui/textarea'
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle,
  ArrowLeft
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  description?: string
  price: number
  cost: number
  stock: number
  minStock: number
  category?: string
  barcode?: string
  isActive: boolean
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    category: '',
    barcode: ''
  })

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm])

  const loadProducts = async () => {
    try {
      // En una implementación real, esto vendría de la API
      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Coca Cola 500ml',
          description: 'Bebida gaseosa',
          price: 2.50,
          cost: 1.80,
          stock: 25,
          minStock: 10,
          category: 'Bebidas',
          barcode: '1234567890123',
          isActive: true
        },
        {
          id: '2',
          name: 'Pan Integral',
          description: 'Pan de trigo integral',
          price: 1.20,
          cost: 0.80,
          stock: 3,
          minStock: 5,
          category: 'Panadería',
          barcode: '1234567890124',
          isActive: true
        },
        {
          id: '3',
          name: 'Leche Entera 1L',
          description: 'Leche fresca entera',
          price: 3.00,
          cost: 2.20,
          stock: 15,
          minStock: 8,
          category: 'Lácteos',
          barcode: '1234567890125',
          isActive: true
        }
      ]
      setProducts(mockProducts)
    } catch (error) {
      console.error('Error cargando productos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    if (!searchTerm) {
      setFilteredProducts(products)
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.includes(searchTerm)
      )
      setFilteredProducts(filtered)
    }
  }

  const handleAddProduct = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      cost: '',
      stock: '',
      minStock: '',
      category: '',
      barcode: ''
    })
    setIsDialogOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      cost: product.cost.toString(),
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      category: product.category || '',
      barcode: product.barcode || ''
    })
    setIsDialogOpen(true)
  }

  const handleSaveProduct = async () => {
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost),
        stock: parseInt(formData.stock),
        minStock: parseInt(formData.minStock)
      }

      if (editingProduct) {
        // Actualizar producto existente
        setProducts(products.map(p => 
          p.id === editingProduct.id 
            ? { ...p, ...productData }
            : p
        ))
      } else {
        // Crear nuevo producto
        const newProduct: Product = {
          id: Date.now().toString(),
          ...productData,
          isActive: true
        }
        setProducts([...products, newProduct])
      }

      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error guardando producto:', error)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      setProducts(products.filter(p => p.id !== productId))
    }
  }

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock <= minStock) {
      return <Badge variant="destructive">Stock Bajo</Badge>
    } else if (stock <= minStock * 2) {
      return <Badge variant="secondary">Stock Medio</Badge>
    } else {
      return <Badge variant="default">Stock OK</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando productos...</p>
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
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <Package className="h-8 w-8 text-blue-600 mr-3 ml-4" />
              <h1 className="text-xl font-semibold text-gray-900">Gestión de Productos</h1>
            </div>
            
            <Button onClick={handleAddProduct}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barra de búsqueda */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar productos por nombre, categoría o código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabla de productos */}
        <Card>
          <CardHeader>
            <CardTitle>Productos ({filteredProducts.length})</CardTitle>
            <CardDescription>
              Gestiona tu inventario de productos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-gray-500">{product.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{product.category || '-'}</TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {product.stock}
                        {product.stock <= product.minStock && (
                          <AlertTriangle className="h-4 w-4 text-red-500 ml-2" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStockStatus(product.stock, product.minStock)}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {product.barcode || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Dialog para agregar/editar producto */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Modifica la información del producto' : 'Agrega un nuevo producto al inventario'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre del Producto</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Coca Cola 500ml"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del producto"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Precio de Venta</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="cost">Costo</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock">Stock Actual</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="minStock">Stock Mínimo</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="category">Categoría</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ej: Bebidas, Panadería, Lácteos"
              />
            </div>
            
            <div>
              <Label htmlFor="barcode">Código de Barras</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="1234567890123"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveProduct}>
                {editingProduct ? 'Actualizar' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
