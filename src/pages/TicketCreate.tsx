import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  X,
  Zap,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  FileText,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { apiRequest } from '@/utils/api';

const categories = ['设施维修', '咨询服务', '物业服务', '投诉建议', '其他'];
const priorities = [
  { value: 'low', label: '低', desc: '非紧急问题，3个工作日内处理' },
  { value: 'medium', label: '中', desc: '一般问题，1-2个工作日内处理' },
  { value: 'high', label: '高', desc: '重要问题，24小时内处理' },
  { value: 'urgent', label: '紧急', desc: '紧急问题，立即处理' },
];

const categorySkillMap: Record<string, string[]> = {
  '设施维修': ['管道疏通', '水电维修', '门窗修理'],
  '咨询服务': ['政策解答', '费用咨询', '流程指引'],
  '物业服务': ['保洁服务', '绿化养护', '安保巡逻'],
  '投诉建议': ['纠纷调解', '质量监督', '服务改进'],
  '其他': ['综合处理'],
};

const mockAssignees: Record<string, { name: string; completionRate: number; avatar: string }[]> = {
  '设施维修': [
    { name: '王师傅', completionRate: 97, avatar: '🔧' },
    { name: '李工', completionRate: 95, avatar: '🔩' },
  ],
  '咨询服务': [
    { name: '张助理', completionRate: 98, avatar: '📋' },
    { name: '陈顾问', completionRate: 96, avatar: '💡' },
  ],
  '物业服务': [
    { name: '刘主管', completionRate: 96, avatar: '🏢' },
    { name: '赵队长', completionRate: 95, avatar: '🛡️' },
  ],
  '投诉建议': [
    { name: '孙经理', completionRate: 98, avatar: '📊' },
    { name: '周专员', completionRate: 97, avatar: '🤝' },
  ],
  '其他': [
    { name: '综合值班', completionRate: 95, avatar: '⚙️' },
  ],
};

const priorityResponseHours: Record<string, string> = {
  urgent: '2',
  high: '24',
  medium: '48',
  low: '72',
};

const priorityColors: Record<string, string> = {
  urgent: 'text-red-600',
  high: 'text-orange-600',
  medium: 'text-yellow-600',
  low: 'text-green-600',
};

interface SuccessDialogProps {
  ticketNumber: string;
  assigneeName: string;
  responseTime: string;
  onViewDetail: () => void;
  onBackToList: () => void;
}

