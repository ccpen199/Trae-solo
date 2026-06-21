import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { X, Upload, Image, MapPin, Weight, Droplets, Tag } from 'lucide-react';
import { CATEGORIES, PROVINCES, type Supply } from '../../../shared/types';
import { suppliesAPI } from '@/services/api';

interface SupplyFormProps {
  onClose: () => void;
  onSuccess?: (supplyId: string) => void;
}

export const SupplyForm: React.FC<SupplyFormProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: '',
    tonnage: '',
    purity: '',
    price: '',
    province: '',
    city: '',
    address: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.categoryId) newErrors.categoryId = '请选择品类';
    if (!formData.tonnage || Number(formData.tonnage) <= 0) newErrors.tonnage = '请输入有效吨位';
    if (!formData.purity || Number(formData.purity) <= 0 || Number(formData.purity) > 100) newErrors.purity = '请输入0-100之间的纯度';
    if (!formData.price || Number(formData.price) <= 0) newErrors.price = '请输入有效价格';
    if (!formData.province) newErrors.province = '请选择省份';
    if (!formData.city) newErrors.city = '请输入城市';
    if (!formData.address) newErrors.address = '请输入详细地址';
    if (!formData.description) newErrors.description = '请输入货源描述';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const category = CATEGORIES.find(c => c.id === formData.categoryId);
      const province = PROVINCES.find(p => p.code === formData.province);
      
      const response = await suppliesAPI.create({
        categoryId: formData.categoryId,
        categoryName: category?.name || '',
        tonnage: Number(formData.tonnage),
        purity: Number(formData.purity),
        price: Number(formData.price),
        unit: category?.unit || '元/吨',
        province: province?.name || '',
        city: formData.city,
        address: formData.address,
        description: formData.description,
        images: [
          `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(category?.name || 'scrap metal')}%20recycling%20material%20industrial&image_size=square_hd`,
        ],
      });

      if (response.success) {
        onSuccess?.(response.data?.supplyId || '');
        onClose();
      }
    } catch (error) {
      console.error('发布失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex items-center justify-between sticky top-0 bg-white z-10 border-b">
          <div>
            <h2 className="text-xl font-bold text-slate-800">发布货源</h2>
            <p className="text-sm text-slate-500 mt-1">填写详细信息，让采购商快速找到您</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </CardHeader>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="废料品类 *"
                icon={<Tag className="w-4 h-4" />}
                options={[
                  { value: '', label: '请选择品类' },
                  ...CATEGORIES.map(c => ({ value: c.id, label: `${c.name} (${c.code})` })),
                ]}
                value={formData.categoryId}
                onChange={(e) => handleChange('categoryId', e.target.value)}
                error={errors.categoryId}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="总吨位 *"
                  type="number"
                  icon={<Weight className="w-4 h-4" />}
                  placeholder="吨"
                  min="0"
                  step="0.01"
                  value={formData.tonnage}
                  onChange={(e) => handleChange('tonnage', e.target.value)}
                  error={errors.tonnage}
                />
                <Input
                  label="纯度 *"
                  type="number"
                  icon={<Droplets className="w-4 h-4" />}
                  placeholder="%"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.purity}
                  onChange={(e) => handleChange('purity', e.target.value)}
                  error={errors.purity}
                />
              </div>
            </div>

            <Input
              label="总价格 *"
              type="number"
              icon={<Tag className="w-4 h-4" />}
              placeholder="元"
              min="0"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
              error={errors.price}
            />

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">预估单价</span>
                <span className="text-lg font-bold text-green-600">
                  {formData.tonnage && Number(formData.tonnage) > 0
                    ? `¥${Math.round(Number(formData.price) / Number(formData.tonnage)).toLocaleString()} 元/吨`
                    : '请输入吨位和价格'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="省份 *"
                icon={<MapPin className="w-4 h-4" />}
                options={[
                  { value: '', label: '请选择省份' },
                  ...PROVINCES.map(p => ({ value: p.code, label: p.name })),
                ]}
                value={formData.province}
                onChange={(e) => handleChange('province', e.target.value)}
                error={errors.province}
              />
              <Input
                label="城市 *"
                icon={<MapPin className="w-4 h-4" />}
                placeholder="如：深圳市"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                error={errors.city}
              />
              <Input
                label="详细地址 *"
                icon={<MapPin className="w-4 h-4" />}
                placeholder="街道门牌号"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                error={errors.address}
              />
            </div>

            <Textarea
              label="货源描述 *"
              placeholder="请详细描述货源情况，如废料来源、包装方式、可发货时间等...（50-500字）"
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              error={errors.description}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Image className="w-4 h-4 inline mr-2" />
                货源图片
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-green-500 hover:text-green-500 transition-colors cursor-pointer"
                  >
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-xs">上传图片</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">支持 JPG、PNG 格式，单张不超过 5MB，最多上传4张</p>
            </div>
          </CardContent>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              取消
            </Button>
            <Button type="submit" isLoading={loading}>
              {loading ? '发布中...' : '立即发布'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
