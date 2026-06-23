import { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Droplets,
  Zap,
  Flame,
  HardHat,
  MapPin,
  Clock,
  X,
  Layers,
  Info,
  Filter,
  Building,
  Phone,
  Users,
  FileText,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Timer,
  ListFilter,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import type { MapLayerItem } from '@shared/types';
import { districts } from '@shared/types';
import { cn } from '@/lib/utils';

const layerTypes = [
  { value: 'water', label: '停水通知', icon: Droplets, color: 'text-blue-500 bg-blue-50', activeColor: 'bg-blue-600 text-white', borderColor: 'border-blue-600', chartColor: '#3b82f6' },
  { value: 'power', label: '停电通知', icon: Zap, color: 'text-yellow-600 bg-yellow-50', activeColor: 'bg-yellow-500 text-white', borderColor: 'border-yellow-500', chartColor: '#eab308' },
  { value: 'gas', label: '停气通知', icon: Flame, color: 'text-orange-500 bg-orange-50', activeColor: 'bg-orange-600 text-white', borderColor: 'border-orange-600', chartColor: '#f97316' },
  { value: 'construction', label: '施工公告', icon: HardHat, color: 'text-purple-500 bg-purple-50', activeColor: 'bg-purple-600 text-white', borderColor: 'border-purple-600', chartColor: '#8b5cf6' },
];

const statusColors: Record<string, string> = {
  normal: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  resolved: 'bg-slate-400',
};

const statusLabels: Record<string, string> = {
  normal: '正常进行',
  warning: '需关注',
  danger: '紧急',
  resolved: '已处置',
};

const xuzhouDistricts = [
  { name: '鼓楼区', x: 45, y: 35, w: 18, h: 14 },
  { name: '云龙区', x: 60, y: 38, w: 16, h: 14 },
  { name: '泉山区', x: 38, y: 48, w: 18, h: 14 },
  { name: '铜山区', x: 30, y: 60, w: 28, h: 20 },
  { name: '贾汪区', x: 65, y: 20, w: 22, h: 18 },
  { name: '邳州市', x: 62, y: 62, w: 24, h: 20 },
  { name: '新沂市', x: 80, y: 50, w: 16, h: 20 },
  { name: '沛县', x: 5, y: 15, w: 22, h: 22 },
  { name: '丰县', x: 2, y: 40, w: 22, h: 20 },
  { name: '睢宁县', x: 55, y: 82, w: 22, h: 15 },
];

export default function GISMap() {
  const [activeLayers, setActiveLayers] = useState<string[]>(['water', 'power', 'gas', 'construction']);
  const [mapData, setMapData] = useState<MapLayerItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MapLayerItem | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/map/layers');
      const data = await res.json();
      if (data.success) {
        setMapData(data.data);
      }
    } catch (e) {
      const mockData: MapLayerItem[] = [
        {
          id: 'water_1',
          name: '鼓楼区供水主管维修',
          type: 'water',
          status: 'warning',
          address: '鼓楼区中山北路沿线',
          district: '鼓楼区',
          startTime: '2024-06-20 09:00:00',
          endTime: '2024-06-20 17:00:00',
          description: '因供水主管道老化更换施工，中山北路沿线用户将暂停供水8小时。请相关用户提前做好储水准备。',
          lng: 117.175,
          lat: 34.285,
          affectedArea: 2.5,
          affectedHouseholds: 1260,
          responsibleUnit: '徐州市自来水公司',
          contactPerson: '李工',
          contactPhone: '13800138001',
          disposalTimeline: [
            { id: '1', time: '2024-06-20 08:00:00', action: '发现隐患', operator: '巡检组', remark: '日常巡检发现管道腐蚀' },
            { id: '2', time: '2024-06-20 08:30:00', action: '方案制定', operator: '技术部', remark: '制定维修更换方案' },
            { id: '3', time: '2024-06-20 09:00:00', action: '开始施工', operator: '维修队', remark: '停水并开始管道更换作业' },
            { id: '4', time: '2024-06-20 14:00:00', action: '施工进行中', operator: '维修队', remark: '管道焊接完成，正在试压' },
          ],
        },
        {
          id: 'power_1',
          name: '云龙区变电站检修',
          type: 'power',
          status: 'warning',
          address: '云龙区和平大道沿线',
          district: '云龙区',
          startTime: '2024-06-22 07:00:00',
          endTime: '2024-06-22 19:00:00',
          description: '110kV变电站年度检修，沿线商业和居民用户停电12小时。请提前做好停电准备。',
          lng: 117.225,
          lat: 34.258,
          affectedArea: 3.8,
          affectedHouseholds: 2850,
          responsibleUnit: '国网徐州供电公司',
          contactPerson: '王主任',
          contactPhone: '13900139001',
          disposalTimeline: [
            { id: '1', time: '2024-06-18 10:00:00', action: '计划制定', operator: '运维部', remark: '制定年度检修计划' },
            { id: '2', time: '2024-06-19 15:00:00', action: '通知发布', operator: '客服中心', remark: '发布停电通知，通知受影响用户' },
            { id: '3', time: '2024-06-22 07:00:00', action: '开始检修', operator: '检修队', remark: '停电并开始设备检修作业' },
          ],
        },
        {
          id: 'gas_1',
          name: '鼓楼区燃气管道更换',
          type: 'gas',
          status: 'danger',
          address: '鼓楼区民主路附近',
          district: '鼓楼区',
          startTime: '2024-06-20 14:00:00',
          endTime: '2024-06-20 22:00:00',
          description: '燃气管道腐蚀严重，紧急更换施工，请用户关闭阀门注意安全。',
          lng: 117.19,
          lat: 34.275,
          affectedArea: 1.8,
          affectedHouseholds: 980,
          responsibleUnit: '徐州港华燃气公司',
          contactPerson: '张工',
          contactPhone: '13700137001',
          disposalTimeline: [
            { id: '1', time: '2024-06-20 12:00:00', action: '接报险情', operator: '调度中心', remark: '接到用户报警，闻到煤气味' },
            { id: '2', time: '2024-06-20 12:30:00', action: '现场排查', operator: '抢修队', remark: '确认管道腐蚀泄漏' },
            { id: '3', time: '2024-06-20 13:00:00', action: '应急预案启动', operator: '应急办', remark: '启动紧急预案，疏散周边人员' },
            { id: '4', time: '2024-06-20 14:00:00', action: '关阀停气', operator: '抢修队', remark: '关闭相关管段阀门，开始更换作业' },
          ],
        },
        {
          id: 'construction_1',
          name: '地铁5号线施工',
          type: 'construction',
          status: 'normal',
          address: '泉山区三环南路沿线',
          district: '泉山区',
          startTime: '2024-01-15 00:00:00',
          endTime: '2026-12-31 23:59:59',
          description: '地铁5号线一期工程土建施工，部分路段限行。',
          lng: 117.155,
          lat: 34.248,
          affectedArea: 8.5,
          affectedHouseholds: 5200,
          responsibleUnit: '徐州市轨道交通建设指挥部',
          contactPerson: '刘指挥',
          contactPhone: '13600136001',
          disposalTimeline: [
            { id: '1', time: '2024-01-10 09:00:00', action: '开工许可', operator: '住建局', remark: '取得施工许可证' },
            { id: '2', time: '2024-01-15 00:00:00', action: '正式开工', operator: '施工单位', remark: '地铁5号线一期工程正式开工' },
            { id: '3', time: '2024-06-01 10:00:00', action: '进度更新', operator: '施工单位', remark: '已完成25%土建工程' },
          ],
        },
        {
          id: 'power_2',
          name: '铜山区线路整改',
          type: 'power',
          status: 'normal',
          address: '铜山区北京南路两侧',
          district: '铜山区',
          startTime: '2024-06-23 08:30:00',
          endTime: '2024-06-23 17:30:00',
          description: '架空线路入地改造工程，部分区域停电。',
          lng: 117.168,
          lat: 34.215,
          affectedArea: 2.1,
          affectedHouseholds: 750,
          responsibleUnit: '国网徐州供电公司铜山分公司',
          contactPerson: '赵工',
          contactPhone: '13500135001',
          disposalTimeline: [
            { id: '1', time: '2024-06-20 09:00:00', action: '计划公示', operator: '铜山供电', remark: '公示线路入地改造计划' },
            { id: '2', time: '2024-06-23 08:30:00', action: '开始施工', operator: '施工队', remark: '停电并开始线路改造' },
          ],
        },
        {
          id: 'water_2',
          name: '泉山区小区管网改造',
          type: 'water',
          status: 'normal',
          address: '泉山区泰山街道某小区',
          district: '泉山区',
          startTime: '2024-06-21 08:00:00',
          endTime: '2024-06-21 16:00:00',
          description: '小区供水管网升级改造，施工期间供水压力可能下降。',
          lng: 117.145,
          lat: 34.235,
          affectedArea: 1.2,
          affectedHouseholds: 420,
          responsibleUnit: '徐州市自来水公司泉山分公司',
          contactPerson: '孙工',
          contactPhone: '13400134001',
          disposalTimeline: [
            { id: '1', time: '2024-06-19 14:00:00', action: '方案确定', operator: '泉山水务', remark: '确定管网改造方案' },
            { id: '2', time: '2024-06-21 08:00:00', action: '开始改造', operator: '施工队', remark: '开始小区管网改造作业' },
          ],
        },
        {
          id: 'gas_2',
          name: '新沂市燃气调压站检修',
          type: 'gas',
          status: 'warning',
          address: '新沂市市府路附近',
          district: '新沂市',
          startTime: '2024-06-21 09:00:00',
          endTime: '2024-06-21 15:00:00',
          description: '燃气调压站年度检修，部分区域停气。',
          lng: 118.340,
          lat: 34.370,
          affectedArea: 1.5,
          affectedHouseholds: 680,
          responsibleUnit: '新沂市燃气公司',
          contactPerson: '周工',
          contactPhone: '13300133001',
          disposalTimeline: [
            { id: '1', time: '2024-06-20 10:00:00', action: '通知发布', operator: '新沂燃气', remark: '发布停气通知' },
            { id: '2', time: '2024-06-21 09:00:00', action: '开始检修', operator: '检修队', remark: '开始调压站检修' },
          ],
        },
        {
          id: 'water_3',
          name: '邳州市城区供水主干管抢修',
          type: 'water',
          status: 'danger',
          address: '邳州市青年东路沿线',
          district: '邳州市',
          startTime: '2024-06-20 10:00:00',
          endTime: '2024-06-20 18:00:00',
          description: '供水主干管爆裂紧急抢修，沿线用户暂停供水。',
          lng: 117.956,
          lat: 34.317,
          affectedArea: 3.2,
          affectedHouseholds: 1850,
          responsibleUnit: '邳州市自来水公司',
          contactPerson: '吴工',
          contactPhone: '13200132001',
          disposalTimeline: [
            { id: '1', time: '2024-06-20 09:15:00', action: '接报', operator: '调度中心', remark: '接报水管爆裂' },
            { id: '2', time: '2024-06-20 09:30:00', action: '现场确认', operator: '抢修队', remark: '确认主干管爆裂' },
            { id: '3', time: '2024-06-20 10:00:00', action: '关阀抢修', operator: '抢修队', remark: '关闭阀门开始抢修' },
          ],
        },
        {
          id: 'construction_2',
          name: '沛县城区道路改造工程',
          type: 'construction',
          status: 'normal',
          address: '沛县迎宾大道沿线',
          district: '沛县',
          startTime: '2024-03-01 00:00:00',
          endTime: '2024-09-30 23:59:59',
          description: '城区主干道拓宽改造工程，部分路段单向通行。',
          lng: 116.933,
          lat: 34.730,
          affectedArea: 4.5,
          affectedHouseholds: 2100,
          responsibleUnit: '沛县住建局',
          contactPerson: '郑工',
          contactPhone: '13100131001',
          disposalTimeline: [
            { id: '1', time: '2024-02-20 09:00:00', action: '工程立项', operator: '沛县发改委', remark: '道路改造工程立项' },
            { id: '2', time: '2024-03-01 00:00:00', action: '开工建设', operator: '施工单位', remark: '正式开工' },
          ],
        },
        {
          id: 'power_3',
          name: '贾汪区农村电网升级',
          type: 'power',
          status: 'normal',
          address: '贾汪区青山泉镇周边',
          district: '贾汪区',
          startTime: '2024-06-24 07:30:00',
          endTime: '2024-06-24 16:30:00',
          description: '农村电网升级改造，部分村庄停电。',
          lng: 117.450,
          lat: 34.430,
          affectedArea: 2.8,
          affectedHouseholds: 560,
          responsibleUnit: '国网贾汪供电公司',
          contactPerson: '钱工',
          contactPhone: '13000130001',
          disposalTimeline: [
            { id: '1', time: '2024-06-22 10:00:00', action: '计划发布', operator: '贾汪供电', remark: '发布农网升级计划' },
            { id: '2', time: '2024-06-24 07:30:00', action: '开始施工', operator: '施工队', remark: '停电开始升级作业' },
          ],
        },
        {
          id: 'water_4',
          name: '睢宁县供水水厂设备检修',
          type: 'water',
          status: 'resolved',
          address: '睢宁县睢城街道',
          district: '睢宁县',
          startTime: '2024-06-19 08:00:00',
          endTime: '2024-06-19 16:00:00',
          description: '水厂设备年度检修，已完成恢复正常供水。',
          lng: 117.943,
          lat: 33.915,
          affectedArea: 2.0,
          affectedHouseholds: 1100,
          responsibleUnit: '睢宁县自来水公司',
          contactPerson: '冯工',
          contactPhone: '13812345678',
          disposalTimeline: [
            { id: '1', time: '2024-06-18 09:00:00', action: '计划制定', operator: '睢宁水务', remark: '制定检修计划' },
            { id: '2', time: '2024-06-19 08:00:00', action: '开始检修', operator: '检修队', remark: '开始设备检修' },
            { id: '3', time: '2024-06-19 15:00:00', action: '检修完成', operator: '检修队', remark: '检修完成，开始供水' },
            { id: '4', time: '2024-06-19 16:00:00', action: '恢复供水', operator: '调度中心', remark: '全面恢复正常供水' },
          ],
        },
        {
          id: 'construction_3',
          name: '丰县城区雨污分流工程',
          type: 'construction',
          status: 'normal',
          address: '丰县人民路沿线',
          district: '丰县',
          startTime: '2024-04-01 00:00:00',
          endTime: '2024-10-31 23:59:59',
          description: '城区雨污分流管网改造工程，部分路段围挡施工。',
          lng: 116.580,
          lat: 34.240,
          affectedArea: 3.5,
          affectedHouseholds: 1680,
          responsibleUnit: '丰县住建局',
          contactPerson: '陈工',
          contactPhone: '13912345678',
          disposalTimeline: [
            { id: '1', time: '2024-03-15 09:00:00', action: '工程立项', operator: '丰县发改委', remark: '雨污分流工程立项' },
            { id: '2', time: '2024-04-01 00:00:00', action: '开工建设', operator: '施工单位', remark: '正式开工建设' },
          ],
        },
      ];
      setMapData(mockData);
    }
  };

  const toggleLayer = (type: string) => {
    setActiveLayers((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleAllLayers = () => {
    if (activeLayers.length === layerTypes.length) {
      setActiveLayers([]);
    } else {
      setActiveLayers(layerTypes.map((l) => l.value));
    }
  };

  const filteredData = useMemo(() => {
    let data = mapData.filter((item) => activeLayers.includes(item.type));
    if (eventTypeFilter !== 'all') {
      data = data.filter((item) => item.type === eventTypeFilter);
    }
    return data;
  }, [mapData, activeLayers, eventTypeFilter]);

  const layerStats = useMemo(() => {
    return layerTypes.map((layer) => ({
      ...layer,
      count: mapData.filter((item) => item.type === layer.value && item.status !== 'resolved').length,
    }));
  }, [mapData]);

  const districtEventCount = useMemo(() => {
    const counts: Record<string, { total: number; [key: string]: number }> = {};
    districts.forEach((d) => {
      counts[d] = { total: 0, water: 0, power: 0, gas: 0, construction: 0 };
    });
    filteredData.forEach((item) => {
      if (counts[item.district]) {
        counts[item.district].total++;
        counts[item.district][item.type]++;
      }
    });
    return counts;
  }, [filteredData]);

  const overallStats = useMemo(() => {
    const activeEvents = mapData.filter((item) => item.status !== 'resolved');
    const today = '2024-06-20';
    const todayNew = mapData.filter((item) => item.startTime.startsWith(today)).length;
    const resolved = mapData.filter((item) => item.status === 'resolved').length;
    const avgDuration = activeEvents.length > 0
      ? (activeEvents.reduce((sum, item) => {
          const start = new Date(item.startTime).getTime();
          const end = new Date(item.endTime).getTime();
          return sum + (end - start) / (1000 * 60 * 60);
        }, 0) / activeEvents.length).toFixed(1)
      : '0';
    return { activeCount: activeEvents.length, todayNew, resolved, avgDuration };
  }, [mapData]);

  const getDistrictColor = (districtName: string) => {
    const count = districtEventCount[districtName]?.total || 0;
    if (count === 0) return 'bg-slate-100 border-slate-200';
    if (count === 1) return 'bg-green-100 border-green-300';
    if (count === 2) return 'bg-yellow-100 border-yellow-400';
    return 'bg-red-100 border-red-400';
  };

  const getTypeIcon = (type: string) => {
    const found = layerTypes.find((l) => l.value === type);
    return found ? found.icon : MapPin;
  };

  const handleEventClick = (item: MapLayerItem) => {
    setSelectedItem(item);
    setShowDetailPanel(true);
  };

  const typeBarChartOption = useMemo(() => {
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: layerTypes.map((l) => l.label.replace('通知', '').replace('公告', '')),
        axisLabel: { fontSize: 11, color: '#64748b' },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 11, color: '#64748b' },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      series: [
        {
          type: 'bar',
          data: layerTypes.map((l) => ({
            value: mapData.filter((item) => item.type === l.value).length,
            itemStyle: { color: l.chartColor, borderRadius: [4, 4, 0, 0] },
          })),
          barWidth: '45%',
        },
      ],
    };
  }, [mapData]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="GIS公共服务地图"
        description="实时查看停水、停电、停气、施工等公共服务信息"
      />

      <div className="bg-white rounded-xl shadow-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-primary-600" />
            图层开关：
          </span>
          {layerTypes.map((layer) => {
            const Icon = layer.icon;
            const isActive = activeLayers.includes(layer.value);
            const count = layerStats.find((l) => l.value === layer.value)?.count || 0;
            return (
              <button
                key={layer.value}
                onClick={() => toggleLayer(layer.value)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border',
                  isActive
                    ? cn(layer.activeColor, 'border-transparent shadow-sm')
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <Icon className="w-4 h-4" />
                {layer.label}
                <span className={cn(
                  'px-1.5 py-0.5 text-xs rounded-full font-semibold',
                  isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                )}>
                  {count}
                </span>
              </button>
            );
          })}
          <button
            onClick={toggleAllLayers}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ml-auto',
              activeLayers.length === layerTypes.length
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            )}
          >
            <ListFilter className="w-4 h-4" />
            {activeLayers.length === layerTypes.length ? '全部关闭' : '全部显示'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="进行中事件"
          value={overallStats.activeCount}
          color="blue"
          icon={<AlertTriangle className="w-5 h-5" />}
          change={12}
          compact
        />
        <StatCard
          title="今日新增"
          value={overallStats.todayNew}
          color="yellow"
          icon={<TrendingUp className="w-5 h-5" />}
          change={8}
          compact
        />
        <StatCard
          title="已处置数量"
          value={overallStats.resolved}
          color="green"
          icon={<CheckCircle2 className="w-5 h-5" />}
          change={15}
          compact
        />
        <StatCard
          title="平均处置时长(h)"
          value={overallStats.avgDuration}
          color="cyan"
          icon={<Timer className="w-5 h-5" />}
          change={-5}
          compact
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl shadow-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-slate-900">图层控制</h3>
            </div>
            <div className="space-y-2">
              {layerTypes.map((layer) => {
                const Icon = layer.icon;
                const isActive = activeLayers.includes(layer.value);
                const stat = layerStats.find((l) => l.value === layer.value);
                return (
                  <button
                    key={layer.value}
                    onClick={() => toggleLayer(layer.value)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                      isActive
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-500 hover:bg-slate-50'
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', layer.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium flex-1 text-left">{layer.label}</span>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {stat?.count || 0}
                    </span>
                    <div
                      className={cn(
                        'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                        isActive
                          ? 'bg-primary-500 border-primary-500'
                          : 'border-slate-300'
                      )}
                    >
                      {isActive && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-slate-900">事件类型分布</h3>
            </div>
            <ReactECharts option={typeBarChartOption} style={{ height: 180 }} />
          </div>

          <div className="bg-white rounded-xl shadow-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-slate-900">事件列表</h3>
              </div>
              <span className="text-xs text-slate-500">{filteredData.length} 条</span>
            </div>
            <div className="mb-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-500">按类型筛选</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setEventTypeFilter('all')}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-md font-medium transition-colors',
                    eventTypeFilter === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  全部
                </button>
                {layerTypes.map((layer) => {
                  const Icon = layer.icon;
                  return (
                    <button
                      key={layer.value}
                      onClick={() => setEventTypeFilter(layer.value)}
                      className={cn(
                        'flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition-colors',
                        eventTypeFilter === layer.value
                          ? layer.activeColor
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      {layer.label.replace('通知', '').replace('公告', '')}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {filteredData.map((item) => {
                const Icon = getTypeIcon(item.type);
                const typeInfo = layerTypes.find((l) => l.value === item.type);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleEventClick(item)}
                    className={cn(
                      'p-3 rounded-lg cursor-pointer transition-all border',
                      selectedItem?.id === item.id
                        ? 'bg-primary-50 border-primary-200'
                        : 'bg-slate-50 border-transparent hover:bg-slate-100'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', typeInfo?.color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-slate-900 truncate">{item.name}</h4>
                          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', statusColors[item.status])} title={statusLabels[item.status]}></span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{item.district}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.startTime.slice(5, 10)}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {item.affectedHouseholds}户
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredData.length === 0 && (
                <div className="py-8 text-center text-sm text-slate-400">
                  暂无符合条件的事件
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="bg-white rounded-xl shadow-card overflow-hidden h-[640px] relative">
            <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-slate-200">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary-600" />
                徐州市行政区划图
              </p>
              <p className="text-xs text-slate-500 mt-0.5">实时公共服务事件分布</p>
            </div>

            <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-slate-200">
              <p className="text-xs font-medium text-slate-600 mb-1.5">事件密度图例</p>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-slate-100 border border-slate-200"></div>
                  <span className="text-slate-500">无</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
                  <span className="text-slate-500">低</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-400"></div>
                  <span className="text-slate-500">中</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-100 border border-red-400"></div>
                  <span className="text-slate-500">高</span>
                </div>
              </div>
            </div>

            <div className="w-full h-full p-8 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
              <div className="relative w-full h-full border-2 border-dashed border-blue-200/60 rounded-2xl bg-white/40 backdrop-blur-sm overflow-hidden">
                {xuzhouDistricts.map((district) => {
                  const eventCount = districtEventCount[district.name]?.total || 0;
                  const districtData = districtEventCount[district.name];
                  return (
                    <div
                      key={district.name}
                      onClick={() => {
                        const districtEvents = filteredData.filter((e) => e.district === district.name);
                        if (districtEvents.length > 0) {
                          handleEventClick(districtEvents[0]);
                        }
                      }}
                      className={cn(
                        'absolute rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 hover:shadow-md',
                        getDistrictColor(district.name)
                      )}
                      style={{
                        left: `${district.x}%`,
                        top: `${district.y}%`,
                        width: `${district.w}%`,
                        height: `${district.h}%`,
                      }}
                    >
                      <span className="text-sm font-bold text-slate-700">{district.name}</span>
                      {eventCount > 0 && (
                        <div className="mt-1 flex items-center gap-1">
                          <span className="text-xs font-semibold text-slate-600">{eventCount}件</span>
                          <div className="flex items-center gap-0.5">
                            {districtData?.water > 0 && <Droplets className="w-2.5 h-2.5 text-blue-500" />}
                            {districtData?.power > 0 && <Zap className="w-2.5 h-2.5 text-yellow-500" />}
                            {districtData?.gas > 0 && <Flame className="w-2.5 h-2.5 text-orange-500" />}
                            {districtData?.construction > 0 && <HardHat className="w-2.5 h-2.5 text-purple-500" />}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredData.map((item) => {
                  const districtPos = xuzhouDistricts.find((d) => d.name === item.district);
                  if (!districtPos) return null;
                  const typeInfo = layerTypes.find((l) => l.value === item.type);
                  const Icon = typeInfo?.icon || MapPin;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleEventClick(item)}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 z-20"
                      style={{
                        left: `${districtPos.x + districtPos.w / 2 + (Math.random() - 0.5) * districtPos.w * 0.5}%`,
                        top: `${districtPos.y + districtPos.h / 2 + (Math.random() - 0.5) * districtPos.h * 0.5}%`,
                      }}
                    >
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center shadow-lg animate-pulse',
                        typeInfo?.activeColor || 'bg-primary-600 text-white'
                      )}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {showDetailPanel && selectedItem ? (
            <div className="bg-white rounded-xl shadow-card overflow-hidden h-[640px] flex flex-col">
              <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-primary-50 to-blue-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center',
                      selectedItem.type === 'water' ? 'bg-blue-100 text-blue-600' :
                      selectedItem.type === 'power' ? 'bg-yellow-100 text-yellow-600' :
                      selectedItem.type === 'gas' ? 'bg-orange-100 text-orange-600' :
                      'bg-purple-100 text-purple-600'
                    )}>
                      {(() => {
                        const Icon = getTypeIcon(selectedItem.type);
                        return <Icon className="w-5 h-5" />;
                      })()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{selectedItem.name}</h3>
                      <span className={cn(
                        'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-0.5',
                        selectedItem.status === 'danger' ? 'bg-red-100 text-red-700' :
                        selectedItem.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                        selectedItem.status === 'resolved' ? 'bg-slate-100 text-slate-600' :
                        'bg-green-100 text-green-700'
                      )}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', statusColors[selectedItem.status])}></span>
                        {statusLabels[selectedItem.status]}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailPanel(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Building className="w-3 h-3" /> 事件类型
                    </p>
                    <p className="text-sm font-semibold text-slate-700 mt-1">
                      {layerTypes.find((l) => l.value === selectedItem.type)?.label}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> 影响区域
                    </p>
                    <p className="text-sm font-semibold text-slate-700 mt-1">{selectedItem.district}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Users className="w-3 h-3" /> 影响户数
                    </p>
                    <p className="text-sm font-semibold text-slate-700 mt-1">{selectedItem.affectedHouseholds} 户</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> 影响范围
                    </p>
                    <p className="text-sm font-semibold text-slate-700 mt-1">{selectedItem.affectedArea} km²</p>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs font-medium text-blue-700 mb-1">事发地址</p>
                  <p className="text-sm text-blue-800">{selectedItem.address}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 开始时间
                    </p>
                    <p className="text-sm font-semibold text-slate-700 mt-1">{selectedItem.startTime.slice(5, 16)}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 结束时间
                    </p>
                    <p className="text-sm font-semibold text-slate-700 mt-1">{selectedItem.endTime.slice(5, 16)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Building className="w-3 h-3" /> 责任单位
                    </p>
                    <p className="text-sm font-semibold text-slate-700 mt-1">{selectedItem.responsibleUnit}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <User className="w-3 h-3" /> 联系人
                    </p>
                    <p className="text-sm font-semibold text-slate-700 mt-1">{selectedItem.contactPerson}</p>
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> 联系电话
                  </p>
                  <p className="text-sm font-semibold text-green-800">{selectedItem.contactPhone}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">事件描述</p>
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg">
                    {selectedItem.description}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> 处置措施时间线
                  </p>
                  <div className="relative pl-4">
                    <div className="absolute left-1.5 top-1 bottom-1 w-0.5 bg-slate-200"></div>
                    <div className="space-y-4">
                      {selectedItem.disposalTimeline.map((tlItem, index) => (
                        <div key={tlItem.id} className="relative">
                          <div className={cn(
                            'absolute -left-2.5 top-1 w-4 h-4 rounded-full border-2',
                            index === selectedItem.disposalTimeline.length - 1
                              ? 'bg-primary-500 border-primary-500'
                              : 'bg-white border-slate-300'
                          )}>
                            {index === selectedItem.disposalTimeline.length - 1 && (
                              <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-30"></div>
                            )}
                          </div>
                          <div className="pl-3 pb-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-800">{tlItem.action}</span>
                              <span className="text-xs text-slate-400">{tlItem.time.slice(5, 16)}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {tlItem.operator} · {tlItem.remark}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-card h-[640px] flex items-center justify-center">
              <div className="text-center px-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-600">事件详情面板</h3>
                <p className="text-sm text-slate-400 mt-2">
                  点击左侧事件列表或地图上的标记查看详细信息
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
