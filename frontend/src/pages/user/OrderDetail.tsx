import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Star,
  MapPin,
  Package,
  ShoppingBag,
  Send,
  ClipboardList,
  Clock,
  Copy,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Navigation,
  CheckCircle2,
  XCircle,
  Truck,
  History,
  FileSearch,
  HeadphonesIcon,
  Eye,
  ClipboardCheck,
  Gavel,
  Search,
} from 'lucide-react';
import { ORDER_CATEGORIES, ORDER_STATUS } from '../../constants';
import type { OrderCategory, OrderStatus } from '../../types';
import Tag from '../../components/ui/Tag';
import Card from '../../components/ui/Card';

const iconMap: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  ShoppingBag, Send, Package, ClipboardList,
};

const statusSteps: OrderStatus[] = ['pending', 'accepted', 'picked_up', 'delivering', 'completed'];
const statusStepLabels = ['待接单', '已接单', '已取件', '配送中', '已完成'];

const CANCEL_ATTRIBUTION_MAP: Record<string, { label: string; color: string; bgColor: string }> = {
  '不想要了': { label: '用户主观', color: '#7C3AED', bgColor: '#F5F3FF' },
  '信息填错了': { label: '下单信息错误', color: '#2563EB', bgColor: '#EFF6FF' },
  '骑手太慢': { label: '骑手履约问题', color: '#DC2626', bgColor: '#FEF2F2' },
  '找不到骑手': { label: '平台运力不足', color: '#EA580C', bgColor: '#FFF7ED' },
  '其他原因': { label: '其他', color: '#6B7280', bgColor: '#F9FAFB' },
};

const getCancelAttribution = (reason: string) => {
  return CANCEL_ATTRIBUTION_MAP[reason] || CANCEL_ATTRIBUTION_MAP['其他原因'];
};

interface OrderFull {
  id: string;
  orderNo: string;
  category: OrderCategory;
  status: OrderStatus;
  pickupName: string;
  pickupPhone: string;
  pickupAddress: string;
  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
  goodsDescription: string;
  weight: number;
  goodsValue: number;
  remark: string;
  isUrgent: boolean;
  isInsured: boolean;
  tip: number;
  distance: number;
  baseFee: number;
  distanceFee: number;
  weightFee: number;
  urgentFee: number;
  insuredFee: number;
  couponDiscount: number;
  totalAmount: number;
  payMethod: string;
  payStatus: string;
  riderName?: string;
  riderPhone?: string;
  riderRating?: number;
  riderLevel?: string;
  riderVehicle?: string;
  createdAt: string;
  acceptedAt?: string;
  pickedUpAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  cancelBy?: string;
  tracks: { lat: number; lng: number; time: string }[];
  reviewRecords: { label: string; detail: string; time: string; status: 'done' | 'active' | 'pending' }[];
  disputeProgress?: {
    ticketNo: string;
    steps: { label: string; detail?: string; time: string; status: 'done' | 'active' | 'pending' }[];
  };
  manualInterventions: { operator: string; action: string; time: string }[];
}

