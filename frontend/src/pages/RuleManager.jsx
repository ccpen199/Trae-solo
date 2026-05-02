import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { ruleApi, variableApi } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

function RuleManager() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState([]);
  const [variables, setVariables] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  const loadRules = async () => {
    setLoading(true);
    try {
      const [rulesRes, variablesRes] = await Promise.all([
        ruleApi.getAll(),
        variableApi.getAll(),
      ]);
      setRules(rulesRes.data.data || []);
      setVariables(variablesRes.data.data || []);
    } catch (error) {
      message.error('加载规则列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleCreate = async (values) => {
    try {
      const defaultLogic = {
        type: 'condition',
        variable: values.defaultVariable || 'ip_risk_level',
        operator: values.defaultOperator || '>',
        value: values.defaultValue || 5,
        trueAction: { type: 'decision', result: 'reject', score: 100 },
        falseAction: { type: 'decision', result: 'pass', score: 0 },
      };

      await ruleApi.create({
        name: values.name,
        description: values.description,
        logic_topology: defaultLogic,
      });

      message.success('规则创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      loadRules();
    } catch (error) {
      message.error('创建规则失败');
      console.error(error);
    }
  };

  const handleActivate = async (id, environment = 'development') => {
    try {
      await ruleApi.activate(id, environment);
      message.success('规则已激活');
      loadRules();
    } catch (error) {
      message.error('激活规则失败');
      console.error(error);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await ruleApi.deactivate(id);
      message.success('规则已停用');
      loadRules();
    } catch (error) {
      message.error('停用规则失败');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await ruleApi.delete(id);
      message.success('规则已删除');
      loadRules();
    } catch (error) {
      message.error('删除规则失败');
      console.error(error);
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'draft':
        return 'default';
      case 'pending':
        return 'orange';
      default:
        return 'default';
    }
  };

  const statusText = (status) => {
    switch (status) {
      case 'active':
        return '已激活';
      case 'draft':
        return '草稿';
      case 'pending':
        return '待激活';
      default:
        return status;
    }
  };

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <a onClick={() => navigate(`/rules/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={statusColor(status)}>{statusText(status)}</Tag>,
    },
    {
      title: '环境',
      dataIndex: 'environment',
      key: 'environment',
      render: (env) => (
        <Tag color={env === 'development' ? 'blue' : 'purple'}>
          {env === 'development' ? '开发/测试' : '生产'}
        </Tag>
      ),
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => navigate(`/rules/${record.id}`)}
          >
            编辑
          </Button>
          {record.status !== 'active' ? (
            <Button
              icon={<PlayCircleOutlined />}
              size="small"
              type="primary"
              onClick={() => handleActivate(record.id)}
            >
              激活
            </Button>
          ) : (
            <Button
              icon={<PauseCircleOutlined />}
              size="small"
              onClick={() => handleDeactivate(record.id)}
            >
              停用
            </Button>
          )}
          <Popconfirm
            title="确定要删除这个规则吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button icon={<DeleteOutlined />} size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
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
        <h2 style={{ margin: 0 }}>规则管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
          创建规则
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={rules}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="创建新规则"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => form.submit()}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="例如：高风险IP拦截规则" />
          </Form.Item>

          <Form.Item name="description" label="规则描述">
            <TextArea rows={3} placeholder="描述规则的用途和逻辑" />
          </Form.Item>

          <Form.Item name="defaultVariable" label="初始条件变量">
            <Select placeholder="选择一个变量">
              {variables.map((v) => (
                <Option key={v.code} value={v.code}>
                  {v.name} ({v.code})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="defaultOperator" label="操作符">
            <Select defaultValue=">">
              <Option value=">">大于</Option>
              <Option value="<">小于</Option>
              <Option value=">=">大于等于</Option>
              <Option value="<=">小于等于</Option>
              <Option value="==">等于</Option>
              <Option value="!=">不等于</Option>
            </Select>
          </Form.Item>

          <Form.Item name="defaultValue" label="阈值">
            <Input type="number" defaultValue={5} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default RuleManager;
