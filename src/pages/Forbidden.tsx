import { Link, useNavigate } from 'react-router-dom';
import { ShieldOff, Lock, ArrowLeft, LogIn, UserCog } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuthStore } from '@/store/auth';

export default function Forbidden() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();

  return (
    <div className="page-container flex flex-col items-center justify-center text-center py-16">
      <div className="relative mb-10">
        <div className="absolute inset-0 blur-3xl opacity-20 bg-red-400 rounded-full scale-75 animate-pulse" />
        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-[32px] bg-gradient-to-br from-red-400 to-rose-500 shadow-[0_20px_60px_-16px_rgba(230,57,70,0.45)] flex items-center justify-center animate-float">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center">
            <ShieldOff size={52} className="text-white md:w-16 md:h-16" strokeWidth={1.75} />
          </div>
        </div>
        <div className="absolute -top-3 -right-3">
          <Badge variant="danger" size="sm" dot>
            访问被拒绝
          </Badge>
        </div>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <h1 className="text-2xl md:text-3xl font-bold text-ink-900 tracking-tight">
          抱歉，你没有权限访问此页面
        </h1>
        <p className="mt-3 text-ink-500 max-w-md leading-relaxed">
          这个页面只对特定角色开放，可能是：
        </p>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left max-w-md mx-auto">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-white border border-ink-100 text-sm">
            <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center shrink-0 mt-0.5">
              <UserCog size={14} />
            </div>
            <div>
              <div className="font-medium text-ink-700">角色不匹配</div>
              <div className="text-xs text-ink-400 mt-0.5">
                如：企业资源被学生访问
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-xl bg-white border border-ink-100 text-sm">
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-500 flex items-center justify-center shrink-0 mt-0.5">
              <Lock size={14} />
            </div>
            <div>
              <div className="font-medium text-ink-700">尚未登录</div>
              <div className="text-xs text-ink-400 mt-0.5">
                需要登录后才能查看
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
        <Button onClick={() => navigate(-1)} variant="outline" size="lg">
          <ArrowLeft size={16} />
          返回上一页
        </Button>
        {!isAuthenticated ? (
          <Link to="/login">
            <Button variant="primary" size="lg">
              <LogIn size={16} />
              先登录试试
            </Button>
          </Link>
        ) : (
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <LogIn size={16} />
            切换账号登录
          </Button>
        )}
        <Link to="/">
          <Button variant="ghost" size="lg">
            回到首页
          </Button>
        </Link>
      </div>
    </div>
  );
}
