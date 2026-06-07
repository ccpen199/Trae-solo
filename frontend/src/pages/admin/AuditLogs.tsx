import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Spin, message, Tag, Select, Form, Input, DatePicker, Modal, Typography, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { api } from '../../api';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';

interface AuditLog {
  id: number;
  userId: number;
  action: string;
  tableName: string;
  recordId?: number;
  oldValues?: string;
  newValues?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  username?: string;
  realName?: string;
}

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text } = Typography;

const AuditLogs: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [form] = Form.useForm();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async (params?: any) => {
    setLoading(true);
    try {
      const res = await api.admin.getAuditLogs({
        page,
        pageSize,
        ...params
      });
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取审计日志失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, pageSize]);

  const handleSearch = (values: any) => {
    const searchParams: any = {};
    if (values.userId) searchParams.userId = values.userId;
    if (values.action) searchParams.action = values.action;
    if (values.tableName) searchParams.tableName = values.tableName;
    if (values.dateRange) {
      searchParams.startDate = values.dateRange[0].format('YYYY-MM-DD');
      searchParams.endDate = values.dateRange[1].format('YYYY-MM-DD');
    }
    setPage(1);
    fetchLogs(searchParams);
  };

  const handleReset = () => {
    form.resetFields();
    setPage(1);
    fetchLogs();
  };

  const handleViewDetail = (record: AuditLog) => {
    setSelectedLog(record);
    setDetailModalVisible(true);
  };

  const formatJson = (str?: string) => {
    if (!str) return '-';
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
      return str;
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('insert')) return 'green';
    if (action.includes('update') || action.includes('edit')) return 'blue';
    if (action.includes('delete') || action.includes('remove')) return 'red';
    if (action.includes('verify') || action.includes('approve')) return 'purple';
    if (action.includes('login')) return 'cyan';
    return 'default';
  };

  const columns: ColumnsType<AuditLog> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      fixed: 'left'
    },
    {
      title: '操作人',
      dataIndex: 'realName',
      key: 'realName',
      width: 100,
      render: (text, record) => text || record.username || '-'
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 180,
      render: (action) => (
        <Tag color={getActionColor(action)}>
          {action}
        </Tag>
      )
    },
    {
      title: '表名',
      dataIndex: 'tableName',
      key: 'tableName',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: '记录ID',
      dataIndex: 'recordId',
      key: 'recordId',
      width: 100,
      render: (text) => text || '-'
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 130,
      render: (text) => text || '-'
    },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Card title="审计日志">
      <Form
        form={form}
        layout="inline"
        onFinish={handleSearch}
        style={{ marginBottom: '16px' }}
      >
        <Form.Item name="userId" label="用户">
          <Select
            placeholder="全部"
            allowClear
            showSearch
            style={{ width: 150 }}
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {/* 用户选择可以通过API动态加载，这里先留空 */}
          </Select>
        </Form.Item>
        <Form.Item name="action" label="操作">
          <Input placeholder="操作关键词" allowClear style={{ width: 150 }} />
        </Form.Item>
        <Form.Item name="tableName" label="表名">
          <Select placeholder="全部" allowClear style={{ width: 150 }}>
            <Option value="users">users</Option>
            <Option value="trade_certifications">trade_certifications</Option>
            <Option value="construction_projects">construction_projects</Option>
            <Option value="labor_contracts">labor_contracts</Option>
            <Option value="payrolls">payrolls</Option>
            <Option value="attendance_records">attendance_records</Option>
            <Option value="biometric_deletion_logs">biometric_deletion_logs</Option>
            <Option value="social_security_records">social_security_records</Option>
          </Select>
        </Form.Item>
        <Form.Item name="dateRange" label="日期范围">
          <RangePicker
            format="YYYY-MM-DD"
            style={{ width: 260 }}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              搜索
            </Button>
            <Button onClick={handleReset} icon={<ReloadOutlined />}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          scroll={{ x: 1300 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            }
          }}
        />
      </Spin>

      <Modal
        title="审计日志详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {selectedLog && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <p><Text strong>操作人：</Text>{selectedLog.realName || selectedLog.username}</p>
                <p><Text strong>用户名：</Text>{selectedLog.username}</p>
                <p><Text strong>操作类型：</Text>
                  <Tag color={getActionColor(selectedLog.action)}>
                    {selectedLog.action}
                  </Tag>
                </p>
                <p><Text strong>表名：</Text>{selectedLog.tableName || '-'}</p>
                <p><Text strong>记录ID：</Text>{selectedLog.recordId || '-'}</p>
              </Col>
              <Col span={12}>
                <p><Text strong>IP地址：</Text>{selectedLog.ipAddress || '-'}</p>
                <p><Text strong>浏览器信息：</Text>{selectedLog.userAgent || '-'}</p>
                <p><Text strong>操作时间：</Text>{new Date(selectedLog.createdAt).toLocaleString('zh-CN')}</p>
              </Col>
            </Row>
            {selectedLog.oldValues && selectedLog.oldValues !== 'null' && (
              <div style={{ marginTop: '16px' }}>
                <Text strong>变更前数据：</Text>
                <pre style={{
                  background: '#fff2e8',
                  padding: '12px',
                  borderRadius: '4px',
                  marginTop: '8px',
                  maxHeight: '150px',
                  overflow: 'auto',
                  border: '1px solid #ffd591'
                }}>
                  {formatJson(selectedLog.oldValues)}
                </pre>
              </div>
            )}
            {selectedLog.newValues && selectedLog.newValues !== 'null' && (
              <div style={{ marginTop: '16px' }}>
                <Text strong>变更后数据：</Text>
                <pre style={{
                  background: '#f6ffed',
                  padding: '12px',
                  borderRadius: '4px',
                  marginTop: '8px',
                  maxHeight: '150px',
                  overflow: 'auto',
                  border: '1px solid #b7eb8f'
                }}>
                  {formatJson(selectedLog.newValues)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default AuditLogs;
