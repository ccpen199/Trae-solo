import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coins, Package, Ticket, Gift, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MallItem } from '@/types';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Tag from '@/components/common/Tag';

interface MallItemCardProps {
  item: MallItem;
  className?: string;
  onExchange?: (id: string) => void;
}

const categoryIcons: Record<string, React.ElementType> = {
  coupon: Ticket,
  physical: Package,
  donation: Gift,
};

const categoryLabels: Record<string, string> = {
  coupon: '优惠券',
  physical: '实物商品',
  donation: '公益捐赠',
};

export default function MallItemCard({ item, className, onExchange }: MallItemCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/mall/${item.id}`);
  };

  const handleExchange = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExchange?.(item.id);
  };

  const CategoryIcon = categoryIcons[item.category] || Package;
  const isCoupon = item.category === 'coupon';
  const isDonation = item.category === 'donation';
  const isLowStock = item.stock > 0 && item.stock <= 10;

  return (
    <motion.div
      className={cn(
        'bg-white rounded-card shadow-card overflow-hidden cursor-pointer',
        className
      )}
      onClick={handleClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative h-36">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        {isCoupon && (
          <div className="absolute inset-0">
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-chaojing-500/80 to-transparent" />
            <div className="absolute left-0 right-0 bottom-0 h-6 flex">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 border-r border-white/30 last:border-r-0"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
                />
              ))}
            </div>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge variant="chaojing">
            <CategoryIcon className="w-3 h-3 mr-1" />
            {categoryLabels[item.category]}
          </Badge>
        </div>
        {item.discountRate && item.discountRate < 1 && (
          <div className="absolute top-2 right-2">
            <Tag color="red" size="sm">
              {Math.round(item.discountRate * 100)}% OFF
            </Tag>
          </div>
        )}
        {item.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">已售罄</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h4 className="font-semibold text-neutral-800 mb-1 line-clamp-1">{item.name}</h4>
        <p className="text-xs text-neutral-500 mb-3 line-clamp-2 h-8">{item.description}</p>

        {item.merchantName && (
          <p className="text-xs text-neutral-400 mb-3 line-clamp-1">{item.merchantName}</p>
        )}

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Coins className="w-5 h-5 text-chaojing-500" />
            <span className="text-xl font-bold text-chaojing-600">{item.price}</span>
            <span className="text-xs text-neutral-400">积分</span>
          </div>
          <div className="text-xs text-neutral-400">
            {isDonation ? `已捐 ${item.sold}` : `已售 ${item.sold}`}
          </div>
        </div>

        {isLowStock && !isDonation && (
          <div className="text-xs text-red-500 mb-3">
            仅剩 {item.stock} 件
          </div>
        )}

        <Button
          variant={isDonation ? 'success' : 'primary'}
          size="sm"
          className="w-full"
          disabled={item.stock === 0}
          onClick={handleExchange}
        >
          <ShoppingCart className="w-4 h-4 mr-1.5" />
          {isDonation ? '立即捐赠' : '立即兑换'}
        </Button>
      </div>
    </motion.div>
  );
}
