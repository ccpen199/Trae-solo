import React, { useState, useMemo } from 'react';
import {
  Tabs,
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  Drawer,
  Modal,
  Form,
  InputNumber,
  Segmented,
  Card,
  Statistic,
  Row,
  Col,
  Avatar,
  Tooltip,
  Typography,
  Badge,
  Switch,
  List,
  Image,
  Divider,
  message,
} from 'antd';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { ColumnsType } from 'antd/es/table';
import {
  Fuel,
  Map,
  Table2,
  Search,
  Filter,
  Download,
  RefreshCw,
  Plus,
  Edit3,
  TrendingUp,
  BarChart3,
  Banknote,
  Receipt,
  Eye,
  Save,
  X,
  CheckCircle2,
  MapPin,
  Phone,
  Building2,
  Clock,
  ChevronRight,
} from 'lucide-react';

const { Option } = Select;
const { Text, Title } = Typography;

interface StationItem {
  key: string;
  id: string;
  name: string;
  brand: 'sinopec' | 'cnpc' | 'shell' | 'cnooc' | 'private';
  province: string;
  city: string;
  lng: number;
  lat: number;
  address: string;
  contact: string;
  phone: string;
  prices: {
    '0#': number;
    '-10#': number;
    '92#': number;
    '95#': number;
    '98#': number;
  };
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  verifyCount: number;
  verifyAmount: number;
  rating: number;
  cover?: string;
}

interface VerifyOrderItem {
  key: string;
  id: string;
  stationId: string;
  stationName: string;
  driverName: string;
  plate: string;
  fuelType: string;
  liters: number;
  amount: number;
  discount: number;
  actualPay: number;
  time: string;
  status: 'success' | 'refund' | 'pending';
}

