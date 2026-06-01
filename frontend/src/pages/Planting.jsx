import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { plantingStore } from '../store/plantingStore';

export default function Planting() {
  const [plantingState, setPlantingState] = useState(plantingStore.getState());

  useEffect(() => {
    const unsub = plantingStore.subscribe((state) => {
      setPlantingState(state);
    });
    return unsub;
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = plantingState.duration > 0 
    ? ((plantingState.duration * 60 - plantingState.remainingTime) / (plantingState.duration * 60)) * 100 
    : 0;

  const handleGiveUp = () => {
    const timeSinceStart = (Date.now() - new Date(plantingState.startTime).getTime()) / 1000;
    if (timeSinceStart < 10) {
      if (confirm('确定要放弃吗？10秒内放弃不会产生枯树。')) {
        plantingStore.giveUp();
      }
    } else {
      if (confirm('确定要放弃吗？树将会枯萎！')) {
        plantingStore.giveUp();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {plantingState.isWithered ? (
          <motion.div
            key="withered"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ 
                rotate: [0, -5, 5, -5, 0],
                opacity: [1, 0.5, 1]
              }}
              transition={{ duration: 1, repeat: 3 }}
              className="text-9xl mb-8"
            >
              💀
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-4">树枯萎了...</h2>
            <p className="text-green-100">离开应用会导致树枯萎</p>
            <p className="text-green-200 text-sm mt-2">即将返回主页...</p>
          </motion.div>
        ) : (
          <motion.div
            key="planting"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center px-8"
          >
            <div className="relative mb-12">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  y: [0, -20, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-9xl relative z-10"
              >
                {progress > 80 ? '🌳' : progress > 50 ? '🌲' : progress > 20 ? '🌱' : '🫘'}
              </motion.div>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0.1, 0.3]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-48 h-48 bg-green-300 rounded-full"
                />
              </div>
            </div>

            <div className="mb-8">
              <motion.div
                key={plantingState.remainingTime}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.3 }}
                className="text-6xl font-bold text-white mb-2"
              >
                {formatTime(plantingState.remainingTime)}
              </motion.div>
              <p className="text-green-100">专注中...</p>
            </div>

            <div className="w-64 mx-auto mb-8">
              <div className="h-3 bg-white/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 mb-8 max-w-sm mx-auto">
              <p className="text-white text-sm">
                ⚠️ <span className="font-medium">重要提示</span>
              </p>
              <p className="text-green-100 text-xs mt-1">
                请保持在当前页面，离开应用会导致树枯萎
              </p>
            </div>

            <button
              onClick={handleGiveUp}
              className="px-8 py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-xl transition backdrop-blur"
            >
              放弃种植
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
