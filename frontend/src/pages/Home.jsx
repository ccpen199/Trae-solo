import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, CreditCard, MessageSquare } from 'lucide-react'
import { homeApi } from '../api'

const quickEntries = [
  { icon: MapPin, label: '景点门票', color: 'bg-blue-500', path: '/products?category=景点门票' },
  { icon: CreditCard, label: '汇率换算', color: 'bg-green-500', action: 'showRates' },
  { icon: MessageSquare, label: '问答社区', color: 'bg-orange-500', path: '/community' },
]

export default function Home() {
  const navigate = useNavigate()
  const [banners, setBanners] = useState([])
  const [articles, setArticles] = useState([])
  const [hotels, setHotels] = useState([])
  const [showRates, setShowRates] = useState(false)
  const [exchangeRates, setExchangeRates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const results = await Promise.allSettled([
        homeApi.getBanners(),
        homeApi.getArticles({ limit: 5 }),
        homeApi.getHotels({ limit: 3 }),
        homeApi.getExchangeRates(),
      ])
      
      if (results[0].status === 'fulfilled') {
        setBanners(results[0].value.data.data || [])
      }
      if (results[1].status === 'fulfilled') {
        setArticles(results[1].value.data.data.list || [])
      }
      if (results[2].status === 'fulfilled') {
        setHotels(results[2].value.data.data.list || [])
      }
      if (results[3].status === 'fulfilled') {
        setExchangeRates(results[3].value.data.data || [])
      }
    } catch (error) {
      console.error('加载数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickEntry = (entry) => {
    if (entry.action === 'showRates') {
      setShowRates(true)
    } else if (entry.path) {
      navigate(entry.path)
    }
  }

  return (
    <div className="pb-4 min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-xl font-bold">澳门旅行</h1>
          <Search className="w-6 h-6 text-white" />
        </div>
        <div className="bg-white rounded-full p-3 flex items-center">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="搜索酒店、景点、特产..."
            className="flex-1 outline-none text-sm"
            onFocus={() => navigate('/articles')}
          />
        </div>
      </div>

      {loading ? (
        <div className="px-4 -mt-4">
          <div className="bg-white rounded-xl overflow-hidden shadow-lg animate-pulse">
            <div className="w-full h-40 bg-gray-200"></div>
          </div>
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg p-3 animate-pulse">
                <div className="flex">
                  <div className="w-28 h-28 bg-gray-200 rounded"></div>
                  <div className="flex-1 ml-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="px-4 -mt-4">
            <div className="bg-white rounded-xl overflow-hidden shadow-lg">
              {banners.length > 0 && (
                <img
                  src={banners[0].image}
                  alt={banners[0].title}
                  className="w-full h-40 object-cover"
                />
              )}
            </div>
          </div>

          <div className="px-4 mt-6">
            <div className="flex justify-around">
              {quickEntries.map((entry, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickEntry(entry)}
                  className="flex flex-col items-center"
                >
                  <div className={`w-12 h-12 ${entry.color} rounded-full flex items-center justify-center mb-2`}>
                    <entry.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-gray-600">{entry.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">推荐酒店</h2>
              <button
                onClick={() => navigate('/hotels')}
                className="text-sm text-red-500"
              >
                查看更多
              </button>
            </div>
            <div className="space-y-3">
              {hotels.map((hotel) => (
                <div
                  key={hotel.id}
                  onClick={() => navigate(`/hotels/${hotel.id}`)}
                  className="flex bg-white rounded-lg overflow-hidden shadow-sm"
                >
                  <img
                    src={hotel.images}
                    alt={hotel.name}
                    className="w-28 h-28 object-cover"
                  />
                  <div className="flex-1 p-3">
                    <h3 className="font-medium text-sm line-clamp-1">{hotel.name}</h3>
                    <div className="flex items-center mt-1">
                      <span className="text-yellow-500 text-xs">★ {hotel.rating}</span>
                      <span className="text-xs text-gray-400 ml-2">{hotel.star}星</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-red-500 font-bold">¥{hotel.price}</span>
                      <span className="text-xs text-gray-400">起/晚</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-4 mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">最新资讯</h2>
              <button
                onClick={() => navigate('/articles')}
                className="text-sm text-red-500"
              >
                查看更多
              </button>
            </div>
            <div className="space-y-3">
              {articles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => navigate(`/articles/${article.id}`)}
                  className="flex bg-white rounded-lg overflow-hidden shadow-sm"
                >
                  <div className="flex-1 p-3">
                    <h3 className="font-medium text-sm line-clamp-2">{article.title}</h3>
                    <div className="flex items-center mt-2 text-xs text-gray-400">
                      <span>{article.category}</span>
                      <span className="mx-2">·</span>
                      <span>{article.view_count}阅读</span>
                    </div>
                  </div>
                  {article.cover && (
                    <img
                      src={article.cover}
                      alt={article.title}
                      className="w-20 h-20 object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {showRates && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={() => setShowRates(false)}
        >
          <div
            className="bg-white rounded-xl p-4 w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 text-center">汇率换算</h3>
            <div className="space-y-2">
              {exchangeRates.map((rate) => (
                <div key={rate.currency} className="flex justify-between py-2 border-b">
                  <span className="font-medium">{rate.currency}</span>
                  <span className="text-red-500">1 MOP = {rate.rate} {rate.currency}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowRates(false)}
              className="w-full mt-4 bg-red-500 text-white py-2 rounded-lg"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
