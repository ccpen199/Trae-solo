import React, { useState, useEffect } from 'react';
import { X, User, Check, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { authApi } from '../lib/api';
import type { User as UserType } from '../types';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, setUser, showToast } = useStore();
  
  const [nickname, setNickname] = useState('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setUsername(user.username || '');
    }
  }, [user]);
  
  const handleSave = async () => {
    if (!nickname.trim()) {
      showToast('昵称不能为空', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const response = await authApi.updateProfile({ nickname: nickname.trim() });
      
      if (response.success) {
        if (user) {
          setUser({ ...user, nickname: nickname.trim() });
        }
        showToast('账号信息更新成功！', 'success');
        onClose();
      } else {
        showToast(response.message || '更新失败', 'error');
      }
    } catch (error) {
      showToast('更新失败，请稍后重试', 'error');
      console.error('Update profile error:', error);
    } finally {
      setSaving(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="card p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">账号信息</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-5">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">用户名</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="text"
                value={username}
                disabled
                className="input-field pl-10 opacity-60 cursor-not-allowed"
              />
            </div>
            <p className="text-white/40 text-xs mt-1">用户名不可修改</p>
          </div>
          
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">昵称</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="input-field pl-10"
                placeholder="请输入昵称"
                maxLength={20}
              />
            </div>
          </div>
          
          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={saving || !nickname.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  保存修改
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsModal;
