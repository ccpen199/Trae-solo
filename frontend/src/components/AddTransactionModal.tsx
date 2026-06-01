import React, { useState, useEffect } from 'react';
import { Toast, Loading } from 'antd-mobile';
import dayjs from 'dayjs';
import api from '../api/client';
import { useChatStore } from '../store/useChatStore';

interface Category {
  id: number;
  name: string;
  icon: string;
  type: string;
}

interface Account {
  id: number;
  name: string;
}

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  contactId?: number;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ visible, onClose, contactId }) => {
  const { sendTransactionMessage } = useChatStore();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [remark, setRemark] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, accRes] = await Promise.all([
        api.get('/transactions/categories'),
        api.get('/transactions/accounts')
      ]);
      
      if ((catRes as any).success) {
        const cats = (catRes as any).data.filter((c: Category) => c.type === type);
        setCategories(cats);
        if (cats.length > 0) setSelectedCategory(cats[0]);
      }
      if ((accRes as any).success) {
        const accs = (accRes as any).data;
        setAccounts(accs);
        if (accs.length > 0) setSelectedAccount(accs[0]);
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = categories.filter(c => c.type === type);
    if (filtered.length > 0 && !selectedCategory) {
      setSelectedCategory(filtered[0]);
    }
  }, [type, categories]);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Toast.show({ content: '请输入有效金额', icon: 'fail' });
      return;
    }
    if (!selectedCategory) {
      Toast.show({ content: '请选择分类', icon: 'fail' });
      return;
    }
    if (!selectedAccount) {
      Toast.show({ content: '请选择账户', icon: 'fail' });
      return;
    }

    setSubmitting(true);
    try {
      const response: any = await api.post('/transactions', {
        contact_id: contactId || null,
        category_id: selectedCategory.id,
        account_id: selectedAccount.id,
        amount: parseFloat(amount),
        type,
        remark,
        transaction_date: date
      });

      if (response.success) {
        Toast.show({ content: '记账成功', icon: 'success' });
        await sendTransactionMessage(response.data.id, contactId);
        setAmount('');
        setRemark('');
        onClose();
      }
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <span className="modal-title">记一笔</span>
          <span className="modal-close" onClick={onClose}>✕</span>
        </div>
        
        <div className="modal-body">
          <div className="type-selector">
            <button 
              className={`type-btn ${type === 'expense' ? 'active' : ''}`}
              onClick={() => setType('expense')}
            >
              支出
            </button>
            <button 
              className={`type-btn ${type === 'income' ? 'active' : ''}`}
              onClick={() => setType('income')}
            >
              收入
            </button>
          </div>

          <div className="amount-input-wrapper">
            <span className="currency-symbol">¥</span>
            <input
              type="number"
              className="amount-input"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              step="0.01"
              min="0"
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <Loading />
            </div>
          ) : (
            <div className="categories-grid">
              {categories.map(cat => (
                <div
                  key={cat.id}
                  className={`category-item ${selectedCategory?.id === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  <span className="category-icon">{cat.icon}</span>
                  <span className="category-name">{cat.name}</span>
                </div>
              ))}
            </div>
          )}

          <div className="form-row">
            <div className="form-item">
              <div className="form-label">日期</div>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div className="form-item">
              <div className="form-label">账户</div>
              <select
                className="form-select"
                value={selectedAccount?.id || ''}
                onChange={e => setSelectedAccount(accounts.find(a => a.id === parseInt(e.target.value)) || null)}
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-item" style={{ marginBottom: 20 }}>
            <div className="form-label">备注（可选）</div>
            <input
              type="text"
              className="form-input"
              placeholder="添加备注..."
              value={remark}
              onChange={e => setRemark(e.target.value)}
            />
          </div>

          <button 
            className="submit-btn" 
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <Loading /> : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTransactionModal;