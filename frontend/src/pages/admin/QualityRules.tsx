import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Tag, Button, Modal, Form, Input, 
  InputNumber, Select, Switch, message, Space, Popconfirm
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import api from '../../api';
import type { QualityRule } from '../../types';

const { Option } = Select;

function AdminQualityRules() {
  const [rules, setRules] = useState<QualityRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<QualityRule | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data: any = await api.get('/admin/quality-rules');
      setRules(data.rules);
    } catch (error) {
      console.error('Failed to fetch rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRule(null);
    form.resetFields();
    form.setFieldsValue({ enabled: true });
    setModalVisible(true);
  };

  const handleEdit = (rule: QualityRule) => {
    setEditingRule(rule);
    form.setFieldsValue({
      name: rule.name,
      rule_type: rule.rule_type,
      threshold: rule.threshold,
      action: rule.action,
      description: rule.description,
      enabled: rule.enabled === 1,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingRule) {
        await api.put(`/admin/quality-rules/${editingRule.id}`, {
          ...values,
          enabled: values.enabled ? 1 : 0,
        });
        message.success('规则更新成功');
      } else {
        await api.post('/admin/quality-rules', {
          ...values,
          enabled: values.enabled ? 1 : 0,
        });
        message.success('规则创建成功');
      }
      setModalVisible(false);
      fetchRules();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/quality-rules/${id}`);
      message.success('删除成功');
      fetchRules();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleToggle = async (rule: QualityRule, checked: boolean) => {
    try {
      await api.put(`/admin/quality-rules/${rule.id}`, {
        name: rule.name,
        rule_type: rule.rule_type,
        threshold: rule.threshold,
        action: rule.action,
        description: rule.description,
        enabled: checked ? 1 : 0,
      });
      fetchRules();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getRuleTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      damage_rate: '破损率',
      timeout_rate: '超时率',
      low_rating: '低评分',
      credit_score: '信用分',
      complaint_rate: '投诉率',
    };
    return typeMap[type] || type;
  };

  const getActionText = (action: string) => {
    const actionMap: Record<string, string> = {
      auto_compensation: '自动赔付',
      warning: '警告提醒',
      manual_review: '人工审核',
      suspend_service: '暂停服务',
    };
    return actionMap[action] || action;
  };

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <SettingOutlined style={{ color: '#1890ff' }} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '规则类型',
      dataIndex: 'rule_type',
      key: 'rule_type',
      render: (type: string) => <Tag color="blue">{getRuleTypeText(type)}</Tag>,
    },
    {
      title: '阈值',
      dataIndex: 'threshold',
      key: 'threshold',
      render: (val: number, record: QualityRule) => {
        if (record.rule_type === 'damage_rate' || record.rule_type === 'timeout_rate' || record.rule_type === 'complaint_rate') {
          return `${(val * 100).toFixed(0)}%`;
        }
        return val;
      },
    },
    {
      title: '触发动作',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => {
        const colorMap: Record<string, string> = {
          auto_compensation: 'red',
          warning: 'orange',
          manual_review: 'blue',
          suspend_service: 'purple',
        };
        return <Tag color={colorMap[action] || 'default'}>{getActionText(action)}</Tag>;
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: number, record: QualityRule) => (
        <Switch checked={enabled === 1} onChange={(checked) => handleToggle(record, checked)} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: QualityRule) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除此规则？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <h2 style={{ marginBottom: 16 }}>⚙️ 服务质检规则引擎</h2>

      <Card style={{ marginBottom: 16 }} size="small">
        <Space size="large">
          <div>
            <span style={{ color: '#8c8c8c' }}>规则总数:</span>
            <span style={{ marginLeft: 8, fontWeight: 500 }}>{rules.length}</span>
          </div>
          <div>
            <span style={{ color: '#8c8c8c' }}>已启用:</span>
            <span style={{ marginLeft: 8, fontWeight: 500, color: '#52c41a' }}>
              {rules.filter(r => r.enabled === 1).length}
            </span>
          </div>
          <div>
            <span style={{ color: '#8c8c8c' }}>已停用:</span>
            <span style={{ marginLeft: 8, fontWeight: 500, color: '#bfbfbf' }}>
              {rules.filter(r => r.enabled === 0).length}
            </span>
          </div>
        </Space>
      </Card>

      <Card
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增规则
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={rules}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title={editingRule ? '编辑规则' : '新增规则'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item label="规则名称" name="name" rules={[{ required: true, message: '请输入规则名称' }]}>
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          <Form.Item label="规则类型" name="rule_type" rules={[{ required: true, message: '请选择规则类型' }]}>
            <Select placeholder="请选择规则类型">
              <Option value="damage_rate">破损率</Option>
              <Option value="timeout_rate">超时率</Option>
              <Option value="low_rating">低评分</Option>
              <Option value="credit_score">信用分</Option>
              <Option value="complaint_rate">投诉率</Option>
            </Select>
          </Form.Item>
          <Form.Item label="阈值" name="threshold" rules={[{ required: true, message: '请输入阈值' }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
          </Form.Item>
          <Form.Item label="触发动作" name="action" rules={[{ required: true, message: '请选择触发动作' }]}>
            <Select placeholder="请选择触发动作">
              <Option value="auto_compensation">自动赔付</Option>
              <Option value="warning">警告提醒</Option>
              <Option value="manual_review">人工审核</Option>
              <Option value="suspend_service">暂停服务</Option>
            </Select>
          </Form.Item>
          <Form.Item label="规则描述" name="description">
            <Input.TextArea rows={3} placeholder="请输入规则描述" />
          </Form.Item>
          <Form.Item label="启用状态" name="enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button type="primary" htmlType="submit">
              {editingRule ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default AdminQualityRules;
