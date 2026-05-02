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
  Popconfirm,
  Descriptions,
  Tabs,
  Space,
  Divider,
  Row,
  Col,
  Statistic,
  Timeline,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SolutionOutlined,
  FileSearchOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/utils/api';

interface Visit {
  id: string;
  visitNumber: string;
  patientId: string;
  patientName?: string;
  patientNumber?: string;
  departmentId?: string;
  departmentName?: string;
  doctorId?: string;
  doctorName?: string;
  currentStatusId?: string;
  currentStatus: string;
  visitType: 'OUTPATIENT' | 'INPATIENT' | 'EMERGENCY';
  checkinTime: string;
  startTime?: string;
  endTime?: string;
  dischargeTime?: string;
  roomNumber?: string;
  bedNumber?: string;
  chiefComplaint?: string;
  presentIllness?: string;
  pastHistory?: string;
  physicalExam?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  signedBy?: string;
  signedAt?: string;
  isArchived: boolean;
  archivedAt?: string;
  qualityScore?: number;
  createdAt: string;
  updatedAt: string;
}

interface LabOrder {
  id: string;
  orderNumber: string;
  examName: string;
  status: string;
  urgency: string;
  type: string;
  clinicalIndication?: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  result?: string;
  conclusion?: string;
}

interface Prescription {
  id: string;
  prescriptionNumber: string;
  type: string;
  status: string;
  conflictMessage?: string;
  doctorOverrideReason?: string;
  signedAt?: string;
  dispensedAt?: string;
  items?: PrescriptionItem[];
}

interface PrescriptionItem {
  id: string;
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
}

const VisitsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [searchForm] = Form.useForm();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tabActiveKey, setTabActiveKey] = useState('basic');

  const fetchVisits = async (searchParams?: any) => {
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

      const response = await api.get(`/visits?${queryString}`);
      if (response.success && response.data) {
        setVisits(response.data.visits || []);
        setTotal(response.data.total || 0);
      }
    } catch (error: any) {
      message.error('获取就诊列表失败');
      console.error('Fetch visits error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, [pagination]);

  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    setPagination({ ...pagination, current: 1 });
    fetchVisits(values);
  };

  const handleReset = () => {
    searchForm.resetFields();
    setPagination({ ...pagination, current: 1 });
    fetchVisits();
  };

  const handleDetail = async (visit: Visit) => {
    setSelectedVisit(visit);
    setDetailModalVisible(true);
    setTabActiveKey('basic');
    setDetailLoading(true);
    try {
      const labResponse = await api.get(`/lab?visitId=${visit.id}`);
      if (labResponse.success && labResponse.data) {
        setLabOrders(labResponse.data.orders || []);
      }

      const prescriptionResponse = await api.get(`/prescriptions?visitId=${visit.id}`);
      if (prescriptionResponse.success && prescriptionResponse.data) {
        setPrescriptions(prescriptionResponse.data.prescriptions || []);
      }
    } catch (error: any) {
      console.error('Fetch visit details error:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const colorMap: Record<string, string> = {
      PENDING: 'orange',
      IN_CONSULTATION: 'processing',
      AWAITING_ORDER: 'blue',
      ORDER_ISSUED: 'cyan',
      IN_EXECUTION: 'purple',
      SIGNED: 'purple',
      ARCHIVED: 'success',
      CANCELLED: 'default',
    };
    const labelMap: Record<string, string> = {
      PENDING: '待诊',
      IN_CONSULTATION: '问诊中',
      AWAITING_ORDER: '待开医嘱',
      ORDER_ISSUED: '医嘱下达',
      IN_EXECUTION: '执行中',
      SIGNED: '已签名',
      ARCHIVED: '已归档',
      CANCELLED: '已取消',
    };
    return <Tag color={colorMap[status] || 'default'}>{labelMap[status] || status}</Tag>;
  };

  const getVisitTypeTag = (type: string) => {
    const colorMap: Record<string, string> = {
      OUTPATIENT: 'blue',
      INPATIENT: 'green',
      EMERGENCY: 'red',
    };
    const labelMap: Record<string, string> = {
      OUTPATIENT: '门诊',
      INPATIENT: '住院',
      EMERGENCY: '急诊',
    };
    return <Tag color={colorMap[type] || 'default'}>{labelMap[type] || type}</Tag>;
  };

  const getLabStatusTag = (status: string) => {
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

  const getPrescriptionStatusTag = (status: string) => {
    const colorMap: Record<string, string> = {
      DRAFT: 'default',
      PENDING_REVIEW: 'orange',
      APPROVED: 'blue',
      CONFLICT: 'red',
      DISPENSED: 'success',
      CANCELLED: 'default',
    };
    const labelMap: Record<string, string> = {
      DRAFT: '草稿',
      PENDING_REVIEW: '待审核',
      APPROVED: '已审核',
      CONFLICT: '有冲突',
      DISPENSED: '已发药',
      CANCELLED: '已取消',
    };
    return <Tag color={colorMap[status] || 'default'}>{labelMap[status] || status}</Tag>;
  };

  const columns = [
    {
      title: '就诊编号',
      dataIndex: 'visitNumber',
      key: 'visitNumber',
      render: (text: string) => <a onClick={() => handleDetail(visits.find((v) => v.visitNumber === text)!)}>{text}</a>,
    },
    {
      title: '患者信息',
      key: 'patient',
      render: (_: any, record: Visit) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.patientName || '-'}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{record.patientNumber || '-'}</div>
        </div>
      ),
    },
    {
      title: '就诊类型',
      dataIndex: 'visitType',
      key: 'visitType',
      render: getVisitTypeTag,
    },
    {
      title: '科室',
      dataIndex: 'departmentName',
      key: 'departmentName',
      render: (name: string) => name || '-',
    },
    {
      title: '医生',
      dataIndex: 'doctorName',
      key: 'doctorName',
      render: (name: string) => name || '-',
    },
    {
      title: '状态',
      dataIndex: 'currentStatus',
      key: 'currentStatus',
      render: getStatusTag,
    },
    {
      title: '主诉',
      dataIndex: 'chiefComplaint',
      key: 'chiefComplaint',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '就诊时间',
      dataIndex: 'checkinTime',
      key: 'checkinTime',
      render: (time: string) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Visit) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(record)}>
            详情
          </Button>
        </Space>
      ),
    },
  ];

  const prescriptionColumns = [
    {
      title: '处方编号',
      dataIndex: 'prescriptionNumber',
      key: 'prescriptionNumber',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          REGULAR: '普通处方',
          EMERGENCY: '急诊处方',
          NARCOTIC: '麻醉处方',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getPrescriptionStatusTag,
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
  ];

  const labColumns = [
    {
      title: '检查单编号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
    },
    {
      title: '检查项目',
      dataIndex: 'examName',
      key: 'examName',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          LAB: '检验',
          IMAGE: '影像',
          FUNCTION: '功能检查',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '紧急程度',
      dataIndex: 'urgency',
      key: 'urgency',
      render: (urgency: string) => {
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
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getLabStatusTag,
    },
    {
      title: '临床指征',
      dataIndex: 'clinicalIndication',
      key: 'clinicalIndication',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '结果',
      dataIndex: 'conclusion',
      key: 'conclusion',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
  ];

  const statusTimeline = selectedVisit
    ? [
        {
          color: 'blue',
          dot: <ClockCircleOutlined />,
          children: `挂号成功：${dayjs(selectedVisit.checkinTime).format('YYYY-MM-DD HH:mm')}`,
        },
        ...(selectedVisit.startTime
          ? [
              {
                color: 'green',
                dot: <MedicineBoxOutlined />,
                children: `开始问诊：${dayjs(selectedVisit.startTime).format('YYYY-MM-DD HH:mm')}`,
              },
            ]
          : []),
        ...(selectedVisit.signedAt
          ? [
              {
                color: 'purple',
                dot: <SafetyCertificateOutlined />,
                children: `电子签名：${dayjs(selectedVisit.signedAt).format('YYYY-MM-DD HH:mm')}`,
              },
            ]
          : []),
        ...(selectedVisit.archivedAt
          ? [
              {
                color: 'green',
                dot: <FileSearchOutlined />,
                children: `病历归档：${dayjs(selectedVisit.archivedAt).format('YYYY-MM-DD HH:mm')}${selectedVisit.qualityScore !== undefined ? `（质量评分：${selectedVisit.qualityScore}分）` : ''}`,
              },
            ]
          : []),
      ]
    : [];

  const tabItems = [
    {
      key: 'basic',
      label: (
        <span>
          <UserOutlined style={{ marginRight: 4 }} />
          就诊信息
        </span>
      ),
      children: selectedVisit ? (
        <div>
          <Row gutter={16}>
            <Col span={12}>
              <Card size="small" title="基本信息">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="就诊编号">{selectedVisit.visitNumber}</Descriptions.Item>
                  <Descriptions.Item label="患者姓名">{selectedVisit.patientName || '-'}</Descriptions.Item>
                  <Descriptions.Item label="患者编号">{selectedVisit.patientNumber || '-'}</Descriptions.Item>
                  <Descriptions.Item label="就诊类型">{getVisitTypeTag(selectedVisit.visitType)}</Descriptions.Item>
                  <Descriptions.Item label="就诊科室">{selectedVisit.departmentName || '-'}</Descriptions.Item>
                  <Descriptions.Item label="接诊医生">{selectedVisit.doctorName || '-'}</Descriptions.Item>
                  <Descriptions.Item label="当前状态">{getStatusTag(selectedVisit.currentStatus)}</Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title="时间线">
                <Timeline items={statusTimeline} mode="left" />
              </Card>
            </Col>
          </Row>

          <Divider />

          <Row gutter={16}>
            <Col span={24}>
              <Card size="small" title="诊疗记录">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="主诉">{selectedVisit.chiefComplaint || '暂无'}</Descriptions.Item>
                  <Descriptions.Item label="现病史">{selectedVisit.presentIllness || '暂无'}</Descriptions.Item>
                  <Descriptions.Item label="既往史">{selectedVisit.pastHistory || '暂无'}</Descriptions.Item>
                  <Descriptions.Item label="体格检查">{selectedVisit.physicalExam || '暂无'}</Descriptions.Item>
                  <Descriptions.Item label="诊断">{selectedVisit.diagnosis || '暂无'}</Descriptions.Item>
                  <Descriptions.Item label="治疗方案">{selectedVisit.treatmentPlan || '暂无'}</Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>
        </div>
      ) : null,
    },
    {
      key: 'prescriptions',
      label: (
        <span>
          <MedicineBoxOutlined style={{ marginRight: 4 }} />
          处方记录
          {prescriptions.length > 0 && <Tag color="blue" style={{ marginLeft: 4 }}>{prescriptions.length}</Tag>}
        </span>
      ),
      children: (
        <div>
          <Table
            dataSource={prescriptions}
            columns={prescriptionColumns}
            rowKey="id"
            loading={detailLoading}
            pagination={false}
            size="small"
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ padding: '8px 16px' }}>
                  <h4 style={{ marginBottom: 12 }}>处方明细</h4>
                  {record.items && record.items.length > 0 ? (
                    <Table
                      dataSource={record.items}
                      columns={[
                        { title: '药品名称', dataIndex: 'drugName', key: 'drugName' },
                        { title: '规格', dataIndex: 'specification', key: 'specification' },
                        { title: '数量', dataIndex: 'quantity', key: 'quantity', render: (q, r) => `${q}${r.unit}` },
                        { title: '剂量', dataIndex: 'dosage', key: 'dosage' },
                        { title: '频次', dataIndex: 'frequency', key: 'frequency' },
                        { title: '给药途径', dataIndex: 'route', key: 'route' },
                        { title: '用药说明', dataIndex: 'instructions', key: 'instructions' },
                        { title: '小计', dataIndex: 'subtotal', key: 'subtotal', render: (s) => `¥${s}` },
                      ]}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  ) : (
                    <div style={{ color: '#999' }}>暂无处方明细</div>
                  )}
                </div>
              ),
            }}
          />
        </div>
      ),
    },
    {
      key: 'lab',
      label: (
        <span>
          <SolutionOutlined style={{ marginRight: 4 }} />
          检查检验
          {labOrders.length > 0 && <Tag color="blue" style={{ marginLeft: 4 }}>{labOrders.length}</Tag>}
        </span>
      ),
      children: (
        <Table
          dataSource={labOrders}
          columns={labColumns}
          rowKey="id"
          loading={detailLoading}
          pagination={false}
          size="small"
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: '8px 16px' }}>
                <h4 style={{ marginBottom: 12 }}>检查结果</h4>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="临床指征">{record.clinicalIndication || '暂无'}</Descriptions.Item>
                  <Descriptions.Item label="结果">{record.result || '暂无'}</Descriptions.Item>
                  <Descriptions.Item label="结论">{record.conclusion || '暂无'}</Descriptions.Item>
                  <Descriptions.Item label="计划时间">
                    {record.scheduledAt ? dayjs(record.scheduledAt).format('YYYY-MM-DD HH:mm') : '暂无'}
                  </Descriptions.Item>
                  <Descriptions.Item label="开始时间">
                    {record.startedAt ? dayjs(record.startedAt).format('YYYY-MM-DD HH:mm') : '暂无'}
                  </Descriptions.Item>
                  <Descriptions.Item label="完成时间">
                    {record.completedAt ? dayjs(record.completedAt).format('YYYY-MM-DD HH:mm') : '暂无'}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            ),
          }}
        />
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Form form={searchForm} layout="inline">
          <Form.Item name="visitNumber" label="就诊编号">
            <Input placeholder="请输入就诊编号" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="patientName" label="患者姓名">
            <Input placeholder="请输入患者姓名" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" style={{ width: 120 }} allowClear>
              <Select.Option value="PENDING">待诊</Select.Option>
              <Select.Option value="IN_CONSULTATION">问诊中</Select.Option>
              <Select.Option value="ORDER_ISSUED">医嘱下达</Select.Option>
              <Select.Option value="SIGNED">已签名</Select.Option>
              <Select.Option value="ARCHIVED">已归档</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="visitType" label="就诊类型">
            <Select placeholder="请选择类型" style={{ width: 100 }} allowClear>
              <Select.Option value="OUTPATIENT">门诊</Select.Option>
              <Select.Option value="INPATIENT">住院</Select.Option>
              <Select.Option value="EMERGENCY">急诊</Select.Option>
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
          dataSource={visits}
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
        title="就诊详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={1000}
      >
        <Tabs activeKey={tabActiveKey} onChange={setTabActiveKey} items={tabItems} />
      </Modal>
    </div>
  );
};

export default VisitsPage;
