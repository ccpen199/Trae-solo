import { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Clock, 
  Ticket, 
  TrendingUp,
  Star,
  PlayCircle
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { mockData } from '../services/api';
import MovieCard from '../components/MovieCard';
import ScoreBadge from '../components/ScoreBadge';

export default function HomePage() {
  const { movies, setCurrentMovieId, setCurrentPage, setCurrentShowtimeId } = useAppStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState<'showing' | 'upcoming'>('showing');

  const hotMovies = [...movies].sort((a, b) => b.heatScore - a.heatScore).slice(0, 3);
  const showingMovies = movies.filter(m => m.status === 'showing');
  const upcomingMovies = movies.filter(m => m.status === 'upcoming');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % hotMovies.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [hotMovies.length]);

  const handleBuyTicket = (movieId: string, showtimeId: string) => {
    setCurrentMovieId(movieId);
    setCurrentShowtimeId(showtimeId);
    setCurrentPage('seat');
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % hotMovies.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + hotMovies.length) % hotMovies.length);
  };

  return (
    <div className="min-h-screen">
      <section className="relative h-[500px] md:h-[600px] overflow-hidden">
        {hotMovies.map((movie, index) => (
          <div
            key={movie.id}
            className={`absolute inset-0 transition-all duration-700 ${
              index === currentSlide 
                ? 'opacity-100 scale-100' 
                : 'opacity-0 scale-105'
            }`}
          >
            <div className="absolute inset-0">
              <img
                src={movie.backdrop || movie.poster}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-cinema-bg via-cinema-bg/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-cinema-bg via-transparent to-transparent" />
            </div>
            
            <div className="absolute inset-0 max-w-7xl mx-auto px-4 flex items-end pb-16">
              <div className="max-w-2xl animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex items-center gap-3 mb-4">
                  <ScoreBadge score={movie.rating} size="lg" />
                  <div className="flex items-center gap-1 px-3 py-1 bg-cinema-red/20 rounded-full">
                    <Flame className="w-4 h-4 text-cinema-red" />
                    <span className="text-sm text-cinema-red font-medium">
                      热度 {Math.round(movie.heatScore / 100)}
                    </span>
                  </div>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 text-shadow-glow">
                  {movie.title}
                </h1>
                {movie.originalTitle && (
                  <p className="text-xl text-cinema-text-secondary mb-4">
                    {movie.originalTitle}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {movie.genre.map((g) => (
                    <span
                      key={g}
                      className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white"
                    >
                      {g}
                    </span>
                  ))}
                </div>
                
                <p className="text-cinema-text-secondary mb-6 line-clamp-2 md:line-clamp-3">
                  {movie.synopsis}
                </p>
                
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => handleBuyTicket(movie.id, mockData.showtimes.find(s => s.movieId === movie.id)?.id || '')}
                    className="btn-primary flex items-center gap-2 text-lg py-3 px-8"
                  >
                    <Ticket className="w-5 h-5" />
                    立即购票
                  </button>
                  <button
                    onClick={() => {
                      setCurrentMovieId(movie.id);
                      setCurrentPage('movie');
                    }}
                    className="btn-secondary flex items-center gap-2 text-lg py-3 px-8"
                  >
                    <PlayCircle className="w-5 h-5" />
                    查看详情
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/30 hover:bg-cinema-red rounded-full transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/30 hover:bg-cinema-red rounded-full transition-colors z-10"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {hotMovies.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'w-8 bg-cinema-red' 
                  : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cinema-red/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-cinema-red" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-cinema-text">热度榜单</h2>
              <p className="text-sm text-cinema-text-secondary">本周最热门电影</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...movies].sort((a, b) => b.heatScore - a.heatScore).slice(0, 6).map((movie, index) => (
            <div
              key={movie.id}
              className="flex gap-4 p-4 bg-cinema-bg-light rounded-xl border border-cinema-border card-hover cursor-pointer"
              onClick={() => {
                setCurrentMovieId(movie.id);
                setCurrentPage('movie');
              }}
            >
              <div className="relative flex-shrink-0">
                <span className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm z-10 ${
                  index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                  index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                  index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                  'bg-cinema-border'
                }`}>
                  {index + 1}
                </span>
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-20 h-28 object-cover rounded-lg"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-cinema-text line-clamp-1 mb-2">
                  {movie.title}
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <ScoreBadge score={movie.rating} size="sm" />
                  <div className="flex items-center gap-1 text-cinema-gold">
                    <Flame className="w-3 h-3" />
                    <span className="text-sm font-medium">{Math.round(movie.heatScore / 100)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {movie.genre.slice(0, 2).map((g) => (
                    <span
                      key={g}
                      className="px-2 py-0.5 bg-cinema-bg rounded text-xs text-cinema-text-secondary"
                    >
                      {g}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-xs text-cinema-text-muted">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{movie.duration}分钟</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    <span>{movie.rating}万人评</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('showing')}
              className={`text-xl font-bold transition-colors ${
                activeTab === 'showing' 
                  ? 'text-cinema-text' 
                  : 'text-cinema-text-muted hover:text-cinema-text-secondary'
              }`}
            >
              正在热映
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`text-xl font-bold transition-colors ${
                activeTab === 'upcoming' 
                  ? 'text-cinema-text' 
                  : 'text-cinema-text-muted hover:text-cinema-text-secondary'
              }`}
            >
              即将上映
            </button>
          </div>
          <button 
            onClick={() => setCurrentPage('all-movies')}
            className="text-cinema-red text-sm font-medium hover:underline flex items-center gap-1"
          >
            查看全部 <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {(activeTab === 'showing' ? showingMovies : upcomingMovies)
            .slice(0, 10)
            .map((movie, index) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cinema-gold/20 rounded-lg">
              <Ticket className="w-6 h-6 text-cinema-gold" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-cinema-text">特惠推荐</h2>
              <p className="text-sm text-cinema-text-secondary">会员专享低价</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {showingMovies.slice(0, 3).map((movie) => {
            const showtime = mockData.showtimes.find(s => s.movieId === movie.id);
            return (
              <div
                key={movie.id}
                className="relative bg-gradient-to-br from-cinema-bg-light to-cinema-bg rounded-xl overflow-hidden border border-cinema-border card-hover cursor-pointer"
                onClick={() => {
                  setCurrentMovieId(movie.id);
                  setCurrentPage('movie');
                }}
              >
                <div className="absolute top-4 left-4 z-10">
                  <div className="px-3 py-1 bg-cinema-gold rounded-full text-xs font-bold text-white">
                    会员立减 ¥20
                  </div>
                </div>
                <div className="flex h-48">
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-32 h-full object-cover"
                  />
                  <div className="flex-1 p-4">
                    <h3 className="font-bold text-cinema-text line-clamp-1 mb-2">
                      {movie.title}
                    </h3>
                    <div className="mb-3">
                      <ScoreBadge score={movie.rating} size="sm" />
                    </div>
                    {showtime && (
                      <>
                        <p className="text-sm text-cinema-text-secondary mb-1">
                          {mockData.cinemas.find(c => c.id === showtime.cinemaId)?.name}
                        </p>
                        <p className="text-sm text-cinema-text-muted mb-3">
                          {showtime.startTime.slice(11, 16)} · {showtime.format}
                        </p>
                      </>
                    )}
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-xs text-cinema-text-muted line-through">
                          ¥{showtime?.price || 89}
                        </span>
                        <span className="text-2xl font-bold text-cinema-gold ml-2">
                          ¥{showtime?.vipPrice || 69}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuyTicket(movie.id, showtime?.id || '');
                        }}
                        className="btn-gold py-1.5 px-4 text-sm"
                      >
                        抢票
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-cinema-bg-light py-16 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '1000+', label: '热映影片' },
              { value: '500+', label: '合作影院' },
              { value: '5000万+', label: '服务用户' },
              { value: '99.9%', label: '好评率' },
            ].map((stat, index) => (
              <div key={index} className="text-center animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <p className="text-4xl md:text-5xl font-bold text-gradient mb-2">
                  {stat.value}
                </p>
                <p className="text-cinema-text-secondary">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