const brandMap: Record<StationItem['brand'], { name: string; color: string; bg: string; border: string }> = {
  sinopec: { name: '中石化', color: '#E53935', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  cnpc: { name: '中石油', color: '#1E88E5', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  shell: { name: '壳牌', color: '#FDD835', bg: 'bg-yellow-400/20', border: 'border-yellow-400/30' },
  cnooc: { name: '中海油', color: '#00ACC1', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30' },
  private: { name: '民营站', color: '#8BC34A', bg: 'bg-lime-500/20', border: 'border-lime-500/30' },
};

const provinces = ['北京', '上海', '广东', '浙江', '江苏', '四川', '湖北', '山东', '河南', '河北'];
const cities: Record<string, string[]> = {
  北京: ['北京'], 上海: ['上海'], 广东: ['广州', '深圳', '东莞', '佛山'],
  浙江: ['杭州', '宁波', '温州', '嘉兴'], 江苏: ['南京', '苏州', '无锡', '常州'],
  四川: ['成都', '绵阳', '德阳'], 湖北: ['武汉', '宜昌', '襄阳'],
  山东: ['济南', '青岛', '烟台'], 河南: ['郑州', '洛阳', '开封'], 河北: ['石家庄', '唐山'],
};

const stationMock: StationItem[] = Array.from({ length: 18 }).map((_, i) => {
  const brands: StationItem['brand'][] = ['sinopec', 'cnpc', 'shell', 'cnooc', 'private'];
  const province = provinces[i % provinces.length];
  const cityList = cities[province];
  const city = cityList[i % cityList.length];
  return {
    key: String(i + 1),
    id: `ST${String(20240600 + i).padStart(8, '0')}`,
    name: `${brandMap[brands[i % 5]].name}${city}第${100 + i}加油站`,
    brand: brands[i % 5],
    province, city,
    lng: 100 + (i % 10) * 2.5 + (i % 3) * 0.3,
    lat: 25 + (i % 8) * 1.8 + (i % 4) * 0.2,
    address: `${city}XX区${['朝阳', '中山', '人民', '解放', '建设'][i % 5]}路${100 + i * 7}号`,
    contact: ['张经理', '李站长', '王主管', '赵主任', '陈经理'][i % 5],
    phone: `138${String(10000000 + i * 13579).slice(0, 8)}`,
    prices: {
      '0#': 6.95 + (i % 5) * 0.15 - 0.3,
      '-10#': 7.55 + (i % 5) * 0.15 - 0.3,
      '92#': 7.35 + (i % 5) * 0.12 - 0.25,
      '95#': 7.85 + (i % 5) * 0.12 - 0.25,
      '98#': 8.55 + (i % 5) * 0.15 - 0.3,
    },
    status: (['active', 'active', 'active', 'inactive', 'pending'] as StationItem['status'][])[i % 5],
    joinDate: `2024-${String(((i % 5) + 1)).padStart(2, '0')}-${String(((i * 3) % 27) + 1).padStart(2, '0')}`,
    verifyCount: 200 + i * 37,
    verifyAmount: (80 + i * 15) * 1000,
    rating: 4.2 + (i % 8) * 0.1,
  };
});

const verifyMock: VerifyOrderItem[] = Array.from({ length: 15 }).map((_, i) => ({
  key: String(i + 1),
  id: `HX${20240607000 + i}`,
  stationId: stationMock[i % stationMock.length].id,
  stationName: stationMock[i % stationMock.length].name,
  driverName: ['王志强', '李明辉', '张建军', '刘德胜', '赵磊'][i % 5],
  plate: `${['京', '沪', '粤', '浙', '苏', '川'][i % 6]}A·${String(88000 + i * 123).slice(0, 5)}`,
  fuelType: ['0#柴油', '-10#柴油', '92#汽油', '95#汽油', '98#汽油'][i % 5],
  liters: 100 + (i % 10) * 20 + Math.round(Math.random() * 50),
  amount: 800 + (i % 10) * 180 + Math.round(Math.random() * 400),
  discount: 30 + (i % 6) * 15,
  get actualPay() { return this.amount - this.discount; },
  time: `2024-06-07 ${String(8 + (i * 2) % 12).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`,
  status: (['success', 'success', 'success', 'refund', 'pending'] as VerifyOrderItem['status'][])[i % 5],
}));

interface AdminStationsProps { defaultTab?: string; defaultView?: 'table' | 'map'; }
const AdminStations: React.FC<AdminStationsProps> = ({ defaultTab = 'list', defaultView = 'table' }) => {
  const [viewMode, setViewMode] = useState<'table' | 'map'>(defaultView);
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [provinceFilter, setProvinceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [editModal, setEditModal] = useState<StationItem | null>(null);
  const [priceDrawer, setPriceDrawer] = useState<StationItem | null>(null);
  const [detailDrawer, setDetailDrawer] = useState<StationItem | null>(null);
  const [form] = Form.useForm();
  const [priceForm] = Form.useForm();

  const filteredStations = useMemo(() => stationMock.filter((s) => {
    if (brandFilter !== 'all' && s.brand !== brandFilter) return false;
    if (provinceFilter !== 'all' && s.province !== provinceFilter) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (searchText && !`${s.name}${s.id}${s.city}${s.address}`.includes(searchText)) return false;
    return true;
  }), [brandFilter, provinceFilter, statusFilter, searchText]);

  const provinceBarOption: EChartsOption = useMemo(() => {
    const provinceStats = provinces.map((p) => ({
      name: p,
      value: filteredStations.filter((s) => s.province === p).length,
      volume: filteredStations.filter((s) => s.province === p).reduce((sum, s) => sum + s.verifyAmount, 0),
    })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(10,35,66,0.95)',
        borderColor: 'rgba(255,107,26,0.3)',
        textStyle: { color: '#fff', fontSize: 12 },
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,107,26,0.08)' } },
        formatter: (params: any) => {
          const p = params[0];
          const d = provinceStats[p.dataIndex];
          return `<div class="font-bold text-primary-orange mb-1">${d.name}</div>
                  <div class="text-white/70 text-xs">油站数量: <span class="text-white font-semibold">${d.value}</span> 家</div>
                  <div class="text-white/70 text-xs">月核销额: <span class="text-success font-semibold">¥${(d.volume / 10000).toFixed(1)}万</span></div>`;
        },
      },
      grid: { left: 50, right: 50, top: 20, bottom: 20 },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: provinceStats.map((d) => d.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: 'rgba(255,255,255,0.75)',
          fontSize: 11,
          fontWeight: 500,
        },
      },
      series: [
        {
          type: 'bar',
          data: provinceStats.map((d, i) => ({
            value: d.value,
            itemStyle: {
              borderRadius: [0, 6, 6, 0],
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: i === 0 ? '#FF6B1A' : i === 1 ? '#F59E0B' : 'rgba(59,130,246,0.7)' },
                  { offset: 1, color: i === 0 ? '#FFB347' : i === 1 ? '#FBBF24' : '#06B6D4' },
                ],
              },
              shadowBlur: 8,
              shadowColor: i < 2 ? 'rgba(255,107,26,0.3)' : 'rgba(59,130,246,0.2)',
            },
          })),
          barWidth: 14,
          label: {
            show: true,
            position: 'right',
            color: 'rgba(255,255,255,0.75)',
            fontSize: 11,
            fontWeight: 600,
            formatter: (p: any) => `${p.value}家`,
          },
        },
      ],
    };
  }, [filteredStations]);

  const brandPieOption: EChartsOption = useMemo(() => {
    const brandStats = (Object.keys(brandMap) as StationItem['brand'][]).map((b) => ({
      name: brandMap[b].name,
      value: filteredStations.filter((s) => s.brand === b).length,
      itemStyle: { color: brandMap[b].color },
    })).filter((d) => d.value > 0);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(10,35,66,0.95)',
        borderColor: 'rgba(255,107,26,0.3)',
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: (p: any) => `<div class="font-bold mb-1">${p.name}</div>
                                <div class="text-white/70 text-xs">油站数量: <span class="text-white font-semibold">${p.value}</span> 家</div>
                                <div class="text-white/70 text-xs">占比: <span class="text-primary-orange font-semibold">${p.percent}%</span></div>`,
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: 'rgba(10,35,66,0.9)',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
              color: '#fff',
              formatter: (p: any) => `{name|${p.name}}\n{val|${p.value}家}`,
              rich: {
                name: { fontSize: 12, color: 'rgba(255,255,255,0.6)', padding: [0, 0, 4, 0] },
                val: { fontSize: 20, color: '#FF6B1A', fontWeight: 'bold' },
              },
            },
          },
          labelLine: { show: false },
          data: brandStats,
        },
      ],
    };
  }, [filteredStations]);

  const priceTrendOption: EChartsOption = useMemo(() => {
    const dates = Array.from({ length: 30 }, (_, i) => `05-${String(i + 9).padStart(2, '0')}`);
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(10,35,66,0.95)',
        borderColor: 'rgba(255,107,26,0.3)',
        textStyle: { color: '#fff', fontSize: 12 },
        axisPointer: { type: 'cross', lineStyle: { color: 'rgba(255,107,26,0.3)' } },
        formatter: (params: any) => {
          let html = `<div class="font-semibold mb-1">${params[0].axisValue} · 0#柴油均价</div>`;
          params.forEach((p: any) => {
            html += `<div class="flex items-center justify-between gap-6 text-xs"><span style="color:${p.color}">● ${p.seriesName}</span><span class="font-mono font-semibold">¥${p.value.toFixed(2)}</span></div>`;
          });
          return html;
        },
      },
      legend: {
        data: ['中石化', '中石油', '壳牌'],
        top: 0, right: 0,
        textStyle: { color: 'rgba(255,255,255,0.65)', fontSize: 11 },
        icon: 'roundRect', itemWidth: 14, itemHeight: 5,
      },
      grid: { left: 45, right: 15, top: 40, bottom: 30 },
      xAxis: {
        type: 'category', boundaryGap: false, data: dates,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 10, interval: 4 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value', min: 6.6, max: 7.6,
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, formatter: '¥{value}' },
      },
      series: [
        { name: '中石化', type: 'line', smooth: true, symbol: 'none', data: dates.map((_, i) => 7.15 + Math.sin(i / 4) * 0.12 + (i % 3) * 0.02),
          lineStyle: { width: 2.5, color: '#E53935', shadowBlur: 8, shadowColor: 'rgba(229,57,53,0.4)' },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(229,57,53,0.2)' }, { offset: 1, color: 'rgba(229,57,53,0)' }] } } },
        { name: '中石油', type: 'line', smooth: true, symbol: 'none', data: dates.map((_, i) => 7.12 + Math.sin(i / 5 + 0.8) * 0.1 + (i % 2) * 0.015),
          lineStyle: { width: 2.5, color: '#1E88E5', shadowBlur: 8, shadowColor: 'rgba(30,136,229,0.4)' },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(30,136,229,0.18)' }, { offset: 1, color: 'rgba(30,136,229,0)' }] } } },
        { name: '壳牌', type: 'line', smooth: true, symbol: 'none', data: dates.map((_, i) => 7.25 + Math.sin(i / 3 + 1.5) * 0.08 + (i % 4) * 0.01),
          lineStyle: { width: 2.5, color: '#FDD835', shadowBlur: 8, shadowColor: 'rgba(253,216,53,0.4)' },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(253,216,53,0.15)' }, { offset: 1, color: 'rgba(253,216,53,0)' }] } } },
      ],
    };
  }, []);

  const stationColumns: ColumnsType<StationItem> = [
    {
      title: '油站信息', dataIndex: 'name', width: 280, fixed: 'left',
      render: (_, r) => {
        const b = brandMap[r.brand];
        return (
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-xl ${b.bg} border ${b.border} flex items-center justify-center flex-shrink-0`}>
              <Fuel size={22} style={{ color: b.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm font-semibold text-white truncate">{r.name}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Tag className="!rounded-md !text-[10px] !m-0" style={{ color: b.color, borderColor: `${b.color}55`, background: `${b.color}15` }}>{b.name}</Tag>
                <Tag color="blue" className="!rounded-md !text-[10px] !m-0">{r.id}</Tag>
              </div>
              <div className="text-[10px] text-white/40 mt-0.5 flex items-center gap-1">
                <MapPin size={10} />{r.province} · {r.city}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: '油品价目', width: 320,
      render: (_, r) => (
        <div className="grid grid-cols-5 gap-1.5">
          {Object.entries(r.prices).map(([k, v]) => {
            const colors: Record<string, string> = { '0#': 'text-success', '-10#': 'text-warning', '92#': 'text-info', '95#': 'text-primary-orange', '98#': 'text-purple-400' };
            return (
              <div key={k} className="rounded-md bg-white/5 border border-white/10 p-1.5 text-center">
                <div className="text-[9px] text-white/40 mb-0.5">{k}</div>
                <div className={`text-xs font-bold font-mono ${colors[k]}`}>¥{v.toFixed(2)}</div>
              </div>
            );
          })}
        </div>
      ),
    },
    {
      title: '今日核销', width: 150,
      render: (_, r) => (
        <div className="text-xs">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-white/40">笔数</span>
            <span className="font-mono font-semibold text-white">{r.verifyCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/40">金额</span>
            <span className="font-mono font-semibold text-success">¥{(r.verifyAmount / 10000).toFixed(1)}万</span>
          </div>
        </div>
      ),
    },
    {
      title: '入驻时间', dataIndex: 'joinDate', width: 110,
      render: (v) => <span className="text-xs text-white/55 font-mono">{v}</span>,
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (s: StationItem['status']) => {
        const map = {
          active: { c: 'success', t: '营业中', i: <CheckCircle2 size={11} /> },
          inactive: { c: 'default', t: '已停用', i: <X size={11} /> },
          pending: { c: 'warning', t: '待审核', i: <Clock size={11} /> },
        };
        const cfg = map[s];
        return <Tag color={cfg.c} className="!rounded-md !font-semibold !text-xs"><span className="inline-flex items-center gap-1">{cfg.i}{cfg.t}</span></Tag>;
      },
    },
    {
      title: '操作', key: 'action', width: 220, fixed: 'right',
      render: (_, r) => (
        <Space size="small" wrap>
          <Tooltip title="查看详情">
            <Button size="small" type="text" icon={<Eye size={14} className="text-white/70" />} onClick={() => setDetailDrawer(r)} />
          </Tooltip>
          <Tooltip title="编辑油站">
            <Button size="small" type="text" icon={<Edit3 size={14} className="text-info" />} onClick={() => { setEditModal(r); form.setFieldsValue(r); }} />
          </Tooltip>
          <Button size="small" type="primary" ghost className="!text-primary-orange !border-primary-orange/50" icon={<Banknote size={12} />}
            onClick={() => { setPriceDrawer(r); priceForm.setFieldsValue(r.prices); }}>
            价格维护
          </Button>
        </Space>
      ),
    },
  ];

  const overviewStats = [
    { t: '联盟油站', v: 32856, unit: '家', color: '#FF6B1A', icon: <Fuel size={20} />, pct: '+328' },
    { t: '今日核销', v: 18652, unit: '笔', color: '#10B981', icon: <Receipt size={20} />, pct: '+12.8%' },
    { t: '优惠总额', v: 186.2, unit: '万元', color: '#3B82F6', icon: <Banknote size={20} />, pct: '+8.5%' },
    { t: '司机覆盖率', v: 78.5, unit: '%', color: '#8B5CF6', icon: <TrendingUp size={20} />, pct: '+2.1%' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white m-0 mb-1.5">油站联盟管理</h1>
          <p className="text-sm text-white/50 m-0">全国油站接入 · 油价策略 · 核销订单 · 价格趋势</p>
        </div>
        <Space>
          <Segmented
            value={viewMode}
            onChange={(v) => setViewMode(v as any)}
            options={[
              { label: (<span className="inline-flex items-center gap-1.5"><Table2 size={14} />表格视图</span>), value: 'table' },
              { label: (<span className="inline-flex items-center gap-1.5"><Map size={14} />地图视图</span>), value: 'map' },
            ]}
            className="!bg-white/5"
          />
          <Button icon={<RefreshCw size={15} />} ghost className="!border-white/10">刷新</Button>
          <Button icon={<Download size={15} />} ghost className="!border-white/10">导出</Button>
          <Button type="primary" icon={<Plus size={15} />} className="!bg-gradient-primary !border-0 shadow-soft-orange">新增油站</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {overviewStats.map((s, i) => (
          <Col xs={12} lg={6} key={i}>
            <Card className="!bg-gradient-to-br !from-deep-blue-800/60 !to-deep-blue-900/60 !border-white/10 !backdrop-blur !h-full" styles={{ body: { padding: 18 } }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] text-white/50 mb-1.5">{s.t}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.v.toLocaleString()}</span>
                    <span className="text-[11px] text-white/50">{s.unit}</span>
                  </div>
                  <div className={`text-[10px] font-semibold mt-1 ${s.pct.startsWith('+') ? 'text-success' : 'text-danger'}`}>较昨日 {s.pct}</div>
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white" style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}88)`, boxShadow: `0 6px 16px -6px ${s.color}55` }}>{s.icon}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Tabs
        activeKey={activeTab} onChange={setActiveTab} size="large"
        className="[&_.ant-tabs-tab]:!text-white/60 [&_.ant-tabs-tab-active]:!text-white [&_.ant-tabs-ink-bar]:!bg-primary-orange [&_.ant-tabs-tab]:!px-5 [&_.ant-tabs-nav]:!px-0"
        items={[
          {
            key: 'stations', label: (<span className="inline-flex items-center gap-2"><Fuel size={15} />油站列表</span>),
            children: (
              <div className="dashboard-panel">
                {viewMode === 'table' ? (
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <Input size="small" placeholder="搜索油站名称/编号/地址" prefix={<Search size={13} className="text-white/40" />} value={searchText} onChange={(e) => setSearchText(e.target.value)} allowClear className="!w-64 !bg-white/5 !border-white/10" />
                      <Select size="small" value={brandFilter} onChange={setBrandFilter} className="!w-32 !bg-white/5 !border-white/10 [&_.ant-select-selection-item]:!text-white/70 [&_.ant-select-arrow]:!text-white/40">
                        <Option value="all">全部品牌</Option>
                        {Object.entries(brandMap).map(([k, v]) => (<Option key={k} value={k}>{v.name}</Option>))}
                      </Select>
                      <Select size="small" value={provinceFilter} onChange={setProvinceFilter} className="!w-28 !bg-white/5 !border-white/10 [&_.ant-select-selection-item]:!text-white/70 [&_.ant-select-arrow]:!text-white/40">
                        <Option value="all">全部省份</Option>
                        {provinces.map((p) => (<Option key={p} value={p}>{p}</Option>))}
                      </Select>
                      <Select size="small" value={statusFilter} onChange={setStatusFilter} className="!w-28 !bg-white/5 !border-white/10 [&_.ant-select-selection-item]:!text-white/70 [&_.ant-select-arrow]:!text-white/40">
                        <Option value="all">全部状态</Option>
                        <Option value="active">营业中</Option>
                        <Option value="inactive">已停用</Option>
                        <Option value="pending">待审核</Option>
                      </Select>
                      <Button size="small" icon={<Filter size={13} />} ghost className="!border-white/10">筛选</Button>
                      <div className="ml-auto flex items-center gap-2 text-[11px] text-white/50">
                        <span>共 <span className="text-primary-orange font-bold mx-1">{filteredStations.length}</span> 家油站</span>
                      </div>
                    </div>
                    <Table
                      rowKey="key"
                      columns={stationColumns}
                      dataSource={filteredStations}
                      scroll={{ x: 1300 }}
                      pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (t) => `共 ${t} 家油站` }}
                      rowClassName={(r) => r.status === 'pending' ? 'bg-warning/[0.04] hover:!bg-warning/[0.07]' : ''}
                    />
                  </div>
                ) : (
                  <div className="p-5">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: 560 }}>
                      <div className="lg:col-span-2 dashboard-panel">
                        <div className="dashboard-title">
                          <Building2 size={14} className="text-primary-orange" />
                          <span className="text-sm">省份油站分布 TOP10</span>
                          <Tag color="blue" className="ml-auto !rounded-md !text-[10px]">按数量</Tag>
                        </div>
                        <div className="p-3" style={{ height: 500 }}>
                          <ReactECharts option={provinceBarOption} style={{ height: '100%', width: '100%' }} theme="dark" opts={{ renderer: 'canvas' }} />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="dashboard-panel" style={{ height: 270 }}>
                          <div className="dashboard-title">
                            <Fuel size={14} className="text-primary-orange" />
                            <span className="text-sm">品牌占比</span>
                          </div>
                          <div className="p-3" style={{ height: 210 }}>
                            <ReactECharts option={brandPieOption} style={{ height: '100%', width: '100%' }} theme="dark" opts={{ renderer: 'canvas' }} />
                          </div>
                        </div>
                        <div className="dashboard-panel" style={{ height: 270 }}>
                          <div className="dashboard-title">
                            <Banknote size={14} className="text-primary-orange" />
                            <span className="text-sm">今日核销概览</span>
                          </div>
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-white/60">核销订单</span>
                              <span className="text-lg font-bold text-success font-mono">2,856<span className="text-xs text-white/50 ml-1">笔</span></span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-white/60">核销金额</span>
                              <span className="text-lg font-bold text-primary-orange font-mono">¥158.6<span className="text-xs text-white/50 ml-1">万</span></span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-white/60">优惠让利</span>
                              <span className="text-sm font-semibold text-warning font-mono">¥9.32<span className="text-xs text-white/50 ml-1">万</span></span>
                            </div>
                            <div className="pt-2 border-t border-white/10">
                              <div className="flex items-center justify-between text-[11px] mb-1.5">
                                <span className="text-white/50">完成率</span>
                                <span className="text-white/80 font-medium">86.5%</span>
                              </div>
                              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full w-[86.5%] bg-gradient-to-r from-success to-emerald-400 rounded-full" />
                              </div>
                            </div>
                            <div className="pt-1">
                              <div className="flex items-center justify-between text-[11px] mb-1.5">
                                <span className="text-white/50">异常订单</span>
                                <span className="text-danger font-medium">32 笔待复核</span>
                              </div>
                              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full w-[3.2%] bg-gradient-to-r from-danger to-red-400 rounded-full" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ),
          },
          {
            key: 'trend', label: (<span className="inline-flex items-center gap-2"><BarChart3 size={15} />价格趋势分析</span>),
            children: (
              <div className="dashboard-panel">
                <div className="p-5">
                  <Row gutter={16}>
                    <Col xs={24} lg={18}>
                      <Card size="small" className="!bg-white/[0.03] !border-white/10 !h-full" styles={{ body: { padding: 16 } }}
                        title={<div className="text-sm font-semibold text-white flex items-center gap-2"><TrendingUp size={14} className="text-primary-orange" />近30天 0#柴油 均价走势 (元/L)</div>}>
                        <div style={{ height: 380 }}><ReactECharts option={priceTrendOption} style={{ height: '100%' }} theme="dark" /></div>
                      </Card>
                    </Col>
                    <Col xs={24} lg={6}>
                      <div className="space-y-4">
                        {[
                          { t: '今日均价', v: 7.18, unit: '元/L', diff: '-0.02', c: '#10B981' },
                          { t: '月均价', v: 7.25, unit: '元/L', diff: '+0.08', c: '#EF4444' },
                          { t: '联盟优惠', v: 0.42, unit: '元/L', diff: '平均', c: '#3B82F6' },
                          { t: '节省燃油', v: 3856, unit: '万元', diff: '本月累计', c: '#FF6B1A' },
                        ].map((k, i) => (
                          <div key={i} className="p-4 rounded-xl bg-gradient-to-br from-deep-blue-800/60 to-deep-blue-900/60 border border-white/10">
                            <div className="text-[11px] text-white/50 mb-1">{k.t}</div>
                            <div className="flex items-baseline justify-between">
                              <div>
                                <span className="text-2xl font-bold font-mono" style={{ color: k.c }}>{k.v.toLocaleString()}</span>
                                <span className="text-[11px] text-white/50 ml-1">{k.unit}</span>
                              </div>
                              <span className={`text-[10px] font-semibold ${k.diff.startsWith('-') ? 'text-success' : k.diff.startsWith('+') ? 'text-danger' : 'text-white/50'}`}>{k.diff}</span>
                            </div>
                          </div>
                        ))}
                        <Card size="small" className="!bg-white/[0.03] !border-white/10" styles={{ body: { padding: 14 } }}>
                          <div className="text-xs font-semibold text-primary-orange mb-2.5">油价情报</div>
                          <List size="small"
                            dataSource={[
                              { t: '山东', d: '地炼出货价下调¥50/吨', tag: '↓' },
                              { t: '西北', d: '中石油批发价维稳', tag: '-' },
                              { t: '华南', d: '中石化零售价不变', tag: '-' },
                              { t: '华东', d: '壳牌会员日95折', tag: '↓' },
                            ]}
                            renderItem={(it) => (
                              <List.Item className="!px-0 !border-white/5">
                                <div className="w-full flex items-center justify-between">
                                  <div className="text-xs text-white/70 flex items-center gap-2">
                                    <Tag className="!rounded-md !text-[10px] !m-0" color="blue">{it.t}</Tag>
                                    {it.d}
                                  </div>
                                  <span className={`text-xs font-bold ${it.tag === '↓' ? 'text-success' : 'text-white/40'}`}>{it.tag}</span>
                                </div>
                              </List.Item>
                            )} />
                        </Card>
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
            ),
          },
          {
            key: 'verify', label: (<span className="inline-flex items-center gap-2"><Receipt size={15} />核销订单<Badge count={verifyMock.length} size="small" color="#10B981" /></span>),
            children: (
              <div className="dashboard-panel">
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Input size="small" placeholder="搜索订单/油站/车牌" prefix={<Search size={13} className="text-white/40" />} allowClear className="!w-64 !bg-white/5 !border-white/10" />
                    <Select size="small" defaultValue="all" className="!w-32 !bg-white/5 !border-white/10 [&_.ant-select-selection-item]:!text-white/70 [&_.ant-select-arrow]:!text-white/40">
                      <Option value="all">全部油品</Option><Option value="0">0#柴油</Option>
                      <Option value="10">-10#柴油</Option><Option value="92">92#汽油</Option>
                      <Option value="95">95#汽油</Option><Option value="98">98#汽油</Option>
                    </Select>
                    <Button size="small" icon={<Download size={13} />} ghost className="!border-white/10 !ml-auto">导出</Button>
                  </div>
                  <Table size="small" rowKey="key"
                    dataSource={verifyMock}
                    pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 笔核销记录` }}
                    columns={[
                      { title: '核销单号', dataIndex: 'id', width: 140, render: (v) => <span className="text-xs font-mono text-info">{v}</span> },
                      { title: '油站', dataIndex: 'stationName', width: 260, ellipsis: true, render: (v) => <span className="text-xs text-white/80" title={v}>{v}</span> },
                      { title: '司机/车牌', width: 160, render: (_, r) => (<div><div className="text-xs text-white/85">{r.driverName}</div><div className="text-[10px] text-white/50 font-mono">{r.plate}</div></div>) },
                      { title: '油品/升数', width: 140, render: (_, r) => (<div><div className="text-xs text-white/85">{r.fuelType}</div><div className="text-[10px] text-white/50 font-mono">{r.liters.toFixed(1)} L</div></div>) },
                      { title: '金额信息', width: 180, render: (_, r) => (<div className="text-xs"><div className="flex items-center justify-between"><span className="text-white/40">原价</span><span className="font-mono text-white/70">¥{r.amount.toFixed(2)}</span></div><div className="flex items-center justify-between"><span className="text-white/40">优惠</span><span className="font-mono text-success">-¥{r.discount.toFixed(2)}</span></div><div className="flex items-center justify-between pt-0.5 mt-0.5 border-t border-white/10"><span className="text-white/60 font-semibold">实付</span><span className="font-mono font-bold text-primary-orange">¥{r.actualPay.toFixed(2)}</span></div></div>) },
                      { title: '时间', dataIndex: 'time', width: 160, render: (v) => <span className="text-[11px] text-white/55 font-mono">{v}</span> },
                      { title: '状态', dataIndex: 'status', width: 100, render: (s) => {
                        const m = { success: { c: 'green', t: '已核销' }, refund: { c: 'red', t: '已退款' }, pending: { c: 'warning', t: '处理中' } };
                        const cfg = m[s as keyof typeof m]; return <Tag color={cfg.c} className="!rounded-md !text-xs !font-semibold">{cfg.t}</Tag>;
                      }},
                    ]} />
                </div>
              </div>
            ),
          },
        ]}
      />

      <Modal title={<div className="flex items-center gap-2"><Edit3 size={18} className="text-info" /><span className="text-lg font-bold">编辑油站信息</span></div>}
        open={!!editModal} onCancel={() => setEditModal(null)} width={640}
        onOk={() => form.validateFields().then((v) => { message.success(`已保存: ${v.name}`); setEditModal(null); })}
        okText="保存" cancelText="取消" okButtonProps={{ className: '!bg-gradient-primary !border-0' }}
        className="[&_.ant-modal-content]:!bg-deep-blue-800 [&_.ant-modal-header]:!border-white/10 [&_.ant-modal-title]:!text-white [&_.ant-modal-close]:!text-white/50">
        {editModal && (
          <Form form={form} layout="vertical" size="small" className="[&_.ant-form-item-label>label]:!text-white/70 [&_.ant-form-item-label>label]:!text-xs mt-2">
            <Row gutter={16}>
              <Col span={16}><Form.Item name="name" label="油站名称" rules={[{ required: true }]}><Input className="!bg-white/5 !border-white/10 [&_.ant-input]:!text-white" /></Form.Item></Col>
              <Col span={8}><Form.Item name="brand" label="品牌" rules={[{ required: true }]}><Select className="!bg-white/5 !border-white/10 [&_.ant-select-selection-item]:!text-white/80">{Object.entries(brandMap).map(([k, v]) => (<Option key={k} value={k}>{v.name}</Option>))}</Select></Form.Item></Col>
              <Col span={8}><Form.Item name="province" label="省份"><Input className="!bg-white/5 !border-white/10 [&_.ant-input]:!text-white" /></Form.Item></Col>
              <Col span={8}><Form.Item name="city" label="城市"><Input className="!bg-white/5 !border-white/10 [&_.ant-input]:!text-white" /></Form.Item></Col>
              <Col span={8}><Form.Item name="phone" label="联系电话"><Input className="!bg-white/5 !border-white/10 [&_.ant-input]:!text-white" /></Form.Item></Col>
              <Col span={24}><Form.Item name="address" label="详细地址"><Input className="!bg-white/5 !border-white/10 [&_.ant-input]:!text-white" /></Form.Item></Col>
              <Col span={12}><Form.Item name="lng" label="经度"><InputNumber className="!w-full !bg-white/5 !border-white/10 [&_input]:!text-white" /></Form.Item></Col>
              <Col span={12}><Form.Item name="lat" label="纬度"><InputNumber className="!w-full !bg-white/5 !border-white/10 [&_input]:!text-white" /></Form.Item></Col>
              <Col span={12}><Form.Item name="status" label="状态" valuePropName="checked"><Switch checkedChildren="营业" unCheckedChildren="停用" className="!bg-primary-orange" /></Form.Item></Col>
              <Col span={12}><Form.Item name="contact" label="站长姓名"><Input className="!bg-white/5 !border-white/10 [&_.ant-input]:!text-white" /></Form.Item></Col>
            </Row>
          </Form>
        )}
      </Modal>

      <Drawer title={<div className="flex items-center gap-2"><Banknote size={18} className="text-primary-orange" /><span className="text-lg font-bold text-white">油价维护 · {priceDrawer?.name}</span></div>}
        placement="right" width={500} open={!!priceDrawer} onClose={() => setPriceDrawer(null)}
        className="[&_.ant-drawer-content]:!bg-deep-blue-800 [&_.ant-drawer-header]:!border-white/10 [&_.ant-drawer-close]:!text-white/50 [&_.ant-drawer-body]:!p-5"
        extra={<Button type="primary" icon={<Save size={14} />} className="!bg-gradient-primary !border-0" onClick={() => { priceForm.validateFields().then((v) => { message.success('油价已更新并同步至APP'); setPriceDrawer(null); }); }}>保存生效</Button>}>
        {priceDrawer && (
          <div>
            <div className="rounded-xl bg-gradient-to-br from-primary-orange/10 to-info/5 border border-white/10 p-4 mb-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-white/50 mb-1">当前生效时间</div>
                  <div className="text-sm font-mono text-white">2024-06-07 00:00 ~ 长期有效</div>
                </div>
                <Tag color="green" className="!rounded-md !text-xs"><CheckCircle2 size={11} className="mr-1" />已生效</Tag>
              </div>
              <Divider className="!border-white/10 !my-3" />
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center justify-between"><span className="text-white/50">更新人</span><span className="text-white/80">运营-张经理</span></div>
                <div className="flex items-center justify-between"><span className="text-white/50">最近更新</span><span className="text-white/80 font-mono">2024-06-06 18:22</span></div>
              </div>
            </div>
            <div className="text-xs font-semibold text-primary-orange uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary-orange rounded" />油品价格表单 (元/升)
            </div>
            <Form form={priceForm} layout="vertical" size="small" className="[&_.ant-form-item-label>label]:!text-white/70 [&_.ant-form-item-label>label]:!text-xs">
              {[
                { k: '0#', n: '0# 柴油', c: '#10B981', d: '货运主力油品' },
                { k: '-10#', n: '-10# 柴油', c: '#F59E0B', d: '寒冷地区适用' },
                { k: '92#', n: '92# 汽油', c: '#3B82F6', d: '经济型汽油' },
                { k: '95#', n: '95# 汽油', c: '#FF6B1A', d: '中端常用油品' },
                { k: '98#', n: '98# 汽油', c: '#8B5CF6', d: '高端汽油' },
              ].map((o) => (
                <div key={o.k} className="rounded-lg bg-white/5 border border-white/10 p-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Fuel size={14} style={{ color: o.c }} />
                      <span className="text-sm font-semibold text-white">{o.n}</span>
                      <span className="text-[10px] text-white/40">{o.d}</span>
                    </div>
                    <Tag color="blue" className="!rounded-md !text-[10px]">会员 9.7折</Tag>
                  </div>
                  <Form.Item name={o.k} className="!mb-0">
                    <InputNumber
                      step={0.01} min={0} precision={2}
                      addonBefore="零售价" addonAfter="元/L"
                      className="!w-full !bg-white/5 !border-white/10 [&_input]:!text-white [&_input]:!font-mono [&_input]:!font-bold [&_.ant-input-number-group-addon]:!bg-white/5 [&_.ant-input-number-group-addon]:!text-white/50 [&_.ant-input-number-group-addon]:!border-white/10"
                      style={{ color: o.c }}
                    />
                  </Form.Item>
                </div>
              ))}
            </Form>
          </div>
        )}
      </Drawer>

      <Drawer title={<div className="flex items-center gap-2"><Building2 size={18} className="text-info" /><span className="text-lg font-bold text-white">油站详情</span></div>}
        placement="right" width={520} open={!!detailDrawer} onClose={() => setDetailDrawer(null)}
        className="[&_.ant-drawer-content]:!bg-deep-blue-800 [&_.ant-drawer-header]:!border-white/10 [&_.ant-drawer-close]:!text-white/50 [&_.ant-drawer-body]:!p-5">
        {detailDrawer && (() => {
          const b = brandMap[detailDrawer.brand];
          return (
            <div>
              <div className="rounded-2xl overflow-hidden border border-white/10 mb-5">
                <div className={`h-24 ${b.bg} relative`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Fuel size={56} style={{ color: b.color, opacity: 0.5 }} />
                  </div>
                  <div className="absolute top-3 left-4"><Tag style={{ color: b.color, borderColor: `${b.color}55`, background: `${b.color}22` }} className="!rounded-md !text-xs !font-semibold border">{b.name}</Tag></div>
                  <div className="absolute top-3 right-4">{detailDrawer.status === 'active' && <Badge status="success" color="#10B981" text={<span className="text-xs text-success font-semibold">营业中</span>} />}</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-deep-blue-800/80 to-deep-blue-900/80">
                  <div className="text-lg font-bold text-white mb-1">{detailDrawer.name}</div>
                  <div className="flex items-center gap-2 text-[11px] text-white/50 mb-2"><MapPin size={12} />{detailDrawer.province} {detailDrawer.city} {detailDrawer.address}</div>
                  <div className="flex items-center gap-4 text-[11px] text-white/50">
                    <span className="flex items-center gap-1"><Phone size={12} />{detailDrawer.contact} {detailDrawer.phone}</span>
                    <span className="flex items-center gap-1"><Clock size={12} />入驻 {detailDrawer.joinDate}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { t: '累计核销', v: detailDrawer.verifyCount, u: '笔', c: '#3B82F6' },
                  { t: '核销总额', v: (detailDrawer.verifyAmount / 10000).toFixed(1), u: '万', c: '#10B981' },
                  { t: '综合评分', v: detailDrawer.rating.toFixed(1), u: '分', c: '#FF6B1A' },
                ].map((k, i) => (
                  <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                    <div className="text-[10px] text-white/40 mb-1">{k.t}</div>
                    <div className="flex items-baseline justify-center gap-0.5">
                      <span className="text-xl font-bold font-mono" style={{ color: k.c }}>{k.v}</span>
                      <span className="text-[10px] text-white/50">{k.u}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-xs font-semibold text-primary-orange uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-primary-orange rounded" />当前油价
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-5">
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(detailDrawer.prices).map(([k, v]) => {
                    const cs: Record<string, string> = { '0#': 'text-success', '-10#': 'text-warning', '92#': 'text-info', '95#': 'text-primary-orange', '98#': 'text-purple-400' };
                    return (
                      <div key={k} className="text-center">
                        <div className="text-[10px] text-white/40 mb-1">{k}</div>
                        <div className={`text-base font-bold font-mono ${cs[k]}`}>¥{v.toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="text-xs font-semibold text-info uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-info rounded" />快捷操作
              </div>
              <Space className="flex-wrap">
                <Button icon={<Edit3 size={13} />} ghost className="!border-white/10 !w-36" onClick={() => { setDetailDrawer(null); setEditModal(detailDrawer); form.setFieldsValue(detailDrawer); }}>编辑信息</Button>
                <Button icon={<Banknote size={13} />} type="primary" ghost className="!text-primary-orange !border-primary-orange/50 !w-36"
                  onClick={() => { setPriceDrawer(detailDrawer); priceForm.setFieldsValue(detailDrawer.prices); }}>维护油价</Button>
                <Button icon={<Receipt size={13} />} ghost className="!border-white/10 !w-36">核销记录</Button>
                <Button icon={<TrendingUp size={13} />} ghost className="!border-white/10 !w-36">数据分析</Button>
              </Space>
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
};

export default AdminStations;
