import { Bell, Search, Menu, Store, ChevronDown } from 'lucide-react';
import { useAppStore, useAuthStore } from '@/store/useAuthStore';
import { stores } from '@/data/mockData';
import { useState } from 'react';

export function Header() {
  const { toggleSidebar, currentStoreId, setCurrentStore } = useAppStore();
  const { user } = useAuthStore();
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);

  const currentStore = stores.find((s) => s.id === currentStoreId);

  return (
    <header className="h-16 bg-dark-900/80 backdrop-blur-sm border-b border-cyber-800 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-dark-400 hover:text-cyber-400 hover:bg-dark-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative">
          <button
            onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800 border border-cyber-700 text-sm hover:border-cyber-500 transition-colors"
          >
            <Store className="w-4 h-4 text-cyber-400" />
            <span className="text-white">{currentStore?.name || '选择门店'}</span>
            <ChevronDown className="w-4 h-4 text-dark-400" />
          </button>

          {storeDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-dark-800 border border-cyber-700 rounded-lg shadow-xl overflow-hidden">
              {stores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => {
                    setCurrentStore(store.id);
                    setStoreDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-dark-700 transition-colors border-b border-dark-700 last:border-b-0 ${
                    store.id === currentStoreId ? 'bg-cyber-900/50' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-white">{store.name}</p>
                  <p className="text-xs text-dark-400">{store.address}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="搜索..."
            className="w-64 h-9 pl-10 pr-4 bg-dark-800 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-cyber-500 transition-colors"
          />
        </div>

        <button className="relative p-2 rounded-lg text-dark-400 hover:text-cyber-400 hover:bg-dark-800 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-neon-red rounded-full animate-pulse"></span>
        </button>

        {user && (
          <div className="flex items-center gap-3 pl-4 border-l border-dark-700">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full border border-cyber-500"
            />
            <div>
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-dark-400">{user.roleName}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
