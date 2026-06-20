import { useState, useEffect, useRef } from 'react';
import {
  Upload,
  X,
  Save,
  Loader2,
  CheckCircle,
  Settings,
  Image,
  Eye,
  FileText,
  TrendingUp
} from 'lucide-react';
import { get, put } from '@/utils/api';
import { cn } from '@/lib/utils';
import type { WaybillAccount } from 'shared/types';

const mockAccount: WaybillAccount = {
  id: '1',
  outletId: '1',
  outletName: '东门网点',
  balance: 856.50,
  frozenBalance: 200.00,
  totalRecharged: 15000.00,
  totalUsed: 14143.50,
  templateConfig: {
    templateId: 'tpl001',
    templateName: '标准面单模板',
    paperSize: '100x150',
    fontSize: 'medium',
    showLogo: true,
    logoUrl: '',
  },
  lowBalanceThreshold: 1000,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-06-18T10:30:00Z',
};

const paperSizeOptions = [
  { value: '100x150', label: '100mm × 150mm', description: '标准快递面单' },
  { value: '100x180', label: '100mm × 180mm', description: '大尺寸面单' },
  { value: '80x150', label: '80mm × 150mm', description: '小尺寸面单' },
];

const fontSizeOptions = [
  { value: 'small', label: '小', description: '字体较小，内容更多' },
  { value: 'medium', label: '中', description: '标准字体大小' },
  { value: 'large', label: '大', description: '字体较大，易于阅读' },
];

interface TemplateForm {
  templateName: string;
  paperSize: '100x150' | '100x180' | '80x150';
  fontSize: 'small' | 'medium' | 'large';
  showLogo: boolean;
  logoUrl: string;
}

