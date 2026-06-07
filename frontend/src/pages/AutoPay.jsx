import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, Select, message, Space, Descriptions, Divider } from 'antd';
import { CreditCardOutlined, CheckCircleOutlined, CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { billingAPI } from '../api';
import dayjs from 'dayjs';

const { Option } = Select;

const AutoPay = () => {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadAgreements();
  }, []);

  const loadAgreements = async () => {
    setLoading(true);
    try {
      const res = await billingAPI.getAutoPayStatus();
      console.log('代扣状态API返回:', res);
      const agreements = res.agreement ? [res.agreement] : (res.agreements || res.data || []);
      setAgreements(agreements);
      if (res.agreement) {
        console.log('找到代扣协议:', res.agreement);
      }
    } catch (err) {
      console.error('加载代扣协议失败:', err);
      message.error(err.response?.data?.error || '加载代扣协议失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (values) => {
    try {
      await billingAPI.signAutoPay(values);
      message.success('代扣签约成功');
      setModalVisible(false);
      form.resetFields();
      loadAgreements();
    } catch (err) {
      message.error(err.response?.data?.error || '签约失败');
    }
  };

  const handleCancel = async () => {
    Modal.confirm({
      title: '确认取消代扣协议',
      content: '取消后将不再自动扣费，您需要手动缴纳燃气费。',
      okText: '确认取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await billingAPI.cancelAutoPay();
          message.success('已取消代扣协议');
          loadAgreements();
        } catch (err) {
          message.error('取消失败');
        }
      },
    });
  };

  const activeAgreement = agreements.find(a => a.status === 'active');

  const columns = [
    {
      title: '签约时间',
      dataIndex: 'signed_at',
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '签约银行',
      dataIndex: 'bank_name',
    },
    {
      title: '扣款限额',
      dataIndex: 'monthly_limit',
      render: (v) => `¥${v}/月`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v) => (
        <Tag color={v === 'active' ? 'success' : 'default'}>
          {v === 'active' ? '生效中' : v === 'cancelled' ? '已取消' : '已过期'}
        </Tag>
      ),
    },
    {
      title: '操作',
      dataIndex: 'id',
      render: (v, record) =>
        record.status === 'active' ? (
          <Button type="link" danger onClick={() => handleCancel()}>
            取消协议
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <Card className="stat-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <CreditCardOutlined style={{ fontSize: 48, color: activeAgreement ? '#52c41a' : '#d9d9d9' }} />
            <div>
              <h3 style={{ margin: 0, marginBottom: 8 }}>自动代扣服务</h3>
              <Space>
                {activeAgreement ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>
                    已开通自动代扣
                  </Tag>
                ) : (
                  <Tag color="default" icon={<CloseCircleOutlined />}>
                    未开通代扣
                  </Tag>
                )}
              </Space>
            </div>
          </div>
          {!activeAgreement && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              签约代扣
            </Button>
          )}
        </div>

        {activeAgreement && (
          <>
            <Divider />
            <Descriptions column={3} size="small">
              <Descriptions.Item label="支付方式">
                {activeAgreement.bank_name}
              </Descriptions.Item>
              <Descriptions.Item label="每月扣款限额">
                ¥{activeAgreement.monthly_limit}
              </Descriptions.Item>
              <Descriptions.Item label="签约时间">
                {dayjs(activeAgreement.signed_at).format('YYYY-MM-DD')}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Card>

      <Card title="代扣协议记录" bordered={false}>
        <Table
          columns={columns}
          dataSource={agreements}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="签约自动代扣"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSign}>
          <Form.Item
            name="bank_name"
            label="签约银行"
            rules={[{ required: true, message: '请选择签约银行' }]}
          >
            <Select placeholder="请选择签约银行">
              <Option value="工商银行">工商银行</Option>
              <Option value="建设银行">建设银行</Option>
              <Option value="招商银行">招商银行</Option>
              <Option value="微信支付">微信支付</Option>
              <Option value="支付宝">支付宝</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="bank_account"
            label="账户信息"
            rules={[{ required: true, message: '请输入账户信息' }]}
          >
            <Input placeholder="请输入微信号/支付宝账号/银行卡号" />
          </Form.Item>

          <Form.Item
            name="account_name"
            label="账户姓名"
            rules={[{ required: true, message: '请输入账户姓名' }]}
          >
            <Input placeholder="请输入账户姓名" />
          </Form.Item>

          <Form.Item
            name="id_card"
            label="证件号码"
            rules={[{ required: true, message: '请输入证件号码' }]}
          >
            <Input placeholder="请输入身份证号或证件号码" />
          </Form.Item>

          <Form.Item
            name="monthly_limit"
            label="每月扣款限额（元）"
            rules={[
              { required: true, message: '请输入扣款限额' },
            ]}
          >
            <Input type="number" placeholder="500" />
          </Form.Item>

          <Form.Item
            name="password"
            label="服务密码"
            rules={[{ required: true, message: '请输入服务密码确认身份' }]}
          >
            <Input.Password placeholder="请输入服务密码" />
          </Form.Item>

          <div style={{ color: '#666', fontSize: 12, marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
            <p style={{ margin: 0 }}><strong>代扣说明：</strong></p>
            <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
              <li>每月账单生成后自动从指定账户扣款</li>
              <li>扣款金额不超过设置的月度限额</li>
              <li>可随时取消代扣协议</li>
              <li>扣款成功后将发送通知</li>
            </ul>
          </div>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
              确认签约
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AutoPay;
