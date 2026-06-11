class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message)
    this.statusCode = statusCode
    this.name = 'AppError'
  }
}

const successResponse = (res, data = null, message = 'success') => {
  res.json({
    code: 200,
    message,
    data,
  })
}

const paginateResponse = (res, list = [], total = 0, page = 1, pageSize = 20) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  })
}

const generateOrderNo = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORD${year}${month}${day}${hours}${minutes}${seconds}${random}`
}

const generateReservationNo = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `RES${year}${month}${day}${random}`
}

const generateAlarmNo = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ALM${year}${month}${day}${random}`
}

const generateCertificateNo = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return `GRE${year}${month}${random}`
}

const calculateCarbonReduction = (kwh, greenRatio = 1) => {
  const emissionFactor = 0.6101
  return Number((kwh * greenRatio * emissionFactor).toFixed(4))
}

module.exports = {
  AppError,
  successResponse,
  paginateResponse,
  generateOrderNo,
  generateReservationNo,
  generateAlarmNo,
  generateCertificateNo,
  calculateCarbonReduction,
}
