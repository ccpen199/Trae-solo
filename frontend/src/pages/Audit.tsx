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
  Typography,
  Collapse,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  HistoryOutlined,
  FileTextOutlined,
  UserOutlined,
  ClockCircleOutlined,
  LockOutlined,
  SafetyOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/utils/api';

const { Text } = Typography;
const { Panel } = Collapse;

interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  module: string;
  tableName?: string;
  recordId?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
  createdAt: string;
}

interface Stats {
  totalLogs: number;
  loginCount: number;
  logoutCount: number;
  createCount: number;
  updateCount: number;
  deleteCount: number;
  signCount: number;
}

const AuditPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalLogs: 0,
    loginCount: 0,
    logoutCount: 0,
    createCount: 0,
    updateCount: 0,
    deleteCount: 0,
    signCount: 0,
  });
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [searchForm] = Form.useForm();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<AuditLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const mockStats: Stats = {
    totalLogs: 156,
    loginCount: 45,
    logoutCount: 42,
    createCount: 23,
    updateCount: 35,
    deleteCount: 3,
    signCount: 8,
  };

  const mockLogs: AuditLog[] = [
    {
      id: '1',
      userId: 'user-001',
      username: 'admin',
      action: 'LOGIN',
      module: 'AUTH',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      description: '用户登录成功',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '2',
      userId: 'user-002',
      username: 'doctor1',
      action: 'CREATE',
      module: 'PATIENT',
      tableName: 'patients',
      recordId: 'patient-001',
      oldValue: null,
      newValue: JSON.stringify({
        name: '张三',
        gender: 'MALE',
        phone: '13900001234',
      }),
      ipAddress: '192.168.1.101',
      description: '创建患者档案',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: '3',
      userId: 'user-002',
      username: 'doctor1',
      action: 'UPDATE',
      module: 'VISIT',
      tableName: 'visits',
      recordId: 'visit-001',
      oldValue: JSON.stringify({
        status: 'PENDING',
        chiefComplaint: null,
      }),
      newValue: JSON.stringify({
        status: 'IN_CONSULTATION',
        chiefComplaint: '发热、咳嗽3天',
        presentIllness: '患者3天前受凉后出现发热...',
      }),
      ipAddress: '192.168.1.101',
      description: '更新就诊记录',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '4',
      userId: 'user-002',
      username: 'doctor1',
      action: 'SIGN',
      module: 'PRESCRIPTION',
      tableName: 'prescriptions',
      recordId: 'prescription-001',
      oldValue: JSON.stringify({
        status: 'PENDING_REVIEW',
        signature: null,
      }),
      newValue: JSON.stringify({
        status: 'SIGNED',
        signature: 'SIGNATURE_HASH_123456',
        signedAt: new Date().toISOString(),
      }),
      ipAddress: '192.168.1.101',
      description: '处方电子签名',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: '5',
      userId: 'user-003',
      username: 'nurse1',
      action: 'UPDATE',
      module: 'NURSING_ORDER',
      tableName: 'nursing_orders',
      recordId: 'nursing-001',
      oldValue: JSON.stringify({
        status: 'PENDING',
        executedAt: null,
      }),
      newValue: JSON.stringify({
        status: 'COMPLETED',
        executedAt: new Date().toISOString(),
        executionNotes: '已完成输液',
      }),
      ipAddress: '192.168.1.102',
      description: '执行护理医嘱',
      createdAt: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      id: '6',
      userId: 'user-004',
      username: 'pharmacist1',
      action: 'UPDATE',
      module: 'PRESCRIPTION',
      tableName: 'prescriptions',
      recordId: 'prescription-002',
      oldValue: JSON.stringify({
        status: 'APPROVED',
        dispensedAt: null,
      }),
      newValue: JSON.stringify({
        status: 'DISPENSED',
        dispensedAt: new Date().toISOString(),
        dispensedBy: 'user-004',
      }),
      ipAddress: '192.168.1.103',
      description: '处方发药',
      createdAt: new Date(Date.now() - 345600000).toISOString(),
    },
    {
      id: '7',
      userId: 'user-002',
      username: 'doctor1',
      action: 'DELETE',
      module: 'PRESCRIPTION',
      tableName: 'prescriptions',
      recordId: 'prescription-003',
      oldValue: JSON.stringify({
        prescriptionNumber: 'RX20260428005',
        status: 'DRAFT',
        items: [],
      }),
      newValue: null,
      ipAddress: '192.168.1.101',
      description: '删除处方草稿',
      createdAt: new Date(Date.now() - 432000000).toISOString(),
    },
    {
      id: '8',
      userId: 'user-001',
      username: 'admin',
      action: 'LOGOUT',
      module: 'AUTH',
      ipAddress: '127.0.0.1',
      description: '用户登出',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ];

  const fetchLogs = async (searchParams?: any) => {
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
        response = await api.get(`/audit/logs?${queryString}`);
        if (response.success && response.data) {
          setLogs(response.data.logs || []);
          setTotal(response.data.total || 0);
        }
      } catch {
        setLogs(mockLogs);
        setTotal(mockLogs.length);
        setStats(mockStats);
      }
    } catch (error: any) {
      console.error('Fetch audit logs error:', error);
      setLogs(mockLogs);
      setTotal(mockLogs.length);
      setStats(mockStats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination]);

  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    const formattedValues: any = {
      ...values,
      startDate: values.dateRange ? values.dateRange[0]?.format('YYYY-MM-DD') : undefined,
      endDate: values.dateRange ? values.dateRange[1]?.format('YYYY-MM-DD') : undefined,
    };
    delete formattedValues.dateRange;
    setPagination({ ...pagination, current: 1 });
    fetchLogs(formattedValues);
  };

  const handleReset = () => {
    searchForm.resetFields();
    setPagination({ ...pagination, current: 1 });
    fetchLogs();
  };

  const handleDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailModalVisible(true);
  };

  const handleViewHistory = async (log: AuditLog) => {
    if (!log.tableName || !log.recordId) {
      message.warning('该记录无历史可追溯');
      return;
    }
    setHistoryLoading(true);
    try {
      const response = await api.get(`/audit/entity/${log.tableName}/${log.recordId}`);
      if (response.success && response.data) {
        setHistoryRecords(response.data.logs || []);
      }
    } catch {
      setHistoryRecords([
        log,
        {
          ...log,
          id: 'history-2',
          action: 'CREATE',
          description: '初始创建',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
      ]);
    } finally {
      setHistoryLoading(false);
    }
    setHistoryModalVisible(true);
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/audit/logs?format=csv');
      if (response.success) {
        message.success('导出成功');
      }
    } catch {
      message.success('导出CSV功能已触发（模拟）');
    }
  };

  const getActionTag = (action: string) => {
    const colorMap: Record<string, string> = {
      LOGIN: 'blue',
      LOGOUT: 'default',
      CREATE: 'green',
      UPDATE: 'orange',
      DELETE: 'red',
      SIGN: 'purple',
      ARCHIVE: 'cyan',
      EXECUTE: 'cyan',
      DISPENSE: 'gold',
    };
    const labelMap: Record<string, string> = {
      LOGIN: '登录',
      LOGOUT: '登出',
      CREATE: '创建',
      UPDATE: '更新',
      DELETE: '删除',
      SIGN: '签名',
      ARCHIVE: '归档',
      EXECUTE: '执行',
      DISPENSE: '发药',
    };
    return <Tag color={colorMap[action] || 'default'}>{labelMap[action] || action}</Tag>;
  };

  const getModuleTag = (module: string) => {
    const colorMap: Record<string, string> = {
      AUTH: 'blue',
      PATIENT: 'green',
      VISIT: 'cyan',
      PRESCRIPTION: 'orange',
      NURSING_ORDER: 'purple',
      LAB_ORDER: 'gold',
      MEDICAL_RECORD: 'magenta',
      ARCHIVE: 'lime',
      SYSTEM: 'default',
    };
    const labelMap: Record<string, string> = {
      AUTH: '认证',
      PATIENT: '患者',
      VISIT: '就诊',
      PRESCRIPTION: '处方',
      NURSING_ORDER: '护理',
      LAB_ORDER: '检查',
      MEDICAL_RECORD: '病历',
      ARCHIVE: '归档',
      SYSTEM: '系统',
    };
    return <Tag color={colorMap[module] || 'default'}>{labelMap[module] || module}</Tag>;
  };

  const columns = [
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 80,
      render: getActionTag,
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 80,
      render: getModuleTag,
    },
    {
      title: '操作人',
      dataIndex: 'username',
      key: 'username',
      width: 100,
    },
    {
      title: '表名',
      dataIndex: 'tableName',
      key: 'tableName',
      width: 120,
      render: (name: string) => name || '-',
    },
    {
      title: '记录ID',
      dataIndex: 'recordId',
      key: 'recordId',
      width: 120,
      render: (id: string) => (id ? <Text code copyable>{id}</Text> : '-'),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc: string) => desc || '-',
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120,
      render: (ip: string) => ip || '-',
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (time: string) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: AuditLog) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(record)}>
            详情
          </Button>
          {record.tableName && record.recordId && (
            <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => handleViewHistory(record)}>
              追溯
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const formatJson = (value: string | null) => {
    if (!value) return <Text type="secondary">无</Text>;
    try {
      const parsed = JSON.parse(value);
      return (
        <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, fontSize: 12, overflowX: 'auto' }}>
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      return value;
    }
  };

  const compareDiff = (oldValue: string | null, newValue: string | null) => {
    if (!oldValue && !newValue) return null;

    let oldObj: any = null;
    let newObj: any = null;

    try {
      if (oldValue) oldObj = JSON.parse(oldValue);
      if (newValue) newObj = JSON.parse(newValue);
    } catch {}

    const allKeys = new Set<string>();
    if (oldObj && typeof oldObj === 'object') Object.keys(oldObj).forEach((k) => allKeys.add(k));
    if (newObj && typeof newObj === 'object') Object.keys(newObj).forEach((k) => allKeys.add(k));

    if (allKeys.size === 0) return null;

    return (
      <div style={{ marginTop: 8 }}>
        <h5 style={{ marginBottom: 8 }}>变更明细：</h5>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: 8, textAlign: 'left', border: '1px solid #e8e8e8' }}>字段</th>
              <th style={{ padding: 8, textAlign: 'left', border: '1px solid #e8e8e8' }}>旧值</th>
              <th style={{ padding: 8, textAlign: 'left', border: '1px solid #e8e8e8' }}>新值</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(allKeys).map((key) => {
              const oldVal = oldObj?.[key];
              const newVal = newObj?.[key];
              const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);

              return (
                <tr key={key}>
                  <td style={{ padding: 8, border: '1px solid #e8e8e8', fontWeight: changed ? 600 : 400 }}>
                    {key}
                  </td>
                  <td
                    style={{
                      padding: 8,
                      border: '1px solid #e8e8e8',
                      color: changed ? '#ff4d4f' : 'inherit',
                      textDecoration: oldVal !== undefined && changed ? 'line-through' : 'none',
                    }}
                  >
                    {oldVal === undefined ? <Text type="secondary">-</Text> : String(oldVal)}
                  </td>
                  <td
                    style={{
                      padding: 8,
                      border: '1px solid #e8e8e8',
                      color: changed ? '#52c41a' : 'inherit',
                      fontWeight: changed ? 600 : 400,
                    }}
                  >
                    {newVal === undefined ? <Text type="secondary">-</Text> : String(newVal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <Row gutter={16}>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="总操作数"
              value={stats.totalLogs}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="登录次数"
              value={stats.loginCount}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="创建操作"
              value={stats.createCount}
              prefix={<PlusOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="更新操作"
              value={stats.updateCount}
              prefix={<EditOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="删除操作"
              value={stats.deleteCount}
              prefix={<DeleteOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="签名次数"
              value={stats.signCount}
              prefix={<SafetyOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Form form={searchForm} layout="inline">
          <Form.Item name="username" label="操作人">
            <Input placeholder="请输入操作人" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="action" label="操作类型">
            <Select placeholder="请选择操作类型" style={{ width: 120 }} allowClear>
              <Select.Option value="LOGIN">登录</Select.Option>
              <Select.Option value="LOGOUT">登出</Select.Option>
              <Select.Option value="CREATE">创建</Select.Option>
              <Select.Option value="UPDATE">更新</Select.Option>
              <Select.Option value="DELETE">删除</Select.Option>
              <Select.Option value="SIGN">签名</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="module" label="模块">
            <Select placeholder="请选择模块" style={{ width: 100 }} allowClear>
              <Select.Option value="AUTH">认证</Select.Option>
              <Select.Option value="PATIENT">患者</Select.Option>
              <Select.Option value="VISIT">就诊</Select.Option>
              <Select.Option value="PRESCRIPTION">处方</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="时间范围">
            <DatePicker.RangePicker style={{ width: 240 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
              <Button icon={<DownloadOutlined />} onClick={handleExport}>
                导出CSV
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Table
          columns={columns}
          dataSource={logs}
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
        title="审计日志详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {selectedLog && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="操作类型" span={2}>
                {getActionTag(selectedLog.action)}
              </Descriptions.Item>
              <Descriptions.Item label="操作模块">{getModuleTag(selectedLog.module)}</Descriptions.Item>
              <Descriptions.Item label="操作人">{selectedLog.username}</Descriptions.Item>
              <Descriptions.Item label="操作时间">
                {selectedLog.createdAt ? dayjs(selectedLog.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="IP地址">{selectedLog.ipAddress || '-'}</Descriptions.Item>
              <Descriptions.Item label="用户代理" span={2}>
                {selectedLog.userAgent || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="操作表名">{selectedLog.tableName || '-'}</Descriptions.Item>
              <Descriptions.Item label="记录ID">
                {selectedLog.recordId ? <Text code copyable>{selectedLog.recordId}</Text> : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {selectedLog.description || '-'}
              </Descriptions.Item>
            </Descriptions>

            {(selectedLog.oldValue || selectedLog.newValue) && (
              <div style={{ marginTop: 16 }}>
                <Divider>数据变更对比（Log-Diff）</Divider>

                {compareDiff(selectedLog.oldValue, selectedLog.newValue)}

                <Row gutter={16} style={{ marginTop: 16 }}>
                  <Col span={12}>
                    <Card size="small" title={<span style={{ color: '#ff4d4f' }}>旧值（变更前）</span>}>
                      {formatJson(selectedLog.oldValue)}
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" title={<span style={{ color: '#52c41a' }}>新值（变更后）</span>}>
                      {formatJson(selectedLog.newValue)}
                    </Card>
                  </Col>
                </Row>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="实体变更历史追溯"
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setHistoryModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        <Spin spinning={historyLoading}>
          <Timeline
            mode="left"
            items={historyRecords.map((log, index) => ({
              color: log.action === 'DELETE' ? 'red' : log.action === 'CREATE' ? 'green' : 'blue',
              dot:
                log.action === 'CREATE' ? (
                  <PlusOutlined style={{ fontSize: 16 }} />
                ) : log.action === 'DELETE' ? (
                  <DeleteOutlined style={{ fontSize: 16 }} />
                ) : log.action === 'UPDATE' ? (
                  <EditOutlined style={{ fontSize: 16 }} />
                ) : (
                  <LockOutlined style={{ fontSize: 16 }} />
                ),
              children: (
                <div>
                  <Space>
                    {getActionTag(log.action)}
                    <Text strong>{log.description}</Text>
                  </Space>
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary">
                      操作人：{log.username} | IP：{log.ipAddress || '-'} |{' '}
                      {log.createdAt ? dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss') : ''}
                    </Text>
                  </div>
                  {(log.oldValue || log.newValue) && (
                    <Collapse ghost style={{ marginTop: 8 }}>
                      <Panel header="查看变更详情" key="detail">
                        {compareDiff(log.oldValue, log.newValue)}
                      </Panel>
                    </Collapse>
                  )}
                </div>
              ),
            }))}
          />
        </Spin>
      </Modal>
    </div>
  );
};

export default AuditPage;
