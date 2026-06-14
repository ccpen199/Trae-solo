import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronDown,
  Search,
  Upload,
  Download,
  Eye,
  EyeOff,
  Plus,
  Minus,
  MoreHorizontal,
  Copy,
  Trash2,
  Edit,
  X,
  Image as ImageIcon,
  Upload as UploadIcon,
  Settings,
  Tag,
  Layers,
  DollarSign,
  Package,
  Paintbrush,
  Hammer,
  LayoutDashboard,
  Filter,
  CheckCircle2,
  Truck,
  Calendar,
  AlertTriangle,
  AlertOctagon,
  Factory,
  Truck as TruckIcon,
  Gauge,
} from 'lucide-react';
import { Table, Drawer, Tabs, Input, Select, Checkbox, InputNumber, Upload as AntUpload, Slider, Rate, Switch, message, Card, Modal, DatePicker, Progress } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
type TableRowSelection<T extends object = any> = TableProps<T>['rowSelection'];
import type { TabsProps, UploadFile, UploadProps } from 'antd';
import { clsx } from 'clsx';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

type SKUStatus = 'on_sale' | 'off_shelf';
type StockStatus = 'abundant' | 'normal' | 'warning' | 'out_of_stock';

interface CategoryNode {
  key: string;
  name: string;
  children?: CategoryNode[];
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

interface SKUItem {
  key: string;
  skuCode: string;
  name: string;
  image: string;
  category: string;
  categoryKey: string;
  brand: string;
  spec: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  priceChange: number;
  stock: number;
  stockStatus: StockStatus;
  safetyStock: number;
  status: SKUStatus;
  updatedAt: string;
  styles?: string[];
  processes?: string[];
  params?: { name: string; value: string }[];
}

const categories: CategoryNode[] = [
  {
    key: 'tile',
    name: '瓷砖',
    icon: Layers,
    count: 2456,
    children: [
      { key: 'tile-solid', name: '通体砖', count: 689 },
      { key: 'tile-polished', name: '抛光砖', count: 512 },
      { key: 'tile-porcelain', name: '瓷抛砖', count: 423 },
      { key: 'tile-glazed', name: '釉面砖', count: 456 },
      { key: 'tile-mosaic', name: '马赛克', count: 234 },
      { key: 'tile-antiqu', name: '仿古砖', count: 142 },
    ],
  },
  {
    key: 'floor',
    name: '地板',
    icon: LayoutDashboard,
    count: 1856,
    children: [
      { key: 'floor-solid', name: '实木地板', count: 456 },
      { key: 'floor-engineered', name: '多层实木复合', count: 389 },
      { key: 'floor-laminate', name: '强化复合', count: 523 },
      { key: 'floor-bamboo', name: '竹地板', count: 142 },
      { key: 'floor-spc', name: 'SPC石塑', count: 289 },
      { key: 'floor-cork', name: '软木地板', count: 57 },
    ],
  },
  {
    key: 'paint',
    name: '涂料',
    icon: Paintbrush,
    count: 689,
    children: [
      { key: 'paint-latex', name: '乳胶漆', count: 234 },
      { key: 'paint-wood', name: '木器漆', count: 156 },
      { key: 'paint-art', name: '艺术漆', count: 98 },
      { key: 'paint-primer', name: '底漆', count: 102 },
      { key: 'paint-putty', name: '腻子粉', count: 99 },
    ],
  },
  {
    key: 'bathroom',
    name: '卫浴',
    icon: Package,
    count: 1245,
    children: [
      { key: 'bath-toilet', name: '坐便器', count: 234 },
      { key: 'bath-shower', name: '花洒', count: 289 },
      { key: 'bath-basin', name: '台盆', count: 198 },
      { key: 'bath-cabinet', name: '浴室柜', count: 245 },
      { key: 'bath-bathtub', name: '浴缸', count: 89 },
      { key: 'bath-faucet', name: '龙头五金', count: 190 },
    ],
  },
  {
    key: 'cabinet',
    name: '橱柜衣柜',
    icon: Layers,
    count: 423,
  },
  {
    key: 'door',
    name: '门窗',
    icon: Package,
    count: 356,
  },
  {
    key: 'stone',
    name: '石材',
    icon: Layers,
    count: 289,
  },
  {
    key: 'hardware',
    name: '五金配件',
    icon: Hammer,
    count: 876,
  },
];

const mockSKUs: SKUItem[] = [
  {
    key: '1', skuCode: 'SKU-TILE-00128', name: '东鹏 通体大理石瓷砖 800×800mm',
    image: 'https://picsum.photos/seed/tile1/120/120', category: '瓷砖 / 通体砖', categoryKey: 'tile-solid',
    brand: '东鹏', spec: '800×800×10mm', unit: '片',
    costPrice: 68.5, salePrice: 128.0, priceChange: 5.2,
    stock: 12580, stockStatus: 'abundant', safetyStock: 2000, status: 'on_sale',
    updatedAt: '2024-06-12 14:23',
    styles: ['现代简约', '轻奢'], processes: ['薄贴法'],
    params: [{ name: '材质', value: '全瓷通体' }, { name: '吸水率', value: '≤0.5%' }, { name: '耐磨等级', value: 'PEI IV级' }],
  },
  {
    key: '2', skuCode: 'SKU-FLOOR-00892', name: '圣象 三层实木复合地板 15mm',
    image: 'https://picsum.photos/seed/floor1/120/120', category: '地板 / 多层实木复合', categoryKey: 'floor-engineered',
    brand: '圣象', spec: '1210×165×15mm', unit: '㎡',
    costPrice: 185.0, salePrice: 328.0, priceChange: -2.1,
    stock: 1580, stockStatus: 'normal', safetyStock: 800, status: 'on_sale',
    updatedAt: '2024-06-12 10:15',
    params: [{ name: '表板木种', value: '橡木' }, { name: '芯层', value: '松木' }, { name: '环保等级', value: 'E0级' }],
  },
  {
    key: '3', skuCode: 'SKU-PAINT-00421', name: '立邦 净味120竹炭抗甲醛乳胶漆 5L',
    image: 'https://picsum.photos/seed/paint1/120/120', category: '涂料 / 乳胶漆', categoryKey: 'paint-latex',
    brand: '立邦', spec: '5L/桶', unit: '桶',
    costPrice: 258.0, salePrice: 498.0, priceChange: 0,
    stock: 856, stockStatus: 'normal', safetyStock: 300, status: 'on_sale',
    updatedAt: '2024-06-11 16:42',
    params: [{ name: '光泽', value: '哑光' }, { name: '适用', value: '内墙' }, { name: '涂布率', value: '12-14㎡/L' }],
  },
  {
    key: '4', skuCode: 'SKU-BATH-00188', name: 'TOTO 节水型连体坐便器 CW986',
    image: 'https://picsum.photos/seed/bath1/120/120', category: '卫浴 / 坐便器', categoryKey: 'bath-toilet',
    brand: 'TOTO', spec: '坑距305/400mm', unit: '套',
    costPrice: 1850.0, salePrice: 3680.0, priceChange: 8.5,
    stock: 58, stockStatus: 'warning', safetyStock: 80, status: 'on_sale',
    updatedAt: '2024-06-12 09:08',
    params: [{ name: '冲水方式', value: '超漩式' }, { name: '用水量', value: '3.8L' }, { name: '水效等级', value: '1级' }],
  },
  {
    key: '5', skuCode: 'SKU-TILE-00356', name: '马可波罗 仿古砖 600×600mm',
    image: 'https://picsum.photos/seed/tile2/120/120', category: '瓷砖 / 仿古砖', categoryKey: 'tile-antiqu',
    brand: '马可波罗', spec: '600×600×9mm', unit: '片',
    costPrice: 52.0, salePrice: 98.0, priceChange: -3.8,
    stock: 4520, stockStatus: 'abundant', safetyStock: 1000, status: 'on_sale',
    updatedAt: '2024-06-10 15:30',
  },
  {
    key: '6', skuCode: 'SKU-FLOOR-00142', name: '大自然 纯实木地板 番龙眼 18mm',
    image: 'https://picsum.photos/seed/floor2/120/120', category: '地板 / 实木地板', categoryKey: 'floor-solid',
    brand: '大自然', spec: '910×122×18mm', unit: '㎡',
    costPrice: 268.0, salePrice: 458.0, priceChange: 3.2,
    stock: 0, stockStatus: 'out_of_stock', safetyStock: 200, status: 'off_shelf',
    updatedAt: '2024-06-08 11:20',
  },
  {
    key: '7', skuCode: 'SKU-PAINT-00078', name: '多乐士 森呼吸净味竹炭全效 5L',
    image: 'https://picsum.photos/seed/paint2/120/120', category: '涂料 / 乳胶漆', categoryKey: 'paint-latex',
    brand: '多乐士', spec: '5L/桶', unit: '桶',
    costPrice: 358.0, salePrice: 688.0, priceChange: 0,
    stock: 186, stockStatus: 'warning', safetyStock: 250, status: 'on_sale',
    updatedAt: '2024-06-12 13:55',
  },
  {
    key: '8', skuCode: 'SKU-BATH-00523', name: '汉斯格雅 飞雨系列恒温花洒套装',
    image: 'https://picsum.photos/seed/bath2/120/120', category: '卫浴 / 花洒', categoryKey: 'bath-shower',
    brand: '汉斯格雅', spec: '240mm顶喷', unit: '套',
    costPrice: 3800.0, salePrice: 6880.0, priceChange: 12.5,
    stock: 23, stockStatus: 'warning', safetyStock: 30, status: 'on_sale',
    updatedAt: '2024-06-11 08:40',
  },
  {
    key: '9', skuCode: 'SKU-HARD-01256', name: '百隆 阻尼缓冲铰链 110°',
    image: 'https://picsum.photos/seed/hard1/120/120', category: '五金配件', categoryKey: 'hardware',
    brand: '百隆', spec: '110° 全盖', unit: '只',
    costPrice: 12.8, salePrice: 28.5, priceChange: 0,
    stock: 25680, stockStatus: 'abundant', safetyStock: 5000, status: 'on_sale',
    updatedAt: '2024-06-12 11:30',
  },
  {
    key: '10', skuCode: 'SKU-TILE-00789', name: '诺贝尔 瓷抛砖 900×1800mm 岩板',
    image: 'https://picsum.photos/seed/tile3/120/120', category: '瓷砖 / 瓷抛砖', categoryKey: 'tile-porcelain',
    brand: '诺贝尔', spec: '900×1800×11mm', unit: '片',
    costPrice: 358.0, salePrice: 688.0, priceChange: -1.5,
    stock: 856, stockStatus: 'normal', safetyStock: 300, status: 'off_shelf',
    updatedAt: '2024-06-09 14:25',
  },
];

const stockBadge = (status: StockStatus, stock: number, safety: number) => {
  const map = {
    abundant: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: '充足', bar: 'bg-emerald-500' },
    normal: { color: 'bg-haze-50 text-haze-700 border-haze-200', label: '正常', bar: 'bg-haze-500' },
    warning: { color: 'bg-amber-50 text-amber-700 border-amber-200', label: '告警', bar: 'bg-amber-500' },
    out_of_stock: { color: 'bg-rose-50 text-rose-700 border-rose-200', label: '缺货', bar: 'bg-rose-500' },
  };
  const cfg = map[status];
  const pct = Math.min(100, safety > 0 ? (stock / safety) * 50 : 0);
  return (
    <div className="mt-1">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg.color}`}>
          {cfg.label}
        </span>
        <span className={`text-[10px] font-mono ${status === 'out_of_stock' ? 'text-rose-600' : status === 'warning' ? 'text-amber-600' : 'text-ivory-500'}`}>
          安全线 {safety.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-ivory-200 overflow-hidden relative">
        <div
          className={`h-full rounded-full transition-all ${cfg.bar} ${status === 'out_of_stock' || status === 'warning' ? 'animate-pulse' : ''}`}
          style={{ width: `${Math.max(pct, status === 'out_of_stock' ? 4 : pct)}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-px bg-carbon-900/40"
          style={{ left: '50%' }}
          title={`安全线: ${safety} 件`}
        />
      </div>
    </div>
  );
};

