import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input, Card, Spin, Alert, Checkbox, Modal } from 'antd';
import { ArrowLeftOutlined, CreditCardOutlined, PlusOutlined } from '@ant-design/icons';
import { bankCardApi } from '../services/api';

const BankCardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [bankCards, setBankCards] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [form] = Form.useForm();

  useEffect(() => {
    loadBankCards();
  }, []);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const loadBankCards = async () => {
    setLoading(true);
    try {
      const result = await bankCardApi.getList();
      setBankCards(result.data || []);
    } catch (error) {
      console.error('加载银行卡列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    const reservedPhone = form.getFieldValue('reservedPhone');
    if (!reservedPhone || !/^1[3-9]\d{9}$/.test(reservedPhone)) {
      return;
    }

    setSendingCode(true);
    try {
      await bankCardApi.sendCode(reservedPhone);
      setCountdown(60);
    } catch (error) {
      console.error('发送验证码失败:', error);
    } finally {
      setSendingCode(false);
    }
  };

  const handleBind = async (values) => {
    setSubmitting(true);
    try {
      await bankCardApi.bind(values);
      Modal.success({
        title: '绑定成功',
        content: '银行卡绑定成功！',
        onOk: () => {
          setShowAddForm(false);
          form.resetFields();
          loadBankCards();
        }
      });
    } catch (error) {
      console.error('绑定银行卡失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const maskCardNumber = (cardNumber) => {
    if (!cardNumber) return '';
    return cardNumber.replace(/(\d{4})\d+(\d{4})/, '$1 **** **** $2');
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>银行卡管理</h1>
        </div>
        <div className="page-content">
          <div className="loading-container">
            <Spin size="large" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>银行卡管理</h1>
      </div>
      <div className="page-content">
        <Button
          className="back-btn"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/home')}
        >
          返回首页
        </Button>

        <Alert
          message="温馨提示"
          description="仅支持指定银行的一类卡或电子账户，银行卡必须为法定代表人本人名下。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        {bankCards.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>已绑定银行卡</h3>
            {bankCards.map((card, index) => (
              <Card
                key={card.id || index}
                bordered={false}
                style={{ marginBottom: 12, background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', color: 'white' }}
              >
                <CreditCardOutlined style={{ fontSize: 32, marginBottom: 16 }} />
                <div style={{ fontSize: 20, letterSpacing: 2, marginBottom: 8 }}>
                  {maskCardNumber(card.card_number)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, opacity: 0.9 }}>
                  <span>{card.bank_name}</span>
                  <span>{card.is_verified ? '已验证' : '未验证'}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!showAddForm ? (
          <Button
            type="dashed"
            block
            size="large"
            icon={<PlusOutlined />}
            onClick={() => setShowAddForm(true)}
          >
            添加银行卡
          </Button>
        ) : (
          <Card bordered={false} title="添加银行卡">
            <Form
              form={form}
              name="bankCard"
              onFinish={handleBind}
              autoComplete="off"
              size="large"
            >
              <Form.Item
                name="cardNumber"
                label="银行卡号"
                rules={[
                  { required: true, message: '请输入银行卡号' },
                  { pattern: /^\d{16,19}$/, message: '请输入正确的银行卡号' }
                ]}
              >
                <Input placeholder="请输入银行卡号" maxLength={19} />
              </Form.Item>

              <Form.Item
                name="bankName"
                label="开户银行"
                rules={[{ required: true, message: '请选择开户银行' }]}
              >
                <Input placeholder="请输入开户银行名称（如：工商银行）" />
              </Form.Item>

              <Form.Item
                name="branchName"
                label="开户支行"
                rules={[{ required: true, message: '请输入开户支行' }]}
              >
                <Input placeholder="请输入开户支行名称" />
              </Form.Item>

              <Form.Item
                name="reservedPhone"
                label="银行预留手机号"
                rules={[
                  { required: true, message: '请输入银行预留手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                ]}
              >
                <Input placeholder="请输入银行预留手机号" maxLength={11} />
              </Form.Item>

              <Form.Item
                name="verifyCode"
                label="验证码"
                rules={[{ required: true, message: '请输入验证码' }]}
              >
                <Input.Group compact>
                  <Form.Item
                    name="verifyCode"
                    noStyle
                  >
                    <Input
                      style={{ width: '60%' }}
                      placeholder="请输入验证码"
                      maxLength={6}
                    />
                  </Form.Item>
                  <Button
                    type="primary"
                    style={{ width: '40%' }}
                    onClick={handleSendCode}
                    disabled={countdown > 0 || sendingCode}
                    loading={sendingCode}
                  >
                    {countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
                  </Button>
                </Input.Group>
              </Form.Item>

              <Form.Item
                name="agreement"
                valuePropName="checked"
                rules={[{ required: true, message: '请同意协议' }]}
              >
                <Checkbox>我确认该银行卡为本人名下，并同意《银行卡绑定协议》</Checkbox>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={submitting}
                  disabled={submitting}
                >
                  确认绑定
                </Button>
              </Form.Item>
            </Form>

            <Button
              type="text"
              block
              onClick={() => {
                setShowAddForm(false);
                form.resetFields();
              }}
            >
              取消
            </Button>

            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#8c8c8c' }}>
              <p>测试验证码：123456</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BankCardPage;
