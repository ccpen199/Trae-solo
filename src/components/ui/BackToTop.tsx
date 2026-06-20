import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

const BackToTop: React.FC = () => {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const handler = () => {
      setVisible(window.scrollY > 300);
    };
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={handleClick}
          className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-2xl bg-gold-gradient text-ink-950 shadow-gold hover:shadow-[0_0_50px_-8px_rgba(201,169,98,0.7)] transition-all duration-300 flex items-center justify-center active:scale-95 border border-gold-500/40 backdrop-blur-sm"
          aria-label="回到顶部"
          whileHover={{ y: -3 }}
        >
          <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export { BackToTop };
