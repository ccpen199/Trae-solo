import { Bell, Search, Moon, Sun } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索市民、交易、景区..."
            className="w-80 pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl text-sm focus:outline-none focus:border-primary-200 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="h-6 w-px bg-gray-200 mx-2"></div>
        <div className="flex items-center">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-800">上午好</p>
            <p className="text-xs text-gray-500">{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
          </div>
        </div>
      </div>
    </header>
  );
}