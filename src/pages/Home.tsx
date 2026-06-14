import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Upload,
  TrendingUp,
  MapPin,
  Users,
  Award,
  LayoutGrid,
  ChevronRight,
  Sparkles,
  FileText,
  ArrowRight,
  Camera,
  Building2,
  Home as HomeIcon,
} from 'lucide-react';
import CaseCard from '@/components/CaseCard';
import { mockCases } from '@/mock/data';

const hotCities = [
  { name: '北京', count: 12580, color: 'from-red-400 to-rose-500' },
  { name: '上海', count: 15320, color: 'from-blue-400 to-indigo-500' },
  { name: '广州', count: 9860, color: 'from-emerald-400 to-teal-500' },
  { name: '深圳', count: 11240, color: 'from-cyan-400 to-sky-500' },
  { name: '杭州', count: 8650, color: 'from-green-400 to-emerald-500' },
  { name: '成都', count: 7890, color: 'from-orange-400 to-amber-500' },
  { name: '武汉', count: 6540, color: 'from-violet-400 to-purple-500' },
  { name: '南京', count: 5870, color: 'from-pink-400 to-fuchsia-500' },
  { name: '西安', count: 5230, color: 'from-amber-400 to-yellow-500' },
  { name: '重庆', count: 6120, color: 'from-rose-400 to-red-500' },
  { name: '苏州', count: 4780, color: 'from-teal-400 to-cyan-500' },
  { name: '天津', count: 4320, color: 'from-indigo-400 to-blue-500' },
];

const stats = [
  { label: '真实案例', value: 10000000, suffix: '+', icon: FileText, color: 'from-teal-500 to-cyan-600' },
  { label: '覆盖城市', value: 300, suffix: '+', icon: MapPin, color: 'from-orange-500 to-amber-600' },
  { label: '认证设计师', value: 100000, suffix: '+', icon: Users, color: 'from-violet-500 to-indigo-600' },
  { label: '平均质量评分', value: 4.85, suffix: '', icon: Award, color: 'from-rose-500 to-pink-600', isDecimal: true },
];

function useCountUp(target: number, duration = 2000, _isDecimal = false) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(target * easeOut);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [isVisible, target, duration]);

  return { count, ref };
}

