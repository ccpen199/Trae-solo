import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Button, Space, Breadcrumb, Modal, Form, Input, message } from 'antd';
import { UserOutlined, LogoutOutlined, DashboardOutlined, DownOutlined } from '@ant-design/icons';
import { useAppStore } from './store';
import { apiEndpoints } from './api';
import ProvincePage from './pages/ProvincePage';
import CityPage from './pages/CityPage';
import CountyPage from './pages/CountyPage';
import JobDetail from './pages/JobDetail';
import CompanyDetail from './pages/CompanyDetail';
import SchoolAdmin from './pages/SchoolAdmin';
import CompanyRPO from './pages/CompanyRPO';
import ProsperityPage from './pages/ProsperityPage';
import { ApiResponse } from './api';

const { Header, Content } = Layout;

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLevel, currentDivision, user, setCurrentLevel, setCurrentDivision, setUser, logout } = useAppStore();
  const [divisions, setDivisions] = useState<any[]>([]);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [loginForm] = Form.useForm();

  useEffect(() => {
    loadDivisions();
  }, []);

  const loadDivisions = async () => {
    try {
      const res = await apiEndpoints.divisions.getTree() as ApiResponse;
      if (res.success && res.data.length > 0) {
        setDivisions(res.data);
        setCurrentDivision(res.data[0]);
      }
    } catch (error) {
      console.error('加载行政区划失败:', error);
    }
  };

  const handleLogin = async (values: any) => {
    try {
      const res = await apiEndpoints.auth.login(values.username, values.password) as ApiResponse;
      if (res.success) {
        setUser(res.data);
        setLoginModalVisible(false);
        message.success('登录成功');
        loginForm.resetFields();
        if (res.data.role === 'school') {
          navigate(`/school/${res.data.related_id}`);
        } else if (res.data.role === 'company') {
          navigate(`/company-rpo`);
        } else if (res.data.role === 'admin' || res.data.role === 'government') {
          navigate('/province');
        }
      } else {
        message.error(res.message || '登录失败');
      }
    } catch (error) {
      message.error('登录失败');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    message.success('已退出登录');
  };

  const handleLevelChange = (level: 'province' | 'city' | 'county') => {
    setCurrentLevel(level);
    if (level === 'province') {
      setCurrentDivision(divisions[0]);
      navigate('/province');
    }
  };

  const handleCitySelect = (city: any) => {
    setCurrentLevel('city');
    setCurrentDivision(city);
    navigate(`/city/${city.id}`);
  };

  const handleCountySelect = (county: any) => {
    setCurrentLevel('county');
    setCurrentDivision(county);
    navigate(`/county/${county.id}`);
  };

  const getSelectedKey = () => {
    if (location.pathname.startsWith('/province')) return 'province';
    if (location.pathname.startsWith('/city')) return 'city';
    if (location.pathname.startsWith('/county')) return 'county';
    if (location.pathname.startsWith('/prosperity')) return 'prosperity';
    return 'province';
  };

  const getBreadcrumb = () => {
    const items = [{ title: <span onClick={() => navigate('/')}>云南省</span> }];
    if (currentDivision && currentLevel !== 'province') {
      const pathParts = currentDivision.full_path?.split('/') || [];
      pathParts.forEach((part: string, index: number) => {
        if (index > 0) {
          items.push({ title: part });
        }
      });
    }
    return items;
  };

  const cityMenuItems = divisions[0]?.children?.map((city: any) => ({
    key: city.id,
    label: city.name,
    onClick: () => handleCitySelect(city),
  })) || [];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <h1 style={{ color: '#fff', margin: 0, marginRight: 40, fontSize: 20 }}>
            云南省全域招聘公共服务平台
          </h1>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[getSelectedKey()]}
            style={{ flex: 1, minWidth: 0 }}
          >
            <Menu.Item key="province" icon={<DashboardOutlined />} onClick={() => handleLevelChange('province')}>
              省级平台
            </Menu.Item>
            <Menu.SubMenu key="city" title="州市站点" items={cityMenuItems} />
            <Menu.Item key="prosperity" onClick={() => navigate('/prosperity')}>
              用工景气指数
            </Menu.Item>
          </Menu>
        </div>
        <Space>
          {user ? (
            <Dropdown menu={{
              items: [
                { key: '1', label: `当前用户: ${user.username}` },
                { type: 'divider' },
                { key: '2', label: '退出登录', icon: <LogoutOutlined />, onClick: handleLogout },
              ],
            }}>
              <Button type="text" style={{ color: '#fff' }}>
                <UserOutlined /> {user.username} <DownOutlined />
              </Button>
            </Dropdown>
          ) : (
            <Button type="primary" ghost onClick={() => setLoginModalVisible(true)}>
              登录
            </Button>
          )}
        </Space>
      </Header>

      <div style={{ background: '#fff', padding: '8px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <Space size="middle">
          <Breadcrumb items={getBreadcrumb()} />
          {currentDivision && currentLevel === 'city' && currentDivision.children?.length > 0 && (
            <Dropdown menu={{
              items: currentDivision.children.map((county: any) => ({
                key: county.id,
                label: county.name,
                onClick: () => handleCountySelect(county),
              })),
            }}>
              <Button size="small" type="link">
                进入区县站点 <DownOutlined />
              </Button>
            </Dropdown>
          )}
          <span className={`level-badge ${currentLevel}`}>
            {currentLevel === 'province' ? '省级' : currentLevel === 'city' ? '州市级' : '区县级'}
          </span>
        </Space>
      </div>

      <Content className="page-container">
        <Routes>
          <Route path="/" element={<ProvincePage />} />
          <Route path="/province" element={<ProvincePage />} />
          <Route path="/city/:id" element={<CityPage />} />
          <Route path="/county/:id" element={<CountyPage />} />
          <Route path="/job/:id" element={<JobDetail />} />
          <Route path="/company/:id" element={<CompanyDetail />} />
          <Route path="/school/:id" element={<SchoolAdmin />} />
          <Route path="/company-rpo" element={<CompanyRPO />} />
          <Route path="/prosperity" element={<ProsperityPage />} />
        </Routes>
      </Content>

      <Modal
        title="登录系统"
        open={loginModalVisible}
        onCancel={() => setLoginModalVisible(false)}
        footer={null}
      >
        <Form form={loginForm} layout="vertical" onFinish={handleLogin}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
            测试账号: admin / admin123 | company1 / admin123 | school1 / admin123 | gov_yunnan / admin123
          </div>
        </Form>
      </Modal>
    </Layout>
  );
};

export default App;
