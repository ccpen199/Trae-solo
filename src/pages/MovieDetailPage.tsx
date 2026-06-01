import { useState } from 'react';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  Calendar, 
  Clock, 
  Globe, 
  User, 
  Users,
  Ticket,
  MapPin,
  Star
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { mockData } from '../services/api';
import ScoreBadge from '../components/ScoreBadge';
import HeatTrendChart from '../components/HeatTrendChart';
import ScoreRadarChart from '../components/ScoreRadarChart';
import MovieCard from '../components/MovieCard';

export default function MovieDetailPage() {
  const { 
    currentMovieId, 
    getMovieById, 
    setCurrentPage, 
    isFavorite, 
    addFavorite, 
    removeFavorite,
    setCurrentShowtimeId,
    isLoggedIn
  } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<'info' | 'showtimes' | 'reviews'>('info');
  const [selectedCinema, setSelectedCinema] = useState<string | null>(null);

  const movie = currentMovieId ? getMovieById(currentMovieId) : undefined;
  
  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-cinema-text-secondary">未找到该影片</p>
      </div>
    );
  }

  const isFav = isFavorite(movie.id);
  const showtimes = mockData.showtimes.filter(s => s.movieId === movie.id);
  const cinemas = mockData.cinemas.filter(c => 
    showtimes.some(s => s.cinemaId === c.id)
  );
  const filteredShowtimes = selectedCinema 
    ? showtimes.filter(s => s.cinemaId === selectedCinema)
    : showtimes;
  const relatedMovies = mockData.movies
    .filter(m => m.id !== movie.id && m.genre.some(g => movie.genre.includes(g)))
    .slice(0, 4);

  const handleBuyTicket = (showtimeId: string) => {
    if (!isLoggedIn) {
      setCurrentPage('login');
      return;
    }
    setCurrentShowtimeId(showtimeId);
    setCurrentPage('seat');
  };

  const toggleFavorite = () => {
    if (isFav) {
      removeFavorite(movie.id);
    } else {
      addFavorite(movie.id);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="relative h-[400px] md:h-[500px] overflow-hidden">
        <img
          src={movie.backdrop || movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-bg via-cinema-bg/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-bg via-transparent to-transparent" />
        
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <button
            onClick={() => setCurrentPage('home')}
            className="p-2 bg-black/30 hover:bg-cinema-red rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFavorite}
              className={`p-2 rounded-full transition-colors ${
                isFav ? 'bg-cinema-red text-white' : 'bg-black/30 text-white hover:bg-cinema-red'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
            </button>
            <button className="p-2 bg-black/30 hover:bg-cinema-red rounded-full transition-colors">
              <Share2 className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-48 h-72 object-cover rounded-xl shadow-2xl border-4 border-cinema-bg"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                  {movie.title}
                </h1>
                {movie.originalTitle && (
                  <p className="text-lg text-cinema-text-secondary mb-4">
                    {movie.originalTitle}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <ScoreBadge score={movie.rating} size="lg" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {movie.genre.map((g) => (
                <span
                  key={g}
                  className="px-3 py-1 bg-cinema-bg-light border border-cinema-border rounded-full text-sm text-cinema-text-secondary"
                >
                  {g}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-2 text-cinema-text-secondary">
                <Calendar className="w-4 h-4 text-cinema-red" />
                <span className="text-sm">{movie.releaseDate}</span>
              </div>
              <div className="flex items-center gap-2 text-cinema-text-secondary">
                <Clock className="w-4 h-4 text-cinema-red" />
                <span className="text-sm">{movie.duration}分钟</span>
              </div>
              <div className="flex items-center gap-2 text-cinema-text-secondary">
                <Globe className="w-4 h-4 text-cinema-red" />
                <span className="text-sm">{movie.region}</span>
              </div>
              <div className="flex items-center gap-2 text-cinema-text-secondary">
                <Users className="w-4 h-4 text-cinema-red" />
                <span className="text-sm">{movie.language}</span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-cinema-gold mt-1 flex-shrink-0" />
                <div>
                  <span className="text-sm text-cinema-text-muted">导演</span>
                  <p className="text-cinema-text">{movie.director}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 text-cinema-gold mt-1 flex-shrink-0" />
                <div>
                  <span className="text-sm text-cinema-text-muted">主演</span>
                  <p className="text-cinema-text">{movie.cast.join(' / ')}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {movie.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-cinema-red/10 text-cinema-red rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <button
              onClick={() => setActiveTab('showtimes')}
              className="btn-primary flex items-center gap-2"
            >
              <Ticket className="w-5 h-5" />
              立即购票
            </button>
          </div>
        </div>

        <div className="mt-12 border-b border-cinema-border">
          <div className="flex gap-8">
            {[
              { id: 'info', label: '影片介绍' },
              { id: 'showtimes', label: '场次排期' },
              { id: 'reviews', label: '观众评价' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`pb-4 px-2 font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-cinema-red'
                    : 'text-cinema-text-secondary hover:text-cinema-text'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cinema-red" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="py-8">
          {activeTab === 'info' && (
            <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
              <div>
                <h3 className="text-xl font-bold text-cinema-text mb-4">剧情简介</h3>
                <p className="text-cinema-text-secondary leading-relaxed">
                  {movie.synopsis}
                </p>

                <div className="mt-8">
                  <HeatTrendChart data={movie.heatTrend} height={180} />
                </div>
              </div>
              <div>
                <ScoreRadarChart ratings={movie.ratings} height={280} />
                
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {Object.entries(movie.ratings).map(([source, score]) => (
                    <div
                      key={source}
                      className="p-4 bg-cinema-bg-light rounded-xl border border-cinema-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-cinema-text-secondary text-sm capitalize">
                          {source === 'douban' ? '豆瓣' : 
                           source === 'imdb' ? 'IMDb' :
                           source === 'rotten' ? '烂番茄' : '猫眼'}
                        </span>
                        <Star className="w-4 h-4 text-cinema-gold fill-current" />
                      </div>
                      <p className="text-2xl font-bold text-cinema-gold">
                        {source === 'rotten' ? `${score}%` : score?.toFixed(1)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'showtimes' && (
            <div className="animate-fade-in">
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setSelectedCinema(null)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedCinema === null
                      ? 'bg-cinema-red text-white'
                      : 'bg-cinema-bg-light text-cinema-text-secondary hover:text-cinema-text'
                  }`}
                >
                  全部影院
                </button>
                {cinemas.map((cinema) => (
                  <button
                    key={cinema.id}
                    onClick={() => setSelectedCinema(cinema.id)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedCinema === cinema.id
                        ? 'bg-cinema-red text-white'
                        : 'bg-cinema-bg-light text-cinema-text-secondary hover:text-cinema-text'
                    }`}
                  >
                    {cinema.name}
                  </button>
                ))}
              </div>

              <div className="space-y-6">
                {cinemas
                  .filter(c => !selectedCinema || c.id === selectedCinema)
                  .map((cinema) => {
                    const cinemaShowtimes = filteredShowtimes.filter(
                      s => s.cinemaId === cinema.id
                    );
                    if (cinemaShowtimes.length === 0) return null;
                    
                    return (
                      <div
                        key={cinema.id}
                        className="bg-cinema-bg-light rounded-xl border border-cinema-border overflow-hidden"
                      >
                        <div className="p-4 border-b border-cinema-border">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-cinema-text">{cinema.name}</h4>
                              <div className="flex items-center gap-4 mt-1 text-sm text-cinema-text-secondary">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{cinema.address}</span>
                                </div>
                                {cinema.distance && (
                                  <span>{cinema.distance}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {cinemaShowtimes.map((showtime) => {
                              const hall = cinema.halls.find(h => h.id === showtime.hallId);
                              return (
                                <button
                                  key={showtime.id}
                                  onClick={() => handleBuyTicket(showtime.id)}
                                  className="p-4 bg-cinema-bg rounded-xl border border-cinema-border hover:border-cinema-red transition-colors text-left group"
                                >
                                  <p className="text-xl font-bold text-cinema-text group-hover:text-cinema-red transition-colors">
                                    {showtime.startTime.slice(11, 16)}
                                  </p>
                                  <p className="text-sm text-cinema-text-secondary mt-1">
                                    {showtime.endTime.slice(11, 16)} 散场
                                  </p>
                                  <p className="text-xs text-cinema-text-muted mt-1">
                                    {hall?.name}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-cinema-text-muted">
                                      {showtime.format}
                                    </span>
                                    <span className="text-lg font-bold text-cinema-gold">
                                      ¥{showtime.price}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="animate-fade-in">
              <div className="text-center py-12">
                <p className="text-cinema-text-secondary">暂无评价，快来抢沙发吧！</p>
              </div>
            </div>
          )}
        </div>

        {relatedMovies.length > 0 && (
          <section className="py-12 border-t border-cinema-border">
            <h2 className="text-2xl font-bold text-cinema-text mb-6">相关推荐</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {relatedMovies.map((m) => (
                <MovieCard key={m.id} movie={m} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
