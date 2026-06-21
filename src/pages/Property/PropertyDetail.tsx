import { useState, useMemo } from 'react';
import {
  Layout,
  Button,
  Row,
  Col,
  Card,
  Carousel,
  Tag,
  Input,
  Space,
  message,
  Descriptions,
  Slider,
  Badge,
} from 'antd';
import {
  ArrowLeftOutlined,
  HomeOutlined,
  AreaChartOutlined,
  BuildOutlined,
  CompassOutlined,
  ApartmentOutlined,
  SafetyCertificateOutlined,
  BankOutlined,
  EnvironmentOutlined,
  CarOutlined,
  CalculatorOutlined,
  UserOutlined,
  CheckCircleOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { Footprints, Bike } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { useAppStore } from '@/store';
import type { Property, Orientation, DecorationLevel, VerifyState } from '@/types';
import Timeline from '@/components/common/Timeline';
import StatusBadge from '@/components/common/StatusBadge';
import ProgressRing from '@/components/common/ProgressRing';
import DataCard from '@/components/common/DataCard';
import { cn } from '@/lib/utils';

const { Content } = Layout;

/** 三态核验类型 */
type TriVerifyType = 'video' | 'vr' | 'onsite';

/** 三态核验状态 */
interface TriVerifyStatus {
  video: VerifyState;
  vr: VerifyState;
  onsite: VerifyState;
}

/** 生成三态核验状态（模拟数据） */
function generateTriVerify(property: Property): TriVerifyStatus {
  const states: VerifyState[] = ['verified', 'verified', 'verifying', 'unverified', 'verification_failed'];
  const seed = property.id.charCodeAt(0) + property.id.charCodeAt(property.id.length - 1);
  return {
    video: states[seed % 5],
    vr: states[(seed + 1) % 5],
    onsite: states[(seed + 2) % 5],
  };
}

/** 三态核验Tag组件 */
function TriVerifyTag({ type, status }: { type: TriVerifyType; status: VerifyState }) {
  const labelMap: Record<TriVerifyType, string> = {
    video: '视频核验',
    vr: 'VR核验',
    onsite: '实地核验',
  };
  const statusStyleMap: Record<VerifyState, { bg: string; text: string; border: string; icon: string }> = {
    verified: { bg: 'bg-success-50', text: 'text-success-600', border: 'border-success-300', icon: '✓' },
    verifying: { bg: 'bg-brand-50', text: 'text-brand-600', border: 'border-brand-300', icon: '⋯' },
    unverified: { bg: 'bg-ink-100', text: 'text-ink-500', border: 'border-ink-200', icon: '○' },
    verification_failed: { bg: 'bg-danger-50', text: 'text-danger-600', border: 'border-danger-300', icon: '✗' },
  };
  const style = statusStyleMap[status];
  return (
    <Tag
      className={cn(
        'm-0 flex items-center border px-3 py-1 text-xs font-semibold',
        style.bg,
        style.text,
        style.border
      )}
      style={{ backgroundColor: 'transparent', borderRadius: 6 }}
    >
      <span className="mr-1 font-bold">{style.icon}</span>
      {labelMap[type]}
    </Tag>
  );
}

/** 朝向中文映射 */
const ORIENTATION_MAP: Record<Orientation, string> = {
  east: '东',
  south: '南',
  west: '西',
  north: '北',
  southeast: '东南',
  southwest: '西南',
  northeast: '东北',
  northwest: '西北',
};

/** 装修程度映射 */
const DECORATION_MAP: Record<DecorationLevel, string> = {
  rough: '毛坯',
  simple: '简装',
  standard: '标准装修',
  fine: '精装修',
  luxury: '豪装',
};

/** 生成核验时间线数据 */
function generateVerifyTimeline(property: Property) {
  const baseTime = dayjs(property.createTime);
  const tri = generateTriVerify(property);
  return [
    {
      time: baseTime.add(1, 'hour').format('YYYY-MM-DD HH:mm'),
      title: '视频上传 → AI核验通过',
      description: '房源短视频上传成功，AI算法自动识别房屋结构、装修程度、采光情况，与房源描述信息匹配度 96.2%。',
      status: tri.video === 'verified' ? 'success' as const : tri.video === 'verifying' ? 'processing' as const : tri.video === 'verification_failed' ? 'danger' as const : 'warning' as const,
    },
    {
      time: baseTime.add(3, 'hour').format('YYYY-MM-DD HH:mm'),
      title: 'VR上传 → 完整性校验',
      description: 'VR全景上传共 12 个场景点，覆盖客厅、主卧、次卧、厨房、卫生间等关键区域，空间拓扑结构完整。',
      status: tri.vr === 'verified' ? 'success' as const : tri.vr === 'verifying' ? 'processing' as const : tri.vr === 'verification_failed' ? 'danger' as const : 'warning' as const,
    },
    {
      time: baseTime.add(1, 'day').format('YYYY-MM-DD HH:mm'),
      title: '管家勘验 → 定位+照片',
      description: `管家 王师傅 上门实地勘验，GPS定位与房源地址偏差 ${(Math.random() * 50).toFixed(1)}m，拍摄现场照片 28 张，关键设备状态已标注。`,
      status: tri.onsite === 'verified' ? 'success' as const : tri.onsite === 'verifying' ? 'processing' as const : tri.onsite === 'verification_failed' ? 'danger' as const : 'warning' as const,
    },
    {
      time: baseTime.add(2, 'day').format('YYYY-MM-DD HH:mm'),
      title: '三态汇总 → 上架',
      description: '视频、VR、实地三态核验全部通过，综合真实性评分计算完成，房源已自动上架并进入推荐池。',
      status: property.verifyState === 'verified' ? 'success' as const : property.verifyState === 'verifying' ? 'processing' as const : 'warning' as const,
    },
  ];
}

export default function PropertyDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { properties, updateProperty } = useAppStore();

  const [workAddress, setWorkAddress] = useState<string>('人民广场');
  const [commuteCalculated, setCommuteCalculated] = useState<boolean>(true);

  /** 当前房源 */
  const property = useMemo(
    () => properties.find(p => p.id === id) || properties[0],
    [properties, id]
  );

  if (!property) {
    return (
      <Layout className="bg-transparent">
        <Content className="p-6">
          <div className="text-center text-ink-500">房源不存在</div>
        </Content>
      </Layout>
    );
  }

  const triVerify = generateTriVerify(property);
  const priceIndex = property.priceIndex;

  /** 生成近12个月价格趋势数据 */
  const priceTrendData = useMemo(() => {
    const months: string[] = [];
    const communityPrices: number[] = [];
    const districtPrices: number[] = [];
    const base = priceIndex?.communityAvgPrice || 120;
    for (let i = 11; i >= 0; i--) {
      const month = dayjs().subtract(i, 'month').format('YY/MM');
      months.push(month);
      const variation = Math.sin((11 - i) * 0.5) * 12 + (Math.random() - 0.5) * 8;
      communityPrices.push(Math.round(base + variation));
      districtPrices.push(Math.round(base * 0.95 + variation * 0.8 + (Math.random() - 0.5) * 5));
    }
    return { months, communityPrices, districtPrices };
  }, [priceIndex]);

  /** ECharts 价格趋势折线图配置 */
  const priceChartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 76, 129, 0.95)',
      borderColor: '#0F4C81',
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params: Array<{ axisValue: string; seriesName: string; value: number }>) => {
        let html = `<div style="font-weight:600;margin-bottom:8px">${params[0].axisValue}</div>`;
        params.forEach(p => {
          html += `<div style="margin:4px 0">${p.seriesName}：<b style="font-family:monospace">¥${p.value.toLocaleString()}/㎡</b></div>`;
        });
        return html;
      },
    },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    legend: {
      data: ['小区均价', '城区均价'],
      right: 10,
      top: 0,
      textStyle: { fontSize: 12, color: '#4A4F5A' },
      icon: 'roundRect',
    },
    xAxis: {
      type: 'category',
      data: priceTrendData.months,
      axisLine: { lineStyle: { color: '#D9D9DF' } },
      axisLabel: { fontSize: 11, color: '#6B7280' },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: {
        fontSize: 11,
        color: '#6B7280',
        formatter: (v: number) => `¥${v}`,
      },
      splitLine: { lineStyle: { color: '#EBEBEE', type: 'dashed' } },
    },
    series: [
      {
        name: '小区均价',
        type: 'line',
        data: priceTrendData.communityPrices,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2.5, color: '#0F4C81' },
        itemStyle: { color: '#0F4C81', borderColor: '#fff', borderWidth: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(15, 76, 129, 0.25)' },
              { offset: 1, color: 'rgba(15, 76, 129, 0.02)' },
            ],
          },
        },
      },
      {
        name: '城区均价',
        type: 'line',
        data: priceTrendData.districtPrices,
        smooth: true,
        symbol: 'diamond',
        symbolSize: 6,
        lineStyle: { width: 2, color: '#FF6B35', type: 'dashed' },
        itemStyle: { color: '#FF6B35', borderColor: '#fff', borderWidth: 2 },
      },
    ],
  };

  /** 价格区间数据 */
  const priceRangeData = useMemo(() => {
    const avg = priceIndex?.communityAvgPrice || 120;
    const min = Math.round(avg * 0.75);
    const max = Math.round(avg * 1.35);
    const current = Math.round(property.monthlyRent / property.buildingArea * 10);
    return { min, max, current, avg };
  }, [priceIndex, property]);

  /** 模拟通勤数据 */
  const commuteData = useMemo(() => ({
    metro: {
      walkMinutes: property.commuteInfo?.metroWalkTime || 8,
      stationName: property.commuteInfo?.nearestMetroName || '地铁2号线人民广场站',
    },
    bike: {
      minutes: 12 + Math.round(Math.random() * 15),
      distance: Number((2.5 + Math.random() * 4).toFixed(1)),
    },
    drive: {
      minutes: 18 + Math.round(Math.random() * 25),
    },
    score: Math.round(70 + Math.random() * 25),
  }), [property]);

  /** 计算通勤综合评分颜色 */
  function getCommuteScoreColor(score: number): string {
    if (score >= 85) return '#00A86B';
    if (score >= 70) return '#0F4C81';
    if (score >= 55) return '#FF6B35';
    return '#E63946';
  }

  /** 计算通勤 */
  const handleCalculateCommute = () => {
    if (!workAddress.trim()) {
      message.warning('请输入工作地址');
      return;
    }
    message.loading({ content: '正在计算通勤路径...', key: 'calc', duration: 0.8 });
    setTimeout(() => {
      message.success({ content: `已计算到「${workAddress}」的通勤方案`, key: 'calc' });
      setCommuteCalculated(true);
      void updateProperty;
    }, 800);
  };

  /** AI建议租金区间 */
  const aiPriceSuggestion = useMemo(() => {
    const base = property.monthlyRent;
    return {
      min: Math.round(base * 0.94),
      max: Math.round(base * 1.06),
      confidence: Math.round(82 + Math.random() * 14),
    };
  }, [property]);

  /** 房东历史房源数（模拟） */
  const historicalCount = useMemo(
    () => properties.filter(p => p.landlordId === property.landlordId).length + Math.floor(Math.random() * 5),
    [properties, property]
  );

  /** 脱敏姓名 */
  function maskName(name: string): string {
    if (name.length <= 1) return name;
    if (name.length === 2) return name[0] + '*';
    return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
  }

  /** 核验时间线 */
  const verifyTimeline = generateVerifyTimeline(property);

  return (
    <Layout className="bg-transparent">
      <Content className="p-6">
        {/* 返回按钮 + 标题 + 三态徽章 */}
        <div className="mb-5">
          <div className="flex items-start justify-between">
            <div>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/property/list')}
                className="mb-3 !px-0 text-ink-500 hover:!text-brand-600"
              >
                返回房源列表
              </Button>
              <div className="flex items-start gap-4">
                <div>
                  <h1
                    className="m-0 text-2xl font-bold text-ink-800"
                    style={{ fontFamily: "'Noto Serif SC', serif" }}
                  >
                    {property.title}
                  </h1>
                  <div className="mt-1.5 flex items-center gap-3 text-sm text-ink-500">
                    <span>
                      <EnvironmentOutlined className="mr-1" />
                      {property.address}
                    </span>
                    <span>
                      <ApartmentOutlined className="mr-1" />
                      房源编号：{property.propertyNo}
                    </span>
                  </div>
                </div>
                <Space size={8} wrap>
                  <TriVerifyTag type="video" status={triVerify.video} />
                  <TriVerifyTag type="vr" status={triVerify.vr} />
                  <TriVerifyTag type="onsite" status={triVerify.onsite} />
                  <StatusBadge status={property.status} type="property" />
                </Space>
              </div>
            </div>
          </div>
        </div>

        {/* 顶部图片轮播 */}
        <Card className="mb-5 shadow-card" bodyStyle={{ padding: 0 }}>
          <Carousel autoplay autoplaySpeed={4000} dots>
            {property.images.slice(0, 4).map((img, idx) => (
              <div key={idx}>
                <img
                  src={img}
                  alt={`房源图${idx + 1}`}
                  className="h-[380px] w-full object-cover"
                  style={{ borderRadius: '4px 4px 0 0' }}
                />
              </div>
            ))}
          </Carousel>
        </Card>

        {/* 主体 9:5 两栏布局 */}
        <Row gutter={20}>
          {/* 左栏 9 */}
          <Col span={14}>
            {/* 房源基础信息 */}
            <Card
              className="mb-5 shadow-card"
              title={
                <span className="section-title !mb-0" style={{ borderLeft: 'none', paddingLeft: 0 }}>
                  <HomeOutlined className="mr-2 text-brand-500" />
                  房源基础信息
                </span>
              }
            >
              <div className="grid grid-cols-3 gap-y-5 gap-x-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <ApartmentOutlined style={{ fontSize: 18 }} />
                  </div>
                  <div>
                    <div className="text-xs text-ink-400">房型</div>
                    <div className="mt-0.5 text-base font-semibold text-ink-800">
                      {property.bedrooms}室{property.livingRooms}厅{property.bathrooms}卫
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <AreaChartOutlined style={{ fontSize: 18 }} />
                  </div>
                  <div>
                    <div className="text-xs text-ink-400">建筑面积</div>
                    <div className="mt-0.5 text-base font-semibold text-ink-800">
                      {property.buildingArea}㎡
                      <span className="ml-1 text-xs font-normal text-ink-400">
                        (套内{property.usableArea}㎡)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <BuildOutlined style={{ fontSize: 18 }} />
                  </div>
                  <div>
                    <div className="text-xs text-ink-400">楼层 / 总层数</div>
                    <div className="mt-0.5 text-base font-semibold text-ink-800">
                      {property.floor} / {property.totalFloor}层
                      {property.hasElevator && (
                        <span className="ml-1 text-xs font-normal text-success-600">有电梯</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <CompassOutlined style={{ fontSize: 18 }} />
                  </div>
                  <div>
                    <div className="text-xs text-ink-400">朝向</div>
                    <div className="mt-0.5 text-base font-semibold text-ink-800">
                      {ORIENTATION_MAP[property.orientation]}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <SafetyCertificateOutlined style={{ fontSize: 18 }} />
                  </div>
                  <div>
                    <div className="text-xs text-ink-400">装修程度</div>
                    <div className="mt-0.5 text-base font-semibold text-ink-800">
                      {DECORATION_MAP[property.decoration]}
                      <span className="ml-1 text-xs font-normal text-ink-400">
                        ({property.buildYear}年建)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <BankOutlined style={{ fontSize: 18 }} />
                  </div>
                  <div>
                    <div className="text-xs text-ink-400">押金月数</div>
                    <div className="mt-0.5 text-base font-semibold text-ink-800">
                      {property.depositMonths}个月押
                      <span className="ml-1 text-xs font-normal text-ink-400">
                        ({property.paymentType})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-ink-100 pt-5">
                <Descriptions
                  column={2}
                  size="small"
                  labelStyle={{ color: '#6B7280', fontWeight: 500, width: 100 }}
                  contentStyle={{ color: '#2D3142' }}
                >
                  <Descriptions.Item label="建成年份">{property.buildYear}年</Descriptions.Item>
                  <Descriptions.Item label="可入住日">{property.availableDate}</Descriptions.Item>
                  <Descriptions.Item label="最短租期">{property.minLeaseTerm}个月</Descriptions.Item>
                  <Descriptions.Item label="押金金额">¥{property.depositAmount.toLocaleString()}</Descriptions.Item>
                  <Descriptions.Item label="小区名称">{property.communityName}</Descriptions.Item>
                  <Descriptions.Item label="所属商圈">{property.businessArea}</Descriptions.Item>
                </Descriptions>
              </div>

              <div className="mt-4">
                <div className="mb-2 text-xs font-medium text-ink-400">配套设施</div>
                <Space size={[6, 8]} wrap>
                  {property.facilities.map(f => (
                    <Tag
                      key={f}
                      className="m-0 border-0 bg-ink-50 px-2.5 py-1 text-xs text-ink-600"
                      style={{ backgroundColor: undefined, borderRadius: 4 }}
                    >
                      {f}
                    </Tag>
                  ))}
                </Space>
              </div>
            </Card>

            {/* 租金价格指数 */}
            <Card
              className="mb-5 shadow-card"
              title={
                <span className="section-title !mb-0" style={{ borderLeft: 'none', paddingLeft: 0 }}>
                  <AreaChartOutlined className="mr-2 text-brand-500" />
                  租金价格指数
                </span>
              }
            >
              <Row gutter={16} align="middle" className="mb-4">
                <Col span={12}>
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs text-ink-500">小区均价</span>
                    <span className="font-mono text-3xl font-bold text-brand-600 tabular-nums">
                      ¥{priceIndex?.communityAvgPrice?.toLocaleString() || '--'}
                    </span>
                    <span className="text-xs text-ink-400">元/㎡/月</span>
                    {priceIndex && (
                      <Badge
                        className="!ml-2"
                        color={priceIndex.yearOnYear >= 0 ? '#00A86B' : '#E63946'}
                        text={
                          <span className={cn(
                            'text-xs font-semibold',
                            priceIndex.yearOnYear >= 0 ? 'text-success-600' : 'text-danger-600'
                          )}>
                            {priceIndex.yearOnYear >= 0 ? '↑' : '↓'}
                            {Math.abs(priceIndex.yearOnYear)}%
                            <span className="ml-0.5 font-normal text-ink-400">同比</span>
                          </span>
                        }
                      />
                    )}
                  </div>
                </Col>
                <Col span={12} className="text-right text-xs text-ink-500">
                  <Space size={20}>
                    <span>
                      商圈均价：
                      <span className="ml-0.5 font-mono font-semibold text-ink-700 tabular-nums">
                        ¥{priceIndex?.areaAvgPrice?.toLocaleString() || '--'}
                      </span>
                    </span>
                    <span>
                      区域均价：
                      <span className="ml-0.5 font-mono font-semibold text-ink-700 tabular-nums">
                        ¥{priceIndex?.districtAvgPrice?.toLocaleString() || '--'}
                      </span>
                    </span>
                  </Space>
                </Col>
              </Row>

              <ReactECharts
                option={priceChartOption}
                style={{ height: 260 }}
                opts={{ renderer: 'canvas' }}
              />

              {/* 价格区间条 */}
              <div className="mt-4 rounded-lg bg-ink-50 p-4">
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="text-ink-500">当前房源在小区价格区间中的位置</span>
                  <span className="font-mono font-semibold text-warning-500 tabular-nums">
                    当前 ¥{priceRangeData.current.toLocaleString()}/㎡
                  </span>
                </div>
                <div className="relative">
                  <Slider
                    range
                    min={priceRangeData.min}
                    max={priceRangeData.max}
                    value={[priceRangeData.min, priceRangeData.max]}
                    disabled
                    tooltip={{ open: false }}
                    styles={{
                      track: {
                        background: 'linear-gradient(90deg, #E8F0F8 0%, #CFE1F1 40%, #CFE1F1 60%, #FFEFE8 100%)',
                        height: 12,
                        borderRadius: 6,
                      },
                      rail: { height: 12, borderRadius: 6, background: '#EBEBEE' },
                    }}
                  />
                  {/* 当前值标记 */}
                  <div
                    className="pointer-events-none absolute -top-1 -translate-x-1/2 transform"
                    style={{
                      left: `${((priceRangeData.current - priceRangeData.min) / (priceRangeData.max - priceRangeData.min)) * 100}%`,
                    }}
                  >
                    <div className="relative">
                      <div className="absolute -bottom-3 left-1/2 h-5 w-5 -translate-x-1/2 rotate-45 rounded-sm bg-warning-500 shadow-md" />
                      <div className="absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 rounded-sm bg-white" />
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-between text-xs text-ink-400">
                  <span>¥{priceRangeData.min.toLocaleString()}/㎡ 低价位</span>
                  <span>¥{Math.round((priceRangeData.min + priceRangeData.max) / 2).toLocaleString()}/㎡ 中位</span>
                  <span>¥{priceRangeData.max.toLocaleString()}/㎡ 高价位</span>
                </div>
              </div>
            </Card>

            {/* 核验详情时间轴 */}
            <Card
              className="mb-5 shadow-card"
              title={
                <span className="section-title !mb-0" style={{ borderLeft: 'none', paddingLeft: 0 }}>
                  <SafetyCertificateOutlined className="mr-2 text-brand-500" />
                  核验详情时间轴
                </span>
              }
            >
              <Timeline items={verifyTimeline} className="px-2" />
            </Card>
          </Col>

          {/* 右栏 5 */}
          <Col span={10}>
            {/* 通勤匹配卡片 */}
            <Card
              className="mb-5 shadow-card"
              title={
                <span className="section-title !mb-0" style={{ borderLeft: 'none', paddingLeft: 0 }}>
                  <CarOutlined className="mr-2 text-brand-500" />
                  通勤匹配
                </span>
              }
            >
              <div className="mb-4 flex gap-2">
                <Input
                  size="large"
                  placeholder="请输入工作地点"
                  prefix={<EnvironmentOutlined className="text-ink-400" />}
                  value={workAddress}
                  onChange={e => setWorkAddress(e.target.value)}
                  onPressEnter={handleCalculateCommute}
                />
                <Button
                  type="primary"
                  size="large"
                  icon={<CalculatorOutlined />}
                  onClick={handleCalculateCommute}
                >
                  计算
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-brand-100 bg-brand-50/50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
                      <Footprints className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs text-ink-500">步行到地铁</div>
                      <div className="text-sm font-semibold text-ink-800">
                        {commuteData.metro.walkMinutes}分钟 · {commuteData.metro.stationName}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-warning-100 bg-warning-50/50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-500 text-white">
                      <Bike className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs text-ink-500">骑行到公司</div>
                      <div className="text-sm font-semibold text-ink-800">
                        {commuteData.bike.minutes}分钟 · {commuteData.bike.distance}公里
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-gold-100 bg-gold-50/50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ backgroundColor: '#D4A574' }}>
                      <CarOutlined />
                    </div>
                    <div>
                      <div className="text-xs text-ink-500">驾车预计</div>
                      <div className="text-sm font-semibold text-ink-800">
                        {commuteData.drive.minutes}分钟 · 全程约{Math.round(commuteData.bike.distance * 1.8)}公里
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-success-100 bg-success-50/30 p-4">
                <DataCard
                  title="通勤综合评分"
                  value={commuteData.score}
                  unit="分"
                  prefix={<ProgressRing progress={commuteData.score} size={32} strokeWidth={3} color={getCommuteScoreColor(commuteData.score)} showPercentage={false} />}
                  accentColor={getCommuteScoreColor(commuteData.score)}
                  className="!p-0 !shadow-none !bg-transparent hover:!translate-y-0"
                  trend={commuteData.score - 75}
                  comparedTo="week"
                />
              </div>
            </Card>

            {/* 房东信息 */}
            <Card
              className="mb-5 shadow-card"
              title={
                <span className="section-title !mb-0" style={{ borderLeft: 'none', paddingLeft: 0 }}>
                  <UserOutlined className="mr-2 text-brand-500" />
                  房东信息
                </span>
              }
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xl font-bold text-white">
                  {property.landlordName[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-ink-800">
                      {maskName(property.landlordName)}
                    </span>
                    <Tag
                      icon={<CheckCircleOutlined />}
                      color="success"
                      className="!m-0 !py-0 text-xs"
                    >
                      产权核验通过
                    </Tag>
                  </div>
                  <div className="mt-1 text-xs text-ink-500">
                    <span className="mr-4">手机：{property.landlordPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg bg-ink-50 p-3 text-center">
                <div>
                  <div className="font-mono text-xl font-bold text-brand-600 tabular-nums">{historicalCount}</div>
                  <div className="mt-0.5 text-xs text-ink-500">历史房源数</div>
                </div>
                <div>
                  <div className="font-mono text-xl font-bold text-success-600 tabular-nums">{Math.round(historicalCount * 0.82)}</div>
                  <div className="mt-0.5 text-xs text-ink-500">成交数</div>
                </div>
                <div>
                  <div className="font-mono text-xl font-bold text-gold-600 tabular-nums">4.9</div>
                  <div className="mt-0.5 text-xs text-ink-500">平均评分</div>
                </div>
              </div>
            </Card>

            {/* 价格建议 */}
            <Card
              className="mb-5 shadow-card"
              title={
                <span className="section-title !mb-0" style={{ borderLeft: 'none', paddingLeft: 0 }}>
                  <RocketOutlined className="mr-2 text-brand-500" />
                  AI 价格建议
                </span>
              }
            >
              <div className="rounded-xl bg-gradient-to-br from-brand-50 via-white to-warning-50 p-5">
                <div className="mb-3 text-center text-xs text-ink-500">
                  基于同小区近期成交、房型、楼层、装修等 28 项因子计算
                </div>
                <div className="mb-3 flex items-center justify-center gap-2">
                  <span className="font-mono text-3xl font-bold text-ink-700 tabular-nums">
                    ¥{aiPriceSuggestion.min.toLocaleString()}
                  </span>
                  <span className="text-xl text-ink-300">~</span>
                  <span className="font-mono text-3xl font-bold text-warning-500 tabular-nums">
                    ¥{aiPriceSuggestion.max.toLocaleString()}
                  </span>
                  <span className="ml-1 text-sm text-ink-500">元/月</span>
                </div>
                <div className="mx-auto mb-4 w-3/4">
                  <Slider
                    min={aiPriceSuggestion.min}
                    max={aiPriceSuggestion.max}
                    value={property.monthlyRent}
                    disabled
                    tooltip={{ open: false }}
                    styles={{
                      track: { background: '#0F4C81', height: 6, borderRadius: 3 },
                      rail: { background: '#EBEBEE', height: 6, borderRadius: 3 },
                      handle: {
                        width: 20, height: 20, border: '3px solid #FF6B35', background: '#fff',
                        boxShadow: '0 2px 8px rgba(255,107,53,0.35)',
                      },
                    }}
                  />
                </div>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-ink-600">
                    <span className="inline-block h-3 w-3 rounded-full bg-warning-500" />
                    当前定价：
                    <span className="font-mono font-semibold tabular-nums">¥{property.monthlyRent.toLocaleString()}</span>
                  </span>
                  <Tag
                    color={aiPriceSuggestion.confidence >= 90 ? 'success' : 'processing'}
                    className="!m-0 !text-xs !py-0"
                  >
                    置信度 {aiPriceSuggestion.confidence}%
                  </Tag>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
