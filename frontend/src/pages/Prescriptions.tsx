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
  Spin,
  message,
  Descriptions,
  Tabs,
  Space,
  Divider,
  Alert,
  InputNumber,
  Radio,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  MedicineBoxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/utils/api';

interface Prescription {
  id: string;
  prescriptionNumber: string;
  visitId: string;
  patientId: string;
  patientName?: string;
  patientNumber?: string;
  doctorId?: string;
  doctorName?: string;
  type: string;
  status: string;
  conflictMessage?: string;
  doctorOverrideReason?: string;
  signedBy?: string;
  signedAt?: string;
  signature?: string;
  dispensedAt?: string;
  dispensedBy?: string;
  dispatcherName?: string;
  remark?: string;
  items: PrescriptionItem[];
  createdAt: string;
  updatedAt: string;
}

interface PrescriptionItem {
  id: string;
  prescriptionId: string;
  drugId?: string;
  drugName: string;
  specification: string;
  quantity: number;
  unit: string;
  dosage: string;
  frequency: string;
  route: string;
  instructions: string;
  price: number;
  subtotal: number;
  sortOrder: number;
}

interface CDSSAlert {
  code: string;
  type: string;
  severity: string;
  message: string;
  details: string;
}

const PrescriptionsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [searchForm] = Form.useForm();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [overrideModalVisible, setOverrideModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [overrideForm] = Form.useForm();
  const [cdssAlerts, setCdssAlerts] = useState<CDSSAlert[]>([]);
  const [alertLoading, setAlertLoading] = useState(false);

  const fetchPrescriptions = async (searchParams?: any) => {
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

      const response = await api.get(`/prescriptions?${queryString}`);
      if (response.success && response.data) {
        setPrescriptions(response.data.prescriptions || []);
        setTotal(response.data.total || 0);
      }
    } catch (error: any) {
      message.error('获取处方列表失败');
      console.error('Fetch prescriptions error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [pagination]);

  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    setPagination({ ...pagination, current: 1 });
    fetchPrescriptions(values);
  };

  const handleReset = () => {
    searchForm.resetFields();
    setPagination({ ...pagination, current: 1 });
    fetchPrescriptions();
  };

  const handleDetail = async (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setDetailModalVisible(true);
  };

  const handleReview = async (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setCdssAlerts([]);
    setAlertLoading(true);
    try {
      const response = await api.post(`/prescriptions/${prescription.id}/validate`, {});
      if (response.success && response.data) {
        if (response.data.hasConflict) {
          setCdssAlerts(response.data.alerts || []);
        }
      }
    } catch (error: any) {
      console.error('Validate prescription error:', error);
    } finally {
      setAlertLoading(false);
    }
    setReviewModalVisible(true);
  };

  const handleOverride = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    overrideForm.resetFields();
    setOverrideModalVisible(true);
  };

  const handleApprove = async () => {
    if (!selectedPrescription) return;
    try {
      const response = await api.post(`/prescriptions/${selectedPrescription.id}/sign`, {});
      if (response.success) {
        message.success('处方审核通过');
        setReviewModalVisible(false);
        fetchPrescriptions();
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleReject = async () => {
    message.warning('处方拒绝功能需要进一步实现');
  };

  const handleOverrideSubmit = async () => {
    if (!selectedPrescription) return;
    try {
      const values = await overrideForm.validateFields();
      const response = await api.post(`/prescriptions/${selectedPrescription.id}/override`, {
        reason: values.reason,
      });
      if (response.success) {
        message.success('冲突已标记忽略');
        setOverrideModalVisible(false);
        setReviewModalVisible(false);
        fetchPrescriptions();
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleDispense = async (id: string) => {
    try {
      const response = await api.post(`/prescriptions/${id}/dispense`, {});
      if (response.success) {
        message.success('发药成功');
        fetchPrescriptions();
      }
    } catch (error: any) {
      message.error(error.message || '发药失败');
    }
  };

  const getStatusTag = (status: string) => {
    const colorMap: Record<string, string> = {
      DRAFT: 'default',
      PENDING_REVIEW: 'orange',
      CONFLICT: 'red',
      APPROVED: 'blue',
      SIGNED: 'purple',
      DISPENSED: 'success',
      CANCELLED: 'default',
    };
    const labelMap: Record<string, string> = {
      DRAFT: '草稿',
      PENDING_REVIEW: '待审核',
      CONFLICT: '有冲突',
      APPROVED: '已审核',
      SIGNED: '已签名',
      DISPENSED: '已发药',
      CANCELLED: '已取消',
    };
    return <Tag color={colorMap[status] || 'default'}>{labelMap[status] || status}</Tag>;
  };

  const getTypeTag = (type: string) => {
    const colorMap: Record<string, string> = {
      REGULAR: 'blue',
      EMERGENCY: 'red',
      NARCOTIC: 'purple',
      PSYCHIATRIC: 'orange',
    };
    const labelMap: Record<string, string> = {
      REGULAR: '普通处方',
      EMERGENCY: '急诊处方',
      NARCOTIC: '麻醉处方',
      PSYCHIATRIC: '精神药品处方',
    };
    return <Tag color={colorMap[type] || 'default'}>{labelMap[type] || type}</Tag>;
  };

  const getSeverityColor = (severity: string) => {
    const colorMap: Record<string, string> = {
      CRITICAL: 'red',
      ERROR: 'red',
      WARNING: 'orange',
      INFO: 'blue',
    };
    return colorMap[severity] || 'default';
  };

  const getSeverityIcon = (severity: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      CRITICAL: <ExclamationCircleOutlined />,
      ERROR: <CloseCircleOutlined />,
      WARNING: <WarningOutlined />,
      INFO: <CheckCircleOutlined />,
    };
    return iconMap[severity] || null;
  };

  const columns = [
    {
      title: '处方编号',
      dataIndex: 'prescriptionNumber',
      key: 'prescriptionNumber',
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: '患者信息',
      key: 'patient',
      render: (_: any, record: Prescription) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.patientName || '-'}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{record.patientNumber || '-'}</div>
        </div>
      ),
    },
    {
      title: '医生',
      dataIndex: 'doctorName',
      key: 'doctorName',
      render: (name: string) => name || '-',
    },
    {
      title: '处方类型',
      dataIndex: 'type',
      key: 'type',
      render: getTypeTag,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
    },
    {
      title: '冲突信息',
      dataIndex: 'conflictMessage',
      key: 'conflictMessage',
      ellipsis: true,
      render: (msg: string) => msg || '-',
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
      render: (_: any, record: Prescription) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(record)}>
            详情
          </Button>
          {record.status === 'PENDING_REVIEW' && (
            <Button type="link" size="small" onClick={() => handleReview(record)}>
              审核
            </Button>
          )}
          {record.status === 'CONFLICT' && (
            <Button type="link" size="small" danger onClick={() => handleReview(record)}>
              处理冲突
            </Button>
          )}
          {record.status === 'APPROVED' && (
            <Button type="link" size="small" onClick={() => handleDispense(record.id)}>
              发药
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const itemColumns = [
    {
      title: '药品名称',
      dataIndex: 'drugName',
      key: 'drugName',
    },
    {
      title: '规格',
      dataIndex: 'specification',
      key: 'specification',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (q: number, record: PrescriptionItem) => `${q}${record.unit}`,
    },
    {
      title: '剂量',
      dataIndex: 'dosage',
      key: 'dosage',
    },
    {
      title: '频次',
      dataIndex: 'frequency',
      key: 'frequency',
    },
    {
      title: '给药途径',
      dataIndex: 'route',
      key: 'route',
    },
    {
      title: '用药说明',
      dataIndex: 'instructions',
      key: 'instructions',
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      render: (p: number) => `¥${p}`,
    },
    {
      title: '小计',
      dataIndex: 'subtotal',
      key: 'subtotal',
      render: (s: number) => `¥${s}`,
    },
  ];

  return (
    <div>
      <Card>
        <Form form={searchForm} layout="inline">
          <Form.Item name="prescriptionNumber" label="处方编号">
            <Input placeholder="请输入处方编号" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="patientName" label="患者姓名">
            <Input placeholder="请输入患者姓名" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" style={{ width: 120 }} allowClear>
              <Select.Option value="DRAFT">草稿</Select.Option>
              <Select.Option value="PENDING_REVIEW">待审核</Select.Option>
              <Select.Option value="CONFLICT">有冲突</Select.Option>
              <Select.Option value="APPROVED">已审核</Select.Option>
              <Select.Option value="SIGNED">已签名</Select.Option>
              <Select.Option value="DISPENSED">已发药</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="type" label="处方类型">
            <Select placeholder="请选择类型" style={{ width: 100 }} allowClear>
              <Select.Option value="REGULAR">普通处方</Select.Option>
              <Select.Option value="EMERGENCY">急诊处方</Select.Option>
              <Select.Option value="NARCOTIC">麻醉处方</Select.Option>
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
          dataSource={prescriptions}
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
        title="处方详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={900}
      >
        {selectedPrescription ? (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="处方编号">{selectedPrescription.prescriptionNumber}</Descriptions.Item>
              <Descriptions.Item label="处方类型">{getTypeTag(selectedPrescription.type)}</Descriptions.Item>
              <Descriptions.Item label="患者姓名">{selectedPrescription.patientName || '-'}</Descriptions.Item>
              <Descriptions.Item label="患者编号">{selectedPrescription.patientNumber || '-'}</Descriptions.Item>
              <Descriptions.Item label="开单医生">{selectedPrescription.doctorName || '-'}</Descriptions.Item>
              <Descriptions.Item label="当前状态">{getStatusTag(selectedPrescription.status)}</Descriptions.Item>
              <Descriptions.Item label="开单时间">
                {selectedPrescription.createdAt ? dayjs(selectedPrescription.createdAt).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="签名时间">
                {selectedPrescription.signedAt ? dayjs(selectedPrescription.signedAt).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="发药时间">
                {selectedPrescription.dispensedAt ? dayjs(selectedPrescription.dispensedAt).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="发药人">{selectedPrescription.dispatcherName || '-'}</Descriptions.Item>
            </Descriptions>

            {selectedPrescription.conflictMessage && (
              <div style={{ marginTop: 16 }}>
                <Alert
                  message="CDSS 冲突警告"
                  description={selectedPrescription.conflictMessage}
                  type="warning"
                  showIcon
                />
                {selectedPrescription.doctorOverrideReason && (
                  <Alert
                    message="医生忽略原因"
                    description={selectedPrescription.doctorOverrideReason}
                    type="info"
                    style={{ marginTop: 8 }}
                  />
                )}
              </div>
            )}

            <Divider />

            <h4 style={{ marginBottom: 12 }}>处方明细</h4>
            <Table
              columns={itemColumns}
              dataSource={selectedPrescription.items || []}
              rowKey="id"
              pagination={false}
              size="small"
            />

            {selectedPrescription.remark && (
              <div style={{ marginTop: 16 }}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="备注">{selectedPrescription.remark}</Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        title="处方审核"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={
          <Space>
            <Button onClick={() => setReviewModalVisible(false)}>取消</Button>
            {cdssAlerts.length > 0 && (
              <Button danger onClick={() => selectedPrescription && handleOverride(selectedPrescription)}>
                标记忽略
              </Button>
            )}
            <Button type="primary" onClick={handleApprove}>
              审核通过
            </Button>
          </Space>
        }
        width={700}
      >
        {selectedPrescription && (
          <div>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="处方编号">{selectedPrescription.prescriptionNumber}</Descriptions.Item>
              <Descriptions.Item label="患者">{selectedPrescription.patientName}</Descriptions.Item>
              <Descriptions.Item label="处方类型">{getTypeTag(selectedPrescription.type)}</Descriptions.Item>
              <Descriptions.Item label="当前状态">{getStatusTag(selectedPrescription.status)}</Descriptions.Item>
            </Descriptions>

            {cdssAlerts.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Divider>CDSS 临床决策支持警告</Divider>
                {cdssAlerts.map((alert, index) => (
                  <Alert
                    key={index}
                    message={alert.message}
                    description={alert.details}
                    type={getSeverityColor(alert.severity) as any}
                    showIcon
                    icon={getSeverityIcon(alert.severity)}
                    style={{ marginBottom: 12 }}
                  />
                ))}
              </div>
            )}

            <Divider />

            <h4 style={{ marginBottom: 12 }}>处方明细</h4>
            <Table
              columns={itemColumns}
              dataSource={selectedPrescription.items || []}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </div>
        )}
      </Modal>

      <Modal
        title="标记冲突忽略"
        open={overrideModalVisible}
        onCancel={() => setOverrideModalVisible(false)}
        onOk={handleOverrideSubmit}
        okText="确认"
        cancelText="取消"
      >
        <Form form={overrideForm} layout="vertical">
          <Form.Item
            name="reason"
            label="忽略原因"
            rules={[{ required: true, message: '请填写忽略原因' }]}
          >
            <Input.TextArea
              placeholder="请填写忽略该冲突的原因（必填）"
              rows={4}
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PrescriptionsPage;
