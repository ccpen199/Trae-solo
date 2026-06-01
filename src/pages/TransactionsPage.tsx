import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ArrowRightLeft, Search, Filter, ChevronDown } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { formatCurrency, formatDate, getAccountTypeLabel } from '../utils/format';

export const TransactionsPage: React.FC = () => {
  const {
    accounts,
    transactions,
    categories,
    tags,
    isLoading,
    loadAccounts,
    loadTransactions,
    loadCategories,
    loadTags,
    addTransaction,
    addTransfer,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    amount: 0,
    type: 'expense' as 'income' | 'expense',
    categoryId: 0,
    fromAccountId: 0,
    toAccountId: 0,
    transactionDate: new Date().toISOString().split('T')[0],
    description: '',
    note: '',
    member: '',
    project: '',
    tagIds: [] as number[],
  });

  useEffect(() => {
    loadAccounts();
    loadTransactions();
    loadCategories();
    loadTags();
  }, [loadAccounts, loadTransactions, loadCategories, loadTags]);

  const filteredTransactions = transactions
    .filter((t) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'transfer') return t.isTransfer;
      return t.type === activeTab;
    })
    .filter((t) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        t.description?.toLowerCase().includes(query) ||
        t.note?.toLowerCase().includes(query) ||
        t.category?.name?.toLowerCase().includes(query) ||
        t.fromAccount?.name?.toLowerCase().includes(query) ||
        t.toAccount?.name?.toLowerCase().includes(query)
      );
    });

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalType === 'transfer') {
        await addTransfer({
          fromAccountId: formData.fromAccountId,
          toAccountId: formData.toAccountId,
          amount: formData.amount,
          transactionDate: formData.transactionDate,
          description: formData.description,
          note: formData.note,
        });
      } else {
        await addTransaction({
          ...formData,
          type: modalType,
        });
      }
      closeModal();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openModal = (type: 'income' | 'expense' | 'transfer') => {
    setModalType(type);
    setFormData({
      amount: 0,
      type: type === 'transfer' ? 'expense' : type,
      categoryId: type === 'income' ? (incomeCategories[0]?.id || 0) : (expenseCategories[0]?.id || 0),
      fromAccountId: accounts[0]?.id || 0,
      toAccountId: accounts[1]?.id || 0,
      transactionDate: new Date().toISOString().split('T')[0],
      description: '',
      note: '',
      member: '',
      project: '',
      tagIds: [],
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const getCategoryColor = (type: string) => {
    return type === 'income' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">收支流水</h1>
          <p className="text-slate-500 text-sm mt-1">记录和管理您的收入、支出和转账</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => openModal('income')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            记收入
          </button>
          <button
            onClick={() => openModal('expense')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all"
          >
            <Plus className="w-4 h-4" />
            记支出
          </button>
          <button
            onClick={() => openModal('transfer')}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all"
          >
            <ArrowRightLeft className="w-4 h-4" />
            转账
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="p-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索描述、分类、账户..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm"
              />
            </div>
            <div className="flex gap-2">
              {[
                { key: 'all', label: '全部' },
                { key: 'income', label: '收入' },
                { key: 'expense', label: '支出' },
                { key: 'transfer', label: '转账' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeTab === tab.key
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">加载中...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 mb-2">暂无记录</p>
            <p className="text-sm text-slate-400">点击上方按钮开始记账</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        tx.isTransfer
                          ? 'bg-slate-100 text-slate-600'
                          : getCategoryColor(tx.type)
                      }`}
                    >
                      {tx.isTransfer ? (
                        <ArrowRightLeft className="w-5 h-5" />
                      ) : tx.type === 'income' ? (
                        <span className="text-lg">↑</span>
                      ) : (
                        <span className="text-lg">↓</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800">
                          {tx.description || tx.category?.name || '未命名'}
                        </p>
                        {tx.isTransfer ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            转账
                          </span>
                        ) : (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              tx.type === 'income'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {tx.category?.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span>{formatDate(tx.transactionDate)}</span>
                        {tx.isTransfer ? (
                          <span>
                            {tx.fromAccount?.name} → {tx.toAccount?.name}
                          </span>
                        ) : (
                          <span>{tx.fromAccount?.name}</span>
                        )}
                        {tx.member && <span>· {tx.member}</span>}
                        {tx.project && <span>· {tx.project}</span>}
                      </div>
                      {tx.note && (
                        <p className="text-xs text-slate-400 mt-1">{tx.note}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p
                      className={`text-lg font-bold ${
                        tx.isTransfer
                          ? 'text-slate-700'
                          : tx.type === 'income'
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {tx.isTransfer
                        ? formatCurrency(tx.amount)
                        : `${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              {modalType === 'income'
                ? '记录收入'
                : modalType === 'expense'
                ? '记录支出'
                : '记录转账'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  金额
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-3 text-xl font-semibold border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="0.00"
                  required
                />
              </div>

              {modalType !== 'transfer' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    分类
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(modalType === 'income' ? incomeCategories : expenseCategories).map(
                      (cat) => (
                        <label
                          key={cat.id}
                          className={`flex items-center justify-center p-2.5 border rounded-lg cursor-pointer text-sm transition-all ${
                            formData.categoryId === cat.id
                              ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="category"
                            value={cat.id}
                            checked={formData.categoryId === cat.id}
                            onChange={() =>
                              setFormData({ ...formData, categoryId: cat.id })
                            }
                            className="sr-only"
                          />
                          {cat.name}
                        </label>
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {modalType === 'transfer' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        转出账户
                      </label>
                      <select
                        value={formData.fromAccountId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fromAccountId: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                        required
                      >
                        <option value="">选择账户</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} ({formatCurrency(acc.currentValue, acc.currency)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        转入账户
                      </label>
                      <select
                        value={formData.toAccountId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            toAccountId: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                        required
                      >
                        <option value="">选择账户</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} ({formatCurrency(acc.currentValue, acc.currency)})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      账户
                    </label>
                    <select
                      value={formData.fromAccountId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fromAccountId: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                      required
                    >
                      <option value="">选择账户</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({formatCurrency(acc.currentValue, acc.currency)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    日期
                  </label>
                  <input
                    type="date"
                    value={formData.transactionDate}
                    onChange={(e) =>
                      setFormData({ ...formData, transactionDate: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  描述
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="如：午餐、工资、房租"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    成员
                  </label>
                  <input
                    type="text"
                    value={formData.member}
                    onChange={(e) => setFormData({ ...formData, member: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    placeholder="如：本人、配偶"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    项目
                  </label>
                  <input
                    type="text"
                    value={formData.project}
                    onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    placeholder="如：旅行、装修"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  备注
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
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
                  className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-all ${
                    modalType === 'income'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800'
                  }`}
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
