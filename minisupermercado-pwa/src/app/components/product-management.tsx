"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Package, Plus, Search, Edit, Trash2, AlertTriangle, Filter, Grid, List } from "lucide-react"

const categories = ["all", "Bebidas", "Panadería", "Lácteos", "Granos", "Limpieza", "Snacks"]

interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
  minStock: number
  barcode?: string
  description?: string
  supplier?: string
}

export function ProductManagement() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Mock data - replace with real data from your backend
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: "Coca Cola 500ml",
      category: "Bebidas",
      price: 2.5,
      stock: 45,
      minStock: 20,
      barcode: "7501055363057",
      description: "Refresco de cola 500ml",
      supplier: "Coca Cola Company",
    },
    {
      id: 2,
      name: "Pan Integral",
      category: "Panadería",
      price: 4.0,
      stock: 15,
      minStock: 10,
      barcode: "7501234567890",
      description: "Pan integral rebanado",
      supplier: "Panadería Local",
    },
    {
      id: 3,
      name: "Leche Entera 1L",
      category: "Lácteos",
      price: 5.25,
      stock: 28,
      minStock: 15,
      barcode: "7501055123456",
      description: "Leche entera pasteurizada 1 litro",
      supplier: "Lácteos del Valle",
    },
    {
      id: 4,
      name: "Arroz 1kg",
      category: "Granos",
      price: 3.75,
      stock: 3,
      minStock: 10,
      barcode: "7501234567891",
      description: "Arroz blanco grano largo 1kg",
      supplier: "Distribuidora ABC",
    },
  ])

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.barcode?.includes(searchTerm)
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const lowStockProducts = products.filter((product) => product.stock <= product.minStock)

  const handleAddProduct = (productData: Omit<Product, "id">) => {
    const newProduct = {
      ...productData,
      id: Math.max(...products.map((p) => p.id)) + 1,
    }
    setProducts([...products, newProduct])
    setIsAddDialogOpen(false)
  }

  const handleEditProduct = (productData: Product) => {
    setProducts(products.map((p) => (p.id === productData.id ? productData : p)))
    setEditingProduct(null)
  }

  const handleDeleteProduct = (id: number) => {
    setProducts(products.filter((p) => p.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestión de Productos</h2>
          <p className="text-muted-foreground">
            {products.length} productos registrados • {lowStockProducts.length} con stock bajo
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Producto
            </Button>
          </DialogTrigger>
          <ProductDialog onSubmit={handleAddProduct} onCancel={() => setIsAddDialogOpen(false)} />
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre o código de barras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "Todas las categorías" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Alerta de Stock Bajo
            </CardTitle>
            <CardDescription>{lowStockProducts.length} productos necesitan reposición urgente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockProducts.map((product) => (
                <Badge key={product.id} variant="destructive" className="text-xs">
                  {product.name} ({product.stock} restantes)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onEdit={setEditingProduct} onDelete={handleDeleteProduct} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredProducts.map((product) => (
                <ProductListItem
                  key={product.id}
                  product={product}
                  onEdit={setEditingProduct}
                  onDelete={handleDeleteProduct}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No se encontraron productos</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Comienza agregando tu primer producto"}
            </p>
            {!searchTerm && selectedCategory === "all" && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primer Producto
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <ProductDialog
            product={editingProduct}
            onSubmit={handleEditProduct}
            onCancel={() => setEditingProduct(null)}
            isEditing
          />
        </Dialog>
      )}
    </div>
  )
}

function ProductCard({
  product,
  onEdit,
  onDelete,
}: {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (id: number) => void
}) {
  const isLowStock = product.stock <= product.minStock

  return (
    <Card className={`transition-all hover:shadow-md ${isLowStock ? "border-destructive/50" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base line-clamp-2">{product.name}</CardTitle>
            <CardDescription className="text-sm">{product.category}</CardDescription>
          </div>
          {isLowStock && <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</span>
          <Badge variant={isLowStock ? "destructive" : "secondary"}>Stock: {product.stock}</Badge>
        </div>

        {product.barcode && <p className="text-xs text-muted-foreground font-mono">{product.barcode}</p>}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => onEdit(product)}>
            <Edit className="w-3 h-3 mr-1" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive bg-transparent"
            onClick={() => onDelete(product.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ProductListItem({
  product,
  onEdit,
  onDelete,
}: {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (id: number) => void
}) {
  const isLowStock = product.stock <= product.minStock

  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
        <div>
          <h4 className="font-medium text-foreground">{product.name}</h4>
          <p className="text-sm text-muted-foreground">{product.category}</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-primary">${product.price.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <Badge variant={isLowStock ? "destructive" : "secondary"}>{product.stock} unidades</Badge>
        </div>
        <div className="text-right">
          {product.barcode && <p className="text-xs text-muted-foreground font-mono">{product.barcode}</p>}
        </div>
      </div>
      <div className="flex gap-2 ml-4">
        <Button variant="ghost" size="sm" onClick={() => onEdit(product)}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(product.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

function ProductDialog({
  product,
  onSubmit,
  onCancel,
  isEditing = false,
}: {
  product?: Product
  onSubmit: (product: any) => void
  onCancel: () => void
  isEditing?: boolean
}) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    category: product?.category || "",
    price: product?.price?.toString() || "",
    stock: product?.stock?.toString() || "",
    minStock: product?.minStock?.toString() || "",
    barcode: product?.barcode || "",
    description: product?.description || "",
    supplier: product?.supplier || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const productData = {
      ...formData,
      price: Number.parseFloat(formData.price),
      stock: Number.parseInt(formData.stock),
      minStock: Number.parseInt(formData.minStock),
    }

    if (isEditing && product) {
      onSubmit({ ...product, ...productData })
    } else {
      onSubmit(productData)
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{isEditing ? "Editar Producto" : "Agregar Nuevo Producto"}</DialogTitle>
        <DialogDescription>
          {isEditing ? "Modifica la información del producto" : "Completa los datos del nuevo producto"}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoría *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {categories.slice(1).map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Precio *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock">Stock *</Label>
            <Input
              id="stock"
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minStock">Stock Mín. *</Label>
            <Input
              id="minStock"
              type="number"
              value={formData.minStock}
              onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="barcode">Código de Barras</Label>
          <Input
            id="barcode"
            value={formData.barcode}
            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier">Proveedor</Label>
          <Input
            id="supplier"
            value={formData.supplier}
            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">{isEditing ? "Guardar Cambios" : "Agregar Producto"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
