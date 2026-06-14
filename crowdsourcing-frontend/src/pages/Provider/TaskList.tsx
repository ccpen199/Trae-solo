import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Table,
  Tag,
  Button,
  Avatar,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Spin,
  Empty,
  Space,
  Select,
  Row,
  Col,
} from 'antd';
import {
  EyeOutlined,
  UserOutlined,
  MoneyCollectOutlined,
  ClockCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Task, Bid } from '@/types';
import { taskApi, bidApi } from '@/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const statusColors: Record<string, string> = {
  bidding: 'processing',
  selected: 'cyan',
  in_progress: 'processing',
  submitted: 'blue',
  reviewing: 'gold',
  revising: 'orange',
  completed: 'success',
  cancelled: 'error'
};

const statusNames: Record<string, string> = {
  bidding: '投标中',
  selected: '已中标',
  in_progress: '进行中',
  submitted: '已提交',
  reviewing: '评审中',
  revising: '修改中',
  completed: '已完成',
  cancelled: '已取消'
};

const bidStatusColors: Record<string, string> = {
  pending: 'processing',
  accepted: 'success',
  rejected: 'error',
  cancelled: 'default'
};

const bidStatusNames: Record<string, string> = {
  pending: '待审核',
  accepted: '已接受',
  rejected: '已拒绝',
  cancelled: '已取消'
};

