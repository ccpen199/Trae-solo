import React, { useEffect, useState } from 'react';
import { Card, Button, Tag, Modal, Form, Input, Select, message, Popconfirm, Spin } from 'antd';
import { PlusOutlined, HomeOutlined, UserOutlined, PhoneOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { userApi } from '@/services/user';
import { formatMoney, serviceTypeMap, maskPhone } from '@/utils/format';
import StatusTag from '@/components/StatusTag';
import type { Household } from '@/types';

const { Option } = Select;

const HouseholdPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Household[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [codeBtnLoading, setCodeBtnLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await userApi.getHouseholdList();
      setList(res || []);
    } catch (error) {
      console.error('加载户号列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await userApi.setDefaultHousehold(id);
      message.success('设置成功');
      loadData();
    } catch (error) {
      console.error('设置默认户号失败', error);
    }
  };

  const handleUnbind = async (id: number) => {
    try {
      await userApi.unbindHousehold(id);
      message.success('解绑成功');
      loadData();
    } catch (error) {
      console.error('解绑户号失败', error);
    }
  };

  const handleSendCode = async () => {
    try {
      const phone = form.getFieldValue('phone') || '13800138000';
      if (!/^1[3-9]\d{9}$/.test(phone)) {
        message.error('请输入正确的手机号');
        return;
      }
      setCodeBtnLoading(true);
      await userApi.sendSmsCode(phone, 'bind');
      message.success('验证码已发送');
      setCountdown(60);
    } catch (error) {
      console.error('发送验证码失败', error);
    } finally {
      setCodeBtnLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await userApi.bindHousehold({
        householdNo: values.householdNo,
        householdName: values.householdName,
        serviceType: values.serviceType,
        captcha: values.captcha,
      });
      message.success('绑定成功');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      console.error('绑定户号失败', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card
        className="shadow-md"
        title={
          <div className="flex items-center gap-2">
            <HomeOutlined className="text-primary-500" />
            <span className="font-medium">户号管理</span>
          </div>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            绑定新户号
          </Button>
        }
      >
        <Spin spinning={loading}>
          {list.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {list.map((item) => (
                <Card
                  key={item.id}
                  className={`shadow-md card-hover relative ${
                    item.isDefault === 1 ? 'ring-2 ring-primary-500' : ''
                  }`}
                >
                  {item.isDefault === 1 && (
                    <div className="absolute top-0 right-0 bg-primary-500 text-white text-xs px-2 py-1 rounded-bl-lg">
                      默认户号
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <StatusTag type="service" status={item.serviceType} />
                    {item.arrearsAmount && item.arrearsAmount > 0 && (
                      <Tag color="red">欠费</Tag>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">户号</p>
                      <p className="text-lg font-bold text-gray-800">{item.householdNo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">户名</p>
                      <p className="text-gray-800">{item.householdName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">地址</p>
                      <p className="text-gray-600 text-sm line-clamp-2">{item.address}</p>
                    </div>
                    {item.arrearsAmount && item.arrearsAmount > 0 && (
                      <div className="p-3 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-600">
                          欠费金额：<span className="font-bold text-lg">{formatMoney(item.arrearsAmount)}</span>
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 mt-4 pt-4 border-t">
                    {item.isDefault !== 1 && (
                      <Button
                        type="text"
                        size="small"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleSetDefault(item.id)}
                        className="flex-1 text-primary-600"
                      >
                        设为默认
                      </Button>
                    )}
                    <Popconfirm
                      title="确认解绑"
                      description="解绑后将无法管理该户号，是否继续？"
                      onConfirm={() => handleUnbind(item.id)}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Button type="text" size="small" danger className="flex-1">
                        解绑
                      </Button>
                    </Popconfirm>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <HomeOutlined className="text-6xl text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">暂无绑定户号</p>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
                立即绑定
              </Button>
            </div>
          )}
        </Spin>
      </Card>

      <Modal
        title="绑定新户号"
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        footer={[
          <Button key="cancel" onClick={() => { setModalVisible(false); form.resetFields(); }}>取消</Button>,
          <Button key="submit" type="primary" onClick={handleSubmit}>确认绑定</Button>,
        ]}
        width={480}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="householdNo"
            label="户号"
            rules={[{ required: true, message: '请输入户号' }]}
          >
            <Input placeholder="请输入户号" maxLength={20} />
          </Form.Item>
          <Form.Item
            name="householdName"
            label="户名"
            rules={[{ required: true, message: '请输入户名' }]}
          >
            <Input placeholder="请输入户名" maxLength={20} />
          </Form.Item>
          <Form.Item
            name="serviceType"
            label="服务类型"
            rules={[{ required: true, message: '请选择服务类型' }]}
          >
            <Select placeholder="请选择服务类型">
              <Option value="water">水费</Option>
              <Option value="electricity">电费</Option>
              <Option value="gas">燃气费</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="请输入预留手机号" maxLength={11} />
          </Form.Item>
          <Form.Item
            name="captcha"
            label="短信验证码"
            rules={[{ required: true, message: '请输入验证码' }]}
          >
            <div className="flex gap-3">
              <Input placeholder="请输入6位验证码" maxLength={6} style={{ flex: 1 }} />
              <Button
                onClick={handleSendCode}
                disabled={countdown > 0}
                loading={codeBtnLoading}
                style={{ minWidth: '120px' }}
              >
                {countdown > 0 ? `${countdown}s后重试` : '获取验证码'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HouseholdPage;
