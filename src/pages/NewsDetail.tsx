import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, Eye, Share2, ChevronLeft, ChevronRight, Newspaper, ArrowLeft } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';
import NewsCard, { type NewsItem } from '@/components/NewsCard';
import { normalizeNewsItem, toRichTextHtml, unwrapApiData } from '@/lib/api';

interface NewsDetailData {
  id: string;
  title: string;
  category: string;
  publishTime: string;
  source: string;
  views: number;
  author: string;
  cover?: string;
  videoUrl?: string;
  content: string;
  tags: string[];
  related: NewsItem[];
}

const mockDetail: NewsDetailData = {
  id: '1',
  title: '盐城市召开民生服务工作推进会 部署下半年重点任务',
  category: '政务要闻',
  publishTime: '2025-06-20 09:30',
  source: '盐城市人民政府',
  views: 3582,
  author: '融媒体中心',
  cover: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200',
  content: `
    <p>6月20日上午，盐城市召开全市民生服务工作推进会，深入贯彻落实省委、省政府关于保障和改善民生的部署要求，总结上半年工作，分析当前形势，部署下半年重点任务。市委副书记、市长出席会议并讲话。</p>
    <h2>会议指出</h2>
    <p>今年以来，全市上下坚持以人民为中心的发展思想，聚焦群众"急难愁盼"问题，扎实推进民生各项工作，取得了阶段性成效。民生支出占一般公共预算支出比重持续提高，就业形势总体稳定，社会保障体系不断完善，教育、医疗、养老等公共服务水平稳步提升。</p>
    <h2>会议强调</h2>
    <p>要加快推进融媒体民生云平台建设，整合政务服务、生活服务、应急预警等功能，打造"一站式"便民服务入口。要深化"一件事一次办"改革，梳理公布高频事项清单，推动更多服务事项"掌上办""就近办"。</p>
    <blockquote>"民生工作无小事，一枝一叶总关情。"要始终把群众的安危冷暖放在心上，用心用情用力解决好群众的操心事、烦心事、揪心事。</blockquote>
    <h2>会议要求</h2>
    <ul>
      <li>要压实工作责任，各部门主要负责同志要亲自抓、负总责，确保各项民生任务落地见效。</li>
      <li>要强化督查考核，建立民生实事项目动态跟踪机制，定期通报进展情况。</li>
      <li>要广泛宣传引导，充分利用融媒体平台，及时发布民生政策信息，提高群众知晓率和参与度。</li>
      <li>要注重总结提升，及时推广好经验好做法，推动民生工作再上新台阶。</li>
    </ul>
    <p>会议还对暑期安全生产、防汛抗旱、防暑降温等工作进行了部署安排。</p>
  `,
  tags: ['民生服务', '政务会议', '工作部署'],
  related: [
    { id: '2', title: '关于开展2025年度城乡居民医疗保险参保缴费工作的通知', summary: '缴费标准为每人每年380元，财政补助不低于每人每年640元', category: '民生政策', publishTime: '2025-06-20', views: 4521 },
    { id: '3', title: '我市全面推行"一件事一次办"改革 让群众少跑腿', summary: '聚焦企业和群众"办成一件事"，梳理公布事项清单200项', category: '政务要闻', publishTime: '2025-06-19', views: 2145 },
    { id: '4', title: '社保待遇领取资格认证"刷脸"即可完成', summary: '退休人员可通过APP、微信公众号等渠道足不出户完成认证', category: '便民提示', publishTime: '2025-06-19', views: 1876 },
  ],
};

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<NewsDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/news/${id}`);
        if (res.ok) {
          const payload = await res.json() as any;
          const article = unwrapApiData<any>(payload);
          if (article) {
            setDetail({
              id: article.id ?? mockDetail.id,
              title: article.title ?? mockDetail.title,
              category: normalizeNewsItem(article).category,
              publishTime: article.publishTime ?? mockDetail.publishTime,
              source: article.source || '盐城发布',
              views: Number(article.views ?? 0),
              author: '融媒体中心',
              cover: article.coverImage,
              videoUrl: article.videoUrl,
              content: toRichTextHtml(article.content || article.summary),
              tags: Array.isArray(article.tags) ? article.tags : [],
              related: mockDetail.related,
            });
            return;
          }
        }
        setDetail(mockDetail);
      } catch {
        setDetail(mockDetail);
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card p-8 max-w-4xl mx-auto animate-pulse">
          <div className="h-6 bg-gray-100 rounded w-3/4 mb-4" />
          <div className="h-4 bg-gray-100 rounded w-1/3 mb-8" />
          <div className="h-80 bg-gray-100 rounded-xl mb-6" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-100 rounded" />
            <div className="h-4 bg-gray-100 rounded" />
            <div className="h-4 bg-gray-100 rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Newspaper className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 mb-4">新闻不存在或已被删除</p>
        <Link to="/news" className="btn-primary">
          <ArrowLeft className="w-4 h-4" /> 返回新闻列表
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 max-w-4xl mx-auto">
        <Link to="/" className="hover:text-gov-600 transition-colors">首页</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/news" className="hover:text-gov-600 transition-colors">新闻资讯</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-800 font-medium truncate">{detail.title}</span>
      </nav>

      <article className="max-w-4xl mx-auto">
        <div className="card p-6 md:p-10 mb-8">
          <header className="mb-8 pb-8 border-b border-gray-100">
            <span className="chip bg-gov-100 text-gov-700 mb-4">{detail.category}</span>
            <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-4">
              {detail.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {detail.publishTime}
              </span>
              <span>来源：{detail.source}</span>
              <span>作者：{detail.author}</span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                {detail.views} 阅读
              </span>
            </div>
          </header>

          {detail.videoUrl ? (
            <div className="mb-8">
              <VideoPlayer src={detail.videoUrl} poster={detail.cover} title={detail.title} />
            </div>
          ) : detail.cover ? (
            <div className="mb-8 rounded-xl overflow-hidden">
              <img src={detail.cover} alt={detail.title} className="w-full h-auto object-cover" />
            </div>
          ) : null}

          <div
            className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-gov-600 prose-blockquote:border-l-gov-500 prose-blockquote:bg-gov-50 prose-blockquote:py-2 prose-blockquote:pr-4 prose-strong:text-gov-700 prose-ul:text-gray-700"
            dangerouslySetInnerHTML={{ __html: detail.content }}
          />

          {detail.tags?.length > 0 && (
            <div className="mt-10 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-3">相关标签：</p>
              <div className="flex flex-wrap gap-2">
                {detail.tags.map((tag) => (
                  <span key={tag} className="chip bg-gray-100 text-gray-600 hover:bg-gov-100 hover:text-gov-600 cursor-pointer transition-colors">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-100">
            <Link to="/news" className="text-sm text-gov-600 hover:text-gov-700 flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> 返回列表
            </Link>
            <button className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gov-600 transition-colors">
              <Share2 className="w-4 h-4" /> 分享
            </button>
          </div>
        </div>

        <section>
          <h2 className="section-title">相关推荐</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {detail.related.map((item) => (
              <NewsCard key={item.id} news={item} />
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}
