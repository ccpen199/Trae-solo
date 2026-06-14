import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Upload,
  Image as ImageIcon,
  Star,
  Search,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  Zap,
  ThumbsUp,
  FileText,
  User,
  Building,
  Calendar,
  Copy,
  Check,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '@/utils/api';

const complaintTypes = ['环境卫生', '交通出行', '市政设施', '噪音扰民', '安全隐患', '其他'];

const streets = [
  '玄武区', '秦淮区', '建邺区', '鼓楼区', '浦口区', '栖霞区',
  '雨花台区', '江宁区', '六合区', '溧水区', '高淳区',
];

interface Complaint {
  id: number;
  ticket_no: string;
  type: string;
  street: string;
  department: string;
  content: string;
  images: string[];
  status: string;
  status_text: string;
  assignee_name: string;
  reply: string | null;
  rating: number | null;
  rating_comment: string | null;
  rated_at: string | null;
  urge_count: number;
  last_urge_at: string | null;
  expected_days: number;
  created_at: string;
  updated_at: string;
  history?: HistoryItem[];
  urges?: UrgeItem[];
}

interface HistoryItem {
  id: number;
  complaint_id: number;
  status: string;
  department: string;
  handler_name: string;
  comment: string;
  created_at: string;
}

interface UrgeItem {
  id: number;
  complaint_id: number;
  user_id: number;
  reason: string;
  created_at: string;
}

interface StatsData {
  total: number;
  pending: number;
  processing: number;
  replied: number;
  completed: number;
  byType: { type: string; count: number; resolved: number }[];
  avgRating: number;
  resolutionRate: number;
}

const statusMap: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { label: '待处理', color: 'bg-yellow-50 text-yellow-600 border-yellow-200', icon: Clock },
  processing: { label: '处理中', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: AlertCircle },
  replied: { label: '已回复', color: 'bg-green-50 text-green-600 border-green-200', icon: CheckCircle2 },
  completed: { label: '已完成', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: ThumbsUp },
  closed: { label: '已关闭', color: 'bg-gray-50 text-gray-600 border-gray-200', icon: FileText },
};

const stepTitles = ['选择类型', '选择区域', '填写内容', '上传图片', '提交确认'];

