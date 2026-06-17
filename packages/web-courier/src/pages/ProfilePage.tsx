import React from 'react';
import { Card, List, Avatar, Button, Modal, Divider, Tag, Descriptions } from 'antd';
import { UserOutlined, LogoutOutlined, EnvironmentOutlined, PhoneOutlined, InfoCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  return (
    <div>
      <div className="courier-header" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar size={60} style={{ background: 'rgba(255,255,255,0.3)' }} icon={<UserOutlined />} />
          <div style={{ flex: 1, marginLeft: 14 }}>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{user?.realNameMasked || '揽收员'}</div>
            <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>工号：EMP-GZ-001 · 5.0⭐</div>
          </div>
        </div>
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', textAlign: 'center', fontSize: 12, opacity: 0.9 }}>
          <div><div style={{ fontSize: 16, fontWeight: 600 }}>248</div><div>本月单量</div></div>
          <div><div style={{ fontSize: 16, fontWeight: 600 }}>98.7%</div><div>准时率</div></div>
          <div><div style={{ fontSize: 16, fontWeight: 600 }}>5.0</div><div>评分</div></div>
        </div>
      </div>

      <Card style={{ margin: 12, borderRadius: 12 }} size="small" title="🏢 所属站点">
        <Descriptions column={1} size="small">
          <Descriptions.Item label="支局">广州邮政1号支局</Descriptions.Item>
          <Descriptions.Item label="服务区域">广州市·天河区/越秀区</Descriptions.Item>
          <Descriptions.Item label="工作区域">中心城区（在岗）</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card style={{ margin: 12, borderRadius: 12 }} size="small" title="📋 服务与设置">
        <List
          itemLayout="horizontal"
          split={false}
          dataSource={[
            { icon: <PhoneOutlined />, label: '站长热线', extra: '138****9999' },
            { icon: <InfoCircleOutlined />, label: '操作手册', extra: 'v1.0.0' },
            { icon: <SettingOutlined />, label: '系统设置' },
          ]}
          renderItem={(i: any) => (
            <List.Item onClick={i.onClick} style={{ cursor: 'pointer', padding: '12px 0' }}>
              <List.Item.Meta avatar={<Avatar style={{ background: '#f5f7fa', color: '#165DFF' }} icon={i.icon} />} title={i.label} description={i.desc} />
              <span style={{ color: '#999' }}>{i.extra || '›'}</span>
            </List.Item>
          )}
        />
      </Card>

      <div style={{ padding: 16 }}>
        <Button danger block size="large" icon={<LogoutOutlined />} onClick={() => Modal.confirm({
          title: '退出登录', onOk: () => { logout(); navigate('/login'); },
        })}>退出登录</Button>
      </div>

      <div style={{ textAlign: 'center', fontSize: 11, color: '#ccc', paddingBottom: 20 }}>
        © 广东邮政政务揽收系统 v1.0.0
      </div>
    </div>
  );
};
export default ProfilePage;
