import React, { useState } from 'react';
import { Table, Card, Tag, Button, Space, Select, Modal, Form, Input, message, Descriptions, Divider, Timeline } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons';
import { exceptionApi } from '../services/api';
import { Exception, ExceptionStatus, ExceptionPriority } from '../types';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const ExceptionList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: undefined as string | undefined,
    type: undefined as string | undefined,
    priority: undefined as string | undefined,
    page: 1,
    pageSize: 10,
  });
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedException, setSelectedException] = useState<Exception | null>(null);
  const [actionModal, setActionModal] = useState<{ visible: boolean; type: string; exception: Exception | null }>({
    visible: false,
    type: '',
    exception: null,
  });
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['exceptions', filters],
    queryFn: async () => {
      const params: any = {
        page: filters.page,
        pageSize: filters.pageSize,
      };
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.priority) params.priority = filters.priority;
      const response = await exceptionApi.getList(params);
      return response.data;
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['exceptionStats'],
    queryFn: async () => {
      const response = await exceptionApi.getStats();
      return response.data.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, action, data }: { id: string; action: string; data?: any }) => {
      let response;
      switch (action) {
        case 'assign':
          response = await exceptionApi.assign(id, data.handlerId);
          break;
        case 'updateStatus':
          response = await exceptionApi.updateStatus(id, data);
          break;
        case 'addLog':
          response = await exceptionApi.addLog(id, data);
          break;
        default:
          throw new Error('未知操作');
      }
      return response.data;
    },
    onSuccess: () => {
      message.success('操作成功');
      setActionModal({ visible: false, type: '', exception: null });
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['exceptions'] });
      queryClient.invalidateQueries({ queryKey: ['exception', selectedException?.id] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '操作失败');
    },
  });

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: Exception) => (
        <a onClick={() => navigate(`/exceptions/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeText: Record<string, string> = {
          PAYMENT_ISSUE: '支付问题',
          DELIVERY_ISSUE: '发货问题',
          ACCOUNT_ISSUE: '账号问题',
          COMPLAINT: '投诉',
          REFUND_REQUEST: '退款申请',
          OTHER: '其他',
        };
        return typeText[type] || type;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: ExceptionPriority) => {
        const colorMap: Record<ExceptionPriority, string> = {
          LOW: 'default',
          MEDIUM: 'orange',
          HIGH: 'red',
          URGENT: 'magenta',
        };
        const priorityText: Record<ExceptionPriority, string> = {
          LOW: '低',
          MEDIUM: '中',
          HIGH: '高',
          URGENT: '紧急',
        };
        return <Tag color={colorMap[priority]}>{priorityText[priority]}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ExceptionStatus) => {
        const colorMap: Record<ExceptionStatus, string> = {
          PENDING: 'orange',
          PROCESSING: 'processing',
          RESOLVED: 'success',
          CLOSED: 'default',
        };
        const statusText: Record<ExceptionStatus, string> = {
          PENDING: '待处理',
          PROCESSING: '处理中',
          RESOLVED: '已解决',
          CLOSED: '已关闭',
        };
        return <Tag color={colorMap[status]}>{statusText[status]}</Tag>;
      },
    },
    {
      title: '处理人',
      dataIndex: ['handler', 'username'],
      key: 'handler',
      width: 100,
      render: (username: string) => username || '未分配',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: any, record: Exception) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/exceptions/${record.id}`)}
          >
            详情
          </Button>
          {record.status === 'PENDING' && (
            <Button
              type="primary"
              size="small"
              onClick={() => {
                setSelectedException(record);
                setActionModal({ visible: true, type: 'assign', exception: record });
              }}
            >
              处理
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, color: '#999' }}>总数</div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{statsData?.total || 0}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#999' }}>待处理</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
              {(statsData?.byStatus?.PENDING || 0) + (statsData?.byStatus?.PROCESSING || 0)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#999' }}>已解决</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
              {statsData?.byStatus?.RESOLVED || 0}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#999' }}>紧急/高</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
              {(statsData?.byPriority?.URGENT || 0) + (statsData?.byPriority?.HIGH || 0)}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space size="large">
            <Select
              placeholder="选择状态"
              allowClear
              style={{ width: 150 }}
              onChange={(val) => setFilters((prev) => ({ ...prev, status: val, page: 1 }))}
            >
              <Option value="PENDING">待处理</Option>
              <Option value="PROCESSING">处理中</Option>
              <Option value="RESOLVED">已解决</Option>
              <Option value="CLOSED">已关闭</Option>
            </Select>
            <Select
              placeholder="选择类型"
              allowClear
              style={{ width: 150 }}
              onChange={(val) => setFilters((prev) => ({ ...prev, type: val, page: 1 }))}
            >
              <Option value="PAYMENT_ISSUE">支付问题</Option>
              <Option value="DELIVERY_ISSUE">发货问题</Option>
              <Option value="ACCOUNT_ISSUE">账号问题</Option>
              <Option value="COMPLAINT">投诉</Option>
              <Option value="REFUND_REQUEST">退款申请</Option>
              <Option value="OTHER">其他</Option>
            </Select>
            <Select
              placeholder="选择优先级"
              allowClear
              style={{ width: 150 }}
              onChange={(val) => setFilters((prev) => ({ ...prev, priority: val, page: 1 }))}
            >
              <Option value="LOW">低</Option>
              <Option value="MEDIUM">中</Option>
              <Option value="HIGH">高</Option>
              <Option value="URGENT">紧急</Option>
            </Select>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data?.data || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: filters.page,
            pageSize: filters.pageSize,
            total: data?.pagination?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={(pagination) => setFilters((prev) => ({ ...prev, page: pagination.current, pageSize: pagination.pageSize }))}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="处理异常"
        open={actionModal.visible}
        onOk={() => {
          form.validateFields().then((values) => {
            if (actionModal.exception) {
              updateMutation.mutate({
                id: actionModal.exception.id,
                action: actionModal.type === 'assign' ? 'updateStatus' : actionModal.type,
                data: {
                  ...values,
                  status: 'PROCESSING',
                },
              });
            }
          });
        }}
        onCancel={() => setActionModal({ visible: false, type: '', exception: null })}
        confirmLoading={updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="status"
            label="更新状态"
            initialValue="PROCESSING"
          >
            <Select>
              <Select.Option value="PROCESSING">处理中</Select.Option>
              <Select.Option value="RESOLVED">已解决</Select.Option>
              <Select.Option value="CLOSED">已关闭</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="resolution"
            label="处理结果"
          >
            <TextArea rows={4} placeholder="请输入处理结果" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const ExceptionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['exception', id],
    queryFn: async () => {
      const response = await exceptionApi.getById(id!);
      return response.data.data as Exception;
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await exceptionApi.updateStatus(id!, values);
      return response.data;
    },
    onSuccess: () => {
      message.success('操作成功');
      setActionModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['exception', id] });
      queryClient.invalidateQueries({ queryKey: ['exceptions'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '操作失败');
    },
  });

  const getStatusInfo = (status: ExceptionStatus) => {
    const map: Record<ExceptionStatus, { color: string; text: string }> = {
      PENDING: { color: 'orange', text: '待处理' },
      PROCESSING: { color: 'processing', text: '处理中' },
      RESOLVED: { color: 'success', text: '已解决' },
      CLOSED: { color: 'default', text: '已关闭' },
    };
    return map[status];
  };

  const getPriorityInfo = (priority: ExceptionPriority) => {
    const map: Record<ExceptionPriority, { color: string; text: string }> = {
      LOW: { color: 'default', text: '低' },
      MEDIUM: { color: 'orange', text: '中' },
      HIGH: { color: 'red', text: '高' },
      URGENT: { color: 'magenta', text: '紧急' },
    };
    return map[priority];
  };

  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 50 }}>加载中...</div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 50 }}>记录不存在</div>
      </Card>
    );
  }

  const statusInfo = getStatusInfo(data.status);
  const priorityInfo = getPriorityInfo(data.priority);

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/exceptions')}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h3 style={{ margin: '0 0 12px 0' }}>{data.title}</h3>
            <Space>
              <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
              <Tag color={priorityInfo.color}>优先级: {priorityInfo.text}</Tag>
            </Space>
          </div>
          <Space>
            {['PENDING', 'PROCESSING'].includes(data.status) && (
              <Button type="primary" onClick={() => setActionModalVisible(true)}>
                处理
              </Button>
            )}
          </Space>
        </div>

        <Descriptions bordered column={2}>
          <Descriptions.Item label="类型">
            {(() => {
              const typeText: Record<string, string> = {
                PAYMENT_ISSUE: '支付问题',
                DELIVERY_ISSUE: '发货问题',
                ACCOUNT_ISSUE: '账号问题',
                COMPLAINT: '投诉',
                REFUND_REQUEST: '退款申请',
                OTHER: '其他',
              };
              return typeText[data.type] || data.type;
            })()}
          </Descriptions.Item>
          <Descriptions.Item label="处理人">
            {data.handler?.username || '未分配'}
          </Descriptions.Item>
          <Descriptions.Item label="关联订单">
            {data.order?.orderNo || '无'}
          </Descriptions.Item>
          <Descriptions.Item label="账号">
            {data.order?.account?.title || '无'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(data.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="解决时间">
            {data.resolvedAt ? dayjs(data.resolvedAt).format('YYYY-MM-DD HH:mm') : '未解决'}
          </Descriptions.Item>
        </Descriptions>

        {data.description && (
          <>
            <Divider />
            <div>
              <h4 style={{ marginBottom: 12 }}>问题描述</h4>
              <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, whiteSpace: 'pre-wrap' }}>
                {data.description}
              </div>
            </div>
          </>
        )}

        {data.resolution && (
          <>
            <Divider />
            <div>
              <h4 style={{ marginBottom: 12 }}>处理结果</h4>
              <div style={{ background: '#f6ffed', padding: 16, borderRadius: 4, whiteSpace: 'pre-wrap' }}>
                {data.resolution}
              </div>
            </div>
          </>
        )}

        {data.logs && data.logs.length > 0 && (
          <>
            <Divider />
            <div>
              <h4 style={{ marginBottom: 16 }}>处理日志</h4>
              <Timeline>
                {data.logs.map((log) => (
                  <Timeline.Item key={log.id}>
                    <p>
                      <strong>{log.action}</strong>
                      <span style={{ marginLeft: 16, color: '#999' }}>
                        {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm')}
                      </span>
                    </p>
                    {log.description && <p style={{ color: '#666' }}>{log.description}</p>}
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          </>
        )}
      </Card>

      <Modal
        title="处理异常"
        open={actionModalVisible}
        onOk={() => {
          form.validateFields().then((values) => {
            updateMutation.mutate(values);
          });
        }}
        onCancel={() => setActionModalVisible(false)}
        confirmLoading={updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="status"
            label="更新状态"
            initialValue={data.status === 'PENDING' ? 'PROCESSING' : data.status}
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Select.Option value="PROCESSING">处理中</Select.Option>
              <Select.Option value="RESOLVED">已解决</Select.Option>
              <Select.Option value="CLOSED">已关闭</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="resolution"
            label="处理结果"
            rules={[{ required: true, message: '请输入处理结果' }]}
          >
            <TextArea rows={4} placeholder="请输入处理结果" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export { ExceptionList, ExceptionDetail };
