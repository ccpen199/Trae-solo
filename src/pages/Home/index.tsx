import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  Ticket,
  Sparkles,
  Crown,
  RotateCcw,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Play,
  Clock,
  Calendar,
  Tag,
} from 'lucide-react';
import { movies, cinemas, promotions } from '@/services/mock/data';
import type { Movie, Cinema, Promotion, HallType } from '@/types';
import { cn } from '@/lib/utils';

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={cn(
            i <= Math.round(rating / 2)
              ? 'fill-cinema-gold text-cinema-gold'
              : 'fill-cinema-muted/30 text-cinema-muted/30'
          )}
        />
      ))}
      <span className="ml-1 text-sm font-bold text-cinema-gold">
        {rating > 0 ? rating.toFixed(1) : '暂无'}
      </span>
    </div>
  );
}

function HallBadge({ type }: { type: HallType }) {
  const styles: Record<HallType, string> = {
    IMAX: 'bg-cinema-imax text-white',
    '4DX': 'bg-cinema-4dx text-white',
    Dolby: 'bg-cinema-dolby text-white',
    Standard: 'bg-cinema-muted/30 text-cinema-muted',
    VIP: 'bg-cinema-gold text-cinema-midnight',
  };
  return (
    <span className={cn('badge-hall', styles[type])}>
      {type === 'Standard' ? '标准' : type}
    </span>
  );
}

function HeroCarousel() {
  const heroMovies = movies.filter((m) => m.status === 'now_showing').slice(0, 4);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPaused) return;
    timerRef.current = window.setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroMovies.length);
    }, 5000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isPaused, heroMovies.length]);

  const goTo = (index: number) => {
    setCurrent(index);
  };

  const goPrev = () => {
    setCurrent((prev) => (prev - 1 + heroMovies.length) % heroMovies.length);
  };

  const goNext = () => {
    setCurrent((prev) => (prev + 1) % heroMovies.length);
  };

  if (heroMovies.length === 0) return null;
  const movie = heroMovies[current];

  return (
    <div
      className="relative w-full h-[560px] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="absolute inset-0 transition-all duration-700 ease-out">
        <img
          src={movie.backdropUrl}
          alt={movie.title}
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-midnightDark via-cinema-midnightDark/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-midnight via-transparent to-transparent" />
      </div>

      <div className="relative z-10 container h-full flex items-center">
        <div className="max-w-2xl animate-fade-in" key={movie.id}>
          <div className="flex items-center gap-3 mb-4">
            <RatingStars rating={movie.rating} />
            <span className="text-cinema-muted text-sm">
              {movie.ratingCount.toLocaleString()} 人评价
            </span>
          </div>
          <h1
            className="font-display text-6xl font-bold mb-4 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {movie.title}
          </h1>
          <p className="text-cinema-muted text-lg mb-2">
            {movie.originalTitle}
          </p>
          <div className="flex items-center gap-4 text-sm text-cinema-muted mb-4">
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {movie.duration} 分钟
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {new Date(movie.releaseDate).toLocaleDateString('zh-CN')}
            </span>
            <span>{movie.genre.join(' / ')}</span>
          </div>
          <p className="text-white/80 text-base leading-relaxed mb-8 line-clamp-3">
            {movie.synopsis}
          </p>
          <div className="flex items-center gap-4">
            <Link to={`/movies/${movie.id}`} className="btn-gold flex items-center gap-2">
              <Ticket size={18} />
              立即购票
            </Link>
            <button className="btn-outline-gold flex items-center gap-2">
              <Play size={16} fill="currentColor" />
              播放预告片
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={goPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-cinema-gold hover:text-cinema-midnight transition-all"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={goNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-cinema-gold hover:text-cinema-midnight transition-all"
      >
        <ChevronRight size={24} />
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
        {heroMovies.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              index === current
                ? 'w-10 bg-cinema-gold'
                : 'w-2 bg-white/30 hover:bg-white/60'
            )}
          />
        ))}
      </div>
    </div>
  );
}

