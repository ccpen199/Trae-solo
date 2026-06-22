import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Phone,
  ClipboardList,
  TrendingUp,
  Users,
  Clock,
  FileCheck,
  MapPin,
  Play,
} from 'lucide-react';
import EmergencyBanner from '@/components/EmergencyBanner';
import ServiceGrid from '@/components/ServiceGrid';
import NewsCard, { type NewsItem } from '@/components/NewsCard';
import AlertLevelChip from '@/components/AlertLevelChip';
import { normalizeNewsItem, unwrapApiData } from '@/lib/api';

const mockNews: NewsItem[] = [
  {
    id: '1',
    title: '盐城市召开民生服务工作推进会 部署下半年重点任务',
    summary: '会议强调要以群众需求为导向，加快推进融媒体民生云平台建设，提升政务服务效能。',
    cover: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800',
    category: '政务要闻',
    publishTime: '2025-06-20',
    views: 3582,
    featured: true,
  },
  {
    id: '2',
    title: '暴雨天气防范指南：这些事项请市民注意',
    summary: '近期我市进入主汛期，强降雨天气频发，市应急管理局发布安全提示。',
    cover: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600',
    category: '应急预警',
    publishTime: '2025-06-20',
    views: 2145,
  },
  {
    id: '3',
    title: '社保待遇领取资格认证"刷脸"即可完成',
    summary: '我市全面推行社保待遇领取资格"人脸识别"认证，退休人员足不出户即可办理。',
    cover: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600',
    category: '便民提示',
    publishTime: '2025-06-19',
    views: 1876,
  },
  {
    id: '4',
    title: '2025年城乡居民医保缴费即将开始',
    summary: '缴费标准、缴费方式、参保范围等关键信息已公布，请市民及时办理。',
    cover: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600',
    category: '民生政策',
    publishTime: '2025-06-19',
    views: 4521,
  },
  {
    id: '5',
    title: '盐城高新区新建3个社区卫生服务站',
    summary: '进一步完善基层医疗卫生服务体系，为居民提供更便捷的健康服务。',
    category: '民生动态',
    publishTime: '2025-06-18',
    views: 986,
  },
  {
    id: '6',
    title: '高温天气下劳动者权益保护提示',
    category: '政策解读',
    publishTime: '2025-06-18',
    views: 1234,
  },
];

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>(mockNews);
  const [stats, setStats] = useState({
    total: 128650,
    today: 856,
    completed: 96.8,
    satisfaction: 98.5,
  });

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/news?limit=6');
        if (res.ok) {
          const payload = await res.json() as any;
          const list = unwrapApiData<{ list?: any[] }>(payload)?.list;
          if (Array.isArray(list) && list.length > 0) {
            setNews(list.slice(0, 6).map((item, index) => normalizeNewsItem(item, index)));
          }
        }
      } catch {
        /* use mock */
      }
    };
    fetchNews();
  }, []);

  const featuredNews = news.find((n) => n.featured) || news[0];
  const otherNews = news.filter((n) => n.id !== featuredNews.id).slice(0, 5);

  return (
    <div>
      <EmergencyBanner />

      <section className="relative overflow-hidden bg-gradient-to-br from-gov-600 via-gov-700 to-gov-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-warm-400 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-10 md:py-16 relative">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-sm mb-4">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                系统运行正常
              </div>
              <h1 className="font-serif text-3xl md:text-5xl font-bold leading-tight mb-4">
                盐城民生云平台
                <br />
                <span className="text-warm-300">让服务触手可及</span>
              </h1>
              <p className="text-white/80 text-base md:text-lg mb-6 leading-relaxed">
                盐城市级融媒体民生服务一体化平台，整合政务服务、生活服务、应急预警等功能，为市民提供一站式便捷服务。
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/services"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-warm-400 to-warm-500 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  进入服务大厅
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/workorders/submit"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-white font-semibold hover:bg-white/20 transition-all"
                >
                  <ClipboardList className="w-5 h-5" />
                  提交诉求
                </Link>
              </div>
            </div>

            <div className="relative hidden md:block animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl group cursor-pointer">
                <img
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1000"
                  alt="平台宣传片"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 text-gov-600 ml-1" fill="currentColor" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="font-semibold text-lg">平台宣传视频</p>
                  <p className="text-sm text-white/70">带您了解平台各项便民功能</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {[
              { label: '累计服务人次', value: stats.total.toLocaleString(), icon: Users },
              { label: '今日服务', value: stats.today.toString(), icon: TrendingUp },
              { label: '按时办结率', value: `${stats.completed}%`, icon: FileCheck },
              { label: '群众满意度', value: `${stats.satisfaction}%`, icon: Clock },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-all animate-fade-in-up"
                  style={{ animationDelay: `${idx * 100 + 300}ms` }}
                >
                  <Icon className="w-5 h-5 text-warm-300 mb-2" />
                  <p className="text-2xl md:text-3xl font-bold">{item.value}</p>
                  <p className="text-sm text-white/70 mt-1">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 -mt-6 relative z-10">
        <div className="card p-5 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="section-title">便民服务</h2>
              <p className="section-subtitle mb-0">高频事项一键办理</p>
            </div>
            <Link to="/services" className="text-sm text-gov-600 hover:text-gov-700 font-medium flex items-center gap-1">
              全部服务 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <ServiceGrid columns={6} />
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="section-title">新闻资讯</h2>
                <p className="section-subtitle mb-0">了解最新政策动态</p>
              </div>
              <Link to="/news" className="text-sm text-gov-600 hover:text-gov-700 font-medium flex items-center gap-1">
                查看更多 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <NewsCard news={featuredNews} variant="horizontal" className="mb-6" />

            <div className="card p-4 md:p-5">
              {otherNews.map((item) => (
                <NewsCard key={item.id} news={item} variant="compact" />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-bold text-gov-800">预警通知</h3>
                <Link to="/emergency" className="text-sm text-gov-600 hover:text-gov-700">
                  全部
                </Link>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertLevelChip level="red" size="sm" />
                    <span className="font-semibold text-sm text-gray-800">暴雨红色预警</span>
                  </div>
                  <p className="text-xs text-gray-500">预计未来3小时强降水，请注意防范</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertLevelChip level="orange" size="sm" />
                    <span className="font-semibold text-sm text-gray-800">高温橙色预警</span>
                  </div>
                  <p className="text-xs text-gray-500">今日最高气温可达38度，注意防暑</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertLevelChip level="blue" size="sm" />
                    <span className="font-semibold text-sm text-gray-800">大风蓝色预警</span>
                  </div>
                  <p className="text-xs text-gray-500">沿海地区阵风可达8-9级</p>
                </div>
              </div>
            </div>

            <div className="card p-5 bg-gradient-to-br from-gov-500 to-gov-700 text-white">
              <h3 className="font-serif text-lg font-bold mb-3">服务热线</h3>
              <div className="space-y-3">
                <a
                  href="tel:12345"
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-2xl text-warm-300">12345</p>
                    <p className="text-xs text-white/70">政务服务热线</p>
                  </div>
                </a>
                <a
                  href="tel:120"
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-red-500/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-2xl">120</p>
                    <p className="text-xs text-white/70">医疗急救</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-bold text-gov-800">服务网点</h3>
                <Link to="/map" className="text-sm text-gov-600 hover:text-gov-700">
                  地图
                </Link>
              </div>
              <div className="space-y-3">
                {[
                  { name: '亭湖区政务服务中心', addr: '青年中路28号', dist: '1.2km' },
                  { name: '盐都区行政审批局', addr: '新都路618号', dist: '3.5km' },
                  { name: '城南新区便民中心', addr: '人民南路38号', dist: '4.8km' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-gov-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-gov-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{item.addr}</p>
                    </div>
                    <span className="text-xs text-warm-600 font-medium">{item.dist}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
