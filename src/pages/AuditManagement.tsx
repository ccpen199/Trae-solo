import { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Shield,
  Brain,
  FileText,
  Eye,
  RotateCcw,
  Plus,
  Trash2,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import {
  channelLabels,
  tierLabels,
} from '@shared/types';
import type { ContentItem, AuditResult, SensitiveWord } from '@shared/types';
import { cn } from '@/lib/utils';

type TabType = 'pending' | 'sensitive' | 'history';

const statusColors: Record<string, string> = {
  safe: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
};

const levelLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
};

const levelColors: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

const categories = ['政治敏感', '暴力色情', '虚假信息', '广告营销', '侮辱谩骂'];

export default function AuditManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [pendingContents, setPendingContents] = useState<ContentItem[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [sensitiveWords, setSensitiveWords] = useState<SensitiveWord[]>([]);
  const [newWord, setNewWord] = useState('');
  const [newCategory, setNewCategory] = useState(categories[0]);
  const [newLevel, setNewLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [keyword, setKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    if (activeTab === 'pending') {
      loadPendingContents();
    } else if (activeTab === 'sensitive') {
      loadSensitiveWords();
    }
  }, [activeTab, filterCategory]);

  useEffect(() => {
    if (selectedContent) {
      loadAuditResult(selectedContent.id);
    }
  }, [selectedContent]);

  const loadPendingContents = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/content?status=pending');
      const data = await res.json();
      if (data.success && data.data) {
        setPendingContents(data.data.list);
        if (data.data.list.length > 0 && !selectedContent) {
          setSelectedContent(data.data.list[0]);
        }
      }
    } catch (e) {
      const mockPending: ContentItem[] = [
        {
          id: 'c1',
          title: '我市今年新建改扩建中小学20所 增加学位3万个',
          summary: '2024年我市计划新建改扩建中小学20所，预计新增学位3万个...',
          content: '详细内容...',
          coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=150&fit=crop',
          channel: 'education',
          tier: 'city',
          status: 'pending',
          source: 'rss',
          viewCount: 0,
          createTime: '2024-06-20 08:30:00',
          updateTime: '2024-06-20 08:30:00',
          creatorId: '4',
          creatorName: '刘编辑',
        },
        {
          id: 'c2',
          title: '街道社区开展夏季食品安全宣传活动',
          summary: '彭城街道办事处组织开展夏季食品安全宣传进社区活动...',
          content: '详细内容...',
          coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=150&fit=crop',
          channel: 'livelihood',
          tier: 'street',
          status: 'pending',
          source: 'manual',
          viewCount: 0,
          createTime: '2024-06-20 07:45:00',
          updateTime: '2024-06-20 07:45:00',
          creatorId: '6',
          creatorName: '赵明',
        },
        {
          id: 'c3',
          title: '全区文化惠民演出活动圆满举办',
          summary: '云龙区文化惠民演出活动在市民广场举行，吸引了众多市民参与...',
          content: '详细内容...',
          coverImage: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200&h=150&fit=crop',
          channel: 'culture',
          tier: 'district',
          status: 'pending',
          source: 'manual',
          viewCount: 0,
          createTime: '2024-06-19 17:20:00',
          updateTime: '2024-06-19 17:20:00',
          creatorId: '5',
          creatorName: '陈静',
        },
      ];
      setPendingContents(mockPending);
      if (!selectedContent) {
        setSelectedContent(mockPending[0]);
      }
    }
  };

  const loadAuditResult = async (contentId: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/audit/submit/${contentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '测试内容' }),
      });
      const data = await res.json();
      if (data.success) {
        setAuditResult(data.data);
      }
    } catch (e) {
      setAuditResult({
        contentId,
        sensitiveWords: [
          { word: '敏感词示例1', position: 5, category: '政治敏感' },
          { word: '敏感词示例2', position: 28, category: '广告营销' },
        ],
        aiAnalysis: {
          score: 35,
          level: 'warning',
          tags: ['内容表述需注意', '建议人工复核'],
          description: '经AI语义分析，该内容存在一定风险，建议人工复核后发布。整体内容导向积极，但部分表述需要注意。',
        },
        status: 'pending',
      });
    }
  };

  const loadSensitiveWords = async () => {
    try {
      const params = new URLSearchParams();
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (keyword) params.append('keyword', keyword);

      const res = await fetch(`http://localhost:3001/api/audit/sensitive-words?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSensitiveWords(data.data.list);
      }
    } catch (e) {
      const mockWords: SensitiveWord[] = [
        { id: '1', word: '违禁词示例1', category: '政治敏感', level: 'high', createTime: '2024-01-15 10:00:00' },
        { id: '2', word: '敏感词示例2', category: '暴力色情', level: 'high', createTime: '2024-02-20 14:30:00' },
        { id: '3', word: '广告推销', category: '广告营销', level: 'medium', createTime: '2024-03-10 09:15:00' },
        { id: '4', word: '虚假宣传', category: '虚假信息', level: 'medium', createTime: '2024-04-05 16:00:00' },
        { id: '5', word: '侮辱性词汇', category: '侮辱谩骂', level: 'low', createTime: '2024-05-12 11:20:00' },
        { id: '6', word: '低俗用语', category: '暴力色情', level: 'medium', createTime: '2024-05-20 13:45:00' },
        { id: '7', word: '谣言关键词', category: '虚假信息', level: 'high', createTime: '2024-06-01 08:30:00' },
        { id: '8', word: '诈骗话术', category: '广告营销', level: 'high', createTime: '2024-06-10 15:00:00' },
      ];
      setSensitiveWords(mockWords);
    }
  };

  const handleApprove = async (id: string) => {
    const updated = pendingContents.filter((c) => c.id !== id);
    setPendingContents(updated);
    if (updated.length > 0) {
      setSelectedContent(updated[0]);
    } else {
      setSelectedContent(null);
    }
  };

  const handleReject = (id: string) => {
    const updated = pendingContents.filter((c) => c.id !== id);
    setPendingContents(updated);
    if (updated.length > 0) {
      setSelectedContent(updated[0]);
    } else {
      setSelectedContent(null);
    }
  };

  const handleAddSensitiveWord = () => {
    if (!newWord.trim()) return;
    const word: SensitiveWord = {
      id: String(Date.now()),
      word: newWord,
      category: newCategory,
      level: newLevel,
      createTime: new Date().toLocaleString(),
    };
    setSensitiveWords([word, ...sensitiveWords]);
    setNewWord('');
  };

  const handleDeleteSensitiveWord = (id: string) => {
    setSensitiveWords(sensitiveWords.filter((w) => w.id !== id));
  };

  const tabs = [
    { key: 'pending' as const, label: '待审核', icon: Clock, count: pendingContents.length },
    { key: 'sensitive' as const, label: '敏感词库', icon: Shield, count: sensitiveWords.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="内容审核"
        description="敏感词检测 + AI语义分析双轨审核引擎"
      />

      <div className="bg-white rounded-xl shadow-card">
        <div className="border-b border-slate-200 px-5">
          <div className="flex items-center gap-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                'flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span className={cn(
                'px-1.5 py-0.5 text-xs rounded-full',
                activeTab === tab.key ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-600'
              )}>
                {tab.count}
              </span>
            </button>
              );
            })}
          </div>
        </div>

        <div className="p-5">
          {activeTab === 'pending' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {pendingContents.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedContent(item)}
                    className={cn(
                      'p-4 rounded-xl border-2 cursor-pointer transition-all',
                      selectedContent?.id === item.id
                        ? 'border-primary-300 bg-primary-50/50'
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    )}
                  >
                    <div className="flex gap-3">
                      <img
                        src={item.coverImage}
                        alt=""
                        className="w-20 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-slate-900 line-clamp-2">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-1.5 py-0.5 text-xs bg-primary-50 text-primary-600 rounded">
                            {channelLabels[item.channel]}
                          </span>
                          <span className="text-xs text-slate-400">
                            {tierLabels[item.tier]}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {item.creatorName} · {item.createTime.slice(5, 16)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingContents.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                    <p>暂无待审核内容</p>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 space-y-5">
                {selectedContent ? (
                  <>
                    <div className="bg-slate-50 rounded-xl p-5">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        {selectedContent.title}
                      </h3>
                      <p className="text-sm text-slate-500 mb-4">{selectedContent.summary}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>作者：{selectedContent.creatorName}</span>
                        <span>来源：{selectedContent.source === 'manual' ? '人工录入' : selectedContent.source === 'rss' ? 'RSS接入' : '政务API'}</span>
                        <span>创建时间：{selectedContent.createTime}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-orange-600" />
                          </div>
                          <h4 className="font-semibold text-slate-900">敏感词检测</h4>
                          <span className="ml-auto text-xs text-slate-400">
                            发现 {auditResult?.sensitiveWords.length || 0} 个
                          </span>
                        </div>
                        {auditResult?.sensitiveWords && auditResult.sensitiveWords.length > 0 ? (
                          <div className="space-y-2">
                            {auditResult.sensitiveWords.map((sw, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-red-50 rounded-lg"
                              >
                                <div>
                                  <span className="text-sm font-medium text-red-700">{sw.word}</span>
                                  <span className="text-xs text-red-500 ml-2">{sw.category}</span>
                                </div>
                                <span className="text-xs text-red-400">位置 {sw.position}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-slate-400">
                            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                            <p className="text-sm">未检测到敏感词</p>
                          </div>
                        )}
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Brain className="w-4 h-4 text-purple-600" />
                          </div>
                          <h4 className="font-semibold text-slate-900">AI语义分析</h4>
                          <span className={cn(
                            'ml-auto px-2 py-0.5 text-xs font-medium rounded-full',
                            statusColors[auditResult?.aiAnalysis.level || 'safe']
                          )}>
                            {auditResult?.aiAnalysis.level === 'safe' ? '安全' :
                             auditResult?.aiAnalysis.level === 'warning' ? '注意' : '危险'}
                          </span>
                        </div>
                        
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>风险评分</span>
                            <span className="font-medium text-slate-700">{auditResult?.aiAnalysis.score || 0}/100</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                (auditResult?.aiAnalysis.score || 0) < 30 ? 'bg-green-500' :
                                (auditResult?.aiAnalysis.score || 0) < 70 ? 'bg-yellow-500' : 'bg-red-500'
                              )}
                              style={{ width: `${auditResult?.aiAnalysis.score || 0}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {auditResult?.aiAnalysis.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>

                        <p className="text-xs text-slate-500">{auditResult?.aiAnalysis.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => handleReject(selectedContent.id)}
                        className="flex items-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-lg transition-colors"
                      >
                        <XCircle className="w-4 h-4 text-red-500" />
                        驳回
                      </button>
                      <button
                        onClick={() => handleApprove(selectedContent.id)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        审核通过
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 py-20">
                    <AlertTriangle className="w-8 h-8 mr-2" />
                    请选择一条待审核内容
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'sensitive' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 max-w-xs">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="搜索敏感词..."
                      className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                    />
                  </div>
                </div>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                >
                  <option value="all">全部分类</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <div className="flex-1" />

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    placeholder="输入敏感词"
                    className="w-36 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                  />
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value as 'low' | 'medium' | 'high')}
                    className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                  >
                    <option value="low">低级</option>
                    <option value="medium">中级</option>
                    <option value="high">高级</option>
                  </select>
                  <button
                    onClick={handleAddSensitiveWord}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    添加
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">敏感词</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">分类</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">级别</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">添加时间</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sensitiveWords.map((word) => (
                      <tr key={word.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{word.word}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{word.category}</td>
                        <td className="px-4 py-3">
                          <span className={cn('px-2 py-0.5 text-xs font-medium rounded', levelColors[word.level])}>
                            {levelLabels[word.level]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">{word.createTime.slice(0, 10)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteSensitiveWord(word.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
