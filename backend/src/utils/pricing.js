import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const BASE_PRICE_PER_KM = 5
const VEHICLE_FACTORS = {
  '小型货车': 0.8,
  '厢式货车': 1.0,
  '高栏货车': 1.2,
  '平板货车': 1.1,
  '冷藏车': 1.5,
  '危险品运输车': 1.8
}

export function calculatePricing({ distance, vehicleType, loadingTime, deliveryTime, weight = 0, volume = 0 }) {
  const basePrice = distance * BASE_PRICE_PER_KM
  
  const distanceFactor = distance < 100 ? 1.2 : distance < 500 ? 1.0 : distance < 1000 ? 0.9 : 0.85
  
  const vehicleFactor = VEHICLE_FACTORS[vehicleType] || 1.0
  
  const loadDate = new Date(loadingTime)
  const deliveryDate = new Date(deliveryTime)
  const hours = (deliveryDate - loadDate) / (1000 * 60 * 60)
  const expectedHours = distance / 60
  let timeFactor = 1.0
  if (hours < expectedHours * 0.7) {
    timeFactor = 1.5
  } else if (hours < expectedHours * 0.9) {
    timeFactor = 1.2
  } else if (hours > expectedHours * 2) {
    timeFactor = 0.85
  }
  
  const weightFactor = weight > 20 ? 1.1 : weight > 10 ? 1.05 : 1.0
  const volumeFactor = volume > 50 ? 1.1 : volume > 30 ? 1.05 : 1.0
  
  const suggestedPrice = basePrice * distanceFactor * vehicleFactor * timeFactor * weightFactor * volumeFactor
  
  return {
    basePrice: Math.round(basePrice * 100) / 100,
    distanceFactor,
    vehicleFactor,
    timeFactor,
    suggestedPrice: Math.round(suggestedPrice * 100) / 100,
    minPrice: Math.round(suggestedPrice * 0.9 * 100) / 100,
    maxPrice: Math.round(suggestedPrice * 1.3 * 100) / 100
  }
}

export function calculateSplit(agreedPrice) {
  const commissionRate = parseFloat(process.env.PLATFORM_COMMISSION_RATE) || 0.05
  const insuranceRate = parseFloat(process.env.INSURANCE_RATE) || 0.003
  
  const platformCommission = Math.round(agreedPrice * commissionRate * 100) / 100
  const insuranceFee = Math.round(agreedPrice * insuranceRate * 100) / 100
  const driverReceivable = Math.round((agreedPrice - platformCommission - insuranceFee) * 100) / 100
  
  return {
    agreedPrice,
    platformCommission,
    insuranceFee,
    driverReceivable
  }
}

export function generateWaybillNo() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `WB${year}${month}${day}${random}`
}

export function generateTransactionNo(prefix = 'TX') {
  const date = new Date()
  const timestamp = date.getTime()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}${timestamp}${random}`
}

export function generatePolicyNo() {
  const date = new Date()
  const year = date.getFullYear()
  const random = Math.random().toString(36).substring(2, 10).toUpperCase()
  return `INS${year}${random}`
}
