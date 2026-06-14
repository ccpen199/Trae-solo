import { useMemo } from 'react';
import { Tabs, Card, Table, Space, Tag } from 'antd';
import ReactECharts from 'echarts-for-react';
import {
  BarChart3,
  PieChart,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Clock,
  Award,
  Activity,
  FileCheck,
  Video,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import { useGlobalStore } from '@/store/useGlobalStore';
import type { NurseRankingItem } from '@/store/useGlobalStore';

const { TabPane } = Tabs;

export default function Reports() {
  const {
    reportStats,
    orderTrendData,
    patientTypeDistribution,
    nurseRankingData,
    complianceStats,
    riskTypeDistribution,
    riskProcessingTime,
    riskTrendByMonth,
  } = useGlobalStore();

  const orderTrendOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: {
      data: ['订单数量', '营收金额'],
      top: 0,
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
      data: orderTrendData.map((d) => d.month),
      axisLine: { lineStyle: { color: '#CBD5E1' } },
      axisLabel: { color: '#64748B' },
    },
    yAxis: [
      {
        type: 'value',
        name: '订单数',
        position: 'left',
        axisLine: { show: true, lineStyle: { color: '#3B82F6' } },
        axisLabel: { color: '#64748B' },
        splitLine: { lineStyle: { type: 'dashed', color: '#E2E8F0' } },
      },
      {
        type: 'value',
        name: '营收(元)',
        position: 'right',
        axisLine: { show: true, lineStyle: { color: '#10B981' } },
        axisLabel: { color: '#64748B' },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '订单数量',
        type: 'bar',
        data: orderTrendData.map((d) => d.orders),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#60A5FA' },
              { offset: 1, color: '#3B82F6' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: '40%',
      },
      {
        name: '营收金额',
        type: 'line',
        yAxisIndex: 1,
        data: orderTrendData.map((d) => d.revenue),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: '#10B981', width: 3 },
        itemStyle: { color: '#10B981' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.05)' },
            ],
          },
        },
      },
    ],
  }), [orderTrendData]);

  const patientTypePieOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      itemWidth: 12,
      itemHeight: 12,
      textStyle: { color: '#64748B' },
    },
    series: [
      {
        name: '患者类型',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
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
            formatter: '{b}\n{c}人',
          },
        },
        labelLine: {
          show: false,
        },
        data: patientTypeDistribution.map((d, idx) => ({
          value: d.value,
          name: d.name,
          itemStyle: {
            color: ['#3B82F6', '#10B981', '#EC4899', '#8B5CF6'][idx],
          },
        })),
      },
    ],
  }), [patientTypeDistribution]);

  const nurseRankingColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      render: (_: unknown, __: unknown, index: number) => {
        const ranks = ['🥇', '🥈', '🥉'];
        return (
          <span className="text-lg">
            {index < 3 ? ranks[index] : <span className="text-slate-500">#{index + 1}</span>}
          </span>
        );
      },
    },
    {
      title: '护士姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '所属机构',
      dataIndex: 'organization',
      key: 'organization',
      width: 180,
      ellipsis: true,
    },
    {
      title: '完成订单',
      dataIndex: 'completedOrders',
      key: 'completedOrders',
      width: 100,
      sorter: (a: NurseRankingItem, b: NurseRankingItem) =>
        a.completedOrders - b.completedOrders,
      render: (value: number) => (
        <span className="font-semibold text-blue-600">{value}</span>
      ),
    },
    {
      title: '服务评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 100,
      render: (value: number) => (
        <span className="font-medium text-amber-600">★ {value.toFixed(1)}</span>
      ),
    },
  ];

  const gaugeCommonOption = (value: number, title: string, color: string) => ({
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        splitNumber: 10,
        radius: '90%',
        axisLine: {
          lineStyle: {
            width: 20,
            color: [
              [value / 100, color],
              [1, '#E2E8F0'],
            ],
          },
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '60%',
          width: 8,
          offsetCenter: [0, '-5%'],
          itemStyle: { color: color },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        title: {
          show: true,
          offsetCenter: [0, '70%'],
          fontSize: 14,
          color: '#64748B',
        },
        detail: {
          valueAnimation: true,
          fontSize: 28,
          fontWeight: 'bold',
          offsetCenter: [0, '10%'],
          formatter: '{value}%',
          color: color,
        },
        data: [{ value, name: title }],
      },
    ],
  });

  const riskTypePieOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      bottom: 0,
      itemWidth: 12,
      itemHeight: 12,
      textStyle: { color: '#64748B' },
    },
    series: [
      {
        name: '异常类型',
        type: 'pie',
        radius: ['35%', '60%'],
        center: ['50%', '40%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          fontSize: 11,
        },
        data: riskTypeDistribution.map((d, idx) => ({
          value: d.value,
          name: d.name,
          itemStyle: {
            color: [
              '#EF4444',
              '#F97316',
              '#F59E0B',
              '#EAB308',
              '#84CC16',
              '#06B6D4',
            ][idx],
          },
        })),
      },
    ],
  }), [riskTypeDistribution]);

  const processingTimeBarOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: '{b}<br/>平均处理时长: {c}小时',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: '小时',
      axisLine: { lineStyle: { color: '#CBD5E1' } },
      axisLabel: { color: '#64748B' },
      splitLine: { lineStyle: { type: 'dashed', color: '#E2E8F0' } },
    },
    yAxis: {
      type: 'category',
      data: riskProcessingTime.map((d) => d.name),
      axisLine: { lineStyle: { color: '#CBD5E1' } },
      axisLabel: { color: '#64748B' },
    },
    series: [
      {
        type: 'bar',
        data: riskProcessingTime.map((d) => ({
          value: d.avgHours,
          itemStyle: {
            color: d.avgHours > 20 ? '#EF4444' : d.avgHours > 15 ? '#F97316' : '#10B981',
            borderRadius: [0, 4, 4, 0],
          },
        })),
        barWidth: '60%',
        label: {
          show: true,
          position: 'right',
          formatter: '{c}h',
          color: '#64748B',
        },
      },
    ],
  }), [riskProcessingTime]);

  const riskTrendLineOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: {
      data: ['低风险', '中风险', '高风险', '极高风险'],
      top: 0,
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
      data: riskTrendByMonth.map((d) => d.month),
      axisLine: { lineStyle: { color: '#CBD5E1' } },
      axisLabel: { color: '#64748B' },
    },
    yAxis: {
      type: 'value',
      name: '工单数量',
      axisLine: { show: true, lineStyle: { color: '#CBD5E1' } },
      axisLabel: { color: '#64748B' },
      splitLine: { lineStyle: { type: 'dashed', color: '#E2E8F0' } },
    },
    series: [
      {
        name: '低风险',
        type: 'line',
        data: riskTrendByMonth.map((d) => d.low),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#10B981', width: 2 },
        itemStyle: { color: '#10B981' },
        stack: 'total',
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0)' },
            ],
          },
        },
      },
      {
        name: '中风险',
        type: 'line',
        data: riskTrendByMonth.map((d) => d.medium),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#F59E0B', width: 2 },
        itemStyle: { color: '#F59E0B' },
        stack: 'total',
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(245, 158, 11, 0.3)' },
              { offset: 1, color: 'rgba(245, 158, 11, 0)' },
            ],
          },
        },
      },
      {
        name: '高风险',
        type: 'line',
        data: riskTrendByMonth.map((d) => d.high),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#F97316', width: 2 },
        itemStyle: { color: '#F97316' },
        stack: 'total',
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(249, 115, 22, 0.3)' },
              { offset: 1, color: 'rgba(249, 115, 22, 0)' },
            ],
          },
        },
      },
      {
        name: '极高风险',
        type: 'line',
        data: riskTrendByMonth.map((d) => d.critical),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#EF4444', width: 2 },
        itemStyle: { color: '#EF4444' },
        stack: 'total',
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0)' },
            ],
          },
        },
      },
    ],
  }), [riskTrendByMonth]);

  return (
    <div className="p-6">
      <PageHeader
        title="统计报表中心"
        description="多维度数据统计与分析，助力业务决策与运营优化"
        icon={<BarChart3 className="h-6 w-6" />}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          title="累计订单"
          value={reportStats.totalOrders.toLocaleString()}
          icon={<Activity className="h-6 w-6" />}
          gradient="blue"
          suffix="单"
        />
        <StatCard
          title="累计营收"
          value={(reportStats.totalRevenue / 10000).toFixed(1)}
          icon={<TrendingUp className="h-6 w-6" />}
          gradient="green"
          suffix="万元"
        />
        <StatCard
          title="累计保单"
          value={reportStats.totalPolicies.toLocaleString()}
          icon={<ShieldCheck className="h-6 w-6" />}
          gradient="purple"
          suffix="份"
        />
        <StatCard
          title="理赔通过率"
          value={reportStats.claimApprovalRate}
          icon={<FileCheck className="h-6 w-6" />}
          gradient="orange"
          suffix="%"
        />
      </div>

      <Tabs defaultActiveKey="service" type="card">
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              服务统计
            </span>
          }
          key="service"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card
              title={
                <Space>
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <span>订单趋势分析</span>
                  <Tag color="blue">近12个月</Tag>
                </Space>
              }
              className="shadow-sm"
            >
              <ReactECharts
                option={orderTrendOption}
                style={{ height: 320 }}
                opts={{ renderer: 'canvas' }}
              />
            </Card>

            <Card
              title={
                <Space>
                  <PieChart className="h-4 w-4 text-purple-500" />
                  <span>患者类型分布</span>
                </Space>
              }
              className="shadow-sm"
            >
              <ReactECharts
                option={patientTypePieOption}
                style={{ height: 320 }}
                opts={{ renderer: 'canvas' }}
              />
            </Card>

            <Card
              title={
                <Space className="lg:col-span-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span>护士服务排行榜</span>
                  <Tag color="gold">TOP 10</Tag>
                </Space>
              }
              className="shadow-sm lg:col-span-2"
            >
              <Table
                columns={nurseRankingColumns}
                dataSource={nurseRankingData}
                rowKey="id"
                pagination={false}
                size="middle"
              />
            </Card>
          </div>
        </TabPane>

        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              合规统计
            </span>
          }
          key="compliance"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card
              title={
                <Space>
                  <Award className="h-4 w-4 text-emerald-500" />
                  <span>资质合规率</span>
                </Space>
              }
              className="shadow-sm"
            >
              <ReactECharts
                option={gaugeCommonOption(
                  complianceStats.qualificationCompliance,
                  '护士资质合规',
                  '#10B981'
                )}
                style={{ height: 280 }}
                opts={{ renderer: 'canvas' }}
              />
              <div className="mt-2 text-center text-sm text-slate-500">
                已核验护士 / 总注册护士
              </div>
            </Card>

            <Card
              title={
                <Space>
                  <FileCheck className="h-4 w-4 text-blue-500" />
                  <span>审核通过率</span>
                </Space>
              }
              className="shadow-sm"
            >
              <ReactECharts
                option={gaugeCommonOption(
                  complianceStats.auditPassRate,
                  '服务记录审核',
                  '#3B82F6'
                )}
                style={{ height: 280 }}
                opts={{ renderer: 'canvas' }}
              />
              <div className="mt-2 text-center text-sm text-slate-500">
                通过审核 / 总审核数
              </div>
            </Card>

            <Card
              title={
                <Space>
                  <Video className="h-4 w-4 text-violet-500" />
                  <span>录像完整率</span>
                </Space>
              }
              className="shadow-sm"
            >
              <ReactECharts
                option={gaugeCommonOption(
                  complianceStats.recordingCompleteRate,
                  '服务录像完整',
                  '#8B5CF6'
                )}
                style={{ height: 280 }}
                opts={{ renderer: 'canvas' }}
              />
              <div className="mt-2 text-center text-sm text-slate-500">
                完整录像 / 总服务次数
              </div>
            </Card>
          </div>

          <Card
            title={
              <Space className="mt-6">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span>合规指标说明</span>
              </Space>
            }
            className="mt-6 shadow-sm"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-emerald-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Award className="h-5 w-5 text-emerald-600" />
                  <span className="font-medium text-emerald-800">资质合规率</span>
                </div>
                <p className="text-sm text-emerald-700">
                  衡量护士执业资质的合规情况，包括证书有效期、执业范围等核验结果。
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">审核通过率</span>
                </div>
                <p className="text-sm text-blue-700">
                  服务记录通过三级审核（自检、质控、平台）的比例，反映服务规范性。
                </p>
              </div>
              <div className="rounded-lg bg-violet-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Video className="h-5 w-5 text-violet-600" />
                  <span className="font-medium text-violet-800">录像完整率</span>
                </div>
                <p className="text-sm text-violet-700">
                  服务过程录像的完整程度，关键服务环节必须全程录制，无中断。
                </p>
              </div>
            </div>
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              风险统计
            </span>
          }
          key="risk"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card
              title={
                <Space>
                  <PieChart className="h-4 w-4 text-red-500" />
                  <span>异常类型分布</span>
                </Space>
              }
              className="shadow-sm"
            >
              <ReactECharts
                option={riskTypePieOption}
                style={{ height: 320 }}
                opts={{ renderer: 'canvas' }}
              />
            </Card>

            <Card
              title={
                <Space>
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span>风险处理时效</span>
                  <Tag color="orange">平均处理时长</Tag>
                </Space>
              }
              className="shadow-sm"
            >
              <ReactECharts
                option={processingTimeBarOption}
                style={{ height: 320 }}
                opts={{ renderer: 'canvas' }}
              />
            </Card>

            <Card
              title={
                <Space className="lg:col-span-2">
                  <TrendingUp className="h-4 w-4 text-red-500" />
                  <span>风险趋势分析</span>
                  <Tag color="red">近6个月</Tag>
                </Space>
              }
              className="shadow-sm lg:col-span-2"
            >
              <ReactECharts
                option={riskTrendLineOption}
                style={{ height: 360 }}
                opts={{ renderer: 'canvas' }}
              />
            </Card>
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
}
