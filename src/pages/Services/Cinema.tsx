import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  Search,
  Calendar,
  MapPin,
  Clock,
  Ticket,
  Star,
  ChevronRight,
  ChevronLeft,
  Filter,
  X,
  Play,
  Info
} from 'lucide-react';
import { useServiceStore } from '@/stores/useServiceStore';
import type { Movie, CinemaSchedule } from '@/types';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Tag from '@/components/common/Tag';
import Badge from '@/components/common/Badge';
import { cn } from '@/lib/utils';

const cinemas = [
  { id: 'c1', name: '万达影城（惠州华贸店）', address: '惠城区文昌一路9号华贸天地5楼', distance: '2.3km' },
  { id: 'c2', name: 'CGV影城（惠州永旺店）', address: '惠城区东湖西路永旺购物中心3楼', distance: '3.1km' },
  { id: 'c3', name: '中影国际影城（惠州港惠店）', address: '惠城区河南岸港惠新天地4楼', distance: '1.8km' },
  { id: 'c4', name: '横店电影城（惠阳店）', address: '惠阳区淡水镇人民五路万联广场4楼', distance: '12.5km' },
  { id: 'c5', name: '南国影城（惠州河南岸店）', address: '惠城区河南岸南岸路123号', distance: '2.0km' },
  { id: 'c6', name: '中影国际影城（大亚湾店）', address: '大亚湾区西区万达广场4楼', distance: '18.6km' }
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

const dateOptions = [
  { offset: 0, label: '今天' },
  { offset: 1, label: '明天' },
  { offset: 2, label: '后天' }
];

export default function CinemaService() {
  const navigate = useNavigate();
  const { movies, cinemaSchedules, fetchMovies, fetchCinemaSchedules } = useServiceStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedCinema, setSelectedCinema] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'now' | 'soon'>('now');

  useEffect(() => {
    loadData();
  }, [activeTab, selectedDate, selectedMovie?.id]);

  const loadData = async () => {
    setLoading(true);
    await fetchMovies(activeTab === 'now' ? true : undefined);
    if (selectedMovie) {
      const date = new Date();
      date.setDate(date.getDate() + selectedDate);
      await fetchCinemaSchedules(selectedMovie.id, date.toISOString().split('T')[0]);
    }
    setLoading(false);
  };

  const nowShowingMovies = useMemo(() => {
    return movies.filter(m => m.nowShowing).filter(m =>
      searchKeyword ? m.title.includes(searchKeyword) || m.genre.some(g => g.includes(searchKeyword)) : true
    );
  }, [movies, searchKeyword]);

  const upcomingMovies = useMemo(() => {
    return movies.filter(m => !m.nowShowing).filter(m =>
      searchKeyword ? m.title.includes(searchKeyword) || m.genre.some(g => g.includes(searchKeyword)) : true
    );
  }, [movies, searchKeyword]);

  const movieSchedules = useMemo(() => {
    if (!selectedMovie) return [];
    let filtered = cinemaSchedules.filter(s => s.movieId === selectedMovie.id);
    if (selectedCinema) {
      filtered = filtered.filter(s => s.cinemaName.includes(selectedCinema));
    }
    return filtered;
  }, [cinemaSchedules, selectedMovie, selectedCinema]);

  const schedulesByCinema = useMemo(() => {
    const grouped: Record<string, CinemaSchedule[]> = {};
    movieSchedules.forEach(schedule => {
      if (!grouped[schedule.cinemaName]) {
        grouped[schedule.cinemaName] = [];
      }
      grouped[schedule.cinemaName].push(schedule);
    });
    return grouped;
  }, [movieSchedules]);

  const getDateDisplay = (offset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return {
      full: `${date.getMonth() + 1}月${date.getDate()}日`,
      weekday: weekdays[date.getDay()]
    };
  };

  const handleMovieSelect = (movie: Movie) => {
    if (!movie.nowShowing) return;
    setSelectedMovie(selectedMovie?.id === movie.id ? null : movie);
    setSelectedCinema(null);
  };

  const getCinemaInfo = (cinemaName: string) => {
    return cinemas.find(c => cinemaName.includes(c.name.split('（')[0])) || cinemas[0];
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-neutral-50"
    >
      <div className="container pb-20">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pt-6 pb-4"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-2">影院排片</h1>
          <p className="text-neutral-500">最新电影、影院排片、在线选座购票</p>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <form onSubmit={handleSearch} className="flex gap-3">
            <Input
              placeholder="搜索电影名称、类型..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              size="lg"
              prefix={<Search className="w-5 h-5 text-neutral-400" />}
              clearable
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-5 h-5" />
            </Button>
          </form>
        </motion.div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-neutral-700">筛选条件</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCinema(null);
                      setShowFilters(false);
                    }}
                    rightIcon={<X className="w-4 h-4" />}
                  >
                    重置
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-neutral-600 mb-2 block">选择影院</label>
                    <div className="flex flex-wrap gap-2">
                      {cinemas.map(cinema => (
                        <button
                          key={cinema.id}
                          onClick={() => setSelectedCinema(selectedCinema === cinema.name ? null : cinema.name)}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-sm transition-all',
                            selectedCinema === cinema.name
                              ? 'bg-westlake-500 text-white'
                              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                          )}
                        >
                          {cinema.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <Card className="p-0 overflow-hidden">
            <div className="flex border-b border-neutral-100">
              <button
                onClick={() => setActiveTab('now')}
                className={cn(
                  'flex-1 py-4 font-medium text-center transition-colors',
                  activeTab === 'now'
                    ? 'text-westlake-600 border-b-2 border-westlake-500'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                <Film className="w-4 h-4 inline mr-2" />
                正在热映
                <Badge variant="westlake" className="ml-2">{nowShowingMovies.length}</Badge>
              </button>
              <button
                onClick={() => setActiveTab('soon')}
                className={cn(
                  'flex-1 py-4 font-medium text-center transition-colors',
                  activeTab === 'soon'
                    ? 'text-westlake-600 border-b-2 border-westlake-500'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                即将上映
                <Badge variant="chaojing" className="ml-2">{upcomingMovies.length}</Badge>
              </button>
            </div>
          </Card>
        </motion.div>

        {activeTab === 'now' && (
          <>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="mb-6"
            >
              <h2 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
                <Film className="w-5 h-5 text-westlake-500" />
                正在热映
              </h2>
              <div className="relative">
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  <AnimatePresence>
                    {nowShowingMovies.map((movie, index) => (
                      <motion.div
                        key={movie.id}
                        variants={fadeInUp}
                        custom={index}
                        className="flex-shrink-0 w-36 md:w-40"
                      >
                        <Card
                          hover
                          padding={false}
                          onClick={() => handleMovieSelect(movie)}
                          className={cn(
                            'overflow-hidden',
                            selectedMovie?.id === movie.id && 'ring-2 ring-westlake-500'
                          )}
                        >
                          <div className="relative aspect-[2/3] overflow-hidden">
                            <img
                              src={movie.poster}
                              alt={movie.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              {movie.rating}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <h3 className="font-bold text-white text-sm truncate">{movie.title}</h3>
                              <div className="flex items-center gap-2 text-xs text-white/80 mt-1">
                                <Clock className="w-3 h-3" />
                                {movie.duration}
                              </div>
                            </div>
                            <motion.button
                              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                              whileHover={{ scale: 1 }}
                            >
                              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <Play className="w-6 h-6 text-white ml-1" />
                              </div>
                            </motion.button>
                          </div>
                          <div className="p-3">
                            <div className="flex flex-wrap gap-1 mb-2">
                              {movie.genre.slice(0, 3).map(g => (
                                <Tag key={g} size="sm" color="neutral">{g}</Tag>
                              ))}
                            </div>
                            <p className="text-xs text-neutral-500 line-clamp-2">{movie.description}</p>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-neutral-50 to-transparent pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-neutral-50 to-transparent pointer-events-none" />
              </div>
            </motion.div>

            {selectedMovie && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <Card className="mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-westlake-500 to-westlake-600 rounded-xl flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-neutral-800">
                          排片详情 - {selectedMovie.title}
                        </h3>
                        <p className="text-sm text-neutral-500">选择日期查看场次</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedMovie(null)}
                      className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-neutral-400" />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {dateOptions.map((date, index) => {
                      const dateInfo = getDateDisplay(date.offset);
                      return (
                        <motion.button
                          key={index}
                          onClick={() => setSelectedDate(index)}
                          className={cn(
                            'flex-1 py-3 px-4 rounded-xl text-center transition-all',
                            selectedDate === index
                              ? 'bg-gradient-to-r from-westlake-500 to-westlake-600 text-white shadow-lg'
                              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                          )}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="font-bold">{date.label}</div>
                          <div className={cn(
                            'text-xs',
                            selectedDate === index ? 'text-white/80' : 'text-neutral-500'
                          )}>
                            {dateInfo.full} {dateInfo.weekday}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </Card>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-westlake-500" />
                  </div>
                ) : Object.keys(schedulesByCinema).length === 0 ? (
                  <Card className="text-center py-12">
                    <Film className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500">暂无排片信息</p>
                    <p className="text-sm text-neutral-400 mt-1">请选择其他电影或日期</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(schedulesByCinema).map(([cinemaName, schedules]) => {
                      const cinemaInfo = getCinemaInfo(cinemaName);
                      return (
                        <motion.div
                          key={cinemaName}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Card>
                            <div className="flex items-start justify-between mb-4 pb-4 border-b border-neutral-100">
                              <div>
                                <h3 className="font-bold text-neutral-800 flex items-center gap-2">
                                  {cinemaName}
                                  <Badge variant="neutral">{schedules.length}场</Badge>
                                </h3>
                                <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {cinemaInfo.address}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <ChevronRight className="w-4 h-4" />
                                    {cinemaInfo.distance}
                                  </span>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" rightIcon={<Info className="w-4 h-4" />}>
                                详情
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {schedules.map((schedule, idx) => (
                                <motion.div
                                  key={schedule.id}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: idx * 0.05 }}
                                >
                                  <Card
                                    hover
                                    className="text-center"
                                    onClick={() => alert(`即将购票：${selectedMovie.title} ${schedule.time}，¥${schedule.price}`)}
                                  >
                                    <div className="text-xl font-bold text-neutral-800 mb-1">
                                      {schedule.time}
                                    </div>
                                    <div className="text-xs text-neutral-500 mb-2">
                                      {schedule.hall}
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 mb-3">
                                      <span>{schedule.language}</span>
                                      <span>·</span>
                                      <span>余{schedule.seatsAvailable}座</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                      <span className="text-lg font-bold text-westlake-600">¥{schedule.price}</span>
                                      <Button size="sm">
                                        <Ticket className="w-4 h-4" />
                                        选座
                                      </Button>
                                    </div>
                                  </Card>
                                </motion.div>
                              ))}
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}

        {activeTab === 'soon' && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <h2 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-chaojing-500" />
              即将上映
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {upcomingMovies.map((movie, index) => (
                <motion.div
                  key={movie.id}
                  variants={fadeInUp}
                  custom={index}
                >
                  <Card hover padding={false} className="overflow-hidden">
                    <div className="relative aspect-[2/3] overflow-hidden">
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge variant="chaojing">{movie.releaseDate.slice(5)}</Badge>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="font-bold text-white text-sm">{movie.title}</h3>
                        <div className="text-xs text-white/80 mt-1">
                          {movie.duration} · {movie.genre.join('/')}
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-neutral-500 line-clamp-2">{movie.description}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => alert(`《${movie.title}》将于${movie.releaseDate}上映，敬请期待！`)}
                      >
                        想看
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-8"
        >
          <h2 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-honghua-500" />
            惠州影院
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cinemas.map((cinema, index) => (
              <motion.div
                key={cinema.id}
                variants={fadeInUp}
                custom={index}
              >
                <Card hover onClick={() => setSelectedCinema(cinema.name)}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Film className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-800 mb-1">{cinema.name}</h3>
                      <p className="text-sm text-neutral-500 mb-2">{cinema.address}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-neutral-400">{cinema.distance}</span>
                        <span className="text-honghua-600 font-medium">特惠购票</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
