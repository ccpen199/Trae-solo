import dotenv from 'dotenv'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
const dbPath = path.resolve(__dirname, '../../data/app.sqlite')

const db = new Database(dbPath)

const cargoData = [
  {
    cargo_name: '服装面料',
    cargo_type: '纺织品',
    quantity: 500,
    weight: 2.5,
    volume: 8,
    start_city: '杭州',
    end_city: '广州',
    distance: 1250,
    expected_price: 3800,
    status: 'trading'
  },
  {
    cargo_name: '生鲜水果',
    cargo_type: '食品',
    quantity: 200,
    weight: 1.2,
    volume: 5,
    start_city: '昆明',
    end_city: '成都',
    distance: 850,
    expected_price: 2600,
    status: 'signed'
  },
  {
    cargo_name: '机械设备',
    cargo_type: '机械',
    quantity: 3,
    weight: 8.5,
    volume: 15,
    start_city: '苏州',
    end_city: '武汉',
    distance: 720,
    expected_price: 2200,
    status: 'published'
  },
  {
    cargo_name: '化工原料',
    cargo_type: '化工',
    quantity: 100,
    weight: 5.0,
    volume: 6,
    start_city: '天津',
    end_city: '济南',
    distance: 320,
    expected_price: 980,
    status: 'completed'
  },
  {
    cargo_name: '家电产品',
    cargo_type: '电器',
    quantity: 80,
    weight: 3.5,
    volume: 12,
    start_city: '深圳',
    end_city: '长沙',
    distance: 780,
    expected_price: 2400,
    status: 'trading'
  },
  {
    cargo_name: '图书文具',
    cargo_type: '日用品',
    quantity: 1000,
    weight: 1.8,
    volume: 4,
    start_city: '北京',
    end_city: '石家庄',
    distance: 290,
    expected_price: 850,
    status: 'published'
  },
  {
    cargo_name: '汽车配件',
    cargo_type: '汽配',
    quantity: 200,
    weight: 4.2,
    volume: 7,
    start_city: '上海',
    end_city: '南京',
    distance: 300,
    expected_price: 920,
    status: 'trading'
  },
  {
    cargo_name: '医药耗材',
    cargo_type: '医疗',
    quantity: 50,
    weight: 0.8,
    volume: 2,
    start_city: '郑州',
    end_city: '西安',
    distance: 480,
    expected_price: 1500,
    status: 'signed'
  }
]

const shipperIds = [2, 2, 2, 2, 2, 2, 2, 2]
const vehicleTypes = ['高栏', '平板', '厢式', '冷藏', '高栏', '厢式', '平板', '冷藏']
const vehicleLengths = ['9.6', '13', '6.8', '4.2', '9.6', '6.8', '13', '4.2']

