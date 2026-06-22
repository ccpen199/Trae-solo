import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  User,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  Star,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import WorkOrderTimeline, { type TimelineEvent } from '@/components/WorkOrderTimeline';
import { type WorkOrderStatus, type WorkOrderItem, statusConfig, priorityConfig } from './WorkOrderList';
import { normalizeTimeline, normalizeWorkOrderItem, unwrapApiData } from '@/lib/api';

interface WorkOrderDetailData extends WorkOrderItem {
  orderNo?: string;
  contactName: string;
  contactPhone: string;
  contactAddress: string;
  images: string[];
  timeline: TimelineEvent[];
  handlerInfo?: {
    name: string;
    department: string;
    phone: string;
  };
  reply?: string;
}

const statusC: Record<WorkOrderStatus, { label: string; icon: any; bg: string; text: string; dot: string }> = statusConfig;
const priorityC = priorityConfig;

const mockDetail: WorkOrderDetailData = {
  id: 'WO202506200001',
  title: '亭湖区青年中路路灯不亮',
  description: '青年中路与解放南路交叉口向东约50米处，路灯连续3天不亮，影响夜间出行安全。希望相关部门尽快维修处理。',
  category: '城市管理',
  status: 'processing',
  priority: 'high',
  createTime: '2025-06-20 09:15',
  updateTime: '2025-06-20 14:30',
  handler: '城管局张工',
  expectedDays: 3,
  contactName: '张**',
  contactPhone: '138****1234',
  contactAddress: '亭湖区青年中路XX小区',
  images: [
    'https://picsum.photos/seed/wo1/600/400',
    'https://picsum.photos/seed/wo2/600/400',
  ],
  handlerInfo: {
    name: '张工',
    department: '盐城市城管局市政管理处',
    phone: '0515-12345678',
  },
  reply: '您好，您反映的问题已收悉。我处已安排维修人员前往现场查看，预计今晚之前完成修复。感谢您对城市管理工作的关注和支持！',
  timeline: [
    { id: 't1', status: 'submitted', title: '诉求已提交', description: '您的工单已成功提交至平台，系统已自动分派', time: '2025-06-20 09:15', operator: '系统' },
    { id: 't2', status: 'assigned', title: '工单已派单', description: '已分派至盐城市城管局市政管理处处理', time: '2025-06-20 09:30', operator: '平台管理员' },
    { id: 't3', status: 'processing', title: '处理中', description: '维修人员已前往现场查看，正在进行抢修作业', time: '2025-06-20 14:30', operator: '城管局张工' },
  ],
};

