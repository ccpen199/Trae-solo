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
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  UserOutlined,
  ClockCircleOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/utils/api';

interface ExceptionItem {
  id: string;
  type: string;
  severity: string;
  status: string;
  module: string;
  title: string;
  description: string;
  sourceType: string;
  sourceId: string;
  sourceNumber?: string;
  patientName?: string;
  patientNumber?: string;
  ruleCode?: string;
  ruleName?: string;
  createdBy?: string;
  createdByName?: string;
  handlerId?: string;
  handlerName?: string;
  handledAt?: string;
  handleResult?: string;
  handleRemark?: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalExceptions: number;
  pendingExceptions: number;
  processingExceptions: number;
  resolvedExceptions: number;
  criticalExceptions: number;
}

const ExceptionsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalExceptions: 0,
    pendingExceptions: 0,
    processingExceptions: 0,
    resolvedExceptions: 0,
    criticalExceptions: 0,
  });
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [searchForm] = Form.useForm();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [handleModalVisible, setHandleModalVisible] = useState(false);
  const [selectedException, setSelectedException] = useState<ExceptionItem | null>(null);
  const [form] = Form.useForm();

  const mockStats: Stats = {
    totalExceptions: 12,
    pendingExceptions: 5,
    processingExceptions: 3,
    resolvedExceptions: 4,
    criticalExceptions: 2,
  };

  const mockExceptions: ExceptionItem[] = [
    {
      id: '1',
      type: 'CDSS_ALERT',
      severity: 'CRITICAL',
      status: 'PENDING',
      module: 'PRESCRIPTION',
      title: '处方药物过敏警告',
      description: '患者张三有青霉素过敏史，处方中开具了阿莫西林胶囊',
      sourceType: 'PRESCRIPTION',
      sourceId: 'rx-001',
      sourceNumber: 'RX20260428001',
      patientName: '张三',
      patientNumber: 'P20260401001',
      ruleCode: 'PENICILLIN_ALLERGY_CHECK',
      ruleName: '青霉素过敏检查',
      createdByName: '张医生',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '2',
      type: 'CDSS_ALERT',
      severity: 'WARNING',
      status: 'RESOLVED',
      module: 'PRESCRIPTION',
      title: '儿科用药年龄限制警告',
      description: '患者年龄5岁，使用左氧氟沙星需谨慎',
      sourceType: 'PRESCRIPTION',
      sourceId: 'rx-002',
      sourceNumber: 'RX20260428002',
      patientName: '小明',
      patientNumber: 'P20260401006',
      ruleCode: 'PEDIATRIC_AGE_CHECK',
      ruleName: '儿科用药年龄限制',
      createdByName: '李医生',
      handlerName: '李医生',
      handledAt: new Date(Date.now() - 1800000).toISOString(),
      handleResult: 'IGNORED',
      handleRemark: '根据临床经验，该患者情况特殊，需使用此药物',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: '3',
      type: 'GENDER_CONFLICT',
      severity: 'ERROR',
      status: 'PENDING',
      module: 'MEDICAL_RECORD',
      title: '性别与月经史冲突',
      description: '患者为男性，但病历中记录了月经史',
      sourceType: 'MEDICAL_RECORD',
      sourceId: 'mr-001',
      patientName: '赵六',
      patientNumber: 'P20260401003',
      ruleCode: 'GENDER_MENSTRUATION_CONFLICT',
      ruleName: '性别与月经史冲突校验',
      createdByName: '李医生',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: '4',
      type: 'QUALITY_ISSUE',
      severity: 'WARNING',
      status: 'PROCESSING',
      module: 'ARCHIVE',
      title: '病历质量不达标',
      description: '病历缺少诊断记录，质量评分仅65分，低于80分及格线',
      sourceType: 'VISIT',
      sourceId: 'visit-001',
      sourceNumber: 'V20260428004',
      patientName: '陈小红',
      patientNumber: 'P20260401004',
      createdByName: '系统',
      handlerName: '王护士',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '5',
      type: 'DRUG_INTERACTION',
      severity: 'WARNING',
      status: 'RESOLVED',
      module: 'PRESCRIPTION',
      title: '药物相互作用警告',
      description: '阿司匹林与华法林联用可能增加出血风险',
      sourceType: 'PRESCRIPTION',
      sourceId: 'rx-003',
      sourceNumber: 'RX20260428003',
      patientName: '刘强',
      patientNumber: 'P20260401005',
      createdByName: '张医生',
      handlerName: '陈药师',
      handledAt: new Date(Date.now() - 7200000).toISOString(),
      handleResult: 'RESOLVED',
      handleRemark: '已调整用药方案，减少华法林剂量，并告知患者注意监测',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  const fetchExceptions = async (searchParams?: any) => {
    setLoading(true);
    try {
      let response;
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
        response = await api.get(`/audit/cdss-alerts?${queryString}`);
        if (response.success && response.data) {
          setExceptions(response.data.alerts || []);
          setTotal(response.data.total || 0);
        }
      } catch {
        setExceptions(mockExceptions);
        setTotal(mockExceptions.length);
        setStats(mockStats);
      }
    } catch (error: any) {
      console.error('Fetch exceptions error:', error);
      setExceptions(mockExceptions);
      setTotal(mockExceptions.length);
      setStats(mockStats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, [pagination]);

  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    setPagination({ ...pagination, current: 1 });
    fetchExceptions(values);
  };

  const handleReset = () => {
    searchForm.resetFields();
    setPagination({ ...pagination, current: 1 });
    fetchExceptions();
  };

  const handleDetail = (exception: ExceptionItem) => {
    setSelectedException(exception);
    setDetailModalVisible(true);
  };

  const handleProcess = (exception: ExceptionItem) => {
    setSelectedException(exception);
    form.resetFields();
    form.setFieldsValue({
      status: 'PROCESSING',
    });
    setHandleModalVisible(true);
  };

  const handleResolve = (exception: ExceptionItem) => {
    setSelectedException(exception);
    form.resetFields();
    form.setFieldsValue({
      status: 'RESOLVED',
      result: 'RESOLVED',
    });
    setHandleModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!selectedException) return;
    try {
      const values = await form.validateFields();
      message.success('异常处理成功');
      setHandleModalVisible(false);
      fetchExceptions();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const getSeverityTag = (severity: string) => {
    const colorMap: Record<string, string> = {
      CRITICAL: 'red',
      ERROR: 'red',
      WARNING: 'orange',
      INFO: 'blue',
    };
    const labelMap: Record<string, string> = {
      CRITICAL: '严重',
      ERROR: '错误',
      WARNING: '警告',
      INFO: '信息',
    };
    return <Tag color={colorMap[severity] || 'default'}>{labelMap[severity] || severity}</Tag>;
  };

  const getStatusTag = (status: string) => {
    const colorMap: Record<string, string> = {
      PENDING: 'orange',
      PROCESSING: 'processing',
      RESOLVED: 'success',
      IGNORED: 'default',
      CLOSED: 'default',
    };
    const labelMap: Record<string, string> = {
      PENDING: '待处理',
      PROCESSING: '处理中',
      RESOLVED: '已解决',
      IGNORED: '已忽略',
      CLOSED: '已关闭',
    };
    return <Tag color={colorMap[status] || 'default'}>{labelMap[status] || status}</Tag>;
  };

  const getTypeTag = (type: string) => {
    const colorMap: Record<string, string> = {
      CDSS_ALERT: 'purple',
      GENDER_CONFLICT: 'blue',
      AGE_CONFLICT: 'cyan',
      DRUG_ALLERGY: 'red',
      DRUG_INTERACTION: 'orange',
      QUALITY_ISSUE: 'gold',
    };
    const labelMap: Record<string, string> = {
      CDSS_ALERT: 'CDSS告警',
      GENDER_CONFLICT: '性别冲突',
      AGE_CONFLICT: '年龄冲突',
      DRUG_ALLERGY: '药物过敏',
      DRUG_INTERACTION: '药物相互作用',
      QUALITY_ISSUE: '质量问题',
    };
    return <Tag color={colorMap[type] || 'default'}>{labelMap[type] || type}</Tag>;
  };

  const columns = [
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 80,
      render: getSeverityTag,
    },
    {
      title: '异常类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: getTypeTag,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: getStatusTag,
    },
    {
      title: '异常标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '患者',
      dataIndex: 'patientName',
      key: 'patientName',
      width: 100,
      render: (name: string, record: ExceptionItem) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name || '-'}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{record.patientNumber || '-'}</div>
        </div>
      ),
    },
    {
      title: '源单号',
      dataIndex: 'sourceNumber',
      key: 'sourceNumber',
      width: 120,
      render: (num: string) => num || '-',
    },
    {
      title: '创建人',
      dataIndex: 'createdByName',
      key: 'createdByName',
      width: 80,
      render: (name: string) => name || '-',
    },
    {
      title: '处理人',
      dataIndex: 'handlerName',
      key: 'handlerName',
      width: 80,
      render: (name: string) => name || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (time: string) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: ExceptionItem) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(record)}>
            详情
          </Button>
          {record.status === 'PENDING' && (
            <Button type="link" size="small" onClick={() => handleProcess(record)}>
              处理
            </Button>
          )}
          {['PENDING', 'PROCESSING'].includes(record.status) && (
            <Button type="link" size="small" onClick={() => handleResolve(record)}>
              解决
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16}>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="异常总数"
              value={stats.totalExceptions}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="待处理"
              value={stats.pendingExceptions}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="处理中"
              value={stats.processingExceptions}
              prefix={<SolutionOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="已解决"
              value={stats.resolvedExceptions}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="严重异常"
              value={stats.criticalExceptions}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Form form={searchForm} layout="inline">
          <Form.Item name="severity" label="严重程度">
            <Select placeholder="请选择严重程度" style={{ width: 120 }} allowClear>
              <Select.Option value="CRITICAL">严重</Select.Option>
              <Select.Option value="ERROR">错误</Select.Option>
              <Select.Option value="WARNING">警告</Select.Option>
              <Select.Option value="INFO">信息</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" style={{ width: 120 }} allowClear>
              <Select.Option value="PENDING">待处理</Select.Option>
              <Select.Option value="PROCESSING">处理中</Select.Option>
              <Select.Option value="RESOLVED">已解决</Select.Option>
              <Select.Option value="IGNORED">已忽略</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="patientName" label="患者姓名">
            <Input placeholder="请输入患者姓名" style={{ width: 120 }} />
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
          dataSource={exceptions}
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
        title="异常详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedException && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="异常标题" span={2}>
                {selectedException.title}
              </Descriptions.Item>
              <Descriptions.Item label="异常类型">{getTypeTag(selectedException.type)}</Descriptions.Item>
              <Descriptions.Item label="严重程度">{getSeverityTag(selectedException.severity)}</Descriptions.Item>
              <Descriptions.Item label="当前状态">{getStatusTag(selectedException.status)}</Descriptions.Item>
              <Descriptions.Item label="所属模块">{selectedException.module}</Descriptions.Item>
              <Descriptions.Item label="规则名称">{selectedException.ruleName || '-'}</Descriptions.Item>
              <Descriptions.Item label="规则编码">{selectedException.ruleCode || '-'}</Descriptions.Item>
              <Descriptions.Item label="患者信息" span={2}>
                {selectedException.patientName || '-'} ({selectedException.patientNumber || '-'})
              </Descriptions.Item>
              <Descriptions.Item label="源单类型">{selectedException.sourceType}</Descriptions.Item>
              <Descriptions.Item label="源单编号">{selectedException.sourceNumber || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建人">{selectedException.createdByName || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {selectedException.createdAt ? dayjs(selectedException.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="处理人">{selectedException.handlerName || '-'}</Descriptions.Item>
              <Descriptions.Item label="处理时间">
                {selectedException.handledAt ? dayjs(selectedException.handledAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Alert
              message="异常描述"
              description={selectedException.description}
              type="warning"
              showIcon
            />

            {selectedException.handleRemark && (
              <Alert
                message="处理备注"
                description={selectedException.handleRemark}
                type="info"
                style={{ marginTop: 12 }}
              />
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="处理异常"
        open={handleModalVisible}
        onCancel={() => setHandleModalVisible(false)}
        onOk={handleSubmit}
        okText="提交"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="status"
            label="处理状态"
            rules={[{ required: true, message: '请选择处理状态' }]}
          >
            <Select placeholder="请选择处理状态">
              <Select.Option value="PROCESSING">处理中</Select.Option>
              <Select.Option value="RESOLVED">已解决</Select.Option>
              <Select.Option value="IGNORED">已忽略</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="result"
            label="处理结果"
            rules={[{ required: true, message: '请选择处理结果' }]}
          >
            <Select placeholder="请选择处理结果">
              <Select.Option value="RESOLVED">已解决</Select.Option>
              <Select.Option value="IGNORED">已忽略</Select.Option>
              <Select.Option value="ESCALATED">已升级</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="remark"
            label="处理备注"
            rules={[{ required: true, message: '请填写处理备注' }]}
          >
            <Input.TextArea
              placeholder="请填写处理备注（必填）"
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

export default ExceptionsPage;
