import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, MapPin, Wifi, Coffee, Car, Dumbbell } from 'lucide-react'
import { homeApi } from '../api'

const facilityIcons = {
  'wifi': Wifi,
  '餐厅': Coffee,
  '停车场': Car,
  '健身房': Dumbbell,
}

export default function HotelDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [hotel, setHotel] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState(null)

  useEffect(() => {
    loadHotel()
  }, [id])

  const loadHotel = async () => {
    try {
      const res = await homeApi.getHotelDetail(id)
      setHotel(res.data.data)
    } catch (error) {
      console.error('加载失败', error)
    }
  }

  if (!hotel) {
    return <div className="p-4 text-center">加载中...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="relative">
        <img
          src={hotel.images}
          alt={hotel.name}
          className="w-full h-56 object-cover"
        />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-black bg-opacity-30 rounded-full p-2"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="bg-white p-4 -mt-4 rounded-t-2xl relative z-10">
        <h1 className="text-xl font-bold">{hotel.name}</h1>
        <div className="flex items-center mt-2">
          <div className="flex items-center bg-orange-50 px-2 py-1 rounded">
            <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span className="text-sm font-medium ml-1">{hotel.rating}</span>
          </div>
          <span className="text-sm text-gray-500 ml-2">{hotel.star}星级酒店</span>
        </div>
        <div className="flex items-start mt-2 text-sm text-gray-500">
          <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
          <span>{hotel.address}</span>
        </div>
      </div>

      <div className="bg-white mt-2 p-4">
        <h2 className="font-bold mb-3">酒店设施</h2>
        <div className="grid grid-cols-4 gap-4">
          {hotel.facilities?.split(',').map((facility, index) => {
            const Icon = facilityIcons[facility.trim()] || Star
            return (
              <div key={index} className="flex flex-col items-center">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-xs text-gray-600 mt-1">{facility.trim()}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white mt-2 p-4">
        <h2 className="font-bold mb-3">酒店介绍</h2>
        <p className="text-sm text-gray-600 leading-relaxed">{hotel.description}</p>
      </div>

      <div className="bg-white mt-2 p-4">
        <h2 className="font-bold mb-3">选择房型</h2>
        <div className="space-y-3">
          {hotel.rooms?.map((room) => (
            <div
              key={room.id}
              className={`p-3 rounded-lg border-2 ${
                selectedRoom?.id === room.id ? 'border-red-500 bg-red-50' : 'border-gray-200'
              }`}
              onClick={() => setSelectedRoom(room)}
            >
              <div className="flex">
                <img
                  src={hotel.images}
                  alt={room.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1 ml-3">
                  <h3 className="font-medium text-sm">{room.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {room.area}㎡ · {room.bed_type} · 可住{room.max_guests}人
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {room.breakfast ? '含早餐' : '不含早餐'}
                  </p>
                  <div className="flex items-baseline mt-1">
                    <span className="text-red-500 font-bold">¥{room.price}</span>
                    {room.original_price && (
                      <span className="text-xs text-gray-400 line-through ml-2">
                        ¥{room.original_price}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 ml-1">/晚</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-4 max-w-md mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-red-500 font-bold text-xl">
              ¥{selectedRoom?.price || hotel.price}
            </span>
            <span className="text-xs text-gray-400 ml-1">/晚</span>
          </div>
          <button
            onClick={() => {
              if (selectedRoom) {
                navigate(`/hotels/${id}/booking?roomId=${selectedRoom.id}`)
              } else {
                alert('请先选择房型')
              }
            }}
            className="bg-red-500 text-white px-8 py-2.5 rounded-lg font-medium"
          >
            立即预订
          </button>
        </div>
      </div>
    </div>
  )
}
