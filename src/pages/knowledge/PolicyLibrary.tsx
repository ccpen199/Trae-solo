import { useEffect, useState } from 'react';
import { BookOpen, Search, FileText, Download, Calendar, Tag } from 'lucide-react';
import dayjs from 'dayjs';
import { api } from '@/lib/api';

interface Policy {
  id: string;
  title: string;
  category: string;
  tags: string[];
  date: string;
  source: string;
  summary: string;
  status: 'active' | 'draft' | 'expired';
}

const mockPolicies: Policy[] = [
  { id: '1', title: '关于进一步完善峰谷分时电价政策的通知', category: '电价政策', tags: ['电价', '峰谷', '新政'], date: '2026-05-15', source: '国家发改委', summary: '为更好发挥价格杠杆作用，引导用户合理用电、节约用电，进一步完善峰谷分时电价机制，优化峰谷时段划分，扩大峰谷价差。', status: 'active' },
  { id: '2', title: '促进绿色电力消费实施方案', category: '新能源', tags: ['绿电', '双碳', '补贴'], date: '2026-04-20', source: '国家能源局', summary: '全面推进绿色电力交易，完善绿电消费政策体系，鼓励企业和个人购买绿色电力，推动能源转型。', status: 'active' },
  { id: '3', title: '分布式光伏发电项目管理办法', category: '新能源', tags: ['光伏', '分布式', '补贴'], date: '2026-03-10', source: '国家能源局', summary: '规范分布式光伏发电项目管理，简化备案流程，完善并网服务，优化补贴政策，促进分布式光伏健康发展。', status: 'active' },
  { id: '4', title: '电力需求侧管理办法', category: '用电管理', tags: ['需求侧', '节能', '响应'], date: '2026-02-01', source: '国家发改委', summary: '完善电力需求侧管理机制，加强节约用电，推进需求响应，提高电力系统运行效率和可靠性。', status: 'active' },
  { id: '5', title: '居民阶梯电价调整方案', category: '电价政策', tags: ['居民', '电价', '阶梯'], date: '2025-12-15', source: '国家发改委', summary: '优化居民阶梯电价制度，适当调整各档电量标准，体现多用电多负担原则，促进居民合理用电。', status: 'active' },
  { id: '6', title: '淘汰落后产能电力政策', category: '产业政策', tags: ['落后产能', '淘汰', '节能'], date: '2025-10-01', source: '工信部', summary: '运用价格杠杆促进落后产能退出，对能耗、环保、安全、技术达不到标准的产能实行差别电价和惩罚性电价。', status: 'expired' },
];

export default function PolicyLibrary() {
  const [policies, setPolicies] = useState<Policy[]>(mockPolicies);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<Policy[]>('/knowledge/policies');
        setPolicies(res);
      } catch {
        setPolicies(mockPolicies);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const allCategories = ['all', ...new Set(policies.map((p) => p.category))];
  const allTags = [...new Set(policies.flatMap((p) => p.tags))];

  const filtered = policies.filter((p) => {
    const matchSearch = !search || p.title.includes(search) || p.summary.includes(search);
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchTag = !tagFilter || p.tags.includes(tagFilter);
    return matchSearch && matchCategory && matchTag;
  });

  const statusBadge = (s: string) => (s === 'active' ? 'badge-green' : s === 'expired' ? 'badge-gray' : 'badge-amber');
  const statusLabel = (s: string) => (s === 'active' ? '现行有效' : s === 'expired' ? '已废止' : '草案');

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-csg-navy border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <BookOpen size={28} className="text-csg-navy" />
        <div>
          <h1 className="page-title">政策原文</h1>
          <p className="page-desc">查阅能源电力相关政策法规文件</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索政策标题或内容..."
              className="input-field pl-10"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">分类</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="select-field w-36">
              {allCategories.map((c) => (
                <option key={c} value={c}>{c === 'all' ? '全部' : c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">标签</label>
            <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="select-field w-36">
              <option value="">全部</option>
              {allTags.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <button onClick={() => { setSearch(''); setCategoryFilter('all'); setTagFilter(''); }} className="btn-outline text-sm">重置</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
            className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${tagFilter === tag ? 'bg-csg-navy text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
          >
            <Tag size={12} /> {tag}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((policy) => (
          <div key={policy.id} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={18} className="text-csg-navy shrink-0" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">{policy.title}</h4>
                  <span className={statusBadge(policy.status)}>{statusLabel(policy.status)}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 ml-6">{policy.summary}</p>
                <div className="flex flex-wrap items-center gap-3 ml-6 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {dayjs(policy.date).format('YYYY-MM-DD')}</span>
                  <span className="badge-blue">{policy.category}</span>
                  {policy.tags.map((t) => (
                    <span key={t} className="badge-gray">#{t}</span>
                  ))}
                </div>
              </div>
              <button className="btn-outline text-sm shrink-0 flex items-center gap-1.5">
                <Download size={14} /> 下载
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <BookOpen size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">没有找到匹配的政策文件</p>
        </div>
      )}
    </div>
  );
}
