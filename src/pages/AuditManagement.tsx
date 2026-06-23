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
  History,
  Upload,
  Download,
  ToggleLeft,
  ToggleRight,
  Send,
  UserCheck,
  ThumbsUp,
  Minus,
  ThumbsDown,
  ChevronDown,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import {
  channelLabels,
  tierLabels,
} from '@shared/types';
import type { ContentItem, AuditResult, SensitiveWord } from '@shared/types';
import { cn } from '@/lib/utils';

type TabType = 'pending' | 'history' | 'sensitive';

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

const sourceLabels: Record<string, string> = {
  rss: 'RSS接入',
  api: '政务API',
  manual: '人工录入',
};

const sourceColors: Record<string, string> = {
  rss: 'bg-blue-50 text-blue-600',
  api: 'bg-purple-50 text-purple-600',
  manual: 'bg-slate-100 text-slate-600',
};

const categories = ['政治敏感', '暴力色情', '虚假信息', '广告营销', '侮辱谩骂'];

const quickOpinions = ['内容合规，审核通过', '信息真实有效', '符合发布规范', '数据来源可靠'];

const reviewers = ['张审核员', '李审核员', '王复核员', '赵主管'];

const sentimentColors: Record<string, string> = {
  positive: 'text-green-600 bg-green-50',
  neutral: 'text-slate-600 bg-slate-100',
  negative: 'text-red-600 bg-red-50',
};

const sentimentLabels: Record<string, string> = {
  positive: '正面',
  neutral: '中性',
  negative: '负面',
};

interface AuditHistoryItem {
  id: string;
  title: string;
  applicant: string;
  auditor: string;
  result: 'passed' | 'rejected' | 'review';
  auditTime: string;
  opinion: string;
  reviewStatus: 'none' | 'pending' | 'completed';
}

interface ExtendedSensitiveWord extends SensitiveWord {
  enabled: boolean;
  replaceWord?: string;
}

