import React, { useMemo } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Avatar,
  Badge,
  Tooltip,
  List,
  Progress,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  BankOutlined,
  FileProtectOutlined,
  UserOutlined,
  TeamOutlined,
  BuildOutlined,
  RiseOutlined,
  DollarOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Building, Users, Briefcase, DollarSign, TrendingUp, MapPin } from 'lucide-react';
import StatsCard from '@/components/common/StatsCard';
import { mockData } from '@/mock/data';
import { TOWNSHIPS, TOWNSHIP_NAMES } from '@/mock/townships';

const INDUSTRIAL_BLUE = '#165DFF';
const VITAL_ORANGE = '#FF7D00';
const SUCCESS_GREEN = '#00B42A';

function HeatmapGrid() {
  const heatmapData = useMemo(() => {
    return mockData.unifiedStats.townshipStats.map((twp) => {
      const intensity = Math.min(100, twp.jobCount * 2 + Math.random() * 30);
      return {
        code: twp.code,
        name: twp.name,
        count: twp.jobCount,
        intensity,
      };
    }).sort((a, b) => b.count - a.count);
  }, []);

  const getHeatColor = (intensity: number) => {
    if (intensity >= 80) return { bg: '#165DFF', text: '#FFFFFF' };
    if (intensity >= 60) return { bg: '#4787FF', text: '#FFFFFF' };
    if (intensity >= 40) return { bg: '#75A5FF', text: '#FFFFFF' };
    if (intensity >= 20) return { bg: '#A3C3FF', text: '#092666' };
    return { bg: '#D1E1FF', text: '#092666' };
  };

  return (
    <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-5 gap-2">
      {heatmapData.map((item) => {
        const color = getHeatColor(item.intensity);
        return (
          <Tooltip
            key={item.code}
            title={`${item.name}：${item.count} 个职位`}
          >
            <div
              className="relative aspect-square rounded-lg flex flex-col items-center justify-center p-1 cursor-pointer transition-transform hover:scale-105 hover:shadow-md"
              style={{ backgroundColor: color.bg }}
            >
              <span
                className="text-xs font-medium truncate w-full text-center"
                style={{ color: color.text }}
              >
                {item.name.replace('街道', '').replace('镇', '')}
              </span>
              <span
                className="text-lg font-bold font-mono-num mt-0.5"
                style={{ color: color.text }}
              >
                {item.count}
              </span>
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}

function ActivityTrendChart() {
  const data = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      days.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        enterpriseActive: Math.round(80 + Math.sin(i / 3) * 20 + Math.random() * 30),
        jobseekerActive: Math.round(200 + Math.sin(i / 4) * 60 + Math.random() * 80),
        positions: Math.round(30 + Math.cos(i / 5) * 15 + Math.random() * 20),
        applications: Math.round(150 + Math.sin(i / 2) * 50 + Math.random() * 60),
      });
    }
    return days;
  }, []);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="colorEnterprise" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#165DFF" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#165DFF" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorJobseeker" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FF7D00" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#FF7D00" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00B42A" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#00B42A" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F2F3F5" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#86909C', fontSize: 10 }}
          axisLine={{ stroke: '#E5E6EB' }}
          tickLine={false}
          interval={3}
        />
        <YAxis
          tick={{ fill: '#86909C', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <ReTooltip
          contentStyle={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E6EB',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          iconType="circle"
        />
        <Area
          type="monotone"
          dataKey="enterpriseActive"
          name="企业活跃"
          stroke="#165DFF"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorEnterprise)"
        />
        <Area
          type="monotone"
          dataKey="jobseekerActive"
          name="求职者活跃"
          stroke="#FF7D00"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorJobseeker)"
        />
        <Area
          type="monotone"
          dataKey="applications"
          name="投递数"
          stroke="#00B42A"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorApplications)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function Summary() {
  const { enterprises, positions, jobSeekers, subsidyApplications, applications, unifiedStats } = mockData;
  const townshipStats = {
    totalTownships: unifiedStats.totalTownships,
  };

  const pendingEnterprises = useMemo(() => {
    return enterprises
      .filter((e) => !e.verified)
      .slice(0, 6)
      .map((e, i) => ({
        key: e.id,
        name: e.name,
        industry: e.industry,
        township: TOWNSHIP_NAMES[e.township],
        scale: e.scale,
        employeeCount: e.employeeCount,
        appliedAt: new Date(Date.now() - i * 86400000).toLocaleDateString('zh-CN'),
      }));
  }, [enterprises]);

  const pendingSubsidies = useMemo(() => {
    return subsidyApplications
      .filter((s) => s.status === '审核中' || s.status === '已提交')
      .slice(0, 6)
      .map((s, i) => {
        const ent = enterprises[i % enterprises.length];
        return {
          key: s.id,
          applicantName: s.applicantName || ent?.name,
          type: s.type,
          amount: s.amount,
          status: s.status,
          appliedAt: new Date(s.appliedAt).toLocaleDateString('zh-CN'),
        };
      });
  }, [subsidyApplications, enterprises]);

  const enterpriseColumns = [
    {
      title: '企业名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div className="flex items-center gap-2">
          <Avatar
            size={32}
            style={{ backgroundColor: INDUSTRIAL_BLUE, fontWeight: 600 }}
          >
            {text[0]}
          </Avatar>
          <div>
            <div className="font-medium text-gray-800 text-sm">{text}</div>
            <div className="text-xs text-gray-400">{record.industry}</div>
          </div>
        </div>
      ),
    },
    {
      title: '所在镇街',
      dataIndex: 'township',
      key: 'township',
      render: (t: string) => <span className="text-sm text-gray-600">{t}</span>,
    },
    {
      title: '企业规模',
      dataIndex: 'scale',
      key: 'scale',
      render: (t: string) => <Tag className="!text-xs m-0">{t}</Tag>,
    },
    {
      title: '申请时间',
      dataIndex: 'appliedAt',
      key: 'appliedAt',
      render: (t: string) => <span className="text-sm text-gray-500">{t}</span>,
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            style={{ backgroundColor: SUCCESS_GREEN }}
          >
            通过
          </Button>
          <Button
            size="small"
            danger
            icon={<CloseOutlined />}
          >
            驳回
          </Button>
        </Space>
      ),
    },
  ];

  const subsidyColumns = [
    {
      title: '申请企业',
      dataIndex: 'applicantName',
      key: 'applicantName',
      render: (text: string) => (
        <span className="font-medium text-gray-800 text-sm">{text}</span>
      ),
    },
    {
      title: '补贴类型',
      dataIndex: 'type',
      key: 'type',
      render: (t: string) => (
        <Tag color="blue" className="!text-xs m-0">{t}</Tag>
      ),
    },
    {
      title: '申请金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number) => (
        <span className="font-mono-num font-medium text-sm" style={{ color: VITAL_ORANGE }}>
          ¥{val.toLocaleString()}
        </span>
      ),
    },
    {
      title: '申请时间',
      dataIndex: 'appliedAt',
      key: 'appliedAt',
      render: (t: string) => <span className="text-sm text-gray-500">{t}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color="processing" className="!text-xs m-0" icon={<ClockCircleOutlined />}>
          {s}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Button type="link" size="small" icon={<SearchOutlined />}>
          审核
        </Button>
      ),
    },
  ];

  const totalSubsidyPaid = subsidyApplications
    .filter((s) => s.status === '已发放')
    .reduce((s, a) => s + a.amount, 0);

  const thisMonthOnboard = applications.filter((a) => a.status === '已入职').length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="平台企业数"
          value={unifiedStats.totalEnterprises}
          icon={<Building size={20} />}
          theme="blue"
          suffix=" 家"
          trend={8.5}
        />
        <StatsCard
          title="平台职位数"
          value={unifiedStats.totalJobs}
          icon={<Briefcase size={20} />}
          theme="orange"
          suffix=" 个"
          trend={12.3}
        />
        <StatsCard
          title="认证企业"
          value={unifiedStats.certifiedEnterprises}
          icon={<Building size={20} />}
          theme="green"
          suffix=" 家"
          trend={6.8}
        />
        <StatsCard
          title="总求职者"
          value={unifiedStats.totalSeekers}
          icon={<Users size={20} />}
          theme="cyan"
          suffix=" 人"
          trend={15.8}
        />
        <StatsCard
          title="本月入职数"
          value={thisMonthOnboard}
          icon={<TrendingUp size={20} />}
          theme="purple"
          suffix=" 人"
          trend={22.1}
        />
        <StatsCard
          title="补贴发放总额"
          value={totalSubsidyPaid}
          icon={<DollarSign size={20} />}
          theme="blue"
          prefix="¥"
          trend={18.6}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card
          className="lg:col-span-2 !rounded-xl"
          title={
            <div className="flex items-center gap-2">
              <TrendingUp size={18} style={{ color: INDUSTRIAL_BLUE }} />
              <span>近30天平台活跃趋势</span>
            </div>
          }
        >
          <ActivityTrendChart />
        </Card>

        <Card
          className="!rounded-xl"
          title={
            <div className="flex items-center gap-2">
              <MapPin size={18} style={{ color: VITAL_ORANGE }} />
              <span>{townshipStats.totalTownships}镇街招聘热力图</span>
            </div>
          }
        >
          <HeatmapGrid />
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-100">
            {[
              { label: '低', bg: '#D1E1FF' },
              { label: '中低', bg: '#A3C3FF' },
              { label: '中', bg: '#75A5FF' },
              { label: '中高', bg: '#4787FF' },
              { label: '高', bg: '#165DFF' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: item.bg }}
                />
                <span className="text-xs text-gray-500">{item.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card
        className="!rounded-xl"
        styles={{ body: { padding: 0 } }}
        title={
          <div className="flex items-center gap-2 px-5 pt-4">
            <BuildOutlined style={{ color: INDUSTRIAL_BLUE, fontSize: 18 }} />
            <span>企业待审核列表</span>
            <Badge
              count={pendingEnterprises.length}
              style={{ backgroundColor: VITAL_ORANGE }}
              className="ml-2"
            />
          </div>
        }
        extra={
          <Button
            type="link"
            size="small"
            className="!mr-5 !mt-4"
          >
            查看全部 →
          </Button>
        }
      >
        <Table
          columns={enterpriseColumns}
          dataSource={pendingEnterprises}
          pagination={false}
          size="middle"
        />
      </Card>

      <Card
        className="!rounded-xl"
        styles={{ body: { padding: 0 } }}
        title={
          <div className="flex items-center gap-2 px-5 pt-4">
            <BankOutlined style={{ color: VITAL_ORANGE, fontSize: 18 }} />
            <span>补贴待审核列表</span>
            <Badge
              count={pendingSubsidies.length}
              style={{ backgroundColor: INDUSTRIAL_BLUE }}
              className="ml-2"
            />
          </div>
        }
        extra={
          <Button
            type="link"
            size="small"
            className="!mr-5 !mt-4"
          >
            查看全部 →
          </Button>
        }
      >
        <Table
          columns={subsidyColumns}
          dataSource={pendingSubsidies}
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  );
}
