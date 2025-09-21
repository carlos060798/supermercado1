import Dexie, { Table } from 'dexie'

export interface OfflineProduct {
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
  createdAt: string
  updatedAt: string
  synced: boolean
}

export interface OfflineSale {
  id: string
  total: number
  subtotal: number
  tax: number
  discount: number
  paymentMethod: string
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
  userId: string
  items: OfflineSaleItem[]
  synced: boolean
}

export interface OfflineSaleItem {
  id: string
  saleId: string
  productId: string
  quantity: number
  price: number
  subtotal: number
  createdAt: string
}

export interface OfflineCashSession {
  id: string
  startAmount: number
  endAmount?: number
  totalSales: number
  status: string
  openedAt: string
  closedAt?: string
  notes?: string
  userId: string
  synced: boolean
}

export interface SyncQueue {
  id: string
  type: 'product' | 'sale' | 'cash_session'
  action: 'create' | 'update' | 'delete'
  data: any
  timestamp: string
  retries: number
}

class OfflineDatabase extends Dexie {
  products!: Table<OfflineProduct>
  sales!: Table<OfflineSale>
  saleItems!: Table<OfflineSaleItem>
  cashSessions!: Table<OfflineCashSession>
  syncQueue!: Table<SyncQueue>

  constructor() {
    super('MinisupermercadoOffline')
    
    this.version(1).stores({
      products: 'id, name, barcode, category, synced',
      sales: 'id, userId, createdAt, synced',
      saleItems: 'id, saleId, productId',
      cashSessions: 'id, userId, status, synced',
      syncQueue: 'id, type, action, timestamp'
    })
  }
}

export const offlineDB = new OfflineDatabase()

// Product Operations
export const offlineProductOps = {
  async getAll(): Promise<OfflineProduct[]> {
    return offlineDB.products.toArray()
  },

  async getById(id: string): Promise<OfflineProduct | undefined> {
    return offlineDB.products.get(id)
  },

  async getByBarcode(barcode: string): Promise<OfflineProduct | undefined> {
    return offlineDB.products.where('barcode').equals(barcode).first()
  },

  async create(product: Omit<OfflineProduct, 'synced'>): Promise<string> {
    const id = crypto.randomUUID()
    await offlineDB.products.add({
      ...product,
      id,
      synced: false
    })
    
    // Agregar a la cola de sincronización
    await offlineDB.syncQueue.add({
      id: crypto.randomUUID(),
      type: 'product',
      action: 'create',
      data: { ...product, id },
      timestamp: new Date().toISOString(),
      retries: 0
    })
    
    return id
  },

  async update(id: string, updates: Partial<OfflineProduct>): Promise<void> {
    await offlineDB.products.update(id, updates)
    
    // Agregar a la cola de sincronización
    await offlineDB.syncQueue.add({
      id: crypto.randomUUID(),
      type: 'product',
      action: 'update',
      data: { id, updates },
      timestamp: new Date().toISOString(),
      retries: 0
    })
  },

  async delete(id: string): Promise<void> {
    await offlineDB.products.delete(id)
    
    // Agregar a la cola de sincronización
    await offlineDB.syncQueue.add({
      id: crypto.randomUUID(),
      type: 'product',
      action: 'delete',
      data: { id },
      timestamp: new Date().toISOString(),
      retries: 0
    })
  },

  async getLowStock(): Promise<OfflineProduct[]> {
    return offlineDB.products.where('stock').below(offlineDB.products.where('minStock')).toArray()
  }
}

