import { Card, Descriptions, Row, Col, Statistic, Tabs, Tag, Button, Space, List } from 'antd';
import { UserOutlined, BankOutlined, SafetyCertificateOutlined, FileDoneOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { ROLE_LABELS, UserRole } from '../utils/permissions';

function ProfileCenter() {
  const { currentUser } = useAppStore();
  const location = useLocation();
  const defaultTab = new URLSearchParams(location.search).get('tab') === 'certification' ? 'certification' : 'profile';

  return (
    <div>
      <div className="page-title">个人中心</div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card>
            <Space align="start">
              <UserOutlined style={{ fontSize: 32, color: '#1677ff' }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{currentUser?.name}</div>
                <div style={{ color: '#666', marginTop: 4 }}>{currentUser?.company}</div>
                <Tag color="blue" style={{ marginTop: 8 }}>
                  {ROLE_LABELS[(currentUser?.role as UserRole) || 'cargo_owner']}
                </Tag>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card>
            <Statistic title="进行中订单" value={6} prefix={<FileDoneOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card>
            <Statistic title="企业认证" value="已通过" prefix={<SafetyCertificateOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          defaultActiveKey={defaultTab}
          items={[
            {
              key: 'profile',
              label: '我的资料',
              children: (
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="姓名">{currentUser?.name}</Descriptions.Item>
                  <Descriptions.Item label="角色">{ROLE_LABELS[(currentUser?.role as UserRole) || 'cargo_owner']}</Descriptions.Item>
                  <Descriptions.Item label="企业名称">{currentUser?.company}</Descriptions.Item>
                  <Descriptions.Item label="邮箱">{currentUser?.email}</Descriptions.Item>
                  <Descriptions.Item label="手机">{currentUser?.phone}</Descriptions.Item>
                  <Descriptions.Item label="资质">{currentUser?.qualifications}</Descriptions.Item>
                </Descriptions>
              ),
            },
            {
              key: 'certification',
              label: '企业认证',
              children: (
                <List
                  dataSource={[
                    { title: '营业执照', status: '已认证' },
                    { title: '物流行业资质', status: '已认证' },
                    { title: '合同签署授权书', status: '待更新' },
                  ]}
                  renderItem={(item) => (
                    <List.Item actions={[<Button type="link">查看</Button>]}>
                      <List.Item.Meta
                        avatar={<BankOutlined style={{ fontSize: 24, color: '#1677ff' }} />}
                        title={item.title}
                        description={<Tag color={item.status === '已认证' ? 'green' : 'orange'}>{item.status}</Tag>}
                      />
                    </List.Item>
                  )}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}

export default ProfileCenter;
