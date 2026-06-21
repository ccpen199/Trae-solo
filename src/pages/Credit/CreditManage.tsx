import { useState, useMemo } from 'react';
import {
  Layout,
  Card,
  Select,
  Row,
  Col,
  Avatar,
  Tag,
  Descriptions,
  Button,
  Statistic,
  Divider,
  Tooltip,
  Space,
} from 'antd';
import {
  TrophyOutlined,
  StarOutlined,
  CrownOutlined,
  UserOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  RiseOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { useAppStore } from '@/store';
import type { CreditProfile, CreditEvent, CreditLevel } from '@/types';
import DataCard from '@/components/common/DataCard';
import Timeline from '@/components/common/Timeline';
import ProgressRing from '@/components/common/ProgressRing';
import { formatMoney } from '@/utils';
import { cn } from '@/lib/utils';

const { Content } = Layout;
const { Option } = Select;

/** 信用等级配置 */
const LEVEL_CONFIG: Record<
  CreditLevel,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ReactNode;
    description: string;
  }
> = {
  excellent: {
    label: '卓越',
    color: '#D4AF37',
    bgColor: '#FFF9E6',
    borderColor: '#E8C84B',
    icon: <CrownOutlined />,
    description: '押金全免 · 最高授信 · 专属客服',
  },
  good: {
    label: '优秀',
    color: '#C0C0C0',
    bgColor: '#F7F8FA',
    borderColor: '#A8A8A8',
    icon: <StarOutlined />,
    description: '押金高减免 · 快速审批 · 优先推荐',
  },
  fair: {
    label: '良好',
    color: '#CD7F32',
    bgColor: '#FFF4E6',
    borderColor: '#D99157',
    icon: <TrophyOutlined />,
    description: '押金部分减免 · 标准服务',
  },
  poor: {
    label: '普通',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    borderColor: '#9CA3AF',
    icon: <UserOutlined />,
    description: '全额押金 · 基础服务',
  },
  very_poor: {
    label: '较差',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    borderColor: '#F87171',
    icon: <UserOutlined />,
    description: '风控加强 · 可能拒租',
  },
};

/** 参考押金（用于计算减免金额） */
const REFERENCE_DEPOSIT = 8000;

