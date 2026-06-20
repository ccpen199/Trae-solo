import * as React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, Compass, Recycle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-6">
      <div className="absolute inset-0 hero-gradient-bg" />
      <div className="absolute inset-0 noise-overlay pointer-events-none" />
      <div className="absolute top-1/4 -left-40 w-96 h-96 rounded-full bg-forest-600/20 blur-[120px]" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 rounded-full bg-gold-500/15 blur-[120px]" />

      <div className="relative z-10 text-center max-w-xl space-y-10">
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: 'spring' }}
          className="space-y-4"
        >
          <Badge variant="warning">404 Error</Badge>

          <motion.div
            className="relative inline-block"
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <h1 className="font-display text-[160px] sm:text-[200px] lg:text-[240px] font-black leading-none tracking-tighter">
              <span className="relative inline-block">
                <span className="absolute inset-0 gold-text blur-2xl opacity-60">404</span>
                <span className="gold-text relative">404</span>
              </span>
            </h1>
            <motion.div
              className="absolute -inset-4 rounded-full bg-gold-500/10 blur-3xl"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-4"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink-50 tracking-tight">
            页面走丢了
          </h2>
          <p className="text-lg text-ink-300 leading-relaxed max-w-md mx-auto">
            您寻找的页面可能已被移动、删除或从未存在过。
            让我们带您回到正轨，继续探索奢侈品回收之旅。
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <Link to="/">
            <Button size="lg" className="animate-glow-pulse">
              <Home className="w-5 h-5" />
              返回首页
            </Button>
          </Link>
          <Link to="/evaluate">
            <Button size="lg" variant="secondary">
              <Compass className="w-5 h-5" />
              开始估价
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="pt-6 flex items-center justify-center gap-2 text-xs text-ink-500"
        >
          <Recycle className="w-4 h-4" />
          <span>臻回收 · 让每一件奢侈品遇见更高价值</span>
        </motion.div>
      </div>
    </div>
  );
};

export { NotFoundPage };
export default NotFoundPage;
