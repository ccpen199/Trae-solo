import React from 'react'
import { Music } from 'lucide-react'
import { motion } from 'framer-motion'

const Loading = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <motion.div
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear'
        }}
      >
        <Music className="w-16 h-16 text-primary-400" />
      </motion.div>
      <p className="mt-4 text-gray-400">加载中...</p>
    </div>
  )
}

export default Loading