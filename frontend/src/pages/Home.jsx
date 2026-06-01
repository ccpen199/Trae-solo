import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authStore } from '../store/authStore';
import { plantingStore } from '../store/plantingStore';
import Planting from './Planting';

export default function Home() {
  const [user, setUser] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [isPlanting, setIsPlanting] = useState(false);

  useEffect(() => {
    const authUnsub = authStore.subscribe((state) => {
      setUser(state.user);
    });
    setUser(authStore.getState().user);

    const plantingUnsub = plantingStore.subscribe((state) => {
      setIsPlanting(state.isPlanting);
    });
    plantingStore.loadSavedPlanting();

    return () => {
      authUnsub();
      plantingUnsub();
    };
  }, []);

  const durations = [10, 15, 20, 25, 30, 45, 60, 90, 120];

  const handleStartPlanting = async () => {
    try {
      await plantingStore.startPlanting(selectedDuration, user?.currentTree || 'oak');
    } catch (error) {
      alert(error.message);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}小时${mins > 0 ? ` ${mins}分钟` : ''}`;
    }
    return `${mins}分钟`;
  };

  if (isPlanting) {
    return <Planting />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-emerald-600">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🌳</div>
            <div>
              <h1 className="text-xl font-bold text-white">专注森林</h1>
              <p className="text-green-100 text-sm">{user?.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur rounded-full px-4 py-2">
              <span className="text-yellow-300 mr-1">💰</span>
              <span className="text-white font-semibold">{user?.coins || 0}</span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key="tree-selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-auto"
          >
            <div className="text-center mb-8">
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  y: [0, -10, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-8xl mb-4"
              >
                🌳
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-800">开始专注</h2>
              <p className="text-gray-500 mt-2">选择专注时长，种下一棵树</p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-8">
              {durations.map((duration) => (
                <motion.button
                  key={duration}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDuration(duration)}
                  className={`py-3 px-4 rounded-xl font-medium transition ${
                    selectedDuration === duration
                      ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {formatTime(duration)}
                </motion.button>
              ))}
            </div>

            <div className="text-center mb-6 text-sm text-gray-500">
              {selectedDuration < 25 ? '🌿 将种植灌木' : '🌳 将种植大树'}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartPlanting}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300 transition"
            >
              开始种植 🌱
            </motion.button>
          </motion.div>
        </AnimatePresence>

        <div className="grid grid-cols-3 gap-4 mt-8 max-w-md mx-auto">
          <div className="bg-white/20 backdrop-blur rounded-2xl p-4 text-center">
            <div className="text-3xl mb-1">🌲</div>
            <div className="text-white font-bold text-xl">{user?.treesPlanted || 0}</div>
            <div className="text-green-100 text-xs">已种树</div>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-2xl p-4 text-center">
            <div className="text-3xl mb-1">⏱️</div>
            <div className="text-white font-bold text-xl">{user?.totalFocusTime || 0}</div>
            <div className="text-green-100 text-xs">专注分钟</div>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-2xl p-4 text-center">
            <div className="text-3xl mb-1">⭐</div>
            <div className="text-white font-bold text-xl">Lv.{user?.level || 1}</div>
            <div className="text-green-100 text-xs">等级</div>
          </div>
        </div>
      </div>
    </div>
  );
}