export default function WorkOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<WorkOrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showRateForm, setShowRateForm] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/workorders/${id}`);
        if (res.ok) {
          const payload = await res.json() as any;
          const order = unwrapApiData<any>(payload);
          if (order) {
            const base = normalizeWorkOrderItem(order);
            const timeline = Array.isArray(order.progress) ? normalizeTimeline(order.progress) : [];

            setDetail({
              ...base,
              orderNo: order.orderNo,
              contactName: '线上提交用户',
              contactPhone: '隐私保护',
              contactAddress: '平台在线提交',
              images: Array.isArray(order.images) ? order.images : [],
              timeline,
              handlerInfo: order.responsibleDept ? {
                name: order.responsibleDept,
                department: order.responsibleDept,
                phone: '12345',
              } : undefined,
              reply: timeline.length > 0 ? '工单正在按流程处理，请以最新进度为准。' : undefined,
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="card p-8 animate-pulse">
          <div className="h-8 bg-gray-100 rounded w-1/2 mb-6" />
          <div className="space-y-4">
            <div className="h-4 bg-gray-100 rounded" />
            <div className="h-4 bg-gray-100 rounded w-5/6" />
            <div className="h-4 bg-gray-100 rounded w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ClipboardList className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 mb-4">工单不存在</p>
        <Link to="/workorders" className="btn-primary">
          <ChevronLeft className="w-4 h-4" /> 返回工单列表
        </Link>
      </div>
    );
  }

  const status = statusC[detail.status];
  const priority = priorityC[detail.priority];
  const StatusIcon = status.icon;
  const canRate = detail.status === 'completed';

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-gov-600 transition-colors">首页</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/workorders" className="hover:text-gov-600 transition-colors">工单中心</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-800 font-medium">工单详情</span>
      </nav>

      <Link to="/workorders" className="inline-flex items-center gap-1 text-sm text-gov-600 hover:text-gov-700 mb-6 font-medium">
        <ChevronLeft className="w-4 h-4" /> 返回工单列表
      </Link>

      <div className="card p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className={cn('chip', status.bg, status.text)}>
                <StatusIcon className="w-3.5 h-3.5 mr-1" />
                {status.label}
              </span>
              <span className={cn('chip bg-gray-100', priority.color)}>
                {priority.label}优先级
              </span>
              <span className="chip bg-gov-100 text-gov-700">{detail.category}</span>
            </div>
            <h1 className="font-serif text-xl md:text-2xl font-bold text-gray-900">
              {detail.title}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">工单编号</p>
            <p className="font-mono font-semibold text-gov-700">{detail.orderNo || detail.id}</p>
          </div>
        </div>

        <div className="py-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">诉求内容</h3>
          <p className="text-gray-700 leading-relaxed">{detail.description}</p>
          {detail.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {detail.images.map((img, idx) => (
                <div key={idx} className="aspect-video rounded-xl overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 pt-6 border-t border-gray-100 text-sm">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">提交人：</span>
            <span className="text-gray-800">{detail.contactName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">电话：</span>
            <span className="text-gray-800">{detail.contactPhone}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">地址：</span>
            <span className="text-gray-800">{detail.contactAddress}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 pt-6 mt-6 border-t border-gray-100 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">提交时间：</span>
            <span className="text-gray-800">{detail.createTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">更新时间：</span>
            <span className="text-gray-800">{detail.updateTime}</span>
          </div>
        </div>
      </div>

      {detail.handlerInfo && (
        <div className="card p-6 mb-6 bg-gradient-to-r from-gov-50 to-white">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-gov-600" />
            处理人员
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gov-400 to-gov-600 flex items-center justify-center text-white text-xl font-bold">
              {detail.handlerInfo.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{detail.handlerInfo.name}</p>
              <p className="text-sm text-gray-500">{detail.handlerInfo.department}</p>
            </div>
            <a
              href={`tel:${detail.handlerInfo.phone}`}
              className="btn-primary !py-2 !px-4 text-sm"
            >
              <Phone className="w-4 h-4" />
              联系TA
            </a>
          </div>
        </div>
      )}

      {detail.reply && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gov-600" />
            部门回复
          </h3>
          <div className="p-4 rounded-xl bg-gov-50 border border-gov-100">
            <p className="text-gray-700 leading-relaxed">{detail.reply}</p>
          </div>
        </div>
      )}

      <div className="card p-6 md:p-8 mb-6">
        <h3 className="font-serif text-lg font-bold text-gov-800 mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gov-600" />
          办理进度
        </h3>
        <WorkOrderTimeline events={detail.timeline} />
      </div>

      {canRate && !showRateForm && (
        <div className="card p-6 bg-gradient-to-r from-warm-50 to-white border border-warm-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Star className="w-5 h-5 text-warm-500" fill="currentColor" />
                服务评价
              </h3>
              <p className="text-sm text-gray-500 mt-1">您的评价是我们改进服务的动力</p>
            </div>
            <button onClick={() => setShowRateForm(true)} className="btn-warm">
              立即评价
            </button>
          </div>
        </div>
      )}

      {showRateForm && (
        <div className="card p-6 md:p-8 animate-fade-in-up">
          <h3 className="font-serif text-lg font-bold text-gov-800 mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-warm-500" />
            服务评价
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">满意度评分</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn('w-8 h-8 transition-colors',
                        s <= rating ? 'text-warm-500' : 'text-gray-200',
                      )}
                      fill={s <= rating ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
                <span className="ml-3 text-sm text-gray-500">
                  {rating === 1 && '非常不满意'}
                  {rating === 2 && '不满意'}
                  {rating === 3 && '一般'}
                  {rating === 4 && '满意'}
                  {rating === 5 && '非常满意'}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">评价建议（选填）</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="您的建议将帮助我们不断改进服务..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gov-400 focus:ring-2 focus:ring-gov-100 outline-none transition-all resize-none"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowRateForm(false)} className="btn-secondary">
                取消
              </button>
              <button
                onClick={() => {
                  setShowRateForm(false);
                }}
                disabled={rating === 0}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-5 h-5" />
                提交评价
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
