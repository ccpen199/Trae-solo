import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, SkipForward } from 'lucide-react'
import { motion } from 'framer-motion'
import request from '../utils/request'
import Loading from '../components/Loading'

const AdScreen = () => {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(5)
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await request.get('/content/ads')
        if (res.success && res.data?.length > 0) {
          setAds(res.data)
        }
      } catch (err) {
        console.error('Failed to fetch ads:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAds()
  }, [])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      navigate('/')
    }
  }, [countdown, navigate])

  const skipAd = () => {
    navigate('/')
  }

  if (loading) {
    return <Loading />
  }

  const currentAd = ads[0]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
      <button
        onClick={skipAd}
        className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 glass rounded-full hover:bg-white/20 transition-colors"
      >
        <SkipForward className="w-5 h-5" />
        <span>{countdown}s 跳过</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {currentAd ? (
          <div 
            className="aspect-video rounded-2xl overflow-hidden shadow-2xl cursor-pointer mb-6"
            onClick={() => currentAd.link && window.open(currentAd.link, '_blank')}
          >
            <img
              src={currentAd.image}
              alt={currentAd.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        ) : (
          <div className="aspect-video rounded-2xl glass flex flex-col items-center justify-center mb-6">
            <p className="text-2xl font-bold text-gradient mb-2">VIP会员限时优惠</p>
            <p className="text-gray-400">海量曲库 无损音质 立即开通</p>
          </div>
        )}

        <h2 className="text-xl font-bold text-center mb-2">{currentAd?.title || 'VIP会员限时优惠'}</h2>
        <p className="text-gray-400 text-center text-sm mb-8">广告内容由合作方提供</p>

        <button onClick={skipAd} className="w-full btn-primary">
          进入应用
        </button>
      </motion.div>
    </div>
  )
}

export default AdScreen