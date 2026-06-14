import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  Space,
  Descriptions,
  List,
  message,
  Spin,
  Empty,
  Timeline
} from 'antd';
import {
  PlusOutlined,
  PaperClipOutlined,
  EyeOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { Dispute, Attachment } from '@/types';
import { disputeApi, taskApi } from '@/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const disputeTypes = [
  '质量问题',
  '交付延迟',
  '需求理解不一致',
  '沟通问题',
  '费用争议',
  '其他'
];

const statusColors: Record<string, string> = {
  pending: 'processing',
  reviewing: 'warning',
  resolved: 'success',
  cancelled: 'default'
};

const statusNames: Record<string, string> = {
  pending: '待处理',
  reviewing: '审核中',
  resolved: '已解决',
  cancelled: '已取消'
};

const Disputes: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentDispute, setCurrentDispute] = useState<Dispute | null>(null);
  const [createForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [tasks, setTasks] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const fetchDisputes = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const result = await disputeApi.getMyDisputes({ page, pageSize });
      setDisputes(result.list || []);
      setPagination({ current: page, pageSize, total: result.total || 0 });
    } catch (error) {
      console.error('Fetch disputes error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const result = await taskApi.getMyTasks({ page: 1, pageSize: 100 });
      setTasks(result.list?.filter((t: any) => t.status !== 'draft' && t.status !== 'cancelled') || []);
    } catch (error) {
      console.error('Fetch tasks error:', error);
    }
  };

  useEffect(() => {
    fetchDisputes();
    fetchTasks();
  }, []);

  const handleCreateDispute = async (values: any) => {
    try {
      setSubmitting(true);
      await disputeApi.create(values.taskId, {
        ...values,
        evidence: attachments.map(a => a.id)
      });
      message.success('申诉已提交');
      setCreateModalVisible(false);
      createForm.resetFields();
      setAttachments([]);
      fetchDisputes();
    } catch (error) {
      console.error('Create dispute error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = (dispute: Dispute) => {
    setCurrentDispute(dispute);
    setDetailModalVisible(true);
  };

  const handleCancelDispute = (dispute: Dispute) => {
    Modal.confirm({
      title: '撤销申诉',
      content: '确定要撤销该申诉吗？',
      onOk: async () => {
        message.success('申诉已撤销');
        fetchDisputes();
      }
    });
  };

  const handleUploadChange = (info: any) => {
    if (info.fileList) {
      const newAttachments: Attachment[] = info.fileList.map((file: any) => ({
        id: file.uid,
        fileName: file.name,
        fileUrl: file.url || '#',
        fileSize: file.size || 0,
        fileType: file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
        uploadedBy: ''
      }));
      setAttachments(newAttachments);
    }
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const columns = [
    {
      title: '争议编号',
      dataIndex: 'disputeNo',
      key: 'disputeNo',
      width: 140
    },
    {
      title: '任务',
      dataIndex: 'taskTitle',
      key: 'taskTitle',
      ellipsis: true
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => <Tag color="blue">{type}</Tag>
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '争议金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => amount ? formatCurrency(amount) : '-',
      sorter: (a: Dispute, b: Dispute) => (a.amount || 0) - (b.amount || 0)
    },
    {
      title: '对方',
      dataIndex: 'defendantName',
      key: 'defendantName',
      width: 120
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={statusColors[status]}>{statusNames[status]}</Tag>
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
      sorter: (a: Dispute, b: Dispute) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf()
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_: any, record: Dispute) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            查看
          </Button>
          {record.status === 'pending' && (
            <Button type="link" danger onClick={() => handleCancelDispute(record)}>
              撤销
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">争议中心</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            发起申诉
          </Button>
        </div>
      </Card>

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
            onChange: (page, pageSize) => fetchDisputes(page, pageSize)
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="发起申诉"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
          setAttachments([]);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateDispute}
        >
          <Form.Item
            name="taskId"
            label="选择任务"
            rules={[{ required: true, message: '请选择任务' }]}
          >
            <Select placeholder="请选择需要申诉的任务" showSearch optionFilterProp="children">
              {tasks.map(task => (
                <Option key={task.id} value={task.id}>{task.title}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="type"
            label="争议类型"
            rules={[{ required: true, message: '请选择争议类型' }]}
          >
            <Select placeholder="请选择争议类型">
              {disputeTypes.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label="争议标题"
            rules={[{ required: true, message: '请输入争议标题' }]}
          >
            <Input placeholder="请简要描述争议问题" />
          </Form.Item>
          <Form.Item
            name="description"
            label="详细描述"
            rules={[{ required: true, message: '请输入详细描述' }]}
          >
            <TextArea rows={4} placeholder="请详细描述争议情况、您的诉求和相关证据..." />
          </Form.Item>
          <Form.Item
            name="amount"
            label="争议金额（元）"
          >
            <Input type="number" placeholder="请输入争议金额" />
          </Form.Item>
          <Form.Item label="上传证据">
            <Upload
              multiple
              beforeUpload={() => false}
              onChange={handleUploadChange}
              fileList={attachments.map((a, i) => ({
                uid: a.id,
                name: a.fileName,
                status: 'done' as const,
                url: a.fileUrl
              }))}
            >
              <Button icon={<PaperClipOutlined />}>上传证据文件</Button>
            </Upload>
          </Form.Item>
          <Form.Item className="mb-0 flex justify-end gap-2">
            <Button onClick={() => {
              setCreateModalVisible(false);
              createForm.resetFields();
              setAttachments([]);
            }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              提交申诉
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="争议详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>
        ]}
        width={800}
      >
        {currentDispute && (
          <div>
            <Descriptions bordered column={2} className="mb-6">
              <Descriptions.Item label="争议编号">{currentDispute.disputeNo}</Descriptions.Item>
              <Descriptions.Item label="任务">{currentDispute.taskTitle}</Descriptions.Item>
              <Descriptions.Item label="类型"><Tag color="blue">{currentDispute.type}</Tag></Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColors[currentDispute.status]}>{statusNames[currentDispute.status]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="申诉方">{currentDispute.plaintiffName}</Descriptions.Item>
              <Descriptions.Item label="被申诉方">{currentDispute.defendantName}</Descriptions.Item>
              <Descriptions.Item label="争议金额">{currentDispute.amount ? formatCurrency(currentDispute.amount) : '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(currentDispute.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            </Descriptions>

            <Card title="争议描述" className="mb-4">
              <h4 className="font-medium mb-2">{currentDispute.title}</h4>
              <p className="text-gray-600 whitespace-pre-wrap">{currentDispute.description}</p>
            </Card>

            {currentDispute.evidence?.length > 0 && (
              <Card title="证据材料" className="mb-4">
                <List
                  dataSource={currentDispute.evidence}
                  renderItem={(file) => (
                    <List.Item className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                      <div className="flex items-center gap-2">
                        <FileTextOutlined className="text-primary-600" />
                        <span>{file.fileName}</span>
                        <span className="text-xs text-gray-400">({(file.fileSize / 1024).toFixed(2)} KB)</span>
                      </div>
                      <Button type="link" onClick={() => window.open(file.fileUrl, '_blank')}>
                        查看
                      </Button>
                    </List.Item>
                  )}
                />
              </Card>
            )}

            <Card title="处理进度">
              <Timeline
                items={[
                  {
                    color: 'green',
                    dot: <CheckCircleOutlined />,
                    children: (
                      <div>
                        <div className="font-medium">申诉提交</div>
                        <div className="text-sm text-gray-500">您已成功提交申诉</div>
                        <div className="text-xs text-gray-400">{dayjs(currentDispute.createdAt).format('YYYY-MM-DD HH:mm')}</div>
                      </div>
                    )
                  },
                  {
                    color: currentDispute.status !== 'pending' ? 'blue' : 'gray',
                    dot: currentDispute.status !== 'pending' ? <ClockCircleOutlined /> : <ClockCircleOutlined />,
                    children: (
                      <div>
                        <div className="font-medium">平台受理</div>
                        <div className="text-sm text-gray-500">平台正在审核您的申诉</div>
                      </div>
                    )
                  },
                  {
                    color: currentDispute.status === 'resolved' ? 'green' : currentDispute.status === 'cancelled' ? 'red' : 'gray',
                    dot: currentDispute.status === 'resolved' ? <CheckCircleOutlined /> : currentDispute.status === 'cancelled' ? <CloseCircleOutlined /> : <WarningOutlined />,
                    children: (
                      <div>
                        <div className="font-medium">
                          {currentDispute.status === 'resolved' ? '争议已解决' : 
                           currentDispute.status === 'cancelled' ? '申诉已撤销' : '等待仲裁'}
                        </div>
                        {currentDispute.arbitrationResult && (
                          <div className="text-sm text-gray-600 mt-2 p-3 bg-blue-50 rounded-lg">
                            <div className="font-medium mb-1">仲裁结果：</div>
                            <p>{currentDispute.arbitrationResult}</p>
                            {currentDispute.arbitratorName && (
                              <div className="text-xs text-gray-400 mt-1">
                                仲裁员：{currentDispute.arbitratorName}
                              </div>
                            )}
                          </div>
                        )}
                        {currentDispute.resolvedAt && (
                          <div className="text-xs text-gray-400">{dayjs(currentDispute.resolvedAt).format('YYYY-MM-DD HH:mm')}</div>
                        )}
                      </div>
                    )
                  }
                ]}
              />
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Disputes;
