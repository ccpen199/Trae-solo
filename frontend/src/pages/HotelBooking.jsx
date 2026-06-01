import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Calendar, User, Phone } from 'lucide-react'
import { homeApi, orderApi } from '../api'
import { useAuthStore } from '../store'

export default function HotelBooking() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const [hotel, setHotel] = useState(null)
  const [room, setRoom] = useState(null)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guestName, setGuestName] = useState(user?.nickname || '')
  const [guestPhone, setGuestPhone] = useState(user?.phone || '')
  const [rooms, setRooms] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    loadHotel()
  }, [id, token])

  useEffect(() => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    setCheckIn(today.toISOString().split('T')[0])
    setCheckOut(tomorrow.toISOString().split('T')[0])
  }, [])

  const loadHotel = async () => {
    try {
      const res = await homeApi.getHotelDetail(id)
      setHotel(res.data.data)
      const roomId = searchParams.get('roomId')
      const foundRoom = res.data.data.rooms?.find((r) => r.id === Number(roomId))
      setRoom(foundRoom || res.data.data.rooms?.[0])
    } catch (error) {
      console.error('加载失败', error)
    }
  }

  const getNights = () => {
    if (!checkIn || !checkOut) return 0
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  }

  const getTotal = () => {
    const nights = getNights()
    return (room?.price || 0) * nights * rooms
  }

  const handleSubmit = async () => {
    if (!checkIn || !checkOut) {
      alert('请选择入住日期')
      return
    }
    if (!guestName || !guestPhone) {
      alert('请填写入住人信息')
      return
    }

    setLoading(true)
    try {
      const res = await orderApi.createHotelOrder({
        hotel_id: Number(id),
        room_id: room.id,
        check_in: checkIn,
        check_out: checkOut,
        guest_name: guestName,
        guest_phone: guestPhone,
        rooms,
      })
      alert('预订成功！')
      navigate('/orders?tab=hotel')
    } catch (error) {
      alert(error.response?.data?.error || '预订失败')
    } finally {
      setLoading(false)
    }
  }

  if (!hotel || !room) {
    return <div className="p-4 text-center">加载中...</div>
  }

  const nights = getNights()
  const total = getTotal()

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white p-4 flex items-center sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-medium">填写预订信息</h1>
      </div>

      <div className="bg-white m-4 rounded-xl p-4">
        <div className="flex">
          <img
            src={hotel.images}
            alt={hotel.name}
            className="w-20 h-20 object-cover rounded-lg"
          />
          <div className="flex-1 ml-3">
            <h3 className="font-medium">{hotel.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{room.name}</p>
            <p className="text-sm text-gray-500 mt-1">
              {room.area}㎡ · {room.bed_type} · {room.breakfast ? '含早' : '无早'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white m-4 rounded-xl p-4">
        <h3 className="font-medium mb-4">选择日期</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500">入住日期</label>
            <div className="flex items-center mt-1 border rounded-lg p-2">
              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="flex-1 outline-none text-sm"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500">离店日期</label>
            <div className="flex items-center mt-1 border rounded-lg p-2">
              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn}
                className="flex-1 outline-none text-sm"
              />
            </div>
          </div>
        </div>
        {nights > 0 && (
          <p className="text-sm text-gray-500 mt-3 text-center">共 {nights} 晚</p>
        )}
      </div>

      <div className="bg-white m-4 rounded-xl p-4">
        <h3 className="font-medium mb-4">入住人信息</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 flex items-center">
              <User className="w-4 h-4 mr-1" />
              姓名
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="请输入入住人姓名"
              className="w-full mt-1 border rounded-lg p-2 outline-none text-sm focus:border-red-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 flex items-center">
              <Phone className="w-4 h-4 mr-1" />
              手机号
            </label>
            <input
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="请输入手机号"
              className="w-full mt-1 border rounded-lg p-2 outline-none text-sm focus:border-red-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">房间数量</label>
            <div className="flex items-center mt-1">
              <button
                onClick={() => setRooms(Math.max(1, rooms - 1))}
                className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"
              >
                -
              </button>
              <span className="w-12 text-center font-medium">{rooms}</span>
              <button
                onClick={() => setRooms(rooms + 1)}
                className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white m-4 rounded-xl p-4">
        <h3 className="font-medium mb-3">费用明细</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">房费 x {nights}晚 x {rooms}间</span>
            <span>¥{total}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="font-medium">合计</span>
            <span className="text-red-500 font-bold">¥{total}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-4 max-w-md mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500">合计</span>
            <span className="text-red-500 font-bold text-xl ml-2">¥{total}</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-red-500 text-white px-8 py-2.5 rounded-lg font-medium disabled:bg-gray-300"
          >
            {loading ? '提交中...' : '提交预订'}
          </button>
        </div>
      </div>
    </div>
  )
}
