import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, ExternalLink, Clock, Check } from 'lucide-react';
import { api } from '@/api/client';
import type { Product } from '@/types';

const TABS = ['电影选座', '电商好物', '本地生活', '线下核销'] as const;
type TabType = (typeof TABS)[number];

const SOLD_SEATS = new Set([
  '0-1', '0-2', '0-5', '0-9',
  '1-3', '1-4', '1-8', '1-10',
  '2-0', '2-6', '2-7', '2-11',
  '3-2', '3-5', '3-9',
  '4-1', '4-4', '4-8', '4-10',
  '5-0', '5-3', '5-7', '5-11',
  '6-2', '6-6', '6-9',
  '7-1', '7-5', '7-8', '7-10',
]);

const LOCAL_CATEGORIES = ['全部', '餐饮', '美容', '娱乐', '酒店', '旅游'] as const;

const VERIFICATION_RECORDS = [
  { date: '2026-06-17', merchant: '蜀香园火锅', amount: 168, status: '已核销' },
  { date: '2026-06-15', merchant: '万达影城', amount: 59.9, status: '已核销' },
  { date: '2026-06-13', merchant: '锦江美容会所', amount: 199, status: '已核销' },
  { date: '2026-06-10', merchant: '宜宾燃面馆', amount: 38, status: '已核销' },
  { date: '2026-06-08', merchant: '嘉陵江KTV', amount: 88, status: '已核销' },
];

const QR_PATTERN = [
  [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,1,0,1,1,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,0,1,1,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,1,0,0,1,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,1,0,1,1,0,0,1,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0],
  [1,0,1,0,1,1,1,0,1,1,1,0,1,0,1,0,1,1,1],
  [0,1,0,1,0,0,1,1,0,0,0,1,0,1,1,0,0,1,0],
  [1,1,1,0,1,1,0,1,1,0,1,1,0,0,1,1,0,1,1],
  [0,0,0,0,0,0,0,0,1,0,1,0,1,0,0,1,0,0,0],
  [1,1,1,1,1,1,1,0,1,1,0,1,0,1,1,0,1,0,1],
  [1,0,0,0,0,0,1,0,0,0,1,0,1,0,1,0,1,1,0],
  [1,0,1,1,1,0,1,0,1,0,1,1,0,1,0,1,0,1,1],
  [1,0,1,1,1,0,1,0,0,1,0,0,1,0,1,1,0,0,1],
  [1,0,1,1,1,0,1,0,1,1,0,1,0,1,0,1,1,1,0],
  [1,0,0,0,0,0,1,0,1,0,1,0,1,0,0,0,0,1,0],
  [1,1,1,1,1,1,1,0,1,0,0,1,0,1,1,1,1,1,1],
];

const tabVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

