import React, { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col, Button, Modal, Form, InputNumber, Switch, Tag, message, Descriptions } from 'antd';
import {
  DollarOutlined,
  WarningOutlined,
  WalletOutlined,
  ArrowUpOutlined,
  SettingOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { financeApi } from '../../services/api';

const FinanceBalance: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [balanceData, setBalanceData] = useState<any>(null);
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [rechargeForm] = Form.useForm();
  const [settingsForm] = Form.useForm();

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const result = await financeApi.getBalance();
      setBalanceData(result.data);

      if (result.data.autoRechargeEnabled !== undefined) {
        settingsForm.setFieldsValue({
          autoRechargeEnabled: result.data.autoRechargeEnabled,
          autoRechargeAmount: result.data.autoRechargeAmount,
          autoRechargeTriggerAmount: result.data.autoRechargeTriggerAmount,
        });
      }
    } catch (error) {
      console.error('获取余额信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handleRecharge = async (values: any) => {
    try {
      const result = await financeApi.recharge({
        amount: values.amount,
        paymentMethod: 'manual',
      });

      await financeApi.confirmRecharge({
        rechargeCode: result.data.rechargeCode,
        paymentTransactionId: `TEST_${Date.now()}`,
      });

      message.success('充值成功');
      setRechargeModalVisible(false);
      rechargeForm.resetFields();
      fetchBalance();
    } catch (error) {
      console.error('充值失败:', error);
    }
  };

  const handleSaveSettings = async (values: any) => {
    try {
      await financeApi.updateAutoRecharge({
        enabled: values.autoRechargeEnabled,
        amount: values.autoRechargeAmount,
        triggerAmount: values.autoRechargeTriggerAmount,
      });
      message.success('设置保存成功');
      setSettingsModalVisible(false);
      fetchBalance();
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  };

  return (
    <div>
      <Card
        title="账户余额"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchBalance}>
            刷新
          </Button>
        }
        loading={loading}
      >
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card>
              <Statistic
                title="可用余额"
                value={balanceData?.balance || 0}
                precision={2}
                prefix={<WalletOutlined />}
                suffix="元"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="冻结金额"
                value={balanceData?.freezeBalance || 0}
                precision={2}
                prefix={<WarningOutlined />}
                suffix="元"
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="累计消费"
                value={balanceData?.totalUsed || 0}
                precision={2}
                prefix={<ArrowUpOutlined />}
                suffix="元"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="本月消费"
                value={balanceData?.monthlyConsumption || 0}
                precision={2}
                prefix={<ArrowUpOutlined />}
                suffix="元"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {balanceData?.pendingWarnings?.length > 0 && (
          <Card title="余额预警" style={{ marginTop: 24 }} type="inner">
            {balanceData.pendingWarnings.map((w: any, index: number) => (
              <div key={index} style={{ padding: 8, background: '#fff2f0', borderRadius: 4, marginBottom: 8 }}>
                <WarningOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                当前余额 {w.currentBalance} 元，低于预警阈值 {w.warningThreshold} 元
              </div>
            ))}
          </Card>
        )}

        <Card title="账户设置" style={{ marginTop: 24 }} type="inner">
          <Descriptions column={2}>
            <Descriptions.Item label="余额预警阈值">
              {balanceData?.balanceWarningThreshold || 100} 元
            </Descriptions.Item>
            <Descriptions.Item label="自动充值">
              {balanceData?.autoRechargeEnabled ? (
                <Tag color="success">已开启</Tag>
              ) : (
                <Tag color="default">未开启</Tag>
              )}
            </Descriptions.Item>
            {balanceData?.autoRechargeEnabled && (
              <>
                <Descriptions.Item label="触发金额">
                  当余额低于 {balanceData.autoRechargeTriggerAmount} 元时
                </Descriptions.Item>
                <Descriptions.Item label="自动充值金额">
                  {balanceData.autoRechargeAmount} 元
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        </Card>

        <div style={{ marginTop: 24 }}>
          <Button
            type="primary"
            size="large"
            icon={<DollarOutlined />}
            onClick={() => setRechargeModalVisible(true)}
          >
            立即充值
          </Button>
          <Button
            size="large"
            icon={<SettingOutlined />}
            style={{ marginLeft: 16 }}
            onClick={() => setSettingsModalVisible(true)}
          >
            自动充值设置
          </Button>
        </div>
      </Card>

      <Modal
        title="账户充值"
        open={rechargeModalVisible}
        onCancel={() => setRechargeModalVisible(false)}
        footer={null}
      >
        <Form form={rechargeForm} layout="vertical" onFinish={handleRecharge}>
          <Form.Item
            name="amount"
            label="充值金额"
            rules={[{ required: true, message: '请输入充值金额' }]}
          >
            <InputNumber
              min={1}
              max={100000}
              precision={2}
              addonAfter="元"
              style={{ width: '100%' }}
              placeholder="请输入充值金额"
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认充值
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="自动充值设置"
        open={settingsModalVisible}
        onCancel={() => setSettingsModalVisible(false)}
        footer={null}
      >
        <Form form={settingsForm} layout="vertical" onFinish={handleSaveSettings}>
          <Form.Item
            name="autoRechargeEnabled"
            label="开启自动充值"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="autoRechargeTriggerAmount"
            label="触发金额"
            help="当余额低于此金额时触发自动充值"
            dependencies={['autoRechargeEnabled']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (getFieldValue('autoRechargeEnabled') && !value) {
                    return Promise.reject('请输入触发金额');
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <InputNumber
              min={1}
              max={10000}
              precision={2}
              addonAfter="元"
              style={{ width: '100%' }}
              placeholder="请输入触发金额"
            />
          </Form.Item>
          <Form.Item
            name="autoRechargeAmount"
            label="自动充值金额"
            dependencies={['autoRechargeEnabled']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (getFieldValue('autoRechargeEnabled') && !value) {
                    return Promise.reject('请输入自动充值金额');
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <InputNumber
              min={1}
              max={100000}
              precision={2}
              addonAfter="元"
              style={{ width: '100%' }}
              placeholder="请输入自动充值金额"
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FinanceBalance;
