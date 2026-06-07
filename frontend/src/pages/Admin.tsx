import React, { useEffect, useState } from 'react';
import {
  Card,
  Tabs,
  Table,
  Statistic,
  Row,
  Col,
  Spin,
  message,
  Tag,
  Space,
  Descriptions,
  Avatar,
  Rate,
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  BuildOutlined,
  FileTextOutlined,
  TeamOutlined,
  SwapOutlined,
  DollarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  getDashboard,
  getPriceAlerts,
  getSchoolHeat,
  getAgentRanking,
} from '@/api';

interface PriceAlert {
  district: string;
  current_month: string;
  current_price: number;
  previous_price: number;
  change_percent: number;
  current_volume: number;
}

interface SchoolHeatItem {
  school_district: string;
  building_count: number;
  avg_price: number;
  listing_count: number;
}

interface AgentRankItem {
  id: number;
  name: string;
  phone: string;
  agency: string;
  rating: number;
  showing_count: number;
  deal_count: number;
  commission_total: number;
}

const Admin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState<any>({});
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [schoolHeat, setSchoolHeat] = useState<SchoolHeatItem[]>([]);
  const [agentRank, setAgentRank] = useState<AgentRankItem[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dRes, pRes, sRes, aRes]: any[] = await Promise.all([
        getDashboard(),
        getPriceAlerts(),
        getSchoolHeat(),
        getAgentRanking(),
      ]);
      setDashboard(dRes || {});
      setPriceAlerts(Array.isArray(pRes) ? pRes : []);
      setSchoolHeat(Array.isArray(sRes) ? sRes : []);
      setAgentRank(Array.isArray(aRes) ? aRes : []);
    } catch {
      message.error('获取管理数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const priceAlertColumns = [
    { title: '区域', dataIndex: 'district', key: 'district', width: 100 },
    { title: '月份', dataIndex: 'current_month', key: 'current_month', width: 100 },
    { title: '当前均价', dataIndex: 'current_price', key: 'current_price', render: (v: number) => `${v.toLocaleString()}元/㎡`, width: 120 },
    { title: '上期均价', dataIndex: 'previous_price', key: 'previous_price', render: (v: number) => `${v.toLocaleString()}元/㎡`, width: 120 },
    {
      title: '涨跌幅',
      dataIndex: 'change_percent',
      key: 'change_percent',
      width: 120,
      render: (v: number) => (
        <span style={{ color: v >= 0 ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}>
          {v >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(v).toFixed(2)}%
        </span>
      ),
      sorter: (a: PriceAlert, b: PriceAlert) => a.change_percent - b.change_percent,
    },
    { title: '成交量', dataIndex: 'current_volume', key: 'current_volume', width: 100 },
  ];

  const agentColumns = [
    { title: '排名', key: 'rank', render: (_: any, __: any, i: number) => i + 1, width: 70 },
    {
      title: '经纪人',
      key: 'name',
      width: 180,
      render: (_: any, record: AgentRankItem) => (
        <Space>
          <Avatar size={32} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>{record.agency}</div>
          </div>
        </Space>
      ),
    },
    { title: '评分', dataIndex: 'rating', key: 'rating', width: 120, render: (v: number) => <Rate disabled value={v} style={{ fontSize: 12 }} /> },
    { title: '带看数', dataIndex: 'showing_count', key: 'showing_count', width: 100, sorter: (a: AgentRankItem, b: AgentRankItem) => a.showing_count - b.showing_count },
    { title: '成交数', dataIndex: 'deal_count', key: 'deal_count', width: 100, sorter: (a: AgentRankItem, b: AgentRankItem) => a.deal_count - b.deal_count },
    {
      title: '佣金总额',
      dataIndex: 'commission_total',
      key: 'commission_total',
      width: 140,
      render: (v: number) => <span className="price-text">¥{(v / 10000).toFixed(0)}万</span>,
      sorter: (a: AgentRankItem, b: AgentRankItem) => a.commission_total - b.commission_total,
    },
  ];

  const schoolChartData = schoolHeat.slice(0, 10).map((item) => ({
    name: item.school_district,
    房源数: item.listing_count,
    楼盘数: item.building_count,
    均价: Math.round(item.avg_price / 10000),
  }));

  const overviewStats = [
    { title: '楼盘总数', value: dashboard.total_buildings ?? 0, icon: <BuildOutlined />, color: '#1677ff' },
    { title: '房源总数', value: dashboard.total_listings ?? 0, icon: <FileTextOutlined />, color: '#52c41a' },
    { title: '经纪人数量', value: dashboard.total_agents ?? 0, icon: <TeamOutlined />, color: '#722ed1' },
    { title: '本月成交', value: dashboard.deals_this_month ?? 0, icon: <SwapOutlined />, color: '#fa8c16' },
    { title: '佣金总额', value: dashboard.total_commission ? `¥${(dashboard.total_commission / 10000).toFixed(0)}万` : '¥0', icon: <DollarOutlined />, color: '#13c2c2' },
    { title: '城市均价', value: dashboard.avg_city_price ? `${(dashboard.avg_city_price / 10000).toFixed(1)}万/㎡` : '-', icon: <BuildOutlined />, color: '#eb2f96' },
  ];

  const tabItems = [
    {
      key: 'overview',
      label: '数据概览',
      children: (
        <Spin spinning={loading}>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {overviewStats.map((stat, i) => (
              <Col xs={12} sm={8} md={6} lg={4} key={i}>
                <Card>
                  <Statistic
                    title={stat.title}
                    value={stat.value}
                    prefix={React.cloneElement(stat.icon as any, { style: { color: stat.color } })}
                    valueStyle={{ color: stat.color }}
                  />
                </Card>
              </Col>
            ))}
          </Row>

          <Card title="学区热度 Top 10">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={schoolChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-30} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="房源数" name="房源数量" fill="#1677ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="楼盘数" name="楼盘数量" fill="#52c41a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Spin>
      ),
    },
    {
      key: 'price',
      label: '房价预警',
      children: (
        <Card title="区域房价波动预警（涨跌幅超5%）">
          <Descriptions size="small" style={{ marginBottom: 16 }} column={3}>
            <Descriptions.Item label="预警区域">{priceAlerts.length}个</Descriptions.Item>
            <Descriptions.Item label="上涨区域">{priceAlerts.filter(a => a.change_percent > 0).length}个</Descriptions.Item>
            <Descriptions.Item label="下跌区域">{priceAlerts.filter(a => a.change_percent < 0).length}个</Descriptions.Item>
          </Descriptions>
          <Table
            columns={priceAlertColumns}
            dataSource={priceAlerts}
            rowKey={(record, i) => `${record.district}-${i}`}
            pagination={{ pageSize: 10 }}
            size="middle"
          />
        </Card>
      ),
    },
    {
      key: 'school',
      label: '学区热度',
      children: (
        <Card title="学区热度图谱">
          <ResponsiveContainer width="100%" height={450}>
            <BarChart data={schoolChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={140} />
              <Tooltip />
              <Legend />
              <Bar dataKey="房源数" name="在售房源" fill="#1677ff" radius={[0, 4, 4, 0]} />
              <Bar dataKey="均价" name="均价(万/㎡)" fill="#fa8c16" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <Table
            style={{ marginTop: 24 }}
            columns={[
              { title: '排名', key: 'rank', render: (_: any, __: any, i: number) => i + 1, width: 70 },
              { title: '学区', dataIndex: 'school_district', key: 'school_district' },
              { title: '楼盘数量', dataIndex: 'building_count', key: 'building_count' },
              { title: '在售房源', dataIndex: 'listing_count', key: 'listing_count' },
              { title: '小区均价', dataIndex: 'avg_price', key: 'avg_price', render: (v: number) => `${(v / 10000).toFixed(1)}万/㎡` },
            ]}
            dataSource={schoolHeat}
            rowKey={(record, i) => `${record.school_district}-${i}`}
            pagination={{ pageSize: 10 }}
            size="middle"
          />
        </Card>
      ),
    },
    {
      key: 'agent',
      label: '经纪人排行',
      children: (
        <Card title="经纪人服务质量排行榜">
          <Descriptions size="small" style={{ marginBottom: 16 }} column={3}>
            <Descriptions.Item label="在岗经纪人">{agentRank.length}人</Descriptions.Item>
            <Descriptions.Item label="总成交数">{agentRank.reduce((sum, a) => sum + a.deal_count, 0)}单</Descriptions.Item>
            <Descriptions.Item label="平均评分">{agentRank.length > 0 ? (agentRank.reduce((sum, a) => sum + a.rating, 0) / agentRank.length).toFixed(1) : 0}</Descriptions.Item>
          </Descriptions>
          <Table
            columns={agentColumns}
            dataSource={agentRank}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="middle"
          />
        </Card>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>后台管理</h2>
        <p>数据概览、区域房价波动预警、学区热度图谱与经纪人服务质量排行榜</p>
      </div>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
};

export default Admin;
