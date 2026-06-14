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
  Select,
  Upload,
  message,
  Descriptions,
  Divider,
  Timeline,
  Row,
  Col,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  FileTextOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { disputeApi, taskApi } from '@/api';
import type { Dispute, Task } from '@/types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const DISPUTE_STATUS: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
  pending: { text: '待处理', color: 'warning', icon: <ClockCircleOutlined /> },
  investigating: { text: '调查中', color: 'processing', icon: <ClockCircleOutlined /> },
  resolved: { text: '已解决', color: 'success', icon: <CheckCircleOutlined /> },
  rejected: { text: '已驳回', color: 'error', icon: <CloseCircleOutlined /> },
  cancelled: { text: '已取消', color: 'default', icon: <CloseCircleOutlined /> },
};

const DISPUTE_TYPES = [
  { value: 'payment', label: '支付纠纷' },
  { value: 'quality', label: '质量纠纷' },
  { value: 'deadline', label: '交付时间纠纷' },
  { value: 'scope', label: '需求范围纠纷' },
  { value: 'communication', label: '沟通问题' },
  { value: 'other', label: '其他' },
];

const ProviderDisputes: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentDispute, setCurrentDispute] = useState<Dispute | null>(null);
  const [form] = Form.useForm();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [evidenceList, setEvidenceList] = useState<UploadProps['fileList']>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDisputes();
    loadTasks();
  }, []);

  const loadDisputes = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const data = await disputeApi.getDisputes({ page, pageSize });
      setDisputes(data.list || []);
      setPagination({ ...pagination, current: page, pageSize, total: data.total || 0 });
    } catch (error) {
      message.error('加载争议列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const data = await taskApi.getProviderTasks({});
      setTasks(data.list || []);
    } catch (error) {
      console.error('加载任务列表失败');
    }
  };

  const handleInitiate = () => {
    form.resetFields();
    setEvidenceList([]);
    setModalVisible(true);
  };

  const handleViewDetail = (dispute: Dispute) => {
    setCurrentDispute(dispute);
    setDetailVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const formData = new FormData();
      formData.append('taskId', values.taskId);
      formData.append('type', values.type);
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('amount', values.amount?.toString() || '0');
      formData.append('expectedResolution', values.expectedResolution || '');

      evidenceList?.forEach((file, index) => {
        if (file.originFileObj) {
          formData.append(`evidence[${index}]`, file.originFileObj);
        }
      });

      await disputeApi.createDispute(formData);
      message.success('申诉提交成功');
      setModalVisible(false);
      loadDisputes();
    } catch (error) {
      message.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: '争议编号',
      dataIndex: 'disputeNo',
      key: 'disputeNo',
      width: 140,
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '任务信息',
      key: 'task',
      render: (_, record: Dispute) => (
        <div>
          <Text strong className="block">{record.task?.title}</Text>
          <Text type="secondary" className="text-sm">
            {record.task?.taskNo}
          </Text>
        </div>
      ),
    },
    {
      title: '争议类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const typeInfo = DISPUTE_TYPES.find(t => t.value === type);
        return <Tag>{typeInfo?.label || type}</Tag>;
      },
    },
    {
      title: '争议金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => (
        <Text strong type="danger">
          ¥{amount?.toLocaleString('zh-CN') || '0'}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusInfo = DISPUTE_STATUS[status] || DISPUTE_STATUS.pending;
        return (
          <Tag color={statusInfo.color} icon={statusInfo.icon}>
            {statusInfo.text}
          </Tag>
        );
      },
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
      width: 100,
      render: (_, record: Dispute) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      ),
    },
  ];

  const uploadProps: UploadProps = {
    fileList: evidenceList,
    onChange: ({ fileList: newFileList }) => setEvidenceList(newFileList),
    beforeUpload: () => false,
    multiple: true,
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={3} style={{ margin: 0 }}>争议中心</Title>
          <Text type="secondary">维护您的合法权益，公平解决交易纠纷</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleInitiate}>
          发起申诉
        </Button>
      </div>

      <Alert
        message="申诉须知"
        description={
          <ul className="m-0 pl-4">
            <li>请提供充分的证据材料，包括聊天记录、稿件文件、合同约定等</li>
            <li>平台仲裁将在 3-5 个工作日内完成调查并给出裁决</li>
            <li>如对裁决结果不满意，可申请二次仲裁</li>
            <li>恶意申诉将影响您的信用评级</li>
          </ul>
        }
        type="info"
        showIcon
        className="mb-6"
      />

      <Card>
        <Table
          columns={columns}
          dataSource={disputes}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => loadDisputes(page, pageSize),
          }}
        />
      </Card>

      <Modal
        title="发起申诉"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={submitting} onClick={handleSubmit}>
            提交申诉
          </Button>,
        ]}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="taskId"
            label="选择任务"
            rules={[{ required: true, message: '请选择相关任务' }]}
          >
            <Select placeholder="请选择有争议的任务" showSearch>
              {tasks.map(task => (
                <Option key={task.id} value={task.id}>
                  {task.title} - {task.taskNo}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="争议类型"
                rules={[{ required: true, message: '请选择争议类型' }]}
              >
                <Select placeholder="请选择争议类型">
                  {DISPUTE_TYPES.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="争议金额 (元)"
                rules={[{ required: true, message: '请输入争议金额' }]}
              >
                <Input type="number" placeholder="请输入争议金额" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="title"
            label="申诉标题"
            rules={[{ required: true, message: '请输入申诉标题' }]}
          >
            <Input placeholder="简要描述您的申诉内容" maxLength={100} showCount />
          </Form.Item>

          <Form.Item
            name="description"
            label="详细描述"
            rules={[{ required: true, message: '请输入详细描述' }]}
          >
            <TextArea
              rows={4}
              placeholder="请详细描述争议的经过、您的诉求以及相关情况"
              showCount
              maxLength={2000}
            />
          </Form.Item>

          <Form.Item
            name="expectedResolution"
            label="期望解决方式"
            rules={[{ required: true, message: '请输入期望的解决方式' }]}
          >
            <TextArea
              rows={2}
              placeholder="例如：要求全额退款、要求重新交付、要求补偿损失等"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            label="上传证据"
            name="evidence"
            rules={[{ required: true, message: '请上传相关证据' }]}
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
            <Text type="secondary" className="block mt-1 text-sm">
              支持图片、PDF、Word、压缩包等格式，可上传多个文件
            </Text>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="争议详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
        destroyOnClose
      >
        {currentDispute && (
          <div>
            <Descriptions bordered column={2} className="mb-6">
              <Descriptions.Item label="争议编号">
                <Text code>{currentDispute.disputeNo}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {(() => {
                  const statusInfo = DISPUTE_STATUS[currentDispute.status] || DISPUTE_STATUS.pending;
                  return (
                    <Tag color={statusInfo.color} icon={statusInfo.icon}>
                      {statusInfo.text}
                    </Tag>
                  );
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="争议类型">
                {DISPUTE_TYPES.find(t => t.value === currentDispute.type)?.label}
              </Descriptions.Item>
              <Descriptions.Item label="争议金额">
                <Text strong type="danger">
                  ¥{currentDispute.amount?.toLocaleString('zh-CN') || '0'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="任务名称" span={2}>
                {currentDispute.task?.title}
              </Descriptions.Item>
              <Descriptions.Item label="申诉时间">
                {dayjs(currentDispute.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="期望解决方式" span={2}>
                {currentDispute.expectedResolution || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">申诉描述</Divider>
            <Paragraph className="mb-6">{currentDispute.description}</Paragraph>

            {currentDispute.evidence && currentDispute.evidence.length > 0 && (
              <>
                <Divider orientation="left">证据材料</Divider>
                <div className="space-y-2 mb-6">
                  {currentDispute.evidence.map((file, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <FileTextOutlined className="text-blue-600" />
                      <Text>{file.name}</Text>
                      <Button type="link" href={file.url} target="_blank">
                        查看
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {currentDispute.arbitrationResult && (
              <>
                <Divider orientation="left">仲裁结果</Divider>
                <Alert
                  message={
                    currentDispute.arbitrationResult === 'plaintiff'
                      ? '申诉成立'
                      : currentDispute.arbitrationResult === 'defendant'
                      ? '申诉驳回'
                      : '部分支持'
                  }
                  description={
                    <div>
                      <Paragraph className="m-0">
                        <Text strong>裁决理由：</Text>
                        {currentDispute.arbitrationReason}
                      </Paragraph>
                      {currentDispute.compensationAmount > 0 && (
                        <Paragraph className="m-0 mt-2">
                          <Text strong>赔偿金额：</Text>
                          <Text type="danger" strong>
                            ¥{currentDispute.compensationAmount?.toLocaleString('zh-CN')}
                          </Text>
                        </Paragraph>
                      )}
                      <Paragraph className="m-0 mt-2">
                        <Text strong>裁决时间：</Text>
                        {dayjs(currentDispute.resolvedAt!).format('YYYY-MM-DD HH:mm')}
                      </Paragraph>
                    </div>
                  }
                  type={
                    currentDispute.arbitrationResult === 'plaintiff'
                      ? 'success'
                      : currentDispute.arbitrationResult === 'defendant'
                      ? 'error'
                      : 'warning'
                  }
                  showIcon
                />
              </>
            )}

            <Divider orientation="left">处理进度</Divider>
            <Timeline
              items={[
                {
                  color: 'blue',
                  children: (
                    <div>
                      <Text strong>申诉已提交</Text>
                      <Text type="secondary" className="block text-sm">
                        {dayjs(currentDispute.createdAt).format('YYYY-MM-DD HH:mm')}
                      </Text>
                      <Text type="secondary">等待平台专员介入处理</Text>
                    </div>
                  ),
                },
                currentDispute.status !== 'pending'
                  ? {
                      color: 'blue',
                      children: (
                        <div>
                          <Text strong>仲裁员已介入</Text>
                          <Text type="secondary" className="block text-sm">
                            {dayjs(currentDispute.createdAt)
                              .add(1, 'day')
                              .format('YYYY-MM-DD HH:mm')}
                          </Text>
                          <Text type="secondary">仲裁员正在调查收集证据</Text>
                        </div>
                      ),
                    }
                  : undefined,
                currentDispute.status === 'resolved' || currentDispute.status === 'rejected'
                  ? {
                      color:
                        currentDispute.status === 'resolved' ? 'green' : 'red',
                      children: (
                        <div>
                          <Text strong>
                            {currentDispute.status === 'resolved' ? '已完成裁决' : '申诉已驳回'}
                          </Text>
                          <Text type="secondary" className="block text-sm">
                            {dayjs(currentDispute.resolvedAt || currentDispute.updatedAt).format(
                              'YYYY-MM-DD HH:mm'
                            )}
                          </Text>
                          <Text type="secondary">
                            {currentDispute.arbitrationReason || '处理完成'}
                          </Text>
                        </div>
                      ),
                    }
                  : undefined,
              ].filter(Boolean)}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProviderDisputes;
