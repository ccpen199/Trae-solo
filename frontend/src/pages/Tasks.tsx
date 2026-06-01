import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  Modal,
  Space,
  Typography,
  message,
  Descriptions,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  CameraOutlined,
  CalculatorOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { taskAPI, authAPI } from '../services/api';
import { ClaimTask, TASK_STATUS_MAP, TASK_STATUS_COLOR, User } from '../types';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<ClaimTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>();
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadTasks();
  }, [page, pageSize, statusFilter, keyword]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await taskAPI.getTasks({
        page: 1,
        pageSize: 1000,
        status: statusFilter,
      });
      let allTasks = response.data.list || [];
      
      // 关键词过滤
      if (keyword.trim()) {
        const lowerKeyword = keyword.toLowerCase();
        allTasks = allTasks.filter((task: ClaimTask) =>
          task.task_no.toLowerCase().includes(lowerKeyword) ||
          task.owner_name.toLowerCase().includes(lowerKeyword) ||
          task.accident_location.toLowerCase().includes(lowerKeyword) ||
          task.policy_no.toLowerCase().includes(lowerKeyword)
        );
      }
      
      // 分页
      const startIndex = (page - 1) * pageSize;
      const paginatedTasks = allTasks.slice(startIndex, startIndex + pageSize);
      
      setTasks(paginatedTasks);
      setTotal(allTasks.length);
    } catch (error) {
      message.error('加载任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '任务编号',
      dataIndex: 'task_no',
      key: 'task_no',
      width: 120,
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
    },
    {
      title: '事故地点',
      dataIndex: 'accident_location',
      key: 'accident_location',
      ellipsis: true,
    },
    {
      title: '车主',
      dataIndex: 'owner_name',
      key: 'owner_name',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      filters: Object.entries(TASK_STATUS_MAP).map(([value, label]) => ({
        text: label,
        value,
      })),
      render: (status: string) => (
        <Tag color={TASK_STATUS_COLOR[status]}>{TASK_STATUS_MAP[status]}</Tag>
      ),
    },
    {
      title: '超期',
      dataIndex: 'is_overdue',
      key: 'is_overdue',
      width: 80,
      render: (overdue: number) =>
        overdue ? <Badge status="error" text="是" /> : <Badge status="success" text="否" />,
    },
    {
      title: '处理人',
      dataIndex: 'handler_name',
      key: 'handler_name',
      width: 100,
      render: (name: string) => name || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: ClaimTask) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/tasks/${record.id}`)}>
          详情
          </Button>
          <Button type="link" icon={<CameraOutlined />} onClick={() => navigate(`/photos/${record.id}`)}>
            照片
          </Button>
          <Button type="link" icon={<CalculatorOutlined />} onClick={() => navigate(`/loss/${record.id}`)}>
            定损
          </Button>
          <Button type="link" icon={<AuditOutlined />} onClick={() => navigate(`/review/${record.id}`)}>
            审核
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>查勘任务管理</Title>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Input
              placeholder="搜索任务编号、车主、事故地点"
              style={{ width: 280 }}
              allowClear
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={loadTasks}
              prefix={<SearchOutlined />}
            />
            <Select
              placeholder="筛选状态"
              style={{ width: 150 }}
              allowClear
              onChange={setStatusFilter}
            >
              {Object.entries(TASK_STATUS_MAP).map(([value, label]) => (
                <Option key={value} value={value}>{label}</Option>
              ))}
            </Select>
            <Button type="primary" icon={<SearchOutlined />} onClick={loadTasks}>
              搜索
            </Button>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/tasks/new')}>
            新建任务
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
            showSizeChanger: true,
            showTotal: (total) => '共 ' + total + ' 条',
          }}
        />
      </Card>
    </div>
  );
};

export const NewTask: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      await taskAPI.createTask({
        ...values,
        accident_time: values.accident_time?.toISOString(),
        appointment_time: values.appointment_time?.toISOString(),
      });
      message.success('任务创建成功');
      navigate('/tasks');
    } catch (error) {
      message.error('任务创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>新建查勘任务</Title>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onSubmit}
          style={{ maxWidth: 800 }}
        >
          <Form.Item
            name="source"
            label="案件来源"
            rules={[{ required: true, message: '请输入案件来源' }]}
          >
            <Input placeholder="如：电话报案、APP报案" />
          </Form.Item>

          <Form.Item
            name="accident_location"
            label="事故地点"
            rules={[{ required: true, message: '请输入事故地点' }]}
          >
            <Input placeholder="请输入详细地址" />
          </Form.Item>

          <Form.Item
            name="accident_time"
            label="事故时间"
            rules={[{ required: true, message: '请选择事故时间' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="policy_no"
            label="保单号"
            rules={[{ required: true, message: '请输入保单号' }]}
          >
            <Input placeholder="请输入保单号" />
          </Form.Item>

          <Form.Item
            name="policy_holder"
            label="被保险人"
            rules={[{ required: true, message: '请输入被保险人姓名' }]}
          >
            <Input placeholder="请输入被保险人姓名" />
          </Form.Item>

          <Form.Item
            name="vehicle_info"
            label="车辆信息"
            rules={[{ required: true, message: '请输入车辆信息' }]}
          >
            <Input placeholder="如：品牌型号、车牌号" />
          </Form.Item>

          <Form.Item
            name="owner_name"
            label="车主姓名"
            rules={[{ required: true, message: '请输入车主姓名' }]}
          >
            <Input placeholder="请输入车主姓名" />
          </Form.Item>

          <Form.Item
            name="owner_phone"
            label="车主电话"
            rules={[{ required: true, message: '请输入车主电话' }]}
          >
            <Input placeholder="请输入车主联系电话" />
          </Form.Item>

          <Form.Item name="appointment_time" label="预约查勘时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                创建任务
              </Button>
              <Button onClick={() => navigate('/tasks')}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<ClaimTask | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignForm] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadTaskDetail();
      loadUsers();
    }
  }, [id]);

  const loadTaskDetail = async () => {
    setLoading(true);
    try {
      const response = await taskAPI.getTask(id!);
      setTask(response.data);
    } catch (error) {
      message.error('加载任务详情失败');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await authAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('加载用户列表失败');
    }
  };

  const handleAssign = async (values: any) => {
    try {
      await taskAPI.assignTask(id!, values.handler_id, values.reason);
      message.success('任务分配成功');
      setAssignModalVisible(false);
      loadTaskDetail();
    } catch (error) {
      message.error('任务分配失败');
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await taskAPI.updateStatus(id!, status);
      message.success('状态更新成功');
      loadTaskDetail();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  if (loading || !task) {
    return <div style={{ padding: 24 }}>加载中...</div>;
  }

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>任务详情</Title>

      <Card style={{ marginBottom: 24 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="任务编号" span={1}>
            {task.task_no}
          </Descriptions.Item>
          <Descriptions.Item label="状态" span={1}>
            <Tag color={TASK_STATUS_COLOR[task.status]}>{TASK_STATUS_MAP[task.status]}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="案件来源" span={1}>
            {task.source}
          </Descriptions.Item>
          <Descriptions.Item label="事故地点" span={1}>
            {task.accident_location}
          </Descriptions.Item>
          <Descriptions.Item label="事故时间" span={1}>
            {dayjs(task.accident_time).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="保单号" span={1}>
            {task.policy_no}
          </Descriptions.Item>
          <Descriptions.Item label="被保险人" span={1}>
            {task.policy_holder}
          </Descriptions.Item>
          <Descriptions.Item label="车辆信息" span={1}>
            {task.vehicle_info}
          </Descriptions.Item>
          <Descriptions.Item label="车主姓名" span={1}>
            {task.owner_name}
          </Descriptions.Item>
          <Descriptions.Item label="车主电话" span={1}>
            {task.owner_phone}
          </Descriptions.Item>
          <Descriptions.Item label="预约查勘时间" span={1}>
            {task.appointment_time ? dayjs(task.appointment_time).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="当前处理人" span={1}>
            {task.handler_name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="是否超期" span={1}>
            {task.is_overdue ? '是' : '否'}
          </Descriptions.Item>
          <Descriptions.Item label="超期原因" span={1}>
            {task.overdue_reason || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="操作">
        <Space wrap>
          <Button type="primary" onClick={() => setAssignModalVisible(true)}>
            分配任务
          </Button>
          <Button onClick={() => handleStatusChange('surveying')}>
            开始查勘
          </Button>
          <Button onClick={() => handleStatusChange('assessing')}>
            开始定损
          </Button>
          <Button onClick={() => handleStatusChange('reviewing')}>
            提交审核
          </Button>
          <Button type="primary" onClick={() => navigate('/photos/' + task.id)} icon={<CameraOutlined />}>
            上传照片
          </Button>
          <Button type="primary" onClick={() => navigate('/loss/' + task.id)} icon={<CalculatorOutlined />}>
            录入损失
          </Button>
          <Button type="primary" onClick={() => navigate('/review/' + task.id)} icon={<AuditOutlined />}>
            审核定损
          </Button>
        </Space>
      </Card>

      <Modal
        title="分配任务"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        onOk={() => assignForm.submit()}
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssign}>
          <Form.Item
            name="handler_id"
            label="选择处理人"
            rules={[{ required: true, message: '请选择处理人' }]}
          >
            <Select placeholder="请选择处理人">
              {users.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="reason" label="分配原因">
            <TextArea rows={3} placeholder="请输入分配原因或备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Tasks;
