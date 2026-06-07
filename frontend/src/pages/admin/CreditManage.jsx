import { useState, useEffect } from 'react';
import {
  Card, Table, Tabs, Tag, Button, Modal, Form, Input,
  Select, Space, InputNumber, message, Descriptions,
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, DollarOutlined } from '@ant-design/icons';
import { adminAPI } from '../../api';

const { TextArea } = Input;

export default function CreditManage() {
  const [activeTab, setActiveTab] = useState('rules');
  const [creditRules, setCreditRules] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [whitelist, setWhitelist] = useState([]);
  const [loading, setLoading] = useState(false);

  const [ruleModal, setRuleModal] = useState({ visible: false, editing: null });
  const [blackModal, setBlackModal] = useState(false);
  const [whiteModal, setWhiteModal] = useState(false);
  const [adjustModal, setAdjustModal] = useState(false);

  const [ruleForm] = Form.useForm();
  const [blackForm] = Form.useForm();
  const [whiteForm] = Form.useForm();
  const [adjustForm] = Form.useForm();

  const fetchCreditRules = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getCreditRules();
      const data = res.data || res;
      setCreditRules(data.rules || data.list || data.items || data || []);
    } catch {
      setCreditRules([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlacklist = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getBlacklist();
      const data = res.data || res;
      setBlacklist(data.blacklist || data.list || data.items || data || []);
    } catch {
      setBlacklist([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWhitelist = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getWhitelist();
      const data = res.data || res;
      setWhitelist(data.whitelist || data.list || data.items || data || []);
    } catch {
      setWhitelist([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'rules') fetchCreditRules();
    else if (activeTab === 'blacklist') fetchBlacklist();
    else if (activeTab === 'whitelist') fetchWhitelist();
  }, [activeTab]);

  const handleRuleSubmit = async (values) => {
    try {
      if (ruleModal.editing) {
        await adminAPI.updateCreditRule(ruleModal.editing.id, values);
        message.success('规则已更新');
      } else {
        await adminAPI.createCreditRule(values);
        message.success('规则已创建');
      }
      setRuleModal({ visible: false, editing: null });
      ruleForm.resetFields();
      fetchCreditRules();
    } catch {}
  };

  const handleBlackSubmit = async (values) => {
    try {
      await adminAPI.addBlacklist(values);
      message.success('已加入黑名单');
      setBlackModal(false);
      blackForm.resetFields();
      fetchBlacklist();
    } catch {}
  };

  const handleWhiteSubmit = async (values) => {
    try {
      await adminAPI.addWhitelist(values);
      message.success('已加入白名单');
      setWhiteModal(false);
      whiteForm.resetFields();
      fetchWhitelist();
    } catch {}
  };

  const handleAdjust = async (values) => {
    try {
      await adminAPI.adjustCredit(values);
      message.success('信用调整成功');
      setAdjustModal(false);
      adjustForm.resetFields();
    } catch {}
  };

  const handleRemoveBlack = async (id) => {
    try {
      await adminAPI.removeBlacklist(id);
      message.success('已移出黑名单');
      fetchBlacklist();
    } catch {}
  };

  const handleRemoveWhite = async (id) => {
    try {
      await adminAPI.removeWhitelist(id);
      message.success('已移出白名单');
      fetchWhitelist();
    } catch {}
  };

  const ruleColumns = [
    { title: '规则动作', dataIndex: 'action', key: 'action', width: 150 },
    { title: '说明', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '分值变化', dataIndex: 'score_change', key: 'score_change', width: 100,
      render: (v) => <Tag color={Number(v) >= 0 ? 'green' : 'red'}>{Number(v) >= 0 ? `+${v}` : v}</Tag>,
    },
    {
      title: '操作', key: 'actions', width: 100,
      render: (_, record) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => {
          setRuleModal({ visible: true, editing: record });
          ruleForm.setFieldsValue(record);
        }}>
          编辑
        </Button>
      ),
    },
  ];

  const blackColumns = [
    { title: '用户ID', dataIndex: 'user_id', key: 'user_id', width: 100 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 120 },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 130 },
    { title: '原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
    { title: '加入时间', dataIndex: 'created_at', key: 'created_at', width: 140 },
    {
      title: '操作', key: 'actions', width: 100,
      render: (_, record) => (
        <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleRemoveBlack(record.id)}>
          移除
        </Button>
      ),
    },
  ];

  const whiteColumns = [
    { title: '用户ID', dataIndex: 'user_id', key: 'user_id', width: 100 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 120 },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 130 },
    { title: '原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
    { title: '加入时间', dataIndex: 'created_at', key: 'created_at', width: 140 },
    {
      title: '操作', key: 'actions', width: 100,
      render: (_, record) => (
        <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleRemoveWhite(record.id)}>
          移除
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="信用管理"
        extra={
          <Button icon={<DollarOutlined />} onClick={() => setAdjustModal(true)}>
            手动信用调整
          </Button>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'rules',
              label: '信用规则',
              children: (
                <>
                  <div style={{ marginBottom: 16, textAlign: 'right' }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                      setRuleModal({ visible: true, editing: null });
                      ruleForm.resetFields();
                    }}>
                      新增规则
                    </Button>
                  </div>
                  <Table columns={ruleColumns} dataSource={creditRules} rowKey="id" loading={loading} pagination={false} size="middle" />
                </>
              ),
            },
            {
              key: 'blacklist',
              label: '黑名单',
              children: (
                <>
                  <div style={{ marginBottom: 16, textAlign: 'right' }}>
                    <Button danger icon={<PlusOutlined />} onClick={() => setBlackModal(true)}>
                      加入黑名单
                    </Button>
                  </div>
                  <Table columns={blackColumns} dataSource={blacklist} rowKey="id" loading={loading} pagination={false} size="middle" />
                </>
              ),
            },
            {
              key: 'whitelist',
              label: '白名单',
              children: (
                <>
                  <div style={{ marginBottom: 16, textAlign: 'right' }}>
                    <Button icon={<PlusOutlined />} onClick={() => setWhiteModal(true)}>
                      加入白名单
                    </Button>
                  </div>
                  <Table columns={whiteColumns} dataSource={whitelist} rowKey="id" loading={loading} pagination={false} size="middle" />
                </>
              ),
            },
          ]}
        />
      </Card>

      <Modal title={ruleModal.editing ? '编辑规则' : '新增规则'} open={ruleModal.visible} onCancel={() => { setRuleModal({ visible: false, editing: null }); ruleForm.resetFields(); }} onOk={() => ruleForm.submit()}>
        <Form form={ruleForm} layout="vertical" onFinish={handleRuleSubmit}>
          <Form.Item name="action" label="规则动作" rules={[{ required: true }]}>
            <Input placeholder="如：complete_order / cancel_order / timeout" />
          </Form.Item>
          <Form.Item name="description" label="规则说明" rules={[{ required: true }]}>
            <Input placeholder="如：完成订单奖励 / 超时未完成扣分" />
          </Form.Item>
          <Form.Item name="score_change" label="分值变化" rules={[{ required: true }]}>
            <InputNumber min={-100} max={100} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="加入黑名单" open={blackModal} onCancel={() => { setBlackModal(false); blackForm.resetFields(); }} onOk={() => blackForm.submit()}>
        <Form form={blackForm} layout="vertical" onFinish={handleBlackSubmit}>
          <Form.Item name="user_id" label="用户ID" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="reason" label="原因" rules={[{ required: true }]}>
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="加入白名单" open={whiteModal} onCancel={() => { setWhiteModal(false); whiteForm.resetFields(); }} onOk={() => whiteForm.submit()}>
        <Form form={whiteForm} layout="vertical" onFinish={handleWhiteSubmit}>
          <Form.Item name="user_id" label="用户ID" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="reason" label="原因" rules={[{ required: true }]}>
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="手动信用调整" open={adjustModal} onCancel={() => { setAdjustModal(false); adjustForm.resetFields(); }} onOk={() => adjustForm.submit()}>
        <Form form={adjustForm} layout="vertical" onFinish={handleAdjust}>
          <Form.Item name="user_id" label="用户ID" rules={[{ required: true }]}>
            <Input placeholder="用户ID" />
          </Form.Item>
          <Form.Item name="score_change" label="调整分值" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} placeholder="正数加，负数减" />
          </Form.Item>
          <Form.Item name="reason" label="调整原因" rules={[{ required: true }]}>
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
