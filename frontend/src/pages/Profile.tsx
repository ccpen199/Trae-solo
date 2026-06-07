import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Col, Descriptions, Row, Spin, Statistic, Table, Tag } from 'antd';
import {
  CalendarOutlined,
  FileDoneOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import api, { getAppointments, getContracts, getDashboard } from '@/api';

interface UserProfile {
  username?: string;
  real_name?: string;
  phone?: string;
  role?: string;
  agency?: string;
  rating?: number;
  status?: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({});
  const [dashboard, setDashboard] = useState<any>({});
  const [appointments, setAppointments] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/auth/me'),
      getDashboard(),
      getAppointments({ pageSize: 5 }),
      getContracts({ pageSize: 5 }),
    ])
      .then(([userRes, dashboardRes, appointmentRes, contractRes]: any[]) => {
        setProfile(userRes || {});
        setDashboard(dashboardRes || {});
        setAppointments(appointmentRes?.list || []);
        setContracts(contractRes?.list || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Spin spinning={loading}>
      <div>
        <div className="page-header">
          <h2>个人中心</h2>
          <p>我的看房计划、购房资格和交易协作状态</p>
        </div>

        <Card style={{ marginBottom: 16 }}>
          <Descriptions title="账号信息" column={{ xs: 1, md: 3 }}>
            <Descriptions.Item label="姓名">{profile.real_name || profile.username || '平台管理员'}</Descriptions.Item>
            <Descriptions.Item label="角色">
              <Tag color="blue">{profile.role === 'agent' ? '经纪人' : '交易服务管理员'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="机构">{profile.agency || '房产交易数字化服务中台'}</Descriptions.Item>
            <Descriptions.Item label="手机号">{profile.phone || '13800000000'}</Descriptions.Item>
            <Descriptions.Item label="认证状态"><Tag color="green">已实名认证</Tag></Descriptions.Item>
            <Descriptions.Item label="服务状态">{profile.status || '在线服务'}</Descriptions.Item>
          </Descriptions>
        </Card>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={6}>
            <Card>
              <Statistic title="在售房源" value={dashboard.total_listings || 0} prefix={<HomeOutlined />} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card>
              <Statistic title="我的预约" value={appointments.length} prefix={<CalendarOutlined />} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card>
              <Statistic title="合同跟进" value={contracts.length} prefix={<FileDoneOutlined />} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card>
              <Statistic title="合规校验通过" value={dashboard.total_contracts || 0} prefix={<SafetyCertificateOutlined />} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              title="我的看房预约"
              extra={<Button type="link" onClick={() => navigate('/agent')}>创建预约</Button>}
            >
              <Table
                size="small"
                rowKey="id"
                dataSource={appointments}
                pagination={false}
                columns={[
                  { title: '房源', dataIndex: 'listing_title', key: 'listing_title', ellipsis: true },
                  { title: '购房者', dataIndex: 'buyer_name', key: 'buyer_name', render: (v: string) => v || '-' },
                  { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color="blue">{v}</Tag> },
                ]}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title="交易协作"
              extra={<Button type="link" onClick={() => navigate('/policy')}>购房资格预审</Button>}
            >
              <Table
                size="small"
                rowKey="id"
                dataSource={contracts}
                pagination={false}
                columns={[
                  { title: '合同', dataIndex: 'contract_no', key: 'contract_no', render: (v: string) => v || '待生成' },
                  { title: '买方', dataIndex: 'buyer_name', key: 'buyer_name', render: (v: string) => v || '-' },
                  { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={v === '已签署' ? 'green' : 'orange'}>{v}</Tag> },
                ]}
              />
            </Card>
          </Col>
        </Row>

        <Card style={{ marginTop: 16 }}>
          <Button type="primary" icon={<UserOutlined />} onClick={() => navigate('/map')}>
            搜索我的意向房源
          </Button>
        </Card>
      </div>
    </Spin>
  );
};

export default Profile;
