import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Tag,
  Typography,
  message,
  Card,
  Space,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import { taskApi, userApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Task, TaskStatus, Role, User } from '@/types';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const taskStatusLabels: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: '待实施',
  [TaskStatus.IN_PROGRESS]: '实施中',
  [TaskStatus.COMPLETED]: '已完成',
  [TaskStatus.CONFIRMED]: '已确认',
  [TaskStatus.ARCHIVED]: '已归档',
};

const taskStatusColors: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'orange',
  [TaskStatus.IN_PROGRESS]: 'blue',
  [TaskStatus.COMPLETED]: 'cyan',
  [TaskStatus.CONFIRMED]: 'green',
  [TaskStatus.ARCHIVED]: 'default',
};

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<User[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form] = Form.useForm();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const isSupervisor = user?.role === Role.SUPERVISOR || user?.role === Role.ADMIN;
  const isEmployee = user?.role === Role.EMPLOYEE;

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let response;
      if (isSupervisor) {
        response = await taskApi.getSupervisorTasks({ pageSize: 100 });
      } else {
        response = await taskApi.getEmployeeTasks({ pageSize: 100 });
      }
      if (response.success) {
        setTasks(response.data.tasks);
      }
    } catch (error) {
      message.error('获取任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await userApi.getEmployees();
      if (response.success) {
        setEmployees(response.data);
      }
    } catch (error) {
      console.error('获取员工列表失败');
    }
  };

  useEffect(() => {
    fetchTasks();
    if (isSupervisor) {
      fetchEmployees();
    }
  }, [isSupervisor]);

  const handleAdd = () => {
    setEditingTask(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Task) => {
    setEditingTask(record);
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      dateRange: [dayjs(record.startTime), dayjs(record.endTime)],
      assigneeId: record.assigneeId,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await taskApi.deleteTask(id);
      if (response.success) {
        message.success('任务删除成功');
        fetchTasks();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleStart = async (id: string) => {
    try {
      const response = await taskApi.startTask(id);
      if (response.success) {
        message.success('任务已开始');
        fetchTasks();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleSubmit = async (values: any) => {
    const [startDate, endDate] = values.dateRange as [Dayjs, Dayjs];
    const taskData = {
      title: values.title,
      description: values.description,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      assigneeId: values.assigneeId,
    };

    try {
      if (editingTask) {
        const response = await taskApi.updateTask(editingTask.id, taskData);
        if (response.success) {
          message.success('任务更新成功');
          setModalVisible(false);
          fetchTasks();
        }
      } else {
        const response = await taskApi.createTask(taskData);
        if (response.success) {
          message.success('任务创建成功');
          setModalVisible(false);
          fetchTasks();
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Task) => (
        <a onClick={() => navigate(`/dashboard/tasks/${record.id}`)}>
          {text}
        </a>
      ),
    },
    ...(isSupervisor
      ? [
          {
            title: '实施人',
            dataIndex: ['assignee', 'name'],
            key: 'assignee',
          },
        ]
      : []),
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: TaskStatus) => (
        <Tag color={taskStatusColors[status]}>
          {taskStatusLabels[status]}
        </Tag>
      ),
    },
    {
      title: '计划数/反馈数',
      key: 'counts',
      render: (_: any, record: Task) => (
        <Space>
          <Tag color="blue">计划: {record._count?.plans || 0}</Tag>
          <Tag color="cyan">反馈: {record._count?.feedbacks || 0}</Tag>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Task) => {
        const actions = [];

        // 查看详情
        actions.push(
          <Button
            key="view"
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/dashboard/tasks/${record.id}`)}
          >
            详情
          </Button>
        );

        // 员工：可以开始待实施的任务
        if (isEmployee && record.status === TaskStatus.PENDING) {
          actions.push(
            <Button
              key="start"
              type="link"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStart(record.id)}
            >
              开始任务
            </Button>
          );
        }

        // 主管：可以编辑/删除待实施的任务
        if (isSupervisor && record.status === TaskStatus.PENDING) {
          actions.push(
            <Button
              key="edit"
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          );
          actions.push(
            <Popconfirm
              key="delete-confirm"
              title="确定要删除该任务吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button key="delete" type="link" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          );
        }

        return <Space>{actions}</Space>;
      },
    },
  ];

  return (
    <div>
      <Card
        title={<Title level={4}>任务列表</Title>}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchTasks}>
              刷新
            </Button>
            {isSupervisor && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                新建任务
              </Button>
            )}
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          pagination={{
            showTotal: (total) => `共 ${total} 条记录`,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      <Modal
        title={editingTask ? '编辑任务' : '新建任务'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="任务名称"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="请输入任务名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="任务描述"
          >
            <TextArea
              placeholder="请输入任务描述"
              rows={4}
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="起止时间"
            rules={[{ required: true, message: '请选择起止时间' }]}
          >
            <RangePicker
              showTime
              style={{ width: '100%' }}
              placeholder={['开始时间', '结束时间']}
            />
          </Form.Item>

          <Form.Item
            name="assigneeId"
            label="实施人"
            rules={[{ required: true, message: '请选择实施人' }]}
          >
            <Select placeholder="请选择实施人">
              {employees.map((emp) => (
                <Option key={emp.id} value={emp.id}>
                  {emp.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingTask ? '保存' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Tasks;
