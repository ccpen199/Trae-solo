import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { useToast } from '../components/ToastProvider';

const ROLE_MAP: Record<string, { label: string; role: string; desc: string; target: 'admin' | 'user' }> = {
  admin: {
    label: '超级管理员',
    role: 'super',
    desc: '全部管理权限：看板、任务、用户、风控、广告配置',
    target: 'admin',
  },
  platform: {
    label: '运营主管',
    role: 'admin',
    desc: '运营管理权限：任务配置、ROI分析、用户管理',
    target: 'admin',
  },
  ops: {
    label: '运营人员',
    role: 'operator',
    desc: '运营操作权限：任务创建编辑、数据查看',
    target: 'admin',
  },
  auditor: {
    label: '财务审核',
    role: 'auditor',
    desc: '审核权限：提现审核、风控事件查看',
    target: 'admin',
  },
  viewer: {
    label: '数据观察员',
    role: 'viewer',
    desc: '只读权限：全部数据看板查看',
    target: 'admin',
  },
};

const ADMIN_HOST = 'http://localhost:5173';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useUserStore((s) => s.login);
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [detectedRole, setDetectedRole] = useState<{ key: string; info: typeof ROLE_MAP[string] } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const demo = params.get('demo');
    if (demo && ROLE_MAP[demo]) {
      setNickname(demo);
      handleRoleDetect(demo);
    }
  }, [location.search]);

  const handleRoleDetect = (name: string) => {
    const info = ROLE_MAP[name];
    if (info) {
      setDetectedRole({ key: name, info });
      setShowRoleModal(true);
      return true;
    }
    return false;
  };

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    if (error) setError('');
  };

  const handleLogin = async () => {
    const name = nickname.trim().toLowerCase();
    if (!name) {
      setError('请输入昵称');
      return;
    }
    if (name.length < 1 || name.length > 20) {
      setError('昵称长度需在1-20个字符之间');
      return;
    }

    if (handleRoleDetect(name)) {
      return;
    }

    await doUserLogin(name);
  };

  const doUserLogin = async (name: string) => {
    setLoading(true);
    setError('');
    try {
      await login({ nickname: name });
      toast.show(`欢迎回来，${name}！`, 2000);
      navigate('/', { replace: true });
    } catch (e: any) {
      const msg = e?.message || '登录失败，请重试';
      setError(msg);
      toast.show(msg, 2500);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleConfirm = () => {
    if (!detectedRole) return;
    setShowRoleModal(false);

    const adminUrl = `${ADMIN_HOST}/#/login?demo=${detectedRole.key}&role=${detectedRole.info.role}`;
    toast.show(`正在跳转到【${detectedRole.info.label}】管理后台...`, 1500);

    setTimeout(() => {
      window.location.href = adminUrl;
    }, 800);
  };

  const handleRoleCancel = () => {
    setShowRoleModal(false);
    setDetectedRole(null);
  };

  const handleContinueAsUser = () => {
    setShowRoleModal(false);
    const name = nickname.trim();
    doUserLogin(name);
  };

  const handleWechatLogin = async () => {
    setLoading(true);
    setError('');

    try {
      toast.show('正在拉起微信授权...', 2000);
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const openid = 'wx_' + Math.random().toString(36).substr(2, 16);
      const wxNickname = '微信用户_' + Math.random().toString(36).substr(2, 4);

      await login({
        openid,
        nickname: wxNickname,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${openid}`,
      });

      toast.show(`微信授权成功，欢迎 ${wxNickname}`, 2000);
      navigate('/', { replace: true });
    } catch (e: any) {
      const msg = e?.message || '微信登录失败，请重试';
      setError(msg);
      toast.show(msg, 2500);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 via-orange-50 to-white px-6 pt-16 relative">
      <div className="text-center mb-8">
        <div className="text-7xl mb-4 bounce-in">🪙</div>
        <h1 className="text-4xl font-bold text-gradient mb-2">赚赚</h1>
        <p className="text-gray-500">走路赚钱 · 任务赚钱 · 看视频赚钱</p>
      </div>

      <div className="bg-white/60 rounded-2xl p-3 mb-4 border border-orange-100">
        <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
          <span>🎯</span> 演示账号快捷体验
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ROLE_MAP).map(([key, info]) => (
            <button
              key={key}
              onClick={() => handleNicknameChange(key)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                nickname === key
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
              }`}
            >
              {info.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="card p-6">
          <label className="text-sm text-gray-500 mb-2 block">输入昵称(游客登录)</label>
          <input
            value={nickname}
            onChange={(e) => handleNicknameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="请输入昵称"
            disabled={loading}
            className={`w-full px-4 py-3 rounded-xl bg-gray-50 border ${
              error ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-primary'
            } focus:outline-none mb-2 transition-colors`}
          />
          {error && (
            <div className="text-red-500 text-xs mb-3 flex items-center gap-1">
              <span>⚠️</span> {error}
            </div>
          )}
          <button
            onClick={handleLogin}
            disabled={loading}
            className={`btn-primary w-full text-center ${loading ? 'opacity-60' : ''}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                登录中...
              </span>
            ) : (
              '开始赚钱'
            )}
          </button>
        </div>

        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-gray-400 text-xs">或者</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        <button
          onClick={handleWechatLogin}
          disabled={loading}
          className={`w-full bg-[#07C160] text-white font-semibold rounded-full py-3.5 flex items-center justify-center gap-2 active:scale-95 transition-transform ${
            loading ? 'opacity-60 pointer-events-none' : ''
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              授权中...
            </span>
          ) : (
            <>
              <span className="text-xl">💬</span>
              微信一键登录
            </>
          )}
        </button>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => window.location.href = ADMIN_HOST}
          className="text-xs text-gray-400 hover:text-primary transition-colors underline underline-offset-2"
        >
          运营人员/管理员 → 登录管理后台
        </button>
      </div>

      <div className="mt-6 text-center text-xs text-gray-400 space-y-1">
        <p>登录即代表同意《用户协议》和《隐私政策》</p>
        <p className="text-gray-300">游客账号仅限本设备使用</p>
      </div>

      {showRoleModal && detectedRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] px-6">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-bounce-in">
            <div
              className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 text-white text-center"
            >
              <div className="text-5xl mb-2">👤</div>
              <div className="text-xl font-bold">{detectedRole.info.label}</div>
              <div className="text-white/80 text-sm mt-1">角色身份识别成功</div>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 rounded-xl p-4 mb-5">
                <div className="flex items-start gap-3">
                  <div className="bg-orange-100 rounded-lg p-2 text-orange-600 text-lg">
                    🎯
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 text-sm mb-1">权限范围</div>
                    <div className="text-gray-500 text-xs leading-relaxed">
                      {detectedRole.info.desc}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleRoleConfirm}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-full py-3 active:scale-98 transition-transform"
                >
                  进入管理后台
                </button>

                <button
                  onClick={handleContinueAsUser}
                  className="w-full bg-gray-100 text-gray-600 font-medium rounded-full py-3 text-sm active:scale-98 transition-transform"
                >
                  以普通用户身份进入
                </button>

                <button
                  onClick={handleRoleCancel}
                  className="w-full text-gray-400 py-2 text-sm hover:text-gray-600"
                >
                  返回修改
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