export default function CreditManage() {
  const { creditProfiles, contracts } = useAppStore();

  /** 只取租客类型的信用档案 */
  const tenantProfiles = useMemo(
    () => creditProfiles.filter((p) => p.userType === 'tenant'),
    [creditProfiles]
  );

  const [selectedProfileId, setSelectedProfileId] = useState<string | undefined>(
    tenantProfiles[0]?.id
  );

  /** 当前选中的租客 */
  const selectedProfile: CreditProfile | undefined = useMemo(
    () => tenantProfiles.find((p) => p.id === selectedProfileId),
    [tenantProfiles, selectedProfileId]
  );

  /** 仪表盘配置 */
  const gaugeOption = useMemo(() => {
    const score = selectedProfile?.totalScore ?? 0;
    return {
      series: [
        {
          type: 'gauge',
          startAngle: 210,
          endAngle: -30,
          min: 0,
          max: 1000,
          radius: '95%',
          center: ['50%', '60%'],
          progress: {
            show: true,
            width: 28,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  { offset: 0, color: '#EF4444' },
                  { offset: 0.3, color: '#F59E0B' },
                  { offset: 0.5, color: '#EAB308' },
                  { offset: 0.7, color: '#22C55E' },
                  { offset: 1, color: '#0F4C81' },
                ],
              },
            },
          },
          axisLine: {
            lineStyle: {
              width: 28,
              color: [[1, '#F1F5F9']],
            },
          },
          splitLine: {
            distance: -42,
            length: 14,
            lineStyle: {
              color: '#CBD5E1',
              width: 2,
            },
          },
          axisTick: {
            distance: -36,
            splitNumber: 5,
            lineStyle: {
              color: '#CBD5E1',
              width: 1,
            },
          },
          axisLabel: {
            distance: -10,
            color: '#94A3B8',
            fontSize: 10,
          },
          anchor: {
            show: false,
          },
          pointer: {
            icon: 'path://M2090.36389,615.30999 L2090.36389,615.30999 C2091.48372,615.30999 2092.40383,616.194028 2092.44859,617.312956 L2096.90698,728.755929 C2097.05155,732.369577 2094.2393,735.416212 2090.62566,735.56078 C2090.53845,735.564269 2090.45117,735.566014 2090.36389,735.566014 L2090.36389,735.566014 C2086.74736,735.566014 2083.82297,732.630574 2083.82297,729.01405 C2083.82297,728.968756 2083.82492,728.923499 2083.82884,728.878369 L2088.34377,618.322377 C2088.50704,616.294798 2090.21967,615.30999 2092.19178,615.492242 Z',
            length: '65%',
            width: 10,
            offsetCenter: [0, '5%'],
            itemStyle: {
              color: '#0F4C81',
              borderColor: '#0D4474',
              borderWidth: 2,
            },
          },
          title: {
            offsetCenter: [0, '5%'],
            fontSize: 14,
            color: '#64748B',
          },
          detail: {
            valueAnimation: true,
            fontSize: 48,
            offsetCenter: [0, '-15%'],
            formatter: '{value}',
            color: '#0F4C81',
            fontWeight: 'bold',
            fontFamily: 'JetBrains Mono, monospace',
          },
          data: [
            {
              value: score,
              name: '信用分',
            },
          ],
        },
      ],
    };
  }, [selectedProfile]);

  /** 雷达图配置 */
  const radarOption = useMemo(() => {
    if (!selectedProfile) return {};
    const dims = selectedProfile.dimensions;
    const weights = selectedProfile.weights;
    return {
      tooltip: {
        trigger: 'item',
      },
      legend: {
        bottom: 0,
        data: ['当前得分', '满分基准'],
      },
      radar: {
        indicator: [
          { name: '支付历史', max: 100 },
          { name: '合同履约', max: 100 },
          { name: '房屋维护', max: 100 },
          { name: '身份核验', max: 100 },
          { name: '社会行为', max: 100 },
        ],
        radius: '65%',
        center: ['50%', '50%'],
        splitNumber: 5,
        axisName: {
          color: '#475569',
          fontSize: 13,
        },
        splitArea: {
          areaStyle: {
            color: ['#F8FAFC', '#F1F5F9', '#E2E8F0', '#CBD5E1', '#94A3B8'],
            opacity: 0.3,
          },
        },
        axisLine: {
          lineStyle: {
            color: '#CBD5E1',
          },
        },
        splitLine: {
          lineStyle: {
            color: '#E2E8F0',
          },
        },
      },
      series: [
        {
          name: '信用维度得分',
          type: 'radar',
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            width: 2,
          },
          areaStyle: {
            opacity: 0.2,
          },
          data: [
            {
              value: [
                dims.performance,
                dims.behavior,
                dims.identity,
                dims.reputation,
                dims.social,
              ],
              name: '当前得分',
              itemStyle: {
                color: '#0F4C81',
              },
              lineStyle: {
                color: '#0F4C81',
              },
              areaStyle: {
                color: '#0F4C81',
              },
              label: {
                show: true,
                formatter: (params: { value: number }) => `${params.value}分`,
                color: '#0F4C81',
                fontSize: 11,
                fontWeight: 'bold',
              },
            },
            {
              value: [
                100 * weights.performance,
                100 * weights.behavior,
                100 * weights.identity,
                100 * weights.reputation,
                100 * weights.social,
              ],
              name: '满分基准',
              itemStyle: {
                color: '#94A3B8',
              },
              lineStyle: {
                color: '#94A3B8',
                type: 'dashed',
              },
              areaStyle: {
                color: '#94A3B8',
              },
            },
          ],
        },
      ],
    };
  }, [selectedProfile]);

  /** 趋势折线图配置 */
  const trendOption = useMemo(() => {
    if (!selectedProfile) return {};
    const baseScore = selectedProfile.totalScore;
    const months = Array.from({ length: 12 }, (_, i) =>
      dayjs().subtract(11 - i, 'month').format('YYYY-MM')
    );
    const trendData = months.map((_, idx) => {
      const volatility = Math.sin(idx * 0.8) * 35 + (idx - 6) * 5;
      return Math.max(400, Math.min(1000, Math.round(baseScore - 80 + volatility)));
    });
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: Array<{ name: string; value: number }>) => {
          const p = params[0];
          return `${p.name}<br/>信用分: <b>${p.value}</b>`;
        },
      },
      grid: {
        left: 50,
        right: 20,
        top: 30,
        bottom: 40,
      },
      xAxis: {
        type: 'category',
        data: months,
        boundaryGap: false,
        axisLine: {
          lineStyle: { color: '#E2E8F0' },
        },
        axisLabel: {
          color: '#64748B',
          fontSize: 11,
          rotate: 30,
        },
      },
      yAxis: {
        type: 'value',
        min: 400,
        max: 1000,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          lineStyle: { color: '#F1F5F9' },
        },
        axisLabel: {
          color: '#64748B',
          fontSize: 11,
        },
      },
      series: [
        {
          name: '信用分',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: trendData,
          lineStyle: {
            width: 3,
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#4787C7' },
                { offset: 1, color: '#0F4C81' },
              ],
            },
          },
          itemStyle: {
            color: '#0F4C81',
            borderColor: '#fff',
            borderWidth: 2,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(15, 76, 129, 0.25)' },
                { offset: 1, color: 'rgba(15, 76, 129, 0.02)' },
              ],
            },
          },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: {
              color: '#F59E0B',
              type: 'dashed',
            },
            data: [
              {
                yAxis: 650,
                label: {
                  formatter: '及格线 650',
                  color: '#F59E0B',
                  fontSize: 10,
                },
              },
            ],
          },
        },
      ],
    };
  }, [selectedProfile]);

  /** 信用事件时间轴转换 */
  const eventTimeline = useMemo(() => {
    if (!selectedProfile?.recentEvents) return [];
    return selectedProfile.recentEvents
      .sort(
        (a, b) =>
          new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime()
      )
      .map((event: CreditEvent) => {
        const deltaText = event.scoreDelta >= 0
          ? `+${event.scoreDelta}分`
          : `${event.scoreDelta}分`;
        const contractText = event.relatedContractNo
          ? ` [${event.relatedContractNo}]`
          : '';
        return {
          time: dayjs(event.eventTime).format('YYYY-MM-DD HH:mm'),
          title: `${event.title} ${deltaText}${contractText}`,
          description: event.description,
          status: (event.scoreDelta >= 0
            ? 'success'
            : 'danger') as 'success' | 'danger',
        };
      });
  }, [selectedProfile]);

  /** 押金减免金额 */
  const depositReductionAmount = useMemo(() => {
    if (!selectedProfile) return 0;
    return Math.round(REFERENCE_DEPOSIT * selectedProfile.depositReductionRatio);
  }, [selectedProfile]);

  if (tenantProfiles.length === 0) {
    return (
      <Layout className="min-h-screen bg-transparent">
        <Content className="p-6">
          <div className="animate-fade-in-up">
            <h1 className="mb-1 font-serif text-2xl font-bold text-brand-800">
              租客信用分管理
            </h1>
            <p className="mb-6 text-sm text-ink-500">
              驱动押金减免，提升履约意愿
            </p>
            <Card className="shadow-card" bordered={false}>
              <div className="py-12 text-center text-ink-400">
                暂无租客信用档案数据
              </div>
            </Card>
          </div>
        </Content>
      </Layout>
    );
  }

  const levelCfg = LEVEL_CONFIG[selectedProfile?.level ?? 'poor'];

  return (
    <Layout className="min-h-screen bg-transparent">
      <Content className="p-6">
        <div className="animate-fade-in-up space-y-6">
          {/* 页面标题 */}
          <div>
            <h1 className="mb-1 font-serif text-2xl font-bold text-brand-800">
              租客信用分管理
            </h1>
            <p className="text-sm text-ink-500">
              驱动押金减免，提升履约意愿 · 基于5大维度多源数据综合评估
            </p>
          </div>

          {/* 租客选择器（移动端全宽） */}
          <Card className="animate-fade-in-up shadow-card md:hidden" bordered={false}>
            <Select
              className="w-full"
              size="large"
              value={selectedProfileId}
              onChange={setSelectedProfileId}
              placeholder="选择租客"
              optionFilterProp="children"
              showSearch
            >
              {tenantProfiles.map((p) => (
                <Option key={p.id} value={p.id}>
                  <Space className="w-full" style={{ justifyContent: 'space-between' }}>
                    <span>
                      <Avatar size="small" className="mr-2 !bg-brand-500">
                        {p.userName?.charAt(0)}
                      </Avatar>
                      {p.userName}
                    </span>
                    <Tag color="blue">{p.totalScore}分</Tag>
                  </Space>
                </Option>
              ))}
            </Select>
          </Card>

          {/* 主内容 - 左右分栏 4:8 */}
          <Row gutter={24} align="stretch">
            {/* ============= 左栏 (4/12)：信用仪表盘 ============= */}
            <Col xs={24} md={24} lg={10} xl={8}>
              <div className="animate-fade-in-up space-y-4 lg:sticky lg:top-6">
                {/* 租客选择器（PC端） */}
                <Card className="hidden shadow-card md:block" bordered={false}>
                  <div className="mb-3 text-xs font-medium text-ink-500">
                    选择租客
                  </div>
                  <Select
                    className="w-full"
                    size="large"
                    value={selectedProfileId}
                    onChange={setSelectedProfileId}
                    placeholder="选择租客"
                    optionFilterProp="children"
                    showSearch
                  >
                    {tenantProfiles.map((p) => (
                      <Option key={p.id} value={p.id}>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center">
                            <Avatar size="small" className="mr-2 !bg-brand-500">
                              {p.userName?.charAt(0)}
                            </Avatar>
                            <span className="font-medium text-ink-700">
                              {p.userName}
                            </span>
                          </span>
                          <Tag color="blue" className="ml-2">
                            {p.totalScore}分
                          </Tag>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Card>

                {/* 超大半圆仪表盘 */}
                <Card className="shadow-card" bordered={false}>
                  <ReactECharts
                    option={gaugeOption}
                    style={{ height: 280 }}
                    opts={{ renderer: 'svg' }}
                  />

                  {/* 信用等级徽章 */}
                  {selectedProfile && (
                    <div
                      className={cn(
                        'mx-auto mb-4 mt-2 flex w-max items-center gap-3 rounded-2xl border-2 px-6 py-3',
                      )}
                      style={{
                        backgroundColor: levelCfg.bgColor,
                        borderColor: levelCfg.borderColor,
                        boxShadow: `0 4px 16px ${levelCfg.color}22`,
                      }}
                    >
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
                        style={{
                          backgroundColor: `${levelCfg.color}22`,
                          color: levelCfg.color,
                        }}
                      >
                        {levelCfg.icon}
                      </div>
                      <div>
                        <div
                          className="text-xl font-black"
                          style={{ color: levelCfg.color }}
                        >
                          {levelCfg.label}
                        </div>
                        <div className="text-[11px] text-ink-500">
                          {levelCfg.description}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>

                {/* 押金减免比例卡片 */}
                <Card className="shadow-card" bordered={false}>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SafetyCertificateOutlined className="text-brand-500" />
                      <span className="font-semibold text-ink-700">押金减免</span>
                    </div>
                    <Tag color="gold" className="border-0">
                      信用权益
                    </Tag>
                  </div>

                  <Row gutter={16} className="mb-4">
                    <Col span={12}>
                      <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 text-center">
                        <div className="text-xs text-ink-500">减免比例</div>
                        <div className="font-mono text-3xl font-black text-brand-700 tabular-nums">
                          {selectedProfile
                            ? Math.round(selectedProfile.depositReductionRatio * 100)
                            : 0}
                          <span className="text-lg">%</span>
                        </div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="rounded-xl border border-gold-200 bg-gold-50 p-4 text-center">
                        <div className="text-xs text-ink-500">减免金额</div>
                        <div className="font-mono text-3xl font-black text-gold-700 tabular-nums">
                          ¥
                          {(depositReductionAmount / 1000).toFixed(
                            depositReductionAmount >= 1000 ? 1 : 0
                          )}
                          <span className="text-sm">k</span>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <ProgressRing
                    progress={
                      selectedProfile
                        ? Math.round(selectedProfile.depositReductionRatio * 100)
                        : 0
                    }
                    size={56}
                    strokeWidth={6}
                    color={levelCfg.color}
                    label="押金"
                    className="!float-right"
                  />

                  <div className="space-y-1 text-xs">
                    <div className="text-ink-500">
                      参考押金（两居室）：
                      <span className="font-mono text-ink-700 tabular-nums">
                        {formatMoney(REFERENCE_DEPOSIT)}
                      </span>
                    </div>
                    <div className="text-ink-500">
                      实付押金：
                      <span className="font-mono font-semibold text-success-600 tabular-nums">
                        {formatMoney(REFERENCE_DEPOSIT - depositReductionAmount)}
                      </span>
                    </div>
                    {selectedProfile?.depositReductionRatio >= 1 && (
                      <div className="mt-2 rounded-lg bg-success-50 p-2 text-success-700">
                        🎉 信用卓越，已享受零押金入住特权
                      </div>
                    )}
                  </div>
                </Card>

                {/* 租客信息概览 */}
                {selectedProfile && (
                  <Card className="shadow-card" bordered={false}>
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="签约合同">
                        <span className="font-mono font-semibold tabular-nums">
                          {selectedProfile.totalContracts}
                        </span>
                        <span className="ml-1 text-xs text-ink-400">份</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="履约率">
                        <span className="font-mono font-semibold text-success-600 tabular-nums">
                          {selectedProfile.fulfillmentRate}%
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label="守约/违约">
                        <Tag color="success" className="border-0">
                          守约 {selectedProfile.totalKeptPromises}
                        </Tag>
                        <Tag color="danger" className="border-0 ml-1">
                          违约 {selectedProfile.totalBreaches}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="认证状态">
                        {selectedProfile.idVerified ? (
                          <Tag color="green" icon={<CheckCircleOutlined />} className="border-0">
                            已实名
                          </Tag>
                        ) : (
                          <Tag color="default">未实名</Tag>
                        )}
                        {selectedProfile.faceVerified ? (
                          <Tag color="cyan" icon={<CheckCircleOutlined />} className="border-0 ml-1">
                            人脸
                          </Tag>
                        ) : null}
                      </Descriptions.Item>
                      <Descriptions.Item label="信用额度">
                        <span className="font-mono font-semibold text-brand-700 tabular-nums">
                          {formatMoney(selectedProfile.creditLimit, { decimals: 0 })}
                        </span>
                        <span className="ml-1 text-xs text-ink-400">
                          (已用 {formatMoney(selectedProfile.usedLimit, { decimals: 0 })})
                        </span>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                )}
              </div>
            </Col>

            {/* ============= 右栏 (8/12)：分维度与明细 ============= */}
            <Col xs={24} md={24} lg={14} xl={16}>
              <div className="animate-fade-in-up space-y-4">
                {/* 上部：评分维度雷达图 */}
                <Card
                  className="shadow-card"
                  bordered={false}
                  title={
                    <div className="flex items-center gap-2">
                      <RiseOutlined className="text-brand-500" />
                      <span className="font-semibold">评分维度分析</span>
                      <span className="ml-2 text-xs font-normal text-ink-400">
                        各维度满分100分，按权重加权计算总分
                      </span>
                    </div>
                  }
                >
                  <ReactECharts
                    option={radarOption}
                    style={{ height: 380 }}
                    opts={{ renderer: 'svg' }}
                  />
                  {selectedProfile && (
                    <Row gutter={12} className="mt-2">
                      {[
                        { label: '支付历史', value: selectedProfile.dimensions.performance, weight: selectedProfile.weights.performance, color: '#0F4C81' },
                        { label: '合同履约', value: selectedProfile.dimensions.behavior, weight: selectedProfile.weights.behavior, color: '#22C55E' },
                        { label: '房屋维护', value: selectedProfile.dimensions.identity, weight: selectedProfile.weights.identity, color: '#F59E0B' },
                        { label: '身份核验', value: selectedProfile.dimensions.reputation, weight: selectedProfile.weights.reputation, color: '#8B5CF6' },
                        { label: '社会行为', value: selectedProfile.dimensions.social, weight: selectedProfile.weights.social, color: '#EC4899' },
                      ].map((d) => (
                        <Col xs={12} sm={8} md={24 / 5} key={d.label}>
                          <div className="rounded-lg border border-ink-100 p-2 text-center">
                            <div
                              className="text-xs font-medium"
                              style={{ color: d.color }}
                            >
                              {d.label}
                            </div>
                            <div
                              className="font-mono text-lg font-bold tabular-nums"
                              style={{ color: d.color }}
                            >
                              {d.value}
                              <span className="text-[10px] font-normal text-ink-400">
                                /100
                              </span>
                            </div>
                            <div className="text-[10px] text-ink-400">
                              权重 {Math.round(d.weight * 100)}%
                            </div>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  )}
                </Card>

                {/* 中部：信用分趋势折线图 */}
                <Card
                  className="shadow-card"
                  bordered={false}
                  title={
                    <div className="flex items-center gap-2">
                      <LineChartOutlined className="text-brand-500" />
                      <span className="font-semibold">信用分趋势</span>
                      <span className="ml-2 text-xs font-normal text-ink-400">
                        近12个月走势
                      </span>
                    </div>
                  }
                  extra={
                    <Space size={8}>
                      <Tag color="success" icon={<ArrowUpOutlined />} className="border-0">
                        同比 +{(5 + Math.random() * 10).toFixed(1)}%
                      </Tag>
                    </Space>
                  }
                >
                  <ReactECharts
                    option={trendOption}
                    style={{ height: 320 }}
                    opts={{ renderer: 'svg' }}
                  />
                </Card>

                {/* 下部：信用事件时间轴 */}
                <Card
                  className="shadow-card"
                  bordered={false}
                  title={
                    <div className="flex items-center gap-2">
                      <FileTextOutlined className="text-brand-500" />
                      <span className="font-semibold">信用事件记录</span>
                      <Tag color="blue" className="ml-1">
                        {selectedProfile?.recentEvents?.length ?? 0} 条
                      </Tag>
                    </div>
                  }
                  extra={
                    <Tooltip title="正事件绿色加分，负事件红色减分">
                      <Button type="link" size="small">
                        查看完整记录
                      </Button>
                    </Tooltip>
                  }
                >
                  <div className="flex gap-4 mb-4">
                    <Tag color="success" icon={<ArrowUpOutlined />} className="border-0">
                      按时支付 +X / 提前续约 +X / 无投诉 +X
                    </Tag>
                    <Tag color="danger" icon={<ArrowDownOutlined />} className="border-0">
                      逾期支付 -X / 房屋损坏 -X / 提前退租 -X
                    </Tag>
                  </div>
                  {eventTimeline.length > 0 ? (
                    <Timeline items={eventTimeline} />
                  ) : (
                    <div className="py-8 text-center text-ink-400">
                      暂无信用事件记录
                    </div>
                  )}
                </Card>
              </div>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
}
