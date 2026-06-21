import { StarRating } from '@/components/ui/StarRating';
import type { ServiceProvider } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, CheckCircle2, MapPin, Tag, X } from 'lucide-react';

interface OrderModalProps {
  provider: ServiceProvider | null;
  category: string;
  expectedTime: string;
  address: string;
  onClose: () => void;
  onConfirm: () => void;
  success: boolean;
}

export const OrderModal = ({
  provider,
  category,
  expectedTime,
  address,
  onClose,
  onConfirm,
  success,
}: OrderModalProps) => {
  return (
    <AnimatePresence>
      {provider && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-3xl2 shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {!success ? (
              <>
                <div className="p-6 border-b border-warm-card flex items-center justify-between">
                  <h3 className="text-lg font-bold text-brand">确认下单</h3>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-warm-bg transition-colors text-gray-400 hover:text-brand"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={provider.avatar}
                      alt={provider.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-warm-card"
                    />
                    <div>
                      <div className="font-bold text-brand">{provider.name}</div>
                      <div className="text-sm text-gray-500">
                        {provider.category}
                      </div>
                      <StarRating rating={provider.starLevel} size={12} />
                    </div>
                  </div>

                  <div className="space-y-3 bg-warm-bg rounded-xl2 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <Tag size={14} className="text-accent" />
                        服务类型
                      </span>
                      <span className="text-brand font-medium">{category}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <Calendar size={14} className="text-accent" />
                        预约时间
                      </span>
                      <span className="text-brand font-medium">
                        {expectedTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <MapPin size={14} className="text-accent" />
                        服务地址
                      </span>
                      <span className="text-brand font-medium text-right max-w-48 truncate">
                        {address}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-warm-card">
                      <span className="text-gray-500">预估价格</span>
                      <span className="text-accent font-bold text-lg">
                        {provider.priceRange}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={onClose}
                      className="flex-1 py-3 rounded-xl2 border border-brand text-brand font-medium hover:bg-brand-50 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={onConfirm}
                      className="flex-1 py-3 rounded-xl2 bg-accent text-white font-medium hover:bg-accent-600 transition-colors shadow-soft"
                    >
                      确认下单
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', damping: 15 }}
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-mint/10 flex items-center justify-center"
                >
                  <CheckCircle2 size={48} className="text-mint" />
                </motion.div>
                <h3 className="text-xl font-bold text-brand mb-2">下单成功</h3>
                <p className="text-gray-500 text-sm mb-6">
                  服务商将在10分钟内与您联系确认订单
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl2 border border-brand text-brand font-medium hover:bg-brand-50 transition-colors"
                  >
                    继续匹配
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl2 bg-accent text-white font-medium hover:bg-accent-600 transition-colors shadow-soft"
                  >
                    查看订单
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
