import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { Link } from 'react-router-dom';
import { Crown, Star, Clock, Award, ChevronRight, TrendingUp } from 'lucide-react';
import { CertBadge3D } from '@/components/Badge3D';
import { getCertLabel, formatCurrency } from '@/utils';
import { useMemo, useState } from 'react';
import type { ProviderProfile, User } from '@/types';

interface Props {
  provider: ProviderProfile & { user: User };
  featured?: boolean;
}

export default function ProviderCard({ provider, featured = false }: Props) {
  const [hover, setHover] = useState(false);
  const reviews = useAppStore(s => s.reviews);
  const providerReviews = useMemo(
    () => reviews.filter(review => review.toUserId === provider.userId),
    [provider.userId, reviews],
  );
  const avgRating = providerReviews.length
    ? (providerReviews.reduce((total, review) => total + review.rating, 0) / providerReviews.length)
    : provider.reputationScore;

  const certClass = {
    Diamond: 'cert-diamond', Gold: 'cert-gold', Silver: 'cert-silver', None: 'badge-base bg-night-600 text-night-300'
  }[provider.certLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300 } }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      className="glass-card-hover group overflow-hidden relative"
    >
      {featured && (
        <div className="absolute top-0 right-0 z-10">
          <div className="bg-gradient-esports text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" />
            精选推荐
          </div>
        </div>
      )}

      <div className="relative h-32 bg-gradient-to-br from-esports-900 via-night-800 to-esports-800/40 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-night-800 via-transparent to-transparent" />
        <motion.div
          animate={hover ? { scale: 1.08, rotate: 2 } : { scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="absolute -right-6 -bottom-6 opacity-80"
        >
          <CertBadge3D level={provider.certLevel} size={featured ? 110 : 90} />
        </motion.div>
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={certClass}>
            <Crown className="w-3 h-3" />
            {getCertLabel(provider.certLevel)}
          </span>
          {featured && <span className="badge-base bg-gradient-esports text-white">TOP 10</span>}
        </div>
      </div>

      <div className="p-5 -mt-10 relative">
        <div className="flex items-end gap-4 mb-4">
          <div className="relative">
            <img
              src={provider.user.avatar}
              alt=""
              className="w-20 h-20 rounded-2xl border-4 border-night-800 shadow-lg object-cover bg-night-700"
            />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-gradient-esports flex items-center justify-center shadow-esports-glow">
              <Award className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <div className="flex-1 pb-1">
            <Link to={`/provider/${provider.userId}`} className="flex items-center gap-2 group/title">
              <h3 className="text-xl font-bold group-hover/title:text-esports-300 transition-colors">{provider.user.nickname}</h3>
              <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover/title:opacity-100 group-hover/title:translate-x-0 transition-all text-esports-400" />
            </Link>
            <div className="flex items-center gap-2 mt-1.5 text-sm">
              <span className="inline-flex items-center gap-1 text-gold-400 font-semibold data-number">
                <Star className="w-3.5 h-3.5 fill-current" />
                {avgRating.toFixed(1)}
              </span>
              <span className="text-night-500">·</span>
              <span className="text-night-300 data-number">{provider.totalOrders} 单</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-night-300 line-clamp-2 mb-4 min-h-[2.5rem] leading-relaxed">{provider.bio}</p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: '履约率', value: provider.completionRate, unit: '%', color: 'text-victory-green' },
            { label: '准时率', value: provider.onTimeRate, unit: '%', color: 'text-diamond-500' },
            { label: '仲裁胜率', value: provider.disputeWinRate, unit: '%', color: 'text-gold-500' },
          ].map(stat => (
            <div key={stat.label} className="p-3 rounded-xl bg-night-900/60 border border-white/5 text-center">
              <div className={`text-xl font-bold data-number ${stat.color}`}>
                {stat.value}<span className="text-sm">{stat.unit}</span>
              </div>
              <div className="text-[11px] text-night-400 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {provider.specialties.map(s => (
            <span key={s} className="px-2.5 py-1 text-xs rounded-lg bg-esports-400/10 text-esports-300 border border-esports-400/20">
              {s}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div>
            <div className="text-xs text-night-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              起价
            </div>
            <div className="text-2xl font-bold data-number text-gradient-gold leading-tight">
              ¥{formatCurrency(provider.certLevel === 'Diamond' ? 88 : 58).slice(1)}
              <span className="text-xs text-night-400 font-normal data-number"> / 段位</span>
            </div>
          </div>
          <Link to={`/provider/${provider.userId}`} className="btn-primary py-2.5 px-5 text-sm">
            立即咨询
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
