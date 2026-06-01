import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, Star } from 'lucide-react'
import { homeApi } from '../api'

export default function HotelList() {
  const navigate = useNavigate()
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    loadHotels()
  }, [])

  const loadHotels = async () => {
    setLoading(true)
    try {
      const res = await homeApi.getHotels({ limit: 20 })
      setHotels(res.data.data.list)
    } catch (error) {
      console.error('加载失败', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索酒店..."
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
          <button className="p-2">
            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : hotels.length === 0 ? (
          <div className="text-center py-8 text-gray-400">暂无酒店</div>
        ) : (
          hotels.map((hotel) => (
            <div
              key={hotel.id}
              onClick={() => navigate(`/hotels/${hotel.id}`)}
              className="bg-white rounded-xl overflow-hidden shadow-sm"
            >
              <img
                src={hotel.images}
                alt={hotel.name}
                className="w-full h-40 object-cover"
              />
              <div className="p-3">
                <h3 className="font-medium">{hotel.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{hotel.address}</p>
                <div className="flex items-center mt-2">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm ml-1 font-medium">{hotel.rating}</span>
                  </div>
                  <span className="text-xs text-gray-400 ml-2">{hotel.star}星级</span>
                </div>
                <div className="flex items-end justify-between mt-2">
                  <div>
                    <span className="text-red-500 font-bold text-lg">¥{hotel.price}</span>
                    <span className="text-xs text-gray-400 ml-1">起/晚</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/hotels/${hotel.id}`)
                    }}
                    className="bg-red-500 text-white px-4 py-1.5 rounded-lg text-sm"
                  >
                    查看详情
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
