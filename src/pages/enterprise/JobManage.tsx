import React, { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Dropdown,
  Avatar,
  Badge,
  Typography,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  StopOutlined,
  BarChartOutlined,
  MoreOutlined,
  EyeOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { MapPin, DollarSign } from 'lucide-react';
import { mockData } from '@/mock/data';
import { TOWNSHIP_NAMES } from '@/mock/townships';
import MatchScoreRing from '@/components/common/MatchScoreRing';

const { Title, Text } = Typography;
const { Option } = Select;

const INDUSTRIAL_BLUE = '#165DFF';
const VITAL_ORANGE = '#FF7D00';
const SOURCE_COLORS = ['#165DFF', '#FF7D00', '#00B42A', '#722ED1', '#F53F3F'];

const statusColorMap: Record<string, string> = {
  招聘中: 'processing',
  已暂停: 'warning',
  已关闭: 'default',
  已结束: 'success',
};

export default function JobManage() {
  const { positions, applications, matchResults } = mockData;
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const generateExposureTrend = (seed: number) => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const base = 200 + (seed % 10) * 30;
      data.push({
        day: `${i}天前`,
        views: base + Math.round(Math.sin(i + seed) * 50 + Math.random() * 40),
        clicks: Math.round(base * 0.3 + Math.random() * 20),
      });
    }
    return data.reverse();
  };

  const generateSourceDistribution = (seed: number) => {
    const sources = ['主动投递', '企业邀请', 'AI推荐', 'RPO推荐', '校招'];
    const total = 50 + (seed % 8) * 10;
    return sources.map((name, i) => ({
      name,
      value: Math.round((total * [0.35, 0.2, 0.25, 0.12, 0.08][i]) + Math.random() * 8),
    }));
  };

  const filteredPositions = useMemo(() => {
    return positions.filter((pos) => {
      if (statusFilter && pos.status !== statusFilter) return false;
      if (searchText && !pos.title.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [positions, searchText, statusFilter]);

  const tableData = useMemo(() => {
    return filteredPositions.map((pos, idx) => {
      const posMatches = matchResults.filter((m) => m.positionId === pos.id);
      const avgMatch = posMatches.length > 0
        ? Math.round(posMatches.reduce((s, m) => s + m.overallScore, 0) / posMatches.length)
        : 0;
      return {
        key: pos.id,
        id: pos.id,
        title: pos.title,
        hiringCount: pos.hiringCount,
        applicationCount: pos.applicationCount,
        avgMatch,
        salaryMin: pos.salaryMin,
        salaryMax: pos.salaryMax,
        salaryType: pos.salaryType,
        township: TOWNSHIP_NAMES[pos.township],
        status: pos.status,
        urgent: pos.urgent,
        exposureTrend: generateExposureTrend(idx + 1),
        sourceDistribution: generateSourceDistribution(idx + 1),
      };
    });
  }, [filteredPositions, matchResults]);

  const expandedRowRender = (record: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
      <div>
        <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <EyeOutlined style={{ color: INDUSTRIAL_BLUE }} />
          近7天曝光趋势
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={record.exposureTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F2F3F5" />
            <XAxis
              dataKey="day"
              tick={{ fill: '#86909C', fontSize: 11 }}
              axisLine={{ stroke: '#E5E6EB' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#86909C', fontSize: 11 }}
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
            <Line
              type="monotone"
              dataKey="views"
              name="浏览量"
              stroke={INDUSTRIAL_BLUE}
              strokeWidth={2}
              dot={{ r: 3, fill: INDUSTRIAL_BLUE }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="clicks"
              name="点击量"
              stroke={VITAL_ORANGE}
              strokeWidth={2}
              dot={{ r: 3, fill: VITAL_ORANGE }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div>
        <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <BarChartOutlined style={{ color: VITAL_ORANGE }} />
          投递来源分布
        </div>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="55%" height={180}>
            <PieChart>
              <Pie
                data={record.sourceDistribution}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={65}
                dataKey="value"
                paddingAngle={2}
              >
                {record.sourceDistribution.map((_: any, i: number) => (
                  <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                ))}
              </Pie>
              <ReTooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2">
            {record.sourceDistribution.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: SOURCE_COLORS[i % SOURCE_COLORS.length] }}
                  />
                  {item.name}
                </span>
                <span className="font-medium text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const columns = [
    {
      title: '职位名称',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800">{text}</span>
            {record.urgent && <Badge color="#F53F3F" text={<span className="text-xs">急招</span>} />}
          </div>
          <div className="text-xs text-gray-400 flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {record.township}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign size={12} />
              {record.salaryMin / 1000}-{record.salaryMax / 1000}K/{record.salaryType === '月薪' ? '月' : record.salaryType === '日薪' ? '日' : '年'}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: '招聘人数',
      dataIndex: 'hiringCount',
      key: 'hiringCount',
      width: 90,
      align: 'center' as const,
      render: (val: number) => (
        <span className="font-medium" style={{ color: INDUSTRIAL_BLUE }}>{val} 人</span>
      ),
    },
    {
      title: '已收简历',
      dataIndex: 'applicationCount',
      key: 'applicationCount',
      width: 100,
      align: 'center' as const,
      render: (val: number) => (
        <span className="font-medium text-gray-700">{val} 份</span>
      ),
    },
    {
      title: '匹配度均分',
      dataIndex: 'avgMatch',
      key: 'avgMatch',
      width: 120,
      align: 'center' as const,
      render: (val: number) => (
        val > 0 ? (
          <div className="flex justify-center">
            <MatchScoreRing score={val} size="sm" showLabel={false} />
          </div>
        ) : <span className="text-gray-400">暂无</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: string) => (
        <Tag color={statusColorMap[status] || 'default'} className="!text-xs">
          {status}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              style={{ color: INDUSTRIAL_BLUE }}
            />
          </Tooltip>
          {record.status === '招聘中' ? (
            <Tooltip title="暂停招聘">
              <Button
                type="text"
                size="small"
                icon={<PauseCircleOutlined />}
                style={{ color: VITAL_ORANGE }}
              />
            </Tooltip>
          ) : record.status === '已暂停' ? (
            <Tooltip title="恢复招聘">
              <Button
                type="text"
                size="small"
                icon={<PlayCircleOutlined />}
                style={{ color: '#00B42A' }}
              />
            </Tooltip>
          ) : (
            <Tooltip title="下架">
              <Button
                type="text"
                size="small"
                icon={<StopOutlined />}
                style={{ color: '#F53F3F' }}
                disabled
              />
            </Tooltip>
          )}
          <Tooltip title="数据详情">
            <Button
              type="text"
              size="small"
              icon={<BarChartOutlined />}
              style={{ color: '#722ED1' }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <Card className="!rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3 flex-1">
            <Input
              placeholder="搜索职位名称"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ maxWidth: 280 }}
            />
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: 140 }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="招聘中">招聘中</Option>
              <Option value="已暂停">已暂停</Option>
              <Option value="已关闭">已关闭</Option>
              <Option value="已结束">已结束</Option>
            </Select>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ backgroundColor: INDUSTRIAL_BLUE }}
          >
            发布新职位
          </Button>
        </div>
      </Card>

      <Card className="!rounded-xl" styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={tableData}
          expandable={{ expandedRowRender }}
          pagination={{
            pageSize: 8,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个职位`,
          }}
          scroll={{ x: 900 }}
        />
      </Card>
    </div>
  );
}
