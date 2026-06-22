import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Avatar, Switch, Tag, message, Modal } from 'antd';
import {
  UserOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  BarChartOutlined,
  HistoryOutlined,
  CreditCardOutlined,
  LogoutOutlined,
  CarOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useTaskStore } from '@/store/taskStore';
import { offlineSync } from '@/utils/offline';
import PageHeader from '@/components/PageHeader';
import Loading from '@/components/Loading';
import { riderService } from '@/services/rider.service';
import { formatAmount } from '@/utils/format';
import type { RiderStats } from '@shared/types';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { clearTasks } = useTaskStore();
  const [stats, setStats] = useState<RiderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await riderService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Load stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      clearTasks();
      await offlineSync.clear();
      message.success('已退出登录');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setShowLogoutModal(false);
    }
  };

  const getAuditStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'gold', text: '审核中' },
      approved: { color: 'green', text: '已通过' },
      rejected: { color: 'red', text: '已拒绝' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  const menuItems = [
    {
      icon: <SafetyCertificateOutlined className="text-blue-500" />,
      title: '实名认证',
      extra: user?.realNameAuditStatus ? getAuditStatusTag(user.realNameAuditStatus) : '未认证',
      onClick: () => navigate('/profile/realname'),
    },
    {
      icon: <SettingOutlined className="text-green-500" />,
      title: '接单偏好',
      onClick: () => navigate('/profile/preferences'),
    },
    {
      icon: <HistoryOutlined className="text-orange-500" />,
      title: '历史订单',
      extra: stats ? `${stats.totalOrders}单` : '-',
      onClick: () => navigate('/orders'),
    },
    {
      icon: <CreditCardOutlined className="text-purple-500" />,
      title: '信用分',
      extra: user?.creditScore !== undefined ? `${user.creditScore}分` : '-',
      onClick: () => navigate('/credit'),
    },
    {
      icon: <BarChartOutlined className="text-cyan-500" />,
      title: '数据统计',
      onClick: () => navigate('/orders'),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader title="个人中心" />

      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-6 text-white">
        <div className="flex items-center gap-4">
          <Avatar size={64} icon={<UserOutlined />} />
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{user?.name}</h2>
            <p className="text-blue-100 text-sm mt-1">
              {user?.phone && (
                <span className="flex items-center gap-1">
                  <PhoneOutlined />
                  {user.phone}
                </span>
              )}
            </p>
            <div className="flex items-center gap-3 mt-2">
              {user?.vehicleType && (
                <span className="flex items-center gap-1 text-sm">
                  <CarOutlined />
                  {user.vehicleType === 'electric_scooter' ? '电动车' :
                   user.vehicleType === 'motorcycle' ? '摩托车' :
                   user.vehicleType === 'car' ? '汽车' :
                   user.vehicleType === 'bicycle' ? '自行车' : '步行'}
                </span>
              )}
              {user?.vehiclePlate && (
                <span className="text-sm">车牌: {user.vehiclePlate}</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 text-center">
          <div>
            <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
            <p className="text-blue-100 text-xs">总订单</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{formatAmount(stats?.totalEarnings || 0)}</p>
            <p className="text-blue-100 text-xs">总收入</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats?.completionRate ? `${stats.completionRate}%` : '-'}</p>
            <p className="text-blue-100 text-xs">完成率</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3">
        <List
          className="bg-white rounded-lg shadow-sm"
          dataSource={menuItems}
          renderItem={(item) => (
            <List.Item
              onClick={item.onClick}
              className="cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <List.Item.Meta
                avatar={item.icon}
                title={item.title}
                description={item.extra}
              />
            </List.Item>
          )}
        />

        <List
          className="bg-white rounded-lg shadow-sm mt-3"
          dataSource={[
            {
              icon: <LogoutOutlined className="text-red-500" />,
              title: '退出登录',
              onClick: () => setShowLogoutModal(true),
            },
          ]}
          renderItem={(item) => (
            <List.Item
              onClick={item.onClick}
              className="cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <List.Item.Meta
                avatar={item.icon}
                title={<span className="text-red-500">{item.title}</span>}
              />
            </List.Item>
          )}
        />
      </div>

      <Modal
        title="确认退出"
        open={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        footer={[
          <button
            key="cancel"
            className="px-4 py-2 text-gray-500 hover:text-gray-700"
            onClick={() => setShowLogoutModal(false)}
          >
            取消
          </button>,
          <button
            key="ok"
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            onClick={handleLogout}
          >
            确认退出
          </button>,
        ]}
      >
        <p className="text-gray-600">确定要退出登录吗？</p>
      </Modal>
    </div>
  );
};

export default Profile;
