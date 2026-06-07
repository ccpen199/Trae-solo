import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Menu,
  Card,
  Table,
  Tag,
  Button,
  Statistic,
  Row,
  Col,
  Select,
  message,
  Avatar,
} from 'antd';
import {
  DashboardOutlined,
  ShopOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { statsAPI } from '../../services/api';

const { Header, Sider, Content } = Layout;
const { Option } = Select;

const AdminSettlement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [period, setPeriod] = useState('2025-03');

  useEffect(() => {
    loadSettlements();
  }, [period]);

  const loadSettlements = async () => {
    try {
      setLoading(true);
      const res = await statsAPI.getSettlements({ period });
      setSettlements(res.data || []);
    } catch (error) {
      console.error('加载结算数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { key: '/admin/dashboard', label: '运营仪表盘', icon: <DashboardOutlined /> },
    { key: '/admin/providers', label: '服务商管理', icon: <ShopOutlined /> },
    { key: '/admin/settlement', label: '团长激励结算', icon: <DollarOutlined /> },
  ];

  const totalAmount = settlements.reduce((sum, s) => sum + (s.amount || 0), 0);
  const pendingCount = settlements.filter((s) => s.status === 'pending').length;
  const paidCount = settlements.filter((s) => s.status === 'paid').length;

  const handleSettle = (id: number) => {
    message.success('结算成功');
    loadSettlements();
  };

  const trendChartOption = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '激励金额',
        data: [12500, 15800, 18200, 21000, 19500, 23000],
        type: 'line',
        smooth: true,
        itemStyle: { color: '#FF7A45' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 122, 69, 0.4)' },
              { offset: 1, color: 'rgba(255, 122, 69, 0.05)' },
            ],
          },
        },
      },
    ],
  };

  const columns = [
    {
      title: '服务商',
      dataIndex: 'provider_name',
      key: 'provider_name',
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <Avatar size="small" icon={<ShopOutlined />} className="bg-gradient-to-br from-orange-400 to-orange-600" />
          {text || '未知服务商'}
        </div>
      ),
    },
    { title: '服务类型', dataIndex: 'service_type', key: 'service_type' },
    {
      title: '激励金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span className="font-bold text-orange-500">¥{amount?.toFixed(2) || '0.00'}</span>
      ),
    },
    { title: '结算周期', dataIndex: 'period', key: 'period' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          pending: 'warning',
          paid: 'processing',
          completed: 'success',
        };
        const textMap: Record<string, string> = {
          pending: '待结算',
          paid: '已打款',
          completed: '已完成',
        };
        return <Tag color={colorMap[status] || 'default'}>{textMap[status] || status}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        record.status === 'pending' && (
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleSettle(record.id)}
          >
            确认结算
          </Button>
        )
      ),
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Sider width={240} theme="light" className="border-r">
        <div className="h-16 flex items-center justify-center border-b">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mr-2">
            <DollarOutlined className="text-white" />
          </div>
          <span className="font-bold text-gray-800">运营后台</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={['/admin/settlement']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="border-none"
        />
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <Menu
            mode="inline"
            items={[{ key: 'logout', label: '退出登录', icon: <LogoutOutlined /> }]}
            onClick={() => navigate('/')}
            className="border-none"
          />
        </div>
      </Sider>

      <Layout>
        <Header className="bg-white border-b flex items-center justify-between px-6">
          <h2 className="text-xl font-bold text-gray-800">团长激励结算</h2>
          <Select
            value={period}
            onChange={setPeriod}
            style={{ width: 150 }}
          >
            <Option value="2025-03">2025年3月</Option>
            <Option value="2025-02">2025年2月</Option>
            <Option value="2025-01">2025年1月</Option>
          </Select>
        </Header>

        <Content className="p-6 bg-gray-50">
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="本期激励总额"
                  value={totalAmount}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#FF7A45' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="待结算笔数"
                  value={pendingCount}
                  valueStyle={{ color: '#F59E0B' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="已完成结算"
                  value={paidCount}
                  valueStyle={{ color: '#22C55E' }}
                />
              </Card>
            </Col>
          </Row>

          <Card title="激励趋势" className="mb-6">
            <ReactECharts option={trendChartOption} style={{ height: 300 }} />
          </Card>

          <Card title="结算明细">
            <Table
              columns={columns}
              dataSource={settlements}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminSettlement;
