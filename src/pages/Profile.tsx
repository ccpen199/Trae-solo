import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Dialog } from 'antd-mobile';
import Layout from '../components/Layout';
import type { User } from '@shared/types';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const handleLogout = () => {
    Dialog.show({
      title: '确认退出',
      content: '确定要退出登录吗？',
      closeOnAction: true,
      actions: [
        {
          key: 'cancel',
          text: '取消',
        },
        {
          key: 'confirm',
          text: '确定',
          danger: true,
          onClick: () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login', { replace: true });
          },
        },
      ],
    });
  };

  return (
    <Layout title="个人中心">
      <div className="p-4">
        {user && (
          <div className="bg-white rounded-xl p-4 mb-4 card-shadow">
            <div className="flex items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xl font-bold">
                {user.name.charAt(0)}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-gray-800">{user.name}</h3>
                <p className="text-gray-500 text-sm">
                  {user.role === 'city_admin' ? '市级管理员' : '学校管理员'}
                </p>
                <p className="text-gray-400 text-xs mt-1">@{user.username}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl overflow-hidden card-shadow">
          <Button
            block
            color="danger"
            onClick={handleLogout}
            className="h-12"
          >
            退出登录
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
