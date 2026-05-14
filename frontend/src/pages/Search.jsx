import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, X, Clock, TrendingUp, Sparkles } from 'lucide-react'
import api from '../utils/api'

function SearchPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [hotWords, setHotWords] = useState([])
  const [guessWords, setGuessWords] = useState([])
  const [history, setHistory] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [results, setResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef(null)
  
  useEffect(() => {
    fetchHotWords()
    fetchHistory()
  }, [])
  
  const fetchHotWords = async () => {
    try {
      const response = await api.get('/product/search/hot-words')
      setHotWords(response.hotWords || [])
      setGuessWords(response.guessWords || [])
    } catch (error) {
      console.error('Failed to fetch hot words:', error)
    }
  }
  
  const fetchHistory = async () => {
    try {
      const response = await api.get('/user/search-history')
      setHistory(response.history || [])
    } catch (error) {
      console.error('Failed to fetch history:', error)
    }
  }
  
  const handleKeywordChange = (value) => {
    setKeyword(value)
    setShowSuggestions(value.length > 0)
    setShowResults(false)
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    if (value.length > 0) {
      debounceRef.current = setTimeout(async () => {
        try {
          const response = await api.get('/product/search/suggestions', { params: { keyword: value } })
          setSuggestions(response.suggestions || [])
        } catch (error) {
          console.error('Failed to fetch suggestions:', error)
        }
      }, 300)
    } else {
      setSuggestions([])
    }
  }
  
  const handleSearch = async (searchKeyword = keyword) => {
    if (!searchKeyword.trim()) return
    
    setKeyword(searchKeyword)
    setShowSuggestions(false)
    setShowResults(true)
    
    try {
      await api.post('/user/search-history', { keyword: searchKeyword })
      
      const response = await api.get('/product/list', { params: { keyword: searchKeyword, page_size: 50 } })
      setResults(response.products || [])
      fetchHistory()
    } catch (error) {
      console.error('Failed to search:', error)
    }
  }
  
  const clearHistory = async () => {
    try {
      await api.delete('/user/search-history')
      setHistory([])
    } catch (error) {
      console.error('Failed to clear history:', error)
    }
  }
  
  return (
    <div className="search-page">
      <div className="search-header">
        <div className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </div>
        <div className="search-bar" style={{ flex: 1 }}>
          <Search size={18} color="#999" />
          <input
            type="text"
            placeholder="搜索商品"
            value={keyword}
            onChange={(e) => handleKeywordChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            autoFocus
          />
          {keyword && (
            <X
              size={18}
              color="#999"
              onClick={() => {
                setKeyword('')
                setShowSuggestions(false)
                setShowResults(false)
                setResults([])
              }}
            />
          )}
        </div>
        <button
          onClick={() => handleSearch()}
          style={{ color: '#ff4d4f', fontSize: 15 }}
        >
          搜索
        </button>
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div>
          {suggestions.map((suggestion, idx) => (
            <div
              key={idx}
              className="suggestion-item"
              onClick={() => handleSearch(suggestion)}
            >
              <Search size={16} color="#999" style={{ display: 'inline-block', marginRight: 10, verticalAlign: 'middle' }} />
              {suggestion}
            </div>
          ))}
        </div>
      )}
      
      {showResults ? (
        <div>
          {results.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🔍</div>
              <p>没有找到相关商品</p>
            </div>
          ) : (
            <div className="product-grid">
              {results.map((product) => (
                <div
                  key={product.id}
                  className="product-card"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <img
                    src={product.images?.[0] || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=product%20placeholder&image_size=square_hd'}
                    alt={product.name}
                  />
                  <div className="product-info">
                    <div className="product-name">{product.name}</div>
                    <div className="product-price">
                      <span className="price-current">¥{product.price?.toFixed(2)}</span>
                    </div>
                    <div className="product-sales">已售 {product.sales} 件</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {history.length > 0 && (
            <div className="search-section">
              <div className="search-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={18} color="#666" />
                  最近搜索
                </span>
                <span onClick={clearHistory} style={{ color: '#999', fontSize: 13 }}>清空</span>
              </div>
              <div className="search-tags" style={{ marginTop: 12 }}>
                {history.map((item, idx) => (
                  <span
                    key={idx}
                    className="search-tag"
                    onClick={() => handleSearch(item)}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {hotWords.length > 0 && (
            <div className="search-section">
              <div className="search-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={18} color="#ff4d4f" />
                热门搜索
              </div>
              <div className="search-tags" style={{ marginTop: 12 }}>
                {hotWords.map((word, idx) => (
                  <span
                    key={idx}
                    className="search-tag hot"
                    onClick={() => handleSearch(word)}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {guessWords.length > 0 && (
            <div className="search-section">
              <div className="search-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={18} color="#ffc107" />
                猜你想搜
              </div>
              <div className="search-tags" style={{ marginTop: 12 }}>
                {guessWords.map((word, idx) => (
                  <span
                    key={idx}
                    className="search-tag"
                    onClick={() => handleSearch(word)}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default SearchPage
