import { Store } from '../../entities/Store.js'
import { generateUUID } from '../../utils/id.js'
import type { Merchant } from '../../entities/Merchant.js'
import type { GeoLocation } from '../../../../shared/types/index.js'

const storeNames = [
  '旗舰店', '中心店', '体验店', '专卖店', '精品店',
  '社区店', '形象店', '旗舰店A店', '购物中心店', '步行街店',
]

const districts = [
  '和平区', '沈河区', '皇姑区', '大东区', '铁西区',
  '苏家屯区', '浑南区', '沈北新区', '于洪区', '辽中区',
]

export function generateStores(merchants: Merchant[], count: number = 30): Partial<Store>[] {
  const stores: Partial<Store>[] = []
  
  for (let i = 0; i < count; i++) {
    const merchant = merchants[Math.floor(Math.random() * merchants.length)]
    const district = districts[Math.floor(Math.random() * districts.length)]
    const baseLat = 41.8 + Math.random() * 0.3
    const baseLng = 123.4 + Math.random() * 0.3
    
    const location: GeoLocation = {
      latitude: baseLat,
      longitude: baseLng,
      address: `${district}${Math.floor(Math.random() * 200)}号`,
    }
    
    stores.push({
      id: generateUUID(),
      merchantId: merchant.id,
      name: `${merchant.name}${storeNames[i % storeNames.length]}`,
      address: `${district}${Math.floor(Math.random() * 200)}号`,
      district,
      location,
      status: Math.random() > 0.15 ? 'active' : 'inactive',
      createdAt: new Date(Date.now() - Math.random() * 300 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    })
  }
  
  return stores
}
