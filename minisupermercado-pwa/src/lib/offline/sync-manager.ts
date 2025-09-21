import { syncOps, isOnline, waitForOnline } from './indexeddb'

export interface SyncResult {
  success: boolean
  synced: number
  failed: number
  errors: string[]
}

export class SyncManager {
  private isSyncing = false
  private syncInterval: NodeJS.Timeout | null = null

  constructor() {
    this.setupEventListeners()
  }

  private setupEventListeners() {
    // Sincronizar cuando vuelva la conexión
    window.addEventListener('online', () => {
      this.syncAll()
    })

    // Sincronizar periódicamente cuando esté online
    if (isOnline()) {
      this.startPeriodicSync()
    }
  }

  async syncAll(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, synced: 0, failed: 0, errors: ['Ya hay una sincronización en progreso'] }
    }

    if (!isOnline()) {
      return { success: false, synced: 0, failed: 0, errors: ['Sin conexión a internet'] }
    }

    this.isSyncing = true
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] }

    try {
      const pendingSyncs = await syncOps.getPendingSyncs()
      
      for (const sync of pendingSyncs) {
        try {
          await this.syncItem(sync)
          await syncOps.markAsSynced(sync.id)
          result.synced++
        } catch (error) {
          result.failed++
          result.errors.push(`Error sincronizando ${sync.type}: ${error}`)
          
          // Incrementar contador de reintentos
          await syncOps.incrementRetries(sync.id)
        }
      }

      // Limpiar sincronizaciones antiguas
      await syncOps.clearOldSyncs()

    } catch (error) {
      result.success = false
      result.errors.push(`Error general de sincronización: ${error}`)
    } finally {
      this.isSyncing = false
    }

    return result
  }

  private async syncItem(sync: any): Promise<void> {
    const { type, action, data } = sync

    switch (type) {
      case 'product':
        await this.syncProduct(action, data)
        break
      case 'sale':
        await this.syncSale(action, data)
        break
      case 'cash_session':
        await this.syncCashSession(action, data)
        break
      default:
        throw new Error(`Tipo de sincronización no soportado: ${type}`)
    }
  }

  private async syncProduct(action: string, data: any): Promise<void> {
    const endpoint = '/api/products'
    
    switch (action) {
      case 'create':
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        break
      case 'update':
        await fetch(`${endpoint}/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.updates)
        })
        break
      case 'delete':
        await fetch(`${endpoint}/${data.id}`, {
          method: 'DELETE'
        })
        break
    }
  }

  private async syncSale(action: string, data: any): Promise<void> {
    const endpoint = '/api/sales'
    
    switch (action) {
      case 'create':
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        break
      case 'update':
        await fetch(`${endpoint}/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.updates)
        })
        break
    }
  }

  private async syncCashSession(action: string, data: any): Promise<void> {
    const endpoint = '/api/cash'
    
    switch (action) {
      case 'create':
        await fetch(`${endpoint}/open`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        break
      case 'update':
        await fetch(`${endpoint}/close`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        break
    }
  }

  startPeriodicSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    this.syncInterval = setInterval(async () => {
      if (isOnline() && !this.isSyncing) {
        await this.syncAll()
      }
    }, intervalMs)
  }

  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  async waitForSync(): Promise<void> {
    while (this.isSyncing) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  getSyncStatus(): { isSyncing: boolean; hasPeriodicSync: boolean } {
    return {
      isSyncing: this.isSyncing,
      hasPeriodicSync: this.syncInterval !== null
    }
  }
}

// Instancia global del sync manager
export const syncManager = new SyncManager()

// Funciones de conveniencia
export const syncAll = () => syncManager.syncAll()
export const startPeriodicSync = (intervalMs?: number) => syncManager.startPeriodicSync(intervalMs)
export const stopPeriodicSync = () => syncManager.stopPeriodicSync()
export const getSyncStatus = () => syncManager.getSyncStatus()
export const waitForSync = () => syncManager.waitForSync()