function StatCard({ stat, delay }: { stat: typeof stats[0]; delay: number }) {
  const { count, ref } = useCountUp(stat.value, 2000, stat.isDecimal);
  const Icon = stat.icon;

  const formatNumber = (num: number) => {
    if (stat.isDecimal) {
      return num.toFixed(2);
    }
    if (num >= 10000) {
      return Math.floor(num / 10000) + '万';
    }
    return Math.floor(num).toLocaleString();
  };

  return (
    <div
      ref={ref}
      className="relative p-6 bg-white rounded-2xl shadow-lg border border-gray-100 dark:bg-slate-800 dark:border-slate-700 overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${stat.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-md`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1 font-heading">
        {formatNumber(count)}{stat.suffix}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');

  const featuredCases = mockCases.slice(0, 6);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/cases?keyword=${encodeURIComponent(searchKeyword)}`);
  };

  const handleCityClick = (city: string) => {
    navigate(`/cases?city=${encodeURIComponent(city)}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-600/20 via-transparent to-transparent" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-300/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 container text-center px-4 pt-20 pb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8 animate-fade-in-down">
            <Sparkles className="w-4 h-4 text-teal-300" />
            <span className="text-sm text-teal-100">全国装修案例数据平台</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in-up font-heading">
            真实施工数据，
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-teal-200 via-cyan-200 to-teal-300 bg-clip-text text-transparent">
              让装修决策有据可依
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-teal-100/80 max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            汇聚千万级真实装修案例，覆盖全国300+城市，让你找到最适合自己家的设计方案与预算参考
          </p>

          <form onSubmit={handleSearch} className="max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="relative flex items-center bg-white rounded-2xl shadow-2xl p-2 gap-2">
              <div className="flex items-center flex-1 gap-3 px-4">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="搜索城市、小区、风格、户型..."
                  className="flex-1 py-3 text-gray-800 placeholder-gray-400 bg-transparent border-none outline-none text-base"
                />
              </div>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-primary to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Search className="w-5 h-5" />
                <span className="hidden sm:inline">搜索案例</span>
              </button>
            </div>
          </form>

          <div className="mt-8 flex flex-wrap justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <button
              onClick={() => navigate('/cases')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 font-medium"
            >
              <Upload className="w-5 h-5" />
              <span>上传户型图找相似</span>
            </button>
            <button
              onClick={() => navigate('/cases')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl hover:bg-accent-600 transition-all duration-300 font-medium shadow-lg"
            >
              <LayoutGrid className="w-5 h-5" />
              <span>浏览全部案例</span>
            </button>
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 text-teal-100/60 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              <span className="text-sm">验收照片100万+</span>
            </div>
            <div className="w-px h-4 bg-teal-100/20" />
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span className="text-sm">建材数据10万+</span>
            </div>
            <div className="w-px h-4 bg-teal-100/20" />
            <div className="flex items-center gap-2">
              <HomeIcon className="w-4 h-4" />
              <span className="text-sm">户型匹配AI智能</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight className="w-6 h-6 text-white/50 rotate-90" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 font-heading">平台数据</h2>
            <p className="text-gray-500 dark:text-gray-400">用真实数据说话，让装修不再盲目</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <StatCard key={stat.label} stat={stat} delay={idx * 100} />
            ))}
          </div>
        </div>
      </section>

      {/* Hot Cities Section */}
      <section className="py-20 bg-white dark:bg-slate-800">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 font-heading">热门城市</h2>
              <p className="text-gray-500 dark:text-gray-400">选择你所在的城市，查看本地真实装修案例</p>
            </div>
            <button
              onClick={() => navigate('/cases')}
              className="hidden sm:inline-flex items-center gap-1 text-primary hover:text-primary-600 font-medium transition-colors"
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {hotCities.map((city) => (
              <button
                key={city.name}
                onClick={() => handleCityClick(city.name)}
                className="group relative p-5 bg-gray-50 dark:bg-slate-700/50 rounded-xl hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${city.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="font-semibold text-gray-900 dark:text-white mb-1">{city.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-primary">{city.count.toLocaleString()}</span> 案例
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Cases Section */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 font-heading">精选案例</h2>
              <p className="text-gray-500 dark:text-gray-400">高评分真实装修案例，给你灵感与参考</p>
            </div>
            <button
              onClick={() => navigate('/cases')}
              className="hidden sm:inline-flex items-center gap-1 text-primary hover:text-primary-600 font-medium transition-colors"
            >
              查看更多
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCases.map((caseItem, idx) => (
              <div
                key={caseItem.id}
                style={{ animationDelay: `${idx * 100}ms` }}
                className="animate-fade-in-up"
              >
                <CaseCard caseData={caseItem} />
              </div>
            ))}
          </div>
          <div className="mt-10 text-center sm:hidden">
            <button
              onClick={() => navigate('/cases')}
              className="btn-primary inline-flex items-center gap-2"
            >
              查看更多案例
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Floorplan Match CTA Section */}
      <section className="py-20 bg-white dark:bg-slate-800">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-teal-700 to-slate-800 p-8 sm:p-12 lg:p-16">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-cyan-400/20 via-transparent to-transparent" />
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl" />

            <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
                  <TrendingUp className="w-4 h-4 text-teal-300" />
                  <span className="text-sm text-teal-100">AI 智能户型匹配</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-heading leading-tight">
                  上传户型图，一键匹配
                  <br />
                  <span className="text-teal-200">相似真实装修案例</span>
                </h2>
                <p className="text-teal-100/80 text-lg mb-8 max-w-lg">
                  AI 智能识别户型结构，从千万级案例库中为你匹配最相似的装修方案，预算、风格、建材一目了然
                </p>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => navigate('/cases')}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white font-medium rounded-xl hover:bg-accent-600 transition-all duration-300 shadow-lg hover:shadow-xl text-lg"
                  >
                    <Upload className="w-5 h-5" />
                    上传户型图
                  </button>
                  <button
                    onClick={() => navigate('/cases')}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-medium rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 text-lg"
                  >
                    了解更多
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-400/20 to-cyan-400/20 rounded-2xl blur-2xl" />
                  <div className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/10 rounded-xl p-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mb-3">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-white font-semibold">户型识别</div>
                        <div className="text-teal-100/70 text-sm">AI 自动识别户型结构</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center mb-3">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-white font-semibold">智能匹配</div>
                        <div className="text-teal-100/70 text-sm">相似度算法精准推荐</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center mb-3">
                          <Award className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-white font-semibold">质量评分</div>
                        <div className="text-teal-100/70 text-sm">真实验收质量数据</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-3">
                          <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-white font-semibold">本地案例</div>
                        <div className="text-teal-100/70 text-sm">同城同小区真实案例</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