const orderDelivering: OrderFull = {
  id: '1',
  orderNo: 'SP202406170001',
  category: 'buy',
  status: 'delivering',
  pickupName: '商家',
  pickupPhone: '010-88888888',
  pickupAddress: '北京市朝阳区三里屯SOHO奶茶店',
  deliveryName: '张三',
  deliveryPhone: '138****8888',
  deliveryAddress: '北京市朝阳区望京SOHO T1 1201室',
  goodsDescription: '一杯珍珠奶茶，少糖少冰',
  weight: 0.5,
  goodsValue: 30,
  remark: '到店报手机尾号8888取餐，放前台即可',
  isUrgent: false,
  isInsured: false,
  tip: 2,
  distance: 3.2,
  baseFee: 6,
  distanceFee: 4,
  weightFee: 0,
  urgentFee: 0,
  insuredFee: 0,
  couponDiscount: 0,
  totalAmount: 12,
  payMethod: 'wechat',
  payStatus: 'paid',
  riderName: '李建国',
  riderPhone: '137****5555',
  riderRating: 4.9,
  riderLevel: '黄金骑手',
  riderVehicle: '电动车·京A12345',
  createdAt: '2024-06-17T10:28:00',
  acceptedAt: '2024-06-17T10:32:00',
  pickedUpAt: '2024-06-17T10:45:00',
  tracks: [
    { lat: 39.930, lng: 116.450, time: '10:32' },
    { lat: 39.940, lng: 116.455, time: '10:36' },
    { lat: 39.950, lng: 116.460, time: '10:40' },
    { lat: 39.960, lng: 116.465, time: '10:43' },
    { lat: 39.970, lng: 116.470, time: '10:46' },
    { lat: 39.980, lng: 116.472, time: '10:49' },
    { lat: 39.990, lng: 116.470, time: '10:52' },
  ],
  reviewRecords: [
    { label: '系统自动审核', detail: '下单信息校验通过', time: '10:28', status: 'done' },
    { label: '支付风控校验', detail: '微信支付验证通过', time: '10:28', status: 'done' },
    { label: '派单匹配校验', detail: '骑手李建国接单', time: '10:32', status: 'done' },
    { label: '配送过程校验', detail: 'GPS轨迹正常', time: '10:45', status: 'done' },
    { label: '签收确认', detail: '待完成', time: '', status: 'pending' },
  ],
  manualInterventions: [],
};

const orderPending: OrderFull = {
  id: '2',
  orderNo: 'SP202406160002',
  category: 'send',
  status: 'pending',
  pickupName: '张三',
  pickupPhone: '138****8888',
  pickupAddress: '北京市海淀区中关村软件园二期 8号楼',
  deliveryName: '李四',
  deliveryPhone: '139****9999',
  deliveryAddress: '北京市西城区金融街7号英蓝国际金融中心',
  goodsDescription: '合同文件，注意保密',
  weight: 0.3,
  goodsValue: 500,
  remark: '请当面交接，确认收件人身份',
  isUrgent: false,
  isInsured: false,
  tip: 0,
  distance: 12.5,
  baseFee: 8,
  distanceFee: 20,
  weightFee: 0,
  urgentFee: 0,
  insuredFee: 0,
  couponDiscount: 0,
  totalAmount: 28,
  payMethod: 'wechat',
  payStatus: 'unpaid',
  createdAt: '2024-06-16T15:20:00',
  tracks: [],
  reviewRecords: [
    { label: '系统自动审核', detail: '下单信息校验通过', time: '15:20', status: 'done' },
    { label: '支付校验', detail: '等待用户支付', time: '', status: 'pending' },
    { label: '派单匹配', detail: '支付后自动匹配骑手', time: '', status: 'pending' },
  ],
  manualInterventions: [],
};