// Sale Operations
export const offlineSaleOps = {
  async getAll(): Promise<OfflineSale[]> {
    return offlineDB.sales.toArray()
  },

  async getById(id: string): Promise<OfflineSale | undefined> {
    return offlineDB.sales.get(id)
  },

  async getByDateRange(startDate: string, endDate: string): Promise<OfflineSale[]> {
    return offlineDB.sales
      .where('createdAt')
      .between(startDate, endDate)
      .toArray()
  },

  async create(sale: Omit<OfflineSale, 'synced'>): Promise<string> {
    const id = crypto.randomUUID()
    
    // Crear la venta
    await offlineDB.sales.add({
      ...sale,
      id,
      synced: false
    })
    
    // Crear los items de la venta
    for (const item of sale.items) {
      await offlineDB.saleItems.add({
        ...item,
        id: crypto.randomUUID(),
        saleId: id
      })
    }
    
    // Agregar a la cola de sincronización
    await offlineDB.syncQueue.add({
      id: crypto.randomUUID(),
      type: 'sale',
      action: 'create',
      data: { ...sale, id },
      timestamp: new Date().toISOString(),
      retries: 0
    })
    
    return id
  },

  async update(id: string, updates: Partial<OfflineSale>): Promise<void> {
    await offlineDB.sales.update(id, updates)
    
    // Agregar a la cola de sincronización
    await offlineDB.syncQueue.add({
      id: crypto.randomUUID(),
      type: 'sale',
      action: 'update',
      data: { id, updates },
      timestamp: new Date().toISOString(),
      retries: 0
    })
  },

  async getDailyStats(date: string): Promise<any> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    
    const sales = await offlineDB.sales
      .where('createdAt')
      .between(startOfDay.toISOString(), endOfDay.toISOString())
      .toArray()
    
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0)
    const totalItems = sales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    )
    
    return {
      totalSales,
      totalItems,
      salesCount: sales.length,
      sales
    }
  }
}

// Cash Session Operations
export const offlineCashSessionOps = {
  async getOpenSession(userId: string): Promise<OfflineCashSession | undefined> {
    return offlineDB.cashSessions
      .where(['userId', 'status'])
      .equals([userId, 'OPEN'])
      .first()
  },

  async create(session: Omit<OfflineCashSession, 'synced'>): Promise<string> {
    const id = crypto.randomUUID()
    await offlineDB.cashSessions.add({
      ...session,
      id,
      synced: false
    })
    
    // Agregar a la cola de sincronización
    await offlineDB.syncQueue.add({
      id: crypto.randomUUID(),
      type: 'cash_session',
      action: 'create',
      data: { ...session, id },
      timestamp: new Date().toISOString(),
      retries: 0
    })
    
    return id
  },

  async closeSession(id: string, endAmount: number, notes?: string): Promise<void> {
    await offlineDB.cashSessions.update(id, {
      status: 'CLOSED',
      endAmount,
      closedAt: new Date().toISOString(),
      notes
    })
    
    // Agregar a la cola de sincronización
    await offlineDB.syncQueue.add({
      id: crypto.randomUUID(),
      type: 'cash_session',
      action: 'update',
      data: { id, updates: { status: 'CLOSED', endAmount, closedAt: new Date().toISOString(), notes } },
      timestamp: new Date().toISOString(),
      retries: 0
    })
  }
}

// Sync Operations
export const syncOps = {
  async getPendingSyncs(): Promise<SyncQueue[]> {
    return offlineDB.syncQueue.toArray()
  },

  async markAsSynced(syncId: string): Promise<void> {
    await offlineDB.syncQueue.delete(syncId)
  },

  async incrementRetries(syncId: string): Promise<void> {
    const sync = await offlineDB.syncQueue.get(syncId)
    if (sync) {
      await offlineDB.syncQueue.update(syncId, { retries: sync.retries + 1 })
    }
  },

  async clearOldSyncs(): Promise<void> {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    await offlineDB.syncQueue
      .where('timestamp')
      .below(oneWeekAgo.toISOString())
      .delete()
  }
}

// Utility functions
export const isOnline = (): boolean => {
  return navigator.onLine
}

export const waitForOnline = (): Promise<void> => {
  return new Promise((resolve) => {
    if (navigator.onLine) {
      resolve()
    } else {
      const handleOnline = () => {
        window.removeEventListener('online', handleOnline)
        resolve()
      }
      window.addEventListener('online', handleOnline)
    }
  })
}
