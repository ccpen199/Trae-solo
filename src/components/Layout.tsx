import Navbar from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-500">
              © 2025 实习兼职平台. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                关于我们
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                帮助中心
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                隐私政策
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                服务条款
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
