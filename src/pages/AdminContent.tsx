import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Newspaper,
  ChevronRight,
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  Upload,
  X,
  Check,
  Clock,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentItem {
  id: string;
  title: string;
  category: string;
  status: 'published' | 'draft' | 'reviewing' | 'offline';
  author: string;
  publishTime: string;
  views: number;
  featured: boolean;
}

const statusConfig = {
  published: { label: '已发布', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  draft: { label: '草稿', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  reviewing: { label: '待审核', bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  offline: { label: '已下线', bg: 'bg-red-100', text: 'text-red-600', dot: 'bg-red-500' },
};

const categories = ['全部', '政务要闻', '民生政策', '应急预警', '便民提示', '政策解读', '民生动态'];
const statuses: Array<{ key: 'all' | ContentItem['status']; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'published', label: '已发布' },
  { key: 'draft', label: '草稿' },
  { key: 'reviewing', label: '待审核' },
  { key: 'offline', label: '已下线' },
];

const mockContent: ContentItem[] = [
  { id: 'c1', title: '盐城市召开民生服务工作推进会 部署下半年重点任务', category: '政务要闻', status: 'published', author: '融媒体中心', publishTime: '2025-06-20 09:30', views: 3582, featured: true },
  { id: 'c2', title: '关于开展2025年度城乡居民医疗保险参保缴费工作的通知', category: '民生政策', status: 'published', author: '市医保局', publishTime: '2025-06-20 08:00', views: 4521, featured: false },
  { id: 'c3', title: '暴雨天气安全防范指南', category: '应急预警', status: 'reviewing', author: '市应急管理局', publishTime: '2025-06-19 18:20', views: 0, featured: true },
  { id: 'c4', title: '我市全面推行"一件事一次办"改革', category: '政务要闻', status: 'draft', author: '市行政审批局', publishTime: '-', views: 0, featured: false },
  { id: 'c5', title: '社保待遇领取资格认证操作指南', category: '便民提示', status: 'published', author: '市人社局', publishTime: '2025-06-19 10:15', views: 1876, featured: false },
  { id: 'c6', title: '高温天气劳动者权益保护政策解读', category: '政策解读', status: 'offline', author: '市总工会', publishTime: '2025-06-18 14:00', views: 1234, featured: false },
  { id: 'c7', title: '盐城高新区新建3个社区卫生服务站', category: '民生动态', status: 'published', author: '高新区管委会', publishTime: '2025-06-18 09:00', views: 986, featured: false },
];

export default function AdminContent() {
  const [content, setContent] = useState<ContentItem[]>(mockContent);
  const [activeCategory, setActiveCategory] = useState('全部');
  const [activeStatus, setActiveStatus] = useState<typeof statuses[number]['key']>('all');
  const [keyword, setKeyword] = useState('');
  const [showEditor, setShowEditor] = useState(false);

  const filtered = content.filter((c) => {
    if (activeCategory !== '全部' && c.category !== activeCategory) return false;
    if (activeStatus !== 'all' && c.status !== activeStatus) return false;
    if (keyword && !c.title.includes(keyword)) return false;
    return true;
  });

  const stats = {
    total: content.length,
    published: content.filter((c) => c.status === 'published').length,
    reviewing: content.filter((c) => c.status === 'reviewing').length,
    draft: content.filter((c) => c.status === 'draft').length,
  };

  const handleDelete = (id: string) => {
    setContent((list) => list.filter((c) => c.id !== id));
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-gov-600 transition-colors">首页</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-800 font-medium">内容管理</span>
      </nav>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title flex items-center gap-3">
            <Newspaper className="w-8 h-8 text-gov-600" />
            内容管理
          </h1>
          <p className="section-subtitle">新闻资讯、政策文件、通知公告等内容的发布与管理</p>
        </div>
        <button onClick={() => setShowEditor(true)} className="btn-primary">
          <Plus className="w-5 h-5" />
          发布内容
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: '内容总数', value: stats.total, color: 'from-gov-500 to-gov-600', icon: Newspaper },
          { label: '已发布', value: stats.published, color: 'from-green-500 to-green-600', icon: Check },
          { label: '待审核', value: stats.reviewing, color: 'from-yellow-500 to-yellow-600', icon: Clock },
          { label: '草稿', value: stats.draft, color: 'from-gray-500 to-gray-600', icon: AlertCircle },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br', item.color, 'flex items-center justify-center')}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{item.value}</p>
              <p className="text-sm text-gray-500 mt-1">{item.label}</p>
            </div>
          );
        })}
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索内容标题..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-gov-400 focus:ring-2 focus:ring-gov-100 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-5 h-5 text-gray-400" />
            {statuses.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveStatus(s.key)}
                className={
                  activeStatus === s.key
                    ? 'px-3.5 py-1.5 rounded-lg bg-gov-500 text-white text-sm font-medium transition-all'
                    : 'px-3.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 transition-all'
                }
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.filter((c) => c !== '全部').map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? '全部' : cat)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  activeCategory === cat ? 'bg-warm-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-gray-500">
                <th className="px-6 py-4 font-medium">标题</th>
                <th className="px-6 py-4 font-medium">分类</th>
                <th className="px-6 py-4 font-medium">状态</th>
                <th className="px-6 py-4 font-medium">作者</th>
                <th className="px-6 py-4 font-medium">发布时间</th>
                <th className="px-6 py-4 font-medium">浏览量</th>
                <th className="px-6 py-4 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((item) => {
                const status = statusConfig[item.status];
                return (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {item.featured && <span className="chip bg-warm-100 text-warm-600 text-[10px] px-1.5 py-0.5">置顶</span>}
                        <p className="font-medium text-gray-800 line-clamp-1 max-w-md">{item.title}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="chip bg-gov-100 text-gov-700">{item.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('chip', status.bg, status.text)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', status.dot)} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.author}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.publishTime}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.views.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gov-600 transition-colors" title="预览">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gov-600 transition-colors" title="编辑">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Newspaper className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">暂无内容</p>
          </div>
        )}
      </div>

      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-serif text-xl font-bold text-gray-900">发布新内容</h3>
              <button onClick={() => setShowEditor(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">内容标题</label>
                <input
                  type="text"
                  placeholder="请输入内容标题"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gov-400 focus:ring-2 focus:ring-gov-100 outline-none transition-all"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">内容分类</label>
                  <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gov-400 focus:ring-2 focus:ring-gov-100 outline-none transition-all">
                    {categories.filter((c) => c !== '全部').map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">封面图片</label>
                  <button className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-gov-400 hover:text-gov-600 transition-all flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    上传封面
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">内容正文</label>
                <textarea
                  rows={8}
                  placeholder="请输入内容正文..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gov-400 focus:ring-2 focus:ring-gov-100 outline-none transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 sticky bottom-0 bg-white">
              <button onClick={() => setShowEditor(false)} className="btn-secondary">
                取消
              </button>
              <button onClick={() => setShowEditor(false)} className="btn-secondary">
                保存草稿
              </button>
              <button onClick={() => setShowEditor(false)} className="btn-primary">
                发布内容
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