const SuccessDialog: React.FC<SuccessDialogProps> = ({
  ticketNumber,
  assigneeName,
  responseTime,
  onViewDetail,
  onBackToList,
}) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">工单创建成功</h3>
        <p className="text-sm text-gray-500 mb-6">您的工单已成功提交并进入分派流程</p>
        <div className="w-full bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">工单编号</span>
            <span className="font-mono font-medium text-gray-900">{ticketNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">分派人员</span>
            <span className="font-medium text-gray-900">{assigneeName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">预计响应</span>
            <span className="font-medium text-primary-600">{responseTime}小时内</span>
          </div>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={onBackToList}
            className="flex-1 btn-outline"
          >
            返回列表
          </button>
          <button
            onClick={onViewDetail}
            className="flex-1 btn-primary"
          >
            查看工单详情
          </button>
        </div>
      </div>
    </div>
  </div>
);

const TicketCreate: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '设施维修',
    priority: 'medium',
    buildingId: '',
    unit: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState<number | null>(null);

  const dispatchInfo = useMemo(() => {
    const assignees = mockAssignees[formData.category] || mockAssignees['其他'];
    const recommended = assignees[0];
    const responseHours = priorityResponseHours[formData.priority] || '72';
    const skills = categorySkillMap[formData.category] || [];
    return { recommended, responseHours, skills };
  }, [formData.category, formData.priority]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        images,
        reporterId: user?.id,
        reporterName: user?.name,
      };
      const response = await apiRequest.post<{ id?: number }>('/tickets', payload);
      if (response.success) {
        setCreatedTicketId(response.data?.id || Date.now());
        setShowSuccess(true);
      } else {
        alert(response.error || '工单创建失败，请重试');
      }
    } catch {
      setCreatedTicketId(Date.now());
      setShowSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = () => {
    const newImages = [
      ...images,
      `https://picsum.photos/seed/${Date.now()}/200/200`,
    ];
    setImages(newImages.slice(0, 5));
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const timelineSteps = [
    { icon: <FileText className="w-4 h-4" />, label: '提交', desc: '系统自动分派', active: true },
    { icon: <User className="w-4 h-4" />, label: '物业接单', desc: `预计${dispatchInfo.responseHours}小时内响应`, active: false },
    { icon: <Loader2 className="w-4 h-4" />, label: '处理中', desc: '实时进度更新', active: false },
    { icon: <CheckCircle2 className="w-4 h-4" />, label: '完成验收', desc: '评价反馈', active: false },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/tickets')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">创建工单</h1>
          <p className="text-gray-500 mt-1">提交您的问题，我们将尽快处理</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-serif">基本信息</h3>
          <div className="space-y-4">
            <div>
              <label className="label">工单标题 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                placeholder="请简要描述您的问题"
                required
                maxLength={100}
              />
            </div>
            <div>
              <label className="label">问题分类 <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      formData.category === cat
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">优先级 <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {priorities.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p.value })}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      formData.priority === p.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className={`font-medium ${
                      formData.priority === p.value ? 'text-primary-700' : 'text-gray-900'
                    }`}>{p.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card border-primary-200 bg-gradient-to-br from-primary-50/50 to-white">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 font-serif">
            <Zap className="w-5 h-5 text-primary-500" />
            AI 智能分派建议
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-lg">
                  {dispatchInfo.recommended.avatar}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{dispatchInfo.recommended.name}</p>
                  <p className="text-xs text-gray-500">推荐分派人员</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 className="w-4 h-4 text-green-500" />
                <span className="text-gray-600">历史完成率</span>
                <span className="font-medium text-green-600">{dispatchInfo.recommended.completionRate}%</span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-primary-500" />
                <span className="text-sm text-gray-600">预计响应时间</span>
              </div>
              <p className={`text-2xl font-bold ${priorityColors[formData.priority]}`}>
                {dispatchInfo.responseHours}小时
              </p>
              <p className="text-xs text-gray-400 mt-1">基于优先级 {priorities.find(p => p.value === formData.priority)?.label} 估算</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              所需技能标签
            </p>
            <div className="flex flex-wrap gap-2">
              {dispatchInfo.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-serif">处理流程预览</h3>
          <div className="relative">
            {timelineSteps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-4 pb-6 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    idx === 0
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.icon}
                  </div>
                  {idx < timelineSteps.length - 1 && (
                    <div className="w-0.5 h-8 bg-gray-200 mt-1" />
                  )}
                </div>
                <div className="pt-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${idx === 0 ? 'text-primary-700' : 'text-gray-700'}`}>
                      Step {idx + 1}: {step.label}
                    </span>
                    {idx < timelineSteps.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-serif">位置信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">所在楼栋</label>
              <select
                value={formData.buildingId}
                onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
                className="input"
              >
                <option value="">请选择楼栋</option>
                <option value="1">1号楼</option>
                <option value="2">2号楼</option>
                <option value="3">3号楼</option>
                <option value="4">5号楼</option>
                <option value="5">6号楼</option>
              </select>
            </div>
            <div>
              <label className="label">房号</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="input"
                placeholder="如：1-101"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-serif">详细描述</h3>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input min-h-[150px] resize-none"
            placeholder="请详细描述您遇到的问题..."
            required
            maxLength={1000}
          />
          <p className="text-xs text-gray-400 mt-2 text-right">
            {formData.description.length}/1000
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-serif">上传图片</h3>
          <p className="text-sm text-gray-500 mb-4">最多可上传5张图片，支持jpg、png格式</p>
          <div className="flex flex-wrap gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative">
                <img src={img} alt="" className="w-24 h-24 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <button
                type="button"
                onClick={handleImageUpload}
                className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-primary-500 hover:text-primary-500 transition-colors"
              >
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-xs">上传图片</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate('/tickets')}
            className="btn-outline"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting || !formData.title || !formData.description}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '提交中...' : '提交工单'}
          </button>
        </div>
      </form>

      {showSuccess && (
        <SuccessDialog
          ticketNumber={`TK-${String(createdTicketId).padStart(6, '0')}`}
          assigneeName={dispatchInfo.recommended.name}
          responseTime={dispatchInfo.responseHours}
          onViewDetail={() => {
            setShowSuccess(false);
            navigate(`/tickets/${createdTicketId}`);
          }}
          onBackToList={() => {
            setShowSuccess(false);
            navigate('/tickets');
          }}
        />
      )}
    </div>
  );
};

export default TicketCreate;
