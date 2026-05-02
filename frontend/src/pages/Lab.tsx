import React, { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Button,
  Input,
  Tag,
  Modal,
  Form,
  Select,
  DatePicker,
  InputNumber,
  Spin,
  message,
  Descriptions,
  Tabs,
  Space,
  Divider,
  Timeline,
  Alert,
  Popconfirm,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  MedicineBoxOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  FileTextOutlined,
  SolutionOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/utils/api';

interface LabOrder {
  id: string;
  orderNumber: string;
  visitId: string;
  patientId: string;
  patientName?: string;
  patientNumber?: string;
  doctorId?: string;
  doctorName?: string;
  examinationId?: string;
  examName: string;
  status: string;
  type: string;
  urgency: string;
  clinicalIndication?: string;
  doctorRemark?: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  operatorId?: string;
  operatorName?: string;
  result?: string;
  resultData?: string;
  conclusion?: string;
  resultDoctorId?: string;
  resultDoctorName?: string;
  reviewedAt?: string;
  items?: LabOrderItem[];
  createdAt: string;
  updatedAt: string;
}

interface LabOrderItem {
  id: string;
  labOrderId: string;
  itemName: string;
  itemCode?: string;
  result?: string;
  unit?: string;
  referenceRange?: string;
  isAbnormal: boolean;
  remark?: string;
  sortOrder: number;
}

const LabPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [searchForm] = Form.useForm();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [form] = Form.useForm();

  const fetchLabOrders = async (searchParams?: any) => {
    setLoading(true);
    try {
      const params: any = {
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
        ...searchParams,
      };

      const queryString = Object.keys(params)
        .filter((k) => params[k] !== undefined && params[k] !== '' && params[k] !== null)
        .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
        .join('&');

      const response = await api.get(`/lab?${queryString}`);
      if (response.success && response.data) {
        setLabOrders(response.data.orders || []);
        setTotal(response.data.total || 0);
      }
    } catch (error: any) {
      message.error('获取检查检验列表失败');
      console.error('Fetch lab orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabOrders();
  }, [pagination]);

  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    setPagination({ ...pagination, current: 1 });
    fetchLabOrders(values);
  };

  const handleReset = () => {
    searchForm.resetFields();
    setPagination({ ...pagination, current: 1 });
    fetchLabOrders();
  };

  const handleDetail = (order: LabOrder) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  const handleStart = async (id: string) => {
    try {
      const response = await api.post(`/lab/${id}/start`, {});
      if (response.success) {
        message.success('检查已开始');
        fetchLabOrders();
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleComplete = (order: LabOrder) => {
    setSelectedOrder(order);
    form.resetFields();
    setResultModalVisible(true);
  };

  const handleCancel = async (id: string) => {
    try {
      const response = await api.post(`/lab/${id}/cancel`, {});
      if (response.success) {
        message.success('检查已取消');
        fetchLabOrders();
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleSubmitResult = async () => {
    if (!selectedOrder) return;
    try {
      const values = await form.validateFields();
      const response = await api.post(`/lab/${selectedOrder.id}/complete`, {
        result: values.result,
        conclusion: values.conclusion,
        items: values.items,
      });
      if (response.success) {
        message.success('检查结果已提交');
        setResultModalVisible(false);
        fetchLabOrders();
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const getStatusTag = (status: string) => {
    const colorMap: Record<string, string> = {
      PENDING: 'orange',
      IN_PROGRESS: 'processing',
      COMPLETED: 'success',
      CANCELLED: 'default',
    };
    const labelMap: Record<string, string> = {
      PENDING: '待执行',
      IN_PROGRESS: '执行中',
      COMPLETED: '已完成',
      CANCELLED: '已取消',
    };
    return <Tag color={colorMap[status] || 'default'}>{labelMap[status] || status}</Tag>;
  };

  const getTypeTag = (type: string) => {
    const colorMap: Record<string, string> = {
      LAB: 'blue',
      IMAGE: 'purple',
      FUNCTION: 'green',
      PATH: 'orange',
    };
    const labelMap: Record<string, string> = {
      LAB: '检验',
      IMAGE: '影像',
      FUNCTION: '功能检查',
      PATH: '病理',
    };
    return <Tag color={colorMap[type] || 'default'}>{labelMap[type] || type}</Tag>;
  };

  const getUrgencyTag = (urgency: string) => {
    const colorMap: Record<string, string> = {
      ROUTINE: 'default',
      URGENT: 'orange',
      STAT: 'red',
    };
    const labelMap: Record<string, string> = {
      ROUTINE: '普通',
      URGENT: '紧急',
      STAT: '急查',
    };
    return <Tag color={colorMap[urgency] || 'default'}>{labelMap[urgency] || urgency}</Tag>;
  };

  const columns = [
    {
      title: '检查单编号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string) => <a onClick={() => handleDetail(labOrders.find((o) => o.orderNumber === text)!)}>{text}</a>,
    },
    {
      title: '患者信息',
      key: 'patient',
      render: (_: any, record: LabOrder) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.patientName || '-'}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{record.patientNumber || '-'}</div>
        </div>
      ),
    },
    {
      title: '检查项目',
      dataIndex: 'examName',
      key: 'examName',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: getTypeTag,
    },
    {
      title: '紧急程度',
      dataIndex: 'urgency',
      key: 'urgency',
      render: getUrgencyTag,
    },
    {
      title: '开单医生',
      dataIndex: 'doctorName',
      key: 'doctorName',
      render: (name: string) => name || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
    },
    {
      title: '临床指征',
      dataIndex: 'clinicalIndication',
      key: 'clinicalIndication',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '开单时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: LabOrder) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(record)}>
            详情
          </Button>
          {record.status === 'PENDING' && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleStart(record.id)}>
              开始
            </Button>
          )}
          {record.status === 'IN_PROGRESS' && (
            <Button type="link" size="small" onClick={() => handleComplete(record)}>
              录入结果
            </Button>
          )}
          {['PENDING', 'IN_PROGRESS'].includes(record.status) && (
            <Popconfirm title="确定要取消该检查吗？" onConfirm={() => handleCancel(record.id)}>
              <Button type="link" size="small" danger icon={<StopOutlined />}>
                取消
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const itemColumns = [
    {
      title: '项目名称',
      dataIndex: 'itemName',
      key: 'itemName',
    },
    {
      title: '项目编码',
      dataIndex: 'itemCode',
      key: 'itemCode',
      render: (code: string) => code || '-',
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      render: (result: string, record: LabOrderItem) => (
        <span style={{ color: record.isAbnormal ? '#ff4d4f' : 'inherit', fontWeight: record.isAbnormal ? 600 : 400 }}>
          {result || '-'}
          {record.isAbnormal && <Tag color="red" style={{ marginLeft: 4 }}>异常</Tag>}
        </span>
      ),
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      render: (unit: string) => unit || '-',
    },
    {
      title: '参考范围',
      dataIndex: 'referenceRange',
      key: 'referenceRange',
      render: (range: string) => range || '-',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (remark: string) => remark || '-',
    },
  ];

  const statusTimeline = selectedOrder
    ? [
        {
          color: 'blue',
          children: `检查单创建：${dayjs(selectedOrder.createdAt).format('YYYY-MM-DD HH:mm')}`,
        },
        ...(selectedOrder.scheduledAt
          ? [
              {
                color: 'orange',
                children: `计划时间：${dayjs(selectedOrder.scheduledAt).format('YYYY-MM-DD HH:mm')}`,
              },
            ]
          : []),
        ...(selectedOrder.startedAt
          ? [
              {
                color: 'green',
                children: `开始检查：${dayjs(selectedOrder.startedAt).format('YYYY-MM-DD HH:mm')}${selectedOrder.operatorName ? `（操作人：${selectedOrder.operatorName}）` : ''}`,
              },
            ]
          : []),
        ...(selectedOrder.completedAt
          ? [
              {
                color: 'success',
                children: `检查完成：${dayjs(selectedOrder.completedAt).format('YYYY-MM-DD HH:mm')}${selectedOrder.resultDoctorName ? `（报告医生：${selectedOrder.resultDoctorName}）` : ''}`,
              },
            ]
          : []),
      ]
    : [];

  return (
    <div>
      <Card>
        <Form form={searchForm} layout="inline">
          <Form.Item name="orderNumber" label="检查单编号">
            <Input placeholder="请输入检查单编号" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="patientName" label="患者姓名">
            <Input placeholder="请输入患者姓名" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" style={{ width: 120 }} allowClear>
              <Select.Option value="PENDING">待执行</Select.Option>
              <Select.Option value="IN_PROGRESS">执行中</Select.Option>
              <Select.Option value="COMPLETED">已完成</Select.Option>
              <Select.Option value="CANCELLED">已取消</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="type" label="类型">
            <Select placeholder="请选择类型" style={{ width: 100 }} allowClear>
              <Select.Option value="LAB">检验</Select.Option>
              <Select.Option value="IMAGE">影像</Select.Option>
              <Select.Option value="FUNCTION">功能检查</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="urgency" label="紧急程度">
            <Select placeholder="请选择紧急程度" style={{ width: 100 }} allowClear>
              <Select.Option value="ROUTINE">普通</Select.Option>
              <Select.Option value="URGENT">紧急</Select.Option>
              <Select.Option value="STAT">急查</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Table
          columns={columns}
          dataSource={labOrders}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
          }}
        />
      </Card>

      <Modal
        title="检查检验详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={900}
      >
        {selectedOrder ? (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="检查单编号">{selectedOrder.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="检查项目">{selectedOrder.examName}</Descriptions.Item>
              <Descriptions.Item label="患者姓名">{selectedOrder.patientName || '-'}</Descriptions.Item>
              <Descriptions.Item label="患者编号">{selectedOrder.patientNumber || '-'}</Descriptions.Item>
              <Descriptions.Item label="检查类型">{getTypeTag(selectedOrder.type)}</Descriptions.Item>
              <Descriptions.Item label="紧急程度">{getUrgencyTag(selectedOrder.urgency)}</Descriptions.Item>
              <Descriptions.Item label="开单医生">{selectedOrder.doctorName || '-'}</Descriptions.Item>
              <Descriptions.Item label="当前状态">{getStatusTag(selectedOrder.status)}</Descriptions.Item>
              <Descriptions.Item label="开单时间">
                {selectedOrder.createdAt ? dayjs(selectedOrder.createdAt).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="完成时间">
                {selectedOrder.completedAt ? dayjs(selectedOrder.completedAt).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
            </Descriptions>

            {selectedOrder.clinicalIndication && (
              <div style={{ marginTop: 16 }}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="临床指征">{selectedOrder.clinicalIndication}</Descriptions.Item>
                </Descriptions>
              </div>
            )}

            {selectedOrder.doctorRemark && (
              <div style={{ marginTop: 8 }}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="医生备注">{selectedOrder.doctorRemark}</Descriptions.Item>
                </Descriptions>
              </div>
            )}

            <Divider />

            <h4 style={{ marginBottom: 12 }}>状态时间线</h4>
            <Timeline items={statusTimeline} />

            {selectedOrder.result && (
              <div style={{ marginTop: 16 }}>
                <Divider>检查结果</Divider>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="结果摘要">{selectedOrder.result}</Descriptions.Item>
                  <Descriptions.Item label="结论">{selectedOrder.conclusion || '-'}</Descriptions.Item>
                </Descriptions>

                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <h5 style={{ marginBottom: 12 }}>检验明细</h5>
                    <Table
                      columns={itemColumns}
                      dataSource={selectedOrder.items}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        title="录入检查结果"
        open={resultModalVisible}
        onCancel={() => setResultModalVisible(false)}
        onOk={handleSubmitResult}
        okText="提交"
        cancelText="取消"
        width={700}
      >
        {selectedOrder && (
          <div>
            <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="检查单编号">{selectedOrder.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="检查项目">{selectedOrder.examName}</Descriptions.Item>
              <Descriptions.Item label="患者">{selectedOrder.patientName}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(selectedOrder.status)}</Descriptions.Item>
            </Descriptions>

            <Form form={form} layout="vertical">
              <Form.Item
                name="result"
                label="检查结果摘要"
                rules={[{ required: true, message: '请输入检查结果' }]}
              >
                <Input.TextArea
                  placeholder="请输入检查结果摘要"
                  rows={3}
                  maxLength={1000}
                  showCount
                />
              </Form.Item>
              <Form.Item name="conclusion" label="诊断结论">
                <Input.TextArea
                  placeholder="请输入诊断结论（可选）"
                  rows={3}
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LabPage;
