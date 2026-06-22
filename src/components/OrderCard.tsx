import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { Link } from 'react-router-dom';
import { formatCurrency, getStatusClass, getStatusLabel, timeAgo } from '@/utils';
import { TierBadge3D } from '@/components/Badge3D';
import { getGame, TIER_LABEL_MAP } from '@/data/games';
import { FileCheck, Video, FileWarning, Eye, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

export default function OrderCard({ orderId, compact = false }: { orderId: string; compact?: boolean }) {
  const order = useAppStore(s => s.getOrderById(orderId));
  const getUserById = useAppStore(s => s.getUserById);
  const [menuOpen, setMenuOpen] = useState(false);
  if (!order) return null;

  const provider = getUserById(order.providerId);
  const player = getUserById(order.playerId);
  const game = order.requirement ? getGame(order.requirement.gameCode) : null;

  const fromTier = order.requirement?.fromTier;
  const toTier = order.requirement?.toTier;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card-hover overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{game?.icon}</div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-lg">{game?.name || '游戏'}</span>
                <span className={getStatusClass(order.status)}>{getStatusLabel(order.status)}</span>
              </div>
              <div className="text-xs text-night-400 font-mono">
                订单号 {order.id} · {timeAgo(order.signedAt)}
              </div>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-2 rounded-lg hover:bg-white/5"
            >
              <MoreHorizontal className="w-4 h-4 text-night-400" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute right-0 top-full mt-1 w-40 rounded-xl bg-night-800 border border-white/10 shadow-card overflow-hidden z-10"
                >
                  <Link to={`/order/${order.id}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-white/5">
                    <Eye className="w-3.5 h-3.5 text-night-400" />
                    查看详情
                  </Link>
                  <Link to={`/order/${order.id}/monitor`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-white/5">
                    <Video className="w-3.5 h-3.5 text-night-400" />
                    履约监控
                  </Link>
                  {order.status === 'InProgress' && (
                    <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-white/5 text-victory-red">
                      <FileWarning className="w-3.5 h-3.5" />
                      发起争议
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {!compact && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="p-4 rounded-xl bg-night-900/50 border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <FileCheck className="w-4 h-4 text-esports-400" />
                <span className="text-sm text-night-300 font-medium">服务内容</span>
              </div>
              {fromTier && toTier && (
                <div className="flex items-center justify-between gap-4">
                  <div className="text-center flex-1">
                    <TierBadge3D tier={fromTier} size={72} />
                    <div className="text-xs text-night-400 mt-1">{TIER_LABEL_MAP[fromTier]}</div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <motion.div
                      animate={{ x: [0, 6, 0] }}
                      transition={{ repeat: Infinity, duration: 1.8 }}
                      className="text-2xl"
                    >
                      ➜
                    </motion.div>
                    <span className="text-[10px] text-night-500 font-mono">
                      {order.requirement?.serviceType}
                    </span>
                  </div>
                  <div className="text-center flex-1">
                    <TierBadge3D tier={toTier} size={72} />
                    <div className="text-xs text-night-400 mt-1">{TIER_LABEL_MAP[toTier]}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-night-900/50 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-night-300 font-medium">双方信息</span>
                <span className="data-number text-xs text-night-500">{order.evidence.length} 份证据</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img src={player?.avatar} className="w-8 h-8 rounded-full ring-2 ring-diamond-500/40" alt="" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{player?.nickname}</div>
                    <div className="text-[10px] text-night-500">需求方</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <img src={provider?.avatar} className="w-8 h-8 rounded-full ring-2 ring-gold-500/40" alt="" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{provider?.nickname}</div>
                    <div className="text-[10px] text-night-500">供给方（代练）</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-5">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-night-300">履约进度</span>
            <span className="data-number font-semibold text-esports-300">{order.progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-night-700 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${order.progress}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full bg-gradient-esports relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer bg-[length:200%_100%]" />
            </motion.div>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-night-500">
            <span>{order.milestones.filter(m => m.verified).length}/{order.milestones.length || 5} 节点完成</span>
            <span>截止：{order.deadlineAt}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div>
            <div className="text-xs text-night-400">合约总额</div>
            <div className="text-2xl font-bold data-number text-gradient-gold">
              {formatCurrency(order.totalPrice)}
            </div>
            <div className="text-[10px] text-night-500">
              定金 {formatCurrency(order.depositPaid)} · 担保中
            </div>
          </div>
          <Link to={`/order/${order.id}`} className="btn-secondary">
            查看合约
            <Eye className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
