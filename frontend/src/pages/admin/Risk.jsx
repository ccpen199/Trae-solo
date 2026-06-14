import React, { useState, useEffect } from 'react';
import { Table, Card, Tabs, Button, Space, Tag, Modal, Descriptions, Input, InputNumber, Form, message, Spin, Popconfirm, Row, Col } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, SettingOutlined } from '@ant-design/icons';
import { getBlockedTransactions, resolveBlockedTransaction } from '../../api/admin';

const { TabPane } = Tabs;

const Risk = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [detailModal, setDetailModal] = useState(false);
  const [ruleModal, setRuleModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [rules, setRules] = useState([
    { id: 1, name: '单日交易次数限制', value: 50, unit: '次', enabled: true },
    { id: 2, name: '单笔交易金额上限', value: 1000, unit: '元', enabled: true },
    { id: 3, name: '单日累计金额上限', value: 5000, unit: '元', enabled: true },
    { id: 4, name: '短时间内重复交易', value: 3, unit: '分钟', enabled: true },
    { id: 5, name: '异常时间交易检测', value: '23:00-05:00', unit: '', enabled: false },
    { id: 6, name: '跨区域交易检测', enabled: true }
  ]);
  const [ruleForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getBlockedTransactions({
        page: pagination.current,
        page_size: pagination.pageSize
      });
      setData(res?.list || []);
      setPagination(prev => ({ ...prev, total: res?.total || 0 }));
    } catch (err) {
      console.error(err);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (record) => {
    setSelectedTransaction(record);
    setDetailModal(true);
  };

  const handleResolve = async (id, action) => {
    try {
      await resolveBlockedTransaction(id, { action, remark: '' });
      message.success(action === 'approve' ? '已放行交易' : '已拦截交易');
      loadData();
    } catch (err) {
      console.error(err);
      message.error('操作失败');
    }
  };

  const handleEditRule = (rule) => {
    ruleForm.setFieldsValue(rule);
    setRuleModal(true);
  };

  const handleSaveRule = async (values) => {
    try {
      setRules(prev => prev.map(rule => 
        rule.id === values.id ? { ...rule, ...values } : rule
      ));
      message.success('规则已更新');
      setRuleModal(false);
      ruleForm.resetFields();
    } catch (err) {
      console.error(err);
      message.error('保存失败');
    }
  };

  const toggleRule = (id, enabled) => {
    setRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, enabled } : rule
    ));
    message.success(enabled ? '规则已启用' : '规则已禁用');
  };

  const getRiskTag = (level) => {
    const levelMap = {
      high: { color: 'red', text: '高风险' },
      medium: { color: 'orange', text: '中风险' },
      low: { color: 'gold', text: '低风险' }
    };
    const config = levelMap[level] || { color: 'default', text: level };
    return <Tag color={config.color} icon={<WarningOutlined />}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '交易单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 200
    },
    {
      title: '用户',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 120
    },
    {
      title: '卡号',
      dataIndex: 'card_number',
      key: 'card_number',
      width: 180
    },
    {
      title: '金额（元）',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount) => `¥ ${amount?.toFixed(2) || '0.00'}`
    },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      width: 110,
      render: (level) => getRiskTag(level)
    },
    {
      title: '触发规则',
      dataIndex: 'rule_name',
      key: 'rule_name',
      width: 200
    },
    {
      title: '拦截时间',
      dataIndex: 'blocked_at',
      key: 'blocked_at',
      width: 160
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Popconfirm
            title="确定要放行吗？"
            onConfirm={() => handleResolve(record.id, 'approve')}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" icon={<CheckCircleOutlined />} style={{ color: '#52c41a' }}>放行</Button>
          </Popconfirm>
          <Popconfirm
            title="确定要拦截吗？"
            onConfirm={() => handleResolve(record.id, 'reject')}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<CloseCircleOutlined />}>拦截</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const ruleColumns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '阈值',
      dataIndex: 'value',
      key: 'value',
      render: (value, record) => `${value}${record.unit}`
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled) => (
        <Tag color={enabled ? 'green' : 'default'}>
          {enabled ? '已启用' : '已禁用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<SettingOutlined />}
            onClick={() => handleEditRule(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            onClick={() => toggleRule(record.id, !record.enabled)}
          >
            {record.enabled ? '禁用' : '启用'}
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="admin-risk">
      <Card bordered={false}>
        <Tabs defaultActiveKey="transactions">
          <TabPane tab="异常交易" key="transactions">
            <Spin spinning={loading}>
              <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                pagination={{
                  ...pagination,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条记录`,
                  onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))
                }}
                scroll={{ x: 1300 }}
              />
            </Spin>
          </TabPane>
          <TabPane tab="熔断规则" key="rules">
            <Table
              columns={ruleColumns}
              dataSource={rules}
              rowKey="id"
              pagination={false}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="交易详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={
          selectedTransaction && (
            <Space>
              <Popconfirm
                title="确定要放行吗？"
                onConfirm={() => { handleResolve(selectedTransaction.id, 'approve'); setDetailModal(false); }}
                okText="确定"
                cancelText="取消"
              >
                <Button type="primary" icon={<CheckCircleOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a' }}>放行交易</Button>
              </Popconfirm>
              <Popconfirm
                title="确定要拦截吗？"
                onConfirm={() => { handleResolve(selectedTransaction.id, 'reject'); setDetailModal(false); }}
                okText="确定"
                cancelText="取消"
              >
                <Button danger icon={<CloseCircleOutlined />}>拦截交易</Button>
              </Popconfirm>
              <Button onClick={() => setDetailModal(false)}>关闭</Button>
            </Space>
          )
        }
        width={700}
      >
        {selectedTransaction && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="交易单号">{selectedTransaction.order_no}</Descriptions.Item>
            <Descriptions.Item label="风险等级">{getRiskTag(selectedTransaction.risk_level)}</Descriptions.Item>
            <Descriptions.Item label="用户">{selectedTransaction.user_name}</Descriptions.Item>
            <Descriptions.Item label="手机号">{selectedTransaction.user_phone}</Descriptions.Item>
            <Descriptions.Item label="卡号">{selectedTransaction.card_number}</Descriptions.Item>
            <Descriptions.Item label="交易金额">¥ {selectedTransaction.amount?.toFixed(2) || '0.00'}</Descriptions.Item>
            <Descriptions.Item label="触发规则">{selectedTransaction.rule_name}</Descriptions.Item>
            <Descriptions.Item label="风险描述">{selectedTransaction.risk_description}</Descriptions.Item>
            <Descriptions.Item label="交易时间">{selectedTransaction.created_at}</Descriptions.Item>
            <Descriptions.Item label="拦截时间">{selectedTransaction.blocked_at}</Descriptions.Item>
            <Descriptions.Item label="设备信息">{selectedTransaction.device_info || '-'}</Descriptions.Item>
            <Descriptions.Item label="IP地址">{selectedTransaction.ip_address || '-'}</Descriptions.Item>
            <Descriptions.Item label="位置信息" span={2}>
              {selectedTransaction.location || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="风险分析" span={2}>
              {selectedTransaction.risk_analysis || '系统检测到该交易符合风险规则，已自动拦截。请核实后决定放行或拦截。'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        title="编辑规则"
        open={ruleModal}
        onCancel={() => { setRuleModal(false); ruleForm.resetFields(); }}
        footer={null}
        width={500}
      >
        <Form form={ruleForm} layout="vertical" onFinish={handleSaveRule}>
          <Form.Item name="id" hidden>
            <InputNumber />
          </Form.Item>
          <Form.Item name="name" label="规则名称">
            <Input disabled />
          </Form.Item>
          <Form.Item name="value" label="阈值" rules={[{ required: true, message: '请输入阈值' }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="unit" label="单位">
            <Input disabled />
          </Form.Item>
          <Row justify="end">
            <Space>
              <Button onClick={() => { setRuleModal(false); ruleForm.resetFields(); }}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Risk;
