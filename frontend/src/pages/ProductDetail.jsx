import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, Star, Package } from 'lucide-react'
import { productApi } from '../api'
import { useCartStore } from '../store'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const addItem = useCartStore((state) => state.addItem)
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [specs, setSpecs] = useState([])
  const [selectedSpec, setSelectedSpec] = useState(null)

  useEffect(() => {
    loadProduct()
  }, [id])

  const loadProduct = async () => {
    try {
      const res = await productApi.getProductDetail(id)
      setProduct(res.data.data)
      if (res.data.data.specs) {
        setSpecs(res.data.data.specs.split(','))
        setSelectedSpec(res.data.data.specs.split(',')[0])
      }
    } catch (error) {
      console.error('加载失败', error)
    }
  }

  const handleAddToCart = () => {
    if (!product) return
    for (let i = 0; i < quantity; i++) {
      addItem(product)
    }
    alert(`已添加${quantity}件商品到购物车`)
  }

  if (!product) {
    return <div className="p-4 text-center">加载中...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="relative">
        <img
          src={product.images}
          alt={product.name}
          className="w-full h-72 object-cover"
        />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-black bg-opacity-30 rounded-full p-2"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="bg-white p-4 -mt-4 rounded-t-2xl relative z-10">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-red-500 font-bold text-2xl">¥{product.price}</span>
            {product.original_price && (
              <span className="text-sm text-gray-400 line-through ml-2">
                ¥{product.original_price}
              </span>
            )}
          </div>
          <span className="text-sm text-gray-400">已售{product.sales || 0}件</span>
        </div>
        <h1 className="text-lg font-bold mt-2">{product.name}</h1>
        <div className="flex items-center mt-2">
          <div className="flex items-center bg-orange-50 px-2 py-1 rounded">
            <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span className="text-sm font-medium ml-1">4.9</span>
          </div>
          <span className="text-sm text-gray-500 ml-2">{product.category}</span>
        </div>
      </div>

      {specs.length > 0 && (
        <div className="bg-white mt-2 p-4">
          <h2 className="font-bold mb-3">规格选择</h2>
          <div className="flex flex-wrap gap-2">
            {specs.map((spec, index) => (
              <button
                key={index}
                onClick={() => setSelectedSpec(spec)}
                className={`px-4 py-2 rounded-lg text-sm ${
                  selectedSpec === spec
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {spec.trim()}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white mt-2 p-4">
        <h2 className="font-bold mb-3 flex items-center">
          <Package className="w-5 h-5 mr-2" />
          商品详情
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-4 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-lg">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 flex items-center justify-center"
            >
              -
            </button>
            <span className="w-10 text-center font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 flex items-center justify-center"
            >
              +
            </button>
          </div>
          <button
            onClick={() => navigate('/cart')}
            className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg font-medium flex items-center justify-center"
          >
            <ShoppingCart className="w-5 h-5 mr-1" />
            购物车
          </button>
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-red-500 text-white py-2.5 rounded-lg font-medium"
          >
            加入购物车
          </button>
        </div>
      </div>
    </div>
  )
}
