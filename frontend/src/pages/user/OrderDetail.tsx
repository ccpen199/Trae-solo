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
} from 'lucide-react';
import { ORDER_CATEGORIES, ORDER_STATUS } from '../../constants';
import type { OrderCategory, OrderStatus } from '../../types';
import Tag from '../../components/ui/Tag';
import Card from '../../components/ui/Card';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  ShoppingBag, Send, Package, ClipboardList,
};

const statusSteps: OrderStatus[] = ['pending', 'accepted', 'picked_up', 'delivering', 'completed'];
const statusStepLabels = ['待接单', '已接单', '已取件', '配送中', '已完成'];

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
  tracks: { lat: number; lng: number; time: string }[];
}

const mockOrder: OrderFull = {
  id: '1', orderNo: 'SP202606170001', category: 'buy', status: 'delivering',
  pickupName: '张先生', pickupPhone: '138****8888', pickupAddress: '北京市朝阳区望京SOHO T1 1201室',
  deliveryName: '李女士', deliveryPhone: '139****6666', deliveryAddress: '北京市海淀区中关村软件园二期8号楼3层',
  goodsDescription: '2杯冰美式咖啡+1份提拉米苏，请小心轻放', weight: 2, goodsValue: 88,
  remark: '到店报手机尾号8888取餐，放前台即可', isUrgent: true, isInsured: true, tip: 5, distance: 8.2,
  baseFee: 8, distanceFee: 12, weightFee: 2, urgentFee: 5, insuredFee: 1, couponDiscount: 5, totalAmount: 28.5,
  payMethod: 'wechat', payStatus: 'paid',
  riderName: '李建国', riderPhone: '137****5555', riderRating: 4.9, riderLevel: '黄金骑手', riderVehicle: '电动车·京A12345',
  createdAt: '2026-06-17T14:30:00', acceptedAt: '2026-06-17T14:32:00', pickedUpAt: '2026-06-17T14:50:00',
  tracks: [
    { lat: 39.989, lng: 116.477, time: '14:32' }, { lat: 39.991, lng: 116.465, time: '14:36' },
    { lat: 39.995, lng: 116.450, time: '14:40' }, { lat: 39.998, lng: 116.435, time: '14:45' },
    { lat: 40.001, lng: 116.420, time: '14:48' }, { lat: 39.998, lng: 116.407, time: '14:50' },
    { lat: 39.995, lng: 116.395, time: '14:55' }, { lat: 39.990, lng: 116.385, time: '14:58' },
    { lat: 39.985, lng: 116.370, time: '15:02' },
  ],
};