const CHART_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Complaints() {
  const [tab, setTab] = useState<'submit' | 'list' | 'stats'>('submit');
  const [step, setStep] = useState(0);
  const [type, setType] = useState('');
  const [street, setStreet] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ ticket_no: string; department: string; expected_days: number } | null>(null);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [urgeReason, setUrgeReason] = useState('');
  const [urgeSubmitting, setUrgeSubmitting] = useState(false);
  const [showUrgeModal, setShowUrgeModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (tab === 'list') {
      fetchComplaints();
    } else if (tab === 'stats') {
      fetchStats();
    }
  }, [tab]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const url = searchQuery ? `/complaints?ticket_no=${encodeURIComponent(searchQuery)}` : '/complaints';
      const data = await api.get<Complaint[]>(url);
      setMyComplaints(data);
    } catch (error) {
      console.error('获取诉求列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.get<StatsData>('/complaints/stats');
      setStats(data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaintDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const data = await api.get<Complaint>(`/complaints/${id}`);
      setSelectedComplaint(data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('获取诉求详情失败:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && images.length < 4) {
          setImages([...images, event.target.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await api.post<{ id: number; ticket_no: string; department: string; expected_days: number }>('/complaints', {
        type,
        street,
        content,
        images,
      });
      setSubmitResult(result);
      setShowSuccessModal(true);
      await fetchComplaints();
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUrge = async () => {
    if (!selectedComplaint) return;
    setUrgeSubmitting(true);
    try {
      await api.post(`/complaints/${selectedComplaint.id}/urge`, { reason: urgeReason });
      await fetchComplaintDetail(selectedComplaint.id);
      setShowUrgeModal(false);
      setUrgeReason('');
      alert('催办成功！');
    } catch (error: any) {
      alert(error.message || '催办失败');
    } finally {
      setUrgeSubmitting(false);
    }
  };

  const handleRate = async () => {
    if (!selectedComplaint || rating === 0) return;
    setRatingSubmitting(true);
    try {
      await api.post(`/complaints/${selectedComplaint.id}/rate`, { rating, comment: ratingComment });
      await fetchComplaintDetail(selectedComplaint.id);
      setShowRatingModal(false);
      setRating(0);
      setRatingComment('');
      alert('评价成功！');
    } catch (error: any) {
      alert(error.message || '评价失败');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setStep(0);
    setType('');
    setStreet('');
    setContent('');
    setImages([]);
    setShowSuccessModal(false);
    setSubmitResult(null);
    setTab('list');
  };

  const canProceed = () => {
    switch (step) {
      case 0: return !!type;
      case 1: return !!street;
      case 2: return content.length >= 10;
      default: return true;
    }
  };

  const isOverdue = (complaint: Complaint) => {
    const created = new Date(complaint.created_at).getTime();
    const now = Date.now();
    const days = (now - created) / (1000 * 60 * 60 * 24);
    return days > complaint.expected_days && !['completed', 'closed'].includes(complaint.status);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {stepTitles.map((title, index) => (
        <div key={index} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                index < step
                  ? 'bg-primary text-white'
                  : index === step
                  ? 'bg-primary text-white ring-4 ring-primary/20'
                  : 'bg-warm-100 text-warm-500'
              }`}
            >
              {index < step ? <Check className="w-5 h-5" /> : index + 1}
            </div>
            <span
              className={`mt-2 text-xs font-medium ${
                index <= step ? 'text-primary' : 'text-warm-400'
              }`}
            >
              {title}
            </span>
          </div>
          {index < stepTitles.length - 1 && (
            <div
              className={`w-16 h-1 mx-2 rounded ${
                index < step ? 'bg-primary' : 'bg-warm-100'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderSubmitForm = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {renderStepIndicator()}

      <div className="min-h-[300px]">
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-warm-800 mb-4">请选择诉求类型</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {complaintTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    type === t
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-warm-200 hover:border-primary/50 text-warm-700'
                  }`}
                >
                  <p className="font-medium">{t}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-warm-800 mb-4">请选择所在区域</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {streets.map((s) => (
                <button
                  key={s}
                  onClick={() => setStreet(s)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    street === s
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-warm-200 hover:border-primary/50 text-warm-700'
                  }`}
                >
                  <MapPin className="w-4 h-4 mb-1" />
                  <p className="text-sm font-medium">{s}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-warm-800 mb-4">请详细描述您的诉求</h3>
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder="请详细描述您遇到的问题或建议，包括具体位置、发生时间、相关情况等（不少于10字）..."
                className="w-full px-4 py-3 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              <p className={`text-xs mt-1 ${content.length >= 10 ? 'text-green-600' : 'text-warm-400'}`}>
                已输入 {content.length} 字，{content.length >= 10 ? '✓ 满足要求' : '至少需要10字'}
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-warm-800 mb-4">上传图片（可选，最多4张）</h3>
            <div className="grid grid-cols-4 gap-3">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-warm-200">
                  <img src={img} alt={`图片${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {images.length < 4 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-warm-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                  <Upload className="w-8 h-8 text-warm-400" />
                  <span className="text-xs text-warm-500 mt-1">添加图片</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-warm-400">支持 JPG、PNG 格式，单张图片不超过 5MB</p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-warm-800 mb-4">确认提交信息</h3>
            <div className="bg-warm-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-warm-500 w-20">诉求类型：</span>
                <span className="text-sm font-medium text-warm-800">{type}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-warm-500 w-20">所在区域：</span>
                <span className="text-sm font-medium text-warm-800 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{street}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-sm text-warm-500 w-20 flex-shrink-0">诉求内容：</span>
                <span className="text-sm text-warm-800">{content}</span>
              </div>
              {images.length > 0 && (
                <div className="flex items-start gap-3">
                  <span className="text-sm text-warm-500 w-20 flex-shrink-0">上传图片：</span>
                  <div className="flex gap-2">
                    {images.map((img, index) => (
                      <div key={index} className="w-12 h-12 rounded overflow-hidden border border-warm-200">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">提交须知</p>
                  <p className="text-xs text-blue-600 mt-1">
                    您提交的诉求将自动分拨至相关部门处理，请确保所填信息真实有效。
                    我们将在规定时间内处理并回复您的诉求。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8 pt-6 border-t border-warm-100">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
            step === 0 ? 'opacity-0 cursor-default' : 'bg-warm-100 text-warm-700 hover:bg-warm-200'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          上一步
        </button>

        {step < stepTitles.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一步
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-2.5 bg-accent text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-accent-light disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {submitting ? '提交中...' : '确认提交'}
          </button>
        )}
      </div>
    </div>
  );

  const renderComplaintCard = (complaint: Complaint) => {
    const st = statusMap[complaint.status] || statusMap.pending;
    const StatusIcon = st.icon;
    const overdue = isOverdue(complaint);

    return (
      <div
        key={complaint.id}
        className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => fetchComplaintDetail(complaint.id)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-warm-100 text-warm-600 px-2 py-0.5 rounded">
              {complaint.type}
            </span>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
              {complaint.street}
            </span>
            {overdue && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                超时
              </span>
            )}
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 border ${st.color}`}>
            <StatusIcon className="w-3 h-3" />
            {st.label}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-3.5 h-3.5 text-warm-400" />
          <span className="text-xs font-mono text-warm-500">{complaint.ticket_no}</span>
        </div>

        <p className="text-sm text-warm-700 mb-3 line-clamp-2">{complaint.content}</p>

        <div className="flex items-center justify-between text-xs text-warm-400">
          <div className="flex items-center gap-1">
            <Building className="w-3 h-3" />
            <span>{complaint.department}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{complaint.created_at.slice(0, 10)}</span>
          </div>
        </div>

        {complaint.images && complaint.images.length > 0 && (
          <div className="flex gap-1 mt-3">
            {complaint.images.slice(0, 3).map((img, index) => (
              <div key={index} className="w-12 h-12 rounded overflow-hidden border border-warm-200">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            {complaint.images.length > 3 && (
              <div className="w-12 h-12 rounded bg-warm-100 flex items-center justify-center text-xs text-warm-500">
                +{complaint.images.length - 3}
              </div>
            )}
          </div>
        )}

        {complaint.rating && (
          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-warm-100">
            <span className="text-xs text-warm-500">您的评价：</span>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${i < complaint.rating ? 'text-yellow-500 fill-yellow-500' : 'text-warm-300'}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderList = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="输入工单编号查询..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          onClick={fetchComplaints}
          className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light"
        >
          查询
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-warm-500">加载中...</div>
      ) : myComplaints.length === 0 ? (
        <div className="text-center py-12 text-warm-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-warm-300" />
          <p>暂无诉求记录</p>
        </div>
      ) : (
        myComplaints.map(renderComplaintCard)
      )}
    </div>
  );

  const renderStats = () => {
    if (!stats) {
      return <div className="text-center py-12 text-warm-500">{loading ? '加载中...' : '暂无数据'}</div>;
    }

    const statusData = [
      { name: '待处理', value: stats.pending, color: '#F59E0B' },
      { name: '处理中', value: stats.processing, color: '#3B82F6' },
      { name: '已回复', value: stats.replied, color: '#10B981' },
      { name: '已完成', value: stats.completed, color: '#059669' },
    ];

    const typeChartData = stats.byType.map((item) => ({
      name: item.type,
      总数: item.count,
      已解决: item.resolved,
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-xs text-warm-500 mb-1">总诉求数</p>
            <p className="text-2xl font-bold text-warm-800">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-xs text-warm-500 mb-1">已解决</p>
            <p className="text-2xl font-bold text-green-600">{stats.replied + stats.completed}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-xs text-warm-500 mb-1">解决率</p>
            <p className="text-2xl font-bold text-primary">{stats.resolutionRate}%</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-xs text-warm-500 mb-1">平均评分</p>
            <p className="text-2xl font-bold text-yellow-600 flex items-center gap-1">
              {stats.avgRating.toFixed(1)}
              <Star className="w-5 h-5 fill-yellow-500" />
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h3 className="text-sm font-medium text-warm-800 mb-4">状态分布</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData.filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-5">
            <h3 className="text-sm font-medium text-warm-800 mb-4">分类统计</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="总数" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="已解决" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <h3 className="text-sm font-medium text-warm-800 mb-4">各类型处理率</h3>
          <div className="space-y-3">
            {stats.byType.map((item, index) => (
              <div key={item.type}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-warm-700">{item.type}</span>
                  <span className="text-warm-500">
                    {item.resolved}/{item.count} ({item.count > 0 ? Math.round((item.resolved / item.count) * 100) : 0}%)
                  </span>
                </div>
                <div className="h-2 bg-warm-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${item.count > 0 ? (item.resolved / item.count) * 100 : 0}%`,
                      backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDetailModal = () => {
    if (!selectedComplaint) return null;

    const st = statusMap[selectedComplaint.status] || statusMap.pending;
    const StatusIcon = st.icon;
    const overdue = isOverdue(selectedComplaint);

    return (
      <>
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setShowDetailModal(false)}
        />
        <div className="fixed inset-x-4 top-4 bottom-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl md:top-8 md:bottom-8 bg-white rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-warm-100">
            <h2 className="text-lg font-bold text-warm-800">诉求详情</h2>
            <button
              onClick={() => setShowDetailModal(false)}
              className="w-8 h-8 rounded-full hover:bg-warm-100 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-warm-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {detailLoading ? (
              <div className="text-center py-12 text-warm-500">加载中...</div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm bg-warm-100 text-warm-600 px-2.5 py-1 rounded">
                        {selectedComplaint.type}
                      </span>
                      <span className="text-sm bg-primary/10 text-primary px-2.5 py-1 rounded">
                        {selectedComplaint.street}
                      </span>
                      {overdue && (
                        <span className="text-sm bg-red-100 text-red-600 px-2.5 py-1 rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          超时
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm px-3 py-1 rounded-full font-medium flex items-center gap-1 border ${st.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {st.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-warm-500 mb-1">
                      <FileText className="w-3.5 h-3.5" />
                      工单编号
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-warm-800">
                        {selectedComplaint.ticket_no}
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedComplaint.ticket_no)}
                        className="text-primary hover:text-primary-light"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-warm-50 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-medium text-warm-800">诉求内容</h4>
                  <p className="text-sm text-warm-700 leading-relaxed">{selectedComplaint.content}</p>
                  {selectedComplaint.images && selectedComplaint.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {selectedComplaint.images.map((img, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden border border-warm-200">
                          <img src={img} alt={`图片${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-xs text-blue-600 mb-1">
                      <Building className="w-4 h-4" />
                      处理部门
                    </div>
                    <p className="text-sm font-medium text-blue-800">{selectedComplaint.department}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-xs text-green-600 mb-1">
                      <Clock className="w-4 h-4" />
                      预计处理
                    </div>
                    <p className="text-sm font-medium text-green-800">{selectedComplaint.expected_days} 个工作日</p>
                  </div>
                </div>

                {selectedComplaint.reply && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                      <CheckCircle2 className="w-5 h-5" />
                      官方回复
                    </div>
                    <p className="text-sm text-green-800 leading-relaxed">{selectedComplaint.reply}</p>
                    <p className="text-xs text-green-600 mt-2">
                      回复时间：{formatDate(selectedComplaint.updated_at)}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-warm-800 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    处理进度时间线
                  </h4>
                  <div className="relative pl-6 space-y-4">
                    {selectedComplaint.history?.map((item, index) => {
                      const isLast = index === (selectedComplaint.history?.length || 0) - 1;
                      const itemSt = statusMap[item.status] || statusMap.pending;
                      const ItemIcon = itemSt.icon;
                      return (
                        <div key={item.id} className="relative">
                          <div
                            className={`absolute -left-6 w-8 h-8 rounded-full flex items-center justify-center ${
                              isLast ? 'bg-primary text-white' : 'bg-warm-100 text-warm-500'
                            }`}
                          >
                            <ItemIcon className="w-4 h-4" />
                          </div>
                          {!isLast && (
                            <div className="absolute -left-[22px] top-8 bottom-0 w-0.5 bg-warm-200" />
                          )}
                          <div className="bg-warm-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs px-2 py-0.5 rounded ${itemSt.color}`}>
                                {itemSt.label}
                              </span>
                              <span className="text-xs text-warm-400">{formatDate(item.created_at)}</span>
                            </div>
                            <p className="text-sm text-warm-700">{item.comment}</p>
                            {item.department && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-warm-500">
                                <Building className="w-3 h-3" />
                                {item.department}
                                {item.handler_name && (
                                  <>
                                    <span className="mx-1">·</span>
                                    <User className="w-3 h-3" />
                                    {item.handler_name}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedComplaint.urges && selectedComplaint.urges.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-orange-800 mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      催办记录 ({selectedComplaint.urge_count} 次)
                    </h4>
                    {selectedComplaint.urges.map((urge) => (
                      <div key={urge.id} className="text-sm text-orange-700 mb-2 last:mb-0">
                        <span className="text-xs text-orange-500">{formatDate(urge.created_at)}</span>
                        {urge.reason && <p className="mt-1">{urge.reason}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {selectedComplaint.rating && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-2">
                      <Star className="w-4 h-4 fill-yellow-500" />
                      您的评价
                    </h4>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${i < selectedComplaint.rating ? 'text-yellow-500 fill-yellow-500' : 'text-warm-300'}`}
                        />
                      ))}
                      <span className="text-sm text-yellow-800 ml-2">{selectedComplaint.rating} 星</span>
                    </div>
                    {selectedComplaint.rating_comment && (
                      <p className="text-sm text-yellow-700">{selectedComplaint.rating_comment}</p>
                    )}
                    <p className="text-xs text-yellow-600 mt-2">
                      评价时间：{formatDate(selectedComplaint.rated_at!)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-warm-100 flex gap-3">
            {!['completed', 'closed'].includes(selectedComplaint.status) && (
              <button
                onClick={() => setShowUrgeModal(true)}
                className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-orange-600"
              >
                <Zap className="w-4 h-4" />
                催办
              </button>
            )}
            {selectedComplaint.status === 'replied' && !selectedComplaint.rating && (
              <button
                onClick={() => {
                  setRating(0);
                  setRatingComment('');
                  setShowRatingModal(true);
                }}
                className="flex-1 py-2.5 bg-accent text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-accent-light"
              >
                <Star className="w-4 h-4" />
                评价
              </button>
            )}
            <button
              onClick={() => setShowDetailModal(false)}
              className="px-6 py-2.5 bg-warm-100 text-warm-700 rounded-lg text-sm font-medium hover:bg-warm-200"
            >
              关闭
            </button>
          </div>
        </div>
      </>
    );
  };

  const renderUrgeModal = () => (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => setShowUrgeModal(false)}
      />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-white rounded-xl shadow-2xl z-50 p-6">
        <h3 className="text-lg font-bold text-warm-800 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-500" />
          提交催办
        </h3>
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-700">
              催办须知：
            </p>
            <ul className="text-xs text-orange-600 mt-1 space-y-1">
              <li>• 诉求提交未满24小时不能催办</li>
              <li>• 24小时内只能催办一次</li>
              <li>• 恶意催办可能会被限制使用</li>
            </ul>
          </div>
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">催办原因（可选）</label>
            <textarea
              value={urgeReason}
              onChange={(e) => setUrgeReason(e.target.value)}
              rows={3}
              placeholder="请简要说明催办原因..."
              className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowUrgeModal(false)}
              className="flex-1 py-2.5 bg-warm-100 text-warm-700 rounded-lg text-sm font-medium hover:bg-warm-200"
            >
              取消
            </button>
            <button
              onClick={handleUrge}
              disabled={urgeSubmitting}
              className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
            >
              {urgeSubmitting ? '提交中...' : '确认催办'}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  const renderRatingModal = () => (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => setShowRatingModal(false)}
      />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-white rounded-xl shadow-2xl z-50 p-6">
        <h3 className="text-lg font-bold text-warm-800 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          满意度评价
        </h3>
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-warm-600 mb-3">请对本次处理结果进行评价</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= rating
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-warm-300 hover:text-yellow-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-warm-500 mt-2">
              {rating === 1 && '非常不满意'}
              {rating === 2 && '不满意'}
              {rating === 3 && '一般'}
              {rating === 4 && '满意'}
              {rating === 5 && '非常满意'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">评价建议（可选）</label>
            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              rows={3}
              placeholder="请分享您的建议或意见..."
              className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowRatingModal(false)}
              className="flex-1 py-2.5 bg-warm-100 text-warm-700 rounded-lg text-sm font-medium hover:bg-warm-200"
            >
              取消
            </button>
            <button
              onClick={handleRate}
              disabled={rating === 0 || ratingSubmitting}
              className="flex-1 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-light disabled:opacity-50"
            >
              {ratingSubmitting ? '提交中...' : '提交评价'}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  const renderSuccessModal = () => {
    if (!submitResult) return null;

    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-50" />
        <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-white rounded-xl shadow-2xl z-50 p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-warm-800 mb-2">提交成功！</h3>
          <p className="text-sm text-warm-600 mb-4">您的诉求已提交，请保存好工单编号</p>

          <div className="bg-warm-50 rounded-lg p-4 mb-4 text-left">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-warm-500">工单编号</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-primary">{submitResult.ticket_no}</span>
                <button
                  onClick={() => copyToClipboard(submitResult.ticket_no)}
                  className="text-primary hover:text-primary-light"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-warm-500">处理部门</span>
              <span className="text-sm font-medium text-warm-800">{submitResult.department}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-warm-500">预计处理时间</span>
              <span className="text-sm font-medium text-green-600">{submitResult.expected_days} 个工作日</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-left">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">自动分拨提示</p>
                <p className="text-xs text-blue-600 mt-1">
                  您的诉求已自动分拨至 {submitResult.department} 处理。
                  您可以在"我的诉求"中查看处理进度，或使用工单编号查询。
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setStep(0);
                setType('');
                setStreet('');
                setContent('');
                setImages([]);
                setShowSuccessModal(false);
                setSubmitResult(null);
              }}
              className="flex-1 py-2.5 bg-warm-100 text-warm-700 rounded-lg text-sm font-medium hover:bg-warm-200"
            >
              继续提交
            </button>
            <button
              onClick={resetForm}
              className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light"
            >
              查看我的诉求
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-serif-cn text-2xl font-bold text-warm-800 mb-6 flex items-center gap-2">
        <MessageSquare className="w-6 h-6 text-primary" />
        市民诉求
      </h1>

      <div className="flex gap-1 mb-6 bg-warm-100 p-1 rounded-lg">
        <button
          onClick={() => setTab('submit')}
          className={`flex-1 px-5 py-2.5 rounded-md text-sm font-medium flex items-center justify-center gap-2 ${
            tab === 'submit' ? 'bg-white text-primary shadow-sm' : 'text-warm-600 hover:text-warm-800'
          }`}
        >
          <Send className="w-4 h-4" />
          提交诉求
        </button>
        <button
          onClick={() => setTab('list')}
          className={`flex-1 px-5 py-2.5 rounded-md text-sm font-medium flex items-center justify-center gap-2 ${
            tab === 'list' ? 'bg-white text-primary shadow-sm' : 'text-warm-600 hover:text-warm-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          我的诉求
        </button>
        <button
          onClick={() => setTab('stats')}
          className={`flex-1 px-5 py-2.5 rounded-md text-sm font-medium flex items-center justify-center gap-2 ${
            tab === 'stats' ? 'bg-white text-primary shadow-sm' : 'text-warm-600 hover:text-warm-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          统计分析
        </button>
      </div>

      {tab === 'submit' && renderSubmitForm()}
      {tab === 'list' && renderList()}
      {tab === 'stats' && renderStats()}

      {showDetailModal && renderDetailModal()}
      {showUrgeModal && renderUrgeModal()}
      {showRatingModal && renderRatingModal()}
      {showSuccessModal && renderSuccessModal()}
    </div>
  );
}
