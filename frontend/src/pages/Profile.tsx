import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, Check, Loader2, LogOut, User, Shield, Bell, Moon, Sun, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { avatarApi, authApi } from '../lib/api';
import { Avatar } from '../components/Avatar';
import { AccountSettingsModal } from '../components/AccountSettingsModal';
import type { AvatarConfig, User as UserType } from '../types';

interface AvatarOptions {
  skinColors: string[];
  hairStyles: string[];
  hairColors: string[];
  eyeStyles: string[];
  outfits: string[];
  accessories: string[];
}

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser, logout, showToast } = useStore();
  
  const [currentConfig, setCurrentConfig] = useState<AvatarConfig>(user?.avatarConfig || {
    skinColor: '#FFDBB4',
    hairStyle: 'style1',
    hairColor: '#4A4A4A',
    eyeStyle: 'style1',
    outfit: 'casual',
    accessory: 'none',
  });
  
  const [options, setOptions] = useState<AvatarOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  
  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const response = await avatarApi.getOptions();
        if (response.success && response.data) {
          setOptions(response.data as AvatarOptions);
        }
      } catch (error) {
        console.error('Fetch avatar options error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.avatarConfig) {
      setCurrentConfig(user.avatarConfig);
    }
    
    fetchOptions();
  }, [user]);
  
  const updateConfig = useCallback((key: keyof AvatarConfig, value: string) => {
    setCurrentConfig((prev) => ({ ...prev, [key]: value }));
  }, []);
  
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const response = await avatarApi.update(currentConfig);
      if (response.success && response.data) {
        if (user) {
          const newConfig = (response.data as { avatarConfig: AvatarConfig }).avatarConfig;
          setUser({ ...user, avatarConfig: newConfig });
        }
        showToast('虚拟形象更新成功！', 'success');
      } else {
        showToast(response.message || '更新失败', 'error');
      }
    } catch (error) {
      showToast('更新失败，请稍后重试', 'error');
      console.error('Save avatar error:', error);
    } finally {
      setSaving(false);
    }
  }, [currentConfig, user, setUser, showToast]);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleThemeToggle = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    showToast(`已切换到${newDarkMode ? '深色' : '浅色'}模式`, 'success');
  };

  const handleSettingClick = (settingName: string) => {
    switch (settingName) {
      case '账号信息':
        setShowAccountModal(true);
        break;
      case '主题设置':
        handleThemeToggle();
        break;
      default:
        showToast(`${settingName}功能正在开发中，敬请期待！`, 'info');
    }
  };
  
  const styleNames: Record<string, string> = {
    style1: '款式 1',
    style2: '款式 2',
    style3: '款式 3',
    style4: '款式 4',
    style5: '款式 5',
    style6: '款式 6',
    casual: '休闲',
    formal: '正装',
    sport: '运动',
    gamer: '电竞',
    anime: '二次元',
    fantasy: '奇幻',
    none: '无',
    glasses: '眼镜',
    hat: '帽子',
    headphone: '耳机',
    crown: '皇冠',
  };
  
  const settings = [
    { icon: User, label: '账号信息', desc: '管理你的账号资料' },
    { icon: Shield, label: '隐私设置', desc: '控制谁可以看到你' },
    { icon: Bell, label: '通知设置', desc: '管理推送和提醒' },
    { icon: Moon, label: '主题设置', desc: '切换明暗主题' },
  ];
  
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">设置</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              虚拟形象
            </h2>
            
            <div className="flex flex-col items-center mb-6">
              <div className="w-40 h-40 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                <Avatar config={currentConfig} size={150} animate />
              </div>
              <p className="text-white font-semibold">{user?.nickname || '我的形象'}</p>
              <p className="text-white/50 text-sm">@{user?.username}</p>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto">
                <div>
                  <h3 className="text-white font-medium mb-2 text-sm">肤色</h3>
                  <div className="flex flex-wrap gap-2">
                    {options?.skinColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateConfig('skinColor', color)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          currentConfig.skinColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-white font-medium mb-2 text-sm">发型</h3>
                  <div className="flex flex-wrap gap-2">
                    {options?.hairStyles.map((style) => (
                      <button
                        key={style}
                        onClick={() => updateConfig('hairStyle', style)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          currentConfig.hairStyle === style
                            ? 'bg-primary-500 text-white'
                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                        }`}
                      >
                        {styleNames[style] || style}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-white font-medium mb-2 text-sm">发色</h3>
                  <div className="flex flex-wrap gap-2">
                    {options?.hairColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateConfig('hairColor', color)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          currentConfig.hairColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-white font-medium mb-2 text-sm">服装</h3>
                  <div className="flex flex-wrap gap-2">
                    {options?.outfits.map((outfit) => (
                      <button
                        key={outfit}
                        onClick={() => updateConfig('outfit', outfit)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          currentConfig.outfit === outfit
                            ? 'bg-primary-500 text-white'
                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                        }`}
                      >
                        {styleNames[outfit] || outfit}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-white font-medium mb-2 text-sm">配饰</h3>
                  <div className="flex flex-wrap gap-2">
                    {options?.accessories.map((accessory) => (
                      <button
                        key={accessory}
                        onClick={() => updateConfig('accessory', accessory)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          currentConfig.accessory === accessory
                            ? 'bg-primary-500 text-white'
                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                        }`}
                      >
                        {styleNames[accessory] || accessory}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  保存修改
                </>
              )}
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-white mb-4">账号设置</h2>
              <div className="space-y-2">
                {settings.map((setting, index) => (
                  <button
                    key={index}
                    onClick={() => handleSettingClick(setting.label)}
                    className="w-full flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <setting.icon className="w-5 h-5 text-white/70" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{setting.label}</p>
                      <p className="text-white/50 text-sm">{setting.desc}</p>
                    </div>
                    {setting.label === '主题设置' && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/50 text-sm">
                          {darkMode ? '深色' : '浅色'}
                        </span>
                        {darkMode ? (
                          <Moon className="w-5 h-5 text-white/70" />
                        ) : (
                          <Sun className="w-5 h-5 text-white/70" />
                        )}
                      </div>
                    )}
                    {setting.label !== '主题设置' && (
                      <ChevronRight className="w-5 h-5 text-white/30" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-white mb-4">危险操作</h2>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-colors text-red-300"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">退出登录</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <AccountSettingsModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
      />
    </div>
  );
};

export default Profile;