function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link
      to={`/movies/${movie.id}`}
      className="card-dark-hover group overflow-hidden"
    >
      <div className="relative overflow-hidden rounded-t-2xl aspect-[2/3]">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-0 ring-2 ring-cinema-gold ring-offset-2 ring-offset-transparent opacity-0 group-hover:opacity-100 rounded-t-2xl transition-all duration-300 group-hover:shadow-gold" />
        <div className="absolute top-2 left-2">
          {movie.genre.slice(0, 1).map((g) => (
            <span
              key={g}
              className="bg-cinema-midnight/80 backdrop-blur-sm text-cinema-gold text-xs px-2 py-1 rounded-md font-medium"
            >
              {g}
            </span>
          ))}
        </div>
        {movie.status === 'now_showing' && (
          <div className="absolute top-2 right-2 bg-cinema-red text-white text-xs px-2 py-1 rounded-md font-bold">
            热映
          </div>
        )}
        {movie.status === 'coming_soon' && (
          <div className="absolute top-2 right-2 bg-cinema-gold text-cinema-midnight text-xs px-2 py-1 rounded-md font-bold">
            即将
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <span className="btn-gold w-full text-center py-2 block text-sm">
            {movie.status === 'now_showing' ? '立即购票' : '想看'}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white mb-2 truncate group-hover:text-cinema-gold transition-colors">
          {movie.title}
        </h3>
        <div className="flex items-center justify-between mb-2">
          <RatingStars rating={movie.rating} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {movie.genre.slice(0, 2).map((g) => (
            <span
              key={g}
              className="text-xs text-cinema-muted bg-white/5 px-2 py-0.5 rounded"
            >
              {g}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

function MoviesSection() {
  const [activeTab, setActiveTab] = useState<'now_showing' | 'coming_soon'>('now_showing');

  const filteredMovies = movies.filter((m) => m.status === activeTab);
  const nowShowingCount = movies.filter((m) => m.status === 'now_showing').length;
  const comingSoonCount = movies.filter((m) => m.status === 'coming_soon').length;

  return (
    <section className="py-16">
      <div className="container">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2 bg-cinema-midnightLight p-1.5 rounded-2xl border border-white/5">
            <button
              onClick={() => setActiveTab('now_showing')}
              className={cn(
                'px-6 py-2.5 rounded-xl font-semibold transition-all duration-300',
                activeTab === 'now_showing'
                  ? 'bg-gradient-to-r from-cinema-goldDark to-cinema-gold text-cinema-midnight shadow-gold'
                  : 'text-cinema-muted hover:text-white'
              )}
            >
              正在热映
              <span
                className={cn(
                  'ml-2 text-sm',
                  activeTab === 'now_showing' ? 'text-cinema-midnight/70' : 'text-cinema-muted/70'
                )}
              >
                {nowShowingCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('coming_soon')}
              className={cn(
                'px-6 py-2.5 rounded-xl font-semibold transition-all duration-300',
                activeTab === 'coming_soon'
                  ? 'bg-gradient-to-r from-cinema-goldDark to-cinema-gold text-cinema-midnight shadow-gold'
                  : 'text-cinema-muted hover:text-white'
              )}
            >
              即将上映
              <span
                className={cn(
                  'ml-2 text-sm',
                  activeTab === 'coming_soon' ? 'text-cinema-midnight/70' : 'text-cinema-muted/70'
                )}
              >
                {comingSoonCount}
              </span>
            </button>
          </div>
          <Link to="/movies" className="text-cinema-gold hover:text-cinema-goldLight flex items-center gap-1 transition-colors">
            查看全部
            <ChevronRight size={18} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CinemaCard({ cinema }: { cinema: Cinema }) {
  return (
    <div className="card-dark-hover min-w-[320px] shrink-0 overflow-hidden">
      <div className="relative h-44 overflow-hidden">
        <img
          src={cinema.imageUrl}
          alt={cinema.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-midnight to-transparent" />
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-cinema-midnight/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs text-white">
          <MapPin size={12} className="text-cinema-gold" />
          {cinema.distance}km
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-lg text-white mb-2 truncate">{cinema.name}</h3>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {cinema.hallTypes.slice(0, 4).map((type) => (
            <HallBadge key={type} type={type} />
          ))}
        </div>
        <p className="text-sm text-cinema-muted mb-4 flex items-start gap-1.5">
          <MapPin size={14} className="mt-0.5 shrink-0" />
          <span className="line-clamp-1">{cinema.address}</span>
        </p>
        <Link to={`/cinemas/${cinema.id}`} className="btn-outline-gold w-full text-center py-2.5 block text-sm">
          快速选座
        </Link>
      </div>
    </div>
  );
}

function CinemasSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const featuredCinemas = cinemas.slice(0, 4);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 360;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="py-16 bg-gradient-to-b from-transparent via-cinema-midnightLight/50 to-transparent">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">特色影城推荐</h2>
            <p className="text-cinema-muted">精选高品质影城，给你极致观影体验</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white hover:border-cinema-gold hover:text-cinema-gold transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white hover:border-cinema-gold hover:text-cinema-gold transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none' }}
        >
          {featuredCinemas.map((cinema) => (
            <CinemaCard key={cinema.id} cinema={cinema} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PromotionCard({ promotion }: { promotion: Promotion }) {
  const formatDiscount = () => {
    if (promotion.discountUnit === 'percentage') {
      return `${10 - promotion.discountValue / 10}折起`;
    }
    if (promotion.discountUnit === 'amount' && promotion.discountValue > 0) {
      return `立减${promotion.discountValue}元`;
    }
    return '限时优惠';
  };

  return (
    <div className="card-dark-hover min-w-[400px] shrink-0 overflow-hidden group">
      <div className="relative h-52 overflow-hidden">
        <img
          src={promotion.imageUrl}
          alt={promotion.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-midnight via-cinema-midnight/50 to-transparent" />
        <div className="absolute top-3 left-3 bg-gradient-to-r from-cinema-red to-cinema-gold text-white px-3 py-1.5 rounded-lg font-bold text-sm shadow-lg">
          <Tag size={12} className="inline mr-1" />
          {formatDiscount()}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-lg text-white mb-2">{promotion.name}</h3>
        <p className="text-sm text-cinema-muted mb-3 line-clamp-2">{promotion.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-cinema-muted flex items-center gap-1">
            <Clock size={12} />
            {new Date(promotion.validFrom).toLocaleDateString('zh-CN')} -{' '}
            {new Date(promotion.validTo).toLocaleDateString('zh-CN')}
          </span>
          <button className="text-sm font-semibold text-cinema-gold hover:text-cinema-goldLight transition-colors flex items-center gap-1">
            立即参与
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function PromotionsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activePromotions = promotions.filter((p) => p.isActive);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 440;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="py-16">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">促销活动</h2>
            <p className="text-cinema-muted">超值优惠，精彩不断</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white hover:border-cinema-gold hover:text-cinema-gold transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white hover:border-cinema-gold hover:text-cinema-gold transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4"
          style={{ scrollbarWidth: 'none' }}
        >
          {activePromotions.map((promotion) => (
            <PromotionCard key={promotion.id} promotion={promotion} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Sparkles,
      title: '智能选座',
      subtitle: '黄金视线区',
      description: 'AI 智能推荐最佳观影位置，黄金视线区一键锁定',
      gradient: 'from-cinema-gold to-cinema-goldLight',
    },
    {
      icon: Ticket,
      title: '卖品套餐',
      subtitle: '超值组合',
      description: '爆米花可乐套餐优惠购，观影美食两不误',
      gradient: 'from-cinema-popcorn to-yellow-400',
    },
    {
      icon: Crown,
      title: '会员权益',
      subtitle: '专属特权',
      description: 'PACONNIE 会员专享折扣、积分兑换、生日礼遇',
      gradient: 'from-cinema-dolby to-purple-400',
    },
    {
      icon: RotateCcw,
      title: '极速退票',
      subtitle: '无忧观影',
      description: '开场前 30 分钟极速退票，改签无忧更放心',
      gradient: 'from-cinema-imax to-cyan-400',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-cinema-midnightLight/50 via-transparent to-cinema-midnight">
      <div className="container">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white mb-3">为什么选择我们</h2>
          <p className="text-cinema-muted">四大核心服务，打造极致观影体验</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="card-dark-hover p-8 text-center group"
            >
              <div
                className={cn(
                  'w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center bg-gradient-to-br',
                  feature.gradient,
                  'transition-transform duration-300 group-hover:scale-110 group-hover:shadow-gold'
                )}
              >
                <feature.icon size={32} className="text-cinema-midnight" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{feature.title}</h3>
              <p className="text-cinema-gold text-sm mb-3 font-medium">{feature.subtitle}</p>
              <p className="text-cinema-muted text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-cinema-midnight">
      <HeroCarousel />
      <MoviesSection />
      <CinemasSection />
      <PromotionsSection />
      <FeaturesSection />
    </div>
  );
}
