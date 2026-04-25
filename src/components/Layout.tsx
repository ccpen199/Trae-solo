import React, { useState, useRef } from 'react';
import { 
  Home, 
  CheckSquare, 
  Tv, 
  DollarSign, 
  ChefHat, 
  Package, 
  Wrench,
  Plus,
  Bell,
  Search,
  Menu,
  X,
  Download,
  Upload,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { useHomeContext } from '../context/HomeContext';
import type { ActiveTab } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: '概览', icon: <Home className="w-5 h-5" /> },
  { id: 'tasks', label: '家庭任务', icon: <CheckSquare className="w-5 h-5" /> },
  { id: 'appliances', label: '家电设备', icon: <Tv className="w-5 h-5" /> },
  { id: 'budget', label: '预算管理', icon: <DollarSign className="w-5 h-5" /> },
  { id: 'recipes', label: '菜谱', icon: <ChefHat className="w-5 h-5" /> },
  { id: 'inventory', label: '库存', icon: <Package className="w-5 h-5" /> },
  { id: 'repairs', label: '维修记录', icon: <Wrench className="w-5 h-5" /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab } = useHomeContext();

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">智能家居</h1>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                onClose();
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                transition-colors duration-200
                ${activeTab === item.id 
                  ? 'bg-blue-50 text-blue-600 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'}
              `}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
};

interface HeaderProps {
  onMenuClick: () => void;
  onAddClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, onAddClick }) => {
  const { activeTab, exportData, importData, resetData, getReminders } = useHomeContext();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showReminderMenu, setShowReminderMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentTitle = navItems.find(item => item.id === activeTab)?.label || '概览';
  const reminders = getReminders();

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result as string;
        if (importData(data)) {
          alert('数据导入成功！');
        } else {
          alert('数据导入失败，请检查文件格式。');
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'task': return <CheckSquare className="w-4 h-4" />;
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      case 'inventory': return <Package className="w-4 h-4" />;
      case 'expiry': return <AlertCircle className="w-4 h-4" />;
      case 'repair': return <Wrench className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getReminderColor = (type: string) => {
    switch (type) {
      case 'task': return 'bg-orange-50 border-orange-200';
      case 'maintenance': return 'bg-blue-50 border-blue-200';
      case 'inventory': return 'bg-red-50 border-red-200';
      case 'expiry': return 'bg-yellow-50 border-yellow-200';
      case 'repair': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800">{currentTitle}</h2>
      </div>
      
      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <Search className="w-5 h-5 text-gray-600" />
        </button>
        
        <div className="relative">
          <button 
            onClick={() => {
              setShowReminderMenu(!showReminderMenu);
              setShowExportMenu(false);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg relative"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {reminders.length > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                {reminders.length}
              </span>
            )}
          </button>
          
          {showReminderMenu && (
            <>
              <div 
                className="fixed inset-0" 
                onClick={() => setShowReminderMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                  <h4 className="font-semibold text-gray-800">提醒事项</h4>
                  <span className="text-xs text-gray-500">{reminders.length} 条</span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {reminders.length > 0 ? (
                    <div className="p-2 space-y-2">
                      {reminders.map((reminder, index) => (
                        <div 
                          key={index} 
                          className={`p-3 rounded-lg border ${getReminderColor(reminder.type)}`}
                        >
                          <div className="flex items-start gap-2">
                            {getReminderIcon(reminder.type)}
                            <div className="flex-1">
                              <p className="text-sm text-gray-800">{reminder.message}</p>
                              {reminder.date && (
                                <p className="text-xs text-gray-500 mt-1">{reminder.date}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">暂无提醒</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="relative">
          <button 
            onClick={() => {
              setShowExportMenu(!showExportMenu);
              setShowReminderMenu(false);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Download className="w-5 h-5 text-gray-600" />
          </button>
          
          {showExportMenu && (
            <>
              <div 
                className="fixed inset-0" 
                onClick={() => setShowExportMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-2">
                  <button
                    onClick={() => {
                      exportData('json');
                      setShowExportMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    <Download className="w-4 h-4" />
                    导出为 JSON
                  </button>
                  <button
                    onClick={() => {
                      exportData('csv');
                      setShowExportMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    <Download className="w-4 h-4" />
                    导出为 CSV
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowExportMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    <Upload className="w-4 h-4" />
                    导入数据
                  </button>
                  <button
                    onClick={() => {
                      resetData();
                      setShowExportMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <RotateCcw className="w-4 h-4" />
                    重置数据
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        
        <button 
          onClick={onAddClick}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">添加</span>
        </button>
      </div>
    </header>
  );
};
