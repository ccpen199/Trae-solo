import { POSTerminal } from '../../entities/POSTerminal.js'
import { generateUUID } from '../../utils/id.js'
import type { Store } from '../../entities/Store.js'

const terminalModels = [
  'Verifone VX520', 'Ingenico iCT220', 'PAX S80', 'Landi E550', 'Newland N910',
  'Verifone V200c', 'Ingenico Desk/3500', 'PAX A920', 'Castles VEGA3000', 'SZZT Z50',
]

const statuses: Array<'active' | 'inactive' | 'maintenance'> = ['active', 'inactive', 'maintenance']

export function generatePOSTerminals(stores: Store[], count: number = 40): Partial<POSTerminal>[] {
  const terminals: Partial<POSTerminal>[] = []
  
  for (let i = 0; i < count; i++) {
    const store = stores[Math.floor(Math.random() * stores.length)]
    const daysAgo = Math.floor(Math.random() * 7)
    
    terminals.push({
      id: generateUUID(),
      merchantId: store.merchantId,
      storeId: store.id,
      terminalNo: `POS${String(i + 1).padStart(6, '0')}`,
      model: terminalModels[Math.floor(Math.random() * terminalModels.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      lastHeartbeat: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - Math.random() * 200 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    })
  }
  
  return terminals
}
