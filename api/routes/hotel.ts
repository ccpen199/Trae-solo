import { Router, type Request, type Response } from 'express'
import { hotelBookings, type HotelBooking } from '../data/mockData.js'

const router = Router()

let bookings = [...hotelBookings]

router.get('/bookings', async (req: Request, res: Response): Promise<void> => {
  const status = req.query.status as string
  const storeId = req.query.storeId as string
  let filteredBookings = bookings

  if (status) {
    filteredBookings = filteredBookings.filter((booking) => booking.status === status)
  }
  if (storeId) {
    filteredBookings = filteredBookings.filter((booking) => booking.storeId === storeId)
  }

  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 10
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedBookings = filteredBookings.slice(start, end)

  res.json({
    success: true,
    data: {
      list: paginatedBookings,
      total: filteredBookings.length,
      page,
      pageSize,
    },
    message: '获取酒店预订列表成功',
  })
})

router.post('/bookings', async (req: Request, res: Response): Promise<void> => {
  const {
    userId,
    userName,
    storeId,
    storeName,
    roomId,
    roomName,
    checkIn,
    checkOut,
    nights,
    totalAmount,
    guestName,
    guestPhone,
  } = req.body

  const newBooking: HotelBooking = {
    id: `order-hotel-${String(bookings.length + 1).padStart(3, '0')}`,
    userId,
    userName,
    storeId,
    storeName,
    roomId,
    roomName,
    checkIn,
    checkOut,
    nights,
    totalAmount,
    status: 'pending',
    guestName,
    guestPhone,
    deviceLocked: true,
    createdAt: new Date().toISOString(),
  }

  bookings.unshift(newBooking)

  res.json({
    success: true,
    data: newBooking,
    message: '创建酒店预订成功',
  })
})

router.put('/bookings/:id/checkin', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params

  const bookingIndex = bookings.findIndex((booking) => booking.id === id)
  if (bookingIndex === -1) {
    res.status(404).json({
      success: false,
      data: null,
      message: '预订不存在',
    })
    return
  }

  bookings[bookingIndex] = {
    ...bookings[bookingIndex],
    status: 'checked_in',
  }

  res.json({
    success: true,
    data: bookings[bookingIndex],
    message: '办理入住成功',
  })
})

router.put('/bookings/:id/checkout', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params

  const bookingIndex = bookings.findIndex((booking) => booking.id === id)
  if (bookingIndex === -1) {
    res.status(404).json({
      success: false,
      data: null,
      message: '预订不存在',
    })
    return
  }

  bookings[bookingIndex] = {
    ...bookings[bookingIndex],
    status: 'checked_out',
  }

  res.json({
    success: true,
    data: bookings[bookingIndex],
    message: '办理退房成功',
  })
})

export default router
