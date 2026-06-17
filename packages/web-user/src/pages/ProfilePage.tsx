import React from 'react';
import { Card, Button, List, Avatar, Tag, Divider, Modal } from 'antd';
import { UserOutlined, SettingOutlined, FileTextOutlined, SafetyCertificateOutlined, PhoneOutlined, QuestionCircleOutlined, LogoutOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { GD_CITIES } from '@platform/shared';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, fetchMe } = useAuthStore();

  const menuGroups = [
    {
      title: '我的服务',
      items: [
        { icon: <FileTextOutlined />, label: '我的订单', path: '/orders', badge: null },
        { icon: <SafetyCertificateOutlined />, label: '电子回执核验', onClick: () => Modal.info({ title: '电子回执核验', content: '请输入回执编号和验证码，系统将对接省级政务平台核验真伪。' }) },
      ],
    },
    {
      title: '账户与安全',
      items: [
        { icon: <UserOutlined />, label: '实名认证', path: '/identity-verify', tag: user?.realNameVerified ? { text: '已认证', color: 'green' } : { text: '未认证', color: 'red' } },
        { icon: <SafetyOutlined />, label: '隐私与数据设置', onClick: () => Modal.info({ title: '隐私设置', content: '您的敏感信息采用AES-256加密存储，脱敏展示。可设置数据保留期限。' }) },
      ],
    },
    {
      title: '帮助与支持',
      items: [
        { icon: <PhoneOutlined />, label: '服务热线：11185', extra: '工作日 8:00-20:00' },
        { icon: <QuestionCircleOutlined />, label: '常见问题', onClick: () => Modal.info({ title: '常见问题', content: '支持签注办理、违章缴费、车检等问题解答' }) },
        { icon: <SettingOutlined />, label: '关于我们', extra: 'v1.0.0' },
      ],
    },
  ];

  return (
    <div>
      <div className="page-header" style={{ padding: '24px 16px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar size={64} style={{ background: 'rgba(255,255,255,0.25)', border: '2px solid rgba(255,255,255,0.6)' }} icon={<UserOutlined />} />
          <div style={{ flex: 1, marginLeft: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{user?.realNameMasked || '用户'}
              {user?.realNameVerified && <Tag color="green" style={{ marginLeft: 8, fontSize: 11 }}>已实名</Tag>}
            </div>
            <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>{user?.phone} · {user?.city || '未设置城市'}</div>
          </div>
          <ExclamationCircleOutlined style={{ fontSize: 20, opacity: 0.8 }} onClick={() => Modal.info({ title: '安全提示', content: '请妥善保管账号密码，不向他人泄露验证码。敏感操作需二次验证。' })} />
        </div>
      </div>

      <div style={{ margin: '-24px 12px 0', position: 'relative', zIndex: 1 }}>
        <Card style={{ borderRadius: 12 }} size="small">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center' }}>
            {[
              { n: 0, l: '办理中' }, { n: 0, l: '已完成' }, { n: 0, l: '电子回执' }, { n: 0, l: '积分' },
            ].map((s, i) => (
              <div key={i} onClick={() => navigate('/orders')} style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#00B42A' }}>{s.n}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {!user?.realNameVerified && (
        <Card style={{ margin: 12, borderRadius: 12, border: '1px solid #FFE7BA', background: '#FFF8F0' }} size="small" onClick={() => navigate('/identity-verify')}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ExclamationCircleOutlined style={{ fontSize: 24, color: '#FF7D00', marginRight: 10 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: '#B8860B' }}>完成实名认证后可办理全部政务事项</div>
              <div style={{ fontSize: 12, color: '#996', marginTop: 2 }}>实名+人脸+公安库三重核验，立即完成</div>
            </div>
            <Tag color="orange">立即办理</Tag>
          </div>
        </Card>
      )}

      {menuGroups.map((g, gi) => (
        <Card key={gi} style={{ margin: 12, borderRadius: 12 }} size="small" title={g.title}>
          <List
            itemLayout="horizontal"
            dataSource={g.items}
            split={false}
            renderItem={(item: any) => (
              <List.Item onClick={() => item.path ? navigate(item.path) : item.onClick?.()} style={{ padding: '12px 0', cursor: 'pointer' }}>
                <List.Item.Meta
                  avatar={<Avatar style={{ background: '#f5f7fa', color: '#00B42A' }} icon={item.icon} />}
                  title={<span>{item.label} {item.tag && <Tag color={item.tag.color} style={{ marginLeft: 6 }}>{item.tag.text}</Tag>}</span>}
                  description={item.extra}
                />
                <span style={{ color: '#CCC' }}>›</span>
              </List.Item>
            )}
          />
        </Card>
      ))}

      <Card style={{ margin: 12, borderRadius: 12 }} size="small">
        <Button danger block icon={<LogoutOutlined />} onClick={() => {
          Modal.confirm({ title: '确认退出登录', onOk: () => { logout(); navigate('/login'); } });
        }}>退出登录</Button>
      </Card>

      <div style={{ textAlign: 'center', fontSize: 11, color: '#CCC', padding: 16 }}>
        © 广东省邮政政务便民服务平台<br/>
        <span style={{ color: '#DDD' }}>敏感字段脱敏 · 资金监管隔离 · 全流程可追溯</span>
      </div>
    </div>
  );
};

import { SafetyOutlined } from '@ant-design/icons';
export default ProfilePage;
