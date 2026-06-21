import { useState, useMemo } from 'react';
import {
  Home,
  FileCheck,
  Users,
  Clock,
  AlertTriangle,
  DollarSign,
  Award,
  FileText,
  Radio,
} from 'lucide-react';
import { Tabs, Radio as AntRadio } from 'antd';
import type { TabsProps } from 'antd';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import dayjs from 'dayjs';
import { useAppStore } from '@/store';
import DataCard from '@/components/common/DataCard';

/** 时间筛选类型 */
type TimeRange = 'today' | 'week' | 'month' | 'quarter';

/** 热力图层类型 */
type HeatmapLayer = 'property' | 'contract' | 'rent';

/** 主题色常量 */
const COLORS = {
  brand: '#0F4C81',
  success: '#00A86B',
  warning: '#FF6B35',
  danger: '#E63946',
  gold: '#D4A574',
};

/** SLA 优先级标准（分钟） */
const SLA_STANDARDS = {
  urgent: 15,
  high: 30,
  medium: 60,
  low: 120,
};

/** 生成 sparkline 模拟数据 */
function generateSparkline(base: number, variance: number, len: number = 12): number[] {
  const arr: number[] = [];
  for (let i = 0; i < len; i++) {
    arr.push(Math.round(base + (Math.random() - 0.5) * variance * 2));
  }
  return arr;
}

