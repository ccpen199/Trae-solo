import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Settings,
  RefreshCw,
  Zap,
  PowerOff,
  Power,
  Link2,
  Link2Off,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  ChevronDown,
  Eye,
  EyeOff,
  Copy,
  RefreshCw as RefreshIcon,
  FileText,
  Trash2,
  X,
  Database,
  Activity,
  Wifi,
  WifiOff,
  Bell,
  TrendingDown,
  PieChart as PieChartIcon,
  AlertOctagon,
  Network,
  Shield,
  KeyRound,
  Repeat,
  Image,
  Ruler,
  DollarSign,
  Boxes,
  User,
} from 'lucide-react';
import { Tabs, Drawer, Input, Select, Slider, Switch, Checkbox, Button, Table, Modal, Tag, Tooltip, Progress, Card, message, Space, Badge } from 'antd';
import type { TabsProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend as ReLegend,
} from 'recharts';

const { TextArea } = Input;
const { Option } = Select;

type ConnectionStatus = 'connected' | 'disconnected' | 'syncing';

interface Supplier {
  id: string;
  name: string;
  logo: string;
  status: ConnectionStatus;
  apiEndpoint: string;
  lastSyncTime: string;
  skuCount: number;
  priceCoverage: number;
  successCount: number;
  failCount: number;
  contact: string;
  phone: string;
  email: string;
  syncInterval: number;
  categories: string[];
}

interface SyncLog {
  key: string;
  time: string;
  supplier: string;
  supplierId: string;
  skuCount: number;
  newCount: number;
  updateCount: number;
  failCount: number;
  duration: string;
  status: 'success' | 'partial' | 'failed';
  errorStack?: string;
}

const mockSuppliers: Supplier[] = [
  {
    id: 'SUP001',
    name: '东鹏瓷砖官方供应商',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=dongpeng&backgroundColor=FBF2ED',
    status: 'connected',
    apiEndpoint: 'https://api.dongpeng.com/v1/sync',
    lastSyncTime: '2024-06-12 14:30:00',
    skuCount: 2438,
    priceCoverage: 98.5,
    successCount: 2435,
    failCount: 3,
    contact: '李经理',
    phone: '13800138001',
    email: 'li@dongpeng.com',
    syncInterval: 60,
    categories: ['瓷砖', '石材', '马赛克'],
  },
  {
    id: 'SUP002',
    name: '圣象地板供应链',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=shengxiang&backgroundColor=F2F6F7',
    status: 'syncing',
    apiEndpoint: 'https://openapi.shengxiang.cn/api/sku',
    lastSyncTime: '2024-06-12 14:00:00',
    skuCount: 1856,
    priceCoverage: 92.3,
    successCount: 1856,
    failCount: 0,
    contact: '王总',
    phone: '13900139002',
    email: 'wang@shengxiang.cn',
    syncInterval: 30,
    categories: ['实木地板', '复合地板', '强化地板'],
  },
  {
    id: 'SUP003',
    name: '立邦涂料直供',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=libang&backgroundColor=FBF6EC',
    status: 'connected',
    apiEndpoint: 'https://api.nipponpaint.com.cn/v2',
    lastSyncTime: '2024-06-12 13:00:00',
    skuCount: 689,
    priceCoverage: 100,
    successCount: 689,
    failCount: 0,
    contact: '陈主管',
    phone: '13700137003',
    email: 'chen@nippon.com',
    syncInterval: 240,
    categories: ['乳胶漆', '木器漆', '腻子'],
  },
  {
    id: 'SUP004',
    name: '欧派橱柜联盟',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=oupai&backgroundColor=F5F2ED',
    status: 'disconnected',
    apiEndpoint: 'https://api.oppein.com/sync',
    lastSyncTime: '2024-06-10 09:00:00',
    skuCount: 423,
    priceCoverage: 67.8,
    successCount: 418,
    failCount: 5,
    contact: '刘经理',
    phone: '13600136004',
    email: 'liu@oppein.com',
    syncInterval: 1440,
    categories: ['整体橱柜', '衣柜', '木门'],
  },
  {
    id: 'SUP005',
    name: '箭牌卫浴供应',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=jianpai&backgroundColor=FBF2ED',
    status: 'connected',
    apiEndpoint: 'https://open.arrow.com/api/goods',
    lastSyncTime: '2024-06-12 12:00:00',
    skuCount: 1245,
    priceCoverage: 95.1,
    successCount: 1242,
    failCount: 3,
    contact: '赵女士',
    phone: '13500135005',
    email: 'zhao@arrow.com',
    syncInterval: 60,
    categories: ['马桶', '花洒', '浴室柜'],
  },
];

const mockSyncLogs: SyncLog[] = [
  { key: '1', time: '2024-06-12 14:30:00', supplier: '东鹏瓷砖', supplierId: 'SUP001', skuCount: 2438, newCount: 12, updateCount: 89, failCount: 3, duration: '2分38秒', status: 'partial', errorStack: 'Error: SKU-2048 图片URL失效 (404)\n  at syncImage (/app/sync.js:128)\n  at processSKU (/app/sync.js:201)' },
  { key: '2', time: '2024-06-12 14:00:00', supplier: '圣象地板', supplierId: 'SUP002', skuCount: 1856, newCount: 0, updateCount: 156, failCount: 0, duration: '1分45秒', status: 'success' },
  { key: '3', time: '2024-06-12 13:00:00', supplier: '立邦涂料', supplierId: 'SUP003', skuCount: 689, newCount: 5, updateCount: 23, failCount: 0, duration: '42秒', status: 'success' },
  { key: '4', time: '2024-06-12 12:00:00', supplier: '箭牌卫浴', supplierId: 'SUP005', skuCount: 1245, newCount: 8, updateCount: 67, failCount: 3, duration: '1分12秒', status: 'partial' },
  { key: '5', time: '2024-06-12 11:00:00', supplier: '东鹏瓷砖', supplierId: 'SUP001', skuCount: 2438, newCount: 3, updateCount: 45, failCount: 0, duration: '2分15秒', status: 'success' },
  { key: '6', time: '2024-06-12 10:00:00', supplier: '欧派橱柜', supplierId: 'SUP004', skuCount: 0, newCount: 0, updateCount: 0, failCount: 0, duration: '5秒', status: 'failed', errorStack: 'Error: Connection timeout after 10000ms\n  at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1145)' },
  { key: '7', time: '2024-06-12 09:00:00', supplier: '立邦涂料', supplierId: 'SUP003', skuCount: 689, newCount: 0, updateCount: 12, failCount: 0, duration: '38秒', status: 'success' },
];

