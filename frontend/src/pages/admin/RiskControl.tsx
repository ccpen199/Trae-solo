import { useState, useEffect } from 'react';
import {
  Card, Table, Form, Input, Select, Button, Tag, Row, Col, InputNumber,
  Statistic, Spin, message, List, Switch, Divider,
} from 'antd';
import { PlusOutlined, SafetyOutlined, DollarOutlined, GiftOutlined } from '@ant-design/icons';
import api from '../../api';

interface RiskRule {
  id: string;
  name: string;
  type: string;
  threshold: number;
  enabled: boolean;
}

interface Alert {
  id: string;
  ruleName: string;
  triggerUser: string;
  detail: string;
  time: string;
  status: 'pending' | 'resolved';
}

const ruleTypeOptions = [
  { value: 'withdraw', label: '提现限制' },
  { value: 'aml', label: '反洗钱' },
  { value: 'fraud', label: '反欺诈' },
  { value: 'red_packet', label: '红包限制' },
];

const RiskControl: React.FC = () => {
  const [rules, setRules] = useState<RiskRule[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form] = Form.useForm();

  const [withdrawLimit, setWithdrawLimit] = useState(5000);
  const [amlThreshold, setAmlThreshold] = useState(10000);
  const [redPacketPoolBalance, setRedPacketPoolBalance] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rulesRes, alertsRes, configRes] = await Promise.all([
          api.get('/admin/risk/rules'),
          api.get('/admin/risk/alerts'),
          api.get('/admin/risk/config'),
        ]);
        setRules(rulesRes.data.items || []);
        setAlerts(alertsRes.data.items || []);
        setWithdrawLimit(configRes.data.dailyWithdrawLimit || 5000);
        setAmlThreshold(configRes.data.amlThreshold || 10000);
        setRedPacketPoolBalance(configRes.data.redPacketPoolBalance || 0);
      } catch {
        setRules([
          { id: 'r1', name: '单日提现限额', type: 'withdraw', threshold: 5000, enabled: true },
          { id: 'r2', name: '大额交易监控', type: 'aml', threshold: 10000, enabled: true },
          { id: 'r3', name: '批量下单检测', type: 'fraud', threshold: 5, enabled: true },
          { id: 'r4', name: '红包领取频次限制', type: 'red_packet', threshold: 10, enabled: false },
        ]);
        setAlerts([
          { id: 'a1', ruleName: '单日提现限额', triggerUser: 'user_042', detail: '24小时提现¥8000，超出限额', time: '2026-06-19T09:15:00Z', status: 'pending' },
          { id: 'a2', ruleName: '批量下单检测', triggerUser: 'user_001', detail: '1分钟内下单5笔', time: '2026-06-19T10:30:00Z', status: 'pending' },
          { id: 'a3', ruleName: '大额交易监控', triggerUser: 'user_078', detail: '单笔交易¥12000', time: '2026-06-18T15:20:00Z', status: 'resolved' },
        ]);
        setWithdrawLimit(5000);
        setAmlThreshold(10000);
        setRedPacketPoolBalance(12580);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddRule = async (values: { name: string; type: string; threshold: number }) => {
    setAdding(true);
    try {
      await api.post('/admin/risk/rules', values);
      message.success('规则添加成功');
      form.resetFields();
    } catch {
      message.error('添加失败');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await api.patch(`/admin/risk/rules/${ruleId}`, { enabled });
      setRules((prev) => prev.map((r) => r.id === ruleId ? { ...r, enabled } : r));
      message.success(enabled ? '规则已启用' : '规则已禁用');
    } catch {
      message.error('操作失败');
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await api.patch(`/admin/risk/alerts/${alertId}`, { status: 'resolved' });
      setAlerts((prev) => prev.map((a) => a.id === alertId ? { ...a, status: 'resolved' as const } : a));
      message.success('已处理');
    } catch {
      message.error('操作失败');
    }
  };

  const handleSaveConfig = async () => {
    try {
      await api.put('/admin/risk/config', { dailyWithdrawLimit: withdrawLimit, amlThreshold });
      message.success('配置已保存');
    } catch {
      message.error('保存失败');
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const ruleColumns = [
    { title: '规则名称', dataIndex: 'name', key: 'name' },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (v: string) => {
        const map: Record<string, { label: string; color: string }> = {
          withdraw: { label: '提现限制', color: 'blue' },
          aml: { label: '反洗钱', color: 'red' },
          fraud: { label: '反欺诈', color: 'orange' },
          red_packet: { label: '红包限制', color: 'green' },
        };
        return <Tag color={map[v]?.color}>{map[v]?.label || v}</Tag>;
      },
    },
    { title: '阈值', dataIndex: 'threshold', key: 'threshold' },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (v: boolean, record: RiskRule) => (
        <Switch checked={v} onChange={(checked) => handleToggleRule(record.id, checked)} />
      ),
    },
  ];

  const alertColumns = [
    { title: '规则', dataIndex: 'ruleName', key: 'ruleName' },
    { title: '触发用户', dataIndex: 'triggerUser', key: 'triggerUser' },
    { title: '详情', dataIndex: 'detail', key: 'detail' },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string, record: Alert) =>
        v === 'pending' ? (
          <Button type="primary" size="small" onClick={() => handleResolveAlert(record.id)}>处理</Button>
        ) : (
          <Tag color="green">已处理</Tag>
        ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="每日提现限额" value={withdrawLimit} prefix={<DollarOutlined />} suffix="元" />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="反洗钱阈值" value={amlThreshold} prefix={<SafetyOutlined />} suffix="元" valueStyle={{ color: '#f5222d' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="红包池余额" value={redPacketPoolBalance} prefix={<GiftOutlined />} suffix="元" valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Card title="风控规则" style={{ marginBottom: 16 }}>
        <Form form={form} onFinish={handleAddRule} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="name" rules={[{ required: true, message: '请输入规则名' }]}>
            <Input placeholder="规则名称" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="type" rules={[{ required: true, message: '请选择类型' }]}>
            <Select options={ruleTypeOptions} placeholder="规则类型" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="threshold" rules={[{ required: true, message: '请输入阈值' }]}>
            <InputNumber placeholder="阈值" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={adding}>
              添加规则
            </Button>
          </Form.Item>
        </Form>
        <Table dataSource={rules} columns={ruleColumns} rowKey="id" pagination={false} size="small" />
      </Card>

      <Card title="触发告警" style={{ marginBottom: 16 }}>
        <Table dataSource={alerts} columns={alertColumns} rowKey="id" pagination={{ pageSize: 10 }} size="small" />
      </Card>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="每日提现限额配置">
            <InputNumber
              value={withdrawLimit}
              onChange={(v) => setWithdrawLimit(v || 5000)}
              min={0}
              style={{ width: '100%' }}
              prefix="¥"
              addonAfter="元/天"
            />
            <Button type="primary" onClick={handleSaveConfig} style={{ marginTop: 12 }} block>
              保存配置
            </Button>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="反洗钱规则配置">
            <InputNumber
              value={amlThreshold}
              onChange={(v) => setAmlThreshold(v || 10000)}
              min={0}
              style={{ width: '100%' }}
              prefix="¥"
              addonAfter="元"
            />
            <div style={{ color: '#888', fontSize: 12, marginTop: 8 }}>
              单笔交易超过此金额将触发AML审查
            </div>
            <Divider />
            <Statistic
              title="红包池资金状态"
              value={redPacketPoolBalance}
              prefix="¥"
              valueStyle={{ color: redPacketPoolBalance < 5000 ? '#f5222d' : '#52c41a' }}
            />
            {redPacketPoolBalance < 5000 && (
              <Tag color="red" style={{ marginTop: 8 }}>⚠️ 红包池余额不足</Tag>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RiskControl;
