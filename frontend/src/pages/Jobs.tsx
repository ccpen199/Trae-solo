import React, { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Button,
  Form,
  Input,
  Select,
  Tag,
  Modal,
  InputNumber,
  Space,
  Typography,
  message,
  Popconfirm,
  Spin,
  Row,
  Col,
  Descriptions,
  Alert
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  GiftOutlined,
  SafetyOutlined,
  UserOutlined,
  SendOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/auth';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Job {
  id: number;
  company_id: number;
  title: string;
  department: string;
  job_description: string;
  requirements: string;
  salary_min: number;
  salary_max: number;
  reward_amount: number;
  commission_tiers: Array<{ threshold: number; rate: number }>;
  installment_plan: Array<{ month: number; ratio: number }>;
  allowed_channels: string[];
  probation_months: number;
  feedback_nodes: string[];
  city: string;
  status: string;
  company_name: string;
  industry: string;
  verified: boolean;
  creator_name: string;
  creator_credit: number;
  created_at: string;
}

interface JobForm {
  title: string;
  department: string;
  job_description: string;
  requirements: string;
  salary_min: number;
  salary_max: number;
  reward_amount: number;
  probation_months: number;
  city: string;
}

const Jobs: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    keyword: '',
    city: '',
    min_reward: undefined as number | undefined
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [form] = Form.useForm<JobForm>();

  const canCreate = user?.role === 'company' || user?.role === 'admin';

  useEffect(() => {
    fetchJobs();
  }, [page, pageSize, filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        pageSize,
        ...filters
      };
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined || params[key] === null) {
          delete params[key];
        }
      });
      const response = await axios.get('/api/jobs', { params });
      setJobs(response.data.list);
      setTotal(response.data.total);
    } catch (error) {
      message.error('获取职位列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values: any) => {
    setFilters(values);
    setPage(1);
  };

  const handleReset = () => {
    setFilters({
      keyword: '',
      city: '',
      min_reward: undefined
    });
    setPage(1);
    form.resetFields();
  };

  const handleCreate = () => {
    if (!canCreate) {
      message.error('仅企业用户可以发布职位');
      return;
    }
    setEditingJob(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    form.setFieldsValue(job);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/jobs/${id}`);
      message.success('职位已关闭');
      fetchJobs();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleSubmit = async (values: JobForm) => {
    try {
      if (editingJob) {
        await axios.put(`/api/jobs/${editingJob.id}`, values);
        message.success('更新成功');
      } else {
        await axios.post('/api/jobs', values);
        message.success('发布成功');
      }
      setModalVisible(false);
      fetchJobs();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      active: { color: 'green', text: '招聘中' },
      closed: { color: 'default', text: '已关闭' },
      paused: { color: 'orange', text: '已暂停' }
    };
    const s = statusMap[status] || { color: 'default', text: status };
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  const getCreditClass = (score: number) => {
    if (score >= 80) return 'credit-score-good';
    if (score >= 60) return 'credit-score-medium';
    return 'credit-score-low';
  };

  const columns = [
    {
      title: '职位信息',
      key: 'job',
      width: 200,
      render: (_: any, record: Job) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 15 }}>{record.title}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.department}</div>
        </div>
      )
    },
    {
      title: '企业信息',
      key: 'company',
      width: 180,
      render: (_: any, record: Job) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.company_name}
            {record.verified && (
              <Tag color="green" style={{ marginLeft: 4 }} icon={<SafetyOutlined />}>已认证</Tag>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.industry}</div>
        </div>
      )
    },
    {
      title: '工作城市',
      dataIndex: 'city',
      key: 'city',
      width: 80
    },
    {
      title: '薪资范围',
      key: 'salary',
      width: 140,
      render: (_: any, record: Job) => (
        <span className="salary-text">
          ¥{(record.salary_min / 10000).toFixed(1)}-{(record.salary_max / 10000).toFixed(1)}万/年
        </span>
      )
    },
    {
      title: '悬赏金额',
      dataIndex: 'reward_amount',
      key: 'reward_amount',
      width: 120,
      render: (val: number) => (
        <div>
          <div className="reward-text" style={{ fontSize: 16, fontWeight: 600 }}>
            ¥{val.toLocaleString()}
          </div>
          <Text type="secondary" style={{ fontSize: 11 }}>成功入职奖励</Text>
        </div>
      )
    },
    {
      title: '佣金等级',
      dataIndex: 'commission_tiers',
      key: 'commission_tiers',
      width: 120,
      render: (tiers: any[]) => (
        <div>
          {tiers?.map((tier, idx) => (
            <div key={idx} style={{ fontSize: 12 }}>
              成功{tier.threshold}人: {(tier.rate * 100).toFixed(0)}%
            </div>
          ))}
        </div>
      )
    },
    {
      title: '分期计划',
      dataIndex: 'installment_plan',
      key: 'installment_plan',
      width: 120,
      render: (plan: any[]) => (
        <div className="tag-list">
          {plan?.map((p, idx) => (
            <Tag key={idx} color="blue">第{p.month}月 {(p.ratio * 100).toFixed(0)}%</Tag>
          ))}
        </div>
      )
    },
    {
      title: '发布人',
      key: 'creator',
      width: 100,
      render: (_: any, record: Job) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.creator_name}</div>
          <div style={{ fontSize: 12 }} className={getCreditClass(record.creator_credit)}>
            信用: {record.creator_credit}
          </div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '发布时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: Job) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/jobs/${record.id}`)}
          >
            查看
          </Button>
          {record.status === 'active' && (
            <Button
              type="link"
              size="small"
              icon={<SendOutlined />}
              onClick={() => navigate(`/jobs/${record.id}`)}
            >
              推荐
            </Button>
          )}
          {(record.creator_name === user?.real_name || user?.role === 'admin') && record.status === 'active' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
              <Popconfirm
                title="确定关闭此职位？"
                description="关闭后将不再接受新的推荐"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                >
                  关闭
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>职位悬赏</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            disabled={!canCreate}
          >
            {canCreate ? '发布职位' : '无权限'}
          </Button>
        </div>
        {!canCreate && (
          <Alert
            type="info"
            showIcon
            message="仅企业用户可以发布职位悬赏"
            style={{ marginBottom: 16 }}
          />
        )}
        <Form layout="inline" onFinish={handleSearch} initialValues={filters}>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="职位/描述/要求" style={{ width: 200 }} prefix={<SearchOutlined />} />
          </Form.Item>
          <Form.Item name="city" label="城市">
            <Select placeholder="全部" style={{ width: 120 }} allowClear>
              <Option value="北京">北京</Option>
              <Option value="上海">上海</Option>
              <Option value="深圳">深圳</Option>
              <Option value="杭州">杭州</Option>
              <Option value="广州">广州</Option>
            </Select>
          </Form.Item>
          <Form.Item name="min_reward" label="最低赏金">
            <Select placeholder="不限" style={{ width: 140 }} allowClear>
              <Option value={10000}>≥1万元</Option>
              <Option value={30000}>≥3万元</Option>
              <Option value={50000}>≥5万元</Option>
              <Option value={100000}>≥10万元</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>搜索</Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Table
          columns={columns}
          dataSource={jobs}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1600 }}
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
            }
          }}
        />
      </Card>

      <Modal
        title={editingJob ? '编辑职位' : '发布新职位'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ probation_months: 3 }}
        >
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="title" label="职位名称" rules={[{ required: true }]}>
                <Input placeholder="如: 高级前端工程师" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="department" label="所属部门">
                <Input placeholder="如: 技术部" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="city" label="工作城市" rules={[{ required: true }]}>
                <Select placeholder="请选择城市">
                  <Option value="北京">北京</Option>
                  <Option value="上海">上海</Option>
                  <Option value="深圳">深圳</Option>
                  <Option value="杭州">杭州</Option>
                  <Option value="广州">广州</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="salary_min" label="薪资下限（元/年）" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} placeholder="最低年薪" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="salary_max" label="薪资上限（元/年）" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} placeholder="最高年薪" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="reward_amount" label="悬赏金额（元）" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} placeholder="成功入职奖励金额" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="probation_months" label="试用期（月）">
                <InputNumber min={1} max={12} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="job_description" label="职位描述" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="请详细描述职位职责" />
          </Form.Item>
          <Form.Item name="requirements" label="任职要求" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="请详细描述任职要求" />
          </Form.Item>

          <Alert
            type="info"
            showIcon
            message="佣金和分期设置"
            description="默认佣金比例10%，分期计划：入职1月30%，3月40%，6月30%。如需自定义请联系管理员。"
            style={{ marginBottom: 16 }}
          />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingJob ? '更新' : '发布'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Jobs;