function MovieSeatSelection({ movies }: { movies: Product[] }) {
  const [selectedMovieId, setSelectedMovieId] = useState(movies[0]?.id ?? '');
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());

  const currentMovie = movies.find(m => m.id === selectedMovieId) ?? movies[0];
  const totalPrice = currentMovie ? currentMovie.price * selectedSeats.size : 0;

  const toggleSeat = (row: number, col: number) => {
    const key = `${row}-${col}`;
    setSelectedSeats(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="flex gap-6">
      <div className="w-64 flex-shrink-0 space-y-3">
        {movies.map(movie => (
          <motion.div
            key={movie.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setSelectedMovieId(movie.id); setSelectedSeats(new Set()); }}
            className={`cursor-pointer rounded-xl p-4 border transition-colors ${
              movie.id === selectedMovieId
                ? 'bg-shujin-600/20 border-shujin-600'
                : 'bg-wudu-800 border-wudu-700 hover:border-wudu-600'
            }`}
          >
            <h3 className="font-serif text-white text-sm font-semibold mb-2">{movie.name}</h3>
            <p className="text-wudu-400 text-xs">{movie.cinema?.name}</p>
            <p className="text-wudu-500 text-xs">{movie.cinema?.hall}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-wudu-400 text-xs">{movie.cinema?.showtime?.slice(5)}</span>
              <span className="text-shujin-500 text-sm font-bold">¥{movie.price}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex-1 bg-wudu-900 rounded-2xl p-6 border border-wudu-800">
        <div className="w-full h-8 bg-wudu-700 rounded-t-lg flex items-center justify-center mb-6">
          <span className="text-wudu-400 text-xs tracking-widest">银 幕</span>
        </div>

        <div className="flex flex-col items-center gap-1.5 mb-6">
          {Array.from({ length: 8 }, (_, row) => (
            <div key={row} className="flex gap-1.5 items-center">
              <span className="text-wudu-500 text-[10px] w-4 text-right mr-1">{row + 1}</span>
              {Array.from({ length: 12 }, (_, col) => {
                const key = `${row}-${col}`;
                const isSold = SOLD_SEATS.has(key);
                const isSelected = selectedSeats.has(key);
                return (
                  <motion.button
                    key={col}
                    whileHover={!isSold && !isSelected ? { scale: 1.2 } : {}}
                    whileTap={!isSold ? { scale: 0.9 } : {}}
                    onClick={() => !isSold && toggleSeat(row, col)}
                    className={`w-4 h-4 rounded-sm transition-colors ${
                      isSold
                        ? 'bg-wudu-800 border border-wudu-700 cursor-not-allowed'
                        : isSelected
                        ? 'bg-jinguan-400 cursor-pointer'
                        : 'bg-wudu-600 hover:bg-shujin-600 cursor-pointer'
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-6 mb-6 text-xs text-wudu-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-wudu-600" />
            <span>可选</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-jinguan-400" />
            <span>已选</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-wudu-800 border border-wudu-700" />
            <span>已售</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-wudu-700 pt-4">
          <div>
            <span className="text-wudu-400 text-sm">已选 {selectedSeats.size} 座</span>
            {selectedSeats.size > 0 && (
              <span className="ml-3 text-shujin-500 text-lg font-bold">¥{totalPrice.toFixed(1)}</span>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={selectedSeats.size === 0}
            className="px-6 py-2.5 bg-gradient-to-r from-shujin-600 to-shujin-700 text-white rounded-lg font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            确认选座
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function EcommerceGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-3 gap-5">
      {products.map(product => (
        <motion.div
          key={product.id}
          whileHover={{ y: -4 }}
          className="bg-wudu-800 rounded-xl overflow-hidden border border-wudu-700 hover:border-wudu-600 transition-colors"
        >
          <div className="aspect-[4/3] overflow-hidden">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="p-4">
            <h3 className="text-white font-medium text-sm mb-2 truncate">{product.name}</h3>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-shujin-500 font-bold text-lg">¥{product.price}</span>
              <span className="text-wudu-500 text-xs line-through">¥{product.originalPrice}</span>
            </div>
            {product.cpsRate != null && (
              <span className="inline-block bg-jinguan-400/20 text-jinguan-400 text-xs px-2 py-0.5 rounded mb-2">
                CPS 分佣 {(product.cpsRate * 100).toFixed(0)}%
              </span>
            )}
            {product.category && (
              <span className="inline-block ml-2 bg-wudu-700 text-wudu-300 text-xs px-2 py-0.5 rounded mb-2">
                {product.category}
              </span>
            )}
            {product.rating != null && (
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={i < Math.round(product.rating!) ? 'text-jinguan-400 fill-jinguan-400' : 'text-wudu-600'}
                  />
                ))}
                <span className="text-wudu-400 text-xs ml-1">{product.rating}</span>
              </div>
            )}
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href={product.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-jinguan-400 border border-jinguan-400/40 rounded-lg px-3 py-1.5 text-xs hover:bg-jinguan-400/10 transition-colors"
            >
              去购买 <ExternalLink size={12} />
            </motion.a>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function LocalLifeGrid({ products }: { products: Product[] }) {
  const [category, setCategory] = useState<string>('全部');
  const filtered = useMemo(
    () => category === '全部' ? products : products.filter(p => p.category === category),
    [category, products],
  );

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {LOCAL_CATEGORIES.map(cat => (
          <motion.button
            key={cat}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs transition-colors ${
              category === cat
                ? 'bg-shujin-600 text-white'
                : 'bg-wudu-800 text-wudu-400 hover:text-white border border-wudu-700'
            }`}
          >
            {cat}
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {filtered.map(product => (
          <motion.div
            key={product.id}
            whileHover={{ y: -4 }}
            className="bg-wudu-800 rounded-xl overflow-hidden border border-wudu-700 hover:border-wudu-600 transition-colors"
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4">
              {product.merchant && (
                <p className="text-wudu-400 text-xs mb-1">{product.merchant}</p>
              )}
              <h3 className="text-white font-medium text-sm mb-2">{product.name}</h3>
              <div className="flex items-center gap-3 mb-2">
                {product.distance != null && (
                  <span className="flex items-center gap-1 text-wudu-400 text-xs">
                    <MapPin size={12} /> {product.distance}km
                  </span>
                )}
                {product.rating != null && (
                  <span className="flex items-center gap-1 text-wudu-400 text-xs">
                    <Star size={12} className="text-jinguan-400 fill-jinguan-400" /> {product.rating}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-shujin-500 font-bold">¥{product.price}</span>
                {product.category && (
                  <span className="bg-wudu-700 text-wudu-300 text-xs px-2 py-0.5 rounded">{product.category}</span>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full mt-3 py-2 bg-shujin-600 text-white rounded-lg text-sm font-medium hover:bg-shujin-700 transition-colors"
              >
                立即抢购
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function OfflineVerification() {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[200px] h-[200px] mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-jinguan-400/40 animate-pulse-gold" />
        <div className="absolute inset-3 rounded-full bg-wudu-900 border border-wudu-700 overflow-hidden flex items-center justify-center">
          <div className="grid grid-cols-[19] gap-[2px] p-4">
            {QR_PATTERN.flat().map((cell, i) => (
              <div
                key={i}
                className="w-[6px] h-[6px]"
                style={{ backgroundColor: cell ? '#D4A843' : 'transparent' }}
              />
            ))}
          </div>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="w-full h-[2px] bg-jinguan-400/70 animate-scan" />
          </div>
        </div>
      </div>
      <p className="text-wudu-400 text-sm mb-8">出示核销码</p>

      <div className="w-full max-w-lg">
        <h3 className="text-white font-serif text-base mb-4">核销记录</h3>
        <div className="relative">
          <div className="absolute left-[7px] top-0 bottom-0 w-[2px] bg-wudu-700" />
          <div className="space-y-4">
            {VERIFICATION_RECORDS.map((record, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4 pl-6 relative"
              >
                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-wudu-800 border-2 border-jinguan-400 flex items-center justify-center">
                  <Check size={8} className="text-jinguan-400" />
                </div>
                <div className="flex-1 bg-wudu-800 rounded-lg p-3 border border-wudu-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm">{record.merchant}</span>
                    <span className="text-jinguan-400 text-xs font-medium">{record.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-wudu-500 text-xs flex items-center gap-1">
                      <Clock size={10} /> {record.date}
                    </span>
                    <span className="text-wudu-400 text-xs">¥{record.amount}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Scenarios() {
  const [activeTab, setActiveTab] = useState<TabType>('电影选座');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await api.products.list();
        setProducts(data);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const movies = useMemo(() => products.filter(p => p.type === 'movie'), [products]);
  const ecommerceProducts = useMemo(() => products.filter(p => p.type === 'ecommerce'), [products]);
  const localLifeProducts = useMemo(() => products.filter(p => p.type === 'local_life'), [products]);

  const TAB_CONTENT: Record<TabType, JSX.Element> = {
    '电影选座': <MovieSeatSelection movies={movies} />,
    '电商好物': <EcommerceGrid products={ecommerceProducts} />,
    '本地生活': <LocalLifeGrid products={localLifeProducts} />,
    '线下核销': <OfflineVerification />,
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-jinguan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="font-serif text-2xl text-white mb-6">消费场景广场</h1>

      <div className="flex gap-1 mb-8 border-b border-wudu-800">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-5 py-3 text-sm font-medium transition-colors rounded-t-lg ${
              activeTab === tab
                ? 'bg-shujin-600 text-white'
                : 'text-wudu-400 hover:text-white'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-jinguan-400"
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={tabVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25 }}
        >
          {TAB_CONTENT[activeTab]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
