import { useState, useMemo } from 'react';
import {
  Layout,
  Input,
  Tabs,
  Slider,
  Checkbox,
  Switch,
  Button,
  Card,
  Row,
  Col,
  Tag,
  Space,
  Progress,
  message,
  Divider,
} from 'antd';
import {
  EnvironmentOutlined,
  CompassOutlined,
  BankOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  CarOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Footprints, Bike, Train } from 'lucide-react';
import type { TabsProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import random from 'lodash-es/random';
import { useAppStore } from '@/store';
import type { Property, VerifyState } from '@/types';
import ProgressRing from '@/components/common/ProgressRing';
import { cn } from '@/lib/utils';

const { Content, Sider } = Layout;

/** 交通方式 */
type TransportMode = 'walk' | 'bike' | 'metro' | 'drive';

/** 房型选项 */
const ROOM_OPTIONS = [
  { label: '一居', value: 1 },
  { label: '两居', value: 2 },
  { label: '三居', value: 3 },
  { label: '四居+', value: 4 },
];

/** 交通方式 Tabs */
const TRANSPORT_TABS: TabsProps['items'] = [
  { key: 'walk', label: <span className="px-1"><Footprints className="mr-1 inline h-4 w-4" />步行</span> },
  { key: 'bike', label: <span className="px-1"><Bike className="mr-1 inline h-4 w-4" />骑行</span> },
  { key: 'metro', label: <span className="px-1"><Train className="mr-1 inline h-4 w-4" />地铁</span> },
  { key: 'drive', label: <span className="px-1"><CarOutlined className="mr-1" />驾车</span> },
];

/** 三态核验类型 */
type TriVerifyType = 'video' | 'vr' | 'onsite';

/** 三态核验状态 */
interface TriVerifyStatus {
  video: VerifyState;
  vr: VerifyState;
  onsite: VerifyState;
}

/** 生成三态核验状态 */
function generateTriVerify(property: Property): TriVerifyStatus {
  const states: VerifyState[] = ['verified', 'verified', 'verifying', 'unverified', 'verification_failed'];
  const seed = property.id.charCodeAt(0) + property.id.charCodeAt(property.id.length - 1);
  return {
    video: states[seed % 5],
    vr: states[(seed + 1) % 5],
    onsite: states[(seed + 2) % 5],
  };
}

/** 推荐房源（带通勤得分） */
interface RecommendedProperty extends Property {
  commuteMinutes: number;
  commuteScore: number;
  transportMode: TransportMode;
}

/** 工作地坐标（人民广场） */
const WORK_LOCATION = { lat: 31.2304, lng: 121.4737, name: '人民广场' };

/** 生成等值线圈（椭圆多边形） */
function generateIsolinePoints(centerLat: number, centerLng: number, radiusKm: number, points: number = 64) {
  const result: [number, number][] = [];
  const kmPerDegLat = 111;
  const kmPerDegLng = 111 * Math.cos((centerLat * Math.PI) / 180);
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = radiusKm * (0.85 + Math.sin(angle * 3) * 0.1 + Math.cos(angle * 5) * 0.05);
    const lat = centerLat + (r * Math.cos(angle)) / kmPerDegLat;
    const lng = centerLng + (r * Math.sin(angle)) / kmPerDegLng;
    result.push([Number(lng.toFixed(5)), Number(lat.toFixed(5))]);
  }
  return result;
}

