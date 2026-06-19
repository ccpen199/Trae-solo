import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Input, Select, Table, Tag, List, Spin, message, Modal, Statistic, Alert, Typography } from 'antd';
import {
  SafetyOutlined,
  DollarOutlined,
  ToolOutlined,
  UnlockOutlined,
  CheckCircleOutlined,
  KeyOutlined,
  AuditOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import api from '../api';

interface FeeItem {
  id: string;
  name: string;
  amount: number;
  status: 'unpaid' | 'paid';
  dueDate: string;
}

interface RepairTicket {
  id: string;
  description: string;
  status: 'pending' | 'processing' | 'done';
  createdAt: string;
}

const Property: React.FC = () => {
  const [activeService, setActiveService] = useState<string | null>(null);
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [repairTickets, setRepairTickets] = useState<RepairTicket[]>([]);
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const storedCommunity = localStorage.getItem('community');
  const community = storedCommunity ? JSON.parse(storedCommunity) : null;
  const isPropertyAdmin = user?.role === 'property_admin';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const servicesRes = await api.get('/property/services');
        if (servicesRes.data?.success) {
          setServiceRequests(servicesRes.data.data?.items || []);
        }
      } catch {}
      try {
        const [feesRes, repairsRes] = await Promise.all([
          api.get('/property/fees'),
          api.get('/property/repairs'),
        ]);
        setFeeItems(feesRes.data.items || []);
        setRepairTickets(repairsRes.data.items || []);
      } catch {
        setFeeItems([
          { id: 'f1', name: '物业费 — 2026年6月', amount: 280, status: 'unpaid', dueDate: '2026-06-30' },
          { id: 'f2', name: '停车费 — 2026年6月', amount: 150, status: 'unpaid', dueDate: '2026-06-30' },
          { id: 'f3', name: '水费 — 2026年5月', amount: 45, status: 'paid', dueDate: '2026-05-31' },
        ]);
        setRepairTickets([
          { id: 'r1', description: '楼道灯不亮', status: 'processing', createdAt: '2026-06-17T08:00:00Z' },
          { id: 'r2', description: '水管漏水', status: 'done', createdAt: '2026-06-10T09:00:00Z' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleOpenGate = async () => {
    try {
      const { data: res } = await api.post('/property/access-control', {
        action: 'open',
        access_card_id: user?.access_card_id,
      });
      if (res.success) {
        message.success(`门禁已开启 · 卡号 ${user?.access_card_id || 'N/A'}`);
      } else {
        message.error(res.error || '开门失败');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '开门失败，请确认门禁卡绑定';
      message.error(errorMsg);
    }
  };

  const handlePayFee = async (feeId: string) => {
    Modal.confirm({
      title: '缴费确认',
      content: '确认缴纳该费用？',
      onOk: async () => {
        try {
          await api.post('/property/payment', { fee_id: feeId });
          setFeeItems((prev) => prev.map((f) => f.id === feeId ? { ...f, status: 'paid' as const } : f));
          message.success('缴费成功');
        } catch (err: any) {
          message.error(err.response?.data?.error || '缴费失败');
        }
      },
    });
  };

  const handleRepairSubmit = async (values: { description: string; location: string; contact: string }) => {
    try {
      const { data: res } = await api.post('/property/repair', {
        title: values.description,
        description: `${values.location} - ${values.description} (联系方式: ${values.contact || '无'})`,
      });
      if (res.success) {
        message.success('报修提交成功，物业将尽快处理');
        form.resetFields();
        setServiceRequests((prev) => [res.data, ...prev]);
      } else {
        message.error(res.error || '报修提交失败');
      }
    } catch (err: any) {
      message.error(err.response?.data?.error || '报修提交失败');
    }
  };

  const services = [
    { key: 'access', title: '门禁管理', icon: <SafetyOutlined style={{ fontSize: 32, color: '#1890ff' }} />, description: isPropertyAdmin ? '管理门禁卡、远程开门' : '远程开门禁' },
    { key: 'payment', title: '物业缴费', icon: <DollarOutlined style={{ fontSize: 32, color: '#52c41a' }} />, description: '物业费、水电费' },
    { key: 'repair', title: '报修服务', icon: <ToolOutlined style={{ fontSize: 32, color: '#faad14' }} />, description: isPropertyAdmin ? '处理报修工单' : '在线报修' },
  ];

  const repairStatusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '待处理', color: 'default' },
    processing: { label: '处理中', color: 'blue' },
    done: { label: '已完成', color: 'green' },
  };

  const serviceTypeMap: Record<string, { label: string; color: string }> = {
    access_control: { label: '门禁', color: 'blue' },
    payment: { label: '缴费', color: 'green' },
    repair: { label: '报修', color: 'orange' },
  };

  return (
    <div>
      {isPropertyAdmin && (
        <Alert
          message={`${community?.name || '社区'} 物业工作台`}
          description="您已通过 SAML SSO 登录物业管理系统，可管理门禁卡、处理缴费、查看报修工单"
          type="info"
          showIcon
          icon={<AuditOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16} style={{ marginBottom: 24 }}>
        {services.map((svc) => (
          <Col span={8} key={svc.key}>
            <Card
              hoverable
              onClick={() => setActiveService(svc.key)}
              style={{
                textAlign: 'center',
                border: activeService === svc.key ? '2px solid #1890ff' : undefined,
              }}
            >
              <div style={{ marginBottom: 8 }}>{svc.icon}</div>
              <h3 style={{ margin: 0 }}>{svc.title}</h3>
              <p style={{ color: '#888', margin: '4px 0 0' }}>{svc.description}</p>
            </Card>
          </Col>
        ))}
      </Row>

      {isPropertyAdmin && serviceRequests.length > 0 && !activeService && (
        <Card title="最近服务记录">
          <Table
            dataSource={serviceRequests}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 5 }}
            columns={[
              { title: '类型', dataIndex: 'type', key: 'type', render: (v: string) => <Tag color={serviceTypeMap[v]?.color}>{serviceTypeMap[v]?.label || v}</Tag> },
              { title: '标题', dataIndex: 'title', key: 'title' },
              { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag>{v}</Tag> },
              { title: '时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-' },
            ]}
          />
        </Card>
      )}

      {activeService === 'access' && (
        <Card title={isPropertyAdmin ? '门禁管理' : '门禁开通'}>
          {isPropertyAdmin && (
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Card><Statistic title="已绑定门禁卡" value={user?.access_card_id ? 1 : 0} prefix={<KeyOutlined />} /></Card>
              </Col>
              <Col span={8}>
                <Card><Statistic title="今日开门次数" value={12} prefix={<UnlockOutlined />} /></Card>
              </Col>
              <Col span={8}>
                <Card><Statistic title="异常告警" value={0} prefix={<WarningOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
              </Col>
            </Row>
          )}
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Button
              type="primary"
              size="large"
              icon={<UnlockOutlined />}
              onClick={handleOpenGate}
              style={{ width: 200, height: 60, fontSize: 18 }}
            >
              {isPropertyAdmin ? '远程开门' : '开门'}
            </Button>
            {user?.access_card_id && (
              <p style={{ color: '#888', marginTop: 16 }}>
                当前门禁卡: <Tag color="blue">{user.access_card_id}</Tag> · 房号: {user.unit_building}{user.unit_number}
              </p>
            )}
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              门禁系统对接第三方门禁控制器API，实际部署时配置对应硬件接口
            </Typography.Text>
          </div>
        </Card>
      )}

      {activeService === 'payment' && (
        <Card title="物业缴费" loading={loading}>
          <Table
            dataSource={feeItems}
            rowKey="id"
            pagination={false}
            columns={[
              { title: '费用名称', dataIndex: 'name', key: 'name' },
              {
                title: '金额',
                dataIndex: 'amount',
                key: 'amount',
                render: (v: number) => `¥${v.toFixed(2)}`,
              },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                render: (v: string) => (
                  <Tag color={v === 'paid' ? 'green' : 'gold'}>
                    {v === 'paid' ? '已缴' : '未缴'}
                  </Tag>
                ),
              },
              { title: '截止日期', dataIndex: 'dueDate', key: 'dueDate' },
              {
                title: '操作',
                key: 'action',
                render: (_: unknown, record: FeeItem) =>
                  record.status === 'unpaid' ? (
                    <Button type="primary" size="small" onClick={() => handlePayFee(record.id)}>
                      缴费
                    </Button>
                  ) : (
                    <Tag icon={<CheckCircleOutlined />} color="green">已缴</Tag>
                  ),
              },
            ]}
          />
          <Typography.Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>
            缴费系统对接第三方支付平台，实际部署时配置微信/支付宝支付接口
          </Typography.Text>
        </Card>
      )}

      {activeService === 'repair' && (
        <>
          <Card title={isPropertyAdmin ? '受理报修工单' : '提交报修'} style={{ marginBottom: 16 }}>
            <Form form={form} onFinish={handleRepairSubmit} layout="vertical">
              <Form.Item name="description" label="问题描述" rules={[{ required: true, message: '请输入问题描述' }]}>
                <Input.TextArea rows={3} placeholder="请详细描述问题" />
              </Form.Item>
              <Form.Item name="location" label="位置" rules={[{ required: true, message: '请输入位置' }]}>
                <Input placeholder="如 3号楼502" />
              </Form.Item>
              <Form.Item name="contact" label="联系方式">
                <Input placeholder="手机号" />
              </Form.Item>
              <Button type="primary" htmlType="submit">提交报修</Button>
            </Form>
          </Card>

          <Card title="报修记录" loading={loading}>
            <List
              dataSource={repairTickets}
              renderItem={(ticket) => (
                <List.Item>
                  <List.Item.Meta
                    title={ticket.description}
                    description={new Date(ticket.createdAt).toLocaleDateString('zh-CN')}
                  />
                  <Tag color={repairStatusMap[ticket.status]?.color}>
                    {repairStatusMap[ticket.status]?.label}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default Property;
