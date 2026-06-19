import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CaseCategory } from '@/types';

interface CategoryCardProps {
  category: CaseCategory;
  icon: LucideIcon;
  name: string;
  description: string;
  onClick?: (category: CaseCategory) => void;
}

export default function CategoryCard({
  category,
  icon: Icon,
  name,
  description,
  onClick,
}: CategoryCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick?.(category)}
      className={cn(
        'group relative cursor-pointer rounded-xl border border-primary-100/50 bg-white p-6 shadow-card transition-all duration-300',
        'hover:shadow-card-hover overflow-hidden'
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent-gold/20 via-transparent to-accent-gold-light/10" />
        <div className="absolute inset-0 rounded-xl border-2 border-transparent bg-gradient-to-br from-accent-gold via-accent-gold-light to-accent-gold-dark p-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]; [mask-composite:exclude]">
          <div className="h-full w-full" />
        </div>
      </div>

      <div className="relative">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-600 transition-colors duration-300 group-hover:bg-accent-gold/10 group-hover:text-accent-gold-dark">
          <Icon className="h-6 w-6" />
        </div>

        <h3 className="mb-2 font-serif text-lg font-semibold text-primary-800 transition-colors duration-300 group-hover:text-primary-900">
          {name}
        </h3>

        <p className="text-sm leading-relaxed text-primary-500">
          {description}
        </p>
      </div>
    </motion.div>
  );
}
