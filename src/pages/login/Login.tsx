import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { mockUsers } from '@/mock/users';
import { APP_NAME } from '@/constants/config';

export default function Login() {
  const [selectedUser, setSelectedUser] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = mockUsers.find((u) => u.id === selectedUser);
    if (user) {
      login(user);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 p-4">
      <div className="card p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-800">{APP_NAME}</h1>
          <p className="text-surface-500 mt-2">选择用户登录</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          >
            <option value="">选择用户...</option>
            {mockUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
          <button type="submit" className="btn-primary w-full">登录</button>
        </form>
      </div>
    </div>
  );
}
