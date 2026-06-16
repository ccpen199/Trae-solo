import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gov-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 min-h-[calc(100vh-64px)] animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
