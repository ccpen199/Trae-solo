import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Menu,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Progress,
  Avatar,
  Spin,
  Select,
  Tabs,
  List,
  Space,
  Divider,
  Alert,
  Button,
} from 'antd';
import {
  DashboardOutlined,
  ShopOutlined,
  UserOutlined,
  DollarOutlined,
  RiseOutlined,
  TeamOutlined,
  FileProtectOutlined,
  BarChartOutlined,
  LogoutOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { statsAPI, providerAPI } from '../../services/api';

const { Header, Sider, Content } = Layout;
const { Option } = Select;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [topDemands, setTopDemands] = useState<any[]>([]);
  const [townCoverage, setTownCoverage] = useState<any[]>([]);
  const [townCoverageDetail, setTownCoverageDetail] = useState<any[]>([]);
  const [renewalList, setRenewalList] = useState<any[]>([]);
  const [disputeTrend, setDisputeTrend] = useState<any[]>([]);
  const [cityOverview, setCityOverview] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');

  const provinces = ['all', '山东省', '河南省', '河北省', '湖北省', '江苏省'];

  useEffect(() => {
    loadData();
  }, [selectedCity]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        statsRes,
        topDemandsRes,
        townCoverageRes,
        townCoverageDetailRes,
        renewalRes,
        disputeTrendRes,
        cityOverviewRes,
      ] = await Promise.all([
        statsAPI.getOverview(),
        statsAPI.getTopDemands(),
        statsAPI.getTownCoverage(),
        statsAPI.getTownCoverageDetail(selectedCity !== 'all' ? selectedCity : undefined),
        providerAPI.getRenewalList(),
        statsAPI.getDisputeTrend(),
        statsAPI.getCityOverview(),
      ]);
      setStats(statsRes.data || {});
      setTopDemands(topDemandsRes.data || []);
      setTownCoverage(townCoverageRes.data || []);
      setTownCoverageDetail(townCoverageDetailRes.data || []);
      setRenewalList(renewalRes.data || []);
      setDisputeTrend(disputeTrendRes.data || []);
      setCityOverview(cityOverviewRes.data || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { key: '/admin/dashboard', label: '运营仪表盘', icon: <DashboardOutlined /> },
    { key: '/admin/providers', label: '服务商管理', icon: <ShopOutlined /> },
    { key: '/admin/settlement', label: '团长激励结算', icon: <DollarOutlined /> },
  ];

  const filterCitiesByProvince = () => {
    if (selectedProvince === 'all') return cityOverview;
    return cityOverview.filter(c => c.province === selectedProvince);
  };

  const barChartOption = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: topDemands.map((d) => d.type),
      axisLabel: { rotate: 30, fontSize: 11 },
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '需求数量',
        data: topDemands.map((d) => d.count),
        type: 'bar',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#FF7A45' },
              { offset: 1, color: '#EA580C' },
            ],
          },
          borderRadius: [8, 8, 0, 0],
        },
        label: {
          show: true,
          position: 'top',
          fontSize: 12,
        },
      },
    ],
  };

  const pieChartOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center', itemWidth: 12, itemHeight: 12 },
    series: [
      {
        name: '需求分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' },
        },
        data: topDemands.slice(0, 6).map((d, i) => ({
          value: d.count,
          name: d.type,
          itemStyle: {
            color: ['#FF7A45', '#3B82F6', '#22C55E', '#8B5CF6', '#F59E0B', '#EF4444'][i],
          },
        })),
      },
    ],
  };

  const disputeTrendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['纠纷总数', '已解决'], bottom: 0 },
    xAxis: {
      type: 'category',
      data: disputeTrend.map((d) => d.date),
      axisLabel: { fontSize: 10, rotate: 45 },
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '纠纷总数',
        type: 'line',
        data: disputeTrend.map((d) => d.total),
        smooth: true,
        itemStyle: { color: '#EF4444' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0.05)' },
            ],
          },
        },
      },
      {
        name: '已解决',
        type: 'line',
        data: disputeTrend.map((d) => d.resolved),
        smooth: true,
        itemStyle: { color: '#22C55E' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(34, 197, 94, 0.3)' },
              { offset: 1, color: 'rgba(34, 197, 94, 0.05)' },
            ],
          },
        },
      },
    ],
  };

  const townCoverageColumns = [
    {
      title: '网格编码',
      dataIndex: 'grid_code',
      key: 'grid_code',
      width: 120,
      render: (code: string) => <Tag color="blue" icon={<EnvironmentOutlined />}>{code}</Tag>,
    },
    {
      title: '所属镇街',
      dataIndex: 'town_name',
      key: 'town_name',
      width: 120,
    },
    {
      title: '网格名称',
      dataIndex: 'grid_name',
      key: 'grid_name',
    },
    {
      title: '服务点数',
      dataIndex: 'poi_count',
      key: 'poi_count',
      width: 100,
      render: (count: number) => (
        <span className={count > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}>
          {count}
        </span>
      ),
    },
    {
      title: '服务商数',
      dataIndex: 'provider_count',
      key: 'provider_count',
      width: 100,
      render: (count: number) => (
        <span className={count > 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}>
          {count}
        </span>
      ),
    },
    {
      title: '需求数',
      dataIndex: 'demand_count',
      key: 'demand_count',
      width: 100,
      render: (count: number) => (
        <span className={count > 0 ? 'text-orange-600 font-medium' : 'text-gray-400'}>
          {count}
        </span>
      ),
    },
    {
      title: '服务状态',
      dataIndex: 'has_service',
      key: 'has_service',
      width: 100,
      render: (has: number) => (
        has === 1
          ? <Tag color="success" icon={<CheckCircleOutlined />}>已覆盖</Tag>
          : <Tag color="error" icon={<ExclamationCircleOutlined />}>待覆盖</Tag>
      ),
    },
  ];

  const cityOverviewColumns = [
    {
      title: '省份',
      dataIndex: 'province',
      key: 'province',
      width: 100,
    },
    {
      title: '地市',
      dataIndex: 'city',
      key: 'city',
      width: 100,
    },
    {
      title: '覆盖网格',
      dataIndex: 'grid_count',
      key: 'grid_count',
      width: 100,
      render: (count: number) => <span className="font-medium">{count}</span>,
    },
    {
      title: '服务点数',
      dataIndex: 'poi_count',
      key: 'poi_count',
      width: 100,
      render: (count: number) => <span className="text-green-600 font-medium">{count}</span>,
    },
    {
      title: '服务商数',
      dataIndex: 'provider_count',
      key: 'provider_count',
      width: 100,
      render: (count: number) => <span className="text-blue-600 font-medium">{count}</span>,
    },
    {
      title: '需求数',
      dataIndex: 'demand_count',
      key: 'demand_count',
      width: 100,
      render: (count: number) => <span className="text-orange-600 font-medium">{count}</span>,
    },
    {
      title: '覆盖率',
      key: 'coverage',
      width: 120,
      render: (_: any, record: any) => {
        const rate = record.grid_count > 0 ? Math.round((record.poi_count / record.grid_count) * 100) : 0;
        return (
          <Progress percent={rate} size="small" showInfo={true} />
        );
      },
    },
  ];

  const renewalColumns = [
    {
      title: '服务商',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <Avatar size="small" icon={<UserOutlined />} />
          {text}
        </div>
      ),
    },
    { title: '服务类型', dataIndex: 'service_type', key: 'service_type' },
    {
      title: '备案状态',
      dataIndex: 'registration_status',
      key: 'registration_status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          registered: 'success',
          pending: 'warning',
          expired: 'error',
        };
        const textMap: Record<string, string> = {
          registered: '已备案',
          pending: '待备案',
          expired: '已过期',
        };
        return <Tag color={colorMap[status] || 'default'}>{textMap[status] || status}</Tag>;
      },
    },
    {
      title: '年审状态',
      dataIndex: 'review_status',
      key: 'review_status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          approved: 'success',
          pending: 'warning',
          expired: 'error',
        };
        const textMap: Record<string, string> = {
          approved: '正常',
          pending: '待审核',
          expired: '已过期',
        };
        return <Tag color={colorMap[status] || 'default'}>{textMap[status] || status}</Tag>;
      },
    },
    {
      title: '年审日期',
      dataIndex: 'annual_review_date',
      key: 'annual_review_date',
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link" size="small" icon={<ClockCircleOutlined />}>年审提醒</Button>
          <Button type="link" size="small" icon={<SafetyCertificateOutlined />}>复查记录</Button>
        </Space>
      ),
    },
  ];

  const getProvinceColor = (province: string) => {
    const map: Record<string, string> = {
      '山东省': '#FF7A45',
      '河南省': '#3B82F6',
      '河北省': '#22C55E',
      '湖北省': '#8B5CF6',
      '江苏省': '#F59E0B',
    };
    return map[province] || '#6B7280';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout className="min-h-screen">
      <Sider width={240} theme="light" className="border-r">
        <div className="h-16 flex items-center justify-center border-b">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mr-2">
            <BarChartOutlined className="text-white" />
          </div>
          <span className="font-bold text-gray-800">运营后台</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={['/admin/dashboard']}
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
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800">县域运营仪表盘</h2>
            <Space>
              <Select
                value={selectedProvince}
                onChange={(val) => { setSelectedProvince(val); setSelectedCity('all'); }}
                style={{ width: 140 }}
                size="small"
              >
                {provinces.map(p => (
                  <Option key={p} value={p}>
                    {p === 'all' ? '全部省份' : p}
                  </Option>
                ))}
              </Select>
              <Select
                value={selectedCity}
                onChange={setSelectedCity}
                style={{ width: 160 }}
                size="small"
              >
                <Option value="all">全部地市</Option>
                {filterCitiesByProvince().map((city: any) => (
                  <Option key={city.city_code} value={city.city_code}>
                    {city.city}
                  </Option>
                ))}
              </Select>
            </Space>
          </div>
          <div className="flex items-center gap-2">
            <Avatar icon={<UserOutlined />} />
            <span>管理员</span>
          </div>
        </Header>

        <Content className="p-6 bg-gray-50">
          <Alert
            message="32个地市精准运营概况"
            description={`当前覆盖 ${stats.totalGrids} 个社区网格，${stats.totalProviders} 家认证服务商，服务覆盖率 ${stats.serviceCoverage}%`}
            type="info"
            showIcon
            className="mb-6"
          />

          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="服务商家总数"
                  value={stats.totalPOIs}
                  prefix={<ShopOutlined className="text-orange-500" />}
                  valueStyle={{ color: '#FF7A45' }}
                />
                <div className="mt-4">
                  <Progress percent={stats.serviceCoverage} size="small" strokeColor="#FF7A45" />
                  <span className="text-xs text-gray-500">服务覆盖率 {stats.serviceCoverage}%</span>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="互助需求总数"
                  value={stats.totalDemands}
                  prefix={<TeamOutlined className="text-blue-500" />}
                  valueStyle={{ color: '#3B82F6' }}
                />
                <div className="mt-4 text-sm text-green-500 flex items-center">
                  <RiseOutlined /> 较上周增长 12%
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="覆盖社区数"
                  value={stats.totalGrids}
                  prefix={<FileProtectOutlined className="text-green-500" />}
                  valueStyle={{ color: '#22C55E' }}
                />
                <div className="mt-4 text-sm text-gray-500">
                  5省32地市
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="纠纷调解成功率"
                  value={stats.disputeResolutionRate}
                  suffix="%"
                  prefix={<RiseOutlined className="text-purple-500" />}
                  valueStyle={{ color: '#8B5CF6' }}
                />
                <div className="mt-4">
                  <Progress percent={stats.disputeResolutionRate} size="small" status="active" strokeColor="#8B5CF6" />
                </div>
              </Card>
            </Col>
          </Row>

          <Tabs
            defaultActiveKey="overview"
            items={[
              {
                key: 'overview',
                label: '县域运营概览',
                children: (
                  <>
                    <Row gutter={[16, 16]} className="mb-6">
                      <Col xs={24} lg={14}>
                        <Card title="需求类型TOP10" className="h-full">
                          <ReactECharts option={barChartOption} style={{ height: 320 }} />
                        </Card>
                      </Col>
                      <Col xs={24} lg={10}>
                        <Card title="需求分布" className="h-full">
                          <ReactECharts option={pieChartOption} style={{ height: 320 }} />
                        </Card>
                      </Col>
                    </Row>

                    <Card title="32地市运营概览" className="mb-6">
                      <Table
                        columns={cityOverviewColumns}
                        dataSource={filterCitiesByProvince()}
                        rowKey="city_code"
                        pagination={{ pageSize: 10 }}
                        size="small"
                      />
                    </Card>

                    <Card title="纠纷调解趋势（近30天）">
                      <ReactECharts option={disputeTrendOption} style={{ height: 300 }} />
                    </Card>
                  </>
                ),
              },
              {
                key: 'coverage',
                label: '镇街服务覆盖率',
                children: (
                  <Card
                    title={
                      <div className="flex items-center justify-between">
                        <span>网格服务覆盖明细</span>
                        <Space>
                          <Tag color="success">
                            已覆盖 {townCoverageDetail.filter(t => t.has_service === 1).length}
                          </Tag>
                          <Tag color="error">
                            待覆盖 {townCoverageDetail.filter(t => t.has_service === 0).length}
                          </Tag>
                        </Space>
                      </div>
                    }
                  >
                    <Table
                      columns={townCoverageColumns}
                      dataSource={townCoverageDetail}
                      rowKey="grid_code"
                      pagination={{ pageSize: 15 }}
                      size="small"
                      scroll={{ y: 500 }}
                    />
                  </Card>
                ),
              },
              {
                key: 'providers',
                label: '服务商年审管理',
                children: (
                  <Card
                    title={
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        年审到期提醒
                      </span>
                    }
                    extra={<Tag color="red">{renewalList.length} 家待处理</Tag>}
                  >
                    <Table
                      columns={renewalColumns}
                      dataSource={renewalList}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                      size="small"
                    />
                  </Card>
                ),
              },
            ]}
          />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminDashboard;
