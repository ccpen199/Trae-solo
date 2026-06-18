import { useNavigate } from 'react-router-dom';
import { User, FileText, RefreshCw, Shield } from 'lucide-react';
import { useAppStore } from '@/store';

export default function Profile() {
  const { user, mode, setMode } = useAppStore();
  const navigate = useNavigate();

  const roleLabel = user?.role === 'admin' ? '监管' : user?.role === 'enterprise' ? '企业' : '个人';

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-800">个人中心</h1>

      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="w-7 h-7 text-primary-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">{user?.name}</h2>
            <p className="text-sm text-neutral-500">
              {roleLabel}用户 · {user?.idNumber}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-600 mb-2">当前模式</label>
          <div className="flex items-center gap-2 bg-neutral-50 rounded-lg p-1 w-fit">
            <button
              onClick={() => setMode('personal')}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                mode === 'personal'
                  ? 'bg-primary-700 text-white'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              个人模式
            </button>
            <button
              onClick={() => setMode('enterprise')}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                mode === 'enterprise'
                  ? 'bg-accent-500 text-white'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              企业模式
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-neutral-100">
            <span className="text-sm text-neutral-500">用户角色</span>
            <span className="text-sm text-neutral-800">{roleLabel}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-neutral-100">
            <span className="text-sm text-neutral-500">证件号码</span>
            <span className="text-sm text-neutral-800">{user?.idNumber}</span>
          </div>
          {user?.creditCode && (
            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
              <span className="text-sm text-neutral-500">统一信用代码</span>
              <span className="text-sm text-neutral-800">{user.creditCode}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div
          onClick={() => navigate('/profile/records')}
          className="bg-white border border-neutral-200 rounded-lg p-5 cursor-pointer hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-700" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-800">业务记录</h3>
            <p className="text-xs text-neutral-500">查看所有办理记录</p>
          </div>
        </div>
        <div
          onClick={() => navigate('/profile/sync')}
          className="bg-white border border-neutral-200 rounded-lg p-5 cursor-pointer hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-success-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-800">数据同步</h3>
            <p className="text-xs text-neutral-500">管理与同步数据</p>
          </div>
        </div>
      </div>
    </div>
  );
}
