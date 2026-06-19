import { useEffect, useState } from 'react';
import { Card, Table, Tag, Input, Select, Space, Button, Spin, Progress, App as AntdApp } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import type { ProjectItem } from '../services/investorApi';
import DeviceStatusBadge from '../components/DeviceStatusBadge';

const mockProjects: ProjectItem[] = [
  {
    id: 'P001',
    name: '上海浦东新区商业综合体供水项目',
    location: '上海市浦东新区',
    deviceCount: 128,
    investment: 680000,
    revenue: 285600,
    roi: 42.0,
    onlineRate: 96.8,
    status: 'active',
    createTime: '2023-06-15',
  },
  {
    id: 'P002',
    name: '北京朝阳区写字楼群供水改造',
    location: '北京市朝阳区',
    deviceCount: 86,
    investment: 420000,
    revenue: 168500,
    roi: 40.1,
    onlineRate: 95.3,
    status: 'active',
    createTime: '2023-07-20',
  },
  {
    id: 'P003',
    name: '深圳南山区科技园供水系统',
    location: '深圳市南山区',
    deviceCount: 156,
    investment: 820000,
    revenue: 328000,
    roi: 40.0,
    onlineRate: 97.2,
    status: 'active',
    createTime: '2023-05-10',
  },
  {
    id: 'P004',
    name: '杭州西湖区酒店供水工程',
    location: '杭州市西湖区',
    deviceCount: 42,
    investment: 180000,
    revenue: 52200,
    roi: 29.0,
    onlineRate: 98.5,
    status: 'active',
    createTime: '2023-08-25',
  },
  {
    id: 'P005',
    name: '广州天河区医院供水项目',
    location: '广州市天河区',
    deviceCount: 68,
    investment: 360000,
    revenue: 98400,
    roi: 27.3,
    onlineRate: 92.6,
    status: 'active',
    createTime: '2023-09-12',
  },
  {
    id: 'P006',
    name: '成都高新区工业园区供水',
    location: '成都市高新区',
    deviceCount: 6,
    investment: 120000,
    revenue: 3500,
    roi: 2.9,
    onlineRate: 0,
    status: 'pending',
    createTime: '2024-06-01',
  },
];

const statusMap: Record<string, { text: string; color: string }> = {
  active: { text: '运营中', color: 'success' },
  pending: { text: '部署中', color: 'processing' },
  stopped: { text: '已停止', color: 'default' },
};

const Projects = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProjectItem[]>(mockProjects);
  const [filtered, setFiltered] = useState<ProjectItem[]>(mockProjects);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setData(mockProjects);
        setFiltered(mockProjects);
      } catch {
        message.error('获取项目列表失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [message]);

  useEffect(() => {
    let result = data;
    if (keyword) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(keyword.toLowerCase()) ||
          p.location.toLowerCase().includes(keyword.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }
    setFiltered(result);
  }, [keyword, statusFilter, data]);

  const handleReload = () => {
    setKeyword('');
    setStatusFilter('all');
    setFiltered(data);
    message.success('数据已刷新');
  };

  const columns: ColumnsType<ProjectItem> = [
    {
      title: '项目信息',
      dataIndex: 'name',
      key: 'name',
      width: 280,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, color: '#1f1f1f', marginBottom: 4 }}>
            {record.name}
          </div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
            {record.location} · {record.createTime}
          </div>
        </div>
      ),
    },
    {
      title: '设备数',
      dataIndex: 'deviceCount',
      key: 'deviceCount',
      width: 100,
      align: 'center',
      render: (val: number) => (
        <div style={{ fontWeight: 500 }}>{val} 台</div>
      ),
    },
    {
      title: '投资额',
      dataIndex: 'investment',
      key: 'investment',
      width: 140,
      align: 'right',
      render: (val: number) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1890ff' }}>¥{(val / 10000).toFixed(1)}万</div>
        </div>
      ),
    },
    {
      title: '累计收益',
      dataIndex: 'revenue',
      key: 'revenue',
      width: 140,
      align: 'right',
      render: (val: number, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#52c41a' }}>¥{(val / 10000).toFixed(1)}万</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
            占投资 {(record.revenue / record.investment * 100).toFixed(1)}%
          </div>
        </div>
      ),
    },
    {
      title: 'ROI',
      dataIndex: 'roi',
      key: 'roi',
      width: 180,
      render: (val: number) => {
        const isGood = val >= 30;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Progress
              percent={val}
              size={[80, 6]}
              showInfo={false}
              strokeColor={isGood ? '#52c41a' : val >= 20 ? '#faad14' : '#ff4d4f'}
              trailColor="#f0f0f0"
            />
            <span
              style={{
                fontWeight: 600,
                color: isGood ? '#52c41a' : val >= 20 ? '#faad14' : '#ff4d4f',
              }}
            >
              {val.toFixed(1)}%
            </span>
          </div>
        );
      },
    },
    {
      title: '在线率',
      dataIndex: 'onlineRate',
      key: 'onlineRate',
      width: 140,
      render: (val: number, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <DeviceStatusBadge status={val > 90 ? 'online' : val > 0 ? 'fault' : 'offline'} size="small" />
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
            {record.status === 'pending' ? '待部署' : `${val.toFixed(1)}%`}
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const cfg = statusMap[status];
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate('/device/' + record.id)}
          >
            详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Input
              placeholder="搜索项目名称或地址"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 280 }}
              allowClear
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 140 }}
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'active', label: '运营中' },
                { value: 'pending', label: '部署中' },
                { value: 'stopped', label: '已停止' },
              ]}
            />
          </div>
          <Button icon={<ReloadOutlined />} onClick={handleReload}>
            刷新
          </Button>
        </div>
      </Card>

      <Card bordered={false} style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
        <Spin spinning={loading}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">项目列表</span>
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#595959' }}>
              <span>
                共 <strong style={{ color: '#1890ff' }}>{filtered.length}</strong> 个项目
              </span>
              <span>
                总投资 <strong style={{ color: '#1f1f1f' }}>
                  ¥{(filtered.reduce((s, p) => s + p.investment, 0) / 10000).toFixed(0)}万
                </strong>
              </span>
              <span>
                总收益 <strong style={{ color: '#52c41a' }}>
                  ¥{(filtered.reduce((s, p) => s + p.revenue, 0) / 10000).toFixed(0)}万
                </strong>
                <ArrowUpOutlined style={{ color: '#52c41a', marginLeft: 4 }} />
              </span>
            </div>
          </div>
          <Table
            columns={columns}
            dataSource={filtered}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 条`,
            }}
            scroll={{ x: 1200 }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default Projects;
