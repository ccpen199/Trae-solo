import React from 'react';
import { Card, Table, Avatar, Tag, Progress, List, Typography, Space } from 'antd';
import {
  FileText,
  Users,
  UserCheck,
  Wallet,
  BarChart2,
  MapPin,
  Clock,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import StatsCard from '@/components/common/StatsCard';
import FunnelChart, { FunnelDataItem } from '@/components/charts/FunnelChart';
import MatchScoreRing from '@/components/common/MatchScoreRing';
import { mockData } from '@/mock/data';
import { TOWNSHIP_NAMES } from '@/mock/townships';

const { Title, Text } = Typography;

const INDUSTRIAL_BLUE = '#165DFF';
const VITAL_ORANGE = '#FF7D00';
const PIE_COLORS = ['#165DFF', '#FF7D00', '#00B42A', '#722ED1', '#F53F3F', '#14C9C9', '#F7BA1E', '#86909C'];

export default function Dashboard() {
  const { positions, applications, funnelMetrics, enterprises, matchResults } = mockData;

  const enterprisePositions = positions.slice(0, 8);
  const recentApplications = applications.slice(0, 8);
  const latestFunnel = funnelMetrics[funnelMetrics.length - 1];

  const funnelData: FunnelDataItem[] = [
    { name: '曝光', value: latestFunnel ? (latestFunnel as any).viewCount : 45000 },
    { name: '投递', value: latestFunnel ? (latestFunnel as any).applicationCount : 4200 },
    { name: '初筛通过', value: latestFunnel ? (latestFunnel as any).screeningPassCount : 2100 },
    { name: '面试', value: latestFunnel ? (latestFunnel as any).interviewCount : 850 },
    { name: 'Offer', value: latestFunnel ? (latestFunnel as any).offerCount : 280 },
    { name: '入职', value: latestFunnel ? (latestFunnel as any).onboardCount : 180 },
  ];

  const townshipDistribution = React.useMemo(() => {
    const map: Record<string, number> = {};
    positions.forEach((pos) => {
      const name = TOWNSHIP_NAMES[pos.township] || pos.township;
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [positions]);

  const jobProgressData = React.useMemo(() => {
    return enterprisePositions.map((pos) => {
      const posApps = applications.filter((a) => a.positionId === pos.id);
      const target = pos.hiringCount * 5;
      const interviewRate = posApps.length > 0 ? Math.round((posApps.filter((a) => a.status === '面试中' || a.status === '已发Offer' || a.status === '已入职').length / posApps.length) * 100) : 0;
      const onboardRate = posApps.length > 0 ? Math.round((posApps.filter((a) => a.status === '已入职').length / posApps.length) * 100) : 0;
      return {
        key: pos.id,
        title: pos.title,
        received: pos.applicationCount,
        target,
        progress: Math.min(100, Math.round((pos.applicationCount / target) * 100)),
        interviewRate,
        onboardRate,
        township: TOWNSHIP_NAMES[pos.township],
      };
    });
  }, [enterprisePositions, applications]);

  const columns = [
    {
      title: '职位名称',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <div>
          <div className="font-medium text-gray-800">{text}</div>
          <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
            <MapPin size={12} />
            {record.township}
          </div>
        </div>
      ),
    },
    {
      title: '简历进度',
      dataIndex: 'received',
      key: 'received',
      render: (_: any, record: any) => (
        <div>
          <div className="text-sm mb-1">
            <Text strong style={{ color: INDUSTRIAL_BLUE }}>{record.received}</Text>
            <Text type="secondary"> / {record.target} 份</Text>
          </div>
          <Progress
            percent={record.progress}
            size="small"
            strokeColor={INDUSTRIAL_BLUE}
            showInfo={false}
          />
        </div>
      ),
    },
    {
      title: '到面率',
      dataIndex: 'interviewRate',
      key: 'interviewRate',
      render: (val: number) => (
        <div className="w-full max-w-[160px]">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">到面</span>
            <span className="font-medium" style={{ color: VITAL_ORANGE }}>{val}%</span>
          </div>
          <ResponsiveContainer width="100%" height={24}>
            <BarChart data={[{ value: val }]} barSize={12}>
              <Bar dataKey="value" fill={VITAL_ORANGE} radius={[6, 6, 6, 6]} barSize={12}>
                <Cell fill={VITAL_ORANGE} />
              </Bar>
              <XAxis type="number" domain={[0, 100]} hide />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ),
    },
    {
      title: '到岗率',
      dataIndex: 'onboardRate',
      key: 'onboardRate',
      render: (val: number) => (
        <div className="w-full max-w-[160px]">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">到岗</span>
            <span className="font-medium" style={{ color: INDUSTRIAL_BLUE }}>{val}%</span>
          </div>
          <ResponsiveContainer width="100%" height={24}>
            <BarChart data={[{ value: val }]} barSize={12}>
              <Bar dataKey="value" fill={INDUSTRIAL_BLUE} radius={[6, 6, 6, 6]} barSize={12}>
                <Cell fill={INDUSTRIAL_BLUE} />
              </Bar>
              <XAxis type="number" domain={[0, 100]} hide />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="今日新增投递"
          value={128}
          icon={<FileText size={20} />}
          trend={15.6}
          theme="blue"
          suffix=" 份"
        />
        <StatsCard
          title="本周待面试"
          value={36}
          icon={<Users size={20} />}
          trend={8.2}
          theme="orange"
          suffix=" 人"
        />
        <StatsCard
          title="本月到岗"
          value={24}
          icon={<UserCheck size={20} />}
          trend={22.5}
          theme="green"
          suffix=" 人"
        />
        <StatsCard
          title="招聘预算进度"
          value={68}
          icon={<Wallet size={20} />}
          trend={-3.2}
          theme="purple"
          suffix=" %"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card
          title={
            <Space>
              <BarChart2 size={18} style={{ color: INDUSTRIAL_BLUE }} />
              <span>职位招聘进度</span>
            </Space>
          }
          className="lg:col-span-2 !rounded-xl"
          styles={{ body: { padding: 0 } }}
        >
          <Table
            columns={columns}
            dataSource={jobProgressData}
            pagination={false}
            size="middle"
            className="!rounded-xl"
          />
        </Card>

        <Card
          title={
            <Space>
              <Clock size={18} style={{ color: VITAL_ORANGE }} />
              <span>近期投递简历</span>
            </Space>
          }
          className="!rounded-xl"
          styles={{ body: { padding: 0 } }}
        >
          <List
            dataSource={recentApplications}
            renderItem={(item) => {
              const match = matchResults.find((m) => m.jobSeekerId === item.jobSeekerId);
              const jobSeeker = mockData.jobSeekers.find((j) => j.id === item.jobSeekerId);
              const position = positions.find((p) => p.id === item.positionId);
              return (
                <List.Item className="!px-4 !py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 w-full">
                    <Avatar
                      style={{ backgroundColor: INDUSTRIAL_BLUE, verticalAlign: 'middle' }}
                      size={36}
                    >
                      {jobSeeker?.name?.[0] || '?'}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800 truncate">
                          {jobSeeker?.name || '未知'}
                        </span>
                        <Tag color="blue" className="!text-xs !py-0 !px-1.5">
                          {jobSeeker?.type}
                        </Tag>
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        投递：{position?.title || '未知职位'}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(item.appliedAt).toLocaleDateString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <MatchScoreRing
                      score={match?.overallScore || Math.round(Math.random() * 30 + 60)}
                      size="sm"
                      showLabel={false}
                    />
                  </div>
                </List.Item>
              );
            }}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card
          title={
            <Space>
              <BarChart2 size={18} style={{ color: INDUSTRIAL_BLUE }} />
              <span>招聘漏斗分析</span>
            </Space>
          }
          className="!rounded-xl"
        >
          <FunnelChart data={funnelData} height={320} />
        </Card>

        <Card
          title={
            <Space>
              <MapPin size={18} style={{ color: VITAL_ORANGE }} />
              <span>镇街招聘分布</span>
            </Space>
          }
          className="!rounded-xl"
        >
          <ResponsiveContainer width="100%" height={360}>
            <PieChart>
              <Pie
                data={townshipDistribution}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#E5E6EB' }}
              >
                {townshipDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