export default function PropertySearch() {
  const navigate = useNavigate();
  const { properties } = useAppStore();

  /** 筛选条件 */
  const [workAddress, setWorkAddress] = useState<string>(WORK_LOCATION.name);
  const [transportMode, setTransportMode] = useState<TransportMode>('bike');
  const [maxCommuteTime, setMaxCommuteTime] = useState<number>(30);
  const [rentRange, setRentRange] = useState<[number, number]>([3000, 12000]);
  const [selectedRooms, setSelectedRooms] = useState<number[]>([]);
  const [mustHaveVideo, setMustHaveVideo] = useState<boolean>(false);
  const [mustHaveVR, setMustHaveVR] = useState<boolean>(false);
  const [mustHaveOnsite, setMustHaveOnsite] = useState<boolean>(false);
  const [minCreditScore, setMinCreditScore] = useState<number>(600);

  /** 生成推荐房源列表 */
  const recommendedProperties = useMemo<RecommendedProperty[]>(() => {
    const filtered = properties.filter(p => {
      if (p.status !== 'on_shelf') return false;
      if (p.monthlyRent < rentRange[0] || p.monthlyRent > rentRange[1]) return false;
      if (selectedRooms.length > 0) {
        const maxR = Math.max(...selectedRooms);
        if (maxR === 4) {
          if (p.bedrooms < 4 && !selectedRooms.includes(p.bedrooms)) return false;
        } else if (!selectedRooms.includes(p.bedrooms)) return false;
      }
      const tri = generateTriVerify(p);
      if (mustHaveVideo && tri.video !== 'verified') return false;
      if (mustHaveVR && tri.vr !== 'verified') return false;
      if (mustHaveOnsite && tri.onsite !== 'verified') return false;
      return true;
    });

    /** 为每套房源生成模拟通勤数据 */
    const speedMap: Record<TransportMode, number> = {
      walk: 5, bike: 15, metro: 30, drive: 25,
    };
    const baseSpeed = speedMap[transportMode];

    const result = filtered.map(p => {
      /** 计算与工作地的"距离分数"（模拟） */
      const distFactor = Math.abs(p.latitude - WORK_LOCATION.lat) + Math.abs(p.longitude - WORK_LOCATION.lng);
      const baseMinutes = Math.round(distFactor * 800 + random(3, 10));
      const commuteMinutes = Math.max(3, Math.round(baseMinutes * (5 / baseSpeed) + random(-2, 5)));

      /** 通勤综合得分（满分100） */
      let commuteScore = Math.max(0, 100 - (commuteMinutes / maxCommuteTime) * 60);
      /** 真实性评分加成 */
      const tri = generateTriVerify(p);
      const verifiedCount = [tri.video, tri.vr, tri.onsite].filter(s => s === 'verified').length;
      commuteScore += verifiedCount * 5;
      /** 租金性价比加成 */
      const avgRent = (rentRange[0] + rentRange[1]) / 2;
      if (p.monthlyRent < avgRent) commuteScore += 8;
      commuteScore = Math.round(Math.min(100, commuteScore + random(-3, 3)));

      return {
        ...p,
        commuteMinutes,
        commuteScore,
        transportMode,
      } as RecommendedProperty;
    });

    return result
      .filter(p => p.commuteMinutes <= maxCommuteTime + 10)
      .sort((a, b) => b.commuteScore - a.commuteScore)
      .slice(0, 12);
  }, [properties, rentRange, selectedRooms, transportMode, maxCommuteTime, mustHaveVideo, mustHaveVR, mustHaveOnsite]);

  /** 地图热力图数据 */
  const heatmapData = useMemo(() => {
    const points: [number, number, number][] = [];
    for (let i = 0; i < 120; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.pow(Math.random(), 0.6) * 0.06;
      const lng = WORK_LOCATION.lng + Math.cos(angle) * dist * (1.5 + Math.random() * 0.3);
      const lat = WORK_LOCATION.lat + Math.sin(angle) * dist * (1.2 + Math.random() * 0.3);
      const weight = Math.round((1 - dist / 0.06) * 80 + random(10, 30));
      points.push([Number(lng.toFixed(5)), Number(lat.toFixed(5)), weight]);
    }
    return points;
  }, []);

  /** 房源散点数据（地图上） */
  const propertyScatterData = useMemo(() => {
    return recommendedProperties.slice(0, 15).map(p => ({
      name: p.communityName,
      value: [p.longitude, p.latitude, p.commuteScore],
      property: p,
    }));
  }, [recommendedProperties]);

  /** 骑行路径线（模拟） */
  const bikePathLines = useMemo(() => {
    const lines: { coords: [[number, number], [number, number]]; score: number }[] = [];
    recommendedProperties.slice(0, 8).forEach(p => {
      lines.push({
        coords: [
          [WORK_LOCATION.lng, WORK_LOCATION.lat],
          [p.longitude, p.latitude],
        ],
        score: p.commuteScore,
      });
    });
    return lines;
  }, [recommendedProperties]);

  /** 等值线圈数据 */
  const isolineData = useMemo(() => ([
    {
      time: 10,
      color: 'rgba(0, 168, 107, 0.15)',
      borderColor: 'rgba(0, 168, 107, 0.6)',
      points: generateIsolinePoints(WORK_LOCATION.lat, WORK_LOCATION.lng, transportMode === 'walk' ? 0.8 : transportMode === 'bike' ? 2.5 : transportMode === 'metro' ? 5 : 4.2),
    },
    {
      time: 15,
      color: 'rgba(15, 76, 129, 0.12)',
      borderColor: 'rgba(15, 76, 129, 0.5)',
      points: generateIsolinePoints(WORK_LOCATION.lat, WORK_LOCATION.lng, transportMode === 'walk' ? 1.2 : transportMode === 'bike' ? 3.8 : transportMode === 'metro' ? 7.5 : 6.3),
    },
    {
      time: 20,
      color: 'rgba(255, 107, 53, 0.08)',
      borderColor: 'rgba(255, 107, 53, 0.4)',
      points: generateIsolinePoints(WORK_LOCATION.lat, WORK_LOCATION.lng, transportMode === 'walk' ? 1.6 : transportMode === 'bike' ? 5 : transportMode === 'metro' ? 10 : 8.4),
    },
  ] as const), [transportMode]);

  /** ECharts 地图配置 */
  const mapChartOption = {
    backgroundColor: '#FAFBFC',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 76, 129, 0.95)',
      borderColor: '#0F4C81',
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params: {
        seriesType?: string;
        name?: string;
        value?: number[];
        data?: { property?: RecommendedProperty };
      }) => {
        if (params.seriesType === 'scatter' && params.data?.property) {
          const p = params.data.property;
          return `
            <div style="padding:4px">
              <div style="font-weight:600;margin-bottom:6px">${p.title}</div>
              <div style="margin:3px 0">租金：<b style="color:#FF6B35;font-family:monospace">¥${p.monthlyRent.toLocaleString()}</b>/月</div>
              <div style="margin:3px 0">房型：${p.bedrooms}室${p.livingRooms}厅 · ${p.buildingArea}㎡</div>
              <div style="margin:3px 0">通勤：<b>${p.commuteMinutes}</b>分钟 · 得分 <b style="color:#00A86B">${p.commuteScore}</b></div>
              <div style="margin:3px 0;color:#CFE1F1;font-size:11px">${p.address}</div>
            </div>`;
        }
        if (params.seriesType === 'effectScatter') {
          return `<b>📍 工作地</b><br/>${workAddress || WORK_LOCATION.name}`;
        }
        if (params.seriesType === 'custom' && params.name) {
          const time = params.name.match(/(\d+)/)?.[1];
          if (time) return `<b>${time}分钟通勤圈</b>`;
        }
        return '';
      },
    },
    geo: {
      map: 'none',
      roam: true,
      zoom: 1.2,
      center: [WORK_LOCATION.lng + 0.005, WORK_LOCATION.lat - 0.005],
      itemStyle: { areaColor: '#F8F9FA', borderColor: 'transparent' },
    },
    xAxis: {
      type: 'value',
      min: WORK_LOCATION.lng - 0.08,
      max: WORK_LOCATION.lng + 0.08,
      show: false,
    },
    yAxis: {
      type: 'value',
      min: WORK_LOCATION.lat - 0.06,
      max: WORK_LOCATION.lat + 0.06,
      show: false,
    },
    animationDuration: 800,
    series: [
      /** 热力图层 */
      {
        name: '骑行热力',
        type: 'heatmap',
        coordinateSystem: 'cartesian2d',
        data: heatmapData,
        pointSize: 14,
        blurSize: 28,
        minOpacity: 0.2,
        maxOpacity: 0.75,
        gradientColors: [
          [0, 'rgba(15, 76, 129, 0.05)'],
          [0.2, 'rgba(15, 76, 129, 0.2)'],
          [0.4, 'rgba(63, 135, 199, 0.45)'],
          [0.6, 'rgba(255, 107, 53, 0.6)'],
          [0.8, 'rgba(230, 57, 70, 0.75)'],
          [1, 'rgba(230, 57, 70, 0.9)'],
        ],
        z: 2,
      },

      /** 等值线圈（从外到内） */
      ...[...isolineData].reverse().map((iso, idx) => ({
        name: `${iso.time}分钟圈`,
        type: 'custom' as const,
        coordinateSystem: 'cartesian2d' as const,
        renderItem: (_params: unknown, api: {
          coord: (p: [number, number]) => [number, number];
          style: (s: object) => object;
        }) => {
          const points = iso.points.map((p: [number, number]) => api.coord(p));
          return {
            type: 'polygon',
            shape: { points },
            style: api.style({
              fill: iso.color,
              stroke: iso.borderColor,
              lineWidth: 1.5,
              lineDash: [6, 4],
            }),
          };
        },
        data: [[0, 0]],
        z: 5 + idx,
        silent: false,
      })),

      /** 骑行路径线 */
      ...bikePathLines.map((line, idx) => ({
        type: 'lines' as const,
        coordinateSystem: 'cartesian2d' as const,
        zlevel: 1,
        effect: {
          show: true,
          period: 5 + idx * 0.5,
          trailLength: 0.2,
          symbol: 'arrow',
          symbolSize: 5,
          color: line.score >= 80 ? '#00A86B' : line.score >= 60 ? '#0F4C81' : '#FF6B35',
        },
        lineStyle: {
          color: line.score >= 80 ? '#00A86B' : line.score >= 60 ? '#0F4C81' : '#FF6B35',
          width: 1.8,
          opacity: 0.7,
          curveness: 0.15 + idx * 0.02,
        },
        data: [{ coords: line.coords }],
        z: 10,
      })),

      /** 房源散点 */
      {
        name: '推荐房源',
        type: 'scatter',
        coordinateSystem: 'cartesian2d',
        symbolSize: (val: number[]) => {
          const score = val[2] || 50;
          return 8 + (score / 100) * 8;
        },
        itemStyle: {
          color: (params: { value: number[] }) => {
            const score = params.value[2] || 50;
            if (score >= 80) return '#00A86B';
            if (score >= 60) return '#0F4C81';
            return '#FF6B35';
          },
          borderColor: '#fff',
          borderWidth: 2,
          shadowBlur: 6,
          shadowColor: 'rgba(15, 76, 129, 0.3)',
        },
        label: {
          show: true,
          formatter: (params: { value: number[] }) => `${params.value[2]}`,
          position: 'top',
          fontSize: 10,
          fontWeight: 700,
          color: '#0F4C81',
          fontFamily: 'JetBrains Mono, monospace',
          backgroundColor: 'rgba(255,255,255,0.85)',
          padding: [2, 5],
          borderRadius: 3,
          borderWidth: 1,
          borderColor: '#CFE1F1',
        },
        data: propertyScatterData,
        z: 20,
      },

      /** 工作地中心点 */
      {
        name: '工作地',
        type: 'effectScatter',
        coordinateSystem: 'cartesian2d',
        symbol: 'path://M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
        symbolSize: 24,
        rippleEffect: { brushType: 'stroke', period: 3, scale: 4 },
        itemStyle: {
          color: '#E63946',
          shadowBlur: 10,
          shadowColor: 'rgba(230, 57, 70, 0.5)',
          borderColor: '#fff',
          borderWidth: 2,
        },
        data: [[WORK_LOCATION.lng, WORK_LOCATION.lat, 100]],
        z: 30,
      },
    ],
  };

  /** 评分颜色 */
  function getScoreColor(score: number): string {
    if (score >= 80) return '#00A86B';
    if (score >= 60) return '#0F4C81';
    return '#FF6B35';
  }

  /** 通勤徽章样式 */
  function getCommuteBadgeStyle(minutes: number): string {
    if (minutes <= 15) return 'bg-success-50 text-success-600 border-success-200';
    if (minutes <= 30) return 'bg-brand-50 text-brand-600 border-brand-200';
    return 'bg-warning-50 text-warning-600 border-warning-200';
  }

  /** 执行搜索 */
  const handleSearch = () => {
    message.success(`已根据「${workAddress}」和「${maxCommuteTime}分钟${{ walk: '步行', bike: '骑行', metro: '地铁', drive: '驾车' }[transportMode]}」重新匹配房源`);
  };

  /** 重置筛选 */
  const handleReset = () => {
    setWorkAddress(WORK_LOCATION.name);
    setTransportMode('bike');
    setMaxCommuteTime(30);
    setRentRange([3000, 12000]);
    setSelectedRooms([]);
    setMustHaveVideo(false);
    setMustHaveVR(false);
    setMustHaveOnsite(false);
    setMinCreditScore(600);
    message.info('已重置所有筛选条件');
  };

  return (
    <Layout className="min-h-screen bg-transparent">
      <Layout>
        {/* 左侧筛选面板 - 固定宽度320px */}
        <Sider
          width={320}
          style={{
            background: '#fff',
            boxShadow: '2px 0 12px rgba(15, 76, 129, 0.08)',
            overflow: 'auto',
            height: 'calc(100vh - 0px)',
            position: 'sticky',
            top: 0,
            left: 0,
          }}
          className="border-r border-ink-100"
        >
          <div className="p-5">
            <div className="mb-5">
              <h2 className="mb-1 text-lg font-bold text-ink-800" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                <CompassOutlined className="mr-2 text-brand-500" />
                智能筛选条件
              </h2>
              <p className="text-xs text-ink-400">基于通勤距离算法 + 骑行热力图叠加匹配</p>
            </div>

            {/* 工作地点 */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-semibold text-ink-700">
                <EnvironmentOutlined className="mr-1 text-danger-500" />
                工作地点
              </label>
              <Input
                size="large"
                placeholder="请输入工作地址"
                value={workAddress}
                onChange={e => setWorkAddress(e.target.value)}
                onPressEnter={handleSearch}
              />
            </div>

            {/* 交通方式 Tabs */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-semibold text-ink-700">
                <BankOutlined className="mr-1 text-brand-500" />
                通勤交通方式
              </label>
              <Tabs
                size="small"
                activeKey={transportMode}
                onChange={k => setTransportMode(k as TransportMode)}
                items={TRANSPORT_TABS}
                className="compact-tabs"
                tabBarStyle={{ marginBottom: 0 }}
              />
            </div>

            <Divider className="my-4" style={{ margin: '16px 0' }} />

            {/* 最大通勤时间 */}
            <div className="mb-5">
              <label className="mb-2 flex items-center justify-between text-sm font-semibold text-ink-700">
                <span>最大通勤时间</span>
                <span className="font-mono text-brand-600 tabular-nums">{maxCommuteTime} 分钟</span>
              </label>
              <Slider
                min={10}
                max={90}
                step={5}
                value={maxCommuteTime}
                onChange={setMaxCommuteTime}
                tooltip={{ formatter: v => `${v} 分钟` }}
                marks={{
                  10: '10分',
                  30: '30分',
                  60: '1小时',
                  90: '1.5h',
                }}
              />
            </div>

            {/* 租金预算范围 */}
            <div className="mb-5">
              <label className="mb-2 flex items-center justify-between text-sm font-semibold text-ink-700">
                <span>租金预算范围</span>
                <span>
                  <span className="font-mono text-warning-500 tabular-nums">¥{rentRange[0].toLocaleString()}</span>
                  <span className="mx-1 text-ink-300">~</span>
                  <span className="font-mono text-warning-500 tabular-nums">¥{rentRange[1].toLocaleString()}</span>
                </span>
              </label>
              <Slider
                range
                min={1000}
                max={25000}
                step={500}
                value={rentRange}
                onChange={v => setRentRange(v as [number, number])}
                tooltip={{ formatter: v => `¥${v?.toLocaleString()}` }}
              />
            </div>

            <Divider className="my-4" style={{ margin: '16px 0' }} />

            {/* 房型多选 */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-semibold text-ink-700">房型选择（多选）</label>
              <Checkbox.Group
                value={selectedRooms}
                onChange={v => setSelectedRooms(v as number[])}
                style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
              >
                {ROOM_OPTIONS.map(opt => (
                  <Checkbox
                    key={opt.value}
                    value={opt.value}
                    style={{ marginRight: 0 }}
                  >
                    <span className="text-sm text-ink-600">{opt.label}</span>
                  </Checkbox>
                ))}
              </Checkbox.Group>
            </div>

            {/* 三态核验必选条件 */}
            <div className="mb-5">
              <label className="mb-3 block text-sm font-semibold text-ink-700">
                <SafetyCertificateOutlined className="mr-1 text-success-500" />
                三态核验必选
              </label>
              <div className="space-y-3 rounded-lg bg-ink-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-ink-600">📹 视频核验通过</span>
                  </div>
                  <Switch
                    size="small"
                    checked={mustHaveVideo}
                    onChange={setMustHaveVideo}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-ink-600">🥽 VR全景核验</span>
                  </div>
                  <Switch
                    size="small"
                    checked={mustHaveVR}
                    onChange={setMustHaveVR}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-ink-600">🏠 管家实地勘验</span>
                  </div>
                  <Switch
                    size="small"
                    checked={mustHaveOnsite}
                    onChange={setMustHaveOnsite}
                  />
                </div>
              </div>
            </div>

            <Divider className="my-4" style={{ margin: '16px 0' }} />

            {/* 信用分最低值 */}
            <div className="mb-6">
              <label className="mb-2 flex items-center justify-between text-sm font-semibold text-ink-700">
                <span>信用分最低要求</span>
                <span className={cn(
                  'font-mono font-bold tabular-nums',
                  minCreditScore >= 700 ? 'text-success-600' : minCreditScore >= 550 ? 'text-brand-600' : 'text-warning-500'
                )}>
                  {minCreditScore} 分
                </span>
              </label>
              <Slider
                min={400}
                max={900}
                step={10}
                value={minCreditScore}
                onChange={setMinCreditScore}
                tooltip={{ formatter: v => `${v} 分` }}
                marks={{
                  400: '400',
                  600: '600',
                  750: '750',
                  900: '900',
                }}
              />
              <div className="mt-1 flex justify-between text-[10px] text-ink-400">
                <span>较差</span>
                <span>一般</span>
                <span>良好</span>
                <span>优秀</span>
              </div>
            </div>

            {/* 操作按钮 */}
            <Space className="w-full" direction="vertical" size={10}>
              <Button
                type="primary"
                size="large"
                block
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                智能匹配房源
              </Button>
              <Button
                size="large"
                block
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                重置筛选条件
              </Button>
            </Space>

            {/* 匹配统计 */}
            <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50/60 p-4">
              <div className="mb-2 flex items-center justify-between text-xs text-ink-500">
                <span>当前匹配房源</span>
                <span className="text-brand-600">实时计算</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="font-mono text-3xl font-bold text-brand-600 tabular-nums">
                  {recommendedProperties.length}
                </span>
                <span className="mb-1 text-sm text-ink-500">套</span>
              </div>
              <div className="mt-2 text-xs text-ink-500">
                通勤 ≤ {maxCommuteTime + 10}分钟 · 租金 ¥{rentRange[0].toLocaleString()} ~ ¥{rentRange[1].toLocaleString()}
              </div>
            </div>
          </div>
        </Sider>

        {/* 右侧主内容 */}
        <Layout style={{ background: 'transparent' }}>
          <Content className="p-5">
            {/* 页面标题 */}
            <div className="mb-5">
              <h1 className="m-0 text-2xl font-bold text-ink-800" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                <CompassOutlined className="mr-2 text-brand-500" />
                智能房源匹配
              </h1>
              <p className="mt-1 text-sm text-ink-500">
                基于工作地通勤距离算法 + 骑行热力图叠加，智能排序推荐最佳房源
              </p>
            </div>

            {/* 上部：骑行热力地图 55% */}
            <Card
              className="mb-5 shadow-card"
              bodyStyle={{ padding: 0 }}
              title={
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 px-1 text-base font-semibold text-ink-800">
                    <Bike className="inline h-5 w-5 text-warning-500" />
                    骑行热力地图
                    <Tag color="blue" className="!m-0 !py-0 !text-xs">
                      {isolineData[2].time}/{isolineData[1].time}/{isolineData[0].time}分钟通勤圈
                    </Tag>
                  </span>
                  <Space size={12} className="pr-2">
                    <span className="flex items-center gap-1.5 text-xs text-ink-500">
                      <span className="inline-block h-3 w-3 rounded-full bg-success-500" />
                      优秀房源
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-ink-500">
                      <span className="inline-block h-3 w-3 rounded-full bg-brand-500" />
                      良好房源
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-ink-500">
                      <span className="inline-block h-3 w-3 rounded-full bg-danger-500" />
                      工作地点
                    </span>
                  </Space>
                </div>
              }
              styles={{ body: { height: '55vh', minHeight: 420 } }}
            >
              <ReactECharts
                option={mapChartOption}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
                notMerge
              />
            </Card>

            {/* 下部：推荐房源列表 45% */}
            <Card
              className="shadow-card"
              bodyStyle={{ padding: '20px 24px' }}
              title={
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 px-1 text-base font-semibold text-ink-800">
                    <EnvironmentOutlined className="text-brand-500" />
                    推荐房源列表
                    <Tag color="green" className="!m-0 !py-0 !text-xs">
                      按通勤得分降序
                    </Tag>
                  </span>
                  <span className="pr-2 text-xs text-ink-400">
                    共 {recommendedProperties.length} 套符合条件
                  </span>
                </div>
              }
            >
              {recommendedProperties.length === 0 ? (
                <div className="py-20 text-center text-ink-400">
                  <SearchOutlined className="mb-3 text-4xl opacity-30" />
                  <div>暂无符合筛选条件的房源，请放宽条件后重试</div>
                </div>
              ) : (
                <Row gutter={[16, 16]}>
                  {recommendedProperties.map(p => (
                    <Col span={8} key={p.id}>
                      <Card
                        hoverable
                        className="h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-cardHover"
                        bodyStyle={{ padding: 0 }}
                        styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%' } }}
                        onClick={() => navigate(`/property/detail/${p.id}`)}
                      >
                        {/* 缩略图 */}
                        <div className="relative">
                          <img
                            src={p.coverImage}
                            alt={p.title}
                            className="h-40 w-full object-cover"
                          />
                          {/* 通勤时间徽章 */}
                          <div className={cn(
                            'absolute left-3 top-3 rounded-md border px-2.5 py-1 text-xs font-bold shadow-sm backdrop-blur-sm',
                            getCommuteBadgeStyle(p.commuteMinutes)
                          )}
                            style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                          >
                            {p.transportMode === 'walk' && <Footprints className="mr-1 inline h-3.5 w-3.5" />}
                            {p.transportMode === 'bike' && <Bike className="mr-1 inline h-3.5 w-3.5" />}
                            {p.transportMode === 'metro' && <Train className="mr-1 inline h-3.5 w-3.5" />}
                            {p.transportMode === 'drive' && <CarOutlined className="mr-1" />}
                            {p.commuteMinutes}分钟
                          </div>
                          {/* 通勤得分圆形徽章 */}
                          <div className="absolute -bottom-5 right-3">
                            <ProgressRing
                              progress={p.commuteScore}
                              size={48}
                              strokeWidth={4.5}
                              color={getScoreColor(p.commuteScore)}
                              showPercentage
                              className="!bg-white shadow-md"
                            />
                          </div>
                        </div>

                        {/* 信息区 */}
                        <div className="flex flex-1 flex-col p-4 pt-6">
                          {/* 标题 */}
                          <div
                            className="mb-2 line-clamp-1 cursor-pointer text-sm font-semibold text-ink-800 hover:text-brand-600"
                            title={p.title}
                          >
                            {p.title}
                          </div>
                          {/* 小区名 */}
                          <div className="mb-3 truncate text-xs text-ink-500" title={p.communityName}>
                            <EnvironmentOutlined className="mr-1" />
                            {p.communityName} · {p.district}
                          </div>

                          {/* 租金 */}
                          <div className="mb-3 flex items-baseline gap-1">
                            <span className="font-mono text-2xl font-bold text-warning-500 tabular-nums">
                              ¥{p.monthlyRent.toLocaleString()}
                            </span>
                            <span className="text-xs text-ink-400">/月</span>
                          </div>

                          {/* 房型/面积 + 三态标签 */}
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs text-ink-600">
                              {p.bedrooms}室{p.livingRooms}厅 · {p.buildingArea}㎡
                            </span>
                            <Space size={2}>
                              {(() => {
                                const tri = generateTriVerify(p);
                                return (
                                  <>
                                    {tri.video === 'verified' && <Tag color="success" className="!m-0 !px-1.5 !py-0 !text-[10px]">视频</Tag>}
                                    {tri.vr === 'verified' && <Tag color="processing" className="!m-0 !px-1.5 !py-0 !text-[10px]">VR</Tag>}
                                    {tri.onsite === 'verified' && <Tag color="blue" className="!m-0 !px-1.5 !py-0 !text-[10px]">实地</Tag>}
                                  </>
                                );
                              })()}
                            </Space>
                          </div>

                          {/* 通勤得分进度条 */}
                          <div className="mb-3">
                            <div className="mb-1 flex items-center justify-between text-[10px] text-ink-400">
                              <span>通勤综合得分</span>
                              <span className="font-mono font-semibold tabular-nums" style={{ color: getScoreColor(p.commuteScore) }}>
                                {p.commuteScore}分
                              </span>
                            </div>
                            <Progress
                              percent={p.commuteScore}
                              showInfo={false}
                              strokeColor={getScoreColor(p.commuteScore)}
                              trailColor="#EBEBEE"
                              size="small"
                            />
                          </div>

                          {/* 查看详情按钮 */}
                          <div className="mt-auto pt-2">
                            <Button
                              type="primary"
                              size="small"
                              block
                              icon={<EyeOutlined />}
                              onClick={e => {
                                e.stopPropagation();
                                navigate(`/property/detail/${p.id}`);
                              }}
                            >
                              查看详情
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
