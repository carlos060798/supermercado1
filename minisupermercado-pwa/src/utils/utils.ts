
"use client"
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// src/lib/offline/indexeddb.ts
import Dexie, { Table } from 'dexie'

export interface OfflineProduct {
  id?: number
  serverId?: string
  name: string
  code: string
  barcode?: string
  price: number
  cost?: number
  stock: number
  minStock: number
  maxStock?: number
  category: string
  brand?: string
  description?: string
  image?: string
  unit: string
  active: boolean
  lastModified: Date
  synced: boolean
  action?: 'CREATE' | 'UPDATE' | 'DELETE'
}

export interface OfflineSale {
  id?: number
  serverId?: string
  saleNumber: string
  date: Date
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: string
  userId: string
  customerId?: string
  notes?: string
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'
  items: OfflineSaleItem[]
  lastModified: Date
  synced: boolean
  action?: 'CREATE' | 'UPDATE'
}

export interface OfflineSaleItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  discount: number
  subtotal: number
}

export interface SyncLog {
  id?: number
  timestamp: Date
  direction: 'upload' | 'download'
  status: 'success' | 'error' | 'conflict'
  details: string
}

export class OfflineDB extends Dexie {
  products!: Table<OfflineProduct>
  sales!: Table<OfflineSale>
  syncLogs!: Table<SyncLog>

  constructor() {
    super('MinisupermercadoDB')
    
    this.version(1).stores({
      products: '++id, serverId, code, barcode, category, synced, lastModified',
      sales: '++id, serverId, saleNumber, date, userId, synced, lastModified',
      syncLogs: '++id, timestamp, direction, status',
    })
  }

  // Product operations
  async createProduct(product: Omit<OfflineProduct, 'id' | 'lastModified' | 'synced'>) {
    return this.products.add({
      ...product,
      lastModified: new Date(),
      synced: false,
      action: 'CREATE',
    })
  }

  async updateProduct(id: number, updates: Partial<OfflineProduct>) {
    return this.products.update(id, {
      ...updates,
      lastModified: new Date(),
      synced: false,
      action: 'UPDATE',
    })
  }

  async deleteProduct(id: number) {
    return this.products.update(id, {
      active: false,
      lastModified: new Date(),
      synced: false,
      action: 'DELETE',
    })
  }

  async getProducts(filters?: {
    category?: string
    active?: boolean
    lowStock?: boolean
    search?: string
  }) {
    let collection = this.products.toCollection()

    if (filters?.category) {
      collection = collection.filter(p => p.category === filters.category)
    }

    if (filters?.active !== undefined) {
      collection = collection.filter(p => p.active === filters.active)
    }

    if (filters?.search) {
      collection = collection.filter(p => 
        p.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
        p.code.toLowerCase().includes(filters.search!.toLowerCase()) ||
        (p.barcode && p.barcode.includes(filters.search!))
      )
    }

    let products = await collection.toArray()

    if (filters?.lowStock) {
      products = products.filter(p => p.stock <= p.minStock)
    }

    return products
  }

  // Sale operations
  async createSale(sale: Omit<OfflineSale, 'id' | 'lastModified' | 'synced'>) {
    return this.sales.add({
      ...sale,
      lastModified: new Date(),
      synced: false,
      action: 'CREATE',
    })
  }

  async getSales(filters?: {
    startDate?: Date
    endDate?: Date
    userId?: string
    paymentMethod?: string
    status?: string
  }) {
    let collection = this.sales.toCollection()

    if (filters?.startDate && filters?.endDate) {
      collection = collection.filter(s => 
        s.date >= filters.startDate! && s.date <= filters.endDate!
      )
    }

    if (filters?.userId) {
      collection = collection.filter(s => s.userId === filters.userId)
    }

    if (filters?.paymentMethod) {
      collection = collection.filter(s => s.paymentMethod === filters.paymentMethod)
    }

    if (filters?.status) {
      collection = collection.filter(s => s.status === filters.status)
    }

    return collection.reverse().toArray()
  }

  // Sync operations
  async getUnsyncedProducts() {
    return this.products.where('synced').equals(false).toArray()
  }

  async getUnsyncedSales() {
    return this.sales.where('synced').equals(false).toArray()
  }

  async markProductsSynced(productIds: number[]) {
    return this.products.where('id').anyOf(productIds).modify({ synced: true })
  }

  async markSalesSynced(saleIds: number[]) {
    return this.sales.where('id').anyOf(saleIds).modify({ synced: true })
  }

  async logSync(log: Omit<SyncLog, 'id' | 'timestamp'>) {
    return this.syncLogs.add({
      ...log,
      timestamp: new Date(),
    })
  }

  async clearSyncLogs(olderThan: Date) {
    return this.syncLogs.where('timestamp').below(olderThan).delete()
  }

  // Utility methods
  async generateSaleNumber() {
    const today = new Date()
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '')
    
    const lastSale = await this.sales
      .where('saleNumber')
      .startsWith(datePrefix)
      .last()