const CategoryTreeItem: React.FC<{ node: CategoryNode; level: number; activeKey: string; onSelect: (k: string) => void }> = ({ node, level, activeKey, onSelect }) => {
  const [expanded, setExpanded] = useState(level === 0);
  const hasChildren = !!node.children?.length;
  const Icon = node.icon;
  const isActive = activeKey === node.key;

  return (
    <div>
      <div
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          onSelect(node.key);
        }}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-2 rounded-btn text-sm cursor-pointer transition-all mb-0.5',
          isActive
            ? 'bg-gradient-to-r from-terracotta-50 to-wood-50 text-terracotta-700 border border-terracotta-200/60 font-medium'
            : 'hover:bg-ivory-100 text-carbon-600 hover:text-carbon-800'
        )}
        style={{ paddingLeft: 12 + level * 16 }}
      >
        {hasChildren ? (
          expanded ? <ChevronDown className="w-3.5 h-3.5 text-ivory-500 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-ivory-500 shrink-0" />
        ) : <span className="w-3.5 shrink-0" />}
        {Icon && <Icon className="w-4 h-4 shrink-0" />}
        <span className="flex-1 truncate">{node.name}</span>
        {node.count !== undefined && (
          <span className="text-[11px] font-mono text-ivory-500 bg-ivory-100 px-1.5 py-0.5 rounded">{node.count}</span>
        )}
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children!.map(c => (
            <CategoryTreeItem key={c.key} node={c} level={level + 1} activeKey={activeKey} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

const MaterialSKUAdmin: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchValue, setSearchValue] = useState('');
  const [brandFilter, setBrandFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<SKUStatus | 'all'>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSKU, setEditingSKU] = useState<SKUItem | null>(null);
  const [drawerTab, setDrawerTab] = useState('basic');
  const [editingCell, setEditingCell] = useState<{ key: string; field: 'costPrice' | 'salePrice' | 'stock' } | null>(null);
  const [editingValue, setEditingValue] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [restockTarget, setRestockTarget] = useState<SKUItem[]>([]);
  const [restockForm, setRestockForm] = useState({
    supplier: '东方建材集团',
    qty: 0,
    eta: dayjs().add(7, 'day').format('YYYY-MM-DD'),
    remark: '',
  });

  const openRestock = (sku?: SKUItem) => {
    const targets = sku
      ? [sku]
      : mockSKUs.filter(s => selectedRowKeys.includes(s.key));
    if (!targets.length) {
      message.warning('请先选择需要补货的 SKU');
      return;
    }
    setRestockTarget(targets);
    setRestockForm(f => ({
      ...f,
      qty: Math.max(100, targets.reduce((a, b) => a + Math.max(0, b.safetyStock - b.stock) + 50, 0)),
    }));
    setRestockModalOpen(true);
  };

  const submitRestock = () => {
    if (restockForm.qty <= 0) {
      message.warning('补货数量必须大于 0');
      return;
    }
    message.loading({ content: `正在创建补货单（${restockTarget.length} 个 SKU）...`, key: 'restock-sub', duration: 0 });
    setTimeout(() => {
      message.success({
        content: `✅ 补货单已提交，供应商：${restockForm.supplier} · 合计 ${restockForm.qty.toLocaleString()} 件 · 预计 ${restockForm.eta} 入库`,
        key: 'restock-sub',
        duration: 4,
      });
      setRestockModalOpen(false);
      setSelectedRowKeys([]);
    }, 1400);
  };

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const filteredSKUs = mockSKUs.filter(sku => {
    if (activeCategory !== 'all' && !sku.categoryKey.startsWith(activeCategory)) return false;
    if (searchValue && !sku.name.includes(searchValue) && !sku.skuCode.includes(searchValue) && !sku.brand.includes(searchValue)) return false;
    if (brandFilter && sku.brand !== brandFilter) return false;
    if (statusFilter !== 'all' && sku.status !== statusFilter) return false;
    if (sku.salePrice < priceRange[0] || sku.salePrice > priceRange[1]) return false;
    return true;
  });

  const openDrawer = (sku?: SKUItem) => {
    setEditingSKU(sku ?? null);
    setDrawerOpen(true);
  };

  const startInlineEdit = (key: string, field: 'costPrice' | 'salePrice' | 'stock', currentValue: number) => {
    setEditingCell({ key, field });
    setEditingValue(currentValue);
  };

  const finishInlineEdit = () => {
    if (editingCell) {
      message.success(`已更新: ${editingCell.field} = ${editingValue}`);
      setEditingCell(null);
    }
  };

  const columns: ColumnsType<SKUItem> = [
    {
      title: 'SKU信息',
      dataIndex: 'name',
      width: 320,
      fixed: 'left',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl border border-ivory-200 overflow-hidden shrink-0 bg-ivory-50">
            <img src={record.image} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-carbon-800 truncate max-w-[200px]">{record.name}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-[11px] text-terracotta-600 bg-terracotta-50 px-1.5 py-0.5 rounded">{record.skuCode}</span>
              <span className="text-[11px] text-ivory-500">{record.brand}</span>
            </div>
          </div>
        </div>
      ),
    },
    { title: '分类', dataIndex: 'category', width: 150, render: v => <span className="text-xs text-haze-700 bg-haze-50 px-2 py-1 rounded">{v}</span> },
    { title: '规格', dataIndex: 'spec', width: 130, render: v => <span className="text-xs font-mono text-carbon-700">{v}</span> },
    { title: '单位', dataIndex: 'unit', width: 60, render: v => <span className="text-xs text-carbon-600">{v}</span> },
    {
      title: '成本价',
      dataIndex: 'costPrice',
      width: 110,
      render: (v: number, record) => (
        editingCell?.key === record.key && editingCell?.field === 'costPrice' ? (
          <Input
            ref={inputRef as any}
            size="small"
            type="number"
            value={editingValue}
            onChange={e => setEditingValue(Number(e.target.value))}
            onBlur={finishInlineEdit}
            onPressEnter={finishInlineEdit}
            prefix="¥"
            style={{ borderRadius: 6 }}
          />
        ) : (
          <span
            onClick={() => startInlineEdit(record.key, 'costPrice', v)}
            className="font-mono text-sm text-carbon-700 cursor-pointer hover:text-terracotta-600 hover:underline decoration-dotted underline-offset-2"
          >
            ¥{v.toFixed(2)}
          </span>
        )
      ),
    },
    {
      title: '销售价',
      dataIndex: 'salePrice',
      width: 140,
      render: (v: number, record) => (
        <div>
          {editingCell?.key === record.key && editingCell?.field === 'salePrice' ? (
            <Input
              ref={inputRef as any}
              size="small"
              type="number"
              value={editingValue}
              onChange={e => setEditingValue(Number(e.target.value))}
              onBlur={finishInlineEdit}
              onPressEnter={finishInlineEdit}
              prefix="¥"
              style={{ borderRadius: 6 }}
            />
          ) : (
            <span
              onClick={() => startInlineEdit(record.key, 'salePrice', v)}
              className="font-mono text-base font-bold text-carbon-800 cursor-pointer hover:text-terracotta-600 hover:underline decoration-dotted underline-offset-2"
            >
              ¥{v.toFixed(2)}
            </span>
          )}
          {record.priceChange !== 0 && (
            <span className={`ml-1 text-[10px] font-mono font-semibold ${record.priceChange > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {record.priceChange > 0 ? '↑' : '↓'}{Math.abs(record.priceChange)}%
            </span>
          )}
        </div>
      ),
    },
    {
      title: '库存',
      dataIndex: 'stock',
      width: 210,
      render: (v: number, record) => (
        <div>
          <div className="flex items-center gap-2">
            {editingCell?.key === record.key && editingCell?.field === 'stock' ? (
              <Input
                ref={inputRef as any}
                size="small"
                type="number"
                value={editingValue}
                onChange={e => setEditingValue(Number(e.target.value))}
                onBlur={finishInlineEdit}
                onPressEnter={finishInlineEdit}
                style={{ borderRadius: 6 }}
              />
            ) : (
              <div
                onClick={() => startInlineEdit(record.key, 'stock', v)}
                className="cursor-pointer flex items-center gap-2 min-w-0"
              >
                <span className={`font-mono text-sm font-semibold hover:text-terracotta-600 ${
                  record.stockStatus === 'out_of_stock' ? 'text-rose-600' :
                  record.stockStatus === 'warning' ? 'text-amber-600' : ''
                }`}>
                  {v.toLocaleString()}
                </span>
                <span className="text-[10px] text-ivory-400">{record.unit}</span>
                {(record.stockStatus === 'warning' || record.stockStatus === 'out_of_stock') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openRestock(record);
                    }}
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1 border transition-all ${
                      record.stockStatus === 'out_of_stock'
                        ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700 animate-pulse shadow-sm shadow-rose-200'
                        : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                    }`}
                  >
                    <Truck className="w-3 h-3" />
                    {record.stockStatus === 'out_of_stock' ? '紧急补货' : '补货'}
                  </button>
                )}
              </div>
            )}
          </div>
          {stockBadge(record.stockStatus, v, record.safetyStock)}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: SKUStatus) => (
        v === 'on_sale' ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Eye className="w-3 h-3" />已上架
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-ivory-100 text-ivory-600 border border-ivory-200">
            <EyeOff className="w-3 h-3" />已下架
          </span>
        )
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 130,
      render: v => <span className="text-xs font-mono text-ivory-500">{v}</span>,
    },
    {
      title: '操作',
      width: 260,
      fixed: 'right',
      render: (_, record) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openDrawer(record)} className="px-2.5 py-1.5 rounded-md text-xs bg-haze-50 hover:bg-haze-100 text-haze-700 transition-colors inline-flex items-center gap-1">
            <Edit className="w-3.5 h-3.5" />编辑
          </button>
          <button
            onClick={() => {
              if (record.status === 'on_sale') {
                Modal.confirm({
                  title: `下架「${record.name}」？`,
                  content: '下架后所有关联项目将无法添加此SKU，已创建订单不受影响',
                  okText: '确认下架',
                  cancelText: '取消',
                  onOk: () => message.warning(`SKU「${record.skuCode}」已下架`),
                });
              } else {
                message.success(`SKU「${record.skuCode}」已重新上架`);
              }
            }}
            className={`px-2.5 py-1.5 rounded-md text-xs transition-colors inline-flex items-center gap-1 ${
              record.status === 'on_sale'
                ? 'bg-ivory-100 hover:bg-ivory-200 text-ivory-700'
                : 'bg-terracotta-50 hover:bg-terracotta-100 text-terracotta-700'
            }`}
          >
            {record.status === 'on_sale' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {record.status === 'on_sale' ? '下架' : '上架'}
          </button>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(record.skuCode);
              message.success(`已复制SKU编码：${record.skuCode}`);
            }}
            className="px-2 py-1.5 rounded-md text-xs text-wood-600 hover:bg-wood-50 transition-colors"
            title="复制SKU"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          {(record.stockStatus === 'warning' || record.stockStatus === 'out_of_stock') && (
            <button
              onClick={() => openRestock(record)}
              className={`px-2 py-1.5 rounded-md text-xs transition-colors inline-flex items-center gap-1 ${
                record.stockStatus === 'out_of_stock'
                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              }`}
              title="补货"
            >
              <Truck className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => Modal.confirm({
              title: `删除 SKU「${record.skuCode}」？`,
              content: '删除后数据将无法恢复，建议使用"下架"替代',
              okText: '确认删除',
              okButtonProps: { danger: true },
              cancelText: '取消',
              onOk: () => message.error(`已删除 SKU：${record.skuCode}`),
            })}
            className="px-2 py-1.5 rounded-md text-xs text-rose-600 hover:bg-rose-50 transition-colors"
            title="删除"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const rowSelection: TableRowSelection<SKUItem> = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  const drawerTabs: TabsProps['items'] = [
    { key: 'basic', label: <span className="flex items-center gap-1.5 text-sm"><Tag className="w-4 h-4" />基础信息</span> },
    { key: 'spec', label: <span className="flex items-center gap-1.5 text-sm"><Settings className="w-4 h-4" />规格参数</span> },
    { key: 'price', label: <span className="flex items-center gap-1.5 text-sm"><DollarSign className="w-4 h-4" />价格库存</span> },
    { key: 'images', label: <span className="flex items-center gap-1.5 text-sm"><ImageIcon className="w-4 h-4" />图片管理</span> },
    { key: 'relation', label: <span className="flex items-center gap-1.5 text-sm"><Layers className="w-4 h-4" />关联配置</span> },
  ];

  const [skuParams, setSkuParams] = useState(editingSKU?.params ?? [
    { name: '', value: '' },
    { name: '', value: '' },
  ]);

  const [stepPrices, setStepPrices] = useState([
    { min: 1, max: 99, price: editingSKU?.salePrice ?? 0 },
    { min: 100, max: 499, price: (editingSKU?.salePrice ?? 0) * 0.95 },
    { min: 500, max: null, price: (editingSKU?.salePrice ?? 0) * 0.88 },
  ]);

  const [fileList, setFileList] = useState<UploadFile[]>(editingSKU ? [
    { uid: '1', name: '主图.jpg', status: 'done', url: editingSKU.image },
    { uid: '2', name: '细节图1.jpg', status: 'done', url: `https://picsum.photos/seed/${editingSKU.skuCode}2/400/400` },
    { uid: '3', name: '场景图.jpg', status: 'done', url: `https://picsum.photos/seed/${editingSKU.skuCode}3/400/400` },
  ] : []);

  const uploadProps: UploadProps = {
    fileList,
    onChange: ({ fileList: fl }) => setFileList(fl),
    multiple: true,
    listType: 'picture-card',
  };

  return (
    <div className="space-y-5 h-[calc(100vh-10rem)] flex flex-col">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-carbon-800">建材SKU管理</h1>
          <p className="text-sm text-ivory-600 mt-1">统一管理平台建材商品库 · 共 <span className="font-mono font-semibold text-terracotta-600">{mockSKUs.length}</span> 个SKU</p>
        </div>
      </div>

      <div className="flex flex-1 gap-5 min-h-0">
        <div className="w-60 shrink-0 card-base p-3 overflow-y-auto scrollbar-thin">
          <div
            onClick={() => setActiveCategory('all')}
            className={clsx(
              'flex items-center gap-2 px-3 py-2.5 rounded-btn text-sm cursor-pointer transition-all mb-2 border',
              activeCategory === 'all'
                ? 'bg-gradient-to-r from-terracotta-50 to-wood-50 text-terracotta-700 border-terracotta-200/60 font-medium'
                : 'hover:bg-ivory-100 text-carbon-600 border-transparent'
            )}
          >
            <Layers className="w-4 h-4" />
            <span className="flex-1">全部商品</span>
            <span className="text-[11px] font-mono text-ivory-500 bg-ivory-100 px-1.5 py-0.5 rounded">{mockSKUs.length}</span>
          </div>
          <div className="h-px bg-ivory-200 my-2" />
          {categories.map(c => (
            <CategoryTreeItem key={c.key} node={c} level={0} activeKey={activeCategory} onSelect={setActiveCategory} />
          ))}
        </div>

        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="card-base p-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center bg-white border border-ivory-300 rounded-btn px-3 py-2 gap-2 w-72">
              <Search className="w-4 h-4 text-ivory-500 shrink-0" />
              <input type="text" value={searchValue} onChange={e => setSearchValue(e.target.value)} placeholder="搜索SKU名称/编码/品牌..." className="bg-transparent outline-none flex-1 text-sm" />
            </div>
            <Select placeholder="品牌筛选" className="w-36" allowClear value={brandFilter} onChange={setBrandFilter} style={{ borderRadius: 8 }}>
              {['东鹏', '圣象', '立邦', 'TOTO', '马可波罗', '大自然', '多乐士', '汉斯格雅', '百隆', '诺贝尔'].map(b => <Option key={b} value={b}>{b}</Option>)}
            </Select>
            <div className="flex items-center gap-3 p-2 bg-ivory-50 rounded-btn w-80">
              <span className="text-xs text-ivory-600 shrink-0">价格区间</span>
              <Slider range min={0} max={10000} step={50} value={priceRange} onChange={v => setPriceRange(v as [number, number])} tooltip={{ formatter: v => `¥${v?.toLocaleString()}` }} styles={{ track: { background: 'linear-gradient(to right, #CBA356, #C4623A)' } }} className="flex-1" />
              <span className="text-xs font-mono text-ivory-600 shrink-0 w-20 text-right">¥{priceRange[0].toLocaleString()}-{priceRange[1].toLocaleString()}</span>
            </div>
            <Select placeholder="状态筛选" className="w-32" value={statusFilter === 'all' ? undefined : statusFilter} onChange={v => setStatusFilter(v ?? 'all')} allowClear style={{ borderRadius: 8 }}>
              <Option value="on_sale">已上架</Option>
              <Option value="off_shelf">已下架</Option>
            </Select>
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              <button
                onClick={() => Modal.info({
                  title: '批量导入 SKU',
                  content: (
                    <div className="space-y-4 pt-2">
                      <div className="rounded-xl border-2 border-dashed border-haze-200 bg-haze-50/40 p-6 text-center">
                        <UploadIcon className="w-10 h-10 mx-auto text-haze-400 mb-2" />
                        <p className="text-sm text-carbon-700">拖拽 Excel/CSV 文件到此处</p>
                        <p className="text-xs text-ivory-500 mt-1">支持 .xlsx / .csv 格式，最大 5MB</p>
                      </div>
                      <div className="text-xs text-ivory-600 space-y-1">
                        <p>📌 导入模板说明：</p>
                        <ul className="list-disc pl-5 space-y-0.5">
                          <li>必填列：SKU编码、品名、品牌、分类、单位、销售价</li>
                          <li>可选列：成本价、初始库存、安全库存、规格参数</li>
                        </ul>
                      </div>
                    </div>
                  ),
                  okText: '确认导入',
                  onOk: () => {
                    message.loading({ content: '正在解析导入文件...', key: 'import-sku', duration: 0 });
                    setTimeout(() => {
                      message.success({ content: '✅ 导入成功！新增 86 个SKU，更新 23 个SKU，3 条格式错误', key: 'import-sku', duration: 4 });
                    }, 1600);
                  },
                })}
                className="btn-secondary text-sm !py-2 inline-flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />批量导入
              </button>
              <button
                onClick={() => {
                  message.loading({ content: `正在导出 ${filteredSKUs.length} 个 SKU 数据...`, key: 'export-sku', duration: 0 });
                  setTimeout(() => {
                    message.success({ content: `✅ 导出完成！已下载 SKU_Data_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`, key: 'export-sku' });
                  }, 1400);
                }}
                className="btn-secondary text-sm !py-2 inline-flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />批量导出
              </button>
              <div className="w-px h-6 bg-ivory-300 mx-1" />
              <button
                onClick={() => {
                  Modal.confirm({
                    title: '批量上架所有筛选结果？',
                    content: `当前筛选条件下共有 ${filteredSKUs.filter(s => s.status === 'off_shelf').length} 个未上架 SKU`,
                    onOk: () => message.success('已提交批量上架任务'),
                  });
                }}
                className="btn-secondary text-sm !py-2 inline-flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4" />批量上架
              </button>
              <button
                onClick={() => {
                  Modal.confirm({
                    title: '批量下架所有筛选结果？',
                    content: `当前筛选条件下共有 ${filteredSKUs.filter(s => s.status === 'on_sale').length} 个已上架 SKU`,
                    okText: '确认下架',
                    onOk: () => message.warning('已提交批量下架任务'),
                  });
                }}
                className="btn-secondary text-sm !py-2 inline-flex items-center gap-1.5"
              >
                <EyeOff className="w-4 h-4" />批量下架
              </button>
              <button onClick={() => openDrawer()} className="btn-primary text-sm !py-2 inline-flex items-center gap-1.5">
                <Plus className="w-4 h-4" />新增SKU
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {selectedRowKeys.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="sticky top-0 z-20 rounded-card p-3 px-5 bg-gradient-to-r from-terracotta-50 to-wood-50 border border-terracotta-200/60 shadow-card flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-terracotta-500 text-white flex items-center justify-center">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-carbon-800">批量操作模式</p>
                    <p className="text-xs text-ivory-600">已选中 <span className="font-mono font-semibold text-terracotta-600">{selectedRowKeys.length}</span> 个SKU</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => openRestock()}
                    className="px-4 py-1.5 rounded-btn text-xs bg-white text-amber-700 border border-amber-300 hover:bg-amber-50 transition-colors inline-flex items-center gap-1"
                  >
                    <Truck className="w-3.5 h-3.5" />批量补货
                  </button>
                  <button
                    onClick={() => {
                      Modal.confirm({
                        title: `批量调整 ${selectedRowKeys.length} 个 SKU 价格？`,
                        content: '可统一设置折扣比例或固定金额',
                        okText: '继续',
                        onOk: () => message.success(`已为 ${selectedRowKeys.length} 个SKU提交批量调价任务`),
                      });
                    }}
                    className="px-4 py-1.5 rounded-btn text-xs bg-white text-terracotta-700 border border-terracotta-200 hover:bg-terracotta-50 transition-colors inline-flex items-center gap-1"
                  >
                    <DollarSign className="w-3.5 h-3.5" />批量调价
                  </button>
                  <button
                    onClick={() => message.success(`已为 ${selectedRowKeys.length} 个SKU更新库存记录`)}
                    className="px-4 py-1.5 rounded-btn text-xs bg-white text-wood-700 border border-wood-200 hover:bg-wood-50 transition-colors inline-flex items-center gap-1"
                  >
                    <Package className="w-3.5 h-3.5" />批量改库存
                  </button>
                  <button
                    onClick={() => message.success(`已批量上架 ${selectedRowKeys.length} 个SKU`)}
                    className="px-4 py-1.5 rounded-btn text-xs bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 transition-colors inline-flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />上架
                  </button>
                  <button
                    onClick={() => Modal.confirm({
                      title: `批量下架 ${selectedRowKeys.length} 个 SKU？`,
                      content: '批量下架后所有关联项目将无法添加这些SKU',
                      okText: '确认下架',
                      onOk: () => message.warning(`已批量下架 ${selectedRowKeys.length} 个SKU`),
                    })}
                    className="px-4 py-1.5 rounded-btn text-xs bg-white text-ivory-700 border border-ivory-300 hover:bg-ivory-100 transition-colors inline-flex items-center gap-1"
                  >
                    <EyeOff className="w-3.5 h-3.5" />下架
                  </button>
                  <button
                    onClick={() => Modal.confirm({
                      title: `批量删除 ${selectedRowKeys.length} 个 SKU？`,
                      content: '删除后数据将无法恢复，请谨慎操作',
                      okText: '确认删除',
                      okButtonProps: { danger: true },
                      onOk: () => message.error(`已删除 ${selectedRowKeys.length} 个SKU`),
                    })}
                    className="px-4 py-1.5 rounded-btn text-xs bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />删除
                  </button>
                  <button onClick={() => setSelectedRowKeys([])} className="text-xs text-ivory-600 hover:text-carbon-800 ml-2">取消</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Card className="!rounded-card !shadow-card !border-ivory-200 !p-0 flex-1 overflow-hidden flex flex-col">
            <Table<SKUItem>
              columns={columns}
              dataSource={filteredSKUs}
              rowSelection={rowSelection}
              scroll={{ x: 1600, y: '100%' }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: t => `共 ${t} 个SKU`,
              }}
              className="sku-admin-table flex-1 [&_.ant-table-body]:!overflow-x-auto"
              size="middle"
              rowClassName={(r) =>
                r.stockStatus === 'out_of_stock'
                  ? '!bg-rose-50/60 hover:!bg-rose-50 !border-l-4 !border-l-rose-500'
                  : r.stockStatus === 'warning'
                  ? '!bg-amber-50/50 hover:!bg-amber-50 !border-l-4 !border-l-amber-500'
                  : ''
              }
            />
          </Card>
        </div>
      </div>

      <Drawer
        title={
          <div className="flex items-center gap-3 pr-8">
            {editingSKU && <img src={editingSKU.image} alt="" className="w-10 h-10 rounded-xl border border-ivory-200 bg-white p-1" />}
            <div>
              <h3 className="font-serif font-semibold text-carbon-800">
                {editingSKU ? `编辑SKU · ${editingSKU.skuCode}` : '新增建材SKU'}
              </h3>
              {editingSKU && <span className="text-xs text-ivory-500">更新于 {editingSKU.updatedAt}</span>}
            </div>
          </div>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={720}
        destroyOnClose
        bodyStyle={{ padding: 0 }}
        extra={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setDrawerOpen(false);
                message.info('已取消编辑，未保存改动');
              }}
              className="px-4 py-2 rounded-btn text-sm text-carbon-600 hover:bg-ivory-100 transition-colors"
            >取消</button>
            <button
              onClick={() => {
                message.loading({ content: '正在保存 SKU 信息...', key: 'save-sku', duration: 0 });
                setTimeout(() => {
                  message.success({ content: `✅ SKU「${editingSKU?.skuCode ?? 'NEW'}」已保存，已同步至 4 个供应商`, key: 'save-sku' });
                  setDrawerOpen(false);
                }, 900);
              }}
              className="btn-primary text-sm !py-2"
            >
              <CheckCircle2 className="w-4 h-4" />保存
            </button>
          </div>
        }
      >
        <Tabs
          activeKey={drawerTab}
          onChange={setDrawerTab}
          items={drawerTabs}
          size="large"
          className="px-6 border-b border-ivory-200"
        />
        <div className="p-6 space-y-5 max-h-[calc(100vh-16rem)] overflow-y-auto scrollbar-thin">
          {drawerTab === 'basic' && (
            <div className="grid grid-cols-2 gap-5">
              <div><label className="block text-xs text-ivory-600 mb-1.5">商品分类 *</label>
                <Select defaultValue={editingSKU?.categoryKey} placeholder="请选择分类" style={{ borderRadius: 8, width: '100%' }} size="middle">
                  {categories.map(c => <Option key={c.key} value={c.key}>{c.name}</Option>)}
                </Select>
              </div>
              <div><label className="block text-xs text-ivory-600 mb-1.5">品牌 *</label><Input size="middle" defaultValue={editingSKU?.brand} placeholder="请输入品牌" style={{ borderRadius: 8 }} /></div>
              <div className="col-span-2"><label className="block text-xs text-ivory-600 mb-1.5">商品名称 *</label><Input size="middle" defaultValue={editingSKU?.name} placeholder="请输入完整商品名称" style={{ borderRadius: 8 }} /></div>
              <div><label className="block text-xs text-ivory-600 mb-1.5">SKU编码</label><Input size="middle" defaultValue={editingSKU?.skuCode} prefix={<Tag className="w-3.5 h-3.5 text-ivory-400" />} style={{ borderRadius: 8 }} /></div>
              <div><label className="block text-xs text-ivory-600 mb-1.5">商品状态</label>
                <Select defaultValue={editingSKU?.status ?? 'off_shelf'} style={{ borderRadius: 8, width: '100%' }} size="middle">
                  <Option value="on_sale">立即上架</Option>
                  <Option value="off_shelf">暂不上架</Option>
                </Select>
              </div>
            </div>
          )}

          {drawerTab === 'spec' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-5">
                <div><label className="block text-xs text-ivory-600 mb-1.5">规格描述</label><Input size="middle" defaultValue={editingSKU?.spec} placeholder="如 800×800×10mm" style={{ borderRadius: 8 }} /></div>
                <div><label className="block text-xs text-ivory-600 mb-1.5">计量单位</label><Input size="middle" defaultValue={editingSKU?.unit} placeholder="片/㎡/桶/套" style={{ borderRadius: 8 }} /></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-carbon-800">规格参数表</label>
                  <button onClick={() => setSkuParams([...skuParams, { name: '', value: '' }])} className="text-xs text-terracotta-600 font-medium hover:underline inline-flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />新增参数
                  </button>
                </div>
                <div className="rounded-xl border border-ivory-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-ivory-50">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-ivory-600 w-12">#</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-ivory-600 w-2/5">参数名</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-ivory-600">参数值</th>
                        <th className="text-center px-4 py-2.5 text-xs font-medium text-ivory-600 w-16">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skuParams.map((p, i) => (
                        <tr key={i} className="border-t border-ivory-100">
                          <td className="px-4 py-2 font-mono text-xs text-ivory-500">{i + 1}</td>
                          <td className="px-3 py-2"><Input size="small" value={p.name} onChange={e => { const next = [...skuParams]; next[i].name = e.target.value; setSkuParams(next); }} placeholder="如 材质" style={{ borderRadius: 6 }} /></td>
                          <td className="px-3 py-2"><Input size="small" value={p.value} onChange={e => { const next = [...skuParams]; next[i].value = e.target.value; setSkuParams(next); }} placeholder="如 全瓷通体" style={{ borderRadius: 6 }} /></td>
                          <td className="px-4 py-2 text-center"><button onClick={() => setSkuParams(skuParams.filter((_, j) => j !== i))} className="text-rose-500 hover:text-rose-600"><Minus className="w-4 h-4" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {drawerTab === 'price' && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-5">
                <div><label className="block text-xs text-ivory-600 mb-1.5">成本价 (¥)</label><InputNumber size="middle" defaultValue={editingSKU?.costPrice} style={{ borderRadius: 8, width: '100%' }} prefix="¥" min={0} step={0.5} /></div>
                <div><label className="block text-xs text-ivory-600 mb-1.5">销售价 (¥)</label><InputNumber size="middle" defaultValue={editingSKU?.salePrice} style={{ borderRadius: 8, width: '100%' }} prefix="¥" min={0} step={0.5} /></div>
                <div>
                  <label className="block text-xs text-ivory-600 mb-1.5">毛利率</label>
                  <div className="h-10 px-4 flex items-center text-lg font-mono font-bold text-emerald-600 bg-emerald-50 rounded-btn border border-emerald-200">
                    {editingSKU ? `${(((editingSKU.salePrice - editingSKU.costPrice) / editingSKU.salePrice) * 100).toFixed(1)}%` : '—'}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-carbon-800">阶梯价（批量采购）</label>
                  <button onClick={() => setStepPrices([...stepPrices, { min: 0, max: null, price: 0 }])} className="text-xs text-terracotta-600 font-medium hover:underline inline-flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />新增阶梯
                  </button>
                </div>
                <div className="space-y-2">
                  {stepPrices.map((s, i) => (
                    <div key={i} className="grid grid-cols-12 gap-3 items-center p-3 bg-ivory-50 rounded-xl">
                      <span className="col-span-1 text-center text-xs font-semibold text-ivory-600">{i + 1}</span>
                      <div className="col-span-3 flex items-center gap-2"><InputNumber size="small" value={s.min} onChange={v => { const n = [...stepPrices]; n[i].min = v ?? 0; setStepPrices(n); }} style={{ borderRadius: 6, width: '100%' }} min={0} /></div>
                      <span className="col-span-1 text-center text-ivory-400">~</span>
                      <div className="col-span-3 flex items-center gap-2"><InputNumber size="small" value={s.max ?? undefined} onChange={v => { const n = [...stepPrices]; n[i].max = v as any; setStepPrices(n); }} placeholder="不限" style={{ borderRadius: 6, width: '100%' }} min={0} /></div>
                      <span className="col-span-1 text-center text-ivory-400">@</span>
                      <div className="col-span-3"><InputNumber size="small" value={s.price} onChange={v => { const n = [...stepPrices]; n[i].price = v ?? 0; setStepPrices(n); }} prefix="¥" style={{ borderRadius: 6, width: '100%' }} min={0} /></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 pt-2">
                <div><label className="block text-xs text-ivory-600 mb-1.5">当前库存</label><InputNumber size="middle" defaultValue={editingSKU?.stock} style={{ borderRadius: 8, width: '100%' }} min={0} /></div>
                <div><label className="block text-xs text-ivory-600 mb-1.5">安全库存阈值</label><InputNumber size="middle" defaultValue={editingSKU?.safetyStock} style={{ borderRadius: 8, width: '100%' }} min={0} /></div>
              </div>
            </div>
          )}

          {drawerTab === 'images' && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-carbon-800">主图</label>
                  <span className="text-xs text-ivory-500">仅1张 · 建议800×800px</span>
                </div>
                <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-ivory-300 bg-ivory-50 overflow-hidden">
                  {fileList[0]?.url ? (
                    <img src={fileList[0].url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-ivory-400">
                      <UploadIcon className="w-6 h-6 mb-1" />
                      <span className="text-xs">上传主图</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-carbon-800">详情图 / 场景图</label>
                  <span className="text-xs text-ivory-500">最多10张 · 建议1200×1200px</span>
                </div>
                <AntUpload.Dragger {...uploadProps} multiple accept="image/*" className="!bg-ivory-50/50">
                  <p className="ant-upload-drag-icon"><UploadIcon className="w-10 h-10 mx-auto text-ivory-400" /></p>
                  <p className="ant-upload-text text-sm font-medium text-carbon-700">点击或拖拽图片到此区域上传</p>
                  <p className="ant-upload-hint text-xs text-ivory-500 mt-1">支持 JPG / PNG / WEBP，单张不超过5MB</p>
                </AntUpload.Dragger>
              </div>
            </div>
          )}

          {drawerTab === 'relation' && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-carbon-800 mb-3 block">关联装修风格</label>
                <Checkbox.Group style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }} defaultValue={editingSKU?.styles ?? []}>
                  {['现代简约', '轻奢', '新中式', '北欧', '美式', '日式', '欧式古典', '工业风'].map(s => (
                    <Checkbox key={s} value={s}>{s}</Checkbox>
                  ))}
                </Checkbox.Group>
              </div>
              <div>
                <label className="text-sm font-semibold text-carbon-800 mb-3 block">关联施工工艺</label>
                <Checkbox.Group style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }} defaultValue={editingSKU?.processes ?? []}>
                  {['薄贴法', '干铺法', '湿铺法', '自流平', '龙骨铺设', '悬浮铺设', '胶粘法'].map(s => (
                    <Checkbox key={s} value={s}>{s}</Checkbox>
                  ))}
                </Checkbox.Group>
              </div>
              <div>
                <label className="text-sm font-semibold text-carbon-800 mb-3 block">关联装修方案（推荐搭配）</label>
                <div className="grid grid-cols-3 gap-3">
                  {['轻奢风三居室', '现代简约两居室', '新中式别墅'].map((s, i) => (
                    <div key={s} className="rounded-xl border border-ivory-200 overflow-hidden group cursor-pointer hover:border-terracotta-300 transition-colors">
                      <img src={`https://picsum.photos/seed/plan${i}/300/200`} alt="" className="w-full h-24 object-cover" />
                      <div className="p-2.5">
                        <p className="text-xs font-medium text-carbon-700 truncate">{s}</p>
                        <p className="text-[10px] text-ivory-500 mt-0.5">匹配度 {[98, 92, 87][i]}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Drawer>

      <Modal
        open={restockModalOpen}
        onCancel={() => setRestockModalOpen(false)}
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Truck className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-carbon-800 text-lg">
                创建补货单 · {restockTarget.length} 个 SKU
              </h3>
              <p className="text-xs text-ivory-500">
                {restockTarget.reduce((a, b) => a + Math.max(0, b.safetyStock - b.stock), 0) > 0
                  ? `安全缺口 ${restockTarget.reduce((a, b) => a + Math.max(0, b.safetyStock - b.stock), 0).toLocaleString()} 件，建议及时补货`
                  : '请输入补货数量'}
              </p>
            </div>
          </div>
        }
        width={760}
        footer={null}
        destroyOnClose
      >
        <div className="space-y-5 pt-2">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-ivory-600 mb-1.5">供应商 *</label>
              <Select
                value={restockForm.supplier}
                onChange={v => setRestockForm(f => ({ ...f, supplier: v }))}
                style={{ width: '100%', borderRadius: 8 }}
                size="middle"
              >
                <Option value="东方建材集团">东方建材集团（已连接）</Option>
                <Option value="精工陶瓷">精工陶瓷（已连接）</Option>
                <Option value="宜家木地板">宜家木地板（已连接）</Option>
                <Option value="海尔智能家居">海尔智能家居（已连接）</Option>
              </Select>
            </div>
            <div>
              <label className="block text-xs text-ivory-600 mb-1.5">补货数量（合计）*</label>
              <InputNumber
                value={restockForm.qty}
                onChange={v => setRestockForm(f => ({ ...f, qty: Number(v) || 0 }))}
                min={0}
                style={{ width: '100%', borderRadius: 8 }}
                size="middle"
              />
            </div>
            <div>
              <label className="block text-xs text-ivory-600 mb-1.5">预计到货日期 *</label>
              <DatePicker
                value={dayjs(restockForm.eta)}
                onChange={d => setRestockForm(f => ({ ...f, eta: d?.format('YYYY-MM-DD') ?? restockForm.eta }))}
                style={{ width: '100%', borderRadius: 8 }}
                size="middle"
                minDate={dayjs().add(1, 'day')}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-ivory-600 mb-2">
              补货 SKU 明细（合计缺口 {restockTarget.reduce((a, b) => a + Math.max(0, b.safetyStock - b.stock), 0).toLocaleString()} 件）
            </label>
            <div className="rounded-xl border border-ivory-200 overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-ivory-50 sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium text-ivory-600">SKU</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-ivory-600">品名</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-ivory-600">当前库存</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-ivory-600">安全线</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-ivory-600">缺口</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-ivory-600">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {restockTarget.map(s => {
                    const gap = Math.max(0, s.safetyStock - s.stock);
                    return (
                      <tr key={s.key} className="border-t border-ivory-100">
                        <td className="px-3 py-2 font-mono text-xs text-carbon-800">{s.skuCode}</td>
                        <td className="px-3 py-2 text-xs text-carbon-700 max-w-[180px] truncate">{s.name}</td>
                        <td className="px-3 py-2 text-right font-mono text-xs">{s.stock.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-mono text-xs text-ivory-500">{s.safetyStock.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right">
                          <span className={`font-mono text-xs font-bold ${gap > 0 ? (s.stock === 0 ? 'text-rose-600' : 'text-amber-600') : 'text-emerald-600'}`}>
                            {gap > 0 ? `-${gap.toLocaleString()}` : `+${(-gap).toLocaleString()}`}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {stockBadge(s.stockStatus, s.stock, s.safetyStock)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="block text-xs text-ivory-600 mb-1.5">到货进度模拟</label>
            <Progress
              percent={Math.floor(Math.random() * 30)}
              status="active"
              strokeColor={{ from: '#C4623A', to: '#8B6914' }}
              size="small"
            />
            <p className="text-[10px] text-ivory-500 mt-1 font-mono">
              预计流程：下单 → 供应商确认 → 发货 → 质检入库（{dayjs(restockForm.eta).diff(dayjs(), 'day')} 天）
            </p>
          </div>

          <div>
            <label className="block text-xs text-ivory-600 mb-1.5">备注</label>
            <TextArea
              rows={2}
              value={restockForm.remark}
              onChange={e => setRestockForm(f => ({ ...f, remark: e.target.value }))}
              placeholder="例如：优先配送市区仓库，随货附质检报告"
              style={{ borderRadius: 8 }}
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-ivory-200">
            <button
              onClick={() => setRestockModalOpen(false)}
              className="btn-secondary flex-1 !py-2.5 text-sm"
            >
              取消
            </button>
            <button
              onClick={() => message.success(`已保存为草稿，可在采购管理中继续编辑`)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-btn
                bg-haze-50 text-haze-700 text-sm font-medium border border-haze-200
                hover:bg-haze-100 transition-all"
            >
              <Package className="w-4 h-4" />
              保存为草稿
            </button>
            <button
              onClick={submitRestock}
              className="btn-primary flex-1 !py-2.5 text-sm"
            >
              <Truck className="w-4 h-4" />
              提交补货单
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MaterialSKUAdmin;
