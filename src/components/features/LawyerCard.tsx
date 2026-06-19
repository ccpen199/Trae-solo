import { motion } from 'framer-motion';
import { Building2, Clock, Star, User as UserIcon, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Lawyer } from '@/types';
import { getCategoryLabel } from '@/utils/format';

interface LawyerCardProps {
  lawyer: Lawyer;
  userName?: string;
  userAvatar?: string;
  showStats?: boolean;
  onClick?: (lawyer: Lawyer) => void;
}

export default function LawyerCard({
  lawyer,
  userName,
  userAvatar,
  showStats = true,
  onClick,
}: LawyerCardProps) {
  const avgResponseMin = Math.round(lawyer.creditScore * 0.2);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onClick?.(lawyer)}
      className={cn(
        'group cursor-pointer rounded-xl border border-primary-100/50 bg-white p-5 shadow-card transition-all duration-300',
        'hover:shadow-card-hover hover:border-accent-gold/40'
      )}
    >
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName || '律师头像'}
              className="h-16 w-16 rounded-xl object-cover ring-2 ring-primary-100"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 text-primary-600 ring-2 ring-primary-100">
              <UserIcon className="h-8 w-8" />
            </div>
          )}
          {lawyer.verifyStatus === 'approved' && (
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gold-gradient text-white shadow">
              <Award className="h-3.5 w-3.5" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="truncate font-serif text-lg font-semibold text-primary-800 group-hover:text-primary-900">
              {userName || '匿名律师'}
            </h3>
          </div>

          <div className="mb-2 flex items-center gap-1 text-sm text-primary-500">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{lawyer.firmName}</span>
            <span className="mx-1 text-primary-300">|</span>
            <span className="shrink-0">执业{lawyer.practiceYears}年</span>
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5">
            {lawyer.specialties.slice(0, 3).map((spec) => (
              <span
                key={spec}
                className="badge border border-accent-gold/30 bg-accent-gold/5 text-accent-gold-dark"
              >
                {getCategoryLabel(spec)}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="font-medium text-primary-800">
                {lawyer.averageRating.toFixed(1)}
              </span>
            </div>
            {showStats && (
              <>
                <div className="flex items-center gap-1 text-primary-500">
                  <Clock className="h-4 w-4" />
                  <span>约 {avgResponseMin} 分钟响应</span>
                </div>
                <div className="text-primary-400">
                  已服务 {lawyer.consultationCount} 次
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