    let sequence = 1
    if (lastSale) {
      const lastSequence = parseInt(lastSale.saleNumber.slice(-4))
      sequence = lastSequence + 1
    }

    return `${datePrefix}${sequence.toString().padStart(4, '0')}`
  }

  async updateProductStock(productId: string, quantityChange: number) {
    const product = await this.products.where('serverId').equals(productId).first()
    
    if (!product) {
      throw new Error('Product not found')
    }

    const newStock = product.stock + quantityChange
    
    if (newStock < 0) {
      throw new Error('Insufficient stock')
    }

    return this.updateProduct(product.id!, { stock: newStock })
  }
}

// Export singleton instance
export const offlineDB = new OfflineDB()

// src/lib/offline/sync-manager.ts
import { offlineDB, OfflineProduct, OfflineSale } from './utils'

export class SyncManager {
  private syncInProgress = false
  private lastSyncTimestamp: string | null = null

  constructor() {
    this.lastSyncTimestamp = localStorage.getItem('lastSyncTimestamp')
  }

  async isOnline(): Promise<boolean> {
    return navigator.onLine
  }

  async uploadChanges(): Promise<{
    success: boolean
    results?: any
    error?: string
  }> {
    if (this.syncInProgress) {
      return { success: false, error: 'Sync already in progress' }
    }

    if (!(await this.isOnline())) {
      return { success: false, error: 'No internet connection' }
    }

    this.syncInProgress = true

    try {
      const [unsyncedProducts, unsyncedSales] = await Promise.all([
        offlineDB.getUnsyncedProducts(),
        offlineDB.getUnsyncedSales(),
      ])

      if (unsyncedProducts.length === 0 && unsyncedSales.length === 0) {
        return { success: true, results: { products: { processed: 0 }, sales: { processed: 0 } } }
      }

      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token')
      }

      const syncData = {
        products: unsyncedProducts.map(this.formatProductForUpload),
        sales: unsyncedSales.map(this.formatSaleForUpload),
        lastSyncTimestamp: this.lastSyncTimestamp,
      }

      const response = await fetch('/api/sync/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(syncData),
      })

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        // Mark synced items
        const syncedProductIds = unsyncedProducts
          .filter((_, index) => index < result.results.products.processed)
          .map(p => p.id!)

        const syncedSaleIds = unsyncedSales
          .filter((_, index) => index < result.results.sales.processed)
          .map(s => s.id!)

        await Promise.all([
          offlineDB.markProductsSynced(syncedProductIds),
          offlineDB.markSalesSynced(syncedSaleIds),
        ])

        await offlineDB.logSync({
          direction: 'upload',
          status: 'success',
          details: `Uploaded ${result.results.products.processed} products, ${result.results.sales.processed} sales`,
        })