const orderCompleted: OrderFull = {
  id: '3',
  orderNo: 'SP202406150003',
  category: 'fetch',
  status: 'completed',
  pickupName: '快递柜',
  pickupPhone: '400-123-4567',
  pickupAddress: '北京市朝阳区望京SOHO T3 快递柜B23',
  deliveryName: '张三',
  deliveryPhone: '138****8888',
  deliveryAddress: '北京市朝阳区望京SOHO T1 1201室',
  goodsDescription: '快递包裹',
  weight: 2.5,
  goodsValue: 200,
  remark: '取件码：123456',
  isUrgent: false,
  isInsured: false,
  tip: 0,
  distance: 0.5,
  baseFee: 5,
  distanceFee: 1,
  weightFee: 0,
  urgentFee: 0,
  insuredFee: 0,
  couponDiscount: 0,
  totalAmount: 6,
  payMethod: 'balance',
  payStatus: 'paid',
  riderName: '王小明',
  riderPhone: '136****7777',
  riderRating: 4.8,
  riderLevel: '白银骑手',
  riderVehicle: '电动车·京B67890',
  createdAt: '2024-06-15T09:08:00',
  acceptedAt: '2024-06-15T09:12:00',
  pickedUpAt: '2024-06-15T09:25:00',
  completedAt: '2024-06-15T09:35:00',
  tracks: [
    { lat: 39.992, lng: 116.472, time: '09:12' },
    { lat: 39.991, lng: 116.471, time: '09:15' },
    { lat: 39.990, lng: 116.470, time: '09:20' },
    { lat: 39.989, lng: 116.470, time: '09:25' },
    { lat: 39.989, lng: 116.471, time: '09:28' },
    { lat: 39.989, lng: 116.472, time: '09:32' },
    { lat: 39.990, lng: 116.472, time: '09:35' },
  ],
  reviewRecords: [
    { label: '系统自动审核', detail: '下单信息校验通过', time: '09:08', status: 'done' },
    { label: '支付风控校验', detail: '余额支付验证通过', time: '09:08', status: 'done' },
    { label: '派单匹配校验', detail: '骑手王小明接单', time: '09:12', status: 'done' },
    { label: '配送过程校验', detail: 'GPS轨迹正常', time: '09:25', status: 'done' },
    { label: '签收确认', detail: '本人签收', time: '09:35', status: 'done' },
  ],
  manualInterventions: [],
};

const orderCancelled: OrderFull = {
  id: '4',
  orderNo: 'SP202406140004',
  category: 'errand',
  status: 'cancelled',
  pickupName: '张三',
  pickupPhone: '138****8888',
  pickupAddress: '北京市朝阳区朝阳大悦城',
  deliveryName: '张三',
  deliveryPhone: '138****8888',
  deliveryAddress: '北京市朝阳区朝阳大悦城',
  goodsDescription: '帮忙排队买奶茶',
  weight: 0,
  goodsValue: 0,
  remark: '喜茶，排队人多的话换奈雪也可以',
  isUrgent: false,
  isInsured: false,
  tip: 0,
  distance: 0,
  baseFee: 15,
  distanceFee: 0,
  weightFee: 0,
  urgentFee: 0,
  insuredFee: 0,
  couponDiscount: 0,
  totalAmount: 15,
  payMethod: 'wechat',
  payStatus: 'refunded',
  createdAt: '2024-06-14T14:15:00',
  cancelledAt: '2024-06-14T14:30:00',
  cancelReason: '信息填错了',
  cancelBy: 'user',
  tracks: [],
  reviewRecords: [
    { label: '系统自动审核', detail: '下单信息校验通过', time: '14:15', status: 'done' },
    { label: '支付风控校验', detail: '微信支付验证通过', time: '14:15', status: 'done' },
    { label: '派单匹配校验', detail: '用户取消订单', time: '14:30', status: 'done' },
  ],
  manualInterventions: [],
};

const orderMap: Record<string, OrderFull> = {
  '1': orderDelivering,
  '2': orderPending,
  '3': orderCompleted,
  '4': orderCancelled,
};

const payMethodLabel: Record<string, string> = { wechat: '微信支付', alipay: '支付宝', balance: '余额支付' };
const payStatusLabel: Record<string, { text: string; color: string }> = {
  unpaid: { text: '未支付', color: 'text-red-500' },
  paid: { text: '已支付', color: 'text-green-600' },
  refunded: { text: '已退款', color: 'text-orange-500' },
};

function CopyToast({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] animate-fade-in">
      <div className="bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg flex items-center gap-2">
        <ClipboardCheck className="w-4 h-4 text-green-400" />
        订单号已复制到剪贴板 ✓
      </div>
    </div>
  );
}

