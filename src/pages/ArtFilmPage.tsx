import { useState } from 'react';
import { 
  Palette, 
  Award, 
  Calendar, 
  Clock,
  Globe,
  User,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import MovieCard from '../components/MovieCard';
import ScoreBadge from '../components/ScoreBadge';

export default function ArtFilmPage() {
  const { movies, setCurrentMovieId, setCurrentPage } = useAppStore();
  const [activeEra, setActiveEra] = useState('全部');

  const artMovies = movies.filter(m => 
    m.tags.some(t => ['经典修复', '侯孝贤', '王家卫', '金狮奖', '戛纳影帝', '艺术电影'].includes(t)) ||
    ['悲情城市', '花样年华'].includes(m.title)
  );

  const eras = ['全部', '60年代', '70年代', '80年代', '90年代', '00年代', '10年代', '20年代'];

  const featuredMovie = artMovies[0];

  const filmFestivals = [
    { name: '戛纳电影节', year: '2024', winners: ['悲情城市', '花样年华'] },
    { name: '威尼斯电影节', year: '2024', winners: ['悲情城市'] },
    { name: '柏林电影节', year: '2024', winners: ['花样年华'] },
  ];

  const directors = [
    { name: '王家卫', films: 10, style: '诗意美学', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=director%20wong%20kar%20wai%20portrait%20artistic&image_size=square' },
    { name: '侯孝贤', films: 12, style: '长镜头美学', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=director%20hou%20hsiao%20hsien%20portrait%20vintage&image_size=square' },
    { name: '杨德昌', films: 8, style: '都市观察', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=director%20edward%20yang%20portrait%20intellectual&image_size=square' },
    { name: '蔡明亮', films: 9, style: '慢电影', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=director%20tsai%20ming%20liang%20portrait%20avant%20garde&image_size=square' },
  ];

  return (
    <div className="min-h-screen">
      <div className="relative h-[400px] overflow-hidden">
        <img
          src={featuredMovie?.backdrop || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20film%20cinema%20projector%20light%20beam%20artistic&image_size=landscape_16_9'}
          alt="艺术电影"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-bg via-cinema-bg/70 to-transparent" />
        
        <div className="absolute inset-0 max-w-7xl mx-auto px-4 flex items-end pb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-cinema-gold/20 rounded-xl">
                <Palette className="w-8 h-8 text-cinema-gold" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white text-shadow-glow-gold">艺术电影频道</h1>
                <p className="text-cinema-text-secondary mt-1">
                  感受电影艺术的永恒魅力
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {featuredMovie && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Award className="w-5 h-5 text-cinema-gold" />
              <h2 className="text-xl font-bold text-cinema-text">本周推荐</h2>
            </div>
            
            <div 
              className="bg-gradient-to-br from-cinema-bg-light to-cinema-bg rounded-2xl border border-cinema-gold/30 overflow-hidden cursor-pointer card-hover"
              onClick={() => {
                setCurrentMovieId(featuredMovie.id);
                setCurrentPage('movie');
              }}
            >
              <div className="flex flex-col md:flex-row">
                <div className="md:w-96 flex-shrink-0">
                  <img
                    src={featuredMovie.poster}
                    alt={featuredMovie.title}
                    className="w-full h-96 object-cover"
                  />
                </div>
                <div className="flex-1 p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <ScoreBadge score={featuredMovie.rating} size="lg" />
                    <div className="px-3 py-1 bg-cinema-gold/20 text-cinema-gold rounded-full text-sm">
                      经典修复
                    </div>
                  </div>
                  
                  <h3 className="text-3xl font-bold text-cinema-text mb-2">
                    {featuredMovie.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-4 mb-6 text-cinema-text-secondary">
                    <div className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      <span>{featuredMovie.region}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{featuredMovie.releaseDate}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{featuredMovie.duration}分钟</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{featuredMovie.director}</span>
                    </div>
                  </div>

                  <p className="text-cinema-text-secondary leading-relaxed mb-6">
                    {featuredMovie.synopsis}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {featuredMovie.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-cinema-gold/10 text-cinema-gold rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <button className="btn-gold flex items-center gap-2">
                    立即观看
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-cinema-text">年代筛选</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-4">
            {eras.map((era) => (
              <button
                key={era}
                onClick={() => setActiveEra(era)}
                className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                  activeEra === era
                    ? 'bg-cinema-gold text-white'
                    : 'bg-cinema-bg-light text-cinema-text-secondary hover:text-cinema-text hover:bg-cinema-border'
                }`}
              >
                {era}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-xl font-bold text-cinema-text mb-6">馆藏经典</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {artMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-xl font-bold text-cinema-text mb-6">电影大师</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {directors.map((director, index) => (
              <div
                key={index}
                className="bg-cinema-bg-light rounded-xl border border-cinema-border p-6 text-center card-hover cursor-pointer"
              >
                <img
                  src={director.avatar}
                  alt={director.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-2 border-cinema-gold/50"
                />
                <h3 className="font-bold text-cinema-text mb-1">{director.name}</h3>
                <p className="text-sm text-cinema-gold mb-2">{director.style}</p>
                <p className="text-xs text-cinema-text-muted">{director.films} 部作品</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-xl font-bold text-cinema-text mb-6">电影节展</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {filmFestivals.map((festival, index) => (
              <div
                key={index}
                className="bg-cinema-bg-light rounded-xl border border-cinema-border p-6 card-hover cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <Award className="w-8 h-8 text-cinema-gold" />
                  <span className="text-cinema-text-muted text-sm">{festival.year}</span>
                </div>
                <h3 className="text-xl font-bold text-cinema-text mb-4">{festival.name}</h3>
                <div className="space-y-2">
                  {festival.winners.map((winner, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm text-cinema-text-secondary hover:text-cinema-gold transition-colors"
                    >
                      <span className="w-5 h-5 bg-cinema-gold/20 rounded-full flex items-center justify-center text-xs text-cinema-gold">
                        {i + 1}
                      </span>
                      {winner}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-cinema-gold/20 via-cinema-gold/10 to-transparent rounded-2xl p-8 text-center">
          <Palette className="w-12 h-12 text-cinema-gold mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-cinema-text mb-2">加入艺术电影会员</h3>
          <p className="text-cinema-text-secondary mb-6 max-w-md mx-auto">
            解锁海量经典艺术电影，参与线下影展，与同好交流
          </p>
          <button className="btn-gold py-3 px-8 text-lg">
            ¥99/年 立即开通
          </button>
        </div>
      </div>
    </div>
  );
}
