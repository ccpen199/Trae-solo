import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, InputNumber, Space, message, Tag, Card, Row, Col, Input } from 'antd';
import { PlusOutlined, PlayCircleOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import { segmentsApi } from '../api';

const { Option } = Select;

function Segments() {
  const [rules, setRules] = useState([]);
  const [selectedRule, setSelectedRule] = useState(null);
  const [segments, setSegments] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadRules();
  }, []);

  useEffect(() => {
    if (selectedRule) {
      loadSegments();
    }
  }, [selectedRule, pagination.current, pagination.pageSize]);

  const loadRules = async () => {
    try {
      const res = await segmentsApi.getRules();
      setRules(res.data.data);
    } catch (error) {
      message.error('加载规则失败');
    }
  };

  const loadSegments = async () => {
    try {
      const res = await segmentsApi.getSegments(selectedRule.id, {
        page: pagination.current,
        pageSize: pagination.pageSize
      });
      setSegments(res.data.data);
      setPagination(prev => ({ ...prev, total: res.data.pagination.total }));
    } catch (error) {
      message.error('加载客群失败');
    }
  };

  const handleCreateRule = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmitRule = async () => {
    try {
      const values = await form.validateFields();
      await segmentsApi.createRule(values);
      message.success('创建规则成功');
      setModalVisible(false);
      loadRules();
    } catch (error) {
      message.error('创建规则失败');
    }
  };

  const handleGenerateSegment = async (ruleId) => {
    try {
      const res = await segmentsApi.generateSegment(ruleId);
      message.success(res.data.message);
      if (selectedRule?.id === ruleId) {
        loadSegments();
      }
    } catch (error) {
      message.error('生成客群失败');
    }
  };

  const handleDeleteRule = async (id) => {
    try {
      await segmentsApi.deleteRule(id);
      message.success('删除成功');
      loadRules();
      if (selectedRule?.id === id) {
        setSelectedRule(null);
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const ruleColumns = [
    { title: '规则名称', dataIndex: 'name', key: 'name', width: 150 },
    { title: '版本', dataIndex: 'rule_version', key: 'rule_version', width: 80,
      render: (v) => <Tag color="blue">{v}</Tag> },
    { title: '卡等级', dataIndex: 'card_levels', key: 'card_levels', width: 120,
      render: (v) => v ? JSON.parse(v).join(', ') : '全部' },
    { title: '风险等级', dataIndex: 'risk_levels', key: 'risk_levels', width: 120,
      render: (v) => v ? JSON.parse(v).join(', ') : '全部' },
    { title: '最小账单', dataIndex: 'min_bill_amount', key: 'min_bill_amount', width: 120,
      render: (v) => v ? `¥${v}` : '不限制' },
    { title: '操作', key: 'action', width: 200,
      render: (_, record) => (
        <Space>
          <Button icon={<PlayCircleOutlined />} size="small" type="primary"
            onClick={() => handleGenerateSegment(record.id)}>生成客群</Button>
          <Button danger size="small" icon={<DeleteOutlined />}
            onClick={() => handleDeleteRule(record.id)}>删除</Button>
        </Space>
      )
    },
  ];

  const segmentColumns = [
    { title: '客户姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '卡号', dataIndex: 'card_no', key: 'card_no', width: 150 },
    { title: '电话', dataIndex: 'phone', key: 'phone', width: 120 },
    { title: '卡等级', dataIndex: 'card_level', key: 'card_level', width: 100 },
    { title: '账单金额', dataIndex: 'bill_amount', key: 'bill_amount', width: 120,
      render: (v) => `¥${v?.toLocaleString()}` },
    { title: '风险等级', dataIndex: 'risk_level', key: 'risk_level', width: 100 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>客群筛选</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateRule}>创建筛选规则</Button>
      </div>

      <Card title="筛选规则列表" style={{ marginBottom: 16 }}>
        <Table columns={ruleColumns} dataSource={rules} rowKey="id" pagination={false}
          onRow={(record) => ({
            onClick: () => setSelectedRule(record),
            style: { cursor: 'pointer', background: selectedRule?.id === record.id ? '#e6f7ff' : '' }
          })}
        />
      </Card>

      {selectedRule && (
        <Card title={`客群列表 - ${selectedRule.name} (${selectedRule.rule_version})`}>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col>
              <Tag icon={<UserOutlined />} color="blue">
                共 {pagination.total} 位客户
              </Tag>
            </Col>
          </Row>
          <Table columns={segmentColumns} dataSource={segments} rowKey="id"
            pagination={{ ...pagination, showSizeChanger: true, showQuickJumper: true, showTotal: total => `共 ${total} 条` }}
            onChange={(p) => setPagination(prev => ({ ...prev, current: p.current, pageSize: p.pageSize }))}
          />
        </Card>
      )}

      <Modal title="创建筛选规则" open={modalVisible} onOk={handleSubmitRule} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="规则名称" rules={[{ required: true }]}>
            <Input style={{ width: '100%' }} placeholder="请输入规则名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="card_levels" label="卡等级">
                <Select mode="multiple" placeholder="选择卡等级">
                  <Option value="普通">普通</Option>
                  <Option value="金卡">金卡</Option>
                  <Option value="白金">白金</Option>
                  <Option value="钻石">钻石</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="risk_levels" label="风险等级">
                <Select mode="multiple" placeholder="选择风险等级">
                  <Option value="低">低</Option>
                  <Option value="中">中</Option>
                  <Option value="高">高</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="min_bill_amount" label="最小账单金额">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="不限制请留空" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="min_installment_history" label="最小分期次数">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="不限制请留空" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="industries" label="消费行业">
            <Select mode="multiple" placeholder="选择行业（或的关系）">
              <Option value="餐饮">餐饮</Option>
              <Option value="酒店">酒店</Option>
              <Option value="购物">购物</Option>
              <Option value="娱乐">娱乐</Option>
              <Option value="航空">航空</Option>
              <Option value="商超">商超</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Segments;