const TaskList: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bidding');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  const [bidModalVisible, setBidModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [bidForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchTasks = async (status?: string, page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      let result;
      if (activeTab === 'bidding') {
        result = await bidApi.getMyBids({ page, pageSize });
        setBids(result.list || []);
      } else {
        result = await taskApi.getMyTasks({ page, pageSize, status: activeTab === 'all' ? undefined : activeTab });
        setTasks(result.list || []);
      }
      setPagination({ current: page, pageSize, total: result.total || 0 });
    } catch (error) {
      console.error('Fetch tasks error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(undefined, 1, 10);
  }, [activeTab]);

  const handleBid = (task: Task) => {
    setCurrentTask(task);
    setBidModalVisible(true);
  };

  const handleSubmitBid = async (values: any) => {
    if (!currentTask) return;
    try {
      setSubmitting(true);
      await bidApi.create(currentTask.id, values);
      message.success('投标成功');
      setBidModalVisible(false);
      bidForm.resetFields();
      fetchTasks();
    } catch (error) {
      console.error('Submit bid error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const taskColumns = [
    {
      title: '任务',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Task) => (
        <div className="cursor-pointer hover:text-primary-700" onClick={() => navigate(`/provider/tasks/${record.id}`)}>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-400">{record.taskNo}</div>
        </div>
      )
    },
    {
      title: '分类',
      dataIndex: 'categoryName',
      key: 'categoryName',
      width: 100,
      render: (name: string) => <Tag color="blue">{name}</Tag>
    },
    {
      title: '雇主',
      dataIndex: 'employerName',
      key: 'employerName',
      width: 120,
      render: (name: string, record: Task) => (
        <div className="flex items-center gap-2">
          <Avatar size={24} src={record.employerAvatar} icon={<UserOutlined />}>
            {name?.charAt(0)}
          </Avatar>
          <span>{name}</span>
        </div>
      )
    },
    {
      title: '预算',
      dataIndex: 'budgetMax',
      key: 'budgetMax',
      width: 140,
      render: (max: number, record: Task) => (
        <span className="font-bold text-primary-700">
          {formatCurrency(record.budgetMin)} - {formatCurrency(max)}
        </span>
      ),
      sorter: (a: Task, b: Task) => a.budgetMax - b.budgetMax
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 140,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      sorter: (a: Task, b: Task) => dayjs(a.deadline).valueOf() - dayjs(b.deadline).valueOf()
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={statusColors[status]}>{statusNames[status]}</Tag>
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_: any, record: Task) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/provider/tasks/${record.id}`)}>
            详情
          </Button>
          {record.status === 'bidding' && (
            <Button type="primary" onClick={() => handleBid(record)}>
              投标
            </Button>
          )}
          {record.status === 'in_progress' && (
            <Button type="primary" onClick={() => navigate('/provider/submission')}>
              提交稿件
            </Button>
          )}
        </Space>
      )
    }
  ];

  const bidColumns = [
    {
      title: '任务',
      dataIndex: 'taskTitle',
      key: 'taskTitle',
      render: (text: string, record: Bid) => (
        <div className="cursor-pointer hover:text-primary-700" onClick={() => navigate(`/provider/tasks/${record.taskId}`)}>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-400">
            <Tag color="blue">{record.taskCategory}</Tag>
          </div>
        </div>
      )
    },
    {
      title: '报价',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price: number) => <span className="font-bold text-primary-700">{formatCurrency(price)}</span>
    },
    {
      title: '交付周期',
      dataIndex: 'deliveryDays',
      key: 'deliveryDays',
      width: 100,
      render: (days: number) => `${days}天`
    },
    {
      title: '匹配度',
      dataIndex: 'matchScore',
      key: 'matchScore',
      width: 120,
      render: (score: number) => score ? `${score}%` : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={bidStatusColors[status]}>{bidStatusNames[status]}</Tag>
    },
    {
      title: '投标时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: any, record: Bid) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/provider/tasks/${record.taskId}`)}>
            查看
          </Button>
          {record.status === 'pending' && (
            <Button type="link" danger onClick={() => {
              Modal.confirm({
                title: '取消投标',
                content: '确定要取消该投标吗？',
                onOk: async () => {
                  await bidApi.cancel(record.id);
                  message.success('已取消投标');
                  fetchTasks();
                }
              });
            }}>
              取消
            </Button>
          )}
        </Space>
      )
    }
  ];

  const tabItems = [
    { key: 'bidding', label: '投标中' },
    { key: 'in_progress', label: '进行中' },
    { key: 'submitted', label: '已提交' },
    { key: 'completed', label: '已完成' },
    { key: 'cancelled', label: '已取消' },
    { key: 'all', label: '全部' }
  ];

  return (
    <div>
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">任务管理</h2>
        </div>
      </Card>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="mb-4"
        />
        <Table
          columns={activeTab === 'bidding' ? bidColumns : taskColumns}
          dataSource={activeTab === 'bidding' ? bids : tasks}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => fetchTasks(undefined, page, pageSize)
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="提交投标"
        open={bidModalVisible}
        onCancel={() => {
          setBidModalVisible(false);
          setCurrentTask(null);
          bidForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        {currentTask && (
          <div>
            <div className="p-4 bg-blue-50 rounded-lg mb-4">
              <h4 className="font-medium mb-2">{currentTask.title}</h4>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <MoneyCollectOutlined /> 预算：{formatCurrency(currentTask.budgetMin)} - {formatCurrency(currentTask.budgetMax)}
                </span>
                <span className="flex items-center gap-1">
                  <ClockCircleOutlined /> 截止：{dayjs(currentTask.deadline).format('YYYY-MM-DD')}
                </span>
              </div>
            </div>
            <Form
              form={bidForm}
              layout="vertical"
              onFinish={handleSubmitBid}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="price"
                    label="报价金额（元）"
                    rules={[{ required: true, message: '请输入报价金额' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      max={1000000}
                      placeholder="请输入您的报价"
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => Number(value?.replace(/,/g, '') || 0)}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="deliveryDays"
                    label="交付周期（天）"
                    rules={[{ required: true, message: '请输入交付周期' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      max={365}
                      placeholder="请输入交付天数"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="coverLetter"
                label="投标说明"
                rules={[{ required: true, message: '请输入投标说明' }]}
              >
                <TextArea rows={4} placeholder="请简要介绍您的方案、经验和优势..." />
              </Form.Item>
              <Form.Item className="mb-0 flex justify-end gap-2">
                <Button onClick={() => {
                  setBidModalVisible(false);
                  setCurrentTask(null);
                  bidForm.resetFields();
                }}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  提交投标
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TaskList;
