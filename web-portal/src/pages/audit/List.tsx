import React, { useEffect, useState } from 'react';
import { Table, Card, Tag, Space, Button, Select, Input, DatePicker, Modal, Descriptions, Typography } from 'antd';
import { ReloadOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { auditApi } from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const AuditLogList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    module: undefined as string | undefined,
    action: undefined as string | undefined,
    userId: undefined as string | undefined,
  });
  const [detailModal, setDetailModal] = useState<{ visible: boolean; data: any }>({
    visible: false,
    data: null,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await auditApi.getList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      });
      setData(result.data.list);
      setPagination((prev) => ({
        ...prev,
        total: result.data.total,
      }));
    } catch (error) {
      console.error('获取审计日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, filters]);

  const formatJson = (jsonStr: string) => {
    try {
      return JSON.stringify(JSON.parse(jsonStr), null, 2);
    } catch {
      return jsonStr;
    }
  };

  const columns = [
    {
      title: '日志编号',
      dataIndex: 'auditCode',
      key: 'auditCode',
    },
    {
      title: '操作用户',
      dataIndex: 'realName',
      key: 'realName',
      render: (name: string, record: any) => (
        <div>
          <div>{name || record.username}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.username}
          </Text>
        </div>
      ),
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      render: (module: string) => <Tag color="blue">{module}</Tag>,
    },
    {
      title: '动作',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => {
        const colorMap: { [key: string]: string } = {
          create: 'success',
          update: 'processing',
          delete: 'error',
          view: 'default',
          activate: 'success',
          deactivate: 'warning',
          login: 'blue',
          logout: 'default',
        };
        return <Tag color={colorMap[action] || 'default'}>{action}</Tag>;
      },
    },
    {
      title: '目标类型',
      dataIndex: 'targetType',
      key: 'targetType',
      render: (type: string) => type || '-',
    },
    {
      title: '目标ID',
      dataIndex: 'targetId',
      key: 'targetId',
      render: (id: number) => id || '-',
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
    },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setDetailModal({ visible: true, data: record })}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="审计日志"
        extra={
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchData}
          >
            刷新
          </Button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Select
              style={{ width: 150 }}
              placeholder="模块"
              allowClear
              onChange={(v) => setFilters((prev) => ({ ...prev, module: v }))}
            >
              <Select.Option value="template">模板管理</Select.Option>
              <Select.Option value="sms">短信管理</Select.Option>
              <Select.Option value="provider">通道管理</Select.Option>
              <Select.Option value="rule">规则配置</Select.Option>
              <Select.Option value="finance">财务管理</Select.Option>
              <Select.Option value="auth">认证</Select.Option>
            </Select>
            <Select
              style={{ width: 150 }}
              placeholder="动作"
              allowClear
              onChange={(v) => setFilters((prev) => ({ ...prev, action: v }))}
            >
              <Select.Option value="create">创建</Select.Option>
              <Select.Option value="update">更新</Select.Option>
              <Select.Option value="delete">删除</Select.Option>
              <Select.Option value="view">查看</Select.Option>
              <Select.Option value="activate">激活</Select.Option>
              <Select.Option value="deactivate">禁用</Select.Option>
            </Select>
            <Input.Search
              placeholder="搜索用户ID"
              style={{ width: 150 }}
              onSearch={(v) => setFilters((prev) => ({ ...prev, userId: v }))}
              allowClear
            />
            <Button type="primary" onClick={fetchData}>
              搜索
            </Button>
            <Button onClick={() => setFilters({ module: undefined, action: undefined, userId: undefined })}>
              重置
            </Button>
          </Space>
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
            onChange: (page, pageSize) => {
              setPagination((prev) => ({ ...prev, current: page, pageSize }));
            },
          }}
        />
      </Card>

      <Modal
        title="审计日志详情"
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, data: null })}
        footer={null}
        width={700}
      >
        {detailModal.data && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="日志编号">{detailModal.data.auditCode}</Descriptions.Item>
              <Descriptions.Item label="操作时间">
                {dayjs(detailModal.data.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="操作用户">
                {detailModal.data.realName || detailModal.data.username} ({detailModal.data.username})
              </Descriptions.Item>
              <Descriptions.Item label="IP地址">
                {detailModal.data.ipAddress || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="模块">
                <Tag color="blue">{detailModal.data.module}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="动作">
                <Tag>{detailModal.data.action}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="目标类型">
                {detailModal.data.targetType || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="目标ID">
                {detailModal.data.targetId || '-'}
              </Descriptions.Item>
            </Descriptions>

            {detailModal.data.oldValue && (
              <Card title="修改前的值" size="small" style={{ marginTop: 16 }} type="inner">
                <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, margin: 0, overflow: 'auto' }}>
                  {formatJson(detailModal.data.oldValue)}
                </pre>
              </Card>
            )}

            {detailModal.data.newValue && (
              <Card title="修改后的值" size="small" style={{ marginTop: 16 }} type="inner">
                <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, margin: 0, overflow: 'auto' }}>
                  {formatJson(detailModal.data.newValue)}
                </pre>
              </Card>
            )}

            {detailModal.data.userAgent && (
              <Card title="User-Agent" size="small" style={{ marginTop: 16 }} type="inner">
                <Text type="secondary">{detailModal.data.userAgent}</Text>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogList;
