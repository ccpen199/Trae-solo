import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  InputNumber,
  Input,
  Typography,
  Progress,
  Row,
  Col,
  Statistic,
  message,
  Select,
  Popconfirm,
} from 'antd';
import {
  WalletOutlined,
  PlusOutlined,
  EditOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  FallOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store/appStore';
import { Customer } from '@/types';

const { Title } = Typography;
const { Option } = Select;

const CreditPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchText, setSearchText] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [form] = Form.useForm();

  const customers = useAppStore((state) => state.customers);

  const levelMap: Record<string, { text: string; color: string }> = {
    normal: { text: '普通客户', color: 'default' },
    silver: { text: '白银客户', color: 'default' },
    gold: { text: '黄金客户', color: 'gold' },
    diamond: { text: '钻石客户', color: 'geekblue' },
  };

  const getCreditStatus = (used: number, limit: number) => {
    const ratio = used / limit;
    if (ratio >= 0.9) return { color: '#ff4d4f', status: 'exception' };
    if (ratio >= 0.7) return { color: '#faad14', status: 'normal' };
    return { color: '#52c41a', status: 'success' };
  };

  const filteredCustomers = customers.filter((c) => {
    const matchSearch =
      !searchText || c.name.includes(searchText) || c.contact.includes(searchText);
    const matchLevel = !levelFilter || c.level === levelFilter;
    return matchSearch && matchLevel;
  });

  const totalCreditLimit = customers.reduce((sum, c) => sum + c.creditLimit, 0);
  const totalUsedCredit = customers.reduce((sum, c) => sum + c.usedCredit, 0);

  const highRiskCustomers = customers.filter((c) => c.usedCredit / c.creditLimit >= 0.8);

  const columns = [
    {
      title: '客户名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Customer) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.contact} · {record.phone}
          </div>
        </div>
      ),
    },
    {
      title: '客户等级',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => {
        const info = levelMap[level];
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '信用额度',
      dataIndex: 'creditLimit',
      key: 'creditLimit',
      render: (val: number) => `¥${val.toLocaleString()}`,
    },
    {
      title: '已使用',
      dataIndex: 'usedCredit',
      key: 'usedCredit',
      render: (val: number, record: Customer) => {
        const status = getCreditStatus(record.usedCredit, record.creditLimit);
        return (
          <div>
            <div style={{ color: status.color, fontWeight: 500 }}>
              ¥{val.toLocaleString()}
            </div>
            <Progress
              percent={Math.round((val / record.creditLimit) * 100)}
              size="small"
              strokeColor={status.color}
              showInfo={false}
              style={{ width: 100 }}
            />
          </div>
        );
      },
    },
    {
      title: '可用额度',
      key: 'available',
      render: (_: unknown, record: Customer) => {
        const available = record.creditLimit - record.usedCredit;
        return <span style={{ color: '#52c41a' }}>¥{available.toLocaleString()}</span>;
      },
    },
    {
      title: '月结账号',
      dataIndex: 'accountNo',
      key: 'accountNo',
    },
    {
      title: '状态',
      key: 'status',
      render: (_: unknown, record: Customer) => {
        const ratio = record.usedCredit / record.creditLimit;
        if (ratio >= 0.9) {
          return <Tag color="red">额度预警</Tag>;
        }
        if (ratio >= 0.7) {
          return <Tag color="orange">额度偏高</Tag>;
        }
        return <Tag color="green">正常</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Customer) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            调整额度
          </Button>
        </Space>
      ),
    },
  ];

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue({
      creditLimit: customer.creditLimit,
      level: customer.level,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    message.success('信用额度调整成功');
    setIsModalOpen(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          客户信用额度管理
        </Title>
        <Button type="primary" icon={<PlusOutlined />}>
          新增客户
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总授信额度"
              value={totalCreditLimit}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已使用额度"
              value={totalUsedCredit}
              prefix="¥"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="额度使用率"
              value={Math.round((totalUsedCredit / totalCreditLimit) * 100)}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="高风险客户"
              value={highRiskCustomers.length}
              suffix="家"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Input
              placeholder="搜索客户名称/联系人"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="客户等级"
              value={levelFilter || undefined}
              onChange={setLevelFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="normal">普通客户</Option>
              <Option value="silver">白银客户</Option>
              <Option value="gold">黄金客户</Option>
              <Option value="diamond">钻石客户</Option>
            </Select>
          </Col>
          <Col span={10}>
            <Space>
              <Tag icon={<WarningOutlined />} color="red">
                额度预警 {highRiskCustomers.length} 家
              </Tag>
              <Tag icon={<CheckCircleOutlined />} color="green">
                正常 {customers.length - highRiskCustomers.length} 家
              </Tag>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table columns={columns} dataSource={filteredCustomers} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title="调整信用额度"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        okText="确认调整"
        cancelText="取消"
        width={500}
      >
        {editingCustomer && (
          <div>
            <div
              style={{
                padding: 12,
                background: '#f5f5f5',
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <div style={{ fontWeight: 500, marginBottom: 4 }}>
                {editingCustomer.name}
              </div>
              <div style={{ fontSize: 12, color: '#999' }}>
                当前额度：¥{editingCustomer.creditLimit.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: '#999' }}>
                已使用：¥{editingCustomer.usedCredit.toLocaleString()}
              </div>
            </div>

            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                label="新的信用额度"
                name="creditLimit"
                rules={[{ required: true, message: '请输入信用额度' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={10000}
                  prefix="¥"
                  formatter={(value: any) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value: any) => Number(value?.replace(/[^\d]/g, '') || 0) as any}
                />
              </Form.Item>

              <Form.Item
                label="客户等级"
                name="level"
                rules={[{ required: true, message: '请选择客户等级' }]}
              >
                <Select>
                  <Option value="normal">普通客户</Option>
                  <Option value="silver">白银客户</Option>
                  <Option value="gold">黄金客户</Option>
                  <Option value="diamond">钻石客户</Option>
                </Select>
              </Form.Item>

              <Form.Item label="调整原因" name="reason">
                <Input.TextArea rows={3} placeholder="请输入调整原因" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CreditPage;