export default function AuditManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [pendingContents, setPendingContents] = useState<ContentItem[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [sensitiveWords, setSensitiveWords] = useState<ExtendedSensitiveWord[]>([]);
  const [auditHistory, setAuditHistory] = useState<AuditHistoryItem[]>([]);
  const [newWord, setNewWord] = useState('');
  const [newCategory, setNewCategory] = useState(categories[0]);
  const [newLevel, setNewLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [keyword, setKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [historyKeyword, setHistoryKeyword] = useState('');

  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedOpinion, setSelectedOpinion] = useState('');
  const [showOpinionDropdown, setShowOpinionDropdown] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReviewer, setSelectedReviewer] = useState('');

  useEffect(() => {
    if (activeTab === 'pending') {
      loadPendingContents();
    } else if (activeTab === 'sensitive') {
      loadSensitiveWords();
    } else if (activeTab === 'history') {
      loadAuditHistory();
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
          summary: '2024年我市计划新建改扩建中小学20所，预计新增学位3万个，有效缓解教育资源紧张问题，让更多孩子享受优质教育。',
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
          summary: '彭城街道办事处组织开展夏季食品安全宣传进社区活动，通过发放宣传册、现场咨询等方式，提高居民食品安全意识。',
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
          summary: '云龙区文化惠民演出活动在市民广场举行，吸引了众多市民参与，丰富了群众精神文化生活。',
          content: '详细内容...',
          coverImage: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200&h=150&fit=crop',
          channel: 'culture',
          tier: 'district',
          status: 'pending',
          source: 'api',
          viewCount: 0,
          createTime: '2024-06-19 17:20:00',
          updateTime: '2024-06-19 17:20:00',
          creatorId: '5',
          creatorName: '陈静',
        },
        {
          id: 'c4',
          title: '政府发布最新经济数据 上半年GDP增长稳中有进',
          summary: '市统计局发布2024年上半年经济运行情况，全市GDP同比增长5.8%，经济运行呈现稳中有进、稳中向好的发展态势。',
          content: '详细内容...',
          coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=150&fit=crop',
          channel: 'politics',
          tier: 'city',
          status: 'pending',
          source: 'api',
          viewCount: 0,
          createTime: '2024-06-19 14:10:00',
          updateTime: '2024-06-19 14:10:00',
          creatorId: '2',
          creatorName: '吴记者',
        },
        {
          id: 'c5',
          title: '周末天气预报：多云转晴 适宜户外活动',
          summary: '气象部门预报本周末我市天气晴好，气温在22℃-30℃之间，适宜市民进行户外活动。',
          content: '详细内容...',
          coverImage: 'https://images.unsplash.com/photo-1504253163759-c23fccaebb55?w=200&h=150&fit=crop',
          channel: 'livelihood',
          tier: 'city',
          status: 'pending',
          source: 'rss',
          viewCount: 0,
          createTime: '2024-06-19 10:00:00',
          updateTime: '2024-06-19 10:00:00',
          creatorId: '3',
          creatorName: '孙编辑',
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
          tags: ['内容表述需注意', '建议人工复核', '数据引用待核实'],
          description: '经AI语义分析，该内容存在一定风险，建议人工复核后发布。整体内容导向积极，但部分表述需要注意，涉及敏感领域需谨慎处理。建议核对数据来源准确性，确保信息发布的权威性。',
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
      const mockWords: ExtendedSensitiveWord[] = [
        { id: '1', word: '违禁词示例1', category: '政治敏感', level: 'high', createTime: '2024-01-15 10:00:00', enabled: true, replaceWord: '***' },
        { id: '2', word: '敏感词示例2', category: '暴力色情', level: 'high', createTime: '2024-02-20 14:30:00', enabled: true, replaceWord: '***' },
        { id: '3', word: '广告推销', category: '广告营销', level: 'medium', createTime: '2024-03-10 09:15:00', enabled: true, replaceWord: '推广信息' },
        { id: '4', word: '虚假宣传', category: '虚假信息', level: 'medium', createTime: '2024-04-05 16:00:00', enabled: false },
        { id: '5', word: '侮辱性词汇', category: '侮辱谩骂', level: 'low', createTime: '2024-05-12 11:20:00', enabled: true, replaceWord: '不当言论' },
        { id: '6', word: '低俗用语', category: '暴力色情', level: 'medium', createTime: '2024-05-20 13:45:00', enabled: true },
        { id: '7', word: '谣言关键词', category: '虚假信息', level: 'high', createTime: '2024-06-01 08:30:00', enabled: true, replaceWord: '不实信息' },
        { id: '8', word: '诈骗话术', category: '广告营销', level: 'high', createTime: '2024-06-10 15:00:00', enabled: true },
      ];
      setSensitiveWords(mockWords);
    }
  };

  const loadAuditHistory = () => {
    const mockHistory: AuditHistoryItem[] = [
      { id: 'h1', title: '我市召开经济工作会议部署下半年任务', applicant: '刘编辑', auditor: '张审核员', result: 'passed', auditTime: '2024-06-20 09:30:00', opinion: '内容合规，信息准确', reviewStatus: 'none' },
      { id: 'h2', title: '某楼盘涉嫌违规销售被查处', applicant: '李记者', auditor: '王复核员', result: 'rejected', auditTime: '2024-06-20 08:15:00', opinion: '内容涉及未核实信息，需补充证据后重新提交', reviewStatus: 'completed' },
      { id: 'h3', title: '地铁4号线建设进展顺利预计年底通车', applicant: '赵编辑', auditor: '张审核员', result: 'review', auditTime: '2024-06-19 17:45:00', opinion: '涉及重大工程信息，建议提交主管复核', reviewStatus: 'pending' },
      { id: 'h4', title: '全市教育工作会议召开 部署新学期工作', applicant: '孙编辑', auditor: '李审核员', result: 'passed', auditTime: '2024-06-19 15:20:00', opinion: '内容规范，审核通过', reviewStatus: 'none' },
      { id: 'h5', title: '我市举办首届创新创业大赛', applicant: '周记者', auditor: '李审核员', result: 'passed', auditTime: '2024-06-19 11:00:00', opinion: '符合发布规范', reviewStatus: 'none' },
      { id: 'h6', title: '某产品质量问题被曝光', applicant: '吴编辑', auditor: '王复核员', result: 'rejected', auditTime: '2024-06-18 16:30:00', opinion: '表述存在偏颇，需客观公正报道', reviewStatus: 'none' },
    ];
    setAuditHistory(mockHistory);
  };

  const getRiskLevel = (score: number): 'low' | 'medium' | 'high' => {
    if (score < 30) return 'low';
    if (score < 70) return 'medium';
    return 'high';
  };

  const getSentiment = (): 'positive' | 'neutral' | 'negative' => {
    if (auditResult?.aiAnalysis.level === 'safe') return 'positive';
    if (auditResult?.aiAnalysis.level === 'warning') return 'neutral';
    return 'negative';
  };

  const getViolationSuggestions = (): string[] => {
    if (auditResult?.aiAnalysis.level === 'danger') {
      return ['涉嫌违反《网络安全法》第十二条', '可能违反《互联网信息服务管理办法》', '建议依据《内容审核规范》第3.2条处理'];
    }
    if (auditResult?.aiAnalysis.level === 'warning') {
      return ['建议参考《内容审核规范》第2.1条', '需核对信息来源的权威性', '涉及敏感话题，建议人工复核'];
    }
    return ['暂未发现明显违规类别'];
  };

  const handleApprove = () => {
    if (!selectedContent) return;
    const updated = pendingContents.filter((c) => c.id !== selectedContent.id);
    setPendingContents(updated);
    setAuditHistory([
      {
        id: `h${Date.now()}`,
        title: selectedContent.title,
        applicant: selectedContent.creatorName,
        auditor: '当前用户',
        result: 'passed',
        auditTime: new Date().toLocaleString(),
        opinion: selectedOpinion || '内容合规，审核通过',
        reviewStatus: 'none',
      },
      ...auditHistory,
    ]);
    if (updated.length > 0) {
      setSelectedContent(updated[0]);
    } else {
      setSelectedContent(null);
    }
    setSelectedOpinion('');
    setShowOpinionDropdown(false);
  };

  const handleReject = () => {
    if (!selectedContent || !rejectReason.trim()) return;
    const updated = pendingContents.filter((c) => c.id !== selectedContent.id);
    setPendingContents(updated);
    setAuditHistory([
      {
        id: `h${Date.now()}`,
        title: selectedContent.title,
        applicant: selectedContent.creatorName,
        auditor: '当前用户',
        result: 'rejected',
        auditTime: new Date().toLocaleString(),
        opinion: rejectReason,
        reviewStatus: 'none',
      },
      ...auditHistory,
    ]);
    if (updated.length > 0) {
      setSelectedContent(updated[0]);
    } else {
      setSelectedContent(null);
    }
    setRejectReason('');
    setShowRejectModal(false);
  };

  const handleSubmitReview = () => {
    if (!selectedContent || !selectedReviewer) return;
    const updated = pendingContents.filter((c) => c.id !== selectedContent.id);
    setPendingContents(updated);
    setAuditHistory([
      {
        id: `h${Date.now()}`,
        title: selectedContent.title,
        applicant: selectedContent.creatorName,
        auditor: selectedReviewer,
        result: 'review',
        auditTime: new Date().toLocaleString(),
        opinion: `提交${selectedReviewer}复核`,
        reviewStatus: 'pending',
      },
      ...auditHistory,
    ]);
    if (updated.length > 0) {
      setSelectedContent(updated[0]);
    } else {
      setSelectedContent(null);
    }
    setSelectedReviewer('');
    setShowReviewModal(false);
  };

  const handleAddSensitiveWord = () => {
    if (!newWord.trim()) return;
    const word: ExtendedSensitiveWord = {
      id: String(Date.now()),
      word: newWord,
      category: newCategory,
      level: newLevel,
      createTime: new Date().toLocaleString(),
      enabled: true,
    };
    setSensitiveWords([word, ...sensitiveWords]);
    setNewWord('');
  };

  const handleDeleteSensitiveWord = (id: string) => {
    setSensitiveWords(sensitiveWords.filter((w) => w.id !== id));
  };

  const toggleWordEnabled = (id: string) => {
    setSensitiveWords(sensitiveWords.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w)));
  };

  const categoryStats = categories.map((cat) => ({
    name: cat,
    count: sensitiveWords.filter((w) => w.category === cat).length,
    enabled: sensitiveWords.filter((w) => w.category === cat && w.enabled).length,
  }));

  const filteredHistory = auditHistory.filter(
    (h) => !historyKeyword || h.title.includes(historyKeyword) || h.applicant.includes(historyKeyword) || h.auditor.includes(historyKeyword)
  );

  const filteredWords = sensitiveWords.filter((w) => {
    if (filterCategory !== 'all' && w.category !== filterCategory) return false;
    if (keyword && !w.word.includes(keyword)) return false;
    return true;
  });

  const riskLevel = auditResult ? getRiskLevel(auditResult.aiAnalysis.score) : 'low';
  const sentiment = getSentiment();

  const tabs = [
    { key: 'pending' as const, label: '待审核内容', icon: Clock, count: pendingContents.length },
    { key: 'history' as const, label: '审核历史', icon: History, count: auditHistory.length },
    { key: 'sensitive' as const, label: '敏感词库', icon: Shield, count: sensitiveWords.length },
  ];

  const pendingStats = [
    { title: '待审核总数', value: pendingContents.length, icon: <Clock className="w-5 h-5" />, color: 'blue' as const },
    { title: '高风险', value: pendingContents.filter((c) => c.source === 'manual').length, icon: <AlertTriangle className="w-5 h-5" />, color: 'red' as const },
    { title: '今日新增', value: 3, icon: <Plus className="w-5 h-5" />, color: 'green' as const },
    { title: '超时未审', value: 1, icon: <XCircle className="w-5 h-5" />, color: 'orange' as const },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="内容审核"
        description="敏感词检测 + AI语义分析双轨审核引擎"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {pendingStats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

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
              <div className="lg:col-span-1 space-y-3 max-h-[700px] overflow-y-auto pr-2">
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
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={cn('px-1.5 py-0.5 text-xs rounded', sourceColors[item.source])}>
                            {sourceLabels[item.source]}
                          </span>
                          <span className="px-1.5 py-0.5 text-xs bg-primary-50 text-primary-600 rounded">
                            {channelLabels[item.channel]}
                          </span>
                          <span className={cn('px-1.5 py-0.5 text-xs rounded', levelColors[riskLevel])}>
                            {levelLabels[riskLevel]}风险
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">
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
                    <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-5 border border-primary-100">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            {selectedContent.title}
                          </h3>
                          <p className="text-sm text-slate-600 mb-3">{selectedContent.summary}</p>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5" />
                              作者：{selectedContent.creatorName}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" />
                              来源：{sourceLabels[selectedContent.source]}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              提交时间：{selectedContent.createTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              {tierLabels[selectedContent.tier]}
                            </span>
                          </div>
                        </div>
                        <div className={cn('px-3 py-1.5 rounded-lg text-sm font-medium', levelColors[riskLevel])}>
                          {levelLabels[riskLevel]}级风险
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
                            <Shield className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">敏感词检测</h4>
                            <p className="text-xs text-slate-400">基于词库的精确匹配</p>
                          </div>
                          <span className="ml-auto px-2.5 py-1 text-xs font-medium bg-red-50 text-red-600 rounded-full">
                            发现 {auditResult?.sensitiveWords.length || 0} 个
                          </span>
                        </div>
                        {auditResult?.sensitiveWords && auditResult.sensitiveWords.length > 0 ? (
                          <div className="space-y-2">
                            {auditResult.sensitiveWords.map((sw, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-red-50/70 rounded-lg border border-red-100"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                                    {sw.word}
                                  </span>
                                  <span className="text-xs text-red-500">{sw.category}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={cn('px-2 py-0.5 text-xs font-medium rounded', levelColors[index % 2 === 0 ? 'high' : 'medium'])}>
                                    {index % 2 === 0 ? '高' : '中'}级
                                  </span>
                                  <span className="text-xs text-slate-400">位置 {sw.position}</span>
                                </div>
                              </div>
                            ))}
                            <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                              <p className="text-xs text-slate-500 mb-2 font-medium">内容预览（命中高亮）：</p>
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {selectedContent.summary.split(/(敏感词示例1|敏感词示例2)/g).map((part, i) =>
                                  part === '敏感词示例1' || part === '敏感词示例2' ? (
                                    <span key={i} className="bg-red-200 text-red-800 px-1 rounded font-medium">
                                      {part}
                                    </span>
                                  ) : (
                                    part
                                  )
                                )}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-slate-400">
                            <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
                            <p className="text-sm">未检测到敏感词</p>
                          </div>
                        )}
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Brain className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">AI语义分析</h4>
                            <p className="text-xs text-slate-400">深度学习语义风险评估</p>
                          </div>
                          <span className={cn(
                            'ml-auto px-2.5 py-1 text-xs font-medium rounded-full',
                            statusColors[auditResult?.aiAnalysis.level || 'safe']
                          )}>
                            {auditResult?.aiAnalysis.level === 'safe' ? '安全' :
                             auditResult?.aiAnalysis.level === 'warning' ? '注意' : '危险'}
                          </span>
                        </div>

                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-slate-500 mb-2">
                            <span>风险评分</span>
                            <span className="font-bold text-slate-700">{auditResult?.aiAnalysis.score || 0}/100</span>
                          </div>
                          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-700',
                                (auditResult?.aiAnalysis.score || 0) < 30 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                                (auditResult?.aiAnalysis.score || 0) < 70 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 'bg-gradient-to-r from-red-400 to-red-500'
                              )}
                              style={{ width: `${auditResult?.aiAnalysis.score || 0}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                            <span>低风险 0</span>
                            <span>中风险 50</span>
                            <span>高风险 100</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500 mb-1">情感倾向</p>
                            <span className={cn('inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded', sentimentColors[sentiment])}>
                              {sentiment === 'positive' && <ThumbsUp className="w-3 h-3" />}
                              {sentiment === 'neutral' && <Minus className="w-3 h-3" />}
                              {sentiment === 'negative' && <ThumbsDown className="w-3 h-3" />}
                              {sentimentLabels[sentiment]}
                            </span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500 mb-1">风险等级</p>
                            <span className={cn('inline-block px-2 py-1 text-xs font-medium rounded', levelColors[riskLevel])}>
                              {levelLabels[riskLevel]}级
                            </span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-xs text-slate-500 mb-2">风险标签</p>
                          <div className="flex flex-wrap gap-1.5">
                            {auditResult?.aiAnalysis.tags.map((tag, index) => (
                              <span key={index} className="px-2.5 py-1 text-xs bg-amber-50 text-amber-700 rounded-full border border-amber-100">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-xs text-slate-500 mb-2">分析说明</p>
                          <p className="text-xs text-slate-600 leading-relaxed">{auditResult?.aiAnalysis.description}</p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 mb-2">违规类别建议</p>
                          <div className="space-y-1.5">
                            {getViolationSuggestions().map((s, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                                <span className="w-1 h-1 rounded-full bg-primary-500 mt-1.5 flex-shrink-0"></span>
                                {s}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">审核操作</h4>
                          <p className="text-xs text-slate-400">请选择审核结果并提交</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                          <label className="block text-xs font-medium text-slate-500 mb-2">审核意见（通过时）</label>
                          <button
                            onClick={() => setShowOpinionDropdown(!showOpinionDropdown)}
                            className="w-full flex items-center justify-between px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg hover:bg-white hover:border-primary-300 transition-colors"
                          >
                            <span className={selectedOpinion ? 'text-slate-900' : 'text-slate-400'}>
                              {selectedOpinion || '选择审核意见'}
                            </span>
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          </button>
                          {showOpinionDropdown && (
                            <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg py-1">
                              {quickOpinions.map((op) => (
                                <button
                                  key={op}
                                  onClick={() => { setSelectedOpinion(op); setShowOpinionDropdown(false); }}
                                  className="w-full px-3 py-2 text-sm text-left text-slate-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                                >
                                  {op}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-end gap-2 md:col-span-2">
                          <button
                            onClick={() => setShowRejectModal(true)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-lg transition-colors"
                          >
                            <XCircle className="w-4 h-4 text-red-500" />
                            驳回
                          </button>
                          <button
                            onClick={() => setShowReviewModal(true)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-amber-300 text-amber-700 hover:bg-amber-50 text-sm font-medium rounded-lg transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                            提交复核
                          </button>
                          <button
                            onClick={handleApprove}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            审核通过
                          </button>
                        </div>
                      </div>
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

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={historyKeyword}
                      onChange={(e) => setHistoryKeyword(e.target.value)}
                      placeholder="搜索标题、申请人、审核人..."
                      className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  共 {filteredHistory.length} 条记录
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">内容标题</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">申请人</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">审核人</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">审核结果</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">审核时间</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">审核意见</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">复核状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900 max-w-xs truncate">{item.title}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.applicant}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.auditor}</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              'px-2 py-1 text-xs font-medium rounded-full',
                              item.result === 'passed' ? 'bg-green-100 text-green-700' :
                              item.result === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            )}>
                              {item.result === 'passed' ? '通过' : item.result === 'rejected' ? '驳回' : '复核中'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">{item.auditTime}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate" title={item.opinion}>{item.opinion}</td>
                          <td className="px-4 py-3">
                            {item.reviewStatus === 'none' ? (
                              <span className="text-xs text-slate-400">-</span>
                            ) : item.reviewStatus === 'pending' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-full">
                                <Clock className="w-3 h-3" />
                                待复核
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full">
                                <CheckCircle className="w-3 h-3" />
                                已复核
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredHistory.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <History className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>暂无审核历史记录</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'sensitive' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {categoryStats.map((stat) => (
                  <div key={stat.name} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">{stat.name}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-slate-900">{stat.count}</span>
                      <span className="text-xs text-green-600">启用 {stat.enabled}</span>
                    </div>
                  </div>
                ))}
              </div>

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

                <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                  批量导出
                </button>
                <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-lg transition-colors">
                  <Upload className="w-4 h-4" />
                  批量导入
                </button>

                <div className="h-6 w-px bg-slate-200" />

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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">敏感词</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">分类</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">级别</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">替换词</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">状态</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">添加时间</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredWords.map((word) => (
                        <tr key={word.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{word.word}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{word.category}</td>
                          <td className="px-4 py-3">
                            <span className={cn('px-2 py-1 text-xs font-medium rounded', levelColors[word.level])}>
                              {levelLabels[word.level]}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {word.replaceWord ? (
                              <span className="text-sm text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{word.replaceWord}</span>
                            ) : (
                              <span className="text-xs text-slate-400">未设置</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleWordEnabled(word.id)}
                              className="flex items-center gap-1 text-xs"
                            >
                              {word.enabled ? (
                                <ToggleRight className="w-5 h-5 text-green-500" />
                              ) : (
                                <ToggleLeft className="w-5 h-5 text-slate-300" />
                              )}
                              <span className={word.enabled ? 'text-green-600' : 'text-slate-400'}>
                                {word.enabled ? '启用' : '禁用'}
                              </span>
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">{word.createTime.slice(0, 10)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDeleteSensitiveWord(word.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredWords.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <Shield className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>暂无匹配的敏感词</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">驳回内容</h3>
            <p className="text-sm text-slate-500 mb-4">请填写驳回原因，方便申请人修改</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入驳回原因..."
              rows={4}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className={cn(
                  'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors',
                  rejectReason.trim() ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-300 cursor-not-allowed'
                )}
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">提交复核</h3>
            <p className="text-sm text-slate-500 mb-4">请选择复核人员</p>
            <div className="space-y-2">
              {reviewers.map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedReviewer(r)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors',
                    selectedReviewer === r
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  )}
                >
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                    {r[0]}
                  </div>
                  <span className="text-sm font-medium">{r}</span>
                  {selectedReviewer === r && <CheckCircle className="ml-auto w-5 h-5 text-primary-600" />}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setShowReviewModal(false); setSelectedReviewer(''); }}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={!selectedReviewer}
                className={cn(
                  'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors',
                  selectedReviewer ? 'bg-primary-600 hover:bg-primary-700' : 'bg-slate-300 cursor-not-allowed'
                )}
              >
                提交复核
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
