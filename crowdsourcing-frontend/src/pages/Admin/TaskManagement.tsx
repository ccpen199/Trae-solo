import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Input,
  Select,
  DatePicker,
  Form,
  Modal,
  Descriptions,
  Row,
  Col,
  message,
  Popconfirm,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { taskApi } from '@/api';
import type { Task } from '@/types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const TASK_STATUS: Record<string, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'default' },
  pending: { text: '待审核', color: 'warning' },
  published: { text: '已发布', color: 'processing' },
  bidding: { text: '投标中', color: 'blue' },
  selected: { text: '已选标', color: 'geekblue' },
  in_progress: { text: '进行中', color: 'cyan' },
  submitted: { text: '已提交', color: 'purple' },
  reviewing: { text: '评审中', color: 'magenta' },
  revising: { text: '修改中', color: 'orange' },
  completed: { text: '已完成', color: 'success' },
  cancelled: { text: '已取消', color: 'default' },
  disputed: { text: '有争议', color: 'error' },
};

const CATEGORIES = [
  { value: 'logo', label: 'LOGO设计' },
  { value: 'brand', label: '品牌设计' },
  { value: 'ui', label: 'UI设计' },
  { value: 'illustration', label: '插画设计' },
  { value: 'video', label: '视频制作' },
  { value: 'copywriting', label: '文案策划' },
];

const AdminTaskManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async (page = 1, pageSize = 10, params?: any) => {
    try {
      setLoading(true);
      const data = await taskApi.getTasks({ page, pageSize, ...params });
      setTasks(data.list || []);
      setPagination({ ...pagination, current: page, pageSize, total: data.total || 0 });
    } catch (error) {
      message.error('加载任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const params: any = {};
    if (values.keyword) params.keyword = values.keyword;
    if (values.status) params.status = values.status;
    if (values.category) params.category = values.category;
    if (values.dateRange && values.dateRange.length === 2) {
      params.startDate = values.dateRange[0].format('YYYY-MM-DD');
      params.endDate = values.dateRange[1].format('YYYY-MM-DD');
    }
    loadTasks(1, pagination.pageSize, params);
  };

  const handleReset = () => {
    form.resetFields();
    loadTasks(1, pagination.pageSize);
  };

  const handleViewDetail = (task: Task) => {
    setCurrentTask(task);
    setDetailVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await taskApi.deleteTask(id);
      message.success('删除成功');
      loadTasks(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '任务编号',
      dataIndex: 'taskNo',
      key: 'taskNo',
      width: 140,
      fixed: 'left',
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '任务标题',
      dataIndex: 'title',
      key: 'title',
      minWidth: 200,
      render: (text: string, record: Task) => (
        <div>
          <Text strong className="block">{text}</Text>
          <Text type="secondary" className="text-xs">
            {CATEGORIES.find(c => c.value === record.category)?.label}
          </Text>
        </div>
      ),
    },
    {
      title: '雇主',
      dataIndex: ['employer', 'nickname'],
      key: 'employer',
      width: 120,
    },
    {
      title: '预算',
      key: 'budget',
      width: 140,
      render: (_: any, record: Task) => (
        <Text>
          ¥{record.budgetMin.toLocaleString('zh-CN')} - ¥{record.budgetMax.toLocaleString('zh-CN')}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const s = TASK_STATUS[status] || TASK_STATUS.draft;
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '投标数',
      dataIndex: 'bidCount',
      key: 'bidCount',
      width: 80,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: any, record: Task) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" icon={<EditOutlined />}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个任务吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={3} style={{ margin: 0 }}>任务管理</Title>
          <Text type="secondary">管理平台所有任务</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>刷新</Button>
          <Button type="primary">导出数据</Button>
        </Space>
      </div>

      <Card className="mb-6">
        <Form form={form} layout="inline">
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="任务编号/标题" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={5}>
              <Form.Item name="status" label="状态">
                <Select placeholder="全部状态" allowClear>
                  {Object.entries(TASK_STATUS).map(([key, value]) => (
                    <Option key={key} value={key}>{value.text}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={5}>
              <Form.Item name="category" label="分类">
                <Select placeholder="全部分类" allowClear>
                  {CATEGORIES.map(cat => (
                    <Option key={cat.value} value={cat.value}>{cat.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item name="dateRange" label="创建时间">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} lg={2}>
              <Form.Item label=" ">
                <Space>
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
                  <Button icon={<FilterOutlined />} onClick={handleReset}>重置</Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => loadTasks(page, pageSize),
          }}
        />
      </Card>

      <Modal
        title="任务详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>,
        ]}
        width={800}
        destroyOnClose
      >
        {currentTask && (
          <div>
            <Descriptions bordered column={2} className="mb-4">
              <Descriptions.Item label="任务编号">
                <Text code>{currentTask.taskNo}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {(() => {
                  const s = TASK_STATUS[currentTask.status] || TASK_STATUS.draft;
                  return <Tag color={s.color}>{s.text}</Tag>;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="任务标题" span={2}>
                {currentTask.title}
              </Descriptions.Item>
              <Descriptions.Item label="分类">
                {CATEGORIES.find(c => c.value === currentTask.category)?.label}
              </Descriptions.Item>
              <Descriptions.Item label="预算范围">
                ¥{currentTask.budgetMin.toLocaleString('zh-CN')} - ¥{currentTask.budgetMax.toLocaleString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="周期">
                {currentTask.duration} 天
              </Descriptions.Item>
              <Descriptions.Item label="截止日期">
                {dayjs(currentTask.deadline).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="投标人数">
                {currentTask.bidCount || 0} 人
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(currentTask.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="雇主">
                {currentTask.employer?.nickname}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">任务描述</Divider>
            <Paragraph className="mb-4">{currentTask.description}</Paragraph>

            {currentTask.skills && currentTask.skills.length > 0 && (
              <>
                <Divider orientation="left">技能要求</Divider>
                <div className="flex flex-wrap gap-2 mb-4">
                  {currentTask.skills.map((skill, index) => (
                    <Tag key={index} color="blue">{skill}</Tag>
                  ))}
                </div>
              </>
            )}

            {currentTask.selectedProvider && (
              <>
                <Divider orientation="left">中标服务商</Divider>
                <Descriptions column={2}>
                  <Descriptions.Item label="服务商">
                    {currentTask.selectedProvider.nickname}
                  </Descriptions.Item>
                  <Descriptions.Item label="中标金额">
                    ¥{currentTask.selectedBid?.amount?.toLocaleString('zh-CN')}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminTaskManagement;
