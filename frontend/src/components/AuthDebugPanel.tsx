import { useState, useEffect } from 'react';
import { Tag, Button, Dropdown, Space } from 'antd';
import { BulbOutlined } from '@ant-design/icons';

const roleLabels: Record<string, { label: string; color: string }> = {
  platform_admin: { label: '平台管理员', color: 'purple' },
  property_admin: { label: '物业管理员', color: 'orange' },
  resident: { label: '住户', color: 'blue' },
};

const AuthDebugPanel: React.FC = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const itv = setInterval(() => setTick((t) => t + 1), 1500);
    return () => clearInterval(itv);
  }, []);

  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const communityStr = localStorage.getItem('community');
  let user: any = null;
  let community: any = null;
  try { user = userStr ? JSON.parse(userStr) : null; } catch {}
  try { community = communityStr ? JSON.parse(communityStr) : null; } catch {}

  const isLoginPage = window.location.pathname.startsWith('/login');
  if (isLoginPage) return null;

  const handleClear = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('community');
    window.location.href = '/login';
  };

  const panelContent = (
    <div style={{ padding: 12, minWidth: 320, fontSize: 12, lineHeight: 1.8 }}>
      <div><strong style={{ color: '#1890ff' }}>🔍 登录状态诊断面板</strong></div>
      <div>Token: {token ? <Tag color="green">已设置</Tag> : <Tag color="red">缺失</Tag>}
        {token && <span style={{ color: '#888', marginLeft: 4 }}>{token.substring(0, 24)}...</span>}
      </div>
      <div>User: {user ? (
        <Space>
          <Tag color={roleLabels[user.role]?.color}>{roleLabels[user.role]?.label || user.role}</Tag>
          <span>{user.real_name}</span>
          <span style={{ color: '#888' }}>phone={user.phone}</span>
        </Space>
      ) : <Tag color="red">缺失</Tag>}</div>
      <div>Community: {community ? (
        <Space>
          <Tag color="blue">{community.name}</Tag>
          <span style={{ color: '#888' }}>{community.subdomain}.邻居.中国</span>
        </Space>
      ) : <Tag color="red">缺失</Tag>}</div>
      <div>当前路由: <code>{window.location.pathname}</code></div>
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #eee' }}>
        <Button size="small" danger onClick={handleClear} style={{ marginRight: 8 }}>清除登录态并重登</Button>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 9999 }}>
      <Dropdown overlay={panelContent} placement="topRight" trigger={['click']}>
        <Button type="primary" shape="circle" icon={<BulbOutlined />} size="large" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} />
      </Dropdown>
    </div>
  );
};

export default AuthDebugPanel;
