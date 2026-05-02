import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Form,
} from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { auditApi } from '../services/api';

const { Option } = Select;

function AuditPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [form] = Form.useForm();

  const loadLogs = async (params = {}) => {
    setLoading(true);
    try {
      const res = await auditApi.getLogs({ limit: 100, ...params });
      setLogs(res.data.data || []);
    } catch (error) {
      console.error('加载审计日志失败', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleSearch = (values) => {
    const params = {};
    if (values.actionType) params.actionType = values.actionType;
    if (values.entityType) params.entityType = values.entityType;
    if (values.entityId) params.entityId = values.entityId;
    loadLogs(params);
  };

  const actionTypeText = (type) => {
    switch (type) {
      case 'decision':
        return '决策执行';
      case 'review':
        return '人工审核';
      case 'create':
        return '创建';
      case 'update':
        return '更新';
      case 'delete':
        return '删除';
      case 'activate':
        return '激活';
      case 'deactivate':
        return '停用';
      default:
        return type;
    }
  };

  const entityTypeText = (type) => {
    switch (type) {
      case 'decision_log':
        return '决策记录';
      case 'manual_review':
        return '人工审核';
      case 'rule':
        return '规则';
      case 'variable':
        return '变量';
      case 'backtest_task':
        return '回测任务';
      default:
        return type;
    }
  };

  const actionTypeColor = (type) => {
    switch (type) {
      case 'decision':
        return 'blue';
      case 'review':
        return 'orange';
      case 'create':
        return 'green';
      case 'update':
        return 'cyan';
      case 'delete':
        return 'red';
      case 'activate':
        return 'green';
      case 'deactivate':
        return 'red';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: '操作类型',
      dataIndex: 'action_type',
      key: 'action_type',
      render: (type) => (
        <Tag color={actionTypeColor(type)}>{actionTypeText(type)}</Tag>
      ),
      width: 120,
    },
    {
      title: '实体类型',
      dataIndex: 'entity_type',
      key: 'entity_type',
      render: (type) => <Tag color="blue">{entityTypeText(type)}</Tag>,
      width: 120,
    },
    {
      title: '实体ID',
      dataIndex: 'entity_id',
      key: 'entity_id',
      ellipsis: true,
      width: 200,
    },
    {
      title: '操作者',
      dataIndex: 'operator',
      key: 'operator',
      width: 120,
    },
    {
      title: '变更前值',
      dataIndex: 'old_value',
      key: 'old_value',
      render: (value) => {
        if (!value) return '-';
        try {
          return (
            <pre style={{ margin: 0, fontSize: 11, maxWidth: 300, overflow: 'auto' }}>
              {JSON.stringify(value, null, 2)}
            </pre>
          );
        } catch (e) {
          return String(value);
        }
      },
      width: 250,
    },
    {
      title: '变更后值',
      dataIndex: 'new_value',
      key: 'new_value',
      render: (value) => {
        if (!value) return '-';
        try {
          return (
            <pre style={{ margin: 0, fontSize: 11, maxWidth: 300, overflow: 'auto' }}>
              {JSON.stringify(value, null, 2)}
            </pre>
          );
        } catch (e) {
          return String(value);
        }
      },
      width: 250,
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2 style={{ margin: 0 }}>审计日志</h2>
        <Button icon={<ReloadOutlined />} onClick={() => loadLogs()} loading={loading}>
          刷新
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
          initialValues={{}}
        >
          <Form.Item name="actionType" label="操作类型">
            <Select placeholder="全部" style={{ width: 150 }} allowClear>
              <Option value="decision">决策执行</Option>
              <Option value="review">人工审核</Option>
              <Option value="create">创建</Option>
              <Option value="update">更新</Option>
              <Option value="delete">删除</Option>
              <Option value="activate">激活</Option>
              <Option value="deactivate">停用</Option>
            </Select>
          </Form.Item>

          <Form.Item name="entityType" label="实体类型">
            <Select placeholder="全部" style={{ width: 150 }} allowClear>
              <Option value="decision_log">决策记录</Option>
              <Option value="manual_review">人工审核</Option>
              <Option value="rule">规则</Option>
              <Option value="variable">变量</Option>
              <Option value="backtest_task">回测任务</Option>
            </Select>
          </Form.Item>

          <Form.Item name="entityId" label="实体ID">
            <Input placeholder="输入实体ID" style={{ width: 200 }} allowClear />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} htmlType="submit">
                搜索
              </Button>
              <Button
                onClick={() => {
                  form.resetFields();
                  loadLogs();
                }}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
}

export default AuditPage;
