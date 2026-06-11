import React from 'react';
import { Layout, Button } from 'antd';
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Content } = Layout;

interface GuestLayoutProps {
  children: React.ReactNode;
}

const GuestLayout: React.FC<GuestLayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  return (
    <Layout className="min-h-screen">
      <div className="fixed inset-0 bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300 rounded-full blur-3xl"></div>
        </div>
      </div>
      <Layout className="relative z-10 bg-transparent min-h-screen">
        <div className="absolute top-4 left-6 z-20">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            className="!text-white/80 hover:!text-white"
            onClick={() => navigate('/hall')}
          >
            返回办事大厅
          </Button>
        </div>
        <Content className="flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <HomeOutlined className="text-2xl text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">常州市公共服务聚合平台</h1>
              <p className="text-blue-100">城市服务中枢 · 一网通办</p>
              <div className="flex justify-center gap-4 mt-3 text-xs text-blue-200">
                <span>实名认证</span>
                <span>·</span>
                <span>角色权限</span>
                <span>·</span>
                <span>电子证照</span>
                <span>·</span>
                <span>工作台承接</span>
              </div>
            </div>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default GuestLayout;
