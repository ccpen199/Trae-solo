import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleLabel: Record<string, string> = {
    super_admin: '超级管理员',
    government: '文旅主管部门',
    scenic_admin: '景区运营方',
    enterprise: '文旅企业',
    editor: '内容编辑',
    professional: '专业读者',
    tourist: '游客用户',
  };

  const go = (path: string) => {
    setShowMenu(false);
    navigate(path);
  };

  return (
    <header className="h-16 bg-white border-b border-ink-100 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-ink-800">文旅垂直领域内容生产与产业服务中台</h2>
        <span className="px-2 py-0.5 bg-primary-50 text-primary-600 text-xs rounded-full font-medium">
          权威发布
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-ink-50 transition-colors" title="消息通知">
          <svg className="w-5 h-5 text-ink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <button className="p-2 rounded-lg hover:bg-ink-50 transition-colors" title="帮助中心" onClick={() => go('/admin/dashboard')}>
          <svg className="w-5 h-5 text-ink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        <div className="h-8 w-px bg-ink-200"></div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-ink-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
              {user?.realName?.charAt(0) || user?.username.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-ink-800">{user?.realName || user?.username}</p>
              <p className="text-xs text-ink-500">{roleLabel[user?.role || ''] || '用户'}</p>
            </div>
            <svg className="w-4 h-4 text-ink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-ink-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-ink-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                    {user?.realName?.charAt(0) || user?.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-800 truncate">{user?.realName || user?.username}</p>
                    <p className="text-xs text-ink-500 truncate">{user?.email || '未设置邮箱'}</p>
                    <p className="text-[10px] text-primary-600 mt-0.5">
                      {roleLabel[user?.role || ''] || '用户'} · {user?.organization || '-'}
                    </p>
                  </div>
                  </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => go('/admin/settings/profile')}
                  className="w-full px-4 py-2.5 text-left text-sm text-ink-700 hover:bg-primary-50 hover:text-primary-700 transition-colors flex items-center gap-2"
                >
                  <span className="w-4 text-center">👤</span>
                  <span>个人设置</span>
                </button>
                <button
                  onClick={() => go('/admin/settings/password')}
                  className="w-full px-4 py-2.5 text-left text-sm text-ink-700 hover:bg-primary-50 hover:text-primary-700 transition-colors flex items-center gap-2"
                >
                  <span className="w-4 text-center">🔐</span>
                  <span>修改密码</span>
                </button>
                <button
                  onClick={() => go('/admin/settings/permissions')}
                  className="w-full px-4 py-2.5 text-left text-sm text-ink-700 hover:bg-primary-50 hover:text-primary-700 transition-colors flex items-center gap-2"
                >
                  <span className="w-4 text-center">🛡️</span>
                  <span>角色权限</span>
                </button>
              </div>

              <div className="border-t border-ink-100 my-1"></div>

              <button
                onClick={() => go('/admin/dashboard')}
                className="w-full px-4 py-2.5 text-left text-sm text-ink-700 hover:bg-ink-50 transition-colors flex items-center gap-2"
              >
                <span className="w-4 text-center">📊</span>
                <span>返回工作台</span>
              </button>

              <div className="border-t border-ink-100 my-1"></div>

              <button
                onClick={async () => {
                  setShowMenu(false);
                  await logout();
                  navigate('/login');
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <span className="w-4 text-center">🚪</span>
                <span>退出登录</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
