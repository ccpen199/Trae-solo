import React from 'react';
import { Avatar, Button, Card, Col, Descriptions, List, Row, Statistic, Tag } from 'antd';
import {
  AuditOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUserStore, selectUser, selectUserRole } from '../store/user';
import { formatDateTime } from '../utils/format';
import type { UserRole } from '../../shared/types';

const roleLabels: Record<UserRole, string> = {
  owner: '货主',
  fleet: '车队',
  driver: '司机',
  operator: '运营',
  admin: '管理员',
};

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const user = useUserStore(selectUser);
  const userRole = useUserStore(selectUserRole);

  const auditItems = [
    { title: '登录个人中心', description: '本地演示账号进入个人中心并完成资料读取', time: '2026-06-09 09:32' },
    { title: '查看后台管理权限', description: '确认订单、认证、系统设置等管理员入口可用', time: '2026-06-09 09:18' },
    { title: '提交链路复验', description: '发布货源、货源列表与订单管理数据已联通', time: '2026-06-09 08:55' },
  ];

  return (
    <div className="space-y-6">
      <Card variant="borderless" className="card-shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar size={72} src={user?.avatar} icon={!user?.avatar && <UserOutlined />} className="bg-primary-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">个人中心</h1>
              <div className="text-gray-500">
                我的资料、账号安全、后台管理权限和提交记录
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Tag color="blue">{userRole ? roleLabels[userRole] : '本地用户'}</Tag>
                <Tag color="green" icon={<CheckCircleOutlined />}>已认证</Tag>
                <Tag color="purple" icon={<SafetyCertificateOutlined />}>演示后台可用</Tag>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button icon={<AuditOutlined />} onClick={() => navigate('/auth')}>后台管理</Button>
            <Button type="primary" icon={<SettingOutlined />} onClick={() => navigate('/settings')} style={{ background: '#165DFF' }}>
              账号设置
            </Button>
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card variant="borderless" className="card-shadow" title="我的资料">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="用户名">{user?.username || '-'}</Descriptions.Item>
              <Descriptions.Item label="角色">{userRole ? roleLabels[userRole] : '-'}</Descriptions.Item>
              <Descriptions.Item label="手机号">{user?.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="公司">{user?.companyName || '平台管理方'}</Descriptions.Item>
              <Descriptions.Item label="认证状态">
                <Tag color="green">{user?.authStatus === 'approved' ? '已认证' : user?.authStatus || '-'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{user?.createdAt ? formatDateTime(user.createdAt) : '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card variant="borderless" className="card-shadow" title="后台管理概况">
            <Row gutter={[12, 12]}>
              <Col span={12}><Statistic title="可管理模块" value={8} suffix="个" /></Col>
              <Col span={12}><Statistic title="待办审核" value={12} suffix="项" /></Col>
              <Col span={12}><Statistic title="提交记录" value={36} suffix="条" /></Col>
              <Col span={12}><Statistic title="安全等级" value="高" /></Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card variant="borderless" className="card-shadow" title="最近操作详情">
        <List
          dataSource={auditItems}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={item.title}
                description={`${item.description} · ${item.time}`}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default Profile;
