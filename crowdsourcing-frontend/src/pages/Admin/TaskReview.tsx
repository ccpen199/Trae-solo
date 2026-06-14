import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  message,
  Descriptions,
  Divider,
  Row,
  Col,
  Radio,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { taskApi } from '@/api';
import type { Task } from '@/types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const CATEGORIES = [
  { value: 'government', label: '政务办事' },
  { value: 'livelihood', label: '民生服务' },
  { value: 'community', label: '社区治理' },
  { value: 'market', label: '市场监管' },
  { value: 'safety', label: '公共安全' },
  { value: 'data', label: '数据分析' },
];

const AdminTaskReview: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [detailVisible, setDetailVisible] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const data = await taskApi.getTasks({ page, pageSize, status: 'pending' });
      setTasks(data.list || []);
      setPagination({ ...pagination, current: page, pageSize, total: data.total || 0 });
    } catch (error) {
      message.error('加载待审核办件失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (task: Task) => {
    setCurrentTask(task);
    setDetailVisible(true);
  };

  const handleReview = (task: Task, action: 'approve' | 'reject') => {
    setCurrentTask(task);
    form.resetFields();
    form.setFieldsValue({ action });
    setReviewVisible(true);
  };

  const handleSubmitReview = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (values.action === 'approve') {
        await taskApi.approveTask(currentTask!.id);
        message.success('审核通过');
      } else {
        await taskApi.rejectTask(currentTask!.id, {
          reason: values.reason,
        });
        message.success('已驳回');
      }

      setReviewVisible(false);
      loadTasks(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('操作失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: '办件编号',
      dataIndex: 'taskNo',
      key: 'taskNo',
      width: 140,
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '事项名称',
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
      title: '申请人',
      dataIndex: ['employer', 'nickname'],
      key: 'employer',
      width: 120,
    },
    {
      title: '费用标准',
      key: 'budget',
      width: 140,
      render: (_: any, record: Task) => (
        <Text>
          {CATEGORIES.find(c => c.value === record.category)?.label || '政务服务'}
        </Text>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Task) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
           
            onClick={() => handleReview(record, 'approve')}
          >
            通过
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
           
            onClick={() => handleReview(record, 'reject')}
          >
            驳回
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={3} style={{ margin: 0 }}>办件审核</Title>
          <Text type="secondary">审核待受理的办件</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => loadTasks()}>刷新</Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: '暂无待审核办件' }}
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
        title="办件详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>,
        ]}
        width={720}
        destroyOnClose
      >
        {currentTask && (
          <div>
            <Descriptions bordered column={2} className="mb-4">
              <Descriptions.Item label="办件编号">
                <Text code>{currentTask.taskNo}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="分类">
                {CATEGORIES.find(c => c.value === currentTask.category)?.label}
              </Descriptions.Item>
              <Descriptions.Item label="事项名称" span={2}>
                {currentTask.title}
              </Descriptions.Item>
              <Descriptions.Item label="办理期限">
                ¥{currentTask.budgetMin.toLocaleString('zh-CN')} - ¥{currentTask.budgetMax.toLocaleString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="周期">
                {currentTask.duration} 天
              </Descriptions.Item>
              <Descriptions.Item label="办理期限">
                {dayjs(currentTask.deadline).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="申请人">
                {currentTask.employer?.nickname}
              </Descriptions.Item>
              <Descriptions.Item label="提交时间">
                {dayjs(currentTask.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">事项描述</Divider>
            <Paragraph className="mb-4">{currentTask.description}</Paragraph>

            {currentTask.skills && currentTask.skills.length > 0 && (
              <>
                <Divider orientation="left">专长要求</Divider>
                <div className="flex flex-wrap gap-2 mb-4">
                  {currentTask.skills.map((skill, index) => (
                    <Tag key={index} color="blue">{skill}</Tag>
                  ))}
                </div>
              </>
            )}

            {currentTask.attachments && currentTask.attachments.length > 0 && (
              <>
                <Divider orientation="left">申报材料</Divider>
                <div className="space-y-2">
                  {currentTask.attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <EyeOutlined className="text-blue-600" />
                      <Text>{file.name}</Text>
                      <Button type="link" href={file.url} target="_blank">
                        查看
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="审核办件"
        open={reviewVisible}
        onCancel={() => setReviewVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setReviewVisible(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submitting}
            onClick={handleSubmitReview}
            danger={form.getFieldValue('action') === 'reject'}
          >
            确认{form.getFieldValue('action') === 'approve' ? '通过' : '驳回'}
          </Button>,
        ]}
        width={600}
        destroyOnClose
      >
        {currentTask && (
          <div>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <Text strong className="block mb-1">{currentTask.title}</Text>
              <Text type="secondary" className="text-sm">
                办件编号：{currentTask.taskNo}
              </Text>
              <br />
              <Text type="secondary" className="text-sm">
                费用标准：{CATEGORIES.find(c => c.value === currentTask.category)?.label || '政务服务'}
              </Text>
            </div>

            <Form form={form} layout="vertical">
              <Form.Item
                name="action"
                label="审核结果"
                rules={[{ required: true, message: '请选择审核结果' }]}
              >
                <Radio.Group>
                  <Radio.Button value="approve">
                    <CheckCircleOutlined className="text-green-500 mr-1" />
                    审核通过
                  </Radio.Button>
                  <Radio.Button value="reject">
                    <CloseCircleOutlined className="text-red-500 mr-1" />
                    驳回申请
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prev, curr) => prev.action !== curr.action}
              >
                {({ getFieldValue }) =>
                  getFieldValue('action') === 'reject' ? (
                    <Form.Item
                      name="reason"
                      label="驳回原因"
                      rules={[{ required: true, message: '请输入驳回原因' }]}
                    >
                      <TextArea
                        rows={4}
                        placeholder="请详细说明驳回的原因"
                        showCount
                        maxLength={500}
                      />
                    </Form.Item>
                  ) : (
                    <div className="p-4 bg-green-50 rounded-lg mb-4">
                      <CheckCircleOutlined className="text-green-500 mr-2" />
                      <Text type="success">
                        审核通过后，办件将正式发布并开始接受承办单位申请
                      </Text>
                    </div>
                  )
                }
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminTaskReview;