function insertDiverseData() {
  const tx = db.transaction(() => {
    cargoData.forEach((cargo, idx) => {
      const basePrice = cargo.expected_price * 0.85
      const distanceFactor = cargo.distance > 1000 ? 1.15 : cargo.distance > 500 ? 1.05 : 1.0
      const vehicleFactor = ['13', '9.6'].includes(vehicleLengths[idx]) ? 1.2 : 1.0
      const timeFactor = 1.0
      const suggestedPrice = basePrice * distanceFactor * vehicleFactor * timeFactor
      
      const result = db.prepare(`
        INSERT INTO cargo_sources (
          shipper_id, cargo_name, cargo_type, quantity, weight, volume,
          start_city, end_city, start_address, end_address, start_lng, start_lat, end_lng, end_lat,
          distance, expected_price, vehicle_type_required, vehicle_length_required,
          loading_time, delivery_time, remarks,
          base_price, distance_factor, vehicle_factor, time_factor, suggested_price, min_price, max_price,
          status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        shipperIds[idx], cargo.cargo_name, cargo.cargo_type, cargo.quantity, cargo.weight, cargo.volume,
        cargo.start_city, cargo.end_city, `${cargo.start_city}市发货点`, `${cargo.end_city}市收货点`,
        116.4 + Math.random() * 0.2, 39.9 + Math.random() * 0.2, 121.5 + Math.random() * 0.2, 31.2 + Math.random() * 0.2,
        cargo.distance, cargo.expected_price, vehicleTypes[idx], vehicleLengths[idx],
        new Date().toISOString(), new Date(Date.now() + 86400000 * 2).toISOString(), '请提前联系',
        basePrice, distanceFactor, vehicleFactor, timeFactor, suggestedPrice, suggestedPrice * 0.9, suggestedPrice * 1.1,
        cargo.status
      )
      
      const cargoId = result.lastInsertRowid
      
      if (cargo.status !== 'published') {
        const bidPrices = [cargo.expected_price * 0.95, cargo.expected_price * 1.0, cargo.expected_price * 1.05]
        bidPrices.forEach((price, bidIdx) => {
          const driverId = 3 + (bidIdx % 2)
          db.prepare(`
            INSERT INTO bids (cargo_id, driver_id, price, message, status, created_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `).run(cargoId, driverId, price, `可以承运，价格${price.toFixed(0)}元`, bidIdx === 0 && cargo.status === 'signed' ? 'accepted' : 'pending')
        })
      }
      
      if (cargo.status === 'signed' || cargo.status === 'completed') {
        const waybillNo = `WB${Date.now()}${idx}`
        const agreedPrice = cargo.expected_price * 0.98
        const commission = agreedPrice * 0.05
        const insurance = agreedPrice * 0.003
        const driverReceivable = agreedPrice - commission - insurance
        
        const waybillResult = db.prepare(`
          INSERT INTO waybills (
            cargo_id, shipper_id, driver_id, waybill_no, agreed_price, platform_commission,
            insurance_fee, driver_receivable, status, current_lng, current_lat, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(cargoId, shipperIds[idx], 3, waybillNo, agreedPrice, commission, insurance, driverReceivable, cargo.status === 'completed' ? 'completed' : 'created', 116.4, 39.9)
        
        const waybillId = waybillResult.lastInsertRowid
        
        db.prepare(`
          INSERT INTO insurance_policies (waybill_id, policy_no, insurance_company, insured_amount, premium, cargo_value, status)
          VALUES (?, ?, '平安保险', ?, ?, ?, 'valid')
        `).run(waybillId, `POL${Date.now()}${idx}`, agreedPrice, insurance, cargo.weight * 1000)
        
        if (cargo.status === 'completed') {
          db.prepare(`
            INSERT INTO escrow_funds (waybill_id, amount, status, frozen_at, released_at)
            VALUES (?, ?, 'released', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `).run(waybillId, agreedPrice)
          
          db.prepare(`
            INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, status, transaction_no, remark)
            VALUES (?, 'settlement', ?, 10000, 10000, 'completed', ?, '运单结算')
          `).run(3, driverReceivable, `TX${Date.now()}${idx}`)
        } else {
          db.prepare(`
            INSERT INTO escrow_funds (waybill_id, amount, status, frozen_at)
            VALUES (?, 'frozen', CURRENT_TIMESTAMP)
          `).run(waybillId, agreedPrice)
        }
        
        if (idx % 2 === 0) {
          const alertTypes = ['偏离路线', '长时间静止', '超时未签收']
          const alertLevels = ['warning', 'danger', 'warning']
          const messages = [
            `车辆${alertTypes[0]}，请关注`,
            `车辆静止超过2小时，建议联系司机`,
            `预计已超时，请注意签收`
          ]
          
          db.prepare(`
            INSERT INTO alerts (waybill_id, alert_type, alert_level, alert_message, is_handled, created_at)
            VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
          `).run(waybillId, alertTypes[idx % 3], alertLevels[idx % 3], messages[idx % 3])
        }
      }
    })
    
    console.log('多样化测试数据插入成功!')
    console.log('- 新增货源: 8条')
    console.log('- 新增报价: 约15条')
    console.log('- 新增运单: 约4条')
    console.log('- 新增保单: 约4条')
    console.log('- 新增担保资金: 约4条')
    console.log('- 新增告警: 约2条')
  })
  
  try {
    tx()
  } catch (err) {
    console.error('插入失败:', err.message)
  }
}

insertDiverseData()
db.close()