export default function Dashboard() {
  /** 时间范围筛选状态 */
  const [timeRange, setTimeRange] = useState<TimeRange>('today');

  /** 热力图层切换状态 */
  const [heatmapLayer, setHeatmapLayer] = useState<HeatmapLayer>('property');

  /** 生成椭圆环线坐标（模拟上海环形路） */
  function generateEllipseCoords(cx: number, cy: number, rx: number, ry: number, n = 80): [number, number][] {
    const arr: [number, number][] = [];
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * Math.PI * 2;
      arr.push([
        Number((cx + Math.cos(t) * rx + Math.sin(t * 2) * rx * 0.05).toFixed(5)),
        Number((cy + Math.sin(t) * ry + Math.cos(t * 3) * ry * 0.04).toFixed(5)),
      ]);
    }
    return arr;
  }

  /** 从全局 store 取数 */
  const {
    dashboardMetrics,
    heatmapPoints,
    landlordApplications,
    properties,
    contracts,
    workOrders,
    auditLogs,
    creditProfiles,
  } = useAppStore();

  /** ========== 指标卡片数据计算 ========== */

  /** 在租房源数 */
  const activeProperties = useMemo(() => {
    return properties.filter((p) => p.status === 'rented' || p.status === 'on_shelf').length;
  }, [properties]);

  /** 待审核申请数 */
  const pendingApplications = useMemo(() => {
    return landlordApplications.filter(
      (a) => a.status === 'pending' || a.status === 'verifying'
    ).length;
  }, [landlordApplications]);

  /** 签约转化率（通过数 / 申请总数） */
  const conversionRate = useMemo(() => {
    if (landlordApplications.length === 0) return 0;
    const approved = landlordApplications.filter((a) => a.status === 'approved').length;
    return Math.round((approved / landlordApplications.length) * 1000) / 10;
  }, [landlordApplications]);

  /** 合同履约率 */
  const fulfillmentRate = dashboardMetrics.contractPerformance.fulfillmentRate;

  /** 工单平均响应时长（分钟） */
  const avgResponseMinutes = dashboardMetrics.workOrderService.avgResponseMinutes;

  /** 客诉率：投诉工单数 / 总工单数 */
  const complaintRate = useMemo(() => {
    if (workOrders.length === 0) return 0;
    const complaints = workOrders.filter((w) => w.type === 'complaint' || w.type === 'dispute')
      .length;
    return Math.round((complaints / workOrders.length) * 1000) / 10;
  }, [workOrders]);

  /** 累计营收：累计租金总额 */
  const totalRevenue = dashboardMetrics.totals.totalRentTurnover;

  /** 优质信用租客数：信用等级 excellent/good 的租客档案数 */
  const premiumTenants = useMemo(() => {
    return creditProfiles.filter(
      (c) => c.userType === 'tenant' && (c.level === 'excellent' || c.level === 'good')
    ).length;
  }, [creditProfiles]);

  /** ========== 图表配置 ========== */

  /** 上海地图热力散点图配置 */
  const heatmapOption: EChartsOption = useMemo(() => {
    const filteredPoints = heatmapPoints.filter((p) => {
      if (heatmapLayer === 'property') return p.category === 'property' || p.type === 'property';
      if (heatmapLayer === 'contract') return p.category === 'contract' || p.type === 'contract';
      return p.category === 'rent' || p.type === 'rent' || p.category === 'price' || p.type === 'price_index';
    });

    const scatterData = filteredPoints.map((p) => [
      p.lng,
      p.lat,
      p.weight,
      p.count || 1,
      p.name,
      p.address,
    ]);

    const pulseData = filteredPoints.slice(0, 20).map((p) => ({
      name: p.name || '房源',
      value: [p.lng, p.lat, (p.count || 1) * 3 + 8],
    }));

    return {
      backgroundColor: '#FAFBFC',
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const data = params.data;
          if (data && data.value) {
            return `<b>${data.name || '房源点位'}</b><br/>数量: ${data.value[2] || 1}`;
          }
          const d = Array.isArray(data) ? data : [];
          return `<b>${d[4] || '区域'}</b><br/>地址: ${d[5] || '-'}<br/>权重: ${d[2] || 0}<br/>数量: ${d[3] || 1}`;
        },
      },
      geo: {
        map: 'china',
        roam: true,
        center: [121.4737, 31.2304],
        zoom: 55,
        show: false,
      },
      grid: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
      xAxis: {
        type: 'value',
        min: 120.8,
        max: 122.1,
        show: false,
      },
      yAxis: {
        type: 'value',
        min: 30.7,
        max: 31.9,
        show: false,
      },
      visualMap: {
        show: true,
        orient: 'vertical',
        right: 16,
        bottom: 16,
        min: 0,
        max: heatmapLayer === 'property' ? 100 : heatmapLayer === 'contract' ? 80 : 60,
        text: [
          heatmapLayer === 'property' ? '密' : heatmapLayer === 'contract' ? '热' : '高',
          heatmapLayer === 'property' ? '疏' : heatmapLayer === 'contract' ? '冷' : '低',
        ],
        textStyle: {
          color: '#4A4F5A',
          fontSize: 12,
        },
        inRange: {
          color:
            heatmapLayer === 'property'
              ? ['#E8F0F8', '#6FA5D5', '#0F4C81']
              : heatmapLayer === 'contract'
              ? ['#E6F7EF', '#69CB9F', '#00A86B']
              : ['#F9F1E8', '#DBAB75', '#D4A574'],
        },
      },
      series: [
        {
          name: heatmapLayer === 'property' ? '房源密度' : heatmapLayer === 'contract' ? '成交密度' : '租金梯度',
          type: 'heatmap',
          coordinateSystem: 'cartesian2d',
          data: filteredPoints.map((p) => [
            p.lng,
            p.lat,
            heatmapLayer === 'property'
              ? (p.count || 1) * 10
              : heatmapLayer === 'contract'
              ? (p.weight || 50) * 0.8 + (p.count || 0) * 5
              : Math.abs((p.value || 80) - 60) * 1.5,
          ]),
          pointSize: 28,
          blurSize: 42,
          minOpacity: 0.18,
          maxOpacity: 0.92,
          gradientColors: [
            [0, heatmapLayer === 'rent' ? 'rgba(212, 165, 116, 0.05)' : heatmapLayer === 'contract' ? 'rgba(0, 168, 107, 0.05)' : 'rgba(15, 76, 129, 0.05)'],
            [0.25, heatmapLayer === 'rent' ? 'rgba(255, 107, 53, 0.35)' : heatmapLayer === 'contract' ? 'rgba(105, 203, 159, 0.45)' : 'rgba(111, 165, 213, 0.45)'],
            [0.5, heatmapLayer === 'rent' ? 'rgba(230, 57, 70, 0.65)' : heatmapLayer === 'contract' ? 'rgba(0, 168, 107, 0.75)' : 'rgba(15, 76, 129, 0.75)'],
            [0.75, heatmapLayer === 'rent' ? 'rgba(212, 165, 116, 0.85)' : heatmapLayer === 'contract' ? 'rgba(15, 76, 129, 0.85)' : 'rgba(255, 107, 53, 0.85)'],
            [1, heatmapLayer === 'rent' ? 'rgba(230, 57, 70, 1)' : heatmapLayer === 'contract' ? 'rgba(15, 76, 129, 1)' : 'rgba(230, 57, 70, 1)'],
          ],
          z: 1,
        },
        {
          name: '上海主要环线',
          type: 'lines',
          coordinateSystem: 'cartesian2d',
          polyline: true,
          effect: { show: false },
          lineStyle: {
            color: '#BFC7D1',
            width: 2,
            opacity: 0.35,
            type: 'dashed',
          },
          silent: true,
          data: [
            { coords: generateEllipseCoords(121.4737, 31.2304, 0.032, 0.022) },
            { coords: generateEllipseCoords(121.4737, 31.2304, 0.062, 0.045) },
            { coords: generateEllipseCoords(121.4737, 31.2304, 0.095, 0.072) },
            { coords: [[120.92, 31.2304], [121.92, 31.2304]] },
            { coords: [[121.4737, 30.86], [121.4737, 31.62]] },
          ],
          z: 0,
        },
        {
          name: '热力分布',
          type: 'effectScatter',
          coordinateSystem: 'cartesian2d',
          data: scatterData as any,
          symbolSize: (val: number[]) => Math.max(4, Math.min(20, val[2] / 6)),
          rippleEffect: {
            brushType: 'stroke',
            scale: 3,
          },
          itemStyle: {
            color:
              heatmapLayer === 'property'
                ? COLORS.brand
                : heatmapLayer === 'contract'
                ? COLORS.success
                : COLORS.gold,
            opacity: 0.8,
          },
        },
        {
          name: '房源脉冲标记',
          type: 'effectScatter',
          coordinateSystem: 'cartesian2d',
          data: pulseData as any,
          symbolSize: (val: number[]) => val[2] as number,
          showEffectOn: 'render',
          rippleEffect: {
            period: 4,
            scale: 4,
            brushType: 'fill',
          },
          itemStyle: {
            color:
              heatmapLayer === 'property'
                ? COLORS.brand
                : heatmapLayer === 'contract'
                ? COLORS.success
                : COLORS.gold,
            shadowBlur: 10,
            shadowColor:
              heatmapLayer === 'property'
                ? COLORS.brand
                : heatmapLayer === 'contract'
                ? COLORS.success
                : COLORS.gold,
          },
          label: {
            show: true,
            formatter: (p: any) => p.name?.slice(0, 4) || '',
            position: 'top',
            color: '#4A4F5A',
            fontSize: 10,
            fontWeight: 600,
          },
          emphasis: {
            scale: true,
          },
          zlevel: 1,
        },
      ],
    };
  }, [heatmapPoints, heatmapLayer]);

  /** 合同履约率环形图配置 */
  const fulfillmentRingOption: EChartsOption = useMemo(() => {
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}% ({d}%)',
      },
      legend: {
        bottom: 0,
        left: 'center',
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          color: '#4A4F5A',
          fontSize: 12,
        },
      },
      title: {
        text: `${fulfillmentRate}%`,
        subtext: '履约率',
        left: 'center',
        top: '38%',
        textAlign: 'center',
        textStyle: {
          color: COLORS.brand,
          fontSize: 28,
          fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace',
        },
        subtextStyle: {
          color: '#6B7280',
          fontSize: 13,
          fontWeight: 400,
        },
      },
      series: [
        {
          name: '合同履约',
          type: 'pie',
          radius: ['55%', '75%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 3,
          },
          label: {
            show: false,
          },
          labelLine: {
            show: false,
          },
          data: [
            {
              value: fulfillmentRate,
              name: '正常履约',
              itemStyle: { color: COLORS.success },
            },
            {
              value: 100 - fulfillmentRate,
              name: '逾期/违约',
              itemStyle: { color: COLORS.warning },
            },
          ],
        },
      ],
    };
  }, [fulfillmentRate]);

  /** 房源类型堆叠柱状图（按周统计） */
  const propertyStackOption: EChartsOption = useMemo(() => {
    const weeks = ['第1周', '第2周', '第3周', '第4周'];
    const bedroomsCount = { 1: [0, 0, 0, 0], 2: [0, 0, 0, 0], 3: [0, 0, 0, 0], '4+': [0, 0, 0, 0] };

    properties.forEach((p) => {
      const weekIdx = Math.floor(Math.random() * 4);
      if (p.bedrooms <= 1) bedroomsCount[1][weekIdx]++;
      else if (p.bedrooms === 2) bedroomsCount[2][weekIdx]++;
      else if (p.bedrooms === 3) bedroomsCount[3][weekIdx]++;
      else bedroomsCount['4+'][weekIdx]++;
    });

    Object.keys(bedroomsCount).forEach((k) => {
      bedroomsCount[k as keyof typeof bedroomsCount] = bedroomsCount[
        k as keyof typeof bedroomsCount
      ].map((v) => v + Math.floor(Math.random() * 15 + 5));
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        top: 0,
        right: 0,
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          color: '#4A4F5A',
          fontSize: 12,
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: weeks,
        axisLabel: {
          color: '#6B7280',
          fontSize: 12,
        },
        axisLine: {
          lineStyle: {
            color: '#EBEBEE',
          },
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#6B7280',
          fontSize: 12,
        },
        splitLine: {
          lineStyle: {
            color: '#EBEBEE',
            type: 'dashed',
          },
        },
      },
      series: [
        {
          name: '1居室',
          type: 'bar',
          stack: 'total',
          emphasis: { focus: 'series' },
          data: bedroomsCount[1],
          itemStyle: { color: COLORS.brand },
          barWidth: 28,
        },
        {
          name: '2居室',
          type: 'bar',
          stack: 'total',
          emphasis: { focus: 'series' },
          data: bedroomsCount[2],
          itemStyle: { color: COLORS.success },
        },
        {
          name: '3居室',
          type: 'bar',
          stack: 'total',
          emphasis: { focus: 'series' },
          data: bedroomsCount[3],
          itemStyle: { color: COLORS.gold },
        },
        {
          name: '4+居',
          type: 'bar',
          stack: 'total',
          emphasis: { focus: 'series' },
          data: bedroomsCount['4+'],
          itemStyle: { color: COLORS.warning },
        },
      ],
    };
  }, [properties]);

  /** 维修响应 SLA 甘特图配置 */
  const slaGanttOption: EChartsOption = useMemo(() => {
    const urgencies = ['紧急', '高', '中', '低'];
    const urgencyKeys: Array<'urgent' | 'high' | 'medium' | 'low'> = ['urgent', 'high', 'medium', 'low'];
    const colorMap = [COLORS.danger, COLORS.warning, COLORS.gold, COLORS.success];

    const actualTimes = urgencyKeys.map((k) => {
      const filtered = workOrders.filter((w) => w.urgency === k);
      if (filtered.length === 0) return SLA_STANDARDS[k] + Math.floor(Math.random() * 20 - 10);
      const avg = filtered.reduce((sum, w) => sum + (w.firstResponseTime || w.slaResponseTime), 0) / filtered.length;
      return Math.round(avg);
    });

    const standardTimes = urgencyKeys.map((k) => SLA_STANDARDS[k]);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params: any[]) => {
          const idx = params[0].dataIndex;
          return `<b>${urgencies[idx]}优先级</b><br/>
            标准SLA: ${standardTimes[idx]} 分钟<br/>
            实际响应: ${actualTimes[idx]} 分钟<br/>
            ${actualTimes[idx] <= standardTimes[idx] ? '<span style="color:#00A86B">✓ 达标</span>' : '<span style="color:#E63946">✗ 未达标</span>'}`;
        },
      },
      legend: {
        top: 0,
        right: 0,
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          color: '#4A4F5A',
          fontSize: 12,
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        name: '响应时长(分钟)',
        nameTextStyle: {
          color: '#6B7280',
          fontSize: 12,
        },
        axisLabel: {
          color: '#6B7280',
          fontSize: 12,
        },
        splitLine: {
          lineStyle: {
            color: '#EBEBEE',
            type: 'dashed',
          },
        },
      },
      yAxis: {
        type: 'category',
        data: urgencies,
        axisLabel: {
          color: '#4A4F5A',
          fontSize: 12,
          fontWeight: 500,
        },
        axisLine: {
          lineStyle: {
            color: '#EBEBEE',
          },
        },
      },
      series: [
        {
          name: '标准SLA',
          type: 'bar',
          data: standardTimes.map((v, i) => ({
            value: v,
            itemStyle: {
              color: colorMap[i] + '30',
              borderColor: colorMap[i],
              borderWidth: 1,
              borderType: 'dashed',
              borderRadius: [4, 4, 4, 4],
            },
          })),
          barGap: '-100%',
          barWidth: 24,
          z: 1,
        },
        {
          name: '实际响应',
          type: 'bar',
          data: actualTimes.map((v, i) => ({
            value: v,
            itemStyle: {
              color: colorMap[i],
              borderRadius: [4, 4, 4, 4],
            },
          })),
          barWidth: 16,
          label: {
            show: true,
            position: 'right',
            formatter: '{c}min',
            color: '#4A4F5A',
            fontSize: 11,
          },
          z: 2,
        },
      ],
    };
  }, [workOrders]);

  /** ========== 日志处理 ========== */

  /** 获取审计日志中的字段（兼容新旧结构） */
  const getLogField = (log: any, field: string) => {
    const oldFieldMap: Record<string, string[]> = {
      time: ['operateTime', 'timestamp'],
      user: ['operatorName'],
      desc: ['actionDesc', 'description'],
      action: ['actionType', 'action'],
      module: ['module'],
    };
    const fields = oldFieldMap[field] || [field];
    for (const f of fields) {
      if (log[f] !== undefined && log[f] !== null && log[f] !== '') {
        return log[f];
      }
    }
    return '-';
  };

  /** 格式化时间为相对时间 */
  const formatRelativeTime = (timeStr: string) => {
    const diff = dayjs().diff(dayjs(timeStr), 'minute');
    if (diff < 1) return '刚刚';
    if (diff < 60) return `${diff}分钟前`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  /** 操作类型对应图标颜色 */
  const getActionColor = (action: string) => {
    const colorMap: Record<string, string> = {
      create: COLORS.success,
      update: COLORS.brand,
      approve: COLORS.success,
      reject: COLORS.danger,
      delete: COLORS.danger,
      sign: COLORS.gold,
      assign: COLORS.warning,
      settle: COLORS.brand,
      login: COLORS.brand,
      export: COLORS.gold,
    };
    return colorMap[action] || COLORS.brand;
  };

  /** 最近10条审计日志 */
  const recentLogs = useMemo(() => {
    return [...auditLogs]
      .sort((a: any, b: any) => {
        const ta = a.operateTime || a.timestamp || '';
        const tb = b.operateTime || b.timestamp || '';
        return tb.localeCompare(ta);
      })
      .slice(0, 10);
  }, [auditLogs]);

  /** ========== 顶部时间筛选器 ========== */
  const timeTabs: TabsProps['items'] = [
    { key: 'today', label: '今日' },
    { key: 'week', label: '本周' },
    { key: 'month', label: '本月' },
    { key: 'quarter', label: '本季' },
  ];

  return (
    <div className="animate-fade-in-up space-y-6 p-6 bg-ink-50 min-h-screen">
      {/* 1. 顶部标题栏 */}
      <div className="card-standard flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-800 font-serif">数据看板中心</h1>
            <p className="text-xs text-ink-500 mt-0.5">
              {dayjs().format('YYYY年MM月DD日 dddd')} · 实时运营数据概览
            </p>
          </div>
        </div>
        <Tabs
          activeKey={timeRange}
          onChange={(k) => setTimeRange(k as TimeRange)}
          items={timeTabs}
          size="middle"
          className="dashboard-time-tabs"
        />
      </div>

      {/* 2. 指标网格区（8张卡片，4列2行） */}
      <div className="grid grid-cols-4 gap-5">
        <DataCard
          title="在租房源数"
          value={activeProperties}
          unit="套"
          prefix={<Home className="h-4 w-4" />}
          trend={5.2}
          comparedTo="week"
          accentColor={COLORS.brand}
          sparkline={generateSparkline(activeProperties, 80)}
        />
        <DataCard
          title="待审核申请"
          value={pendingApplications}
          unit="单"
          prefix={<FileText className="h-4 w-4" />}
          trend={-3.1}
          comparedTo="week"
          accentColor={COLORS.warning}
          sparkline={generateSparkline(pendingApplications, 20)}
        />
        <DataCard
          title="签约转化率"
          value={conversionRate}
          unit="%"
          prefix={<FileCheck className="h-4 w-4" />}
          trend={2.4}
          comparedTo="month"
          accentColor={COLORS.success}
          sparkline={generateSparkline(conversionRate, 8)}
        />
        <DataCard
          title="合同履约率"
          value={fulfillmentRate}
          unit="%"
          prefix={<Award className="h-4 w-4" />}
          trend={0.8}
          comparedTo="month"
          accentColor={COLORS.gold}
          sparkline={generateSparkline(fulfillmentRate, 2)}
        />
        <DataCard
          title="平均响应时长"
          value={avgResponseMinutes}
          unit="分钟"
          prefix={<Clock className="h-4 w-4" />}
          trend={-12.5}
          comparedTo="week"
          accentColor={COLORS.brand}
          sparkline={generateSparkline(avgResponseMinutes, 10)}
        />
        <DataCard
          title="客诉率"
          value={complaintRate}
          unit="%"
          prefix={<AlertTriangle className="h-4 w-4" />}
          trend={-1.2}
          comparedTo="week"
          accentColor={COLORS.danger}
          sparkline={generateSparkline(complaintRate, 1.5)}
        />
        <DataCard
          title="累计营收"
          value={(totalRevenue / 10000).toFixed(1)}
          unit="万元"
          prefix={<DollarSign className="h-4 w-4" />}
          trend={8.6}
          comparedTo="quarter"
          accentColor={COLORS.success}
          sparkline={generateSparkline(totalRevenue / 10000, 300)}
        />
        <DataCard
          title="优质信用租客数"
          value={premiumTenants}
          unit="人"
          prefix={<Users className="h-4 w-4" />}
          trend={6.3}
          comparedTo="month"
          accentColor={COLORS.gold}
          sparkline={generateSparkline(premiumTenants, 50)}
        />
      </div>

      {/* 3. 下方左右两栏（7:5） */}
      <div className="grid grid-cols-12 gap-5">
        {/* 左栏：地图热力图卡片（7列） */}
        <div className="col-span-7 card-standard flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title !mb-0">上海区域热力分布</h3>
            <AntRadio.Group
              value={heatmapLayer}
              onChange={(e) => setHeatmapLayer(e.target.value)}
              size="small"
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: '房源密度', value: 'property' },
                { label: '成交密度', value: 'contract' },
                { label: '租金梯度', value: 'rent' },
              ]}
            />
          </div>
          <div className="relative flex-1" style={{ minHeight: 460 }}>
            <ReactECharts
              option={heatmapOption}
              style={{ width: '100%', height: '100%', minHeight: 460 }}
              notMerge={true}
              lazyUpdate={false}
            />
            <div className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-ink-600 shadow-sm border border-ink-100">
              <div className="font-medium text-ink-700 mb-1">上海市</div>
              <div>中心经度: 121.4737 / 纬度: 31.2304</div>
            </div>
          </div>
        </div>

        {/* 右栏：图表卡片组（5列） */}
        <div className="col-span-5 flex flex-col gap-5">
          {/* 上方：合同履约率环形图 */}
          <div className="card-standard">
            <h3 className="section-title">合同履约率</h3>
            <div style={{ height: 240 }}>
              <ReactECharts
                option={fulfillmentRingOption}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>

          {/* 下方：房源类型堆叠柱状图 */}
          <div className="card-standard">
            <h3 className="section-title">房源类型周分布</h3>
            <div style={{ height: 240 }}>
              <ReactECharts
                option={propertyStackOption}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. 底部横向卡片 */}
      <div className="grid grid-cols-12 gap-5">
        {/* 维修响应SLA甘特图 */}
        <div className="col-span-7 card-standard">
          <h3 className="section-title">维修响应 SLA 分析</h3>
          <div style={{ height: 280 }}>
            <ReactECharts
              option={slaGanttOption}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>

        {/* 实时动态流 */}
        <div className="col-span-5 card-standard flex flex-col">
          <h3 className="section-title">实时操作动态</h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1" style={{ maxHeight: 280 }}>
            {recentLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-ink-400 text-sm">
                暂无操作日志
              </div>
            ) : (
              recentLogs.map((log: any) => {
                const logTime = getLogField(log, 'time');
                const logUser = getLogField(log, 'user');
                const logDesc = getLogField(log, 'desc');
                const logAction = getLogField(log, 'action');
                const logModule = getLogField(log, 'module');
                const actionColor = getActionColor(logAction);

                return (
                  <div
                    key={log.id || log.traceId || Math.random()}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-ink-50 transition-colors border border-transparent hover:border-ink-100"
                  >
                    <div
                      className="flex-shrink-0 mt-0.5 h-2 w-2 rounded-full animate-breathe"
                      style={{ backgroundColor: actionColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-sm font-medium text-ink-800">
                          {logUser}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${actionColor}12`,
                            color: actionColor,
                          }}
                        >
                          {logModule}
                        </span>
                      </div>
                      <p className="text-sm text-ink-600 mt-1 line-clamp-2">
                        {logDesc}
                      </p>
                      <p className="text-xs text-ink-400 mt-1">
                        {formatRelativeTime(logTime)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 合同统计信息条（辅助展示） */}
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 card-standard">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xs text-ink-500 mb-1">合同总数</div>
              <div className="text-2xl font-bold text-brand-600 font-mono">
                {contracts.length.toLocaleString('zh-CN')}
              </div>
            </div>
            <div>
              <div className="text-xs text-ink-500 mb-1">生效中</div>
              <div className="text-2xl font-bold text-success-600 font-mono">
                {contracts.filter((c) => c.status === 'active').length.toLocaleString('zh-CN')}
              </div>
            </div>
            <div>
              <div className="text-xs text-ink-500 mb-1">逾期合同</div>
              <div className="text-2xl font-bold text-danger-600 font-mono">
                {dashboardMetrics.contractPerformance.overdueContracts.toLocaleString('zh-CN')}
              </div>
            </div>
            <div>
              <div className="text-xs text-ink-500 mb-1">租金收缴率</div>
              <div className="text-2xl font-bold text-gold-600 font-mono">
                {dashboardMetrics.contractPerformance.rentCollectionRate}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
