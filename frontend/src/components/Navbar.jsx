import React from 'react';
import { Layout, Menu, Dropdown, Button, Space } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { UserOutlined, MessageOutlined, FileTextOutlined, SafetyOutlined, VideoCameraOutlined, DashboardOutlined, LogoutOutlined, CrownOutlined, CloudServerOutlined, FundOutlined } from '@ant-design/icons';

const { Header } = Layout;

function Navbar({ user, role, onLogout }) {
  const navigate = useNavigate();

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        个人中心
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={onLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  const getNavItems = () => {
    const items = [
      { key: 'home', label: <Link to="/">首页</Link> },
      { key: 'lawyers', label: <Link to="/lawyers">找律师</Link>, icon: <UserOutlined /> },
      { key: 'consultation', label: <Link to="/consultation">法律咨询</Link>, icon: <MessageOutlined /> },
      { key: 'contract', label: <Link to="/contracts/generate">合同生成</Link>, icon: <FileTextOutlined /> },
      { key: 'content', label: <Link to="/content">法律知识</Link>, icon: <VideoCameraOutlined /> },
    ];

    if (role === 'user') {
      items.push(
        { key: 'my-consultations', label: <Link to="/consultations">我的咨询</Link> },
        { key: 'my-contracts', label: <Link to="/contracts">我的合同</Link> },
        { key: 'my-cases', label: <Link to="/cases">我的案件</Link> },
        { key: 'company-vip', label: <Link to="/company-vip">企业VIP</Link>, icon: <CrownOutlined /> }
      );
    }

    if (role === 'lawyer') {
      items.push(
        { key: 'lawyer-dashboard', label: <Link to="/lawyer/dashboard">律师工作台</Link>, icon: <DashboardOutlined /> },
        { key: 'lawyer-cases', label: <Link to="/lawyer/cases">案件管理</Link> }
      );
    }

    if (role === 'admin') {
      items.push(
        { key: 'admin-dashboard', label: <Link to="/admin/dashboard">管理后台</Link>, icon: <DashboardOutlined /> },
        { key: 'admin-lawyer-verify', label: <Link to="/admin/lawyer-verify">律师审核</Link>, icon: <SafetyOutlined /> },
        { key: 'admin-audits', label: <Link to="/admin/audits">会话质检</Link> },
        { key: 'admin-nps', label: <Link to="/admin/nps">NPS分析</Link> },
        { key: 'admin-compliance', label: <Link to="/admin/compliance">合规巡检</Link> },
        { key: 'admin-doc-sandbox', label: <Link to="/admin/document-sandbox">文书沙箱</Link>, icon: <CloudServerOutlined /> },
        { key: 'admin-revenue', label: <Link to="/admin/revenue">分账管理</Link>, icon: <FundOutlined /> }
      );
    }

    return items;
  };

  return (
    <Header className="navbar-header">
      <div className="navbar-logo">
        <Link to="/" style={{ color: '#fff', fontWeight: 'bold', fontSize: '20px' }}>
          ⚖️ 法智云平台
        </Link>
      </div>
      <Menu
        theme="dark"
        mode="horizontal"
        items={getNavItems()}
        className="navbar-menu"
      />
      <div className="navbar-user">
        {user ? (
          <Dropdown overlay={userMenu}>
            <Button type="text" style={{ color: '#fff' }} icon={<UserOutlined />}>
              {user.name || user.username}
            </Button>
          </Dropdown>
        ) : (
          <Space>
            <Link to="/login">
              <Button type="primary">登录</Button>
            </Link>
            <Link to="/register">
              <Button type="text" style={{ color: '#fff' }}>注册</Button>
            </Link>
          </Space>
        )}
      </div>
    </Header>
  );
}

export default Navbar;
