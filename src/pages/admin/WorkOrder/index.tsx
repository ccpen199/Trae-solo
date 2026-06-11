import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Form,
  Input,
  Select,
  Modal,
  message,
  Tag,
  Timeline,
  Row,
  Col,
  Descriptions,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { workOrderApi } from '@/services/workOrder';
import { adminApi } from '@/services/admin';
import { formatDateTime } from '@/utils/format';
import StatusTag from '@/components/StatusTag';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;
const { Option } = Select;

const priorityMap: Record<number, { text: string; color: string }> = {
  0: { text: '低', color: '#86909C' },
  1: { text: '中', color: '#FF7D00' },
  2: { text: '高', color: '#F53F3F' },
};

const WorkOrder: React.FC = () => {
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [processForm] = Form.useForm();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [detailVisible, setDetailVisible] = useState(false);
  const [assignVisible, setAssignVisible] = useState(false);
  const [processVisible, setProcessVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [orderLogs, setOrderLogs] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const res: any = await workOrderApi.getAdminWorkOrders({
        ...values,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      if (res.code === 0) {
        setData(res.data.list);
        setTotal(res.data.total);
      }
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminUsers = async () => {
    try {
      const res: any = await adminApi.getAdminUserList({ page: 1, pageSize: 100 });
      if (res.code === 0) {
        setAdminUsers(res.data.list);
      }
    } catch (error) {
      console.error('加载用户失败');
    }
  };

  useEffect(() => {
    loadData();
    loadAdminUsers();
  }, [pagination]);

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
    loadData();
  };

  const handleReset = () => {
    form.resetFields();
    setPagination({ ...pagination, current: 1 });
    loadData();
  };

  const handleDetail = async (record: any) => {
    setCurrentOrder(record);
    try {
      const res: any = await workOrderApi.getWorkOrderLogs(record.id);
      if (res.code === 0) {
        setOrderLogs(res.data);
      }
    } catch (error) {
      console.error('加载日志失败');
    }
    setDetailVisible(true);
  };

  const handleAssign = (record: any) => {
    setCurrentOrder(record);
    assignForm.resetFields();
    setAssignVisible(true);
  };

  const handleAssignSubmit = async () => {
    try {
      const values = await assignForm.validateFields();
      const res: any = await workOrderApi.assignWorkOrder(currentOrder.id, values);
      if (res.code === 0) {
        message.success('分派成功');
        setAssignVisible(false);
        loadData();
      }
    } catch (error) {
      console.error('分派失败');
    }
  };

  const handleProcess = (record: any) => {
    setCurrentOrder(record);
    processForm.resetFields();
    processForm.setFieldsValue({ status: 2 });
    setProcessVisible(true);
  };

  const handleProcessSubmit = async () => {
    try {
      const values = await processForm.validateFields();
      const res: any = await workOrderApi.processWorkOrder(currentOrder.id, values);
      if (res.code === 0) {
        message.success('处理成功');
        setProcessVisible(false);
        loadData();
      }
    } catch (error) {
      console.error('处理失败');
    }
  };

  const columns: ColumnsType<any> = [
    { title: '工单编号', dataIndex: 'orderNo', width: 160 },
    { title: '用户', dataIndex: 'userName', width: 100 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (t) => <StatusTag type="workOrderType" status={t} />,
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
      render: (t) => <span className="text-gray-700">{t}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s) => <StatusTag type="workOrderStatus" status={s} />,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 80,
      render: (p) => <Tag color={priorityMap[p]?.color}>{priorityMap[p]?.text}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 160,
      render: (t) => formatDateTime(t),
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(record)}>
            详情
          </Button>
          {record.status === 0 && (
            <Button type="link" size="small" icon={<UserOutlined />} onClick={() => handleAssign(record)}>
              分派
            </Button>
          )}
          {(record.status === 0 || record.status === 1) && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleProcess(record)}>
              处理
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" allowClear style={{ width: 120 }}>
              <Option value={0}>待受理</Option>
              <Option value={1}>处理中</Option>
              <Option value={2}>待确认</Option>
              <Option value={3}>已完成</Option>
              <Option value={4}>已关闭</Option>
            </Select>
          </Form.Item>
          <Form.Item name="type" label="类型">
            <Select placeholder="请选择类型" allowClear style={{ width: 120 }}>
              <Option value="consultation">咨询</Option>
              <Option value="complaint">投诉</Option>
              <Option value="suggestion">建议</Option>
              <Option value="repair">报修</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="keyword">
            <Input placeholder="搜索关键词" prefix={<SearchOutlined />} allowClear style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">查询</Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card className="shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">工单列表</h3>
          <span className="text-gray-500 text-sm">共 {total} 条记录</span>
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (current, pageSize) => setPagination({ current, pageSize }),
          }}
        />
      </Card>

      <Modal
        title="工单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentOrder && (
          <div className="space-y-6">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="工单编号">{currentOrder.orderNo}</Descriptions.Item>
              <Descriptions.Item label="用户">{currentOrder.userName}</Descriptions.Item>
              <Descriptions.Item label="类型">
                <StatusTag type="workOrderType" status={currentOrder.type} />
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <StatusTag type="workOrderStatus" status={currentOrder.status} />
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag color={priorityMap[currentOrder.priority]?.color}>
                  {priorityMap[currentOrder.priority]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="处理人">{currentOrder.assigneeName || '-'}</Descriptions.Item>
              <Descriptions.Item label="标题" span={2}>{currentOrder.title}</Descriptions.Item>
              <Descriptions.Item label="内容" span={2}>{currentOrder.content}</Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {formatDateTime(currentOrder.createTime)}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <h4 className="text-gray-800 font-medium mb-3">处理记录</h4>
              <Timeline
                items={orderLogs.map((log) => ({
                  color: log.action === 'create' ? 'blue' : log.action === 'process' ? 'green' : 'gray',
                  children: (
                    <div>
                      <p className="text-gray-800 font-medium">{log.content}</p>
                      <p className="text-gray-500 text-sm">
                        {log.operatorName} · {formatDateTime(log.createTime)}
                      </p>
                    </div>
                  ),
                }))}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="分派工单"
        open={assignVisible}
        onOk={handleAssignSubmit}
        onCancel={() => setAssignVisible(false)}
        okText="确认分派"
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item
            name="assigneeId"
            label="选择处理人员"
            rules={[{ required: true, message: '请选择处理人员' }]}
          >
            <Select placeholder="请选择处理人员">
              {adminUsers.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.realName} ({user.roleName})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="请输入分派备注" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="处理工单"
        open={processVisible}
        onOk={handleProcessSubmit}
        onCancel={() => setProcessVisible(false)}
        okText="确认处理"
      >
        <Form form={processForm} layout="vertical">
          <Form.Item
            name="content"
            label="处理内容"
            rules={[{ required: true, message: '请输入处理内容' }]}
          >
            <TextArea rows={4} placeholder="请输入处理内容" />
          </Form.Item>
          <Form.Item name="status" label="处理状态">
            <Select>
              <Option value={1}>处理中</Option>
              <Option value={2}>待确认</Option>
              <Option value={3}>已完成</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkOrder;