const errorTrendData = [
  { date: '06/06', count: 8 },
  { date: '06/07', count: 5 },
  { date: '06/08', count: 12 },
  { date: '06/09', count: 6 },
  { date: '06/10', count: 18 },
  { date: '06/11', count: 9 },
  { date: '06/12', count: 14 },
];

const errorCategoryData = [
  { name: '网络超时', value: 42, color: '#D47042' },
  { name: '格式错误', value: 28, color: '#CBA356' },
  { name: '鉴权失败', value: 15, color: '#6B8E9F' },
  { name: '数据异常', value: 12, color: '#DE8F69' },
  { name: '其他', value: 8, color: '#757064' },
];

const errorDetailData = [
  { key: '1', time: '06-12 14:32:18', supplier: '东鹏瓷砖', type: '网络超时', code: 'ETIMEDOUT', sku: 'DP-2048', message: '请求供应商图片服务器超时', count: 3 },
  { key: '2', time: '06-12 14:28:05', supplier: '欧派橱柜', type: '鉴权失败', code: '401', sku: '-', message: 'API Token 已过期', count: 1 },
  { key: '3', time: '06-12 13:15:42', supplier: '箭牌卫浴', type: '格式错误', code: 'FORMAT', sku: 'AR-1888', message: '价格字段格式异常: null', count: 2 },
  { key: '4', time: '06-12 11:48:33', supplier: '圣象地板', type: '数据异常', code: 'VALIDATE', sku: 'SX-8842', message: '规格参数缺失: 厚度', count: 5 },
  { key: '5', time: '06-12 10:22:11', supplier: '东鹏瓷砖', type: '其他', code: 'UNKNOWN', sku: 'DP-1024', message: '未知错误，需人工介入', count: 1 },
];

