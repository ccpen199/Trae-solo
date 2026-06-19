import { Bell, Search, ChevronDown } from 'lucide-react';

const Header = ({ title }: { title: string }) => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索活动、学生、基地..."
            className="w-72 h-9 pl-9 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">管</span>
          </div>
          <span className="text-sm font-medium text-gray-700">校团委</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </header>
  );
};

export default Header;
