import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Select, Form, Card, Descriptions, Modal } from 'antd';
import { SearchOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { auditApi } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const AuditLog: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState<any>({});
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await auditApi.list({
        page: pagination.current,
        page_size: pagination.pageSize,
        ...filters,
      });
      setData(res.data.data);
      setPagination(prev => ({ ...prev, total: res.data.total }));
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values: any) => {
    setFilters(values);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleViewDetail = (record: any) => {
    setCurrentLog(record);
    setDetailModalVisible(true);
  };

  const actionTypeMap: Record<string, { color: string; text: string }> = {
    create: { color: 'green', text: '创建' },
    update: { color: 'blue', text: '更新' },
    delete: { color: 'red', text: '删除' },
    login: { color: 'purple', text: '登录' },
    logout: { color: 'default', text: '登出' },
    review: { color: 'orange', text: '审核' },
    publish: { color: 'cyan', text: '发布' },
    enforce: { color: 'magenta', text: '维权' },
    other: { color: 'default', text: '其他' },
  };

  const resourceTypeMap: Record<string, string> = {
    course: '课程',
    material: '素材',
    lecturer: '讲师',
    piracy_clue: '盗版线索',
    enforcement_case: '维权案件',
    user: '用户',
    system: '系统',
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    success: { color: 'success', text: '成功' },
    failed: { color: 'error', text: '失败' },
    pending: { color: 'processing', text: '进行中' },
  };

  const columns = [
    {
      title: '日志ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => <span style={{ fontFamily: 'monospace' }}>#{id}</span>,
    },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作人',
      dataIndex: ['user', 'username'],
      key: 'username',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '操作类型',
      dataIndex: 'action_type',
      key: 'action_type',
      width: 100,
      render: (type: string) => {
        const cfg = actionTypeMap[type] || { color: 'default', text: type };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '资源类型',
      dataIndex: 'resource_type',
      key: 'resource_type',
      width: 120,
      render: (type: string) => resourceTypeMap[type] || type,
    },
    {
      title: '资源ID',
      dataIndex: 'resource_id',
      key: 'resource_id',
      width: 100,
      render: (id: number) => id || '-',
    },
    {
      title: '操作描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 130,
      render: (ip: string) => ip || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => {
        const cfg = statusMap[status] || { color: 'default', text: status };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">操作日志</h1>
          <p className="page-description">系统所有操作行为审计记录</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={loadData}>
          刷新
        </Button>
      </div>

      <div className="filter-bar">
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="搜索">
            <Input placeholder="操作人/描述" prefix={<SearchOutlined />} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="action_type" label="操作类型">
            <Select placeholder="全部" allowClear style={{ width: 120 }}>
              {Object.entries(actionTypeMap).map(([key, value]) => (
                <Option key={key} value={key}>{value.text}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="resource_type" label="资源类型">
            <Select placeholder="全部" allowClear style={{ width: 120 }}>
              {Object.entries(resourceTypeMap).map(([key, value]) => (
                <Option key={key} value={key}>{value}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部" allowClear style={{ width: 100 }}>
              {Object.entries(statusMap).map(([key, value]) => (
                <Option key={key} value={key}>{value.text}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">查询</Button>
              <Button onClick={() => { setFilters({}); loadData(); }}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize })),
        }}
        scroll={{ x: 1300 }}
      />

      <Modal
        title="日志详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
        ]}
        width={700}
      >
        {currentLog && (
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="日志ID" span={2}>
              #{currentLog.id}
            </Descriptions.Item>
            <Descriptions.Item label="操作时间" span={2}>
              {dayjs(currentLog.created_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="操作人">
              {currentLog.user?.username || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="用户ID">
              {currentLog.user?.id || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="操作类型">
              {actionTypeMap[currentLog.action_type]?.text || currentLog.action_type}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {statusMap[currentLog.status]?.text || currentLog.status}
            </Descriptions.Item>
            <Descriptions.Item label="资源类型">
              {resourceTypeMap[currentLog.resource_type] || currentLog.resource_type}
            </Descriptions.Item>
            <Descriptions.Item label="资源ID">
              {currentLog.resource_id || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="IP地址">
              {currentLog.ip_address || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="User-Agent">
              {currentLog.user_agent || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="操作描述" span={2}>
              {currentLog.description || '-'}
            </Descriptions.Item>
            {currentLog.request_data && (
              <Descriptions.Item label="请求数据" span={2}>
                <pre style={{
                  background: '#f5f5f5',
                  padding: 12,
                  borderRadius: 4,
                  maxHeight: 200,
                  overflow: 'auto',
                  margin: 0,
                }}>
                  {typeof currentLog.request_data === 'string'
                    ? currentLog.request_data
                    : JSON.stringify(currentLog.request_data, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
            {currentLog.response_data && (
              <Descriptions.Item label="响应数据" span={2}>
                <pre style={{
                  background: '#f5f5f5',
                  padding: 12,
                  borderRadius: 4,
                  maxHeight: 200,
                  overflow: 'auto',
                  margin: 0,
                }}>
                  {typeof currentLog.response_data === 'string'
                    ? currentLog.response_data
                    : JSON.stringify(currentLog.response_data, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
            {currentLog.error_message && (
              <Descriptions.Item label="错误信息" span={2}>
                <span style={{ color: '#ff4d4f' }}>{currentLog.error_message}</span>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default AuditLog;
