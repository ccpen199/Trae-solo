import { useState, useEffect } from 'react';
import { userApi } from '../services';
import { useAppStore } from '../store/appStore';
import type { User } from '../types';

export default function UserSwitcher() {
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const { currentUserId, setCurrentUserId, fetchRiskStatus } = useAppStore();

  useEffect(() => {
    void (async () => {
      try {
        const res = await userApi.search({ page: 1, pageSize: 30 });
        setUsers((res as { items: User[] }).items || []);
        if (!currentUserId || currentUserId === 'default') {
          const firstId = (res as { items: User[] }).items?.[0]?.id;
          if (firstId) setCurrentUserId(firstId);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const handleChange = (id: string) => {
    setCurrentUserId(id);
    void fetchRiskStatus();
    setOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={() => setOpen(!open)}
        className="btn btn-secondary btn-sm shadow-lg rounded-full px-4 py-2"
      >
        👤 切换测试用户
      </button>
      {open && (
        <div className="absolute bottom-12 right-0 bg-white rounded-xl shadow-xl border border-gray-200 w-80 max-h-96 overflow-y-auto p-2">
          <div className="text-xs text-gray-500 px-3 py-2 border-b border-gray-100 mb-1">选择测试账号 (开发模式)</div>
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => handleChange(u.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-gray-50 ${
                u.id === currentUserId ? 'bg-indigo-50' : ''
              }`}
            >
              <img src={u.avatar} alt="" className="avatar avatar-sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {u.nickname}
                  {u.verification?.verified && <span className="ml-1 badge badge-success" style={{ fontSize: '9px' }}>实名</span>}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {u.gender === 'male' ? '♂' : u.gender === 'female' ? '♀' : '•'} {u.age}岁 · {u.location.city} · 信用分{u.creditScore}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
