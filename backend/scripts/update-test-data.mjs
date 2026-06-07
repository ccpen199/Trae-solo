import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.resolve(__dirname, '../../data/app.sqlite')

const db = new Database(dbPath)

const cargoUpdates = [
  { id: 1, cargo_name: '服装面料', cargo_type: '纺织品', start_city: '杭州市', end_city: '广州市', distance: 1250, weight: 2.5, volume: 8, base_price: 3230 },
  { id: 2, cargo_name: '生鲜水果', cargo_type: '食品', start_city: '昆明市', end_city: '成都市', distance: 850, weight: 1.2, volume: 5, base_price: 2210 },
  { id: 3, cargo_name: '机械设备', cargo_type: '机械', start_city: '苏州市', end_city: '武汉市', distance: 720, weight: 8.5, volume: 15, base_price: 1870 },
  { id: 4, cargo_name: '化工原料', cargo_type: '化工', start_city: '天津市', end_city: '济南市', distance: 320, weight: 5.0, volume: 6, base_price: 833 },
  { id: 5, cargo_name: '家电产品', cargo_type: '电器', start_city: '深圳市', end_city: '长沙市', distance: 780, weight: 3.5, volume: 12, base_price: 2040 },
  { id: 6, cargo_name: '图书文具', cargo_type: '日用品', start_city: '北京市', end_city: '石家庄市', distance: 290, weight: 1.8, volume: 4, base_price: 723 },
  { id: 7, cargo_name: '汽车配件', cargo_type: '汽配', start_city: '苏州市', end_city: '南京市', distance: 300, weight: 4.2, volume: 7, base_price: 782 }
]

const waybillUpdates = [
  { id: 1, agreed_price: 2200, platform_commission: 110, insurance_fee: 6.6, driver_receivable: 2083.4 },
  { id: 2, agreed_price: 980, platform_commission: 49, insurance_fee: 2.94, driver_receivable: 928.06 },
  { id: 3, agreed_price: 2400, platform_commission: 120, insurance_fee: 7.2, driver_receivable: 2272.8 },
  { id: 4, agreed_price: 850, platform_commission: 42.5, insurance_fee: 2.55, driver_receivable: 804.95 },
  { id: 5, agreed_price: 920, platform_commission: 46, insurance_fee: 2.76, driver_receivable: 871.24 }
]

const alerts = [
  { waybill_id: 1, alert_type: 'stationary', alert_level: 'warning', alert_message: '车辆静止超过95分钟，建议确认司机状态' },
  { waybill_id: 2, alert_type: 'off_route', alert_level: 'danger', alert_message: '检测到车辆偏离规划路线约3.2公里' },
  { waybill_id: 3, alert_type: 'timeout', alert_level: 'warning', alert_message: '预计已超时，请注意签收' }
]

const tx = db.transaction(() => {
  cargoUpdates.forEach(c => {
    const distanceFactor = c.distance > 1000 ? 1.15 : c.distance > 500 ? 1.05 : 1.0
    const vehicleFactor = 1.1
    const timeFactor = 1.0
    const suggestedPrice = c.base_price * distanceFactor * vehicleFactor * timeFactor
    
    db.prepare('UPDATE cargo_sources SET cargo_name = ?, cargo_type = ?, start_city = ?, end_city = ?, distance = ?, weight = ?, volume = ?, base_price = ?, distance_factor = ?, vehicle_factor = ?, time_factor = ?, suggested_price = ?, min_price = ?, max_price = ? WHERE id = ?').run(
      c.cargo_name, c.cargo_type, c.start_city, c.end_city, c.distance, c.weight, c.volume,
      c.base_price, distanceFactor, vehicleFactor, timeFactor, suggestedPrice, suggestedPrice * 0.9, suggestedPrice * 1.1,
      c.id
    )
  })
  
  waybillUpdates.forEach(w => {
    db.prepare('UPDATE waybills SET agreed_price = ?, platform_commission = ?, insurance_fee = ?, driver_receivable = ? WHERE id = ?').run(
      w.agreed_price, w.platform_commission, w.insurance_fee, w.driver_receivable, w.id
    )
  })
  
  db.prepare('DELETE FROM alerts').run()
  alerts.forEach(a => {
    db.prepare('INSERT INTO alerts (waybill_id, alert_type, alert_level, alert_message, is_handled, created_at) VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)').run(
      a.waybill_id, a.alert_type, a.alert_level, a.alert_message
    )
  })
})

try {
  tx()
  console.log('数据更新成功!')
} catch (err) {
  console.error('更新失败:', err.message)
}

console.log('\n货源数据:')
console.log(db.prepare('SELECT id, cargo_name, start_city, end_city, status FROM cargo_sources').all())
console.log('\n运单数:', db.prepare('SELECT COUNT(*) as c FROM waybills').get().c)
console.log('告警数:', db.prepare('SELECT COUNT(*) as c FROM alerts').get().c)

db.close()
