import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Progress } from 'antd';
import {
  FileTextOutlined,
  ToolOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  BellOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import api from '../../api';
import dayjs from 'dayjs';

export default function Home() {
  const [dashboard, setDashboard] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then((res) => {
      setDashboard(res.data);
      setLoading(false);
    });
  }, []);

  const woColumns = [
    { title: '工单号', dataIndex: 'id', render: (v: string) => v.substring(0, 8) },
    { title: '类型', dataIndex: 'type' },
    { title: '标题', dataIndex: 'title' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: string) => {
        const map: Record<string, any> = {
          pending: <Tag color="orange">待接单</Tag>,
          processing: <Tag color="blue">处理中</Tag>,
          completed: <Tag color="green">待评价</Tag>,
          closed: <Tag>已完成</Tag>,
        };
        return map[s] || s;
      },
    },
    { title: '报修人', dataIndex: ['user', 'name'] },
    { title: '处理人', dataIndex: ['assignedTo', 'name'], render: (v: string) => v || '-' },
    { title: '创建时间', dataIndex: 'createdAt', render: (t: string) => dayjs(t).format('MM-DD HH:mm') },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card className="card-hover" style={{ borderRadius: 12 }}>
            <Statistic title="业主总数" value={dashboard.users?.totalOwners} prefix={<TeamOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="card-hover" style={{ borderRadius: 12 }}>
            <Statistic title="待缴账单" value={dashboard.bills?.unpaid} prefix={<FileTextOutlined />} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="card-hover" style={{ borderRadius: 12 }}>
            <Statistic title="已缴账单" value={dashboard.bills?.paid} prefix={<FileTextOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="card-hover" style={{ borderRadius: 12 }}>
            <Statistic title="待处理工单" value={dashboard.workOrders?.pending} prefix={<ToolOutlined />} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="card-hover" style={{ borderRadius: 12 }}>
            <Statistic title="处理中工单" value={dashboard.workOrders?.processing} prefix={<ToolOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="card-hover" style={{ borderRadius: 12 }}>
            <Statistic title="已完成工单" value={dashboard.workOrders?.completed} prefix={<ToolOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="账单收缴情况" style={{ borderRadius: 12 }}>
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Progress
                type="dashboard"
                percent={dashboard.bills?.total ? Math.round((dashboard.bills.paid / dashboard.bills.total) * 100) : 0}
                size={180}
                format={(p) => `${p}%`}
              />
              <div style={{ marginTop: 16 }}>
                <span style={{ color: '#888' }}>已收缴 ¥</span>
                <span style={{ color: '#52c41a', fontWeight: 600 }}>
                  {dashboard.bills?.paid || 0}
                </span>
                <span style={{ color: '#888', marginLeft: 16 }}>待收缴 ¥</span>
                <span style={{ color: '#cf1322', fontWeight: 600 }}>
                  {dashboard.bills?.unpaid || 0}
                </span>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="运营概况" style={{ borderRadius: 12 }}>
            <Row gutter={[0, 24]} style={{ padding: '12px 0' }}>
              <Col span={12}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CalendarOutlined style={{ fontSize: 24, color: '#13c2c2' }} />
                  <div>
                    <div style={{ fontSize: 12, color: '#888' }}>进行中活动</div>
                    <div style={{ fontSize: 24, fontWeight: 600 }}>{dashboard.activities?.total || 0}</div>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <BellOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                  <div>
                    <div style={{ fontSize: 12, color: '#888' }}>已发布公告</div>
                    <div style={{ fontSize: 24, fontWeight: 600 }}>{dashboard.announcements?.total || 0}</div>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <ShoppingCartOutlined style={{ fontSize: 24, color: '#eb2f96' }} />
                  <div>
                    <div style={{ fontSize: 12, color: '#888' }}>总订单数</div>
                    <div style={{ fontSize: 24, fontWeight: 600 }}>{dashboard.orders?.total || 0}</div>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <ToolOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
                  <div>
                    <div style={{ fontSize: 12, color: '#888' }}>总工单数</div>
                    <div style={{ fontSize: 24, fontWeight: 600 }}>{dashboard.workOrders?.total || 0}</div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card title="最近工单" style={{ borderRadius: 12 }}>
        <Table
          columns={woColumns}
          dataSource={dashboard.recentWorkOrders}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  );
}
