import { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Button, Modal, Form, Input, Select,
  Switch, Space, message, Tabs,
} from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { adminAPI } from '../../api';

const { TextArea } = Input;

const typeMap = {
  pickup_delivery: { text: '帮取送', color: 'blue' },
  purchase: { text: '帮买', color: 'green' },
  allpurpose: { text: '全能帮', color: 'purple' },
  queue: { text: '帮排队', color: 'orange' },
};

export default function QualityRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form] = Form.useForm();
  const [activeType, setActiveType] = useState('all');

  const fetchRules = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeType !== 'all') params.type = activeType;
      const res = await adminAPI.getQualityRules(params);
      const data = res.data || res;
      const rows = data.rules || data.list || data.items || [];
      setRules(rows.map((item) => ({
        ...item,
        name: item.name || item.rule_name,
        type: item.type || item.order_type,
        check_item: item.check_item || item.rule_key,
        requirement: item.requirement || item.description,
        required: Boolean(item.required),
      })));
    } catch {
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [activeType]);

  const handleAdd = () => {
    setEditingRule(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRule(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        order_type: values.type,
        rule_name: values.name,
        rule_key: values.check_item,
        required: values.required,
        description: values.requirement,
      };
      if (editingRule) {
        await adminAPI.updateQualityRule(editingRule.id, payload);
        message.success('规则已更新');
      } else {
        await adminAPI.createQualityRule(payload);
        message.success('规则已创建');
      }
      setModalVisible(false);
      form.resetFields();
      fetchRules();
    } catch {}
  };

  const columns = [
    {
      title: '规则名称', dataIndex: 'name', key: 'name', width: 160,
    },
    {
      title: '适用类型', dataIndex: 'type', key: 'type', width: 100,
      render: (v) => <Tag color={typeMap[v]?.color}>{typeMap[v]?.text || v}</Tag>,
    },
    {
      title: '检查项', dataIndex: 'check_item', key: 'check_item', ellipsis: true,
    },
    {
      title: '要求', dataIndex: 'requirement', key: 'requirement', ellipsis: true,
    },
    {
      title: '必填', dataIndex: 'required', key: 'required', width: 80,
      render: (v, record) => <Switch checked={v} size="small" onChange={async (checked) => {
        try {
          await adminAPI.updateQualityRule(record.id, { required: checked });
          message.success('已更新');
          fetchRules();
        } catch {}
      }} />,
    },
    {
      title: '操作', key: 'actions', width: 100,
      render: (_, record) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="质检规则"
        extra={
          <Space>
            <Select
              value={activeType}
              onChange={setActiveType}
              style={{ width: 130 }}
              options={[
                { value: 'all', label: '全部类型' },
                ...Object.entries(typeMap).map(([k, v]) => ({ value: k, label: v.text })),
              ]}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增规则
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={rules}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </Card>

      <Modal
        title={editingRule ? '编辑规则' : '新增规则'}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}>
            <Input placeholder="如：取件拍照凭证" />
          </Form.Item>
          <Form.Item name="type" label="适用类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select
              placeholder="选择订单类型"
              options={Object.entries(typeMap).map(([k, v]) => ({ value: k, label: v.text }))}
            />
          </Form.Item>
          <Form.Item name="check_item" label="检查项" rules={[{ required: true, message: '请输入检查项' }]}>
            <Input placeholder="如：取件照片" />
          </Form.Item>
          <Form.Item name="requirement" label="具体要求">
            <TextArea rows={2} placeholder="描述具体要求" />
          </Form.Item>
          <Form.Item name="required" label="是否必填" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
