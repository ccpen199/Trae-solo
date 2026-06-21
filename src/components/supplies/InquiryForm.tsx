import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { X, Send, Tag } from 'lucide-react';
import { suppliesAPI } from '@/services/api';
import type { Supply } from '../../../shared/types';

interface InquiryFormProps {
  supply: Supply;
  onClose: () => void;
  onSuccess?: () => void;
}

export const InquiryForm: React.FC<InquiryFormProps> = ({ supply, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    expectedPrice: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pricePerTon = Math.round(supply.price / supply.tonnage);

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
    if (!formData.message || formData.message.length < 10) {
      newErrors.message = '请至少输入10个字符的询价内容';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await suppliesAPI.createInquiry(
        supply.id,
        formData.message,
        formData.expectedPrice ? Number(formData.expectedPrice) : undefined
      );

      if (response.success) {
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('询价失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <CardHeader className="flex items-center justify-between border-b">
          <div>
            <h2 className="text-xl font-bold text-slate-800">在线询价</h2>
            <p className="text-sm text-slate-500 mt-1">向供应商发送您的采购意向</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-5">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={supply.images[0]}
                  alt={supply.categoryName}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">{supply.categoryName}</h3>
                  <p className="text-sm text-slate-500">{supply.supplierName}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">参考单价</span>
                  <p className="font-semibold text-green-600">¥{pricePerTon.toLocaleString()} 元/吨</p>
                </div>
                <div>
                  <span className="text-slate-500">总吨位</span>
                  <p className="font-semibold text-slate-800">{supply.tonnage} 吨</p>
                </div>
                <div>
                  <span className="text-slate-500">纯度</span>
                  <p className="font-semibold text-slate-800">{supply.purity}%</p>
                </div>
              </div>
            </div>

            <Input
              label="期望价格（选填）"
              type="number"
              icon={<Tag className="w-4 h-4" />}
              placeholder="元/吨"
              min="0"
              value={formData.expectedPrice}
              onChange={(e) => handleChange('expectedPrice', e.target.value)}
            />

            <Textarea
              label="询价内容 *"
              placeholder="请详细描述您的采购需求，如预计采购量、期望交货地点、交货时间、付款方式等...（至少10个字符）"
              rows={5}
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              error={errors.message}
            />

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-700">
              <p className="flex items-start gap-2">
                <span className="text-base">💡</span>
                提示：发送询价后，供应商将收到短信和站内信双重通知，通常24小时内会收到回复。您的联系方式仅对该供应商可见。
              </p>
            </div>
          </CardContent>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              取消
            </Button>
            <Button type="submit" isLoading={loading}>
              {loading ? (
                <>发送中...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  发送询价
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
