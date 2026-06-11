import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';

export default function AuthLayout() {
  return (
    <Layout
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1B5E20 0%, #4CAF50 50%, #81C784 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Outlet />
    </Layout>
  );
}
