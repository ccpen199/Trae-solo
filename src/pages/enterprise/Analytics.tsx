import React, { useState, useMemo } from 'react';
import {
  Card,
  Tabs,
  Table,
  Tag,
  Tooltip,
  Progress,
  Select,
  Empty,
} from 'antd';
import {
  DollarOutlined,
  UserOutlined,
  TeamOutlined,
  RiseOutlined,
  FallOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from 'recharts';
import { TrendingUp, PieChart, Users, DollarSign, BarChart2, Clock } from 'lucide-react';
import StatsCard from '@/components/common/StatsCard';
import FunnelChart, { FunnelDataItem } from '@/components/charts/FunnelChart';
import ChannelROIChart from '@/components/charts/ChannelROIChart';
import RetentionLineChart from '@/components/charts/RetentionLineChart';
import { mockData } from '@/mock/data';

const { Option } = Select;

const INDUSTRIAL_BLUE = '#165DFF';
const VITAL_ORANGE = '#FF7D00';
const SUCCESS_GREEN = '#00B42A';

function ChannelROIView() {
  const { channelROIs } = mockData;

  const latestMonthData = useMemo(() => {
    const sorted = [...channelROIs].sort((a, b) => b.month.localeCompare(a.month));
    const latestMonth = sorted[0]?.month;
    return sorted.filter((r) => r.month === latestMonth);
  }, [channelROIs]);

  const chartData = useMemo(() => {
    return latestMonthData.slice(0, 8).map((r) => ({
      channel: r.channel,
      cost: r.cost,
      hireCount: r.hires,
      cpa: r.cpa,
      conversionRate: r.conversionRate || Math.round((r.hires / Math.max(1, r.applications)) * 1000) / 10,
    }));
  }, [latestMonthData]);

  const tableData = useMemo(() => {
    return latestMonthData.slice(0, 10).map((r, i) => ({
      key: r.id || i,
      channel: r.channel,
      cost: r.cost,
      views: r.views,
      applications: r.applications,
      interviews: r.interviews,
      hires: r.hires,
      cpa: r.cpa,
      avgQualityScore: r.avgQualityScore,
      interviewRate: Math.round((r.interviews / Math.max(1, r.applications)) * 100),
    }));
  }, [latestMonthData]);

  const columns = [
    {
      title: '渠道',
      dataIndex: 'channel',
      key: 'channel',
      render: (text: string) => (
        <span className="font-medium text-gray-800">{text}</span>
      ),
    },
    {
      title: '投入成本',
      dataIndex: 'cost',
      key: 'cost',
      sorter: (a: any, b: any) => a.cost - b.cost,
      render: (val: number) => (
        <span className="font-mono-num">¥{val.toLocaleString()}</span>
      ),
    },
    {
      title: 'CPA',
      dataIndex: 'cpa',
      key: 'cpa',
      sorter: (a: any, b: any) => a.cpa - b.cpa,
      render: (val: number) => (
        <span className="font-mono-num" style={{ color: val < 2000 ? SUCCESS_GREEN : val < 5000 ? VITAL_ORANGE : '#F53F3F' }}>
          ¥{val.toLocaleString()}
        </span>
      ),
    },
    {
      title: '简历质量均分',
      dataIndex: 'avgQualityScore',
      key: 'avgQualityScore',
      sorter: (a: any, b: any) => a.avgQualityScore - b.avgQualityScore,
      render: (val: number) => (
        <div className="flex items-center gap-2">
          <Progress
            type="circle"
            percent={val}
            size={28}
            strokeColor={val >= 80 ? SUCCESS_GREEN : val >= 60 ? INDUSTRIAL_BLUE : VITAL_ORANGE}
            format={() => ''}
          />
          <span className="font-medium" style={{ color: val >= 80 ? SUCCESS_GREEN : INDUSTRIAL_BLUE }}>
            {val}
          </span>
        </div>
      ),
    },
    {
      title: '到面率',
      dataIndex: 'interviewRate',
      key: 'interviewRate',
      sorter: (a: any, b: any) => a.interviewRate - b.interviewRate,
      render: (val: number) => (
        <div className="w-[120px]">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">到面</span>
            <span className="font-medium" style={{ color: VITAL_ORANGE }}>{val}%</span>
          </div>
          <Progress
            percent={val}
            size="small"
            strokeColor={VITAL_ORANGE}
            showInfo={false}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="总招聘投入"
          value={latestMonthData.reduce((s, r) => s + r.cost, 0)}
          icon={<DollarSign size={20} />}
          theme="blue"
          prefix="¥"
          trend={12.5}
        />
        <StatsCard
          title="平均CPA"
          value={Math.round(latestMonthData.reduce((s, r) => s + r.cpa, 0) / Math.max(1, latestMonthData.length))}
          icon={<TrendingUp size={20} />}
          theme="orange"
          prefix="¥"
          trend={-5.8}
        />
        <StatsCard
          title="总入职人数"
          value={latestMonthData.reduce((s, r) => s + r.hires, 0)}
          icon={<Users size={20} />}
          theme="green"
          suffix=" 人"
          trend={18.2}
        />
        <StatsCard
          title="平均简历质量"
          value={Math.round(latestMonthData.reduce((s, r) => s + r.avgQualityScore, 0) / Math.max(1, latestMonthData.length))}
          icon={<PieChart size={20} />}
          theme="purple"
          suffix=" 分"
          trend={3.6}
        />
      </div>

      <Card
        title={
          <div className="flex items-center gap-2">
            <BarChart2 size={18} style={{ color: INDUSTRIAL_BLUE }} />
            <span>渠道ROI对比分析</span>
            <Tooltip title="柱状图为各渠道投入成本，折线为入职人数和CPA">
              <InfoCircleOutlined className="text-gray-400" />
            </Tooltip>
          </div>
        }
        className="!rounded-xl"
        extra={
          <Select defaultValue="本月" style={{ width: 120 }} size="small">
            <Option value="本月">本月</Option>
            <Option value="上月">上月</Option>
            <Option value="近3月">近3月</Option>
          </Select>
        }
      >
        <ChannelROIChart
          data={chartData}
          height={360}
        />
      </Card>

      <Card
        title={
          <div className="flex items-center gap-2">
            <TeamOutlined style={{ color: VITAL_ORANGE, fontSize: 18 }} />
            <span>渠道效果详情</span>
          </div>
        }
        className="!rounded-xl"
        styles={{ body: { padding: 0 } }}
      >
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 个渠道` }}
        />
      </Card>
    </div>
  );
}

function FunnelView() {
  const { funnelMetrics } = mockData;

  const generateFullFunnel = () => {
    const latest = funnelMetrics[funnelMetrics.length - 1] as any;
    if (!latest) return [];

    const views = latest.viewCount || 50000;
    const clicks = Math.round(views * 0.25);
    const applications = latest.applicationCount || 4000;
    const screeningPass = latest.screeningPassCount || 2000;
    const interviews = latest.interviewCount || 800;
    const offers = latest.offerCount || 280;
    const onboard = latest.onboardCount || 180;
    const retention30 = Math.round(onboard * 0.92);
    const retention90 = Math.round(onboard * 0.78);

    return [
      { name: '曝光', value: views },
      { name: '点击', value: clicks },
      { name: '投递', value: applications },
      { name: '筛选通过', value: screeningPass },
      { name: '到面', value: interviews },
      { name: 'Offer', value: offers },
      { name: '入职', value: onboard },
      { name: '30天留存', value: retention30 },
      { name: '90天留存', value: retention90 },
    ] as FunnelDataItem[];
  };

  const funnelData = generateFullFunnel();

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
        {funnelData.map((item, i) => {
          const rate = i > 0 ? ((item.value / funnelData[i - 1].value) * 100).toFixed(1) : '100';
          return (
            <Card key={i} className="!rounded-xl !p-0 hover:shadow-md transition-shadow">
              <div className="p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">{item.name}</div>
                <div className="text-xl font-bold font-mono-num" style={{ color: INDUSTRIAL_BLUE }}>
                  {item.value.toLocaleString()}
                </div>
                <div className="text-xs mt-1 flex items-center justify-center gap-1">
                  {i > 0 && <FallOutlined style={{ color: VITAL_ORANGE }} />}
                  <span style={{ color: VITAL_ORANGE }}>{rate}%</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card
        title={
          <div className="flex items-center gap-2">
            <BarChart2 size={18} style={{ color: INDUSTRIAL_BLUE }} />
            <span>9阶段招聘转化漏斗</span>
          </div>
        }
        className="!rounded-xl"
      >
        <FunnelChart data={funnelData} height={420} />
      </Card>
    </div>
  );
}

function RetentionView() {
  const { retentionAnalyses } = mockData;

  const channels = ['BOSS直聘', '智联招聘', '前程无忧', '猎聘网', '58同城', '内部推荐'];
  const COLORS = ['#165DFF', '#FF7D00', '#00B42A', '#722ED1', '#F53F3F', '#14C9C9'];

  const retentionData = useMemo(() => {
    const months = [1, 2, 3, 4, 5, 6];
    return months.map((m) => {
      const row: any = { month: m };
      channels.forEach((ch, idx) => {
        const base = 95 - idx * 3;
        row[ch] = Math.max(30, base - m * (4 + idx * 0.8) + (Math.sin(m + idx) * 3));
      });
      return row;
    });
  }, []);

  const lines = channels.map((ch, idx) => ({
    key: ch,
    name: ch,
    color: COLORS[idx % COLORS.length],
  }));

  const turnoverReasons = [
    { name: '薪资福利不符', value: 32, color: '#F53F3F' },
    { name: '工作内容不匹配', value: 28, color: '#FF7D00' },
    { name: '企业文化不合', value: 22, color: '#165DFF' },
    { name: '通勤距离太远', value: 18, color: '#00B42A' },
    { name: '个人发展受限', value: 25, color: '#722ED1' },
    { name: '工作压力大', value: 20, color: '#14C9C9' },
    { name: '家庭原因', value: 15, color: '#F7BA1E' },
    { name: '找到更好机会', value: 30, color: '#86909C' },
  ];

  return (
    <div className="space-y-5">
      <Card
        title={
          <div className="flex items-center gap-2">
            <Clock size={18} style={{ color: INDUSTRIAL_BLUE }} />
            <span>分渠道留存率曲线（6个月）</span>
          </div>
        }
        className="!rounded-xl"
        extra={
          <Select defaultValue="2024-06" style={{ width: 140 }} size="small">
            <Option value="2024-06">2024年6月</Option>
            <Option value="2024-05">2024年5月</Option>
            <Option value="2024-04">2024年4月</Option>
          </Select>
        }
      >
        <RetentionLineChart
          data={retentionData}
          lines={lines}
          height={380}
          yAxisLabel="留存率 (%)"
        />
      </Card>

      <Card
        title={
          <div className="flex items-center gap-2">
            <TeamOutlined style={{ color: VITAL_ORANGE, fontSize: 18 }} />
            <span>离职原因分析</span>
          </div>
        }
        className="!rounded-xl"
      >
        <div className="flex flex-wrap gap-3 justify-center py-4">
          {turnoverReasons.map((item, i) => (
            <div
              key={i}
              className="px-4 py-2 rounded-full flex items-center gap-2 transition-transform hover:scale-105 cursor-default"
              style={{
                backgroundColor: `${item.color}15`,
                border: `1px solid ${item.color}40`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm font-medium" style={{ color: item.color }}>
                {item.name}
              </span>
              <span className="text-xs font-bold" style={{ color: item.color }}>
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('roi');

  const tabItems = [
    {
      key: 'roi',
      label: (
        <span>
          <DollarOutlined className="mr-1.5" />
          渠道ROI
        </span>
      ),
    },
    {
      key: 'funnel',
      label: (
        <span>
          <BarChart2 size={14} className="inline mr-1.5" />
          效果漏斗
        </span>
      ),
    },
    {
      key: 'retention',
      label: (
        <span>
          <Clock size={14} className="inline mr-1.5" />
          留存分析
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <Card className="!rounded-xl" styles={{ body: { padding: '12px 0 0 0' } }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          tabBarStyle={{ paddingLeft: 16, paddingRight: 16 }}
        />
        <div className="px-4 pb-4 pt-2">
          {activeTab === 'roi' && <ChannelROIView />}
          {activeTab === 'funnel' && <FunnelView />}
          {activeTab === 'retention' && <RetentionView />}
        </div>
      </Card>
    </div>
  );
}