const payMethodLabel: Record<string, string> = { wechat: '微信支付', alipay: '支付宝', balance: '余额支付' };
const payStatusLabel: Record<string, { text: string; color: string }> = {
  unpaid: { text: '未支付', color: 'text-red-500' }, paid: { text: '已支付', color: 'text-green-600' }, refunded: { text: '已退款', color: 'text-orange-500' },
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [disputeType, setDisputeType] = useState('timeout');
  const [disputeDesc, setDisputeDesc] = useState('');

  const order = mockOrder;
  const catConfig = ORDER_CATEGORIES.find((c) => c.key === order.category);
  const statusConfig = ORDER_STATUS[order.status];
  const currentStepIdx = statusSteps.indexOf(order.status);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between h-14 px-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100"><ArrowLeft className="w-5 h-5 text-gray-700" /></button>
          <h1 className="text-base font-semibold text-gray-900">订单详情</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {catConfig && (() => { const Icon = iconMap[catConfig.iconName]; return Icon ? <Icon className="w-5 h-5" style={{ color: catConfig.color }} /> : null; })()}
              <span className="font-medium text-gray-800">{catConfig?.name}</span>
            </div>
            <Tag color={order.status === 'completed' ? 'green' : order.status === 'cancelled' ? 'gray' : order.status === 'disputed' ? 'red' : 'blue'} size="md">
              {statusConfig?.name}
            </Tag>
          </div>
          <div className="flex items-center justify-between">
            {statusSteps.map((step, idx) => (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    idx < currentStepIdx ? 'bg-green-500 text-white' : idx === currentStepIdx ? 'bg-brand-500 text-white ring-4 ring-brand-100' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {idx < currentStepIdx ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={`text-xs font-medium ${idx <= currentStepIdx ? 'text-gray-800' : 'text-gray-400'}`}>{statusStepLabels[idx]}</span>
                </div>
                {idx < statusSteps.length - 1 && <div className={`flex-1 h-0.5 mx-1 -mt-4 ${idx < currentStepIdx ? 'bg-green-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">订单编号</span>
              <span className="text-sm font-mono font-semibold text-gray-800">{order.orderNo}</span>
            </div>
            <button onClick={() => navigator.clipboard?.writeText(order.orderNo)} className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600">
              <Copy className="w-3.5 h-3.5" />复制
            </button>
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />下单时间：{new Date(order.createdAt).toLocaleString('zh-CN')}</span>
            {order.acceptedAt && <span>接单：{new Date(order.acceptedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>}
          </div>
        </div>

        {order.riderName && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-lg font-bold">{order.riderName[0]}</div>
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
                <a href={`tel:${order.riderPhone}`} className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center hover:bg-green-100 transition-colors"><Phone className="w-5 h-5 text-green-600" /></a>
                <button className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center hover:bg-brand-100 transition-colors"><MessageSquare className="w-5 h-5 text-brand-600" /></button>
              </div>
            </div>
          </div>
        )}

        {['accepted', 'picked_up', 'delivering'].includes(order.status) && order.tracks.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><Navigation className="w-4 h-4 text-brand-500" /><span className="font-medium text-gray-800">实时轨迹</span></div>
              <span className="text-xs text-gray-400">最近更新 {order.tracks[order.tracks.length - 1]?.time}</span>
            </div>
            <div className="relative h-36 bg-gradient-to-br from-brand-50 via-white to-green-50 rounded-xl overflow-hidden border border-gray-100">
              <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full"><defs><pattern id="dg" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#cbd5e1" strokeWidth="0.5" /></pattern></defs><rect width="100%" height="100%" fill="url(#dg)" /></svg>
              </div>
              <svg className="absolute inset-0 w-full h-full">
                <path d="M 10% 80% Q 25% 40%, 45% 55% T 80% 30% T 95% 20%" stroke="#1E88E5" strokeWidth="3" fill="none" strokeLinecap="round" />
                {order.tracks.filter((_, i) => i % 2 === 0).map((_, idx, arr) => {
                  const x = 10 + (idx / Math.max(arr.length - 1, 1)) * 80;
                  const y = 80 - (idx / Math.max(arr.length - 1, 1)) * 60 + Math.sin(idx * 1.2) * 10;
                  return <circle key={idx} cx={`${x}%`} cy={`${y}%`} r="3" fill={idx === arr.length - 1 ? '#1E88E5' : '#90CAF9'} />;
                })}
              </svg>
              <div className="absolute left-[8%] bottom-[15%]"><div className="w-6 h-6 rounded-full bg-green-500 border-2 border-white shadow flex items-center justify-center"><Package className="w-3 h-3 text-white" /></div></div>
              <div className="absolute right-[3%] top-[12%]"><div className="w-6 h-6 rounded-full bg-brand-500 border-2 border-white shadow flex items-center justify-center"><MapPin className="w-3 h-3 text-white" /></div></div>
              {(() => { const lastIdx = order.tracks.length - 1; const rx = 10 + (lastIdx / Math.max(lastIdx, 1)) * 80; return (
                <div className="absolute" style={{ left: `${Math.min(rx, 85)}%`, top: '18%' }}>
                  <div className="flex items-center gap-1 bg-brand-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg"><Truck className="w-3 h-3" />骑手位置</div>
                </div>
              ); })()}
              <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-gray-600">预计 {Math.ceil(order.distance / 0.5)} 分钟送达 · {order.distance}km</div>
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

        <Card>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5"><Package className="w-4 h-4 text-green-600" /></div>
              <div className="flex-1">
                <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-800">取件地址</span><span className="text-xs text-gray-400">{order.pickupName} {order.pickupPhone}</span></div>
                <p className="text-sm text-gray-600 mt-0.5">{order.pickupAddress}</p>
              </div>
            </div>
            <div className="ml-4 border-l-2 border-dashed border-gray-200 h-3" />
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5"><MapPin className="w-4 h-4 text-brand-600" /></div>
              <div className="flex-1">
                <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-800">送达地址</span><span className="text-xs text-gray-400">{order.deliveryName} {order.deliveryPhone}</span></div>
                <p className="text-sm text-gray-600 mt-0.5">{order.deliveryAddress}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-medium text-gray-800 mb-3">服务信息</h3>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm"><span className="text-gray-500">物品描述</span><span className="text-gray-800 text-right max-w-[200px]">{order.goodsDescription}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">物品重量</span><span className="text-gray-800">{order.weight}kg</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">物品价值</span><span className="text-gray-800">¥{order.goodsValue}</span></div>
            {order.remark && <div className="flex justify-between text-sm"><span className="text-gray-500">备注</span><span className="text-gray-800 text-right max-w-[200px]">{order.remark}</span></div>}
            <div className="flex items-center gap-2 pt-1">
              {order.isUrgent && <span className="flex items-center gap-1 px-2 py-1 bg-orange-50 rounded-lg text-xs text-orange-600 font-medium"><Zap className="w-3 h-3" />加急配送</span>}
              {order.isInsured && <span className="flex items-center gap-1 px-2 py-1 bg-brand-50 rounded-lg text-xs text-brand-600 font-medium"><ShieldCheck className="w-3 h-3" />已保价</span>}
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-medium text-gray-800 mb-3">费用明细</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">基础运费</span><span className="text-gray-700">¥{order.baseFee.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">距离费 ({order.distance}km)</span><span className="text-gray-700">¥{order.distanceFee.toFixed(2)}</span></div>
            {order.weightFee > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">超重费</span><span className="text-gray-700">¥{order.weightFee.toFixed(2)}</span></div>}
            {order.urgentFee > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">加急费</span><span className="text-orange-600">+¥{order.urgentFee.toFixed(2)}</span></div>}
            {order.insuredFee > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">保价费</span><span className="text-brand-600">+¥{order.insuredFee.toFixed(2)}</span></div>}
            {order.tip > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">骑手小费</span><span className="text-amber-600">+¥{order.tip.toFixed(2)}</span></div>}
            {order.couponDiscount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">优惠券</span><span className="text-green-600">-¥{order.couponDiscount.toFixed(2)}</span></div>}
            <div className="pt-3 mt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-base font-semibold text-gray-800">合计</span>
              <span className="text-2xl font-bold text-brand-600">¥{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-medium text-gray-800 mb-3">支付信息</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">支付方式</span><span className="text-gray-800">{payMethodLabel[order.payMethod] || order.payMethod}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">支付状态</span><span className={`font-medium ${payStatusLabel[order.payStatus]?.color || 'text-gray-600'}`}>{payStatusLabel[order.payStatus]?.text || order.payStatus}</span></div>
          </div>
        </Card>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 px-4 py-3 z-40">
        <div className="flex items-center gap-3">
          {order.status === 'pending' && <button onClick={() => navigate(-1)} className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100">取消订单</button>}
          {order.status === 'completed' && (
            <>
              <button onClick={() => setShowReviewModal(true)} className="flex-1 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-medium shadow-lg shadow-brand-500/25">评价订单</button>
              <button onClick={() => navigate('/order/create')} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">再次下单</button>
            </>
          )}
          {['delivering', 'picked_up'].includes(order.status) && (
            <button onClick={() => setShowDisputeModal(true)} className="flex-1 py-3 bg-white border border-orange-300 text-orange-600 rounded-xl font-medium hover:bg-orange-50">
              <AlertTriangle className="w-4 h-4 inline mr-1" />申请申诉
            </button>
          )}
          {order.status === 'disputed' && <button className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium">申诉处理中...</button>}
          {order.status === 'cancelled' && <button onClick={() => navigate('/order/create')} className="flex-1 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-medium shadow-lg shadow-brand-500/25">再次下单</button>}
        </div>
      </div>

      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowReviewModal(false)}>
          <div className="w-full max-w-[480px] bg-white rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">评价订单</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-6 h-6" /></button>
            </div>
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setReviewRating(s)}><Star className={`w-10 h-10 transition-colors ${s <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} /></button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {['配送及时', '服务态度好', '物品完好', '沟通顺畅'].map((tag) => (
                <span key={tag} className="px-3 py-1.5 bg-brand-50 text-brand-600 rounded-full text-xs font-medium cursor-pointer hover:bg-brand-100">{tag}</span>
              ))}
            </div>
            <textarea value={reviewContent} onChange={(e) => setReviewContent(e.target.value)} placeholder="说说您的感受..." rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none mb-4" />
            <button onClick={() => setShowReviewModal(false)} className="w-full py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-medium">提交评价</button>
          </div>
        </div>
      )}

      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowDisputeModal(false)}>
          <div className="w-full max-w-[480px] bg-white rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">申请申诉</h3>
              <button onClick={() => setShowDisputeModal(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">申诉类型</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ key: 'timeout', label: '超时未送达' }, { key: 'damage', label: '物品损坏' }, { key: 'attitude', label: '服务态度差' }, { key: 'wrong', label: '送错地址' }, { key: 'fake', label: '虚假配送' }, { key: 'other', label: '其他原因' }].map((t) => (
                    <button key={t.key} onClick={() => setDisputeType(t.key)} className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${disputeType === t.key ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{t.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">详细描述</label>
                <textarea value={disputeDesc} onChange={(e) => setDisputeDesc(e.target.value)} placeholder="请描述具体问题..." rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">上传凭证</label>
                <button className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-brand-400 hover:text-brand-400"><span className="text-2xl">+</span></button>
              </div>
            </div>
            <button onClick={() => setShowDisputeModal(false)} className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium">提交申诉</button>
          </div>
        </div>
      )}
    </div>
  );
}
