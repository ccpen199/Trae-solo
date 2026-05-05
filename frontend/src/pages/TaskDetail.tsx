import React, { useState, useEffect } from 'react';
import {
  Descriptions,
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Tag,
  Typography,
  message,
  Space,
  Popconfirm,
  Table,
  Divider,
  Empty,
  Result,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import { taskApi, planApi, feedbackApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Task, TaskStatus, Plan, PlanStatus, Role, Feedback } from '@/types';

const { Title, Text, Paragraph } = Typography;
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

const planStatusLabels: Record<PlanStatus, string> = {
  [PlanStatus.DRAFT]: '草稿',
  [PlanStatus.IN_PROGRESS]: '进行中',
  [PlanStatus.COMPLETED]: '已完成',
};

const planStatusColors: Record<PlanStatus, string> = {
  [PlanStatus.DRAFT]: 'default',
  [PlanStatus.IN_PROGRESS]: 'processing',
  [PlanStatus.COMPLETED]: 'success',
};

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [task, setTask] = useState<Task | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 计划模态框
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planForm] = Form.useForm();
  
  // 反馈模态框
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackForm] = Form.useForm();

  const isSupervisor = user?.role === Role.SUPERVISOR || user?.role === Role.ADMIN;
  const isEmployee = user?.role === Role.EMPLOYEE;

  const fetchTaskDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await taskApi.getTaskById(id);
      if (response.success) {
        setTask(response.data);
      }
    } catch (error) {
      message.error('获取任务详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    if (!id) return;
    try {
      const response = await planApi.getPlansByTask(id);
      if (response.success) {
        setPlans(response.data);
      }
    } catch (error) {
      console.error('获取计划列表失败');
    }
  };

  const fetchFeedbacks = async () => {
    if (!id) return;
    try {
      const response = await feedbackApi.getFeedbacksByTask(id);
      if (response.success) {
        setFeedbacks(response.data);
      }
    } catch (error) {
      console.error('获取反馈列表失败');
    }
  };

  useEffect(() => {
    fetchTaskDetail();
    fetchPlans();
    fetchFeedbacks();
  }, [id]);

  // 检查是否所有计划都已完成
  const allPlansCompleted = plans.length > 0 && plans.every(p => p.status === PlanStatus.COMPLETED);

  // 计划操作
  const handleAddPlan = () => {
    setEditingPlan(null);
    planForm.resetFields();
    setPlanModalVisible(true);
  };

  const handleEditPlan = (record: Plan) => {
    setEditingPlan(record);
    planForm.setFieldsValue({
      title: record.title,
      description: record.description,
      dateRange: [dayjs(record.startTime), dayjs(record.endTime)],
      status: record.status,
    });
    setPlanModalVisible(true);
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      const response = await planApi.deletePlan(planId);
      if (response.success) {
        message.success('计划删除成功');
        fetchPlans();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleSubmitPlan = async (values: any) => {
    if (!id) return;
    
    const [startDate, endDate] = values.dateRange as [Dayjs, Dayjs];
    const planData = {
      taskId: id,
      title: values.title,
      description: values.description,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      status: values.status,
    };

    try {
      if (editingPlan) {
        const response = await planApi.updatePlan(editingPlan.id, planData);
        if (response.success) {
          message.success('计划更新成功');
          setPlanModalVisible(false);
          fetchPlans();
        }
      } else {
        const { status, ...createData } = planData;
        const response = await planApi.createPlan(createData);
        if (response.success) {
          message.success('计划创建成功');
          setPlanModalVisible(false);
          fetchPlans();
          fetchTaskDetail(); // 刷新任务状态
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  // 提交反馈
  const handleSubmitFeedback = async (values: any) => {
    if (!id) return;
    
    try {
      const response = await feedbackApi.submitFeedback({
        taskId: id,
        content: values.content,
      });
      if (response.success) {
        message.success('反馈提交成功，任务已标记为已完成');
        setFeedbackModalVisible(false);
        fetchFeedbacks();
        fetchTaskDetail();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '提交失败');
    }
  };

  // 主管确认任务完成
  const handleConfirmTask = async () => {
    if (!id) return;
    try {
      const response = await taskApi.confirmTask(id);
      if (response.success) {
        message.success('任务确认完成');
        fetchTaskDetail();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  // 计划表格列
  const planColumns = [
    {
      title: '计划名称',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
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
      render: (status: PlanStatus) => (
        <Tag color={planStatusColors[status]}>
          {planStatusLabels[status]}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Plan) => {
        if (!isEmployee) return null;
        if (
          task?.status === TaskStatus.COMPLETED ||
          task?.status === TaskStatus.CONFIRMED ||
          task?.status === TaskStatus.ARCHIVED
        ) {
          return null;
        }
        return (
          <Space>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditPlan(record)}
            >
              编辑
            </Button>
            <Popconfirm
              title="确定要删除该计划吗？"
              onConfirm={() => handleDeletePlan(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  if (!id) {
    return (
      <Result
        status="error"
        title="任务不存在"
        subTitle="任务ID参数缺失"
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard/tasks')}>
            返回任务列表
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/dashboard/tasks')}
        style={{ marginBottom: 16 }}
      >
        返回任务列表
      </Button>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>加载中...</div>
      ) : task ? (
        <>
          {/* 任务基本信息 */}
          <Card title={<Title level={4}>任务信息</Title>}>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="任务名称" span={2}>
                <Text strong>{task.title}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {task.description || <Text type="secondary">暂无描述</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">
                {new Date(task.startTime).toLocaleString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="结束时间">
                {new Date(task.endTime).toLocaleString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="创建人">
                {task.creator?.name}
              </Descriptions.Item>
              <Descriptions.Item label="实施人">
                {task.assignee?.name}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={taskStatusColors[task.status]}>
                  {taskStatusLabels[task.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="操作">
                <Space>
                  {/* 主管确认任务 */}
                  {isSupervisor && task.status === TaskStatus.COMPLETED && (
                    <Popconfirm
                      title="确认该任务已完成吗？"
                      onConfirm={handleConfirmTask}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                      >
                        确认完成
                      </Button>
                    </Popconfirm>
                  )}
                  {/* 员工提交反馈 */}
                  {isEmployee &&
                    task.status === TaskStatus.IN_PROGRESS &&
                    allPlansCompleted && (
                      <Button
                        type="primary"
                        onClick={() => {
                          feedbackForm.resetFields();
                          setFeedbackModalVisible(true);
                        }}
                      >
                        提交反馈并完成
                      </Button>
                    )}
                </Space>
              </Descriptions.Item>
            </Descriptions>

            {/* 提示信息 */}
            {isEmployee &&
              task.status === TaskStatus.IN_PROGRESS &&
              !allPlansCompleted && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 12,
                    backgroundColor: '#fffbe6',
                    border: '1px solid #ffe58f',
                    borderRadius: 4,
                  }}
                >
                  <Text type="warning">
                    提示：请先完成所有计划后再提交反馈。当前还有 {plans.filter(p => p.status !== PlanStatus.COMPLETED).length} 个计划未完成。
                  </Text>
                </div>
              )}
          </Card>

          <Divider />

          {/* 计划列表 */}
          <Card
            title={<Title level={4}>计划列表</Title>}
            extra={
              isEmployee &&
              task.status !== TaskStatus.COMPLETED &&
              task.status !== TaskStatus.CONFIRMED &&
              task.status !== TaskStatus.ARCHIVED ? (
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPlan}>
                  新建计划
                </Button>
              ) : null
            }
          >
            {plans.length > 0 ? (
              <Table
                columns={planColumns}
                dataSource={plans}
                rowKey="id"
                pagination={false}
              />
            ) : (
              <Empty description="暂无计划，员工可以创建计划来拆解任务" />
            )}
          </Card>

          <Divider />

          {/* 反馈列表 */}
          <Card title={<Title level={4}>执行反馈</Title>}>
            {feedbacks.length > 0 ? (
              <div>
                {feedbacks.map((feedback) => (
                  <div
                    key={feedback.id}
                    style={{
                      padding: 16,
                      marginBottom: 16,
                      backgroundColor: '#fafafa',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>{feedback.creator?.name}</Text>
                      <Text type="secondary" style={{ marginLeft: 12 }}>
                        {new Date(feedback.createdAt).toLocaleString('zh-CN')}
                      </Text>
                    </div>
                    <Paragraph style={{ margin: 0 }}>{feedback.content}</Paragraph>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="暂无反馈，员工完成任务后会提交反馈" />
            )}
          </Card>
        </>
      ) : (
        <Result
          status="error"
          title="任务不存在"
          subTitle="该任务可能已被删除或您无权查看"
          extra={
            <Button type="primary" onClick={() => navigate('/dashboard/tasks')}>
              返回任务列表
            </Button>
          }
        />
      )}

      {/* 计划模态框 */}
      <Modal
        title={editingPlan ? '编辑计划' : '新建计划'}
        open={planModalVisible}
        onCancel={() => setPlanModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={planForm}
          layout="vertical"
          onFinish={handleSubmitPlan}
        >
          <Form.Item
            name="title"
            label="计划名称"
            rules={[{ required: true, message: '请输入计划名称' }]}
          >
            <Input placeholder="请输入计划名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="计划描述"
          >
            <TextArea
              placeholder="请输入计划描述"
              rows={3}
              showCount
              maxLength={500}
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

          {editingPlan && (
            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="请选择状态">
                <Option value={PlanStatus.DRAFT}>草稿</Option>
                <Option value={PlanStatus.IN_PROGRESS}>进行中</Option>
                <Option value={PlanStatus.COMPLETED}>已完成</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setPlanModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingPlan ? '保存' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 反馈模态框 */}
      <Modal
        title="提交反馈"
        open={feedbackModalVisible}
        onCancel={() => setFeedbackModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            提交反馈后，任务状态将变为"已完成"，等待主管确认。
          </Text>
        </div>
        <Form
          form={feedbackForm}
          layout="vertical"
          onFinish={handleSubmitFeedback}
        >
          <Form.Item
            name="content"
            label="反馈内容"
            rules={[{ required: true, message: '请输入反馈内容' }]}
          >
            <TextArea
              placeholder="请详细描述任务完成情况..."
              rows={6}
              showCount
              maxLength={2000}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setFeedbackModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                提交反馈
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskDetail;
