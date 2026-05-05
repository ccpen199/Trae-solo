import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { body, validationResult } from 'express-validator'

import authRoutes from './routes/auth.routes'
import userRoutes from './routes/user.routes'
import roleRoutes from './routes/role.routes'
import menuRoutes from './routes/menu.routes'
import departmentRoutes from './routes/department.routes'
import cityRoutes from './routes/city.routes'
import nodeRoutes from './routes/node.routes'
import vehicleTypeRoutes from './routes/vehicle-type.routes'
import vehicleRoutes from './routes/vehicle.routes'
import driverRoutes from './routes/driver.routes'
import cargoTypeRoutes from './routes/cargo-type.routes'
import businessTypeRoutes from './routes/business-type.routes'
import gpsDepartmentRoutes from './routes/gps-department.routes'
import gpsVehicleRoutes from './routes/gps-vehicle.routes'
import carrierRoutes from './routes/carrier.routes'
import transportTypeRoutes from './routes/transport-type.routes'
import transportRouteRoutes from './routes/transport-route.routes'
import freightRateRoutes from './routes/freight-rate.routes'
import transportPlanRoutes from './routes/transport-plan.routes'
import transportOrderRoutes from './routes/transport-order.routes'
import inTransitMonitoringRoutes from './routes/in-transit-monitoring.routes'
import exceptionRecordRoutes from './routes/exception-record.routes'
import arrivalForecastRoutes from './routes/arrival-forecast.routes'
import orderSignRoutes from './routes/order-sign.routes'
import claimRoutes from './routes/claim.routes'
import freightCalculationRoutes from './routes/freight-calculation.routes'
import reconciliationRoutes from './routes/reconciliation.routes'

import { error } from './utils/response'

const app: Express = express()
const PORT = process.env.PORT || 20782
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:30782'

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
)

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// 认证路由
app.use('/api/auth', authRoutes)

// 系统管理路由
app.use('/api/users', userRoutes)
app.use('/api/roles', roleRoutes)
app.use('/api/menus', menuRoutes)
app.use('/api/departments', departmentRoutes)

// 基础设置路由
app.use('/api/cities', cityRoutes)
app.use('/api/nodes', nodeRoutes)
app.use('/api/vehicle-types', vehicleTypeRoutes)
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/drivers', driverRoutes)
app.use('/api/cargo-types', cargoTypeRoutes)
app.use('/api/business-types', businessTypeRoutes)
app.use('/api/gps-departments', gpsDepartmentRoutes)
app.use('/api/gps-vehicles', gpsVehicleRoutes)

// 运输网络路由
app.use('/api/carriers', carrierRoutes)
app.use('/api/transport-types', transportTypeRoutes)
app.use('/api/transport-routes', transportRouteRoutes)
app.use('/api/freight-rates', freightRateRoutes)

// 发运管理路由
app.use('/api/transport-plans', transportPlanRoutes)
app.use('/api/transport-orders', transportOrderRoutes)
app.use('/api/in-transit-monitorings', inTransitMonitoringRoutes)
app.use('/api/exception-records', exceptionRecordRoutes)

// 到货管理路由
app.use('/api/arrival-forecasts', arrivalForecastRoutes)
app.use('/api/order-signs', orderSignRoutes)
app.use('/api/claims', claimRoutes)

// 对账管理路由
app.use('/api/freight-calculations', freightCalculationRoutes)
app.use('/api/reconciliations', reconciliationRoutes)

const validate = (validations: ReturnType<typeof body>[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map((validation) => validation.run(req)))
    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }
    return res.status(400).json({
      success: false,
      code: 400,
      message: '参数验证失败',
      errors: errors.array(),
    })
  }
}

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err)
  error(res, err.message || '服务器内部错误', 500)
})

app.use('*', (_req: Request, res: Response) => {
  error(res, '接口不存在', 404)
})

app.listen(PORT, () => {
  console.log(`\n========================================`)
  console.log(`  仓储运输管理系统 (TMS) 后端服务`)
  console.log(`========================================`)
  console.log(`  服务地址: http://localhost:${PORT}`)
  console.log(`  API 前缀:  http://localhost:${PORT}/api`)
  console.log(`  启动时间: ${new Date().toLocaleString()}`)
  console.log(`========================================\n`)
})

export { validate }
