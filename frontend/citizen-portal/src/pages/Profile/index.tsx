import { useEffect, useState } from 'react';
import { Avatar, Card, Col, Descriptions, Row, Statistic, Table, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { getUserInfo } from '@/services/auth';
import request from '@/services/request';

const { Title, Paragraph } = Typography;

interface UserInfo {
  id: string;
  name: string;
  phone: string;
}

interface ApplicationItem {
  id: string;
  name: string;
  status: string;
  submittedAt: string;
}

export default function Profile() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);

  useEffect(() => {
    getUserInfo().then((data) => setUser(data as UserInfo));
    request.get<unknown, ApplicationItem[]>('/government/my-applications').then(setApplications);
  }, []);

  return (
    <div style={{ padding: 32, background: '#f5f5f5', minHeight: '100%' }}>
      <Title level={2} style={{ color: '#1B5E20' }}>个人中心</Title>
      <Paragraph type="secondary">查看个人信息、办件记录和平台使用概况。</Paragraph>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card>
            <Descriptions
              title="基本信息"
              column={1}
              extra={<Avatar size={56} icon={<UserOutlined />} style={{ background: '#1B5E20' }} />}
            >
              <Descriptions.Item label="姓名">{user?.name || '演示市民'}</Descriptions.Item>
              <Descriptions.Item label="手机号">{user?.phone || '13800000000'}</Descriptions.Item>
              <Descriptions.Item label="用户编号">{user?.id || 'U0001'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Row gutter={16}>
            <Col span={8}><Card><Statistic title="政务办件" value={applications.length} /></Card></Col>
            <Col span={8}><Card><Statistic title="可用补贴" value={2} /></Card></Col>
            <Col span={8}><Card><Statistic title="电子证照" value={2} /></Card></Col>
          </Row>
        </Col>
      </Row>

      <Card title="最近办件">
        <Table
          rowKey="id"
          dataSource={applications}
          pagination={false}
          columns={[
            { title: '办件编号', dataIndex: 'id' },
            { title: '事项名称', dataIndex: 'name' },
            { title: '状态', dataIndex: 'status' },
            { title: '提交时间', dataIndex: 'submittedAt' },
          ]}
        />
      </Card>
    </div>
  );
}
