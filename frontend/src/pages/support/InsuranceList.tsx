import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Input,
  Select,
  Modal,
  Form,
  message,
  Spin,
  Table,
  DatePicker,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  SafetyCertificateOutlined,
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
  UserOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { supportApi, workerApi, orderApi } from '../../api';
import { InsurancePolicy, Worker, Order } from '../../types';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const PolicyStatusMap: Record<string, { text: string; color: string }> = {
  active: { text: '生效中', color: 'green' },
  expired: { text: '已过期', color: 'default' },
  cancelled: { text: '已取消', color: 'orange' },
};

export default function InsuranceList() {
  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [filterWorkerId, setFilterWorkerId] = useState<string | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm] = Form.useForm();

  const [workerOptions, setWorkerOptions] = useState<Worker[]>([]);
  const [orderOptions, setOrderOptions] = useState<Order[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  useEffect(() => {
    fetchPolicies();
  }, [page, pageSize, filterWorkerId, filterStatus]);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        pageSize,
      };
      if (filterWorkerId) {
        params.worker_id = filterWorkerId;
      }
      if (filterStatus) {
        params.status = filterStatus;
      }
      const result = await supportApi.policies(params);
      setPolicies(result.list || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    setOptionsLoading(true);
    try {
      const [workerResult, orderResult] = await Promise.all([
        workerApi.list({ page: 1, pageSize: 100 }),
        orderApi.list({ page: 1, pageSize: 100 }),
      ]);
      setWorkerOptions(workerResult.list || []);
      setOrderOptions(orderResult.list || []);
    } catch (error) {
      console.error(error);
    } finally {
      setOptionsLoading(false);
    }
  };

  const handleCreatePolicy = async () => {
    try {
      const values = await createForm.validateFields();
      setCreateLoading(true);
      const data: any = {
        worker_id: values.worker_id,
        order_id: values.order_id || undefined,
        insurance_type: values.insurance_type,
        coverage_amount: values.coverage_amount,
        premium: values.premium,
        start_date: values.date_range[0].format('YYYY-MM-DD'),
        end_date: values.date_range[1].format('YYYY-MM-DD'),
      };
      await supportApi.createPolicy(data);
      message.success('保单创建成功');
      setCreateModalOpen(false);
      createForm.resetFields();
      setPage(1);
      setTimeout(() => fetchPolicies(), 0);
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      console.error(error);
    } finally {
      setCreateLoading(false);
    }
  };

  const columns = [
    {
      title: '保单号',
      dataIndex: 'policy_number',
      key: 'policy_number',
      width: 200,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', color: '#1677ff' }}>{text}</span>
      ),
    },
    {
      title: '阿姨姓名',
      dataIndex: 'worker_name',
      key: 'worker_name',
      width: 120,
      render: (text: string) => (
        <Space>
          <UserOutlined style={{ color: '#52c41a' }} />
          <span style={{ fontWeight: 500 }}>{text || '-'}</span>
        </Space>
      ),
    },
    {
      title: '关联订单',
      dataIndex: 'order_title',
      key: 'order_title',
      width: 180,
      ellipsis: true,
      render: (text: string) => (
        <Space size={4}>
          <ShoppingCartOutlined style={{ color: '#13c2c2' }} />
          <span>{text || '-'}</span>
        </Space>
      ),
    },
    {
      title: '保险类型',
      dataIndex: 'insurance_type',
      key: 'insurance_type',
      width: 140,
      render: (text: string) => (
        <Tag color="blue" style={{ margin: 0 }}>
          {text || '-'}
        </Tag>
      ),
    },
    {
      title: '保额',
      dataIndex: 'coverage_amount',
      key: 'coverage_amount',
      width: 120,
      align: 'right' as const,
      sorter: (a: InsurancePolicy, b: InsurancePolicy) =>
        a.coverage_amount - b.coverage_amount,
      render: (val: number) => (
        <span style={{ color: '#fa8c16', fontWeight: 600 }}>
          ¥{val?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      title: '保费',
      dataIndex: 'premium',
      key: 'premium',
      width: 120,
      align: 'right' as const,
      sorter: (a: InsurancePolicy, b: InsurancePolicy) => a.premium - b.premium,
      render: (val: number) => (
        <span style={{ fontWeight: 500 }}>¥{val?.toLocaleString() || 0}</span>
      ),
    },
    {
      title: '生效日期',
      key: 'date_range',
      width: 240,
      render: (_: any, record: InsurancePolicy) => (
        <div>
          <div style={{ fontSize: 13 }}>
            <span style={{ color: '#52c41a' }}>起：</span>
            {record.start_date}
          </div>
          <div style={{ fontSize: 13, marginTop: 2 }}>
            <span style={{ color: '#f5222d' }}>止：</span>
            {record.end_date}
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = PolicyStatusMap[status] || { text: status, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
  ];

  return (
    <div className="page-container">
      <Card
        className="card-hover"
        bodyStyle={{ padding: 0 }}
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#52c41a', fontSize: 18 }} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>意外险保单管理</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchPolicies()}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                fetchOptions();
                setCreateModalOpen(true);
              }}
            >
              新增保单
            </Button>
          </Space>
        }
      >
        <div style={{ padding: 16 }}>
          <Card
            size="small"
            className="card-hover"
            style={{ marginBottom: 16 }}
            bodyStyle={{ padding: 12 }}
          >
            <Row gutter={16} align="middle">
              <Col xs={24} sm={12} md={8}>
                <Space>
                  <FilterOutlined style={{ color: '#999' }} />
                  <span style={{ color: '#666' }}>阿姨ID：</span>
                  <Select
                    placeholder="全部阿姨"
                    allowClear
                    style={{ width: 180 }}
                    showSearch
                    optionFilterProp="children"
                    value={filterWorkerId}
                    onChange={(val) => {
                      setFilterWorkerId(val);
                      setPage(1);
                    }}
                  >
                    {workerOptions.map((w) => (
                      <Option key={w.id} value={w.id}>
                        {w.name} - {w.phone}
                      </Option>
                    ))}
                  </Select>
                </Space>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Space>
                  <span style={{ color: '#666' }}>状态：</span>
                  <Select
                    placeholder="全部状态"
                    allowClear
                    style={{ width: 160 }}
                    value={filterStatus}
                    onChange={(val) => {
                      setFilterStatus(val);
                      setPage(1);
                    }}
                  >
                    {Object.entries(PolicyStatusMap).map(([key, val]) => (
                      <Option key={key} value={key}>
                        <Tag color={val.color}>{val.text}</Tag>
                      </Option>
                    ))}
                  </Select>
                </Space>
              </Col>
              <Col xs={24} sm={24} md={8} style={{ textAlign: 'right' }}>
                <Button
                  icon={<SearchOutlined />}
                  onClick={() => {
                    fetchOptions();
                  }}
                >
                  加载阿姨列表
                </Button>
              </Col>
            </Row>
          </Card>

          <Spin spinning={loading}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={policies}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (t) => `共 ${t} 条`,
                onChange: (p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                },
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无保单数据"
                  />
                ),
              }}
              scroll={{ x: 1200 }}
            />
          </Spin>
        </div>
      </Card>

      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: '#52c41a' }} />
            <span>新增意外险保单</span>
          </Space>
        }
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          createForm.resetFields();
        }}
        onOk={handleCreatePolicy}
        confirmLoading={createLoading}
        okText="创建保单"
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        <Spin spinning={optionsLoading}>
          <Form
            form={createForm}
            layout="vertical"
            initialValues={{
              insurance_type: '综合意外险',
              coverage_amount: 100000,
              premium: 299,
            }}
          >
            <Form.Item
              name="worker_id"
              label="选择阿姨"
              rules={[{ required: true, message: '请选择投保阿姨' }]}
            >
              <Select
                placeholder="请选择需要投保的阿姨"
                showSearch
                optionFilterProp="children"
                style={{ width: '100%' }}
              >
                {workerOptions.map((w) => (
                  <Option key={w.id} value={w.id}>
                    {w.name} - {w.phone}
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      {w.role}
                    </Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="order_id" label="关联订单（可选）">
              <Select
                placeholder="选择关联订单"
                allowClear
                showSearch
                optionFilterProp="children"
                style={{ width: '100%' }}
              >
                {orderOptions.map((o) => (
                  <Option key={o.id} value={o.id}>
                    {o.title}
                    <span style={{ color: '#999', marginLeft: 8 }}>
                      ({o.budget_min}-{o.budget_max}元)
                    </span>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="insurance_type"
                  label="保险类型"
                  rules={[{ required: true, message: '请输入保险类型' }]}
                >
                  <Input placeholder="如：综合意外险、家政责任险" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="premium"
                  label="保费（元）"
                  rules={[{ required: true, message: '请输入保费' }]}
                >
                  <Input
                    type="number"
                    placeholder="299"
                    prefix="¥"
                    min={0}
                    step={1}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="coverage_amount"
              label="保额（元）"
              rules={[{ required: true, message: '请输入保额' }]}
            >
              <Input
                type="number"
                placeholder="100000"
                prefix="¥"
                min={0}
                step={1000}
              />
            </Form.Item>

            <Form.Item
              name="date_range"
              label="保险生效周期"
              rules={[{ required: true, message: '请选择保险生效日期范围' }]}
            >
              <RangePicker
                style={{ width: '100%' }}
                disabledDate={(current) =>
                  current && current < dayjs().startOf('day')
                }
              />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
}
