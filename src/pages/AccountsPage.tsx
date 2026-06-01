import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, PlusCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import {
  formatCurrency,
  getAccountTypeLabel,
  getAccountTypeColor,
  getAccountTypeTextColor,
  isAssetAccount,
  isLiabilityAccount,
} from '../utils/format';

const ACCOUNT_TYPES = [
  { value: 'cash', label: '现金', category: 'asset' },
  { value: 'bank_card', label: '银行卡', category: 'asset' },
  { value: 'fund', label: '基金', category: 'asset' },
  { value: 'stock', label: '股票', category: 'asset' },
  { value: 'real_estate', label: '房产', category: 'asset' },
  { value: 'vehicle', label: '车辆', category: 'asset' },
  { value: 'other_asset', label: '其他资产', category: 'asset' },
  { value: 'loan', label: '贷款', category: 'liability' },
  { value: 'credit_card', label: '信用卡', category: 'liability' },
  { value: 'other_liability', label: '其他负债', category: 'liability' },
];

interface AccountFormData {
  name: string;
  type: string;
  currency: string;
  currentValue: number;
  costBasis: number;
  description: string;
}

export const AccountsPage: React.FC = () => {
  const { accounts, isLoading, loadAccounts, addAccount, updateAccount, deleteAccount } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'asset' | 'liability'>('all');
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    type: 'bank_card',
    currency: 'CNY',
    currentValue: 0,
    costBasis: 0,
    description: '',
  });

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const filteredAccounts = accounts.filter((acc) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'asset') return isAssetAccount(acc.type);
    return isLiabilityAccount(acc.type);
  });

  const totalAssets = accounts
    .filter((acc) => isAssetAccount(acc.type))
    .reduce((sum, acc) => sum + acc.currentValue, 0);

  const totalLiabilities = accounts
    .filter((acc) => isLiabilityAccount(acc.type))
    .reduce((sum, acc) => sum + Math.abs(acc.currentValue), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, formData);
      } else {
        await addAccount(formData);
      }
      closeModal();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      currency: account.currency,
      currentValue: account.currentValue,
      costBasis: account.costBasis,
      description: account.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (account: any) => {
    if (confirm(`确定要删除账户「${account.name}」吗？相关的交易记录将被保留。`)) {
      try {
        await deleteAccount(account.id);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAccount(null);
    setFormData({
      name: '',
      type: 'bank_card',
      currency: 'CNY',
      currentValue: 0,
      costBasis: 0,
      description: '',
    });
  };

  const getProfit = (acc: any) => acc.currentValue - acc.costBasis;
  const getProfitRate = (acc: any) =>
    acc.costBasis > 0 ? (acc.currentValue - acc.costBasis) / acc.costBasis : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">账户管理</h1>
          <p className="text-slate-500 text-sm mt-1">管理您的所有资产和负债账户</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          新增账户
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500 mb-1">总资产</p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalAssets)}</p>
          <p className="text-xs text-slate-400 mt-1">
            {accounts.filter((a) => isAssetAccount(a.type)).length} 个资产账户
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500 mb-1">总负债</p>
          <p className="text-2xl font-bold text-rose-600">{formatCurrency(totalLiabilities)}</p>
          <p className="text-xs text-slate-400 mt-1">
            {accounts.filter((a) => isLiabilityAccount(a.type)).length} 个负债账户
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500 mb-1">净资产</p>
          <p className={`text-2xl font-bold ${totalAssets - totalLiabilities >= 0 ? 'text-primary-600' : 'text-rose-600'}`}>
            {formatCurrency(totalAssets - totalLiabilities)}
          </p>
          <p className="text-xs text-slate-400 mt-1">{accounts.length} 个账户总计</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="flex border-b border-slate-100">
          {[
            { key: 'all', label: '全部' },
            { key: 'asset', label: '资产' },
            { key: 'liability', label: '负债' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === tab.key
                  ? 'text-primary-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">加载中...</div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <PlusCircle className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 mb-2">暂无账户</p>
            <p className="text-sm text-slate-400 mb-4">点击上方按钮添加您的第一个账户</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              + 新增账户
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAccounts.map((account) => {
              const profit = getProfit(account);
              const profitRate = getProfitRate(account);
              return (
                <div
                  key={account.id}
                  className="p-5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl ${getAccountTypeColor(
                          account.type
                        )} flex items-center justify-center text-white font-medium flex-shrink-0`}
                      >
                        {account.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-800">{account.name}</h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              isAssetAccount(account.type)
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {getAccountTypeLabel(account.type)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          {account.description || '暂无描述'}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-slate-400">
                            成本: {formatCurrency(account.costBasis, account.currency)}
                          </span>
                          {isAssetAccount(account.type) && (
                            <span
                              className={`text-xs flex items-center gap-1 ${
                                profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {profit >= 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {profit >= 0 ? '+' : ''}
                              {formatCurrency(profit, account.currency)}
                              <span className="text-slate-400">
                                ({profitRate >= 0 ? '+' : ''}
                                {(profitRate * 100).toFixed(2)}%)
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="text-right">
                        <p
                          className={`text-xl font-bold ${getAccountTypeTextColor(
                            account.type
                          )}`}
                        >
                          {formatCurrency(account.currentValue, account.currency)}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          更新于 {new Date(account.updatedAt).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleEdit(account)}
                          className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(account)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              {editingAccount ? '编辑账户' : '新增账户'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  账户名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="如：工资卡、支付宝、房贷"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  账户类型
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ACCOUNT_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                        formData.type === type.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={type.value}
                        checked={formData.type === type.value}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm">{type.label}</span>
                      <span
                        className={`text-xs ml-auto ${
                          type.category === 'asset' ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {type.category === 'asset' ? '资产' : '负债'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    当前市值
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.currentValue}
                    onChange={(e) =>
                      setFormData({ ...formData, currentValue: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    成本/本金
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costBasis}
                    onChange={(e) =>
                      setFormData({ ...formData, costBasis: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  备注
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
                  rows={2}
                  placeholder="可选"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all"
                >
                  {editingAccount ? '保存修改' : '创建账户'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
