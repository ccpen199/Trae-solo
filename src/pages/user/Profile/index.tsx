import React, { useEffect, useState } from 'react';
import { Card, Button, Tag, List, Avatar, Statistic, Badge, Divider, Modal, Form, Input, message, Spin } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  BellOutlined,
  SafetyOutlined,
  HomeOutlined,
  SettingOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  PhoneOutlined,
  LockOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { userApi } from '@/services/user';
import { reportApi } from '@/services/payment';
import { announcementApi } from '@/services/announcement';
import { formatMoney, maskPhone } from '@/utils/format';
import StatusTag from '@/components/StatusTag';
import type { User, PaymentStatistics } from '@/types';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [statistics, setStatistics] = useState({ totalAmount: 0, householdCount: 0, unreadCount: 0 });
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [user, stats, household, notifications] = await Promise.all([
        userApi.getUserInfo() as any,
        reportApi.getPaymentStatistics({}) as any,
        userApi.getHouseholdList() as any,
        announcementApi.getMyNotifications({ page: 1, pageSize: 10, isRead: 0 }) as any,
      ]);
      setUserInfo(user);
      setStatistics({
        totalAmount: stats?.totalAmount || 0,
        householdCount: (household || []).length,
        unreadCount: stats?.totalCount || notifications?.total || 0,
      });
    } catch (error) {
      console.error('加载数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRealNameAuth = async () => {
    try {
      const values = await authForm.validateFields();
      await userApi.realNameAuth({
        realName: values.realName,
        idCard: values.idCard,
      });
      message.success('实名认证提交成功');
      setAuthModalVisible(false);
      authForm.resetFields();
      loadData();
    } catch (error) {
      console.error('实名认证失败', error);
    }
  };

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出',
      icon: <ExclamationCircleOutlined />,
      content: '确定要退出登录吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        localStorage.removeItem('token');
        navigate('/login');
      },
    });
  };

  const realNameStatusMap: Record<number, { text: string; color: string; icon: React.ReactNode }> = {
    0: { text: '未认证', color: '#86909C', icon: <ExclamationCircleOutlined /> },
    1: { text: '已认证', color: '#00B42A', icon: <CheckCircleOutlined /> },
    2: { text: '认证中', color: '#FF7D00', icon: <ClockCircleOutlined /> },
  };

  const menuItems = [
    { icon: <FileTextOutlined />, label: '我的工单', path: '/work-orders', color: '#165DFF' },
    { icon: <BellOutlined />, label: '消息通知', path: '/notifications', badge: statistics.unreadCount, color: '#FF8800' },
    { icon: <SafetyOutlined />, label: '实名认证', path: '#', action: () => setAuthModalVisible(true), color: '#00B42A' },
    { icon: <HomeOutlined />, label: '户号管理', path: '/household', color: '#00B8D9' },
    { icon: <SettingOutlined />, label: '设置', path: '/settings', color: '#722ED1' },
  ];

  if (!userInfo) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  const authStatus = realNameStatusMap[userInfo.realNameStatus];

  return (
    <div className="space-y-6">
      <Card className="shadow-md overflow-hidden" bodyStyle={{ padding: 0 }}>
        <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-cyan-500 p-8 text-white">
          <div className="flex items-center gap-6">
            <Avatar size={80} icon={<UserOutlined />} className="bg-white/20 border-2 border-white/30" />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{userInfo.nickname}</h2>
                <Tag
                  color={authStatus.color}
                  icon={authStatus.icon}
                  className="bg-white/20 border-0"
                >
                  {authStatus.text}
                </Tag>
              </div>
              <div className="flex items-center gap-4 text-white/80">
                <span><PhoneOutlined className="mr-1" />{maskPhone(userInfo.phone)}</span>
                {userInfo.realName && (
                  <span><UserOutlined className="mr-1" />{userInfo.realName}</span>
                )}
              </div>
            </div>
            <Button icon={<EditOutlined />} className="bg-white/20 border-0 text-white hover:bg-white/30">
              编辑资料
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x">
          <div className="p-6 text-center">
            <Statistic
              title={<span className="text-gray-500">累计缴费</span>}
              value={statistics.totalAmount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#165DFF' }}
            />
          </div>
          <div className="p-6 text-center">
            <Statistic
              title={<span className="text-gray-500">绑定户号</span>}
              value={statistics.householdCount}
              suffix="个"
              valueStyle={{ color: '#00B42A' }}
            />
          </div>
          <div className="p-6 text-center">
            <Statistic
              title={<span className="text-gray-500">未读消息</span>}
              value={statistics.unreadCount}
              suffix="条"
              valueStyle={{ color: '#FF8800' }}
            />
          </div>
        </div>
      </Card>

      <Card className="shadow-md" title="功能菜单" bodyStyle={{ padding: 0 }}>
        <List
          dataSource={menuItems}
          renderItem={(item) => (
            <List.Item
              className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors border-b last:border-b-0"
              onClick={() => item.action ? item.action() : navigate(item.path)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.icon}
                  </div>
                  <span className="font-medium text-gray-800">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && item.badge > 0 && (
                    <Badge count={item.badge} size="small" />
                  )}
                  <span className="text-gray-400">{'>'}</span>
                </div>
              </div>
            </List.Item>
          )}
        />
      </Card>

      <Card className="shadow-md">
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center p-4 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => navigate('/payment')}>
            <CreditCardOutlined className="text-3xl text-primary-500 mb-2" />
            <p className="text-sm text-gray-600">立即缴费</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => navigate('/payment/records')}>
            <FileTextOutlined className="text-3xl text-cyan-500 mb-2" />
            <p className="text-sm text-gray-600">缴费记录</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => navigate('/service-map')}>
            <HomeOutlined className="text-3xl text-green-500 mb-2" />
            <p className="text-sm text-gray-600">服务网点</p>
          </div>
        </div>
      </Card>

      <div className="text-center pt-4">
        <Button danger onClick={handleLogout} className="px-12">
          退出登录
        </Button>
      </div>

      <Modal
        title="实名认证"
        open={authModalVisible}
        onCancel={() => { setAuthModalVisible(false); authForm.resetFields(); }}
        footer={[
          <Button key="cancel" onClick={() => { setAuthModalVisible(false); authForm.resetFields(); }}>取消</Button>,
          <Button key="submit" type="primary" onClick={handleRealNameAuth}>提交认证</Button>,
        ]}
        width={480}
      >
        <Form form={authForm} layout="vertical" className="mt-4">
          <Form.Item
            name="realName"
            label="真实姓名"
            rules={[
              { required: true, message: '请输入真实姓名' },
              { min: 2, max: 20, message: '姓名长度应在2-20个字符之间' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入真实姓名" />
          </Form.Item>
          <Form.Item
            name="idCard"
            label="身份证号"
            rules={[
              { required: true, message: '请输入身份证号' },
              { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入正确的身份证号' },
            ]}
          >
            <Input prefix={<LockOutlined />} placeholder="请输入18位身份证号" maxLength={18} />
          </Form.Item>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600">
              <SafetyOutlined className="mr-1" />
              您的个人信息将严格保密，仅用于身份验证
            </p>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
