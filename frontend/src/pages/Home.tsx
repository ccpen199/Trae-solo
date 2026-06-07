import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Avatar,
  List,
  Spin,
  Select,
  Badge,
  Alert,
  Statistic,
  Divider,
  Tabs,
  Table,
  Progress,
  Empty,
  Space,
  Tooltip,
  Breadcrumb,
} from 'antd';
import {
  ShopOutlined,
  CarOutlined,
  UserOutlined,
  ShoppingOutlined,
  ToolOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  ArrowRightOutlined,
  SafetyOutlined,
  BellOutlined,
  SoundOutlined,
  BarChartOutlined,
  RiseOutlined,
  TeamOutlined,
  FileProtectOutlined,
  AlertOutlined,
  FlagOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { demandAPI, poiAPI, statsAPI, gridAPI, announcementAPI } from '../services/api';
import ReactECharts from 'echarts-for-react';

const { Option } = Select;
const { TabPane } = Tabs;

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [demands, setDemands] = useState<any[]>([]);
  const [pois, setPois] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [grids, setGrids] = useState<any[]>([]);
  const [currentGrid, setCurrentGrid] = useState<string>('');
  const [provinceFilter, setProvinceFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [townCoverage, setTownCoverage] = useState<any[]>([]);
  const [topDemands, setTopDemands] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const provinces = ['山东', '河南', '河北', '湖北', '江苏'];
  
  const citiesByProvince: Record<string, { name: string; code: string }[]> = {
    '山东': [
      { name: '济南市', code: '3701' }, { name: '青岛市', code: '3702' },
      { name: '淄博市', code: '3703' }, { name: '烟台市', code: '3706' },
    ],
    '河南': [
      { name: '郑州市', code: '4101' }, { name: '洛阳市', code: '4103' },
      { name: '新乡市', code: '4107' }, { name: '安阳市', code: '4105' },
    ],
    '河北': [
      { name: '石家庄市', code: '1301' }, { name: '唐山市', code: '1302' },
      { name: '保定市', code: '1306' }, { name: '邯郸市', code: '1304' },
    ],
    '湖北': [
      { name: '武汉市', code: '4201' }, { name: '宜昌市', code: '4205' },
      { name: '襄阳市', code: '4206' }, { name: '荆州市', code: '4210' },
    ],
    '江苏': [
      { name: '南京市', code: '3201' }, { name: '苏州市', code: '3205' },
      { name: '无锡市', code: '3202' }, { name: '常州市', code: '3204' },
    ],
  };

  useEffect(() => {
    loadGrids();
  }, []);

  useEffect(() => {
    if (currentGrid) {
      loadData();
    }
  }, [currentGrid]);

  const loadGrids = async () => {
    try {
      const res = await gridAPI.getList();
      setGrids(res.data || []);
      if (res.data?.length > 0) {
        setCurrentGrid(res.data[0].code);
      }
    } catch (error) {
      console.error('加载网格失败:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [demandsRes, poisRes, statsRes, townRes, topDemandsRes, annRes] = await Promise.all([
        demandAPI.getList({ status: 'open', gridCode: currentGrid }),
        poiAPI.getList({ gridCode: currentGrid }),
        statsAPI.getOverview(currentGrid),
        statsAPI.getTownCoverage(),
        statsAPI.getTopDemands(),
        announcementAPI.getList({ gridCode: currentGrid, limit: 5 }),
      ]);
      setDemands(demandsRes.data?.slice(0, 6) || []);
      setPois(poisRes.data?.slice(0, 4) || []);
      setStats(statsRes.data || {});
      setTownCoverage(townRes.data?.slice(0, 10) || []);
      setTopDemands(topDemandsRes.data?.slice(0, 10) || []);
      setAnnouncements(annRes.data || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGrids = grids.filter((g: any) => {
    if (provinceFilter && !g.code.startsWith(provinceFilter)) return false;
    if (cityFilter && !g.code.startsWith(cityFilter)) return false;
    return true;
  });

  const serviceCategories = [
    { icon: <ToolOutlined />, title: '家政维修', type: 'home_service', color: 'from-blue-400 to-blue-600' },
    { icon: <CarOutlined />, title: '拼车出行', type: 'carpool', color: 'from-green-400 to-green-600' },
    { icon: <ShoppingOutlined />, title: '二手交易', type: 'secondhand', color: 'from-purple-400 to-purple-600' },
    { icon: <UserOutlined />, title: '求职招聘', type: 'job', color: 'from-orange-400 to-orange-600' },
    { icon: <ShopOutlined />, title: '外卖美食', type: 'takeaway', color: 'from-red-400 to-red-600' },
    { icon: <HomeOutlined />, title: '便民市场', type: 'market', color: 'from-teal-400 to-teal-600' },
    { icon: <ToolOutlined />, title: '家电维修', type: 'repair', color: 'from-indigo-400 to-indigo-600' },
    { icon: <EnvironmentOutlined />, title: '快递代取', type: 'express', color: 'from-pink-400 to-pink-600' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'status-open';
      case 'accepted': return 'bg-blue-500 text-white';
      case 'completed': return 'bg-gray-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return '待接单';
      case 'accepted': return '进行中';
      case 'completed': return '已完成';
      default: return '已取消';
    }
  };

  const getPOIStatusClass = (status: string) => {
    switch (status) {
      case 'open': return 'status-open';
      case 'closed': return 'status-closed';
      case 'resting': return 'status-resting';
      default: return 'bg-gray-400';
    }
  };

  const getPOIStatusText = (status: string) => {
    switch (status) {
      case 'open': return '营业中';
      case 'closed': return '已打烊';
      case 'resting': return '休息中';
      default: return '未知';
    }
  };

  const handleCategoryClick = (type: string) => {
    navigate('/map', { state: { defaultLayer: type } });
  };

  const currentGridName = grids.find((g: any) => g.code === currentGrid)?.name || '';

  const topDemandChart = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: topDemands.map((d) => d.type),
      axisLabel: { rotate: 45, fontSize: 11 },
    },
    yAxis: { type: 'value' },
    series: [
      {
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
          borderRadius: [6, 6, 0, 0],
        },
      },
    ],
  };

  const townCoverageColumns = [
    {
      title: '镇街',
      dataIndex: 'town_name',
      key: 'town_name',
      width: 120,
    },
    {
      title: '服务覆盖率',
      key: 'coverage',
      width: 200,
      render: (_: any, record: any) => {
        const pct = townCoverage.length > 0 
          ? Math.round((record.poi_count / Math.max(...townCoverage.map((t: any) => t.poi_count))) * 100)
          : 0;
        return <Progress percent={pct} size="small" showInfo />;
      },
    },
    {
      title: '商家数',
      dataIndex: 'poi_count',
      key: 'poi_count',
      width: 80,
      render: (v: number) => <span className="font-semibold text-orange-500">{v}</span>,
    },
    {
      title: '服务商数',
      dataIndex: 'provider_count',
      key: 'provider_count',
      width: 100,
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeInUp">
      <section className="mb-6">
        <Breadcrumb className="mb-4">
          <Breadcrumb.Item onClick={() => setProvinceFilter('')} className="cursor-pointer">
            全部
          </Breadcrumb.Item>
          {provinceFilter && (
            <Breadcrumb.Item onClick={() => setProvinceFilter('')} className="cursor-pointer">
              {provinceFilter}
            </Breadcrumb.Item>
          )}
          {cityFilter && (
            <Breadcrumb.Item>
              {citiesByProvince[provinceFilter]?.find((c) => c.code === cityFilter)?.name}
            </Breadcrumb.Item>
          )}
        </Breadcrumb>

        <Alert
          message={
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <SafetyOutlined className="text-green-500 text-lg" />
                <div>
                  <div className="font-medium">LBS强绑定已启用</div>
                  <div className="text-sm text-gray-500">
                    当前展示：<span className="text-green-600 font-semibold">{currentGridName}</span> 社区网格内服务
                  </div>
                </div>
              </div>
              <div className="ml-auto flex gap-2">
                <Select
                  placeholder="选择省份"
                  style={{ width: 120 }}
                  allowClear
                  value={provinceFilter || undefined}
                  onChange={(v) => { setProvinceFilter(v); setCityFilter(''); }}
                  size="small"
                >
                  {provinces.map((p) => (
                    <Option key={p} value={p}>{p}</Option>
                  ))}
                </Select>
                {provinceFilter && (
                  <Select
                    placeholder="选择城市"
                    style={{ width: 120 }}
                    allowClear
                    value={cityFilter || undefined}
                    onChange={setCityFilter}
                    size="small"
                  >
                    {citiesByProvince[provinceFilter]?.map((c) => (
                      <Option key={c.code} value={c.code}>{c.name}</Option>
                    ))}
                  </Select>
                )}
                <Select
                  value={currentGrid}
                  onChange={setCurrentGrid}
                  style={{ width: 200 }}
                  showSearch
                  size="small"
                >
                  {filteredGrids.map((g: any) => (
                    <Option key={g.code} value={g.code}>{g.name}</Option>
                  ))}
                </Select>
              </div>
            </div>
          }
          type="success"
          showIcon={false}
        />
      </section>

      <section className="mb-8">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Badge status="success" />
              <span className="text-white/80">32个地市 · 精准运营中</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Noto Serif SC, serif' }}>
              县域生活服务平台
            </h1>
            <p className="text-white/90 text-lg mb-6 max-w-2xl">
              聚焦山东、河南、河北、湖北、江苏32个地市，为您提供本地化的生活服务、邻里互助、社区公告等一站式服务
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button
                type="default"
                size="large"
                className="bg-white text-orange-600 hover:bg-orange-50 border-none font-semibold"
                onClick={() => navigate('/map')}
              >
                <EnvironmentOutlined /> 查看服务地图
              </Button>
              <Button
                type="default"
                size="large"
                className="bg-transparent text-white border-2 border-white hover:bg-white/20 font-semibold"
                onClick={() => navigate('/demands/publish')}
              >
                发布互助需求
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={12} sm={6} lg={3}>
          <Card className="text-center">
            <Statistic
              title="本网格商家"
              value={pois.length}
              prefix={<ShopOutlined className="text-orange-500" />}
              valueStyle={{ color: '#FF7A45' }}
            />
            <div className="mt-2 text-xs text-gray-400">
              全县域 {stats.totalPOIs} 个
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card className="text-center">
            <Statistic
              title="本网格需求"
              value={demands.length}
              prefix={<TeamOutlined className="text-blue-500" />}
              valueStyle={{ color: '#3B82F6' }}
            />
            <div className="mt-2 text-xs text-gray-400">
              全县域 {stats.totalDemands} 个
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card className="text-center">
            <Statistic
              title="服务覆盖率"
              value={stats.serviceCoverage || 0}
              suffix="%"
              prefix={<RiseOutlined className="text-green-500" />}
              valueStyle={{ color: '#22C55E' }}
            />
            <div className="mt-2">
              <Progress percent={stats.serviceCoverage || 0} size="small" />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card className="text-center">
            <Statistic
              title="纠纷调解成功率"
              value={stats.disputeResolutionRate || 0}
              suffix="%"
              prefix={<FileProtectOutlined className="text-purple-500" />}
              valueStyle={{ color: '#8B5CF6' }}
            />
            <div className="mt-2 text-xs text-gray-400">
              待处理 {stats.pendingDisputes || 0} 件
            </div>
          </Card>
        </Col>
      </Row>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center" style={{ fontFamily: 'Noto Serif SC, serif' }}>
            <span className="gradient-text">32个地市运营概览</span>
            <Tag color="blue" className="ml-3">县域运营视角</Tag>
          </h2>
          <Button type="link" onClick={() => navigate('/admin/dashboard')}>
            <BarChartOutlined /> 运营仪表盘
          </Button>
        </div>

        <Card>
          <Tabs defaultActiveKey="coverage">
            <TabPane tab={<span><BarChartOutlined /> 镇街覆盖率</span>} key="coverage">
              <Table
                dataSource={townCoverage}
                columns={townCoverageColumns}
                pagination={false}
                size="small"
              />
            </TabPane>
            <TabPane tab={<span><ShopOutlined /> 需求TOP10</span>} key="topDemands">
              <ReactECharts option={topDemandChart} style={{ height: 320 }} />
            </TabPane>
            <TabPane tab={<span><FlagOutlined /> 五省覆盖</span>} key="provinces">
              <Row gutter={[16, 16]}>
                {provinces.map((province, idx) => {
                  const count = grids.filter((g: any) => g.code.startsWith(
                    province === '山东' ? '37' : 
                    province === '河南' ? '41' : 
                    province === '河北' ? '13' : 
                    province === '湖北' ? '42' : '32'
                  )).length;
                  const colors = [
                    'from-red-400 to-red-600',
                    'from-orange-400 to-orange-600',
                    'from-yellow-400 to-yellow-600',
                    'from-green-400 to-green-600',
                    'from-blue-400 to-blue-600',
                  ];
                  return (
                    <Col xs={24} sm={12} lg={4} key={province}>
                      <div className={`rounded-xl p-6 bg-gradient-to-br ${colors[idx]} text-white cursor-pointer hover:scale-105 transition-transform`}>
                        <div className="text-3xl font-bold mb-1">{count}</div>
                        <div className="text-white/90">{province}</div>
                        <div className="text-white/70 text-sm mt-2">{count * 2} 个社区</div>
                      </div>
                    </Col>
                  );
                })}
                <Col xs={24} sm={12} lg={4}>
                  <div className="rounded-xl p-6 bg-gradient-to-br from-gray-100 to-gray-200 h-full flex flex-col justify-center">
                    <div className="text-3xl font-bold text-gray-700 mb-1">{stats.totalGrids || 40}</div>
                    <div className="text-gray-600">覆盖社区</div>
                    <div className="text-gray-500 text-sm mt-2">5省 32地市</div>
                  </div>
                </Col>
              </Row>
            </TabPane>
          </Tabs>
        </Card>
      </section>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center" style={{ fontFamily: 'Noto Serif SC, serif' }}>
            <span className="gradient-text">便民服务</span>
            <span className="ml-auto text-sm font-normal text-gray-500">
              本网格共 {pois.length} 个服务点
            </span>
          </h2>
        </div>
        
        <Row gutter={[16, 16]}>
          {serviceCategories.map((category, idx) => {
            const count = pois.filter((p: any) => p.type === category.type).length;
            return (
              <Col xs={12} sm={8} md={6} lg={3} key={idx}>
                <Card
                  className="card-hover cursor-pointer text-center h-full"
                  onClick={() => handleCategoryClick(category.type)}
                  styles={{ body: { padding: '24px 16px' } }}
                >
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                    <span className="text-2xl text-white">{category.icon}</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">{category.title}</h3>
                  <p className="text-sm text-gray-500">
                    <span className="text-orange-500 font-bold">{count}</span> 个服务点
                  </p>
                </Card>
              </Col>
            );
          })}
        </Row>
      </section>

      <Row gutter={[16, 16]} className="mb-12">
        <Col xs={24} lg={16}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center" style={{ fontFamily: 'Noto Serif SC, serif' }}>
              <span className="gradient-text">邻里互助</span>
              <span className="ml-3 text-sm font-normal text-gray-500">
                {currentGridName} · 实时需求
              </span>
            </h2>
            <Button type="link" onClick={() => navigate('/demands')}>
              查看全部 <ArrowRightOutlined />
            </Button>
          </div>

          {demands.length === 0 ? (
            <Card className="text-center py-12">
              <Empty description="当前网格暂无需求" />
              <Button type="primary" className="mt-4" onClick={() => navigate('/demands/publish')}>
                发布第一个需求
              </Button>
            </Card>
          ) : (
            <Row gutter={[16, 16]}>
              {demands.map((demand: any) => (
                <Col xs={24} md={12} key={demand.id}>
                  <Card 
                    className="card-hover h-full cursor-pointer" 
                    onClick={() => navigate(`/demands/${demand.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex flex-col gap-1">
                        <Tag color="orange">{demand.type}</Tag>
                        {demand.scene && (
                          <Tag color="blue" className="text-xs">
                            {demand.scene === 'neighbor' ? '邻里互助' : demand.scene}
                          </Tag>
                        )}
                        {demand.recommend_chain && (
                          <Tag color="green" className="text-xs">
                            {demand.recommend_chain === 'same_community' ? '同小区' : demand.recommend_chain}
                          </Tag>
                        )}
                      </div>
                      <Tag className={getStatusColor(demand.status)}>{getStatusText(demand.status)}</Tag>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2 line-clamp-1">{demand.title}</h3>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{demand.description}</p>
                    {demand.service_time && (
                      <div className="text-xs text-gray-400 mb-2">
                        <EnvironmentOutlined className="mr-1" />
                        {demand.service_time} · {demand.address || '本社区'}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Avatar size="small" icon={<UserOutlined />} className="mr-2" />
                        <span className="text-sm text-gray-600">{demand.publisher_name || '社区居民'}</span>
                      </div>
                      <span className="text-orange-500 font-semibold">¥{demand.reward}</span>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center" style={{ fontFamily: 'Noto Serif SC, serif' }}>
              <span className="gradient-text">社区公告</span>
            </h2>
            <Button type="link" onClick={() => navigate('/announcements')}>
              全部 <ArrowRightOutlined />
            </Button>
          </div>

          <Card className="h-full">
            {announcements.length === 0 ? (
              <Empty description="暂无公告" />
            ) : (
              <List
                dataSource={announcements.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item
                    className="cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2"
                    onClick={() => navigate('/announcements')}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={item.type === 'policy' ? <SafetyOutlined /> : item.type === 'warning' ? <AlertOutlined /> : <BellOutlined />}
                          style={{ 
                            backgroundColor: item.type === 'policy' ? '#1890ff' : 
                                            item.type === 'warning' ? '#ff4d4f' : 
                                            item.type === 'activity' ? '#fa8c16' : '#52c41a' 
                          }}
                          size="small"
                        />
                      }
                      title={
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium line-clamp-1">{item.title}</span>
                          {item.priority === 2 && <Tag color="red" style={{ fontSize: '10px', padding: '0 4px' }}>重要</Tag>}
                        </div>
                      }
                      description={
                        <div className="text-xs text-gray-400">
                          {item.publisher} · {item.created_at?.split('T')[0]}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
            
            <Divider />
            
            <Space className="w-full" direction="vertical" size="middle">
              <Button block icon={<BellOutlined />} onClick={() => navigate('/announcements')}>
                查看全部公告
              </Button>
              <Button block icon={<SoundOutlined />} onClick={() => navigate('/dialect-search')}>
                方言搜索服务
              </Button>
              <Button block icon={<BarChartOutlined />} onClick={() => navigate('/admin/dashboard')}>
                运营数据大屏
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center" style={{ fontFamily: 'Noto Serif SC, serif' }}>
            <span className="gradient-text">本地商家</span>
            <span className="ml-3 text-sm font-normal text-gray-500">
              {currentGridName} · 精选推荐
            </span>
          </h2>
          <Button type="link" onClick={() => navigate('/services')}>
            查看全部 <ArrowRightOutlined />
          </Button>
        </div>

        {pois.length === 0 ? (
          <Card className="text-center py-12">
            <Empty description="当前网格暂无商家" />
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {pois.slice(0, 4).map((poi: any) => (
              <Col xs={24} sm={12} lg={6} key={poi.id}>
                <Card
                  className="card-hover h-full cursor-pointer"
                  onClick={() => navigate(`/services/${poi.id}`)}
                  cover={
                    <div className="h-40 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center relative overflow-hidden">
                      <ShopOutlined className="text-5xl text-orange-400" />
                      <div className="absolute top-3 right-3">
                        <Tag className={getPOIStatusClass(poi.business_status)}>
                          {getPOIStatusText(poi.business_status)}
                        </Tag>
                      </div>
                    </div>
                  }
                >
                  <Card.Meta
                    title={
                      <div className="flex items-center justify-between">
                        <span className="font-semibold truncate">{poi.name}</span>
                      </div>
                    }
                    description={
                      <div>
                        <p className="text-gray-500 text-sm truncate mb-1">{poi.address}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-orange-500">¥{poi.avg_cost}/人</span>
                          <span className="text-yellow-500">⭐ {poi.rating?.toFixed(1)}</span>
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </section>

      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-orange-500 mb-2">{stats.totalPOIs || 0}</div>
            <div className="text-gray-600">全县域商家</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-500 mb-2">{stats.totalDemands || 0}</div>
            <div className="text-gray-600">全县域需求</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-500 mb-2">{stats.serviceCoverage || 0}%</div>
            <div className="text-gray-600">服务覆盖率</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-500 mb-2">{stats.totalGrids || 40}</div>
            <div className="text-gray-600">覆盖社区</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