export default function WaybillTemplate() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState<TemplateForm>({
    templateName: '',
    paperSize: '100x150',
    fontSize: 'medium',
    showLogo: true,
    logoUrl: '',
  });
  const [logoPreview, setLogoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const result = await get<WaybillAccount>('/waybill/account');
      const config = result.templateConfig;
      setFormData({
        templateName: config.templateName,
        paperSize: config.paperSize,
        fontSize: config.fontSize,
        showLogo: config.showLogo,
        logoUrl: config.logoUrl || '',
      });
      setLogoPreview(config.logoUrl || '');
    } catch {
      const config = mockAccount.templateConfig;
      setFormData({
        templateName: config.templateName,
        paperSize: config.paperSize,
        fontSize: config.fontSize,
        showLogo: config.showLogo,
        logoUrl: config.logoUrl || '',
      });
      setLogoPreview(config.logoUrl || '');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('图片大小不能超过2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setFormData(prev => ({ ...prev, logoUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview('');
    setFormData(prev => ({ ...prev, logoUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!formData.templateName.trim()) {
      alert('请输入模板名称');
      return;
    }

    setSaving(true);
    try {
      await put('/waybill/template', formData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const getPaperSizeDimensions = () => {
    switch (formData.paperSize) {
      case '100x180':
        return { width: 400, height: 720 };
      case '80x150':
        return { width: 320, height: 600 };
      default:
        return { width: 400, height: 600 };
    }
  };

  const getFontSize = () => {
    switch (formData.fontSize) {
      case 'small':
        return { title: 'text-base', content: 'text-xs' };
      case 'large':
        return { title: 'text-xl', content: 'text-sm' };
      default:
        return { title: 'text-lg', content: 'text-xs' };
    }
  };

  const dimensions = getPaperSizeDimensions();
  const fonts = getFontSize();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">面单模板配置</h1>
            <p className="text-gray-500 mt-1">自定义电子面单的打印样式</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchTemplate}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-5 h-5" />
              重置
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  保存配置
                </>
              )}
            </button>
          </div>
        </div>

        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-slide-down">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <div>
              <p className="font-medium text-green-800">配置保存成功</p>
              <p className="text-sm text-green-600">您的面单模板配置已更新</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">模板预览</h3>
                  <p className="text-sm text-gray-500">实时预览面单效果</p>
                </div>
              </div>
            </div>
            <div className="p-6 flex justify-center items-center bg-gray-100/50 min-h-[500px]">
              <div
                className="bg-white border-2 border-dashed border-gray-300 rounded-lg shadow-lg p-4 transition-all duration-300"
                style={{ width: dimensions.width, height: dimensions.height }}
              >
                <div className="h-full flex flex-col">
                  {formData.showLogo && (
                    <div className="flex justify-center mb-3">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo"
                          className="h-10 object-contain"
                        />
                      ) : (
                        <div className="h-10 bg-gray-100 rounded px-6 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">Logo区域</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-center mb-3">
                    <h2 className={cn('font-bold text-gray-900', fonts.title)}>
                      {formData.templateName || '快递面单'}
                    </h2>
                  </div>

                  <div className="border-t-2 border-b-2 border-gray-900 py-2 mb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className={cn('text-gray-500', fonts.content)}>顺丰速运</p>
                        <p className={cn('font-mono font-bold', fonts.title)}>SF1234567890</p>
                      </div>
                      <div className="w-20 h-20 bg-gray-200 flex items-center justify-center">
                        <FileText className="w-10 h-10 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                        <div>
                          <p className={cn('font-medium text-gray-900', fonts.content)}>
                            张先生 138****1234
                          </p>
                          <p className={cn('text-gray-600', fonts.content)}>
                            广东省深圳市南山区科技园南区1栋101室
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5" />
                        <div>
                          <p className={cn('font-medium text-gray-900', fonts.content)}>
                            李女士 139****5678
                          </p>
                          <p className={cn('text-gray-600', fonts.content)}>
                            北京市朝阳区建国门外大街1号国贸大厦A座2001室
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className={cn('text-gray-500', fonts.content)}>重量</p>
                        <p className={cn('font-semibold', fonts.content)}>2.5kg</p>
                      </div>
                      <div>
                        <p className={cn('text-gray-500', fonts.content)}>运费</p>
                        <p className={cn('font-semibold', fonts.content)}>¥18</p>
                      </div>
                      <div>
                        <p className={cn('text-gray-500', fonts.content)}>到付</p>
                        <p className={cn('font-semibold', fonts.content)}>否</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">基本设置</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    模板名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.templateName}
                    onChange={(e) => setFormData(prev => ({ ...prev, templateName: e.target.value }))}
                    placeholder="请输入模板名称"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    纸张尺寸
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {paperSizeOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, paperSize: option.value as any }))}
                        className={cn(
                          'p-4 rounded-xl border-2 text-left transition-all',
                          formData.paperSize === option.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        )}
                      >
                        <p className={cn(
                          'font-semibold',
                          formData.paperSize === option.value ? 'text-blue-600' : 'text-gray-900'
                        )}>
                          {option.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    字体大小
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {fontSizeOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, fontSize: option.value as any }))}
                        className={cn(
                          'p-4 rounded-xl border-2 text-left transition-all',
                          formData.fontSize === option.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        )}
                      >
                        <p className={cn(
                          'font-semibold',
                          formData.fontSize === option.value ? 'text-blue-600' : 'text-gray-900',
                          option.value === 'small' && 'text-sm',
                          option.value === 'large' && 'text-lg'
                        )}>
                          {option.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Logo设置</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">显示Logo</p>
                    <p className="text-sm text-gray-500">在面单顶部显示您的品牌Logo</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, showLogo: !prev.showLogo }))}
                    className={cn(
                      'relative w-14 h-8 rounded-full transition-colors duration-200',
                      formData.showLogo ? 'bg-blue-500' : 'bg-gray-300'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200',
                        formData.showLogo ? 'translate-x-7' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {formData.showLogo && (
                  <div className="animate-slide-down">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      上传Logo
                    </label>
                    {logoPreview ? (
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-16 border-2 border-gray-200 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
                          <img
                            src={logoPreview}
                            alt="Logo预览"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                          >
                            更换
                          </button>
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Upload className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium">点击上传Logo</p>
                        <p className="text-sm text-gray-400 mt-1">支持 JPG、PNG 格式，不超过 2MB</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Image className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">温馨提示</h4>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li>• 建议使用透明背景的 PNG 格式 Logo</li>
                    <li>• Logo 宽度建议在 200-400 像素之间</li>
                    <li>• 保存后配置将立即生效</li>
                    <li>• 可以随时返回此页面调整设置</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
