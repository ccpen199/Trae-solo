import { Merchant } from '../../entities/Merchant.js'
import { generateUUID } from '../../utils/id.js'

const merchantNames = [
  '沈阳商业城', '中兴商业大厦', '兴隆大家庭', '大商新玛特', '华润万家',
  '家乐福沈阳店', '沃尔玛购物广场', '欧亚联营', '千盛百货', '沈阳大悦城',
  '万达广场沈阳店', '恒隆广场', '万象城', 'K11购物艺术中心', '萃兮华都',
  '沈阳春天', '五爱市场', '南塔鞋城', '三好街电子市场', '北行农贸市场',
]

const categories = [
  'retail', 'catering', 'automotive', 'home_appliance', 'clothing',
  'electronics', 'supermarket', 'department_store', 'furniture', 'jewelry',
]

const districts = [
  '和平区', '沈河区', '皇姑区', '大东区', '铁西区',
  '苏家屯区', '浑南区', '沈北新区', '于洪区', '辽中区',
]

export function generateMerchants(count: number = 20): Partial<Merchant>[] {
  const merchants: Partial<Merchant>[] = []
  
  for (let i = 0; i < count; i++) {
    const name = merchantNames[i % merchantNames.length]
    const district = districts[Math.floor(Math.random() * districts.length)]
    
    merchants.push({
      id: generateUUID(),
      name,
      licenseNo: `SY${Date.now().toString().slice(-6)}${String(i).padStart(4, '0')}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      district,
      address: `${district}${Math.floor(Math.random() * 100)}号`,
      contactName: `联系人${i + 1}`,
      contactPhone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      status: Math.random() > 0.1 ? 'active' : Math.random() > 0.5 ? 'inactive' : 'pending',
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    })
  }
  
  return merchants
}
