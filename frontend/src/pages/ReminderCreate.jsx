import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { api } from '../utils/request';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';

const ReminderCreate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flashSale, setFlashSale] = useState(null);

  const [form, setForm] = useState({
    enabled: true,
    keyword: '',
    ringtone: 'default',
    vibration: true,
    advance_time: 5,
    repeat_type: 'once'
  });

  useEffect(() => {
    if (id) {
      fetchFlashSale();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchFlashSale = async () => {
    setLoading(true);
    try {
      const result = await api.get(`/flash-sale/${id}`);
      setFlashSale(result?.data);
    } catch (err) {
      showToast('获取商品信息失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/reminder/create', {
        flash_sale_id: id ? parseInt(id) : null,
        type: 'flash_sale',
        keyword: form.keyword || null,
        ringtone: form.ringtone,
        vibration: form.vibration,
        advance_time: form.advance_time,
        repeat_type: form.repeat_type
      });
      showToast('提醒设置成功', 'success');
      navigate('/reminders');
    } catch (err) {
      // 错误已处理
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <button style={styles.backButton} onClick={() => navigate(-1)}>
            ← 返回
          </button>
          <h1 style={styles.headerTitle}>设置提醒</h1>
        </div>
        <div style={styles.content}>
          <Loading message="加载中..." />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <h1 style={styles.headerTitle}>设置提醒</h1>
      </div>

      <div style={styles.content}>
        {flashSale && (
          <div style={styles.productCard}>
            {flashSale.product_thumb && (
              <img
                src={flashSale.product_thumb}
                alt={flashSale.product_name}
                style={styles.productThumb}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <div style={styles.productInfo}>
              <h3 style={styles.productName}>{flashSale.product_name}</h3>
              <div style={styles.priceRow}>
                <span style={styles.salePrice}>¥{flashSale.sale_price}</span>
                <span style={styles.originalPrice}>¥{flashSale.original_price}</span>
              </div>
              {flashSale.start_time && (
                <p style={styles.timeText}>
                  {dayjs(flashSale.start_time).format('MM月DD日 HH:mm')} 开始
                </p>
              )}
            </div>
          </div>
        )}

        <div style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>开启提醒</label>
            <label style={styles.switch}>
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              />
              <span style={styles.switchSlider}></span>
            </label>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>关键字标签</label>
            <input
              style={styles.input}
              type="text"
              placeholder="可选：自定义标签"
              value={form.keyword}
              onChange={(e) => setForm({ ...form, keyword: e.target.value })}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>提前提醒时间</label>
            <select
              style={styles.select}
              value={form.advance_time}
              onChange={(e) => setForm({ ...form, advance_time: parseInt(e.target.value) })}
            >
              <option value={1}>提前 1 分钟</option>
              <option value={5}>提前 5 分钟</option>
              <option value={10}>提前 10 分钟</option>
              <option value={15}>提前 15 分钟</option>
              <option value={30}>提前 30 分钟</option>
              <option value={60}>提前 1 小时</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>铃声</label>
            <select
              style={styles.select}
              value={form.ringtone}
              onChange={(e) => setForm({ ...form, ringtone: e.target.value })}
            >
              <option value="default">默认铃声</option>
              <option value="bell">清脆铃声</option>
              <option value="alarm">闹钟铃声</option>
              <option value="chime">叮咚提示</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>震动</label>
            <label style={styles.switch}>
              <input
                type="checkbox"
                checked={form.vibration}
                onChange={(e) => setForm({ ...form, vibration: e.target.checked })}
              />
              <span style={styles.switchSlider}></span>
            </label>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>重复提醒</label>
            <select
              style={styles.select}
              value={form.repeat_type}
              onChange={(e) => setForm({ ...form, repeat_type: e.target.value })}
            >
              <option value="once">仅一次</option>
              <option value="daily">每天</option>
              <option value="weekly">每周</option>
            </select>
          </div>
        </div>

        <button
          style={{
            ...styles.saveButton,
            ...(saving ? styles.saveButtonDisabled : {})
          }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '保存中...' : '保存提醒'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: '16px 20px',
    borderBottom: '1px solid #eee'
  },
  backButton: {
    padding: '8px 16px 8px 8px',
    fontSize: '16px',
    color: '#666',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer'
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginLeft: '8px'
  },
  content: {
    padding: '16px'
  },
  productCard: {
    display: 'flex',
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  productThumb: {
    width: '80px',
    height: '80px',
    borderRadius: '8px',
    objectFit: 'cover',
    marginRight: '12px'
  },
  productInfo: {
    flex: 1,
    minWidth: 0
  },
  productName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px'
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    marginBottom: '4px'
  },
  salePrice: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#ff4757'
  },
  originalPrice: {
    fontSize: '13px',
    color: '#999',
    textDecoration: 'line-through'
  },
  timeText: {
    fontSize: '12px',
    color: '#ff6b81'
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px'
  },
  formGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 0',
    borderBottom: '1px solid #f0f0f0'
  },
  label: {
    fontSize: '14px',
    color: '#333'
  },
  input: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    outline: 'none',
    width: '180px',
    textAlign: 'right'
  },
  select: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: '#fff',
    width: '180px'
  },
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: '44px',
    height: '24px'
  },
  switchSlider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ccc',
    transition: '.4s',
    borderRadius: '24px'
  },
  saveButton: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#ff4757',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer'
  },
  saveButtonDisabled: {
    backgroundColor: '#ff9ba2',
    cursor: 'not-allowed'
  }
};

export default ReminderCreate;