function ReviewRecordCard({ records }: { records: OrderFull['reviewRecords'] }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <FileSearch className="w-4 h-4 text-brand-500" />
        <h3 className="font-medium text-gray-800">复查记录</h3>
      </div>
      <div className="space-y-0">
        {records.map((rec, idx) => (
          <div key={idx} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 mt-1 ${
                rec.status === 'done' ? 'bg-green-500 border-green-500' :
                rec.status === 'active' ? 'bg-blue-500 border-blue-500 animate-pulse' :
                'bg-gray-100 border-gray-300'
              }`} />
              {idx < records.length - 1 && (
                <div className={`w-0.5 flex-1 min-h-[20px] my-1 ${
                  rec.status === 'done' ? 'bg-green-300' : 'bg-gray-200'
                }`} />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${
                  rec.status === 'done' ? 'text-gray-800' :
                  rec.status === 'active' ? 'text-blue-600' :
                  'text-gray-400'
                }`}>{rec.label}</span>
                {rec.time && <span className="text-xs text-gray-400">{rec.time}</span>}
              </div>
              <p className={`text-xs mt-0.5 ${
                rec.status === 'done' ? 'text-gray-500' :
                rec.status === 'active' ? 'text-blue-500' :
                'text-gray-300'
              }`}>{rec.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DisputeProgressCard({
  dispute,
  onCopyTicket,
}: {
  dispute: NonNullable<OrderFull['disputeProgress']>;
  onCopyTicket: (text: string) => void;
}) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-orange-500" />
        <h3 className="font-medium text-gray-800">申诉处理进度</h3>
      </div>
      <div className="space-y-0">
        {dispute.steps.map((step, idx) => (
          <div key={idx} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 mt-1 ${
                step.status === 'done' ? 'bg-green-500 border-green-500' :
                step.status === 'active' ? 'bg-blue-500 border-blue-500 animate-pulse' :
                'bg-gray-100 border-gray-300'
              }`} />
              {idx < dispute.steps.length - 1 && (
                <div className={`w-0.5 flex-1 min-h-[20px] my-1 ${
                  step.status === 'done' ? 'bg-green-300' : 'bg-gray-200'
                }`} />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${
                  step.status === 'done' ? 'text-gray-800' :
                  step.status === 'active' ? 'text-blue-600' :
                  'text-gray-400'
                }`}>{step.time && `${step.time} `}{step.label}</span>
              </div>
              {step.detail && (
                <p className={`text-xs mt-0.5 ${
                  step.status === 'active' ? 'text-blue-500' : 'text-gray-500'
                }`}>
                  {step.detail}
                  {step.detail.includes('工单号') && (
                    <button
                      onClick={() => onCopyTicket(dispute.ticketNo)}
                      className="ml-2 text-brand-500 hover:text-brand-600 inline-flex items-center gap-0.5"
                    >
                      <Copy className="w-3 h-3" />复制
                    </button>
                  )}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ManualInterventionCard({ interventions, isActive }: { interventions: OrderFull['manualInterventions']; isActive: boolean }) {
  const hasRecords = interventions.length > 0;
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Gavel className="w-4 h-4 text-brand-500" />
        <h3 className="font-medium text-gray-800">人工干预轨迹</h3>
      </div>
      {!hasRecords && !isActive ? (
        <p className="text-sm text-gray-400">暂无人工干预记录</p>
      ) : (
        <div className="space-y-0">
          {isActive && (
            <div className="flex gap-3 mb-2">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-green-500 flex-shrink-0 mt-1 animate-pulse" />
                {hasRecords && <div className="w-0.5 flex-1 min-h-[20px] my-1 bg-green-300" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-600">系统自动监控中</span>
                </div>
                <p className="text-xs text-green-500 mt-0.5">GPS轨迹正常</p>
              </div>
            </div>
          )}
          {interventions.map((item, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-brand-500 border-2 border-brand-500 flex-shrink-0 mt-1" />
                {idx < interventions.length - 1 && (
                  <div className="w-0.5 flex-1 min-h-[20px] my-1 bg-brand-200" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">{item.operator} — {item.action}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function CancelledOrderCard({ order }: { order: OrderFull }) {
  const attribution = order.cancelReason ? getCancelAttribution(order.cancelReason) : null;
  const refundSteps = [
    { label: '申请提交', done: true },
    { label: '平台审核', done: order.payStatus === 'refunded' },
    { label: '原路退回', done: order.payStatus === 'refunded' },
  ];

  return (
    <>
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="font-medium text-gray-800">订单已取消</span>
          </div>
          <Tag color="red" size="md">已取消</Tag>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500">取消原因：</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white text-gray-600 font-medium border border-gray-200">
            {order.cancelReason || '未知'}
          </span>
        </div>
        {attribution && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-gray-500">异常归因：</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: attribution.bgColor, color: attribution.color }}
            >
              {attribution.label}
            </span>
          </div>
        )}
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-500 mb-3">退款进度</p>
          <div className="flex items-center">
            {refundSteps.map((step, idx) => (
              <div key={step.label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.done ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span className={`text-xs ${step.done ? 'text-gray-700' : 'text-gray-400'}`}>{step.label}</span>
                </div>
                {idx < refundSteps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 -mt-4 ${step.done ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
        {order.cancelledAt && (
          <div className="border-t border-gray-100 pt-3 mt-3">
            <p className="text-xs text-gray-500 mb-2">操作留痕</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-gray-400 w-14">{new Date(order.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-gray-600">用户下单</span>
              </div>
              {order.acceptedAt && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-gray-400 w-14">{new Date(order.acceptedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-gray-600">骑手接单</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-gray-400 w-14">{new Date(order.cancelledAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-gray-600">用户取消订单 — 原因：{order.cancelReason || '未知'}</span>
              </div>
              {order.payStatus === 'refunded' && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-gray-400 w-14">系统</span>
                  <span className="text-gray-600">退款¥{order.totalAmount.toFixed(2)}已原路退回</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function PendingRiderCard() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Search className="w-6 h-6 text-gray-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">正在匹配骑手...</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm text-gray-500">预计3分钟内匹配成功</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PendingTrackCard() {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-500">实时轨迹</span>
        </div>
      </div>
      <div className="relative h-36 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <Clock className="w-8 h-8" />
          <span className="text-sm">等待骑手接单</span>
          <span className="text-xs">支付成功后系统将自动匹配骑手</span>
        </div>
      </div>
    </Card>
  );
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [disputeType, setDisputeType] = useState('timeout');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [copyToastVisible, setCopyToastVisible] = useState(false);

  const order = orderMap[id || '1'] || orderDelivering;
  const catConfig = ORDER_CATEGORIES.find((c) => c.key === order.category);
  const statusConfig = ORDER_STATUS[order.status];
  const currentStepIdx = statusSteps.indexOf(order.status);

  const handleCopy = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopyToastVisible(true);
        setTimeout(() => setCopyToastVisible(false), 3000);
      }).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    setCopyToastVisible(true);
    setTimeout(() => setCopyToastVisible(false), 3000);
  };

  const isActiveOrder = ['accepted', 'picked_up', 'delivering'].includes(order.status);
  const isCancelled = order.status === 'cancelled';
  const isDisputed = order.status === 'disputed';
  const isPending = order.status === 'pending';

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <CopyToast visible={copyToastVisible} />

      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between h-14 px-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-base font-semibold text-gray-900">订单详情</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {isCancelled ? (
          <CancelledOrderCard order={order} />
        ) : (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {catConfig && (() => {
                  const Icon = iconMap[catConfig.iconName];
                  return Icon ? <Icon className="w-5 h-5" style={{ color: catConfig.color }} /> : null;
                })()}
                <span className="font-medium text-gray-800">{catConfig?.name}</span>
              </div>
              <Tag color={isDisputed ? 'red' : order.status === 'completed' ? 'green' : 'blue'} size="md">
                {statusConfig?.name}
              </Tag>
            </div>
            <div className="flex items-center justify-between">
              {statusSteps.map((step, idx) => (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      idx < currentStepIdx ? 'bg-green-500 text-white' :
                      idx === currentStepIdx ? 'bg-brand-500 text-white ring-4 ring-brand-100' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {idx < currentStepIdx ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className={`text-xs font-medium ${idx <= currentStepIdx ? 'text-gray-800' : 'text-gray-400'}`}>
                      {statusStepLabels[idx]}
                    </span>
                  </div>
                  {idx < statusSteps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 -mt-4 ${idx < currentStepIdx ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">订单编号</span>
              <span className="text-sm font-mono font-semibold text-gray-800">{order.orderNo}</span>
            </div>
            <button
              onClick={() => handleCopy(order.orderNo)}
              className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600"
            >
              <Copy className="w-3.5 h-3.5" />复制
            </button>
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              下单时间：{new Date(order.createdAt).toLocaleString('zh-CN')}
            </span>
            {order.acceptedAt && (
              <span>
                接单：{new Date(order.acceptedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {order.riderName ? (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-lg font-bold">
                  {order.riderName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">{order.riderName}</span>
                    <Tag color="yellow" size="sm">{order.riderLevel}</Tag>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm text-gray-600">{order.riderRating}</span>
                    <span className="text-xs text-gray-400 ml-1">{order.riderVehicle}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${order.riderPhone}`}
                  className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center hover:bg-green-100 transition-colors"
                >
                  <Phone className="w-5 h-5 text-green-600" />
                </a>
                <button className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center hover:bg-brand-100 transition-colors">
                  <MessageSquare className="w-5 h-5 text-brand-600" />
                </button>
              </div>
            </div>
          </div>
        ) : isPending ? (
          <PendingRiderCard />
        ) : null}

        {isActiveOrder && order.tracks.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-brand-500" />
                <span className="font-medium text-gray-800">实时轨迹</span>
              </div>
              <span className="text-xs text-gray-400">
                最近更新 {order.tracks[order.tracks.length - 1]?.time}
              </span>
            </div>
            <div className="relative h-36 bg-gradient-to-br from-brand-50 via-white to-green-50 rounded-xl overflow-hidden border border-gray-100">
              <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full">
                  <defs>
                    <pattern id="dg" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#cbd5e1" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#dg)" />
                </svg>
              </div>
              <svg className="absolute inset-0 w-full h-full">
                <path
                  d="M 10% 80% Q 25% 40%, 45% 55% T 80% 30% T 95% 20%"
                  stroke="#1E88E5"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                {order.tracks.filter((_, i) => i % 2 === 0).map((_, idx, arr) => {
                  const x = 10 + (idx / Math.max(arr.length - 1, 1)) * 80;
                  const y = 80 - (idx / Math.max(arr.length - 1, 1)) * 60 + Math.sin(idx * 1.2) * 10;
                  return (
                    <circle
                      key={idx}
                      cx={`${x}%`}
                      cy={`${y}%`}
                      r="3"
                      fill={idx === arr.length - 1 ? '#1E88E5' : '#90CAF9'}
                    />
                  );
                })}
              </svg>
              <div className="absolute left-[8%] bottom-[15%]">
                <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-white shadow flex items-center justify-center">
                  <Package className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="absolute right-[3%] top-[12%]">
                <div className="w-6 h-6 rounded-full bg-brand-500 border-2 border-white shadow flex items-center justify-center">
                  <MapPin className="w-3 h-3 text-white" />
                </div>
              </div>
              {(() => {
                const lastIdx = order.tracks.length - 1;
                const rx = 10 + (lastIdx / Math.max(lastIdx, 1)) * 80;
                return (
                  <div className="absolute" style={{ left: `${Math.min(rx, 85)}%`, top: '18%' }}>
                    <div className="flex items-center gap-1 bg-brand-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                      <Truck className="w-3 h-3" />骑手位置
                    </div>
                  </div>
                );
              })()}
              <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-gray-600">
                预计 {Math.ceil(order.distance / 0.5)} 分钟送达 · {order.distance}km
              </div>
            </div>
            <div className="mt-3 max-h-32 overflow-y-auto space-y-1.5">
              {order.tracks.slice().reverse().map((pt, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-gray-500">
                  <div className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-brand-500' : 'bg-gray-300'}`} />
                  <span className="text-gray-400 w-12">{pt.time}</span>
                  <span>位置更新 ({pt.lat.toFixed(4)}, {pt.lng.toFixed(4)})</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {isPending && <PendingTrackCard />}

        <Card>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Package className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">取件地址</span>
                  <span className="text-xs text-gray-400">
                    {order.pickupName} {order.pickupPhone}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{order.pickupAddress}</p>
              </div>
            </div>
            <div className="ml-4 border-l-2 border-dashed border-gray-200 h-3" />
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-brand-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">送达地址</span>
                  <span className="text-xs text-gray-400">
                    {order.deliveryName} {order.deliveryPhone}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{order.deliveryAddress}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-medium text-gray-800 mb-3">服务信息</h3>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">物品描述</span>
              <span className="text-gray-800 text-right max-w-[200px]">{order.goodsDescription}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">物品重量</span>
              <span className="text-gray-800">{order.weight}kg</span>
            </div>
            {order.goodsValue > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">物品价值</span>
                <span className="text-gray-800">¥{order.goodsValue}</span>
              </div>
            )}
            {order.remark && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">备注</span>
                <span className="text-gray-800 text-right max-w-[200px]">{order.remark}</span>
              </div>
            )}
            <div className="flex items-center gap-2 pt-1">
              {order.isUrgent && (
                <span className="flex items-center gap-1 px-2 py-1 bg-orange-50 rounded-lg text-xs text-orange-600 font-medium">
                  <Zap className="w-3 h-3" />加急配送
                </span>
              )}
              {order.isInsured && (
                <span className="flex items-center gap-1 px-2 py-1 bg-brand-50 rounded-lg text-xs text-brand-600 font-medium">
                  <ShieldCheck className="w-3 h-3" />已保价
                </span>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-medium text-gray-800 mb-3">费用明细</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">基础运费</span>
              <span className="text-gray-700">¥{order.baseFee.toFixed(2)}</span>
            </div>
            {order.distanceFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">距离费 ({order.distance}km)</span>
                <span className="text-gray-700">¥{order.distanceFee.toFixed(2)}</span>
              </div>
            )}
            {order.weightFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">超重费</span>
                <span className="text-gray-700">¥{order.weightFee.toFixed(2)}</span>
              </div>
            )}
            {order.urgentFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">加急费</span>
                <span className="text-orange-600">+¥{order.urgentFee.toFixed(2)}</span>
              </div>
            )}
            {order.insuredFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">保价费</span>
                <span className="text-brand-600">+¥{order.insuredFee.toFixed(2)}</span>
              </div>
            )}
            {order.tip > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">骑手小费</span>
                <span className="text-amber-600">+¥{order.tip.toFixed(2)}</span>
              </div>
            )}
            {order.couponDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">优惠券</span>
                <span className="text-green-600">-¥{order.couponDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-3 mt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-base font-semibold text-gray-800">合计</span>
              <span className="text-2xl font-bold text-brand-600">¥{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-medium text-gray-800 mb-3">支付信息</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">支付方式</span>
              <span className="text-gray-800">{payMethodLabel[order.payMethod] || order.payMethod}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">支付状态</span>
              <span className={`font-medium ${payStatusLabel[order.payStatus]?.color || 'text-gray-600'}`}>
                {payStatusLabel[order.payStatus]?.text || order.payStatus}
              </span>
            </div>
          </div>
        </Card>

        <ReviewRecordCard records={order.reviewRecords} />

        {isDisputed && order.disputeProgress && (
          <DisputeProgressCard dispute={order.disputeProgress} onCopyTicket={handleCopy} />
        )}

        <ManualInterventionCard interventions={order.manualInterventions} isActive={isActiveOrder} />
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 px-4 py-3 z-40">
        <div className="flex items-center gap-3">
          {order.status === 'pending' && (
            <>
              <button
                onClick={() => navigate(-1)}
                className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100"
              >
                取消订单
              </button>
              {order.payStatus === 'unpaid' && (
                <button className="flex-1 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-medium shadow-lg shadow-brand-500/25">
                  去支付
                </button>
              )}
            </>
          )}
          {['accepted', 'picked_up', 'delivering'].includes(order.status) && (
            <>
              {order.riderPhone && (
                <a
                  href={`tel:${order.riderPhone}`}
                  className="flex-1 py-3 bg-green-50 text-green-600 rounded-xl font-medium hover:bg-green-100 text-center flex items-center justify-center gap-1"
                >
                  <Phone className="w-4 h-4" />联系骑手
                </a>
              )}
              <button
                onClick={() => setShowDisputeModal(true)}
                className="flex-1 py-3 bg-white border border-orange-300 text-orange-600 rounded-xl font-medium hover:bg-orange-50 flex items-center justify-center gap-1"
              >
                <AlertTriangle className="w-4 h-4" />申请申诉
              </button>
            </>
          )}
          {order.status === 'completed' && (
            <>
              <button
                onClick={() => setShowReviewModal(true)}
                className="flex-1 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-medium shadow-lg shadow-brand-500/25 flex items-center justify-center gap-1"
              >
                <Star className="w-4 h-4" />评价订单
              </button>
              <button
                onClick={() => navigate('/order/create')}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
              >
                再次下单
              </button>
              <button className="flex-1 py-3 bg-white border border-brand-300 text-brand-600 rounded-xl font-medium hover:bg-brand-50 flex items-center justify-center gap-1">
                <Eye className="w-4 h-4" />申请复查
              </button>
            </>
          )}
          {order.status === 'cancelled' && (
            <>
              <button
                onClick={() => navigate('/order/create')}
                className="flex-1 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-medium shadow-lg shadow-brand-500/25"
              >
                再次下单
              </button>
              <button className="flex-1 py-3 bg-white border border-gray-300 text-gray-600 rounded-xl font-medium hover:bg-gray-50 flex items-center justify-center gap-1">
                <History className="w-4 h-4" />查看退款详情
              </button>
            </>
          )}
          {order.status === 'disputed' && (
            <>
              <button className="flex-1 py-3 bg-white border border-orange-300 text-orange-600 rounded-xl font-medium hover:bg-orange-50 flex items-center justify-center gap-1">
                <FileSearch className="w-4 h-4" />查看申诉进度
              </button>
              <button className="flex-1 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-medium shadow-lg shadow-brand-500/25 flex items-center justify-center gap-1">
                <HeadphonesIcon className="w-4 h-4" />联系客服
              </button>
            </>
          )}
        </div>
      </div>

      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowReviewModal(false)}>
          <div className="w-full max-w-[480px] bg-white rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">评价订单</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setReviewRating(s)}>
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      s <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {['配送及时', '服务态度好', '物品完好', '沟通顺畅'].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 bg-brand-50 text-brand-600 rounded-full text-xs font-medium cursor-pointer hover:bg-brand-100"
                >
                  {tag}
                </span>
              ))}
            </div>
            <textarea
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              placeholder="说说您的感受..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none mb-4"
            />
            <button
              onClick={() => setShowReviewModal(false)}
              className="w-full py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-medium"
            >
              提交评价
            </button>
          </div>
        </div>
      )}

      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowDisputeModal(false)}>
          <div className="w-full max-w-[480px] bg-white rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">申请申诉</h3>
              <button onClick={() => setShowDisputeModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">申诉类型</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'timeout', label: '超时未送达' },
                    { key: 'damage', label: '物品损坏' },
                    { key: 'attitude', label: '服务态度差' },
                    { key: 'wrong', label: '送错地址' },
                    { key: 'fake', label: '虚假配送' },
                    { key: 'other', label: '其他原因' },
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setDisputeType(t.key)}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        disputeType === t.key
                          ? 'border-brand-500 bg-brand-50 text-brand-600'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">详细描述</label>
                <textarea
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  placeholder="请描述具体问题..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">上传凭证</label>
                <button className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-brand-400 hover:text-brand-400">
                  <span className="text-2xl">+</span>
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowDisputeModal(false)}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium"
            >
              提交申诉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