const statusBadge = (status: ConnectionStatus) => {
  const map = {
    connected: { icon: Wifi, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', text: '已连接', textColor: 'text-emerald-700' },
    disconnected: { icon: WifiOff, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200', text: '未连接', textColor: 'text-rose-700' },
    syncing: { icon: RefreshCw, color: 'text-amber-500 animate-spin', bg: 'bg-amber-50', border: 'border-amber-200', text: '同步中', textColor: 'text-amber-700' },
  };
  const cfg = map[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.border} ${cfg.textColor}`}>
      <Icon className={`w-3 h-3 ${cfg.color}`} />
      {cfg.text}
    </span>
  );
};

const syncStatusBadge = (status: SyncLog['status']) => {
  const map = {
    success: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: '成功' },
    partial: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle, label: '部分成功' },
    failed: { color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle, label: '失败' },
  };
  const cfg = map[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

const fieldMappingData = [
  { platform: 'SKU编码', supplier: 'goods_code', editable: true },
  { platform: '商品名称', supplier: 'product_name', editable: true },
  { platform: '品牌', supplier: 'brand_name', editable: true },
  { platform: '规格描述', supplier: 'spec_desc', editable: true },
  { platform: '市场价', supplier: 'market_price', editable: true },
];

const SupplyChainAPI: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null);
  const [syncInterval, setSyncInterval] = useState(60);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [mappings, setMappings] = useState(fieldMappingData);
  const [editingMappingIdx, setEditingMappingIdx] = useState<number | null>(null);
  const [eventSubs, setEventSubs] = useState<string[]>(['price', 'stock']);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [addModalOpen, setAddModalOpen] = useState(false);

  const openConfig = (supplier: Supplier) => {
    setCurrentSupplier(supplier);
    setSyncInterval(supplier.syncInterval);
    setDrawerOpen(true);
  };

  const filteredSuppliers = mockSuppliers.filter(s => {
    if (searchValue && !s.name.includes(searchValue) && !s.id.includes(searchValue)) return false;
    if (statusFilter && s.status !== statusFilter) return false;
    return true;
  });

  const supplierColumns: ColumnsType<SyncLog> = [
    { title: '时间', dataIndex: 'time', width: 170, render: v => <span className="font-mono text-xs text-carbon-700">{v}</span> },
    { title: '供应商', dataIndex: 'supplier', width: 120, render: v => <span className="text-sm text-carbon-700">{v}</span> },
    { title: 'SKU数', dataIndex: 'skuCount', width: 90, render: v => <span className="font-mono text-sm text-carbon-800">{v.toLocaleString()}</span> },
    { title: '新增', dataIndex: 'newCount', width: 80, render: v => <span className="font-mono text-sm text-emerald-600">+{v}</span> },
    { title: '更新', dataIndex: 'updateCount', width: 80, render: v => <span className="font-mono text-sm text-haze-600">{v}</span> },
    {
      title: '失败', dataIndex: 'failCount', width: 80,
      render: v => v > 0 ? <span className="font-mono text-sm text-rose-600 font-semibold">{v}</span> : <span className="font-mono text-sm text-carbon-400">0</span>,
    },
    { title: '耗时', dataIndex: 'duration', width: 100, render: v => <span className="font-mono text-xs text-ivory-600">{v}</span> },
    { title: '状态', dataIndex: 'status', width: 110, render: (v) => syncStatusBadge(v) },
  ];

  const tabItems: TabsProps['items'] = [
    {
      key: 'suppliers',
      label: (
        <span className="flex items-center gap-2 text-sm">
          <Network className="w-4 h-4" />
          供应商对接
          <span className="ml-1 inline-flex items-center justify-center h-5 px-2 rounded-full bg-terracotta-100 text-terracotta-700 text-xs font-mono font-semibold">{mockSuppliers.length}</span>
        </span>
      ),
      children: (
        <div className="space-y-4 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center bg-white border border-ivory-300 rounded-btn px-3 py-2 gap-2 w-64">
                <Search className="w-4 h-4 text-ivory-500 shrink-0" />
                <input type="text" value={searchValue} onChange={e => setSearchValue(e.target.value)} placeholder="搜索供应商名称/编号..." className="bg-transparent outline-none flex-1 text-sm" />
              </div>
              <Select placeholder="连接状态" className="w-36" allowClear value={statusFilter} onChange={setStatusFilter} style={{ borderRadius: 8 }}>
                <Option value="connected">已连接</Option>
                <Option value="syncing">同步中</Option>
                <Option value="disconnected">未连接</Option>
              </Select>
            </div>
            <button onClick={() => setAddModalOpen(true)} className="btn-primary text-sm">
              <Plus className="w-4 h-4" />
              添加供应商
            </button>
          </div>

          <div className="grid gap-4">
            {filteredSuppliers.map((s, idx) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="card-base p-5 hover:!shadow-card-hover transition-all"
              >
                <div className="flex flex-wrap items-start gap-5">
                  <div className="flex items-center gap-4 shrink-0">
                    <img src={s.logo} alt={s.name} className="w-14 h-14 rounded-2xl border border-ivory-200 bg-white p-1.5" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-carbon-800">{s.name}</h4>
                        {statusBadge(s.status)}
                      </div>
                      <div className="text-xs text-ivory-500 font-mono">{s.id} · {s.contact} {s.phone}</div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {s.categories.map(c => (
                          <span key={c} className="px-2 py-0.5 rounded-md bg-ivory-100 text-ivory-700 text-[11px] border border-ivory-200">{c}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 min-w-[400px]">
                    <div>
                      <div className="text-[11px] text-ivory-500 mb-1 uppercase tracking-wider">API端点</div>
                      <code className="text-xs font-mono text-haze-700 bg-haze-50 px-2 py-1 rounded-md truncate block max-w-[220px]">{s.apiEndpoint}</code>
                    </div>
                    <div>
                      <div className="text-[11px] text-ivory-500 mb-1 uppercase tracking-wider">上次同步</div>
                      <div className="font-mono text-xs text-carbon-700">{dayjs(s.lastSyncTime).format('MM-DD HH:mm')}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-ivory-500 mb-1 uppercase tracking-wider">SKU数量</div>
                      <div className="font-mono text-lg font-bold text-carbon-800">{s.skuCount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-ivory-500 uppercase tracking-wider">价格覆盖率</span>
                        <span className="font-mono text-xs font-semibold text-terracotta-600">{s.priceCoverage}%</span>
                      </div>
                      <Progress percent={s.priceCoverage} showInfo={false} size="small" strokeColor={{ '0%': '#CBA356', '100%': '#C4623A' }} trailColor="#E8E4DD" />
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col gap-3 items-end">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="font-mono font-semibold">{s.successCount}</span>
                        <span className="text-xs">成功</span>
                      </span>
                      {s.failCount > 0 && (
                        <Tooltip title="查看错误详情">
                          <span className="inline-flex items-center gap-1 text-rose-600 cursor-pointer hover:underline">
                            <XCircle className="w-3.5 h-3.5" />
                            <span className="font-mono font-semibold">{s.failCount}</span>
                            <span className="text-xs">失败</span>
                          </span>
                        </Tooltip>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Tooltip title="配置"><button onClick={() => openConfig(s)} className="w-9 h-9 rounded-lg bg-haze-50 hover:bg-haze-100 text-haze-600 flex items-center justify-center transition-colors"><Settings className="w-4 h-4" /></button></Tooltip>
                      <Tooltip title="立即同步">
                        <button
                          onClick={() => {
                            message.loading({ content: `正在从「${s.name}」同步SKU数据...`, key: 'sync-' + s.id, duration: 0 });
                            setTimeout(() => {
                              message.success({ content: `同步完成：新增12款、更新价格 ${Math.floor(Math.random() * 80 + 20)} 项`, key: 'sync-' + s.id });
                            }, 1600);
                          }}
                          className="w-9 h-9 rounded-lg bg-wood-50 hover:bg-wood-100 text-wood-600 flex items-center justify-center transition-colors"
                        >
                          <RefreshIcon className="w-4 h-4" />
                        </button>
                      </Tooltip>
                      <Tooltip title="测试连接">
                        <button
                          onClick={() => {
                            message.loading({ content: `正在测试「${s.name}」API连通性...`, key: 'tc-' + s.id, duration: 0 });
                            setTimeout(() => {
                              const ok = Math.random() > 0.15;
                              if (ok) {
                                message.success({ content: `连接成功！响应时间 ${Math.floor(Math.random() * 80 + 20)}ms，鉴权通过`, key: 'tc-' + s.id });
                              } else {
                                message.error({ content: '连接失败：504 Gateway Timeout，请检查API地址或联系供应商', key: 'tc-' + s.id });
                              }
                            }, 1200);
                          }}
                          className="w-9 h-9 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors"
                        >
                          <Zap className="w-4 h-4" />
                        </button>
                      </Tooltip>
                      <Tooltip title={s.status === 'disconnected' ? '启用' : '停用'}>
                        <button
                          onClick={() => {
                            if (s.status === 'disconnected') {
                              message.success(`已启用「${s.name}」的数据同步通道`);
                            } else {
                              Modal.confirm({
                                title: `确认停用「${s.name}」？`,
                                content: '停用后将暂停自动库存同步和订单推送，正在进行的同步任务将不受影响。',
                                okText: '确认停用', okButtonProps: { danger: true }, cancelText: '取消',
                                onOk: () => message.warning(`已停用「${s.name}」`),
                              });
                            }
                          }}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${s.status === 'disconnected' ? 'bg-amber-50 hover:bg-amber-100 text-amber-600' : 'bg-rose-50 hover:bg-rose-100 text-rose-600'}`}
                        >
                          {s.status === 'disconnected' ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: 'logs',
      label: (
        <span className="flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4" />
          同步日志
        </span>
      ),
      children: (
        <div className="pt-2">
          <Table<SyncLog>
            columns={supplierColumns}
            dataSource={mockSyncLogs}
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `共 ${t} 条记录` }}
            expandable={{
              expandedRowRender: record => record.errorStack ? (
                <pre className="bg-carbon-900 text-emerald-400 p-4 rounded-card text-xs font-mono whitespace-pre-wrap leading-relaxed">
                  {record.errorStack}
                </pre>
              ) : <p className="text-ivory-500 text-sm">无错误详情</p>,
              rowExpandable: record => !!record.errorStack,
            }}
            rowClassName={(record) => record.status === 'failed' ? '!bg-rose-50/40' : record.status === 'partial' ? '!bg-amber-50/30' : ''}
          />
        </div>
      ),
    },
    {
      key: 'call_logs',
      label: (
        <span className="flex items-center gap-2 text-sm">
          <Activity className="w-4 h-4" />
          调用日志
        </span>
      ),
      children: (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Select defaultValue="all" className="!w-40" size="middle">
                <Option value="all">全部供应商</Option>
                <Option value="1">东方建材集团</Option>
                <Option value="2">精工陶瓷</Option>
              </Select>
              <Select defaultValue="all" className="!w-32" size="middle">
                <Option value="all">全部状态</Option>
                <Option value="2">2xx 成功</Option>
                <Option value="4">4xx 客户端错误</Option>
                <Option value="5">5xx 服务端错误</Option>
              </Select>
              <Select defaultValue="all" className="!w-40" size="middle">
                <Option value="all">全部接口</Option>
                <Option value="sku">SKU查询</Option>
                <Option value="stock">库存同步</Option>
                <Option value="order">订单推送</Option>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => message.success('调用日志已导出为 CSV（328 条）')}
                className="btn-secondary text-sm !py-2"
              >
                <Button type="text" icon={<FileText className="w-4 h-4" />} className="!p-0 !h-auto">导出日志</Button>
              </button>
            </div>
          </div>
          <Table
            size="middle"
            pagination={{ pageSize: 8, showSizeChanger: true, showTotal: t => `共 ${t} 条 API 调用记录` }}
            columns={[
              {
                title: '时间',
                dataIndex: 'time',
                width: 170,
                render: (v: string) => (
                  <div>
                    <div className="font-mono text-xs text-carbon-700">{dayjs(v).format('YYYY-MM-DD HH:mm:ss')}</div>
                    <div className="font-mono text-[10px] text-ivory-400 mt-0.5">+{dayjs(v).millisecond()}ms</div>
                  </div>
                ),
                sorter: (a: any, b: any) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf(),
                defaultSortOrder: 'descend',
              } as any,
              {
                title: '接口',
                dataIndex: 'endpoint',
                width: 260,
                render: (v: string, r: any) => (
                  <div className="flex items-start gap-2">
                    <Tag
                      color={
                        r.method === 'GET' ? 'blue' :
                        r.method === 'POST' ? 'green' :
                        r.method === 'PUT' ? 'orange' : 'default'
                      }
                      className="!text-[10px] !mx-0 shrink-0 font-mono font-bold"
                    >{r.method}</Tag>
                    <div className="min-w-0">
                      <div className="font-mono text-xs text-carbon-800 break-all">{v}</div>
                      <div className="text-[10px] text-ivory-500 mt-0.5 flex items-center gap-1">
                        <Shield className="w-3 h-3" />供应商: <span className="font-medium">{r.supplier}</span>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                title: '状态码',
                dataIndex: 'statusCode',
                width: 100,
                render: (code: number) => (
                  <div className="flex items-center gap-1.5">
                    {code < 300 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : code < 500 ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <span className={`font-mono text-sm font-bold ${
                      code < 300 ? 'text-emerald-600' : code < 500 ? 'text-amber-600' : 'text-rose-600'
                    }`}>{code}</span>
                  </div>
                ),
              },
              {
                title: '耗时',
                dataIndex: 'duration',
                width: 130,
                render: (ms: number) => (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-mono text-xs font-bold ${
                        ms < 200 ? 'text-emerald-600' : ms < 800 ? 'text-haze-600' : 'text-rose-600'
                      }`}>{ms} ms</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-ivory-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          ms < 200 ? 'bg-emerald-500' : ms < 800 ? 'bg-haze-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, ms / 10)}%` }}
                      />
                    </div>
                  </div>
                ),
              },
              {
                title: '请求摘要',
                dataIndex: 'summary',
                render: (v: string, r: any) => (
                  <div className="text-xs text-carbon-700">
                    <div className="line-clamp-2">{v}</div>
                    {r.responseSize && (
                      <div className="text-[10px] text-ivory-400 mt-1 font-mono">
                        响应 {r.responseSize} KB · {r.traceId}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                title: '操作',
                key: 'act',
                width: 120,
                fixed: 'right',
                render: (_, r: any) => (
                  <Space size="small">
                    <Button
                      type="link"
                      size="small"
                      icon={<Eye className="w-3 h-3" />}
                      onClick={() => Modal.info({
                        title: `API 调用详情 #${r.traceId}`,
                        width: 800,
                        content: (
                          <div className="space-y-4 pt-2">
                            <div>
                              <p className="text-xs text-ivory-500 mb-1">请求 URL</p>
                              <code className="block bg-carbon-900 text-emerald-400 p-3 rounded text-xs font-mono break-all">
                                {r.method} {r.endpoint}
                              </code>
                            </div>
                            <div>
                              <p className="text-xs text-ivory-500 mb-1">响应体（摘要）</p>
                              <pre className="bg-carbon-900 text-ivory-200 p-3 rounded text-xs font-mono overflow-x-auto max-h-60">
{r.statusCode < 300 ? `{
  "code": 0,
  "message": "success",
  "data": { "items": ${Math.floor(Math.random() * 100)}, "total": ${Math.floor(Math.random() * 500)} }
}` : `{
  "code": ${r.statusCode},
  "message": "${r.statusCode === 404 ? 'Not Found' : r.statusCode === 500 ? 'Internal Server Error' : 'Gateway Timeout'}",
  "trace_id": "${r.traceId}"
}`}
                              </pre>
                            </div>
                          </div>
                        ),
                      })}
                    >详情</Button>
                    {r.statusCode >= 400 && (
                      <Button
                        type="link"
                        size="small"
                        danger
                        icon={<Repeat className="w-3 h-3" />}
                        onClick={() => {
                          message.loading({ content: `正在重试请求 #${r.traceId}...`, key: 'retry-' + r.traceId, duration: 0 });
                          setTimeout(() => {
                            message.success({ content: `重试成功！响应 ${Math.floor(Math.random() * 200 + 80)}ms`, key: 'retry-' + r.traceId });
                          }, 1500);
                        }}
                      >重试</Button>
                    )}
                  </Space>
                ),
              },
            ] as ColumnsType<any>}
            dataSource={Array.from({ length: 20 }).map((_, i) => {
              const statusPool = [200, 200, 200, 200, 200, 201, 204, 400, 401, 404, 500, 502, 504];
              const code = statusPool[Math.floor(Math.random() * statusPool.length)];
              const endpoints = [
                ['GET', '/api/v1/sku/list?category=tile&page=1&size=50', '查询瓷砖分类SKU列表，返回48条记录'],
                ['POST', '/api/v1/stock/sync/batch', '批量同步库存数据（SKU编号：SKU-23841, SKU-23842等共12款）'],
                ['POST', '/api/v1/order/push', '推送订单 PO-20240612-0891：业主王先生，3件商品，合计¥18,620'],
                ['GET', '/api/v1/price/query?sku=SKU-23841', '查询SKU-23841最新价格和阶梯折扣'],
                ['PUT', '/api/v1/order/status/PO-20240612-0891', '更新订单状态为"已发货"，运单号SF1234567890'],
              ];
              const [method, endpoint, summary] = endpoints[i % 5];
              const suppliers = ['东方建材集团', '精工陶瓷', '宜家木地板', '海尔智能家居'];
              return {
                key: 'cl-' + i,
                time: dayjs().subtract(i * 13 + Math.floor(Math.random() * 10), 'minute').format('YYYY-MM-DD HH:mm:ss.SSS'),
                method,
                endpoint,
                statusCode: code,
                duration: code < 300 ? Math.floor(Math.random() * 400 + 40) : Math.floor(Math.random() * 3000 + 800),
                summary,
                supplier: suppliers[i % 4],
                responseSize: Math.floor(Math.random() * 200 + 10),
                traceId: 'TRACE-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
              };
            })}
            rowClassName={(r: any) => r.statusCode >= 500 ? '!bg-rose-50/40' : r.statusCode >= 400 ? '!bg-amber-50/30' : ''}
            scroll={{ x: 1200 }}
          />
        </div>
      ),
    },
    {
      key: 'errors',
      label: (
        <span className="flex items-center gap-2 text-sm">
          <AlertOctagon className="w-4 h-4" />
          错误监控
          <span className="ml-1 inline-flex items-center justify-center h-5 px-2 rounded-full bg-rose-100 text-rose-700 text-xs font-mono font-semibold">
            {errorDetailData.reduce((a, b) => a + b.count, 0)}
          </span>
        </span>
      ),
      children: (
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 card-base p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-serif font-semibold text-carbon-800">近7天错误趋势</h4>
                  <p className="text-xs text-ivory-500">每日错误发生次数</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  <TrendingDown className="w-3 h-3" />
                  较上周 +18.5%
                </span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={errorTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DD" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#757064' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#757064' }} axisLine={false} tickLine={false} />
                  <ReTooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8E4DD', borderRadius: 12 }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#D47042" strokeWidth={3} dot={{ r: 4, fill: '#D47042', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="lg:col-span-2 card-base p-5">
              <h4 className="font-serif font-semibold text-carbon-800 mb-1">错误分类统计</h4>
              <p className="text-xs text-ivory-500 mb-2">按错误类型占比</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={errorCategoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={2}>
                    {errorCategoryData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <ReTooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {errorCategoryData.slice(0, 4).map(e => (
                  <div key={e.name} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                    <span className="text-ivory-600 truncate">{e.name}</span>
                    <span className="font-mono text-carbon-700 ml-auto">{e.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Card className="!rounded-card !shadow-card !border-ivory-200 !p-0">
            <div className="px-5 py-4 border-b border-ivory-200 flex items-center justify-between">
              <h4 className="font-serif font-semibold text-carbon-800">错误详情</h4>
              <button className="text-xs text-terracotta-600 font-medium hover:underline">批量重试失败任务</button>
            </div>
            <Table
              dataSource={errorDetailData}
              pagination={false}
              columns={[
                { title: '时间', dataIndex: 'time', width: 140, render: v => <span className="font-mono text-xs text-carbon-700">{v}</span> },
                { title: '供应商', dataIndex: 'supplier', width: 110 },
                { title: '错误类型', dataIndex: 'type', width: 110, render: v => <Tag color={v === '网络超时' ? 'red' : v === '鉴权失败' ? 'orange' : v === '格式错误' ? 'gold' : v === '数据异常' ? 'blue' : 'default'}>{v}</Tag> },
                { title: '错误码', dataIndex: 'code', width: 100, render: v => <code className="font-mono text-xs bg-ivory-100 px-2 py-0.5 rounded text-haze-700">{v}</code> },
                { title: '关联SKU', dataIndex: 'sku', width: 120, render: v => v === '-' ? <span className="text-ivory-400">-</span> : <span className="font-mono text-xs">{v}</span> },
                { title: '错误信息', dataIndex: 'message', ellipsis: true, render: v => <span className="text-sm text-carbon-600">{v}</span> },
                { title: '次数', dataIndex: 'count', width: 70, render: v => <span className="font-mono text-sm text-rose-600 font-semibold">×{v}</span> },
                {
                  title: '操作', width: 140,
                  render: () => (
                    <div className="flex items-center gap-1">
                      <button className="px-2.5 py-1 rounded-md text-xs bg-haze-50 hover:bg-haze-100 text-haze-600 transition-colors">查看</button>
                      <button className="px-2.5 py-1 rounded-md text-xs bg-wood-50 hover:bg-wood-100 text-wood-600 transition-colors">重试</button>
                      <button className="px-2.5 py-1 rounded-md text-xs text-ivory-500 hover:text-carbon-700 transition-colors">忽略</button>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-carbon-800">供应链对接配置</h1>
          <p className="text-sm text-ivory-600 mt-1">统一管理建材供应商API对接 · 监控同步状态</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-ivory-600">
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span>在线 <span className="font-mono font-semibold text-carbon-700">{mockSuppliers.filter(s => s.status !== 'disconnected').length}</span>/{mockSuppliers.length}</span></div>
          <div className="flex items-center gap-2"><Activity className="w-4 h-4" /><span>今日同步 <span className="font-mono font-semibold text-carbon-700">{mockSyncLogs.length}</span> 次</span></div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '对接供应商', value: mockSuppliers.length, icon: Database, color: 'from-haze-400 to-haze-600' },
          { label: 'SKU总量', value: mockSuppliers.reduce((a, b) => a + b.skuCount, 0).toLocaleString(), icon: Boxes, color: 'from-wood-400 to-wood-600' },
          { label: '今日新增', value: mockSyncLogs.reduce((a, b) => a + b.newCount, 0), icon: Plus, color: 'from-emerald-400 to-emerald-600' },
          { label: '今日失败', value: mockSyncLogs.reduce((a, b) => a + b.failCount, 0), icon: AlertTriangle, color: 'from-rose-400 to-rose-600' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card-base p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-sm`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-ivory-600">{item.label}</div>
                  <div className="font-mono text-xl font-bold text-carbon-800">{item.value}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Card className="!rounded-card !shadow-card !border-ivory-200">
        <Tabs defaultActiveKey="suppliers" items={tabItems} size="large" className="supplychain-tabs" />
      </Card>

      <Drawer
        title={
          <div className="flex items-center gap-3 pr-8">
            {currentSupplier && <img src={currentSupplier.logo} alt="" className="w-9 h-9 rounded-xl border border-ivory-200 bg-white p-1" />}
            <div>
              <h3 className="font-serif font-semibold text-carbon-800">{currentSupplier?.name ?? '配置供应商'}</h3>
              {currentSupplier && <span className="text-xs text-ivory-500 font-mono">{currentSupplier.id}</span>}
            </div>
          </div>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={560}
        destroyOnClose
        extra={
          <div className="flex items-center gap-2">
            <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-btn text-sm text-carbon-600 hover:bg-ivory-100 transition-colors">取消</button>
            <button className="btn-primary text-sm !py-2"><Shield className="w-4 h-4" />保存配置</button>
          </div>
        }
      >
        {currentSupplier && (
          <div className="space-y-6 pr-1">
            <section>
              <h4 className="text-sm font-semibold text-carbon-800 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-ivory-500" />
                基础信息
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-ivory-600 mb-1.5">供应商名称</label>
                  <Input size="middle" defaultValue={currentSupplier.name} style={{ borderRadius: 8 }} />
                </div>
                <div>
                  <label className="block text-xs text-ivory-600 mb-1.5">对接人</label>
                  <Input size="middle" defaultValue={currentSupplier.contact} style={{ borderRadius: 8 }} />
                </div>
                <div>
                  <label className="block text-xs text-ivory-600 mb-1.5">联系电话</label>
                  <Input size="middle" defaultValue={currentSupplier.phone} style={{ borderRadius: 8 }} />
                </div>
                <div>
                  <label className="block text-xs text-ivory-600 mb-1.5">邮箱</label>
                  <Input size="middle" defaultValue={currentSupplier.email} style={{ borderRadius: 8 }} />
                </div>
              </div>
            </section>

            <div className="h-px bg-ivory-200" />

            <section>
              <h4 className="text-sm font-semibold text-carbon-800 mb-3 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-ivory-500" />
                API配置
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-ivory-600 mb-1.5">API Endpoint</label>
                  <Input size="middle" defaultValue={currentSupplier.apiEndpoint} style={{ borderRadius: 8 }} prefix={<Link2 className="w-4 h-4 text-ivory-400" />} />
                </div>
                <div>
                  <label className="block text-xs text-ivory-600 mb-1.5">API Key</label>
                  <Input.Password
                    size="middle"
                    value="sk_live_8x9f2m7q4p6r1s3t5u8v"
                    style={{ borderRadius: 8 }}
                    iconRender={(visible) => visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    addonAfter={<button className="text-haze-600 hover:text-haze-800 transition-colors"><Copy className="w-4 h-4" /></button>}
                  />
                </div>
                <div>
                  <label className="block text-xs text-ivory-600 mb-1.5">API Secret</label>
                  <Input.Password
                    size="middle"
                    value="secret_w9d3h5j7k9l2n4p6"
                    style={{ borderRadius: 8 }}
                    iconRender={(visible) => visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  />
                </div>
              </div>
            </section>

            <div className="h-px bg-ivory-200" />

            <section>
              <h4 className="text-sm font-semibold text-carbon-800 mb-3 flex items-center gap-2">
                <Repeat className="w-4 h-4 text-ivory-500" />
                同步设置
              </h4>
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-ivory-600">同步间隔</label>
                    <span className="font-mono text-sm font-semibold text-terracotta-600">
                      {syncInterval < 60 ? `${syncInterval} 分钟` : syncInterval < 1440 ? `${Math.floor(syncInterval / 60)} 小时` : `${Math.floor(syncInterval / 1440)} 天`}
                    </span>
                  </div>
                  <Slider
                    min={15}
                    max={1440}
                    marks={{ 15: '15分', 30: '30分', 60: '1小时', 240: '4小时', 1440: '1天' }}
                    step={null}
                    value={syncInterval}
                    onChange={v => setSyncInterval(v as number)}
                    tooltip={{ formatter: null }}
                    styles={{ track: { background: 'linear-gradient(to right, #CBA356, #C4623A)' } }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-ivory-600 mb-2">SKU分类范围</label>
                  <Checkbox.Group defaultValue={currentSupplier.categories} style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {['瓷砖', '地板', '涂料', '卫浴', '橱柜', '石材', '马赛克', '腻子', '木门', '衣柜'].map(c => (
                      <Checkbox key={c} value={c} className="!text-sm">{c}</Checkbox>
                    ))}
                  </Checkbox.Group>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  {[
                    { label: '价格同步', icon: DollarSign, defaultChecked: true },
                    { label: '库存同步', icon: Boxes, defaultChecked: true },
                    { label: '图片同步', icon: Image, defaultChecked: true },
                    { label: '规格同步', icon: Ruler, defaultChecked: false },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-ivory-50 border border-ivory-200">
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-ivory-500" />
                          <span className="text-sm text-carbon-700">{item.label}</span>
                        </div>
                        <Switch defaultChecked={item.defaultChecked} size="small" style={{ backgroundColor: item.defaultChecked ? '#C4623A' : undefined }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <div className="h-px bg-ivory-200" />

            <section>
              <h4 className="text-sm font-semibold text-carbon-800 mb-3 flex items-center gap-2">
                <Database className="w-4 h-4 text-ivory-500" />
                字段映射
              </h4>
              <div className="rounded-xl border border-ivory-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-ivory-50">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-ivory-600 w-1/3">平台字段</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-ivory-600 w-1/3">供应商字段</th>
                      <th className="text-center px-4 py-2.5 text-xs font-medium text-ivory-600 w-1/3">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappings.map((m, idx) => (
                      <tr key={idx} className="border-t border-ivory-100">
                        <td className="px-4 py-2.5 text-carbon-700">{m.platform}</td>
                        <td className="px-4 py-2.5">
                          {editingMappingIdx === idx ? (
                            <Input size="small" defaultValue={m.supplier} style={{ borderRadius: 6 }} autoFocus onBlur={() => setEditingMappingIdx(null)} />
                          ) : (
                            <code className="font-mono text-xs text-haze-700 bg-haze-50 px-2 py-1 rounded">{m.supplier}</code>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {editingMappingIdx === idx ? (
                            <button onClick={() => setEditingMappingIdx(null)} className="text-xs text-emerald-600 hover:underline mr-3">保存</button>
                          ) : (
                            <button onClick={() => setEditingMappingIdx(idx)} className="text-xs text-haze-600 hover:underline mr-3">编辑</button>
                          )}
                          {idx === mappings.length - 1 && (
                            <button onClick={() => setMappings([...mappings, { platform: '新字段', supplier: '', editable: true }])} className="text-xs text-terracotta-600 hover:underline">+新增</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="h-px bg-ivory-200" />

            <section>
              <h4 className="text-sm font-semibold text-carbon-800 mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4 text-ivory-500" />
                Webhook & 事件订阅
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-ivory-600 mb-1.5">Webhook URL</label>
                  <div className="flex items-center gap-2">
                    <Input
                      size="middle"
                      defaultValue={`https://api.juzhitong.com/webhook/supplier/${currentSupplier.id}`}
                      style={{ borderRadius: 8 }}
                      prefix={<Link2 className="w-4 h-4 text-ivory-400" />}
                      className="flex-1"
                    />
                    <Button
                      type="primary"
                      ghost
                      size="middle"
                      icon={<Zap className="w-4 h-4" />}
                      style={{ borderRadius: 8, borderColor: '#6B8E9F', color: '#6B8E9F' }}
                      onClick={() => {
                        message.loading({ content: '正在发送测试请求到 Webhook URL...', key: 'webhook-test', duration: 0 });
                        setTimeout(() => {
                          message.success({ content: '✅ Webhook 测试成功！供应商已接收事件推送，延迟 128ms', key: 'webhook-test' });
                        }, 1500);
                      }}
                    >
                      测试
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-ivory-600 mb-2">订阅事件（{eventSubs.length}/4）</label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { key: 'price', label: '价格变动' },
                      { key: 'stock', label: '库存告警' },
                      { key: 'order', label: '订单状态' },
                      { key: 'new', label: '新品上架' },
                    ].map(e => (
                      <Checkbox
                        key={e.key}
                        checked={eventSubs.includes(e.key)}
                        onChange={ev => {
                          const before = eventSubs.length;
                          if (ev.target.checked) {
                            setEventSubs([...eventSubs, e.key]);
                            message.success(`已订阅「${e.label}」事件`);
                          } else {
                            setEventSubs(eventSubs.filter(k => k !== e.key));
                            message.info(`已取消订阅「${e.label}」事件`);
                          }
                        }}
                        className="!text-sm"
                      >{e.label}</Checkbox>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <div className="flex gap-3 pt-2 border-t border-ivory-200 sticky bottom-0 bg-white -mx-6 px-6 py-4">
              <button
                onClick={() => {
                  message.loading({ content: `正在测试「${currentSupplier.name}」API 连通性...`, key: 'drawer-tc', duration: 0 });
                  setTimeout(() => {
                    const ok = Math.random() > 0.2;
                    if (ok) {
                      message.success({
                        content: (
                          <span>
                            ✅ 连接成功！<br />
                            <span className="font-mono text-xs opacity-80">
                              PING {currentSupplier.apiEndpoint} · 响应时间 {Math.floor(Math.random() * 120 + 30)}ms<br />
                              Token 鉴权: PASS · 接口权限: 12/12 可用
                            </span>
                          </span>
                        ),
                        key: 'drawer-tc',
                        duration: 4,
                      });
                    } else {
                      message.error({
                        content: '❌ 连接失败：Invalid AppID 或 Secret 不匹配，请核对配置后重试',
                        key: 'drawer-tc',
                        duration: 5,
                      });
                    }
                  }, 1400);
                }}
                className="btn-secondary text-sm flex-1 !py-2.5"
              >
                <Zap className="w-4 h-4" />
                测试连接
              </button>
              <button
                onClick={() => {
                  message.loading({ content: '正在保存供应商配置...', key: 'save-cfg', duration: 0 });
                  setTimeout(() => {
                    message.success({ content: `✅「${currentSupplier.name}」配置已保存，已加入 ${syncInterval} 分钟轮询队列`, key: 'save-cfg' });
                    setDrawerOpen(false);
                  }, 1000);
                }}
                className="btn-primary text-sm flex-1 !py-2.5"
              >
                <Shield className="w-4 h-4" />
                保存配置
              </button>
              <button
                onClick={() => Modal.confirm({
                  title: `删除「${currentSupplier.name}」对接配置？`,
                  content: (
                    <div className="pt-2 space-y-2 text-sm">
                      <AlertTriangle className="w-5 h-5 text-amber-500 mb-1" />
                      <p>该操作将：</p>
                      <ul className="space-y-1 text-xs text-ivory-600 pl-3 list-disc">
                        <li>立即停止所有自动同步（库存/价格/订单）</li>
                        <li>历史同步日志将保留 30 天</li>
                        <li>相关 SKU 将切换为"手动维护"模式</li>
                      </ul>
                    </div>
                  ),
                  okText: '确认删除',
                  okButtonProps: { danger: true },
                  cancelText: '取消',
                  onOk: () => {
                    message.error(`已删除「${currentSupplier.name}」的对接配置`);
                    setDrawerOpen(false);
                  },
                })}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-btn
                bg-rose-50 text-rose-700 text-sm font-medium border border-rose-200
                hover:bg-rose-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        title={<div className="flex items-center gap-2"><Plus className="w-5 h-5 text-terracotta-500" /><span className="font-serif">添加供应商对接</span></div>}
        footer={null}
        width={560}
      >
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs text-ivory-600 mb-1.5">供应商名称 *</label><Input size="middle" placeholder="请输入供应商名称" style={{ borderRadius: 8 }} /></div>
            <div><label className="block text-xs text-ivory-600 mb-1.5">对接人</label><Input size="middle" placeholder="姓名" style={{ borderRadius: 8 }} /></div>
          </div>
          <div><label className="block text-xs text-ivory-600 mb-1.5">API Endpoint *</label><Input size="middle" placeholder="https://..." style={{ borderRadius: 8 }} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs text-ivory-600 mb-1.5">API Key *</label><Input size="middle" style={{ borderRadius: 8 }} /></div>
            <div><label className="block text-xs text-ivory-600 mb-1.5">API Secret *</label><Input.Password size="middle" style={{ borderRadius: 8 }} /></div>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={() => setAddModalOpen(false)} className="btn-secondary flex-1">取消</button>
            <button onClick={() => setAddModalOpen(false)} className="btn-primary flex-1">创建对接</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SupplyChainAPI;
