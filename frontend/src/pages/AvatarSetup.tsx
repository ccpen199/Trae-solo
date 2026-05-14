import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, Check, ChevronRight, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { avatarApi } from '../lib/api';
import { Avatar } from '../components/Avatar';
import type { AvatarConfig } from '../types';

interface AvatarOptions {
  skinColors: string[];
  hairStyles: string[];
  hairColors: string[];
  eyeStyles: string[];
  outfits: string[];
  accessories: string[];
}

export const AvatarSetup: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser, showToast } = useStore();
  
  const [currentConfig, setCurrentConfig] = useState<AvatarConfig>({
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
    
    fetchOptions();
  }, []);
  
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
        showToast('虚拟形象保存成功！', 'success');
        navigate('/');
      } else {
        showToast(response.message || '保存失败', 'error');
      }
    } catch (error) {
      showToast('保存失败，请稍后重试', 'error');
      console.error('Save avatar error:', error);
    } finally {
      setSaving(false);
    }
  }, [currentConfig, user, navigate, setUser, showToast]);
  
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
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-lg">加载中...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
            <Palette className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">创建你的虚拟形象</h1>
          <p className="text-white/70">定制你的专属 2D 形象，在网页间自由穿梭</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card p-6 flex flex-col items-center">
            <h2 className="text-xl font-semibold text-white mb-4">预览</h2>
            <div className="w-48 h-48 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
              <Avatar config={currentConfig} size={180} animate />
            </div>
            <p className="text-white/70 text-center">{user?.nickname || '我的形象'}</p>
          </div>
          
          <div className="card p-6 space-y-6 max-h-[600px] overflow-y-auto">
            <div>
              <h3 className="text-white font-medium mb-3">肤色</h3>
              <div className="flex flex-wrap gap-2">
                {options?.skinColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateConfig('skinColor', color)}
                    className={`w-10 h-10 rounded-full border-2 transition-transform ${
                      currentConfig.skinColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {currentConfig.skinColor === color && <Check className="w-5 h-5 mx-auto text-primary-900" />}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-3">发型</h3>
              <div className="flex flex-wrap gap-2">
                {options?.hairStyles.map((style) => (
                  <button
                    key={style}
                    onClick={() => updateConfig('hairStyle', style)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
              <h3 className="text-white font-medium mb-3">发色</h3>
              <div className="flex flex-wrap gap-2">
                {options?.hairColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateConfig('hairColor', color)}
                    className={`w-10 h-10 rounded-full border-2 transition-transform ${
                      currentConfig.hairColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {currentConfig.hairColor === color && <Check className="w-5 h-5 mx-auto text-white" />}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-3">眼睛</h3>
              <div className="flex flex-wrap gap-2">
                {options?.eyeStyles.map((style) => (
                  <button
                    key={style}
                    onClick={() => updateConfig('eyeStyle', style)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentConfig.eyeStyle === style
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
              <h3 className="text-white font-medium mb-3">服装</h3>
              <div className="flex flex-wrap gap-2">
                {options?.outfits.map((outfit) => (
                  <button
                    key={outfit}
                    onClick={() => updateConfig('outfit', outfit)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
              <h3 className="text-white font-medium mb-3">配饰</h3>
              <div className="flex flex-wrap gap-2">
                {options?.accessories.map((accessory) => (
                  <button
                    key={accessory}
                    onClick={() => updateConfig('accessory', accessory)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
        </div>
        
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                完成设置
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarSetup;
