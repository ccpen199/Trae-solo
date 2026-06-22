import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Calendar, ChevronRight, Newspaper } from 'lucide-react';
import NewsCard, { type NewsItem } from '@/components/NewsCard';
import { normalizeNewsItem, toNewsApiCategory, unwrapApiData } from '@/lib/api';

const categories = ['全部', '政务要闻', '民生政策', '应急预警', '便民提示', '政策解读', '民生动态'];

const mockNews: NewsItem[] = Array.from({ length: 12 }, (_, i) => ({
  id: `${i + 1}`,
  title: [
    '盐城市召开民生服务工作推进会 部署下半年重点任务',
    '关于开展2025年度城乡居民医疗保险参保缴费工作的通知',
    '暴雨天气安全防范指南：这些事项请市民务必注意',
    '我市全面推行"一件事一次办"改革 让群众少跑腿',
    '社保待遇领取资格认证"刷脸"即可完成 操作指南来了',
    '高温天气劳动者权益保护政策解读',
    '盐城高新区新建3个社区卫生服务站 本月底投入使用',
    '关于优化营商环境若干措施的政策解读',
    '我市开通政务服务"跨省通办" 覆盖100+高频事项',
    '养老服务升级：我市新增社区日间照料中心15家',
    '不动产登记实现"全城通办" 办理时限压缩至1个工作日',
    '2025年秋季中小学招生政策发布',
  ][i],
  summary: [
    '会议强调要以群众需求为导向，加快推进融媒体民生云平台建设，持续提升政务服务效能和群众满意度。',
    '缴费标准为每人每年380元，财政补助不低于每人每年640元，缴费时间为即日起至2025年12月31日。',
    '近期我市进入主汛期，强降雨天气频发，市应急管理局联合多部门发布安全防范提示。',
    '聚焦企业和群众"办成一件事"，梳理公布"一件事一次办"事项清单200项。',
    '退休人员可通过"盐城民生"APP、微信公众号等渠道足不出户完成认证。',
    '用人单位应当在高温天气期间，根据生产特点和具体条件，合理安排工作时间。',
    '进一步完善基层医疗卫生服务体系，为居民提供更便捷的基本医疗和公共卫生服务。',
    '从市场准入、要素保障、政务服务等方面提出30条具体措施。',
    '实现与长三角、淮海经济区等地区政务服务事项"跨省通办"。',
    '为老年人提供生活照料、康复护理、助餐助行等多样化服务。',
    '申请人可在全市范围内任意不动产登记机构申请办理不动产登记业务。',
    '明确招生范围、报名条件、录取办法等具体事项。',
  ][i],
  cover: i % 3 === 0
    ? `https://picsum.photos/seed/news${i}/800/500`
    : undefined,
  category: categories[(i % (categories.length - 1)) + 1],
  publishTime: `2025-06-${(20 - Math.floor(i / 2)).toString().padStart(2, '0')}`,
  views: Math.floor(Math.random() * 5000) + 500,
  featured: i === 0,
}));

export default function NewsList() {
  const [news, setNews] = useState<NewsItem[]>(mockNews);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('全部');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page) });
        const apiCategory = toNewsApiCategory(activeCategory);
        if (apiCategory) {
          params.set('category', apiCategory);
        }
        if (keyword) {
          params.set('search', keyword);
        }

        const res = await fetch(`/api/news?${params.toString()}`);
        if (res.ok) {
          const payload = await res.json() as any;
          const list = unwrapApiData<{ list?: any[] }>(payload)?.list;
          if (Array.isArray(list) && list.length > 0) {
            setNews(list.map((item, index) => normalizeNewsItem(item, index)));
          }
        }
      } catch {
        /* use mock */
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };
    fetchNews();
  }, [activeCategory, keyword, page]);

  const filteredNews = news.filter((n) => {
    if (activeCategory !== '全部' && n.category !== activeCategory) return false;
    if (keyword && !n.title.includes(keyword) && !n.summary.includes(keyword)) return false;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-gov-600 transition-colors">首页</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-800 font-medium">新闻资讯</span>
      </nav>

      <div className="mb-8">
        <h1 className="section-title flex items-center gap-3">
          <Newspaper className="w-8 h-8 text-gov-600" />
          新闻资讯
        </h1>
        <p className="section-subtitle">及时了解政务动态、民生政策和便民服务信息</p>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索新闻标题或内容..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-gov-400 focus:ring-2 focus:ring-gov-100 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={
                    activeCategory === cat
                      ? 'px-3.5 py-1.5 rounded-lg bg-gov-500 text-white text-sm font-medium transition-all'
                      : 'px-3.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 transition-all'
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-44 bg-gray-100" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded w-5/6" />
                <div className="flex justify-between pt-2">
                  <div className="h-3 bg-gray-100 rounded w-20" />
                  <div className="h-3 bg-gray-100 rounded w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="text-center py-20">
          <Newspaper className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">暂无相关新闻</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((item, idx) => (
            <div key={item.id} style={{ animationDelay: `${idx * 80}ms` }} className="animate-fade-in-up">
              <NewsCard news={item} />
            </div>
          ))}
        </div>
      )}

      {filteredNews.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50 transition-all"
          >
            上一页
          </button>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={
                page === n
                  ? 'w-9 h-9 rounded-lg bg-gov-500 text-white text-sm font-medium'
                  : 'w-9 h-9 rounded-lg text-gray-600 text-sm hover:bg-gray-100 transition-all'
              }
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-all"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
