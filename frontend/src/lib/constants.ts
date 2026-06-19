export const CATEGORY_OPTIONS = [
  { value: '废金属', label: '废金属', color: 'bg-orange-100 text-orange-700' },
  { value: '二手设备', label: '二手设备', color: 'bg-blue-100 text-blue-700' },
  { value: '废塑料', label: '废塑料', color: 'bg-green-100 text-green-700' },
];

export const METAL_SUBCATEGORIES = ['废钢', '废铜', '废铝', '废锌', '废不锈钢', '其他金属'];
export const EQUIPMENT_SUBCATEGORIES = ['工程机械', '生产设备', '运输车辆', '电力设备', '其他设备'];
export const PLASTIC_SUBCATEGORIES = ['PET', 'PE', 'PP', 'PVC', 'ABS', '其他塑料'];

export const ROLE_LABELS: Record<string, string> = {
  recycler: '回收商',
  producer: '产废单位',
  inspector: '质检机构',
  carrier: '物流承运商',
  admin: '平台管理员',
};

export const ROLE_COLORS: Record<string, string> = {
  recycler: 'bg-green-100 text-green-700',
  producer: 'bg-blue-100 text-blue-700',
  inspector: 'bg-purple-100 text-purple-700',
  carrier: 'bg-amber-100 text-amber-700',
  admin: 'bg-slate-700 text-white',
};

export const VERIFICATION_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '已通过', color: 'bg-green-100 text-green-700' },
  rejected: { label: '未通过', color: 'bg-red-100 text-red-700' },
};

export const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  published: { label: '已发布', color: 'bg-slate-100 text-slate-700' },
  negotiating: { label: '议价中', color: 'bg-blue-100 text-blue-700' },
  contracted: { label: '已生成合同', color: 'bg-indigo-100 text-indigo-700' },
  deposit_paid: { label: '待支付定金', color: 'bg-amber-100 text-amber-700' },
  shipping: { label: '运输中', color: 'bg-cyan-100 text-cyan-700' },
  inspecting: { label: '质检中', color: 'bg-purple-100 text-purple-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
  cancelled: { label: '已取消', color: 'bg-slate-400 text-white' },
  disputed: { label: '争议中', color: 'bg-red-100 text-red-700' },
};

export const CONTRACT_STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-slate-100 text-slate-700' },
  signed_buyer: { label: '买方已签', color: 'bg-blue-100 text-blue-700' },
  signed_seller: { label: '卖方已签', color: 'bg-indigo-100 text-indigo-700' },
  fully_signed: { label: '已生效', color: 'bg-green-100 text-green-700' },
  terminated: { label: '已终止', color: 'bg-red-100 text-red-700' },
};

export const NEGOTIATION_STATUS: Record<string, { label: string; color: string }> = {
  active: { label: '进行中', color: 'bg-blue-100 text-blue-700' },
  accepted: { label: '已接受', color: 'bg-green-100 text-green-700' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
  cancelled: { label: '已取消', color: 'bg-slate-400 text-white' },
};

export const TRACE_STATUS: Record<string, { label: string; color: string }> = {
  generated: { label: '已生成', color: 'bg-slate-100 text-slate-700' },
  in_transit: { label: '运输中', color: 'bg-cyan-100 text-cyan-700' },
  received: { label: '已收货', color: 'bg-blue-100 text-blue-700' },
  processed: { label: '已处理', color: 'bg-purple-100 text-purple-700' },
  archived: { label: '已归档', color: 'bg-green-100 text-green-700' },
};

export const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-slate-100 text-slate-700' },
  deposit_frozen: { label: '定金已冻结', color: 'bg-amber-100 text-amber-700' },
  deposit_released: { label: '定金已释放', color: 'bg-green-100 text-green-700' },
  full_paid: { label: '全额已支付', color: 'bg-emerald-100 text-emerald-700' },
  refunded: { label: '已退款', color: 'bg-slate-400 text-white' },
};

export const LOGISTICS_STATUS: Record<string, { label: string; color: string }> = {
  pending_pickup: { label: '待揽收', color: 'bg-slate-100 text-slate-700' },
  picked_up: { label: '已揽收', color: 'bg-blue-100 text-blue-700' },
  in_transit: { label: '运输中', color: 'bg-cyan-100 text-cyan-700' },
  delivered: { label: '已送达', color: 'bg-green-100 text-green-700' },
  exception: { label: '异常', color: 'bg-red-100 text-red-700' },
};

export const CREDIT_GRADES = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC'];

export const GRADE_COLORS: Record<string, string> = {
  AAA: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  AA: 'text-green-600 bg-green-50 border-green-200',
  A: 'text-teal-600 bg-teal-50 border-teal-200',
  BBB: 'text-blue-600 bg-blue-50 border-blue-200',
  BB: 'text-amber-600 bg-amber-50 border-amber-200',
  B: 'text-orange-600 bg-orange-50 border-orange-200',
  CCC: 'text-red-600 bg-red-50 border-red-200',
};

export const REGIONS = ['华东', '华北', '华南', '华中', '西南', '西北', '东北'];
export const PROVINCES = ['北京', '上海', '广东', '江苏', '浙江', '山东', '河北', '四川', '湖北', '河南', '福建', '安徽', '辽宁', '吉林', '黑龙江'];

export function formatCurrency(amount: number, decimals = 0): string {
  if (amount >= 10000) {
    return `¥${(amount / 10000).toFixed(2)}万`;
  }
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export function formatWeight(weight: number, unit = '吨'): string {
  return `${weight.toLocaleString('zh-CN')} ${unit}`;
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('zh-CN');
}

export function formatDateTime(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function daysBetween(from: string, to: string): number {
  return Math.max(0, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 3600 * 24)));
}
