import React, { useEffect, useState } from 'react';
import { Table, Typography, Select, Input, Descriptions, Modal, Tag } from 'antd';
import { UnorderedListOutlined, EyeOutlined } from '@ant-design/icons';
import { getAuditLogs } from '../api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const AdminAuditLogs = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [moduleFilter, setModuleFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState(null);

  const actionColors = {
    create: 'green',
    update: 'blue',
    delete: 'red',
    login: 'purple',
    logout: 'default',
    query: 'default'
  };

  const moduleOptions = [
    { label: '用户管理', value: 'users' },
    { label: '案例管理', value: 'cases' },
    { label: '报价管理', value: 'quotations' },
    { label: '项目管理', value: 'projects' },
    { label: 'ERP协同', value: 'erp' },
    { label: '管家服务', value: 'manager' },
    { label: '后台管理', value: 'admin' }
  ];

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, moduleFilter, userFilter]);

  const loadData = async () => {
    setLoading(true);
    const res = await getAuditLogs({
      page: pagination.current,
      pageSize: pagination.pageSize,
      module: moduleFilter,
      user_id: userFilter
    });
    if (res.code === 200) {
      setData(res.data.list);
      setPagination(prev => ({ ...prev, total: res.data.total }));
    }
    setLoading(false);
  };

  const columns = [
    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 160, render: v => dayjs(v).format('YYYY-MM-DD HH:mm:ss') },
    { title: '用户', dataIndex: 'user_name', key: 'user_name', width: 100 },
    { 
      title: '操作', 
      dataIndex: 'action', 
      key: 'action', 
      width: 100,
      render: v => <Tag color={actionColors[v] || 'default'}>{v}</Tag>
    },
    { title: '模块', dataIndex: 'module', key: 'module', width: 120 },
    { title: '目标ID', dataIndex: 'target_id', key: 'target_id', width: 80 },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 120 },
    {
      title: '操作',
      key: 'action_col',
      width: 80,
      render: (_, record) => (
        <span style={{ cursor: 'pointer', color: '#1890ff' }} onClick={() => { setCurrentLog(record); setDetailVisible(true); }}>
          <EyeOutlined /> 详情
        </span>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>
          <UnorderedListOutlined style={{ marginRight: 8 }} />
          操作审计日志
        </Title>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <Select
          placeholder="模块筛选"
          allowClear
          style={{ width: 160 }}
          value={moduleFilter || undefined}
          onChange={v => setModuleFilter(v || '')}
          options={moduleOptions}
        />
        <Input
          placeholder="用户ID"
          style={{ width: 120 }}
          type="number"
          value={userFilter || undefined}
          onChange={e => setUserFilter(e.target.value || '')}
          allowClear
        />
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
          showTotal: total => `共 ${total} 条`
        }}
        onChange={(p) => setPagination(prev => ({ ...prev, current: p.current, pageSize: p.pageSize }))}
      />

      <Modal
        title="日志详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentLog && (
          <div>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="操作时间">{dayjs(currentLog.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="操作用户">{currentLog.user_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="操作类型">
                <Tag color={actionColors[currentLog.action] || 'default'}>{currentLog.action}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="所属模块">{currentLog.module || '-'}</Descriptions.Item>
              <Descriptions.Item label="目标ID">{currentLog.target_id || '-'}</Descriptions.Item>
              <Descriptions.Item label="IP地址">{currentLog.ip || '-'}</Descriptions.Item>
            </Descriptions>

            {currentLog.user_agent && (
              <div className="detail-section">
                <div className="detail-section-title">客户端信息</div>
                <Paragraph style={{ fontSize: 12, wordBreak: 'break-all' }}>{currentLog.user_agent}</Paragraph>
              </div>
            )}

            {currentLog.request_data && (
              <div className="detail-section">
                <div className="detail-section-title">请求数据</div>
                <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, maxHeight: 200, overflow: 'auto', fontSize: 12 }}>
                  {typeof currentLog.request_data === 'string' 
                    ? currentLog.request_data 
                    : JSON.stringify(currentLog.request_data, null, 2)}
                </pre>
              </div>
            )}

            {currentLog.response_data && (
              <div className="detail-section">
                <div className="detail-section-title">响应数据</div>
                <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, maxHeight: 200, overflow: 'auto', fontSize: 12 }}>
                  {typeof currentLog.response_data === 'string' 
                    ? currentLog.response_data 
                    : JSON.stringify(currentLog.response_data, null, 2)}
                </pre>
              </div>
            )}

            <div style={{ fontSize: 12, color: '#888', textAlign: 'center', marginTop: 16 }}>
              所有操作均已记录，不可篡改，可用于审计溯源
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminAuditLogs;
