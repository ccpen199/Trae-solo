import { useState, useMemo } from 'react';
import { 
  Filter, 
  Search, 
  ChevronDown, 
  Info, 
  TrendingUp, 
  Star, 
  Calendar, 
  Film,
  User,
  BarChart3,
  Clock,
  MapPin,
  Award,
  X,
  TrendingDown,
  Users
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import MovieCard from '../components/MovieCard';
import ScoreBadge from '../components/ScoreBadge';
import type { Movie } from '../types';

export default function AllMoviesPage() {
  const { movies, setCurrentMovieId, setCurrentPage } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'showing' | 'upcoming'>('all');
  const [sortBy, setSortBy] = useState<'heat' | 'rating' | 'date'>('heat');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    movies.forEach(m => m.genre.forEach(g => genres.add(g)));
    return Array.from(genres);
  }, [movies]);

  const filteredMovies = useMemo(() => {
    let result = [...movies];
    
    if (activeTab !== 'all') {
      result = result.filter(m => m.status === activeTab);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.title.toLowerCase().includes(q) ||
        m.director.toLowerCase().includes(q) ||
        m.cast.some(c => c.toLowerCase().includes(q)) ||
        m.genre.some(g => g.toLowerCase().includes(q))
      );
    }
    
    if (selectedGenres.length > 0) {
      result = result.filter(m => 
        selectedGenres.some(g => m.genre.includes(g))
      );
    }
    
    if (sortBy === 'heat') {
      result.sort((a, b) => b.heatScore - a.heatScore);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'date') {
      result.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
    }
    
    return result;
  }, [movies, activeTab, searchQuery, sortBy, selectedGenres]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setSearchQuery('');
    setSortBy('heat');
    setActiveTab('all');
  };

  const getHeatTrend = (movie: Movie) => {
    if (!movie.heatTrend || movie.heatTrend.length < 2) return { trend: 0, label: '平稳' };
    const recent = movie.heatTrend.slice(-3);
    const avgRecent = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
    const prev = movie.heatTrend.slice(-6, -3);
    const avgPrev = prev.length ? prev.reduce((sum, d) => sum + d.value, 0) / prev.length : avgRecent;
    const change = ((avgRecent - avgPrev) / avgPrev * 100);
    if (change > 15) return { trend: change, label: '飙升', icon: 'up' };
    if (change > 5) return { trend: change, label: '上升', icon: 'up' };
    if (change < -15) return { trend: change, label: '暴跌', icon: 'down' };
    if (change < -5) return { trend: change, label: '下降', icon: 'down' };
    return { trend: change, label: '平稳', icon: 'stable' };
  };

  const getDirectorInfluence = (movie: Movie) => {
    const directorMap: Record<string, number> = {
      '克里斯托弗·诺兰': 98,
      '张艺谋': 95,
      '宁浩': 88,
      '郭帆': 92,
      '乌尔善': 85,
      '陈凯歌': 90,
      '冯小刚': 87,
      '李安': 96,
      '王家卫': 94,
      '周星驰': 97,
    };
    return directorMap[movie.director] || 75;
  };

  return (
    <div className="min-h-screen bg-cinema-bg py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">全部影片</h1>
          <p className="text-cinema-text-secondary">
            {filteredMovies.length} 部影片 · 多源评分融合，为您提供最客观的观影参考
          </p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cinema-text-muted" />
            <input
              type="text"
              placeholder="搜索电影、导演、演员、类型..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-cinema-bg-light border border-cinema-border rounded-xl text-white placeholder-cinema-text-muted focus:outline-none focus:border-cinema-red transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters ? 'bg-cinema-red text-white' : 'bg-cinema-bg-light text-cinema-text-secondary hover:bg-cinema-border'
            }`}
          >
            <Filter className="w-4 h-4" />
            筛选
            {(selectedGenres.length > 0) && (
              <span className="w-5 h-5 rounded-full bg-white text-cinema-bg text-xs flex items-center justify-center font-bold">
                {selectedGenres.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowScoreInfo(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cinema-bg-light border border-cinema-border rounded-lg text-cinema-text-secondary hover:text-white hover:border-cinema-red transition-colors"
          >
            <Info className="w-4 h-4" />
            评分说明
          </button>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-cinema-text-muted text-sm">排序：</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-cinema-bg-light border border-cinema-border rounded-lg px-3 py-2 text-cinema-text-secondary focus:outline-none focus:border-cinema-red"
            >
              <option value="heat">热度最高</option>
              <option value="rating">评分最高</option>
              <option value="date">最新上映</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'showing', 'upcoming'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
                activeTab === tab ? 'bg-cinema-red text-white' : 'bg-cinema-bg-light text-cinema-text-secondary hover:text-white hover:bg-cinema-border'
              }`}
            >
              {tab === 'all' ? '全部' : tab === 'showing' ? '正在热映' : '即将上映'}
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="mb-8 p-6 bg-cinema-bg-light rounded-xl border border-cinema-border animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">类型筛选</h3>
              {selectedGenres.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-cinema-red text-sm hover:underline"
                >
                  清除全部
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {allGenres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    selectedGenres.includes(genre)
                      ? 'bg-cinema-red text-white'
                      : 'bg-cinema-bg text-cinema-text-secondary hover:bg-cinema-border hover:text-white'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        )}

        {filteredMovies.length === 0 ? (
          <div className="text-center py-20">
            <Film className="w-16 h-16 text-cinema-text-muted mx-auto mb-4" />
            <h3 className="text-xl font-bold text-cinema-text mb-2">没有找到影片</h3>
            <p className="text-cinema-text-secondary">尝试调整筛选条件</p>
            <button
              onClick={clearFilters}
              className="mt-4 px-6 py-2 bg-cinema-red text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              重置筛选
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMovies.map((movie) => {
              const heatInfo = getHeatTrend(movie);
              const directorInfluence = getDirectorInfluence(movie);
              return (
                <div 
                  key={movie.id} 
                  className="bg-cinema-bg-light rounded-xl border border-cinema-border overflow-hidden hover:border-cinema-red/50 transition-all group cursor-pointer"
                  onClick={() => setSelectedMovie(movie)}
                >
                  <div className="relative">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full aspect-[3/4] object-cover group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      <ScoreBadge score={movie.rating} />
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        heatInfo.icon === 'up' ? 'bg-green-500/20 text-green-400' :
                        heatInfo.icon === 'down' ? 'bg-red-500/20 text-red-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {heatInfo.icon === 'up' ? <TrendingUp className="w-3 h-3" /> :
                         heatInfo.icon === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
                        {heatInfo.label} {heatInfo.trend > 0 ? '+' : ''}{heatInfo.trend.toFixed(1)}%
                      </div>
                    </div>
                    {movie.status === 'showing' && (
                      <div className="absolute top-3 left-3 px-2 py-1 bg-cinema-red rounded text-xs font-medium text-white">
                        热映中
                      </div>
                    )}
                    {movie.status === 'upcoming' && (
                      <div className="absolute top-3 left-3 px-2 py-1 bg-cinema-gold/20 rounded text-xs font-medium text-cinema-gold">
                        即将上映
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-cinema-red transition-colors">
                      {movie.title}
                    </h3>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 flex flex-wrap gap-1">
                        {movie.genre.slice(0, 3).map((g) => (
                          <span key={g} className="px-2 py-0.5 bg-cinema-bg rounded text-xs text-cinema-text-muted">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-cinema-text-muted">导演影响力</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-cinema-bg rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-cinema-gold to-yellow-400 rounded-full"
                              style={{ width: `${directorInfluence}%` }}
                            />
                          </div>
                          <span className="text-cinema-gold font-medium text-xs">{directorInfluence}%</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-cinema-text-muted">热度指数</span>
                        <span className="text-white font-medium">{movie.heatScore}</span>
                      </div>

                      {movie.ratings.douban && (
                        <div className="flex items-center justify-between">
                          <span className="text-cinema-text-muted flex items-center gap-1">
                            <Star className="w-3 h-3 text-red-500" />豆瓣
                          </span>
                          <span className="text-white font-medium">{movie.ratings.douban}</span>
                        </div>
                      )}
                      
                      {movie.ratings.imdb && (
                        <div className="flex items-center justify-between">
                          <span className="text-cinema-text-muted flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500" />IMDb
                          </span>
                          <span className="text-white font-medium">{movie.ratings.imdb}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-cinema-border">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentMovieId(movie.id);
                          setCurrentPage('movie');
                        }}
                        className="text-cinema-red text-sm font-medium hover:underline"
                      >
                        查看详情
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMovie(movie);
                        }}
                        className="text-cinema-text-secondary text-sm hover:text-white transition-colors"
                      >
                        查看评分详情
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showScoreInfo && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowScoreInfo(false)}>
            <div className="bg-cinema-bg rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">多源评分融合说明</h2>
                <button
                  onClick={() => setShowScoreInfo(false)}
                  className="text-cinema-text-muted hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-cinema-red mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    融合评分计算方式
                  </h3>
                  <p className="text-cinema-text-secondary leading-relaxed">
                    我们采用加权平均算法，综合多个权威评分平台的数据，为您提供最客观的影片评分参考。
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-cinema-bg-light rounded-xl border border-cinema-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">豆瓣评分</span>
                      <span className="text-cinema-red font-bold">权重 35%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-cinema-bg rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: '35%' }} />
                      </div>
                      <span className="text-xs text-cinema-text-muted">国内最具影响力电影社区</span>
                    </div>
                  </div>

                  <div className="p-4 bg-cinema-bg-light rounded-xl border border-cinema-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">IMDb</span>
                      <span className="text-cinema-red font-bold">权重 30%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-cinema-bg rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 rounded-full" style={{ width: '30%' }} />
                      </div>
                      <span className="text-xs text-cinema-text-muted">全球最大电影数据库</span>
                    </div>
                  </div>

                  <div className="p-4 bg-cinema-bg-light rounded-xl border border-cinema-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">猫眼评分</span>
                      <span className="text-cinema-red font-bold">权重 20%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-cinema-bg rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '20%' }} />
                      </div>
                      <span className="text-xs text-cinema-text-muted">国内最大票务平台</span>
                    </div>
                  </div>

                  <div className="p-4 bg-cinema-bg-light rounded-xl border border-cinema-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">烂番茄</span>
                      <span className="text-cinema-red font-bold">权重 15%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-cinema-bg rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: '15%' }} />
                      </div>
                      <span className="text-xs text-cinema-text-muted">专业影评人评价</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-cinema-border">
                  <h3 className="text-lg font-bold text-cinema-gold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    热度趋势计算
                  </h3>
                  <p className="text-cinema-text-secondary leading-relaxed">
                    热度指数综合考虑搜索量、购票量、讨论度、媒体报道等多维度数据，每2小时更新一次，反映影片当前的市场关注度。
                  </p>
                </div>

                <div className="pt-4 border-t border-cinema-border">
                  <h3 className="text-lg font-bold text-cinema-gold mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    主创IP影响力权重
                  </h3>
                  <p className="text-cinema-text-secondary leading-relaxed">
                    导演和演员的IP影响力基于过往作品票房、获奖记录、行业影响力等指标综合计算，为您提供观影决策参考。
                  </p>
                </div>

                <div className="pt-4 border-t border-cinema-border">
                  <h3 className="text-lg font-bold text-cinema-gold mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    票源与退改规则
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-cinema-text-secondary">
                      <span className="text-cinema-gold font-medium">退票政策：</span>开场前2小时可免费退票，24小时内退票收取10%手续费，超过24小时不予退票。
                    </p>
                    <p className="text-cinema-text-secondary">
                      <span className="text-cinema-gold font-medium">转赠规则：</span>本票券仅限本人使用，不可转赠他人。如需转让，请通过官方渠道办理。
                    </p>
                    <p className="text-cinema-text-secondary">
                      <span className="text-cinema-gold font-medium">座位存证：</span>订单完成后，座位信息将通过区块链存证，确保票券真实性和唯一性。
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowScoreInfo(false)}
                  className="w-full py-3 bg-cinema-red text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                >
                  知道了
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedMovie && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedMovie(null)}>
            <div className="bg-cinema-bg rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="relative">
                <img
                  src={selectedMovie.poster}
                  alt={selectedMovie.title}
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cinema-bg to-transparent" />
                <button
                  onClick={() => setSelectedMovie(null)}
                  className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedMovie.title}</h2>
                  {selectedMovie.originalTitle && (
                    <p className="text-cinema-text-secondary">{selectedMovie.originalTitle}</p>
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-cinema-bg-light rounded-xl p-4 text-center">
                    <ScoreBadge score={selectedMovie.rating} size="lg" />
                    <p className="text-cinema-text-muted text-sm mt-2">综合评分</p>
                  </div>
                  {selectedMovie.ratings.douban && (
                    <div className="bg-cinema-bg-light rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-red-400">{selectedMovie.ratings.douban}</p>
                      <p className="text-cinema-text-muted text-sm mt-2">豆瓣</p>
                    </div>
                  )}
                  {selectedMovie.ratings.imdb && (
                    <div className="bg-cinema-bg-light rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-yellow-400">{selectedMovie.ratings.imdb}</p>
                      <p className="text-cinema-text-muted text-sm mt-2">IMDb</p>
                    </div>
                  )}
                  {selectedMovie.ratings.maoyan && (
                    <div className="bg-cinema-bg-light rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-green-400">{selectedMovie.ratings.maoyan}</p>
                      <p className="text-cinema-text-muted text-sm mt-2">猫眼</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedMovie.genre.map((g) => (
                    <span key={g} className="px-3 py-1 bg-cinema-bg rounded-full text-sm text-cinema-text-muted">
                      {g}
                    </span>
                  ))}
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-cinema-gold mt-0.5" />
                    <div>
                      <p className="text-cinema-text-muted text-sm">导演</p>
                      <p className="text-white font-medium">{selectedMovie.director}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-cinema-gold mt-0.5" />
                    <div>
                      <p className="text-cinema-text-muted text-sm">主演</p>
                      <p className="text-white">{selectedMovie.cast.join(' / ')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-cinema-gold mt-0.5" />
                    <div>
                      <p className="text-cinema-text-muted text-sm">上映日期</p>
                      <p className="text-white">{selectedMovie.releaseDate}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-cinema-gold mt-0.5" />
                    <div>
                      <p className="text-cinema-text-muted text-sm">片长</p>
                      <p className="text-white">{selectedMovie.duration}分钟</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-cinema-gold mt-0.5" />
                    <div>
                      <p className="text-cinema-text-muted text-sm">地区 / 语言</p>
                      <p className="text-white">{selectedMovie.region} / {selectedMovie.language}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-cinema-bg-light rounded-xl p-4 mb-6">
                  <h4 className="font-bold text-white mb-2">影片简介</h4>
                  <p className="text-cinema-text-secondary leading-relaxed">{selectedMovie.synopsis}</p>
                </div>

                <div className="bg-cinema-bg-light rounded-xl p-4 mb-6">
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cinema-gold" />
                    热度趋势
                  </h4>
                  {selectedMovie.heatTrend && selectedMovie.heatTrend.length > 0 ? (
                    <div className="flex items-end gap-1 h-20">
                      {selectedMovie.heatTrend.map((item, index) => (
                        <div
                          key={index}
                          className="flex-1 bg-gradient-to-t from-cinema-red to-cinema-gold rounded-t transition-all hover:opacity-80"
                          style={{ height: `${(item.value / 100) * 100}%` }}
                          title={`${item.date}: ${item.value}`}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-cinema-text-muted text-sm">暂无趋势数据</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setCurrentMovieId(selectedMovie.id);
                      setCurrentPage('movie');
                      setSelectedMovie(null);
                    }}
                    className="flex-1 py-3 bg-cinema-red text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                  >
                    购票观影
                  </button>
                  <button
                    onClick={() => setSelectedMovie(null)}
                    className="px-6 py-3 bg-cinema-bg-light text-cinema-text-secondary rounded-xl hover:bg-cinema-border hover:text-white transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
