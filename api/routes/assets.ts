import { Router, type Request, type Response } from 'express'
import { stores, seats, rooms, devices } from '../data/mockData.js'

const router = Router()

router.get('/stores', async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 10
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedStores = stores.slice(start, end)

  res.json({
    success: true,
    data: {
      list: paginatedStores,
      total: stores.length,
      page,
      pageSize,
    },
    message: '获取门店列表成功',
  })
})

router.get('/seats', async (req: Request, res: Response): Promise<void> => {
  const storeId = req.query.storeId as string
  let filteredSeats = seats

  if (storeId) {
    filteredSeats = seats.filter((seat) => seat.storeId === storeId)
  }

  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 20
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedSeats = filteredSeats.slice(start, end)

  res.json({
    success: true,
    data: {
      list: paginatedSeats,
      total: filteredSeats.length,
      page,
      pageSize,
    },
    message: '获取座位列表成功',
  })
})

router.get('/rooms', async (req: Request, res: Response): Promise<void> => {
  const storeId = req.query.storeId as string
  let filteredRooms = rooms

  if (storeId) {
    filteredRooms = rooms.filter((room) => room.storeId === storeId)
  }

  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 10
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedRooms = filteredRooms.slice(start, end)

  res.json({
    success: true,
    data: {
      list: paginatedRooms,
      total: filteredRooms.length,
      page,
      pageSize,
    },
    message: '获取包间列表成功',
  })
})

router.get('/devices', async (req: Request, res: Response): Promise<void> => {
  const storeId = req.query.storeId as string
  let filteredDevices = devices

  if (storeId) {
    filteredDevices = devices.filter((device) => device.storeId === storeId)
  }

  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 20
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedDevices = filteredDevices.slice(start, end)

  res.json({
    success: true,
    data: {
      list: paginatedDevices,
      total: filteredDevices.length,
      page,
      pageSize,
    },
    message: '获取设备列表成功',
  })
})

export default router
