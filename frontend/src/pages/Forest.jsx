import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { plantingAPI } from '../services/api';

export default function Forest() {
  const [forest, setForest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForest();
  }, []);

  const loadForest = async () => {
    try {
      const data = await plantingAPI.getForest();
      setForest(data);
    } catch (error) {
      console.error('加载森林失败', error);
    } finally {
      setLoading(false);
    }
  };

  const treeEmojis = ['🌳', '🌲', '🌴', '🌿', '☘️', '🍀', '🎋'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-emerald-600">
      <div className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">我的森林</h1>
          <p className="text-green-100">每一棵树都是你专注的见证</p>
        </motion.div>

        <div className="grid grid-cols-3 gap-4 mb-8 max-w-md mx-auto">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/20 backdrop-blur rounded-2xl p-4 text-center"
          >
            <div className="text-3xl mb-1">🌲</div>
            <div className="text-white font-bold text-2xl">{forest?.stats?.totalTrees || 0}</div>
            <div className="text-green-100 text-xs">种树总数</div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/20 backdrop-blur rounded-2xl p-4 text-center"
          >
            <div className="text-3xl mb-1">⏱️</div>
            <div className="text-white font-bold text-2xl">{forest?.stats?.totalTime || 0}</div>
            <div className="text-green-100 text-xs">专注分钟</div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/20 backdrop-blur rounded-2xl p-4 text-center"
          >
            <div className="text-3xl mb-1">💀</div>
            <div className="text-white font-bold text-2xl">{forest?.stats?.witheredCount || 0}</div>
            <div className="text-green-100 text-xs">枯萎树木</div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-6 max-w-2xl mx-auto"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-6">🌳 森林展示</h2>
          
          {forest?.trees?.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🌱</div>
              <p className="text-gray-500">还没有种过树，快去开始第一次专注吧！</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-4">
              {forest.trees.map((tree, index) => (
                <motion.div
                  key={tree.id || index}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="aspect-square bg-green-50 rounded-2xl flex items-center justify-center relative group"
                >
                  <span className="text-4xl">
                    {tree.isWithered ? '💀' : treeEmojis[index % treeEmojis.length]}
                  </span>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition rounded-2xl flex items-center justify-center">
                    <span className="text-white text-xs text-center px-2">
                      {tree.duration}分钟
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
