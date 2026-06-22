import { openDB, IDBPDatabase } from 'idb'
import { encryptData, decryptData } from './crypto'
import type {
  RepairTask,
  Technician,
  Review,
  ServiceReport,
  PaymentProof,
  AppUser,
} from '../types'

const DB_NAME = 'repair_platform_db'
const DB_VERSION = 1
const ENCRYPT_STORES = ['tasks', 'reviews', 'reports', 'payments', 'technicians']

interface DBSchema {
  users: { key: string; value: AppUser }
  technicians: { key: string; value: string }
  tasks: { key: string; value: string }
  reviews: { key: string; value: string }
  reports: { key: string; value: string }
  payments: { key: string; value: string }
  offlineQueue: { key: string; value: { id: string; action: string; data: unknown; timestamp: number } }
}

let db: IDBPDatabase<DBSchema> | null = null

const initDB = async (): Promise<IDBPDatabase<DBSchema>> => {
  if (db) return db

  db = await openDB<DBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('technicians')) {
        db.createObjectStore('technicians', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('reviews')) {
        db.createObjectStore('reviews', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('reports')) {
        db.createObjectStore('reports', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('payments')) {
        db.createObjectStore('payments', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('offlineQueue')) {
        db.createObjectStore('offlineQueue', { keyPath: 'id' })
      }
    },
  })

  return db
}

const shouldEncrypt = (storeName: string): boolean => {
  return ENCRYPT_STORES.includes(storeName)
}

export const saveData = async <T>(storeName: keyof DBSchema, data: T & { id: string }): Promise<void> => {
  const database = await initDB()
  const tx = database.transaction(storeName, 'readwrite')
  const store = tx.store

  if (shouldEncrypt(storeName as string)) {
    const encrypted = { id: data.id, encrypted: encryptData(data) }
    await store.put(encrypted as unknown as T & { id: string })
  } else {
    await store.put(data)
  }

  await tx.done
}

export const getData = async <T>(storeName: keyof DBSchema, id: string): Promise<T | null> => {
  const database = await initDB()
  const result = await database.get(storeName, id)

  if (!result) return null

  if (shouldEncrypt(storeName as string)) {
    const encryptedResult = result as unknown as { id: string; encrypted: string }
    return decryptData<T>(encryptedResult.encrypted)
  }

  return result as unknown as T
}

export const getAllData = async <T>(storeName: keyof DBSchema): Promise<T[]> => {
  const database = await initDB()
  const results = await database.getAll(storeName)

  if (shouldEncrypt(storeName as string)) {
    return results
      .map(r => {
        const encryptedResult = r as unknown as { id: string; encrypted: string }
        return decryptData<T>(encryptedResult.encrypted)
      })
      .filter((r): r is T => r !== null)
  }

  return results as unknown as T[]
}

export const deleteData = async (storeName: keyof DBSchema, id: string): Promise<void> => {
  const database = await initDB()
  const tx = database.transaction(storeName, 'readwrite')
  await tx.store.delete(id)
  await tx.done
}

export const saveTask = (task: RepairTask) => saveData<RepairTask>('tasks', task)
export const getTask = (id: string) => getData<RepairTask>('tasks', id)
export const getAllTasks = () => getAllData<RepairTask>('tasks')

export const saveReview = (review: Review) => saveData<Review>('reviews', review)
export const getAllReviews = () => getAllData<Review>('reviews')

export const saveReport = (report: ServiceReport) => saveData<ServiceReport>('reports', report)
export const getReport = (id: string) => getData<ServiceReport>('reports', id)
export const getAllReports = () => getAllData<ServiceReport>('reports')

export const savePayment = (payment: PaymentProof) => saveData<PaymentProof>('payments', payment)
export const getAllPayments = () => getAllData<PaymentProof>('payments')

export const saveTechnician = (tech: Technician) => saveData<Technician>('technicians', tech)
export const getAllTechnicians = () => getAllData<Technician>('technicians')

export const saveUser = (user: AppUser) => saveData<AppUser>('users', user)
export const getCurrentUser = async (): Promise<AppUser | null> => {
  const users = await getAllData<AppUser>('users')
  return users.length > 0 ? users[0] : null
}

export const addToOfflineQueue = async (action: string, data: unknown): Promise<void> => {
  const database = await initDB()
  const item = {
    id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    action,
    data,
    timestamp: Date.now(),
  }
  const tx = database.transaction('offlineQueue', 'readwrite')
  await tx.store.put(item)
  await tx.done
}

export const getOfflineQueue = async () => {
  const database = await initDB()
  return database.getAll('offlineQueue')
}

export const clearOfflineQueueItem = async (id: string): Promise<void> => {
  const database = await initDB()
  const tx = database.transaction('offlineQueue', 'readwrite')
  await tx.store.delete(id)
  await tx.done
}

export interface DBStats {
  tasks: number
  technicians: number
  reviews: number
  reports: number
  payments: number
  offlineQueue: number
  users: number
  totalEncryptedBytes: number
}

export const getDbStats = async (): Promise<DBStats> => {
  const database = await initDB()
  const stores = ['users', 'technicians', 'tasks', 'reviews', 'reports', 'payments', 'offlineQueue'] as const

  const counts: Record<string, number> = {}
  let totalBytes = 0

  for (const store of stores) {
    const all = await database.getAll(store as keyof DBSchema)
    counts[store] = all.length
    for (const item of all) {
      totalBytes += JSON.stringify(item).length * 2
    }
  }

  return {
    users: counts['users'] || 0,
    tasks: counts['tasks'] || 0,
    technicians: counts['technicians'] || 0,
    reviews: counts['reviews'] || 0,
    reports: counts['reports'] || 0,
    payments: counts['payments'] || 0,
    offlineQueue: counts['offlineQueue'] || 0,
    totalEncryptedBytes: totalBytes,
  }
}

export const clearAllData = async (): Promise<void> => {
  const database = await initDB()
  const stores = ['users', 'technicians', 'tasks', 'reviews', 'reports', 'payments', 'offlineQueue'] as const
  for (const store of stores) {
    const tx = database.transaction(store, 'readwrite')
    await tx.store.clear()
    await tx.done
  }
}

export const exportAllData = async (): Promise<string> => {
  const [users, technicians, tasks, reviews, reports, payments, offlineQueue] = await Promise.all([
    getAllData<AppUser>('users'),
    getAllData<Technician>('technicians'),
    getAllData<RepairTask>('tasks'),
    getAllData<Review>('reviews'),
    getAllData<ServiceReport>('reports'),
    getAllData<PaymentProof>('payments'),
    getOfflineQueue(),
  ])

  const exportObj = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    data: { users, technicians, tasks, reviews, reports, payments, offlineQueue },
  }

  return JSON.stringify(exportObj, null, 2)
}
