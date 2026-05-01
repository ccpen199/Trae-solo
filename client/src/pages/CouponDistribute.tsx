import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Select,
  Input,
  InputNumber,
  Tag,
  Space,
  message,
  Progress,
  Statistic,
  Row,
  Col
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { couponApi } from '@/services/api';
import { getStatusBadgeProps } from '@/stores/store';
import { DistributionChannel } from '@/types';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface DistributionJob {
  id: string;
  templateId: string;
  templateName: string;
  targetUsers: string[];
  distributionChannel: DistributionChannel;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalCount: number;
  successCount: number;
  failCount: number;
  errors?: string[];
  createdBy: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

const mockJobs: DistributionJob[] = [
  {
    id: 'job_001',
    templateId: 'tpl_001',
    templateName: '新用户首单立减券',
    targetUsers: ['user_001', 'user_002', 'user_003'],
    distributionChannel: DistributionChannel.TARGETED,
    status: 'completed',
    totalCount: 1000,
    successCount: 985,
    failCount: 15,
    createdBy: 'operator',
    createdAt: '2024-01-15T10:00:00Z',
    startedAt: '2024-01-15T10:05:00Z',
    completedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'job_002',
    templateId: 'tpl_002',
    templateName: '春节特惠折扣券',
    targetUsers: [],
    distributionChannel: DistributionChannel.PROMOTION,
    status: 'processing',
    totalCount: 5000,
    successCount: 2340,
    failCount: 12,
    createdBy: 'operator',
    createdAt: '2024-01-20T09:00:00Z',
    startedAt: '2024-01-20T09:10:00Z'
  },
  {
    id: 'job_003',
    templateId: 'tpl_003',
    templateName: '会员专享满减券',
    targetUsers: [],
    distributionChannel: DistributionChannel.DIRECT,
    status: 'pending',
    totalCount: 2000,
    successCount: 0,
    failCount: 0,
    createdBy: 'operator',
    createdAt: '2024-01-25T14:00:00Z'
  }
];

const CouponDistributePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<DistributionJob | null>(null);
  const [jobs, setJobs] = useState<DistributionJob[]>(mockJobs);

  const { data: templates } = useQuery(
    ['coupon-templates'],
    () => couponApi.listTemplates({ limit: 100 }),
    { enabled: isModalVisible }
  );

  const startJobMutation = useMutation(
    async (jobId: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: 'processing' as const, startedAt: new Date().toISOString() } : job
      ));
    },
    {
      onSuccess: () => {
        message.success('发放任务已启动');
        queryClient.invalidateQueries(['distribution-jobs']);
      }
    }
  );

  const pauseJobMutation = useMutation(
    async (jobId: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: 'pending' as const } : job
      ));
    },
    {
      onSuccess: () => {
        message.success('发放任务已暂停');
        queryClient.invalidateQueries(['distribution-jobs']);
      }
    }
  );

  const cancelJobMutation = useMutation(
    async (jobId: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: 'failed' as const } : job
      ));
    },
    {
      onSuccess: () => {
        message.success('发放任务已取消');
        queryClient.invalidateQueries(['distribution-jobs']);
      }
    }
  );

  const createJobMutation = useMutation(
    async (values: any) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const newJob: DistributionJob = {
        id: `job_${Date.now()}`,
        templateId: values.templateId,
        templateName: values.templateName || '新发放任务',
        targetUsers: values.targetUsers?.split(',').map((u: string) => u.trim()) || [],
        distributionChannel: values.distributionChannel,
        status: 'pending',
        totalCount: values.totalCount,
        successCount: 0,
        failCount: 0,
        createdBy: 'operator',
        createdAt: new Date().toISOString()
      };
      setJobs(prev => [newJob, ...prev]);
    },
    {
      onSuccess: () => {
        message.success('发放任务创建成功');
        setIsModalVisible(false);
        form.resetFields();
      },
      onError: () => {
        message.error('创建失败，请重试');
      }
    }
  );

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'default', text: '待执行' },
      processing: { color: 'processing', text: '执行中' },
      completed: { color: 'success', text: '已完成' },
      failed: { color: 'error', text: '失败' }
    };
    const badge = statusMap[status] || { color: 'default', text: status };
    return <Tag color={badge.color}>{badge.text}</Tag>;
  };

  const getProgressPercent = (job: DistributionJob) => {
    if (job.totalCount === 0) return 0;
    return Math.round(((job.successCount + job.failCount) / job.totalCount) * 100);
  };

  const columns = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{text}</span>
    },
    {
      title: '券模板',
      dataIndex: 'templateName',
      key: 'templateName'
    },
    {
      title: '发放渠道',
      dataIndex: 'distributionChannel',
      key: 'distributionChannel',
      render: (channel: string) => {
        const channelMap: Record<string, string> = {
          [DistributionChannel.DIRECT]: '直接发放',
          [DistributionChannel.TARGETED]: '定向投放',
          [DistributionChannel.PROMOTION]: '活动推广',
          [DistributionChannel.REFERRAL]: '邀请奖励'
        };
        return <Tag>{channelMap[channel] || channel}</Tag>;
      }
    },
    {
      title: '发放进度',
      key: 'progress',
      render: (_: any, record: DistributionJob) => (
        <div style={{ width: 200 }}>
          <Progress
            percent={getProgressPercent(record)}
            status={record.status === 'processing' ? 'active' : record.status === 'failed' ? 'exception' : 'normal'}
            size="small"
          />
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            成功: {record.successCount} / 失败: {record.failCount} / 总计: {record.totalCount}
          </div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: DistributionJob) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedJob(record);
            }}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => startJobMutation.mutate(record.id)}
            >
              启动
            </Button>
          )}
          {record.status === 'processing' && (
            <Button
              type="link"
              size="small"
              icon={<PauseCircleOutlined />}
              onClick={() => pauseJobMutation.mutate(record.id)}
            >
              暂停
            </Button>
          )}
          {(record.status === 'pending' || record.status === 'processing') && (
            <Button
              type="link"
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => cancelJobMutation.mutate(record.id)}
            >
              取消
            </Button>
          )}
        </Space>
      )
    }
  ];

  const handleCreate = () => {
    form.resetFields();
    form.setFieldsValue({
      distributionChannel: DistributionChannel.TARGETED,
      totalCount: 100
    });
    setIsModalVisible(true);
  };

  const onFinish = (values: any) => {
    createJobMutation.mutate(values);
  };

  const totalPending = jobs.filter(j => j.status === 'pending').length;
  const totalProcessing = jobs.filter(j => j.status === 'processing').length;
  const totalCompleted = jobs.filter(j => j.status === 'completed').length;

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="待执行任务"
              value={totalPending}
              prefix={<PlayCircleOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="执行中"
              value={totalProcessing}
              prefix={<PauseCircleOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="已完成"
              value={totalCompleted}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总任务数"
              value={jobs.length}
              prefix={<PlayCircleOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="发放队列管理"
        extra={
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleCreate}>
            新建发放任务
          </Button>
        }
      >
        <Form
          form={searchForm}
          layout="inline"
          style={{ marginBottom: 16 }}
          onFinish={(values) => console.log('Search:', values)}
        >
          <Form.Item name="keyword">
            <Input
              placeholder="搜索任务ID/模板名称"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态筛选" style={{ width: 150 }} allowClear>
              <Select.Option value="pending">待执行</Select.Option>
              <Select.Option value="processing">执行中</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="failed">失败</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={() => searchForm.resetFields()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          columns={columns}
          dataSource={jobs}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            defaultPageSize: 10
          }}
        />
      </Card>

      <Modal
        title="新建发放任务"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={createJobMutation.isLoading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            distributionChannel: DistributionChannel.TARGETED,
            totalCount: 100
          }}
        >
          <Form.Item
            name="templateId"
            label="选择券模板"
            rules={[{ required: true, message: '请选择券模板' }]}
          >
            <Select placeholder="请选择要发放的券模板">
              {templates?.data?.map((template: any) => (
                <Select.Option key={template.id} value={template.id}>
                  {template.name} (剩余: {template.remainingQuantity})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="distributionChannel"
            label="发放渠道"
            rules={[{ required: true, message: '请选择发放渠道' }]}
          >
            <Select>
              <Select.Option value={DistributionChannel.DIRECT}>直接发放</Select.Option>
              <Select.Option value={DistributionChannel.TARGETED}>定向投放</Select.Option>
              <Select.Option value={DistributionChannel.PROMOTION}>活动推广</Select.Option>
              <Select.Option value={DistributionChannel.REFERRAL}>邀请奖励</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="targetUsers" label="目标用户">
            <TextArea
              rows={3}
              placeholder="请输入用户ID，多个用户用逗号分隔"
              disabled={form.getFieldValue('distributionChannel') !== DistributionChannel.TARGETED}
            />
          </Form.Item>

          <Form.Item
            name="totalCount"
            label="发放数量"
            rules={[{ required: true, message: '请输入发放数量' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} addonAfter="张" />
          </Form.Item>

          <Form.Item name="storeId" label="指定门店">
            <Input placeholder="留空表示所有门店" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="发放任务详情"
        open={!!selectedJob}
        onCancel={() => setSelectedJob(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedJob(null)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {selectedJob && (
          <div>
            <Card size="small" title="基本信息" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <p><strong>任务ID:</strong> {selectedJob.id}</p>
                  <p><strong>券模板:</strong> {selectedJob.templateName}</p>
                  <p><strong>发放渠道:</strong> {selectedJob.distributionChannel}</p>
                </Col>
                <Col span={12}>
                  <p><strong>状态:</strong> {getStatusTag(selectedJob.status)}</p>
                  <p><strong>创建人:</strong> {selectedJob.createdBy}</p>
                  <p><strong>创建时间:</strong> {dayjs(selectedJob.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
                </Col>
              </Row>
            </Card>

            <Card size="small" title="发放进度" style={{ marginBottom: 16 }}>
              <Progress
                percent={getProgressPercent(selectedJob)}
                status={selectedJob.status === 'processing' ? 'active' : selectedJob.status === 'failed' ? 'exception' : 'normal'}
              />
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={8}>
                  <Statistic title="总数量" value={selectedJob.totalCount} />
                </Col>
                <Col span={8}>
                  <Statistic title="成功" value={selectedJob.successCount} valueStyle={{ color: '#52c41a' }} />
                </Col>
                <Col span={8}>
                  <Statistic title="失败" value={selectedJob.failCount} valueStyle={{ color: '#ff4d4f' }} />
                </Col>
              </Row>
            </Card>

            {selectedJob.errors && selectedJob.errors.length > 0 && (
              <Card size="small" title="错误日志">
                <div
                  style={{
                    maxHeight: 200,
                    overflow: 'auto',
                    background: '#f5f5f5',
                    padding: 12,
                    borderRadius: 4
                  }}
                >
                  {selectedJob.errors.map((error, index) => (
                    <div key={index} style={{ color: '#ff4d4f', fontSize: 12, marginBottom: 4 }}>
                      {error}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CouponDistributePage;
