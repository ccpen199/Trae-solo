import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search as SearchIcon, X, TrendingUp, Clock, Play } from 'lucide-react'
import { motion } from 'framer-motion'
import request from '../utils/request'
import useStore from '../store/useStore'
import { useToast } from '../components/Toast'

const Search = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { playSong } = useStore()
  const { showToast } = useToast()
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')
  const [suggestions, setSuggestions] = useState([])
  const [results, setResults] = useState([])
  const [hotKeywords, setHotKeywords] = useState([])
  const [history, setHistory] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchHot = async () => {
      try {
        const res = await request.get('/search/hot-keywords')
        if (res.success) {
          setHotKeywords(res.data || [])
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchHot()
  }, [])

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await request.get('/search/history')
        if (res.success) {
          setHistory(res.data || [])
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchHistory()
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (keyword.trim()) {
        try {
          const res = await request.get(`/search/suggest?keyword=${encodeURIComponent(keyword)}`)
          if (res.success) {
            setSuggestions(res.data || [])
          }
        } catch (err) {
          console.error(err)
        }
      } else {
        setSuggestions([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [keyword])

  useEffect(() => {
    const initialKeyword = searchParams.get('keyword')
    if (initialKeyword) {
      handleSearch(initialKeyword)
    }
  }, [searchParams])

  const handleSearch = async (searchKeyword = keyword) => {
    if (!searchKeyword.trim()) return
    
    setLoading(true)
    setShowSuggestions(false)
    try {
      const res = await request.get(`/search?keyword=${encodeURIComponent(searchKeyword)}`)
      if (res.success) {
        setResults(res.data?.list || [])
      }
    } catch (err) {
      showToast('搜索失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearKeyword = () => {
    setKeyword('')
    setResults([])
    setShowSuggestions(false)
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value)
            setShowSuggestions(true)
          }}
          onKeyPress={handleKeyPress}
          onFocus={() => setShowSuggestions(true)}
          placeholder="搜索歌曲、歌手、专辑..."
          className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary-400 transition-colors"
        />
        {keyword && (
          <button
            onClick={clearKeyword}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 mt-2 glass rounded-xl overflow-hidden z-10"
          >
            {suggestions.slice(0, 8).map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setKeyword(item.name)
                  handleSearch(item.name)
                }}
                className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3"
              >
                <span className={item.type === 'artist' ? 'text-primary-400' : 'text-gray-400'}>
                  {item.type === 'artist' ? '歌手' : '歌曲'}
                </span>
                <span>{item.name}</span>
                {item.artist_name && (
                  <span className="text-gray-400 text-sm ml-auto">{item.artist_name}</span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {!keyword && !results.length && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-primary-400" />
              <h3 className="font-semibold">热门搜索</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {hotKeywords.map((item, index) => (
                <button
                  key={item.id || index}
                  onClick={() => {
                    setKeyword(item.keyword)
                    handleSearch(item.keyword)
                  }}
                  className="px-4 py-2 glass rounded-full text-sm hover:bg-primary-500/20 hover:text-primary-400 transition-colors flex items-center gap-2"
                >
                  {index < 3 && <span className="text-primary-400 font-bold">{index + 1}</span>}
                  {item.keyword}
                </button>
              ))}
            </div>
          </div>

          {history.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold">搜索历史</h3>
                </div>
                <button className="text-sm text-gray-400 hover:text-white">清空</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map((item, index) => (
                  <button
                    key={item.id || index}
                    onClick={() => {
                      setKeyword(item.keyword)
                      handleSearch(item.keyword)
                    }}
                    className="px-4 py-2 glass rounded-full text-sm hover:bg-white/20 transition-colors"
                  >
                    {item.keyword}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {results.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg mb-4">搜索结果 ({results.length})</h3>
          <div className="space-y-2">
            {results.map((song, index) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
                onClick={() => playSong(song)}
              >
                <img
                  src={song.cover || 'https://picsum.photos/200'}
                  alt={song.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate group-hover:text-primary-400 transition-colors">{song.name}</p>
                  <p className="text-sm text-gray-400 truncate">{song.artist_name}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 bg-primary-500 rounded-full">
                    <Play className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {!loading && keyword && results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">未找到相关结果</p>
          <p className="text-sm text-gray-500 mt-2">换个关键词试试吧</p>
        </div>
      )}
    </div>
  )
}

export default Search