import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Tag, Switch, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { canCreate, canUpdate, canDelete, canApprove, getCurrentRole } from '../utils/permissions';
import dayjs from 'dayjs';

function Strategies() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [environments, setEnvironments] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  useEffect(() => {
    setUserRole(getCurrentRole());
    loadData();
    loadEnvironments();
  }, [pagination.current, pagination.pageSize]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/strategies', {
        params: { page: pagination.current, pageSize: pagination.pageSize }
      });
      setData(response.data.list);
      setPagination(p => ({ ...p, total: response.data.total }));
    } finally {
      setLoading(false);
    }
  };

  const loadEnvironments = async () => {
    try {
      const response = await api.get('/environments', { params: { pageSize: 100 } });
      setEnvironments(response.data.list);
    } catch (e) {}
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除策略「${record.strategy_name}」吗？`,
      onOk: async () => {
        try {
          await api.delete(`/strategies/${record.id}`);
          message.success('删除成功');
          loadData();
        } catch (error) {
          message.error(error.response?.data?.error || '删除失败');
        }
      }
    });
  };

  const handleApprove = async (record) => {
    try {
      await api.post(`/strategies/${record.id}/approve`);
      message.success('审批成功');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '审批失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingItem) {
        await api.put(`/strategies/${editingItem.id}`, values);
        message.success('更新成功');
      } else {
        await api.post('/strategies', values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const columns = [
    { title: '策略名称', dataIndex: 'strategy_name', key: 'strategy_name' },
    { title: '应用', dataIndex: 'app_name', key: 'app_name', width: 100 },
    { title: '环境', dataIndex: 'env_name', key: 'env_name', width: 100 },
    { title: '备份类型', dataIndex: 'strategy_type', key: 'strategy_type', width: 100,
      render: (v) => ({ full: '全量', incremental: '增量', differential: '差异', log: '日志' }[v])
    },
    { title: '调度类型', dataIndex: 'schedule_type', key: 'schedule_type', width: 100,
      render: (v) => ({ manual: '手动', daily: '每天', weekly: '每周', monthly: '每月', cron: 'Cron' }[v])
    },
    { title: '保留天数', dataIndex: 'retention_days', key: 'retention_days', width: 100 },
    { title: '规则版本', dataIndex: 'rule_version', key: 'rule_version', width: 100 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (v) => (
        <Tag color={v === 'active' ? 'green' : v === 'draft' ? 'orange' : 'red'}>
          {v === 'active' ? '已激活' : v === 'draft' ? '草稿' : '已停用'}
        </Tag>
      )
    },
    { title: '创建人', dataIndex: 'creator_name', key: 'creator_name', width: 100 },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          {record.status === 'draft' && canApprove(userRole, 'strategy') && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleApprove(record)}>
              审批激活
            </Button>
          )}
          {canUpdate(userRole, 'strategy') && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              编辑
            </Button>
          )}
          {canDelete(userRole, 'strategy') && (
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
              删除
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="table-toolbar">
        <h1 className="page-title">备份策略</h1>
        {canCreate(userRole, 'strategy') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建策略
          </Button>
        )}
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
          onChange: (page, pageSize) => setPagination(p => ({ ...p, current: page, pageSize }))
        }}
      />

      <Modal
        title={editingItem ? '编辑策略' : '新建策略'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="env_id" label="所属环境" rules={[{ required: true }]}>
            <Select placeholder="请选择环境">
              {environments.map(e => (
                <Select.Option key={e.id} value={e.id}>{e.app_name} - {e.env_name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="strategy_name" label="策略名称" rules={[{ required: true }]}>
            <Input placeholder="例如：每日全量备份" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="strategy_type" label="备份类型" rules={[{ required: true }]} style={{ flex: 1, marginBottom: 0 }}>
              <Select>
                <Select.Option value="full">全量备份</Select.Option>
                <Select.Option value="incremental">增量备份</Select.Option>
                <Select.Option value="differential">差异备份</Select.Option>
                <Select.Option value="log">日志备份</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="schedule_type" label="调度类型" rules={[{ required: true }]} style={{ flex: 1, marginBottom: 0 }}>
              <Select>
                <Select.Option value="manual">手动执行</Select.Option>
                <Select.Option value="daily">每天</Select.Option>
                <Select.Option value="weekly">每周</Select.Option>
                <Select.Option value="monthly">每月</Select.Option>
              </Select>
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <Form.Item name="retention_days" label="保留天数" rules={[{ required: true }]} style={{ flex: 1, marginBottom: 0 }}>
              <InputNumber min={1} style={{ width: '100%' }} defaultValue={30} />
            </Form.Item>
            <Form.Item name="storage_path" label="存储路径" rules={[{ required: true }]} style={{ flex: 2, marginBottom: 0 }}>
              <Input placeholder="/backup/..." />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
            <Form.Item name="compression_enabled" label="启用压缩" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch defaultChecked />
            </Form.Item>
            <Form.Item name="encryption_enabled" label="启用加密" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch defaultChecked />
            </Form.Item>
          </div>
          {editingItem && (
            <Form.Item name="status" label="状态" style={{ marginTop: 24 }}>
              <Select>
                <Select.Option value="draft">草稿</Select.Option>
                <Select.Option value="active">激活</Select.Option>
                <Select.Option value="inactive">停用</Select.Option>
              </Select>
            </Form.Item>
          )}
          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" block>
              {editingItem ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Strategies;
