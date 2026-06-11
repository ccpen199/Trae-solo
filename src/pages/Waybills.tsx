import { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Calendar,
  Eye,
  Printer,
  CheckCircle2,
  XCircle,
  FileJson,
  FileSpreadsheet,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Store,
  Package,
  MapPin,
  Phone,
  User,
  CheckSquare,
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import type { Waybill, WaybillStatus } from '@/types';
import type { TableColumn, TableAction } from '@/types';
import { cn } from '@/lib/utils';

const mockWaybills: (Waybill & {
  orderNo: string;
  merchantName: string;
})[] = [
  {
    id: 'wb-001',
    order_id: 'ORD202501070001',
    orderNo: 'ORD202501070001',
    merchantName: '美味轩餐厅',
    waybill_no: 'SF2025010700001CN',
    tax_amount: 1.80,
    tax_rate: 6,
    status: 'generated',
    created_at: '2025-01-07T14:30:00Z',
    sender_name: '美味轩餐厅',
    sender_phone: '021-88881234',
    sender_address: '上海市浦东新区世纪大道100号',
    receiver_name: '李明',
    receiver_phone: '13800138001',
    receiver_address: '上海市徐汇区淮海中路1688号',
    goods_description: '宫保鸡丁套餐 x1, 米饭 x1',
    goods_weight: 0.8,
    total_amount: 32.00,
    exported: true,
  },
  {
    id: 'wb-002',
    order_id: 'ORD202501070002',
    orderNo: 'ORD202501070002',
    merchantName: '鲜果时光',
    waybill_no: 'SF2025010700002CN',
    tax_amount: 4.50,
    tax_rate: 6,
    status: 'printed',
    created_at: '2025-01-07T13:15:00Z',
    sender_name: '鲜果时光',
    sender_phone: '021-66662222',
    sender_address: '上海市静安区南京西路1266号',
    receiver_name: '赵芳',
    receiver_phone: '13900139002',
    receiver_address: '上海市普陀区长寿路688弄',
    goods_description: '进口车厘子 2斤装',
    goods_weight: 1.2,
    total_amount: 79.00,
    exported: false,
  },
  {
    id: 'wb-003',
    order_id: 'ORD202501060008',
    orderNo: 'ORD202501060008',
    merchantName: '花时间花艺',
    waybill_no: 'SF2025010600008CN',
    tax_amount: 12.00,
    tax_rate: 6,
    status: 'generated',
    created_at: '2025-01-06T20:00:00Z',
    sender_name: '花时间花艺',
    sender_phone: '021-55558888',
    sender_address: '上海市黄浦区外滩源圆明园路133号',
    receiver_name: '孙强',
    receiver_phone: '13700137003',
    receiver_address: '上海市长宁区虹桥路1115弄',
    goods_description: '红玫瑰 99朵 花束',
    goods_weight: 2.5,
    total_amount: 212.00,
    exported: true,
  },
  {
    id: 'wb-004',
    order_id: 'ORD202501070005',
    orderNo: 'ORD202501070005',
    merchantName: '美味轩餐厅',
    waybill_no: 'SF2025010700005CN',
    tax_amount: 0.90,
    tax_rate: 6,
    status: 'voided',
    created_at: '2025-01-07T11:20:00Z',
    sender_name: '美味轩餐厅',
    sender_phone: '021-88881234',
    sender_address: '上海市浦东新区世纪大道100号',
    receiver_name: '周梅',
    receiver_phone: '13600136004',
    receiver_address: '上海市虹口区四川北路1888号',
    goods_description: '奶茶 x2',
    goods_weight: 0.5,
    total_amount: 16.00,
    exported: false,
  },
  {
    id: 'wb-005',
    order_id: 'ORD202501070010',
    orderNo: 'ORD202501070010',
    merchantName: '鲜果时光',
    waybill_no: 'SF2025010700010CN',
    tax_amount: 2.70,
    tax_rate: 6,
    status: 'generated',
    created_at: '2025-01-07T15:45:00Z',
    sender_name: '鲜果时光',
    sender_phone: '021-66662222',
    sender_address: '上海市静安区南京西路1266号',
    receiver_name: '吴斌',
    receiver_phone: '13500135005',
    receiver_address: '上海市杨浦区五角场国定路335号',
    goods_description: '泰国金枕榴莲 1个',
    goods_weight: 3.0,
    total_amount: 47.50,
    exported: false,
  },
];

const statusLabels: Record<WaybillStatus, string> = {
  generated: '已生成',
  printed: '已打印',
  voided: '已作废',
};

const statusVariants: Record<WaybillStatus, 'info' | 'success' | 'danger'> = {
  generated: 'info',
  printed: 'success',
  voided: 'danger',
};

const merchants = ['全部商家', '美味轩餐厅', '鲜果时光', '花时间花艺'];

export default function Waybills() {
  const [search, setSearch] = useState('');
  const [merchantFilter, setMerchantFilter] = useState('全部商家');
  const [statusFilter, setStatusFilter] = useState<WaybillStatus | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedWaybill, setSelectedWaybill] = useState<(typeof mockWaybills)[0] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

  const filteredWaybills = mockWaybills.filter((w) => {
    if (statusFilter !== 'all' && w.status !== statusFilter) return false;
    if (merchantFilter !== '全部商家' && w.merchantName !== merchantFilter) return false;
    if (search && !w.waybill_no.toLowerCase().includes(search.toLowerCase()) && !w.orderNo.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalTax = filteredWaybills.reduce((s, w) => s + w.tax_amount, 0);
  const totalAmount = filteredWaybills.reduce((s, w) => s + (w.total_amount || 0), 0);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredWaybills.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredWaybills.map((w) => w.id)));
  };

  const handleExport = (format: 'csv' | 'json') => {
    const data = selectedIds.size > 0
      ? filteredWaybills.filter((w) => selectedIds.has(w.id))
      : filteredWaybills;

    if (format === 'csv') {
      const headers = ['运单号', '订单号', '商家', '收件人', '金额', '税额', '状态', '生成时间'];
      const rows = data.map((w) => [
        w.waybill_no,
        w.orderNo,
        w.merchantName,
        w.receiver_name,
        w.total_amount?.toFixed(2) || '0.00',
        w.tax_amount.toFixed(2),
        statusLabels[w.status],
        new Date(w.created_at).toLocaleString('zh-CN'),
      ]);
      const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `waybills_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `waybills_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setShowExportModal(false);
  };

  const columns: TableColumn<(typeof mockWaybills)[0]>[] = [
    {
      key: 'select',
      title: (
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={selectedIds.size === filteredWaybills.length && filteredWaybills.length > 0}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-space-blue-600 bg-space-blue-900 text-amber-accent-500 focus:ring-amber-accent-500/50"
          />
        </label>
      ),
      width: '40px',
      render: (_v, row) => (
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={selectedIds.has(row.id)}
            onChange={() => toggleSelect(row.id)}
            className="w-4 h-4 rounded border-space-blue-600 bg-space-blue-900 text-amber-accent-500 focus:ring-amber-accent-500/50"
            onClick={(e) => e.stopPropagation()}
          />
        </label>
      ),
    },
    {
      key: 'waybill_no',
      title: '运单号',
      width: '170px',
      render: (v) => (
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-amber-accent-500" />
          <span className="font-mono text-xs text-gray-200">{v as string}</span>
        </div>
      ),
    },
    { key: 'orderNo', title: '订单号', width: '150px', render: (v) => <span className="text-xs font-mono text-amber-accent-400/80">{v as string}</span> },
    {
      key: 'merchantName',
      title: '商家',
      width: '120px',
      render: (v) => (
        <div className="flex items-center gap-1.5">
          <Store className="w-3.5 h-3.5 text-space-blue-400" />
          <span className="text-xs text-gray-300">{v as string}</span>
        </div>
      ),
    },
    {
      key: 'receiver',
      title: '收件人',
      width: '130px',
      render: (_v, row) => (
        <div>
          <p className="text-xs text-gray-200">{row.receiver_name}</p>
          <p className="text-xs text-gray-500">{row.receiver_phone}</p>
        </div>
      ),
    },
    {
      key: 'total_amount',
      title: '金额',
      width: '90px',
      render: (v) => <span className="text-xs font-semibold text-gray-100">¥{(v as number)?.toFixed(2) || '0.00'}</span>,
    },
    {
      key: 'tax_amount',
      title: '税额',
      width: '80px',
      render: (v) => (
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-info-400" />
          <span className="text-xs text-info-400">¥{(v as number).toFixed(2)}</span>
        </div>
      ),
    },
    {
      key: 'tax_compliant',
      title: '税务合规',
      width: '90px',
      render: (_v, row) => row.status !== 'voided' ? (
        <span className="inline-flex items-center gap-1 text-xs text-success-400">
          <CheckCircle2 className="w-3 h-3" />合规
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
          <XCircle className="w-3 h-3" />已作废
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: '80px',
      render: (v) => <StatusBadge variant={statusVariants[v as WaybillStatus]}>{statusLabels[v as WaybillStatus]}</StatusBadge>,
    },
    { key: 'created_at', title: '生成时间', width: '150px', render: (v) => <span className="text-xs text-gray-500">{new Date(v as string).toLocaleString('zh-CN')}</span> },
  ];

  const actions: TableAction<(typeof mockWaybills)[0]>[] = [
    { key: 'preview', label: '预览', icon: 'Eye', onClick: (r) => setSelectedWaybill(r), variant: 'primary' },
    { key: 'print', label: '打印', icon: 'Printer', onClick: () => {}, variant: 'secondary' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-accent-500" />
            电子运单中心
          </h1>
          <p className="text-sm text-gray-500 mt-1">合规电子运单管理，支持税务申报和批量导出</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-space-blue-800 border border-space-blue-600 rounded-lg text-sm text-gray-300 hover:bg-space-blue-700 transition-colors">
            <Printer className="w-4 h-4" />
            批量打印
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-accent-500 hover:bg-amber-accent-600 text-space-blue-900 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            批量导出
            {selectedIds.size > 0 && (
              <span className="bg-space-blue-900/30 px-1.5 py-0.5 rounded text-xs">
                {selectedIds.size}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="本月运单数" value={mockWaybills.length} icon={<FileText className="w-5 h-5" />} status="info" trend={{ value: 8, direction: 'up', label: '较上月' }} />
        <StatCard title="累计金额" value={`¥${totalAmount.toFixed(2)}`} icon={<Package className="w-5 h-5" />} status="success" trend={{ value: 15, direction: 'up', label: '较上月' }} />
        <StatCard title="累计税额" value={`¥${totalTax.toFixed(2)}`} icon={<ShieldCheck className="w-5 h-5" />} status="warning" />
        <StatCard title="税务合规率" value="99.8%" icon={<CheckCircle2 className="w-5 h-5" />} status="success" trend={{ value: 0.3, direction: 'up', label: '较上月' }} />
      </div>

      <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="搜索运单号、订单号..."
              className="pl-10 pr-4 py-2 w-64 bg-space-blue-900 border border-space-blue-600 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-accent-500/50 transition-colors"
            />
          </div>
          <select
            value={merchantFilter}
            onChange={(e) => setMerchantFilter(e.target.value)}
            className="px-3 py-2 bg-space-blue-900 border border-space-blue-600 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-amber-accent-500/50"
          >
            {merchants.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as WaybillStatus | 'all')}
            className="px-3 py-2 bg-space-blue-900 border border-space-blue-600 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-amber-accent-500/50"
          >
            <option value="all">全部状态</option>
            {Object.entries(statusLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 bg-space-blue-900 border border-space-blue-600 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-amber-accent-500/50"
            />
            <span className="text-gray-500 text-sm">至</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 bg-space-blue-900 border border-space-blue-600 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-amber-accent-500/50"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-space-blue-700 border border-space-blue-600 rounded-lg text-sm text-gray-300 hover:bg-space-blue-600 transition-colors ml-auto">
            <Filter className="w-4 h-4" />
            高级筛选
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredWaybills}
        actions={actions}
        rowKey="id"
        onRowClick={(row) => setSelectedWaybill(row)}
      />

      <Modal
        open={!!selectedWaybill}
        onClose={() => setSelectedWaybill(null)}
        title="运单预览"
        width="lg"
        footer={
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CheckSquare className="w-4 h-4 text-success-400" />
              此运单已通过税务合规校验
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setSelectedWaybill(null)} className="px-4 py-2 bg-space-blue-700 text-gray-300 rounded-lg hover:bg-space-blue-600 transition-colors text-sm">
                关闭
              </button>
              <button className="px-4 py-2 bg-space-blue-700 text-gray-300 rounded-lg hover:bg-space-blue-600 transition-colors text-sm flex items-center gap-1.5">
                <Printer className="w-4 h-4" />
                打印
              </button>
              <button className="px-4 py-2 bg-amber-accent-500 text-space-blue-900 rounded-lg hover:bg-amber-accent-600 transition-colors text-sm font-medium flex items-center gap-1.5">
                <Download className="w-4 h-4" />
                下载PDF
              </button>
            </div>
          </div>
        }
      >
        {selectedWaybill && (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-space-blue-700 to-space-blue-800 border border-space-blue-600 rounded-xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-amber-accent-500 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-space-blue-900" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-100">电子运单</h3>
                      <p className="text-xs text-gray-500">Electronic Waybill</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">运单号</p>
                  <p className="font-mono text-lg font-bold text-amber-accent-400">{selectedWaybill.waybill_no}</p>
                  <div className="flex items-center justify-end gap-1 mt-2">
                    {selectedWaybill.status !== 'voided' ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-success-400" />
                        <span className="text-xs text-success-400">税务合规</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-danger-400" />
                        <span className="text-xs text-danger-400">已作废</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-space-blue-900/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-space-blue-700">
                    <Store className="w-4 h-4 text-amber-accent-500" />
                    <span className="text-xs font-medium text-amber-accent-400 uppercase tracking-wide">寄件方</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <User className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-100">{selectedWaybill.sender_name}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{selectedWaybill.sender_phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{selectedWaybill.sender_address}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-space-blue-900/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-space-blue-700">
                    <MapPin className="w-4 h-4 text-info-500" />
                    <span className="text-xs font-medium text-info-400 uppercase tracking-wide">收件方</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <User className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-100">{selectedWaybill.receiver_name}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{selectedWaybill.receiver_phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{selectedWaybill.receiver_address}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-space-blue-800 border border-space-blue-600 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">货品描述</p>
                <p className="text-sm text-gray-200">{selectedWaybill.goods_description}</p>
              </div>
              <div className="bg-space-blue-800 border border-space-blue-600 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">货品重量</p>
                <p className="text-sm text-gray-200">{selectedWaybill.goods_weight} kg</p>
              </div>
              <div className="bg-space-blue-800 border border-space-blue-600 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">关联订单</p>
                <p className="text-sm font-mono text-amber-accent-400">{selectedWaybill.orderNo}</p>
              </div>
            </div>

            <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5">
              <h4 className="text-sm font-medium text-gray-200 mb-4 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-amber-accent-400" />
                费用明细
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">订单金额</span>
                  <span className="text-gray-200">¥{selectedWaybill.total_amount?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">税率 ({selectedWaybill.tax_rate}%)</span>
                  <span className="text-gray-200">¥{selectedWaybill.tax_amount.toFixed(2)}</span>
                </div>
                <div className="border-t border-space-blue-700 pt-2 mt-2 flex justify-between">
                  <span className="text-gray-200 font-medium">价税合计</span>
                  <span className="text-amber-accent-400 font-bold text-lg">
                    ¥{((selectedWaybill.total_amount || 0) + selectedWaybill.tax_amount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 border-t border-space-blue-700 pt-4">
              <div className="flex items-center gap-6">
                <span>生成时间：{new Date(selectedWaybill.created_at).toLocaleString('zh-CN')}</span>
                <span>运单状态：{statusLabels[selectedWaybill.status]}</span>
              </div>
              {selectedWaybill.exported && (
                <span className="inline-flex items-center gap-1 text-info-400">
                  <CheckCircle2 className="w-3 h-3" />
                  已导出
                </span>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="批量导出运单"
        width="sm"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowExportModal(false)} className="px-4 py-2 bg-space-blue-700 text-gray-300 rounded-lg hover:bg-space-blue-600 transition-colors text-sm">
              取消
            </button>
            <button
              onClick={() => handleExport(exportFormat)}
              className="px-4 py-2 bg-amber-accent-500 text-space-blue-900 rounded-lg hover:bg-amber-accent-600 transition-colors text-sm font-medium"
            >
              确认导出
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="bg-space-blue-900/50 rounded-lg p-4 text-sm">
            <p className="text-gray-400 mb-1">导出范围</p>
            <p className="text-gray-100 font-medium">
              {selectedIds.size > 0 ? `已选择 ${selectedIds.size} 条运单` : `全部筛选结果（${filteredWaybills.length} 条）`}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-3">导出格式</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportFormat('csv')}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                  exportFormat === 'csv'
                    ? 'border-amber-accent-500 bg-amber-accent-500/10'
                    : 'border-space-blue-600 bg-space-blue-800 hover:border-space-blue-500'
                )}
              >
                <FileSpreadsheet className={cn('w-8 h-8', exportFormat === 'csv' ? 'text-amber-accent-400' : 'text-gray-500')} />
                <span className={cn('text-sm font-medium', exportFormat === 'csv' ? 'text-amber-accent-400' : 'text-gray-300')}>CSV</span>
                <span className="text-xs text-gray-500">Excel 兼容</span>
              </button>
              <button
                onClick={() => setExportFormat('json')}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                  exportFormat === 'json'
                    ? 'border-amber-accent-500 bg-amber-accent-500/10'
                    : 'border-space-blue-600 bg-space-blue-800 hover:border-space-blue-500'
                )}
              >
                <FileJson className={cn('w-8 h-8', exportFormat === 'json' ? 'text-amber-accent-400' : 'text-gray-500')} />
                <span className={cn('text-sm font-medium', exportFormat === 'json' ? 'text-amber-accent-400' : 'text-gray-300')}>JSON</span>
                <span className="text-xs text-gray-500">结构化数据</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
