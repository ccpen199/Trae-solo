import {
  Store,
  Package,
  DollarSign,
  ShoppingCart,
  FileCheck2,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  Settings,
  Eye,
  Plus,
  Search,
  ClipboardList,
  Truck,
  Banknote,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

const stats = [
  { label: '今日订单', value: '168', Icon: ShoppingCart, color: 'from-rose-400 to-pink-600' },
  { label: '今日GMV', value: '¥46,280', Icon: DollarSign, color: 'from-forest-400 to-emerald-600' },
  { label: '上架SKU', value: '326', Icon: Package, color: 'from-violet-400 to-indigo-600' },
  { label: '合规备案', value: '已通过', Icon: FileCheck2, color: 'from-sky-400 to-cyan-600' },
];

const skuList = [
  { name: '皇家成犬粮2kg', category: '食品', species: '犬类', price: 168, stock: 186, rx: false, status: 'online' },
  { name: '速诺阿莫西林克拉维酸钾片', category: '处方药', species: '犬猫通用', price: 88, stock: 78, rx: true, status: 'online' },
  { name: '福来恩体外驱虫滴剂3支', category: '驱虫', species: '犬猫通用', price: 158, stock: 236, rx: false, status: 'online' },
  { name: '拜有利恩诺沙星片', category: '处方药', species: '犬类', price: 76, stock: 12, rx: true, status: 'lowstock' },
  { name: '处方粮-肾脏护理', category: '处方食品', species: '犬猫通用', price: 288, stock: 0, rx: true, status: 'oos' },
  { name: '红狗营养膏120g', category: '营养补充', species: '犬猫通用', price: 98, stock: 320, rx: false, status: 'online' },
];

const orders = [
  { no: 'PL20260615001', customer: '张小明', amount: 256, items: '皇家犬粮×1 + 驱虫滴剂×1', status: 'shipped', rx: false },
  { no: 'PL20260615002', customer: '李小红', amount: 88, items: '速诺阿莫西林×1', status: 'pending_verify', rx: true },
  { no: 'PL20260615003', customer: '王小刚', amount: 288, items: '肾脏护理处方粮×1', status: 'pending_sign', rx: true },
  { no: 'PL20260615004', customer: '赵小美', amount: 196, items: '营养膏×2', status: 'delivered', rx: false },
  { no: 'PL20260615005', customer: '陈小华', amount: 154, items: '营养膏×1 + 益生菌×1', status: 'paid', rx: false },
];

const statusMap: Record<string, { label: string; cls: string }> = {
  online: { label: '在售', cls: 'bg-forest-100 text-forest-700' },
  lowstock: { label: '库存紧张', cls: 'bg-warm-100 text-warm-700' },
  oos: { label: '缺货', cls: 'bg-red-100 text-red-600' },
};

const orderStatusMap: Record<string, { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
  pending_verify: { label: '双签待确认', cls: 'bg-purple-100 text-purple-700', Icon: ShieldCheck },
  pending_sign: { label: '待宠主知情签署', cls: 'bg-blue-100 text-blue-700', Icon: FileCheck2 },
  paid: { label: '已付款', cls: 'bg-forest-100 text-forest-700', Icon: Banknote },
  shipped: { label: '已发货', cls: 'bg-sky-100 text-sky-700', Icon: Truck },
  delivered: { label: '已送达', cls: 'bg-gray-100 text-gray-700', Icon: Package },
};

export default function MerchantDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-200 flex items-center justify-center">
            <Store className="w-8 h-8 text-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">{user?.nickname || '商家工作台'}</h1>
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-forest-500" />
              合规资质已备案 · SKU管理 / 订单履约 / 处方药双签
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary !py-2 text-sm">
            <Search className="w-4 h-4" /> 搜索订单
          </button>
          <button className="btn-primary !py-2 text-sm">
            <Plus className="w-4 h-4" /> 新增SKU上架
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, Icon, color }) => (
          <div key={label} className="card !p-5">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-sm`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* SKU 管理 */}
        <div className="lg:col-span-2 card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-violet-500" /> SKU 商品列表
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded-lg bg-forest-50 text-forest-600">在售 286</span>
              <span className="px-2 py-1 rounded-lg bg-warm-50 text-warm-600">低库存 34</span>
              <span className="px-2 py-1 rounded-lg bg-rose-50 text-rose-600">缺货 6</span>
            </div>
          </div>

          {/* 搜索栏 */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="按物种/年龄/健康状态搜索 SKU..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-forest-200"
              />
            </div>
            <select className="px-3 py-2 rounded-lg bg-white border border-gray-100 text-sm text-gray-600 focus:outline-none">
              <option>全部分类</option>
              <option>处方药</option>
              <option>食品</option>
              <option>营养补充</option>
            </select>
            <select className="px-3 py-2 rounded-lg bg-white border border-gray-100 text-sm text-gray-600 focus:outline-none">
              <option>全部物种</option>
              <option>犬类</option>
              <option>猫类</option>
              <option>犬猫通用</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">商品</th>
                  <th className="pb-3 font-medium">分类</th>
                  <th className="pb-3 font-medium">适用</th>
                  <th className="pb-3 font-medium text-right">价格</th>
                  <th className="pb-3 font-medium text-right">库存</th>
                  <th className="pb-3 font-medium text-center">处方</th>
                  <th className="pb-3 font-medium text-center">状态</th>
                  <th className="pb-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {skuList.map((sku, i) => (
                  <tr key={i} className="hover:bg-gray-50/70">
                    <td className="py-3 font-medium text-gray-800">{sku.name}</td>
                    <td className="py-3 text-gray-500">{sku.category}</td>
                    <td className="py-3 text-gray-500">{sku.species}</td>
                    <td className="py-3 text-right font-semibold text-orange-600">¥{sku.price}</td>
                    <td className="py-3 text-right">
                      <span className={`font-mono ${sku.stock === 0 ? 'text-red-500' : sku.stock < 20 ? 'text-warm-600' : 'text-gray-700'}`}>
                        {sku.stock}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      {sku.rx ? (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">Rx</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusMap[sku.status].cls}`}>
                        {statusMap[sku.status].label}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-forest-600 hover:bg-forest-50 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors">
                        <Settings className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 合规资质 */}
        <div className="space-y-4">
          <div className="card space-y-4">
            <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-500" /> 合规资质备案
            </h2>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-forest-50/80 border border-forest-100 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-forest-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-forest-800">营业执照</div>
                  <div className="text-[11px] text-forest-600 font-mono">BL20240001 · 已验证</div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-forest-50/80 border border-forest-100 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-forest-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-forest-800">药品经营许可证</div>
                  <div className="text-[11px] text-forest-600 font-mono">RX2024A008 · 已验证</div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-sky-50/80 border border-sky-100 flex items-center gap-3">
                <ClipboardList className="w-5 h-5 text-sky-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-sky-800">食品经营备案</div>
                  <div className="text-[11px] text-sky-600">宠物食品 · 已上传</div>
                </div>
              </div>
            </div>
          </div>

          {/* 处方药双签提醒 */}
          <div className="card space-y-3 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100">
            <h2 className="font-display font-bold text-base text-purple-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-purple-600" /> 处方药双签验证待处理
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white text-xs">
                <span className="text-gray-700">订单 PL20260615002</span>
                <span className="font-semibold text-purple-600">待双签</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white text-xs">
                <span className="text-gray-700">订单 PL20260615003</span>
                <span className="font-semibold text-blue-600">待宠主签署</span>
              </div>
            </div>
            <div className="text-[10px] text-purple-500 leading-relaxed border-t border-purple-200/50 pt-2">
              🔐 处方药须经 <b>医生电子签名 + 宠主知情确认</b> 双验证后方可发货
            </div>
          </div>
        </div>
      </div>

      {/* 订单履约 */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-sky-500" /> 近期订单履约
          </h2>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-forest-500" /> 本周 GMV ¥286,500 · 环比 +12.4%</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">订单号</th>
                <th className="pb-3 font-medium">客户</th>
                <th className="pb-3 font-medium">商品</th>
                <th className="pb-3 font-medium text-right">金额</th>
                <th className="pb-3 font-medium text-center">处方</th>
                <th className="pb-3 font-medium text-center">状态</th>
                <th className="pb-3 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((o, i) => {
                const s = orderStatusMap[o.status];
                const Icon = s.Icon;
                return (
                  <tr key={i} className="hover:bg-gray-50/70">
                    <td className="py-3 font-mono text-xs text-gray-700">{o.no}</td>
                    <td className="py-3 text-gray-700">{o.customer}</td>
                    <td className="py-3 text-gray-500 max-w-xs truncate">{o.items}</td>
                    <td className="py-3 text-right font-semibold text-orange-600">¥{o.amount}</td>
                    <td className="py-3 text-center">
                      {o.rx ? (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">Rx 双签</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>
                        <Icon className="w-3 h-3" /> {s.label}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button className="text-xs px-3 py-1.5 rounded-lg bg-forest-500 text-white hover:bg-forest-600">
                        查看详情
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
