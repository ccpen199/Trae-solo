import { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Star,
  Phone,
  User,
  Building2,
  Loader2,
  CheckCircle,
  Send
} from 'lucide-react';
import { get, post, put } from '@/utils/api';
import { cn } from '@/lib/utils';
import { Modal, ModalFooter } from '@/components/Modal';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import type { BankCard } from 'shared/types';

const bankColors: Record<string, string> = {
  '中国工商银行': 'bg-gradient-to-br from-red-500 to-red-700',
  '中国建设银行': 'bg-gradient-to-br from-blue-500 to-blue-700',
  '招商银行': 'bg-gradient-to-br from-cyan-500 to-cyan-700',
  '中国银行': 'bg-gradient-to-br from-orange-500 to-orange-700',
  '中国农业银行': 'bg-gradient-to-br from-green-500 to-green-700',
  '交通银行': 'bg-gradient-to-br from-indigo-500 to-indigo-700',
};

interface FormData {
  bankName: string;
  bankBranch: string;
  cardNumber: string;
  cardHolder: string;
  phone: string;
}

interface FormErrors {
  bankName?: string;
  bankBranch?: string;
  cardNumber?: string;
  cardHolder?: string;
  phone?: string;
}

export default function BankCardManage() {
  const { hasRole } = useAuthStore();
  const { addNotification } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<BankCard[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    bankName: '',
    bankBranch: '',
    cardNumber: '',
    cardHolder: '',
    phone: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = hasRole(['admin']);
  const isOperator = hasRole(['operator']);
  const canAdd = isAdmin;

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const result = await get<BankCard[]>('/finance/bank-cards');
      setCards(result);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: '加载失败',
        message: error.message || '获取银行卡列表失败'
      });
    } finally {
      setLoading(false);
    }
  };

  const maskCardNumber = (number: string) => {
    if (number.length <= 8) return number;
    return `${number.slice(0, 4)}****${number.slice(-4)}`;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.bankName.trim()) {
      newErrors.bankName = '请选择银行';
    }
    if (!formData.bankBranch.trim()) {
      newErrors.bankBranch = '请输入开户支行';
    }
    if (!formData.cardNumber.trim()) {
      newErrors.cardNumber = '请输入银行卡号';
    } else if (!/^\d{16,19}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = '请输入正确的银行卡号';
    }
    if (!formData.cardHolder.trim()) {
      newErrors.cardHolder = '请输入持卡人姓名';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = '请输入手机号';
    } else if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = '请输入正确的手机号';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const cardNumber = formData.cardNumber.replace(/\s/g, '');
      await post('/finance/bank-cards', {
        bankName: formData.bankName,
        bankBranch: formData.bankBranch,
        cardNumber,
        cardHolder: formData.cardHolder,
        phone: formData.phone,
      });
      addNotification({ type: 'success', title: '添加成功', message: '银行卡已添加' });
      setIsModalOpen(false);
      resetForm();
      fetchCards();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: '添加失败',
        message: error.message || '银行卡添加失败'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (cardId: string) => {
    try {
      await put(`/finance/bank-cards/${cardId}/default`);
      setCards(prev => prev.map(card => ({
        ...card,
        isDefault: card.id === cardId,
      })));
      addNotification({ type: 'success', title: '设置成功', message: '已设为默认银行卡' });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: '设置失败',
        message: error.message || '设置默认银行卡失败'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      bankName: '',
      bankBranch: '',
      cardNumber: '',
      cardHolder: '',
      phone: '',
    });
    setErrors({});
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">银行卡管理</h1>
            <p className="text-gray-500 mt-1">{isOperator ? '查看所有网点银行卡' : '管理您的提现银行卡'}</p>
          </div>
          {canAdd && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-all hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              添加银行卡
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="text-gray-500 mt-4">加载中...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 flex flex-col items-center justify-center text-gray-400 border border-gray-100">
            <CreditCard className="w-20 h-20 mb-4 opacity-50" />
            <p className="text-lg font-medium">暂无绑定银行卡</p>
            <p className="text-sm mt-1">{canAdd ? '点击上方按钮添加您的第一张银行卡' : '暂无银行卡数据'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => {
              const colorClass = bankColors[card.bankName] || 'bg-gradient-to-br from-gray-500 to-gray-700';
              return (
                <div
                  key={card.id}
                  className={cn(
                    'rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group',
                    colorClass,
                    'hover:scale-[1.02] transition-all duration-300 hover:shadow-xl'
                  )}
                >
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute left-0 bottom-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{card.bankName}</p>
                          <p className="text-white/70 text-sm">{card.bankBranch}</p>
                        </div>
                      </div>
                      {card.isDefault && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                          <Star className="w-3 h-3 fill-current" />
                          默认
                        </span>
                      )}
                    </div>

                    <p className="text-2xl font-mono font-bold tracking-wider mb-6">
                      {maskCardNumber(card.cardNumber)}
                    </p>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-white/80">
                        <User className="w-4 h-4" />
                        <span className="text-sm">{card.cardHolder}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/80">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">{card.phone}</span>
                      </div>
                    </div>

                    {!card.verified && (
                      <div className="mb-4 flex items-center gap-2 text-yellow-300 text-sm">
                        <Building2 className="w-4 h-4" />
                        <span>待审核</span>
                      </div>
                    )}
                    {card.verified && (
                      <div className="mb-4 flex items-center gap-2 text-green-300 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>已认证</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {canAdd && !card.isDefault && (
                        <button
                          onClick={() => handleSetDefault(card.id)}
                          className="flex-1 px-4 py-2 bg-white/20 text-white rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
                        >
                          设为默认
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="添加银行卡"
        size="lg"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                银行名称 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.bankName}
                onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                className={cn(
                  'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
                  errors.bankName ? 'border-red-300 bg-red-50' : 'border-gray-200'
                )}
              >
                <option value="">请选择银行</option>
                {Object.keys(bankColors).map(bank => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
              {errors.bankName && <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                开户支行 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="如：深圳市分行东门支行"
                value={formData.bankBranch}
                onChange={(e) => setFormData(prev => ({ ...prev, bankBranch: e.target.value }))}
                className={cn(
                  'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
                  errors.bankBranch ? 'border-red-300 bg-red-50' : 'border-gray-200'
                )}
              />
              {errors.bankBranch && <p className="text-red-500 text-xs mt-1">{errors.bankBranch}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              银行卡号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="请输入银行卡号"
              value={formData.cardNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 19);
                setFormData(prev => ({ ...prev, cardNumber: value }));
              }}
              className={cn(
                'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono',
                errors.cardNumber ? 'border-red-300 bg-red-50' : 'border-gray-200'
              )}
            />
            {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                持卡人姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="请输入持卡人姓名"
                value={formData.cardHolder}
                onChange={(e) => setFormData(prev => ({ ...prev, cardHolder: e.target.value }))}
                className={cn(
                  'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
                  errors.cardHolder ? 'border-red-300 bg-red-50' : 'border-gray-200'
                )}
              />
              {errors.cardHolder && <p className="text-red-500 text-xs mt-1">{errors.cardHolder}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                预留手机号 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="请输入银行预留手机号"
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                  setFormData(prev => ({ ...prev, phone: value }));
                }}
                className={cn(
                  'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
                  errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200'
                )}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>
        </div>

        <ModalFooter>
          <button
            onClick={() => setIsModalOpen(false)}
            className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                添加银行卡
              </>
            )}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
