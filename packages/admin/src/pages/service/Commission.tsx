import { ProTable } from '@ant-design/pro-components';
import { Tag, Card, Row, Col, Statistic, Button, Space, App } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, DollarOutlined } from '@ant-design/icons';

const statusMap: Record<string, { text: string; color: string }> = {
  PENDING: { text: '待结算', color: 'warning' },
  SETTLED: { text: '已结算', color: 'processing' },
  PAID: { text: '已打款', color: 'success' },
};

const mockData = Array.from({ length: 25 }, (_, i) => ({
  id: `COM-${String(i + 1).padStart(6, '0')}`,
  orderNo: `SO202606${String(i + 1).padStart(6, '0')}`,
  providerName: ['好阿姨家政', '顺风快递代收', '邻里团购', '快修家电'][i % 4],
  orderAmount: (Math.random() * 500 + 50).toFixed(2),
  commissionRate: i % 2 === 0 ? 10 : 12,
  commissionAmount: (Math.random() * 60 + 5).toFixed(2),
  providerEarning: (Math.random() * 450 + 45).toFixed(2),
  status: ['PAID', 'PAID', 'SETTLED', 'PENDING', 'PAID'][i % 5],
  createdAt: `2026-06-${String(19 - Math.floor(i / 5)).padStart(2, '0')}`,
  settledAt: i % 5 !== 3 ? `2026-06-${String(19 - Math.floor(i / 5) + 1).padStart(2, '0')}` : null,
  paidAt: i % 5 === 0 || i % 5 === 1 || i % 5 === 4 ? `2026-06-${String(19 - Math.floor(i / 5) + 3).padStart(2, '0')}` : null,
}));

export default function Commission() {
  const { message } = App.useApp();

  const totalCommission = mockData.reduce((sum, d) => sum + parseFloat(d.commissionAmount), 0);
  const totalEarning = mockData.reduce((sum, d) => sum + parseFloat(d.providerEarning), 0);
  const pendingCount = mockData.filter(d => d.status === 'PENDING').length;

  const columns = [
    { title: '结算编号', dataIndex: 'id', width: 130 },
    { title: '关联订单', dataIndex: 'orderNo', width: 170 },
    { title: '服务商', dataIndex: 'providerName', width: 140 },
    { title: '订单金额', dataIndex: 'orderAmount', width: 100, render: (v: string) => `¥${v}` },
    { title: '佣金比例', dataIndex: 'commissionRate', width: 90, render: (v: number) => `${v}%` },
    { title: '平台佣金', dataIndex: 'commissionAmount', width: 100, render: (v: string) => `¥${v}` },
    { title: '服务商收益', dataIndex: 'providerEarning', width: 110, render: (v: string) => `¥${v}` },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => <Tag color={statusMap[v].color}>{statusMap[v].text}</Tag>,
    },
    { title: '结算时间', dataIndex: 'settledAt', width: 120, render: (v: string) => v || '-' },
    { title: '打款时间', dataIndex: 'paidAt', width: 120, render: (v: string) => v || '-' },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space>
          {record.status === 'PENDING' && (
            <Button type="primary" size="small" onClick={() => message.success('已结算')}>结算</Button>
          )}
          {record.status === 'SETTLED' && (
            <Button type="primary" size="small" onClick={() => message.success('已打款')}>打款</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="累计佣金收入"
              value={totalCommission.toFixed(2)}
              prefix="¥"
              valueStyle={{ color: '#10B981' }}
              prefixCls=""
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="累计服务商收益"
              value={totalEarning.toFixed(2)}
              prefix="¥"
              valueStyle={{ color: '#3B82F6' }}
              prefixCls=""
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="待结算数量"
              value={pendingCount}
              valueStyle={{ color: '#F59E0B' }}
              prefixCls=""
            />
          </Card>
        </Col>
      </Row>

      <ProTable
        headerTitle="佣金结算"
        columns={columns}
        dataSource={mockData}
        rowKey="id"
        search={{ labelWidth: 100 }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        toolBarRender={() => [
          <Button>导出明细</Button>,
        ]}
        scroll={{ x: 1400 }}
      />
    </div>
  );
}
