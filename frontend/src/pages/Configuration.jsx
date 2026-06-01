import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Typography,
  Row,
  Col,
  Tabs,
  Card,
  List
} from 'antd';
import { PlusOutlined, EditOutlined, KeyOutlined, SettingOutlined } from '@ant-design/icons';
import { config, cleaningRules } from '../api';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

function Configuration() {
  const [rules, setRules] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [cleanRules, setCleanRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ruleModalVisible, setRuleModalVisible] = useState(false);
  const [cleanRuleModalVisible, setCleanRuleModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [editingCleanRule, setEditingCleanRule] = useState(null);
  const [ruleForm] = Form.useForm();
  const [cleanRuleForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rulesRes, permRes, cleanRes] = await Promise.all([
        config.getRules({}),
        config.getPermissions(),
        cleaningRules.list({})
      ]);
      setRules(rulesRes.data);
      setPermissions(permRes.data);
      setCleanRules(cleanRes.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRuleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        effective_date: values.effective_date?.format('YYYY-MM-DD'),
        expiry_date: values.expiry_date?.format('YYYY-MM-DD')
      };
      if (editingRule) {
        await config.updateRule(editingRule.id, data);
        message.success('更新成功');
      } else {
        await config.createRule(data);
        message.success('创建成功');
      }
      setRuleModalVisible(false);
      setEditingRule(null);
      ruleForm.resetFields();
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleCleanRuleSubmit = async (values) => {
    try {
      if (editingCleanRule) {
        await cleaningRules.update(editingCleanRule.id, values);
        message.success('更新成功');
      } else {
        await cleaningRules.create(values);
        message.success('创建成功');
      }
      setCleanRuleModalVisible(false);
      setEditingCleanRule(null);
      cleanRuleForm.resetFields();
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const ruleColumns = [
    { title: '分类', dataIndex: 'category', key: 'category', render: (c) => <Tag color="blue">{c}</Tag> },
    { title: '规则名', dataIndex: 'rule_name', key: 'rule_name' },
    { title: '规则值', dataIndex: 'rule_value', key: 'rule_value' },
    { title: '责任人', dataIndex: 'owner', key: 'owner' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => s === 'active' ? <Tag color="green">启用</Tag> : <Tag color="red">停用</Tag> },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditingRule(record); ruleForm.setFieldsValue(record); setRuleModalVisible(true); }}>
          编辑
        </Button>
      )
    }
  ];

  const cleanRuleColumns = [
    { title: '规则名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'rule_type', key: 'rule_type', render: (t) => <Tag>{t}</Tag> },
    { title: '优先级', dataIndex: 'priority', key: 'priority' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => s === 'active' ? <Tag color="green">启用</Tag> : <Tag color="red">停用</Tag> },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditingCleanRule(record); cleanRuleForm.setFieldsValue(record); setCleanRuleModalVisible(true); }}>
          编辑
        </Button>
      )
    }
  ];

  return (
    <div>
      <Title level={3}>配置管理</Title>

      <Tabs
        items={[
          {
            key: 'rules',
            label: <span><SettingOutlined />分类规则</span>,
            children: (
              <Card>
                <Row justify="end" style={{ marginBottom: 16 }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRule(null); ruleForm.resetFields(); setRuleModalVisible(true); }}>
                    新增规则
                  </Button>
                </Row>
                <Table
                  columns={ruleColumns}
                  dataSource={rules}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  size="small"
                />
              </Card>
            )
          },
          {
            key: 'cleaning',
            label: <span><SettingOutlined />清洗规则</span>,
            children: (
              <Card>
                <Row justify="end" style={{ marginBottom: 16 }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingCleanRule(null); cleanRuleForm.resetFields(); setCleanRuleModalVisible(true); }}>
                    新增规则
                  </Button>
                </Row>
                <Table
                  columns={cleanRuleColumns}
                  dataSource={cleanRules}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  size="small"
                />
              </Card>
            )
          },
          {
            key: 'permissions',
            label: <span><KeyOutlined />权限配置</span>,
            children: (
              <Card>
                <List
                  dataSource={permissions}
                  loading={loading}
                  renderItem={(item) => (
                    <List.Item key={item.id}>
                      <List.Item.Meta
                        avatar={<Tag color="blue">{item.role}</Tag>}
                        title={item.user_name}
                        description={
                          <div>
                            <div>用户ID: {item.user_id}</div>
                            <div>权限: {item.permissions.join(', ')}</div>
                          </div>
                        }
                      />
                      <Tag color={item.status === 'active' ? 'green' : 'red'}>
                        {item.status === 'active' ? '启用' : '停用'}
                      </Tag>
                    </List.Item>
                  )}
                />
              </Card>
            )
          }
        ]}
      />

      <Modal
        title={editingRule ? '编辑配置规则' : '新增配置规则'}
        open={ruleModalVisible}
        onCancel={() => setRuleModalVisible(false)}
        footer={null}
      >
        <Form form={ruleForm} layout="vertical" onFinish={handleRuleSubmit}>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Select>
              <Option value="price">价格</Option>
              <Option value="permission">权限</Option>
              <Option value="status">状态</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="rule_name" label="规则名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="rule_value" label="规则值" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="owner" label="责任人">
            <Input />
          </Form.Item>
          <Form.Item name="effective_date" label="生效日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="expiry_date" label="失效日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确认</Button>
              <Button onClick={() => setRuleModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingCleanRule ? '编辑清洗规则' : '新增清洗规则'}
        open={cleanRuleModalVisible}
        onCancel={() => setCleanRuleModalVisible(false)}
        footer={null}
      >
        <Form form={cleanRuleForm} layout="vertical" onFinish={handleCleanRuleSubmit}>
          <Form.Item name="name" label="规则名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="rule_type" label="规则类型" rules={[{ required: true }]}>
            <Select>
              <Option value="null_filter">空值过滤</Option>
              <Option value="outlier_detect">异常值检测</Option>
              <Option value="format_check">格式校验</Option>
              <Option value="duplicate_remove">去重</Option>
            </Select>
          </Form.Item>
          <Form.Item name="rule_content" label="规则内容" rules={[{ required: true }]}>
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="active">
            <Select>
              <Option value="active">启用</Option>
              <Option value="inactive">停用</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确认</Button>
              <Button onClick={() => setCleanRuleModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Configuration;