        this.lastSyncTimestamp = result.syncTimestamp
        localStorage.setItem('lastSyncTimestamp', this.lastSyncTimestamp)
      }

      return { success: result.success, results: result.results, error: result.error }
    } catch (error) {
      await offlineDB.logSync({
        direction: 'upload',
        status: 'error',
        details: error instanceof Error ? error.message : 'Unknown error',
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    } finally {
      this.syncInProgress = false
    }
  }

  async downloadChanges(): Promise<{
    success: boolean
    statistics?: any
    error?: string
  }> {
    if (this.syncInProgress) {
      return { success: false, error: 'Sync already in progress' }
    }

    if (!(await this.isOnline())) {
      return { success: false, error: 'No internet connection' }
    }

    this.syncInProgress = true

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token')
      }

      const params = new URLSearchParams({
        includeProducts: 'true',
        includeSales: 'true',
        includeOwnSalesOnly: 'true',
      })

      if (this.lastSyncTimestamp) {
        params.append('lastSyncTimestamp', this.lastSyncTimestamp)
      }

      const response = await fetch(`/api/sync/download?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        // Update local database with server data
        await this.mergeServerData(result.data)

        await offlineDB.logSync({
          direction: 'download',
          status: 'success',
          details: `Downloaded ${result.statistics.productsCount} products, ${result.statistics.salesCount} sales`,
        })

        this.lastSyncTimestamp = result.data.syncTimestamp
        localStorage.setItem('lastSyncTimestamp', this.lastSyncTimestamp)
      }

      return { 
        success: result.success, 
        statistics: result.statistics, 
        error: result.error 
      }
    } catch (error) {
      await offlineDB.logSync({
        direction: 'download',
        status: 'error',
        details: error instanceof Error ? error.message : 'Unknown error',
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed',
      }
    } finally {
      this.syncInProgress = false
    }
  }

  async fullSync(): Promise<{
    uploadResults?: any
    downloadResults?: any
    success: boolean
    error?: string
  }> {
    try {
      // First upload local changes
      const uploadResults = await this.uploadChanges()
      
      // Then download server changes
      const downloadResults = await this.downloadChanges()

      return {
        uploadResults,
        downloadResults,
        success: uploadResults.success && downloadResults.success,
        error: uploadResults.error || downloadResults.error,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Full sync failed',
      }
    }
  }

  private formatProductForUpload(product: OfflineProduct) {
    return {
      id: product.serverId || '',
      localId: product.id?.toString(),
      name: product.name,
      code: product.code,
      barcode: product.barcode,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      minStock: product.minStock,
      maxStock: product.maxStock,
      category: product.category,
      brand: product.brand,
      description: product.description,
      image: product.image,
      unit: product.unit,
      active: product.active,
      lastModified: product.lastModified.toISOString(),
      action: product.action || 'UPDATE',
    }
  }

  private formatSaleForUpload(sale: OfflineSale) {
    return {
      id: sale.serverId || '',
      localId: sale.id?.toString(),
      saleNumber: sale.saleNumber,
      date: sale.date.toISOString(),
      subtotal: sale.subtotal,
      tax: sale.tax,
      discount: sale.discount,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      userId: sale.userId,
      customerId: sale.customerId,
      notes: sale.notes,
      status: sale.status,
      items: sale.items,
      lastModified: sale.lastModified.toISOString(),
      action: sale.action || 'CREATE',
    }
  }

  private async mergeServerData(serverData: { products: any[], sales: any[] }) {
    // Merge products
    for (const serverProduct of serverData.products) {
      const existingProduct = await offlineDB.products
        .where('serverId')
        .equals(serverProduct.id)
        .first()

      if (existingProduct) {
        // Update existing product
        await offlineDB.products.update(existingProduct.id!, {
          name: serverProduct.name,
          code: serverProduct.code,
          barcode: serverProduct.barcode,
          price: serverProduct.price,
          cost: serverProduct.cost,
          stock: serverProduct.stock,
          minStock: serverProduct.minStock,
          maxStock: serverProduct.maxStock,
          category: serverProduct.category,
          brand: serverProduct.brand,
          description: serverProduct.description,
          image: serverProduct.image,
          unit: serverProduct.unit,
          active: serverProduct.active,
          lastModified: new Date(serverProduct.updatedAt),
          synced: true,
        })
      } else {
        // Create new product
        await offlineDB.products.add({
          serverId: serverProduct.id,
          name: serverProduct.name,
          code: serverProduct.code,
          barcode: serverProduct.barcode,
          price: serverProduct.price,
          cost: serverProduct.cost,
          stock: serverProduct.stock,
          minStock: serverProduct.minStock,
          maxStock: serverProduct.maxStock,
          category: serverProduct.category,
          brand: serverProduct.brand,
          description: serverProduct.description,
          image: serverProduct.image,
          unit: serverProduct.unit,
          active: serverProduct.active,
          lastModified: new Date(serverProduct.updatedAt),
          synced: true,
        })
      }
    }

    // Merge sales (usually read-only from server)
    for (const serverSale of serverData.sales) {
      const existingSale = await offlineDB.sales
        .where('serverId')
        .equals(serverSale.id)
        .first()

      if (!existingSale) {
        await offlineDB.sales.add({
          serverId: serverSale.id,
          saleNumber: serverSale.saleNumber,
          date: new Date(serverSale.date),
          subtotal: serverSale.subtotal,
          tax: serverSale.tax,
          discount: serverSale.discount,
          total: serverSale.total,
          paymentMethod: serverSale.paymentMethod,
          userId: serverSale.userId,
          customerId: serverSale.customerId,
          notes: serverSale.notes,
          status: serverSale.status,
          items: serverSale.items,
          lastModified: new Date(serverSale.updatedAt),
          synced: true,
        })
      }
    }
  }

  // Auto-sync setup
  setupAutoSync(intervalMinutes: number = 15) {
    setInterval(async () => {
      if (await this.isOnline() && !this.syncInProgress) {
        await this.fullSync()
      }
    }, intervalMinutes * 60 * 1000)

    // Sync when coming back online
    window.addEventListener('online', async () => {
      if (!this.syncInProgress) {
        await this.fullSync()
      }
    })
  }
}

// Export singleton instance
export const syncManager = new SyncManager()

// src/lib/offline/pwa-utils.ts
export class PWAUtils {
  static async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registered:', registration)
        return registration
      } catch (error) {
        console.error('Service Worker registration failed:', error)
        return null
      }
    }
    return null
  }

  static async installPrompt() {
    // This will be handled by the browser's install prompt
    // or a custom install component
  }

  static isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true
  }

  static async checkForUpdates() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      registration.update()
    }
  }

  static getNetworkStatus() {
    return {
      online: navigator.onLine,
      effectiveType: (navigator as any).connection?.effectiveType || 'unknown',
      downlink: (navigator as any).connection?.downlink || 0,
    }
  }

  static async requestPersistentStorage() {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      const persistent = await navigator.storage.persist()
      console.log('Persistent storage:', persistent)
      return persistent
    }
    return false
  }

  static async getStorageQuota() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return {
        quota: estimate.quota,
        usage: estimate.usage,
        usagePercentage: estimate.quota ? (estimate.usage! / estimate.quota) * 100 : 0,
      }
    }
    return null
  }
}
    