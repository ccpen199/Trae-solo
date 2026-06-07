import React, { useState, useEffect } from 'react';
import { Row, Col, Card, List, Tag, Button, Input, Space, Badge, Progress, Statistic, Avatar, Divider, Tooltip } from 'antd';
import {
  FireOutlined, IdcardOutlined, FileTextOutlined, AppstoreOutlined,
  RightOutlined, SearchOutlined, CheckCircleOutlined, ClockCircleOutlined,
  SafetyCertificateOutlined, ExclamationCircleOutlined, TeamOutlined,
  UserOutlined, CloudOutlined, CalculatorOutlined, BellOutlined,
  AuditOutlined, ApartmentOutlined, AlertOutlined, StarOutlined,
  SafetyOutlined, SwapOutlined, ToolOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useUserStore } from '../store/user';

const { Search } = Input;

function Home() {
  const navigate = useNavigate();
  const { user, isElderMode } = useUserStore();
  const [hotServices, setHotServices] = useState([]);
  const [news, setNews] = useState([]);
  const [weather, setWeather] = useState(null);
  const [certs, setCerts] = useState([]);
  const [applications, setApplications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allServices, setAllServices] = useState([]);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try { setHotServices(await api.get('/services/items?hot=1')); } catch (e) {}
    try { setNews(await api.get('/policy/news?limit=5')); } catch (e) {}
    try { setWeather(await api.get('/city/weather')); } catch (e) {}
    try { setCerts(await api.get('/certificates')); } catch (e) {}
    try {
      const apps = await api.get('/applications');
      setApplications(apps);
    } catch (e) {}
    try { setCategories(await api.get('/services/categories')); } catch (e) {}
    try { setAllServices(await api.get('/services/items')); } catch (e) {}
  };

  const handleSearch = (value) => {
    navigate(`/guide?query=${encodeURIComponent(value)}`);
  };

  const activeCerts = certs.filter(c => c.status === 'active').length;
  const pendingApps = applications.filter(a => ['submitted', 'processing'].includes(a.status)).length;
  const completedApps = applications.filter(a => a.status === 'completed').length;
  const reviewingApps = applications.filter(a => a.status === 'submitted').length;

  const certEntry = {
    icon: <IdcardOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
    title: '电子证照',
    stats: `${activeCerts} 张有效`,
    actions: [
      { label: '申领', path: '/certificates', primary: true },
      { label: '亮证', path: '/certificates' },
      { label: '核验', path: '/certificates' }
    ],
    color: '#1890ff'
  };

  const serviceEntry = {
    icon: <AppstoreOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
    title: '服务大厅',
    stats: `${allServices.length} 项服务`,
    actions: [
      { label: '个人办事', path: '/services', primary: true },
      { label: '法人办事', path: '/services' },
      { label: '导办', path: '/guide' }
    ],
    color: '#52c41a'
  };

  const appEntry = {
    icon: <FileTextOutlined style={{ fontSize: 32, color: '#fa8c16' }} />,
    title: '我的办件',
    stats: pendingApps > 0 ? `${pendingApps} 件办理中` : '暂无办件',
    actions: [
      { label: '进度追踪', path: '/applications', primary: true },
      { label: '评价反馈', path: '/applications' },
      { label: '历史记录', path: '/applications' }
    ],
    color: '#fa8c16'
  };

  const policyEntry = {
    icon: <CalculatorOutlined style={{ fontSize: 32, color: '#eb2f96' }} />,
    title: '政策速递',
    stats: `${news.length} 条更新`,
    actions: [
      { label: '政策计算器', path: '/policy', primary: true },
      { label: '社保试算', path: '/policy' },
      { label: '个税计算', path: '/policy' }
    ],
    color: '#eb2f96'
  };

  const quickEntries = [certEntry, serviceEntry, appEntry, policyEntry];

  const getCertFlow = () => {
    if (activeCerts === 0) return { step: 0, text: '申领证照', desc: '开始申领您的第一张电子证照' };
    return { step: 1, text: '亮证/核验', desc: `已有${activeCerts}张有效证照，可亮证或核验` };
  };

  const getAppFlow = () => {
    if (applications.length === 0) return { step: 0, text: '开始办事', desc: '选择服务事项，在线办理' };
    if (reviewingApps > 0) return { step: 1, text: '审核中', desc: `${reviewingApps}件正在审核` };
    if (completedApps > 0) return { step: 3, text: '已办结', desc: `${completedApps}件已办结，请评价` };
    return { step: 2, text: '办理中', desc: `${pendingApps}件正在办理` };
  };

  const getCategoryStats = (catId) => {
    const items = allServices.filter(s => s.category_id === catId);
    return items.length;
  };

  return (
    <div>
      <Card style={{ marginBottom: 16, background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', color: 'white', borderRadius: 12 }}
        styles={{ body: { padding: isElderMode ? '32px 24px' : '28px 24px' } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h2 style={{ color: 'white', marginBottom: 8, fontSize: isElderMode ? 24 : 20 }}>
              {user ? `${user.name}，您好` : '欢迎使用政务服务平台'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 16 }}>
              省级一体化移动政务服务平台 · 让数据多跑路，让群众少跑腿
            </p>
            <Search
              placeholder="搜索服务事项、政策..."
              size="large"
              onSearch={handleSearch}
              style={{ maxWidth: 480 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            {weather && (
              <div style={{ textAlign: 'center' }}>
                <CloudOutlined style={{ fontSize: 28, color: 'rgba(255,255,255,0.9)' }} />
                <div style={{ fontSize: 32, fontWeight: 'bold' }}>{weather.temperature}°C</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{weather.weather}</div>
              </div>
            )}
            <div style={{ textAlign: 'center' }}>
              <Badge count={pendingApps} size="small">
                <BellOutlined style={{ fontSize: 28, color: 'rgba(255,255,255,0.9)' }} />
              </Badge>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>
                {pendingApps > 0 ? `${pendingApps}件待办` : '无待办'}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card hoverable onClick={() => navigate('/certificates')}
            styles={{ body: { padding: isElderMode ? 24 : 20 } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Avatar size={48} style={{ backgroundColor: '#e6f7ff' }}>
                <IdcardOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              </Avatar>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: isElderMode ? 18 : 15 }}>电子证照</div>
                <div style={{ fontSize: 12, color: '#999' }}>{activeCerts}张有效证照</div>
              </div>
            </div>
            <Progress
              percent={activeCerts > 0 ? Math.min(activeCerts * 33, 100) : 0}
              size="small"
              strokeColor="#1890ff"
              format={() => getCertFlow().text}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Button size="small" type="primary" onClick={(e) => { e.stopPropagation(); navigate('/certificates'); }}>申领</Button>
              <Button size="small" onClick={(e) => { e.stopPropagation(); navigate('/certificates'); }}>亮证</Button>
              <Button size="small" onClick={(e) => { e.stopPropagation(); navigate('/certificates'); }}>核验</Button>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable onClick={() => navigate('/services')}
            styles={{ body: { padding: isElderMode ? 24 : 20 } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Avatar size={48} style={{ backgroundColor: '#f6ffed' }}>
                <AppstoreOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              </Avatar>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: isElderMode ? 18 : 15 }}>服务大厅</div>
                <div style={{ fontSize: 12, color: '#999' }}>{allServices.length}项可办</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <Tag color="blue">
                <UserOutlined /> 个人办事
              </Tag>
              <Tag color="green">
                <TeamOutlined /> 法人办事
              </Tag>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Button size="small" type="primary" onClick={(e) => { e.stopPropagation(); navigate('/services'); }}>进入大厅</Button>
              <Button size="small" onClick={(e) => { e.stopPropagation(); navigate('/guide'); }}>智能导办</Button>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable onClick={() => navigate('/applications')}
            styles={{ body: { padding: isElderMode ? 24 : 20 } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Avatar size={48} style={{ backgroundColor: '#fff7e6' }}>
                <FileTextOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
              </Avatar>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: isElderMode ? 18 : 15 }}>我的办件</div>
                <div style={{ fontSize: 12, color: '#999' }}>
                  {pendingApps > 0 ? `${pendingApps}件办理中` : '暂无办件'}
                </div>
              </div>
            </div>
            <Progress
              percent={getAppFlow().step * 33}
              size="small"
              strokeColor="#fa8c16"
              format={() => getAppFlow().text}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Button size="small" type="primary" onClick={(e) => { e.stopPropagation(); navigate('/applications'); }}>进度追踪</Button>
              <Button size="small" onClick={(e) => { e.stopPropagation(); navigate('/applications'); }}>评价反馈</Button>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable onClick={() => navigate('/policy')}
            styles={{ body: { padding: isElderMode ? 24 : 20 } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Avatar size={48} style={{ backgroundColor: '#fff0f6' }}>
                <CalculatorOutlined style={{ fontSize: 24, color: '#eb2f96' }} />
              </Avatar>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: isElderMode ? 18 : 15 }}>政策速递</div>
                <div style={{ fontSize: 12, color: '#999' }}>{news.length}条更新</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <Tag color="magenta">补贴试算</Tag>
              <Tag color="purple">个税计算</Tag>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Button size="small" type="primary" onClick={(e) => { e.stopPropagation(); navigate('/policy'); }}>政策计算器</Button>
              <Button size="small" onClick={(e) => { e.stopPropagation(); navigate('/city'); }}>城市服务</Button>
            </div>
          </Card>
        </Col>
      </Row>

      {user?.type === 'admin' && (
        <Card style={{ marginBottom: 16, borderColor: '#ff4d4f', background: '#fff2f0' }}
          title={<span style={{ color: '#ff4d4f' }}><SafetyOutlined style={{ marginRight: 8 }} />管理后台入口（仅管理员可见）</span>}
          size="small"
        >
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Button block onClick={() => navigate('/admin')} icon={<AuditOutlined />}>管理看板</Button>
            </Col>
            <Col xs={12} sm={6}>
              <Button block onClick={() => navigate('/admin/services')} icon={<ToolOutlined />}>事项配置中心</Button>
            </Col>
            <Col xs={12} sm={6}>
              <Button block onClick={() => navigate('/admin/gateway')} icon={<SwapOutlined />}>跨部门网关</Button>
            </Col>
            <Col xs={12} sm={6}>
              <Button block onClick={() => navigate('/admin/audit')} icon={<AlertOutlined />}>办件质量审计</Button>
            </Col>
          </Row>
        </Card>
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={14}>
          <Card
            title={<Space><FireOutlined style={{ color: '#fa541c' }} />热门服务</Space>}
            extra={<Button type="link" onClick={() => navigate('/services')}>更多 <RightOutlined /></Button>}
          >
            <List
              dataSource={hotServices.slice(0, 8)}
              renderItem={(item) => (
                <List.Item
                  style={{ padding: '10px 0' }}
                  actions={[
                    <Tooltip title="材料数">
                      <Tag color="blue">{item.required_materials ? JSON.parse(item.required_materials || '[]').length : 3}份材料</Tag>
                    </Tooltip>,
                    <Button type="primary" size="small" onClick={() => navigate(`/apply/${item.id}`)}>办理</Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />}
                    title={
                      <Space>
                        <a onClick={() => navigate(`/services/${item.id}`)}>{item.name}</a>
                        <Tag color="blue" style={{ fontSize: 11 }}>{item.department?.slice(0, 4)}</Tag>
                        <Tag color="orange" style={{ fontSize: 11 }}>{item.handling_time}</Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card title={<Space><BellOutlined />办件动态</Space>}
            extra={<Button type="link" onClick={() => navigate('/applications')}>全部 <RightOutlined /></Button>}
          >
            {applications.length > 0 ? (
              <List
                dataSource={applications.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item style={{ padding: '8px 0' }}>
                    <List.Item.Meta
                      avatar={
                        <Avatar size="small" style={{
                          backgroundColor: item.status === 'completed' ? '#52c41a' :
                            item.status === 'rejected' ? '#ff4d4f' : '#1890ff'
                        }}>
                          {item.status === 'completed' ? '✓' : item.status === 'rejected' ? '✗' : '…'}
                        </Avatar>
                      }
                      title={<span style={{ fontSize: 13 }}>{item.service_name}</span>}
                      description={
                        <Space size="small">
                          <Tag color={item.status === 'completed' ? 'success' : item.status === 'rejected' ? 'error' : 'processing'}
                            style={{ fontSize: 11 }}>
                            {item.status === 'submitted' ? '审核中' : item.status === 'processing' ? '办理中' :
                              item.status === 'completed' ? '已办结' : item.status === 'rejected' ? '已驳回' : item.status}
                          </Tag>
                          {item.rating && <Tag color="gold"><StarOutlined /> {item.rating}星</Tag>}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                <FileTextOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                <p>暂无办件，去服务大厅看看</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Card title={<Space><AppstoreOutlined />28类委办局服务</Space>}
        extra={<Button type="link" onClick={() => navigate('/services')}>进入服务大厅 <RightOutlined /></Button>}
        style={{ marginBottom: 16 }}
      >
        <Row gutter={[12, 12]}>
          {categories.map((cat) => {
            const count = getCategoryStats(cat.id);
            const hotCount = allServices.filter(s => s.category_id === cat.id && s.is_hot).length;
            return (
              <Col xs={8} sm={6} md={4} lg={3} key={cat.id}>
                <Card size="small" hoverable
                  onClick={() => navigate(`/services?categoryId=${cat.id}`)}
                  styles={{ body: { padding: '12px 8px', textAlign: 'center' } }}
                >
                  <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>{cat.name}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>{count}项服务</div>
                  {hotCount > 0 && <Tag color="red" style={{ fontSize: 10, marginTop: 4 }}>{hotCount}热门</Tag>}
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="政策速递" extra={<Button type="link" onClick={() => navigate('/policy')}>更多 <RightOutlined /></Button>}>
            <List
              dataSource={news.slice(0, 4)}
              renderItem={(item) => (
                <List.Item style={{ padding: '6px 0' }}>
                  <List.Item.Meta
                    title={
                      <Space>
                        {item.is_top ? <Tag color="red" style={{ fontSize: 10 }}>置顶</Tag> : null}
                        <a onClick={() => navigate('/policy')} style={{ fontSize: 13 }}>{item.title}</a>
                      </Space>
                    }
                    description={<span style={{ fontSize: 11, color: '#999' }}>{item.department} · {item.publish_date}</span>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={<Space><CloudOutlined />城市服务</Space>}
            extra={<Button type="link" onClick={() => navigate('/city')}>更多 <RightOutlined /></Button>}
          >
            {weather && (
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic title="当前温度" value={weather.temperature} suffix="°C" valueStyle={{ color: '#1890ff' }} />
                </Col>
                <Col span={12}>
                  <Statistic title="空气质量" value={weather.airQuality?.level || '优'} valueStyle={{ color: '#52c41a' }} />
                </Col>
              </Row>
            )}
            <Divider style={{ margin: '12px 0' }} />
            <Row gutter={[8, 8]}>
              <Col span={8}>
                <Button block onClick={() => navigate('/city')} icon={<CloudOutlined />}>天气</Button>
              </Col>
              <Col span={8}>
                <Button block onClick={() => navigate('/city')} icon={<AuditOutlined />}>政务地图</Button>
              </Col>
              <Col span={8}>
                <Button block onClick={() => navigate('/city')} icon={<BellOutlined />}>常用电话</Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16, background: '#f0f5ff', borderColor: '#adc6ff' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <SafetyCertificateOutlined style={{ color: '#1890ff', fontSize: 20 }} />
              <span style={{ fontWeight: 'bold' }}>等保三级合规</span>
              <Tag color="success">数据加密</Tag>
              <Tag color="success">隐私保护</Tag>
              <Tag color="success">审计留痕</Tag>
            </Space>
          </Col>
          <Col>
            <Space>
              <span style={{ color: '#666', fontSize: 12 }}>
                {isElderMode ? '适老版已开启' : '标准版'}
              </span>
              <Button size="small" type={isElderMode ? 'default' : 'primary'}
                onClick={() => useUserStore.getState().toggleElderMode()}>
                {isElderMode ? '切换标准版' : '切换适老版'}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

export default Home;
