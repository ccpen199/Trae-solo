import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Music2 } from 'lucide-react'
import { motion } from 'framer-motion'

const SplashScreen = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/ad')
    }, 2000)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="mb-6"
        >
          <Music2 className="w-24 h-24 text-primary-400 mx-auto" />
        </motion.div>
        <h1 className="text-4xl font-bold text-gradient mb-2">音乐推荐</h1>
        <p className="text-gray-400">发现好音乐，每一天都是新的开始</p>
      </motion.div>
    </div>
  )
}

export default SplashScreen