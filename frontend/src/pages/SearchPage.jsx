import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { productApi, cartApi } from '../api'
import { useUserStore, useCartStore } from '../store'

function SearchPage() {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const { user } = useUserStore()
  const { setCart } = useCartStore()
  
  const [keyword, setKeyword] = useState('')
  const [searchText, setSearchText] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [toast, setToast] = useState(null)
  
  const [hotKeywords] = useState([
    '新鲜草莓', '有机蔬菜', '进口水果', '精品肉类', '海鲜水产', '牛奶鸡蛋'
  ])
  
  const [historyKeywords, setHistoryKeywords] = useState(() => {
    const stored = localStorage.getItem('searchHistory')
    return stored ? JSON.parse(stored) : []
  })
  
  const showToast = useCallback((message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }, [])
  
  const saveToHistory = useCallback((text) => {
    if (!text.trim()) return
    const newHistory = [text, ...historyKeywords.filter(k => k !== text)].slice(0, 10)
    setHistoryKeywords(newHistory)
    localStorage.setItem('searchHistory', JSON.stringify(newHistory))
  }, [historyKeywords])
  
  const clearHistory = () => {
    setHistoryKeywords([])
    localStorage.removeItem('searchHistory')
  }
  
  const doSearch = useCallback(async (text) => {
    if (!text.trim()) return
    
    setKeyword(text)
    setSearchText(text)
    saveToHistory(text)
    setLoading(true)
    setHasSearched(true)
    
    try {
      const result = await productApi.getList({ keyword: text })
      if (result.success) {
        setProducts(result.data.list || [])
      } else {
        showToast(result.message || '搜索失败')
      }
    } catch (error) {
      showToast(error.message || '搜索失败')
    } finally {
      setLoading(false)
    }
  }, [saveToHistory, showToast])
  
  const addToCart = async (productId, quantity = 1) => {
    try {
      const result = await cartApi.add({ product_id: productId, quantity })
      if (result.success) {
        showToast('已添加到购物车')
        const cartRes = await cartApi.getList()
        if (cartRes.success) {
          setCart(cartRes.data.list, cartRes.data.total_count, cartRes.data.total_amount)
        }
      } else {
        showToast(result.message || '添加失败')
      }
    } catch (error) {
      showToast(error.message || '添加失败')
    }
  }
  
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])
  
  return (
    <div className="page-container" style={{ paddingBottom: 0 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--primary-color)', padding: '12px 16px' }}>
        <div className="flex-between" style={{ gap: '12px' }}>
          <button onClick={() => navigate(-1)} style={{ color: 'white', fontSize: '20px', flexShrink: 0 }}>
            ←
          </button>
          <div
            className="header-search"
            style={{ flex: 1, backgroundColor: 'white', padding: '8px 12px' }}
            onClick={() => inputRef.current?.focus()}
          >
            <span>🔍</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="搜索商品"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch(searchText)}
              style={{ color: 'var(--text-primary)', flex: 1 }}
            />
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                style={{ color: 'var(--text-muted)', fontSize: '16px' }}
              >
                ×
              </button>
            )}
          </div>
          <button
            onClick={() => doSearch(searchText)}
            style={{ color: 'white', fontWeight: 500, flexShrink: 0 }}
          >
            搜索
          </button>
        </div>
      </div>
      
      {!hasSearched ? (
        <div style={{ padding: '16px' }}>
          {historyKeywords.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div className="flex-between" style={{ marginBottom: '12px' }}>
                <span className="font-bold">搜索历史</span>
                <button
                  className="text-muted"
                  onClick={clearHistory}
                >
                  🗑️ 清空
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {historyKeywords.map((keyword, idx) => (
                  <button
                    key={idx}
                    className="btn btn-secondary btn-sm btn-round"
                    onClick={() => doSearch(keyword)}
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <div className="font-bold" style={{ marginBottom: '12px' }}>热门搜索</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {hotKeywords.map((keyword, idx) => (
                <button
                  key={idx}
                  className="btn btn-outline btn-sm btn-round"
                  style={{ borderColor: 'var(--primary-light)', color: 'var(--primary-color)' }}
                  onClick={() => doSearch(keyword)}
                >
                  {keyword}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '12px' }}>
          {loading ? (
            <div className="loading" style={{ marginTop: '100px' }}>
              <div className="loading-spinner"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state" style={{ marginTop: '100px' }}>
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-text">未找到相关商品</div>
              <div className="text-muted mt-sm">试试搜索其他关键词</div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '12px', color: 'var(--text-muted)' }}>
                共找到 <span style={{ color: 'var(--primary-color)' }}>{products.length}</span> 件商品
              </div>
              <div className="product-grid" style={{ padding: 0 }}>
                {products.map(product => (
                  <div
                    key={product.id}
                    className="product-card"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <img src={product.image} alt={product.name} className="product-image" />
                    <div className="product-info">
                      <div className="product-name">{product.name}</div>
                      <div className="flex-between">
                        <div className="product-price">
                          <span className="product-price-current">
                            ¥{product.show_price || product.price}
                          </span>
                          {product.member_price && user?.is_member && (
                            <span className="tag tag-member">会员价</span>
                          )}
                        </div>
                        <button
                          className="btn btn-primary btn-sm btn-round"
                          onClick={(e) => {
                            e.stopPropagation()
                            addToCart(product.id)
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {toast && (
        <div className="toast">{toast}</div>
      )}
    </div>
  )
}

export default SearchPage
