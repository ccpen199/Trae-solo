import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiGet, apiPost, formatCurrency, formatDate, getStatusText, getStatusBadgeClass } from '../api';
import type { Photographer, Booking, ConflictCheckResult } from '../api';

const SHOOT_TYPES = ['婚纱', '写真', '亲子', '商业', '旅拍'];
const TIME_SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export default function BookingForm() {
  const { photographerId } = useParams<{ photographerId: string }>();
  const navigate = useNavigate();

  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState('');
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [success, setSuccess] = useState<Booking | null>(null);

  const [form, setForm] = useState({
    photographer_id: photographerId || '',
    client_name: '',
    shoot_type: '婚纱',
    shoot_date: '',
    shoot_time: '09:00',
    location: '',
    people_count: 1,
    requirements: '',
    budget: 0,
    client_phone: '',
    client_email: '',
    notes: '',
  });

  useEffect(() => {
    apiGet<Photographer[]>('/api/photographers')
      .then(setPhotographers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (photographerId) {
      setForm((prev) => ({ ...prev, photographer_id: photographerId }));
    }
  }, [photographerId]);

  useEffect(() => {
    if (!form.photographer_id || !form.shoot_date) {
      setConflict('');
      return;
    }
    setCheckingConflict(true);
    apiGet<ConflictCheckResult>(`/api/bookings/check-conflict?photographer_id=${form.photographer_id}&date=${form.shoot_date}`)
      .then((result) => {
        if (result.conflict) {
          setConflict(`该摄影师此日期已有预约：${result.existingBooking?.client_name || ''}`);
        } else {
          setConflict('');
        }
      })
      .catch(() => setConflict(''))
      .finally(() => setCheckingConflict(false));
  }, [form.photographer_id, form.shoot_date]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'people_count' || name === 'budget' ? Number(value) : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const created = await apiPost<Booking>('/api/bookings', {
        photographer_id: form.photographer_id ? Number(form.photographer_id) : null,
        client_name: form.client_name,
        shoot_type: form.shoot_type,
        shoot_date: form.shoot_date,
        shoot_time: form.shoot_time,
        location: form.location,
        people_count: form.people_count,
        requirements: form.requirements,
        budget: form.budget,
        client_phone: form.client_phone,
        client_email: form.client_email,
        notes: form.notes,
        status: 'pending',
      });
      setSuccess(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setSuccess(null);
    setForm({
      photographer_id: photographerId || '',
      client_name: '',
      shoot_type: '婚纱',
      shoot_date: '',
      shoot_time: '09:00',
      location: '',
      people_count: 1,
      requirements: '',
      budget: 0,
      client_phone: '',
      client_email: '',
      notes: '',
    });
  }

  if (loading) return <div className="loading">加载中...</div>;

  if (success) {
    return (
      <>
        <div className="page-header">
          <div>
            <h1>预约已提交</h1>
            <p>预约记录已保存，可创建订单或继续预约</p>
          </div>
          <Link to="/orders" className="btn btn-secondary">返回订单列表</Link>
        </div>
        <div className="card">
          <div className="notice success">
            预约创建成功！预约编号：{success.id}，客户：{success.client_name}
          </div>
          <div className="detail-grid" style={{ marginTop: 16 }}>
            <div className="detail-field">
              <div className="label">摄影师</div>
              <div className="value">{success.photographer_name || '未指定'}</div>
            </div>
            <div className="detail-field">
              <div className="label">拍摄类型</div>
              <div className="value">{success.shoot_type}</div>
            </div>
            <div className="detail-field">
              <div className="label">拍摄日期</div>
              <div className="value">{formatDate(success.shoot_date)} {success.shoot_time}</div>
            </div>
            <div className="detail-field">
              <div className="label">拍摄地点</div>
              <div className="value">{success.location || '-'}</div>
            </div>
            <div className="detail-field">
              <div className="label">客户姓名</div>
              <div className="value">{success.client_name}</div>
            </div>
            <div className="detail-field">
              <div className="label">联系电话</div>
              <div className="value">{success.client_phone || '-'}</div>
            </div>
            <div className="detail-field">
              <div className="label">预算</div>
              <div className="value">{formatCurrency(success.budget)}</div>
            </div>
            <div className="detail-field">
              <div className="label">状态</div>
              <div className="value">
                <span className={`badge ${getStatusBadgeClass(success.status)}`}>
                  {getStatusText(success.status)}
                </span>
              </div>
            </div>
            {success.requirements && (
              <div className="detail-field full-width">
                <div className="label">需求说明</div>
                <div className="value">{success.requirements}</div>
              </div>
            )}
          </div>
          <div className="action-row" style={{ marginTop: 16 }}>
            <Link to={`/orders?booking_id=${success.id}`} className="btn btn-primary">
              创建订单
            </Link>
            <button type="button" className="btn btn-secondary" onClick={handleReset}>
              继续预约
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>新建预约</h1>
          <p>填写客户和拍摄信息创建预约</p>
        </div>
        <Link to="/photographers" className="btn btn-secondary">选择摄影师</Link>
      </div>

      {error && <div className="notice error">{error}</div>}
      {conflict && <div className="notice error">{conflict}</div>}
      {checkingConflict && <div className="notice">正在检查档期可用性...</div>}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-grid">
          <div className="form-group">
            <label>摄影师 <span className="required">*</span></label>
            <select name="photographer_id" value={form.photographer_id} onChange={handleChange} required>
              <option value="">请选择摄影师</option>
              {photographers.map((p) => (
                <option key={p.id} value={p.id}>{p.name} - {p.style} ({p.city})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>拍摄类型 <span className="required">*</span></label>
            <select name="shoot_type" value={form.shoot_type} onChange={handleChange} required>
              {SHOOT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>拍摄日期 <span className="required">*</span></label>
            <input type="date" name="shoot_date" value={form.shoot_date} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>拍摄时间 <span className="required">*</span></label>
            <select name="shoot_time" value={form.shoot_time} onChange={handleChange} required>
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>拍摄地点 <span className="required">*</span></label>
            <input type="text" name="location" value={form.location} onChange={handleChange} required placeholder="请输入拍摄地点" />
          </div>

          <div className="form-group">
            <label>拍摄人数</label>
            <input type="number" name="people_count" value={form.people_count} onChange={handleChange} min={1} />
          </div>

          <div className="form-group">
            <label>预算 ({formatCurrency(0).charAt(0)})</label>
            <input type="number" name="budget" value={form.budget || ''} onChange={handleChange} min={0} placeholder="请输入预算金额" />
          </div>

          <div className="form-group">
            <label>客户姓名 <span className="required">*</span></label>
            <input type="text" name="client_name" value={form.client_name} onChange={handleChange} required placeholder="请输入客户姓名" />
          </div>

          <div className="form-group">
            <label>联系电话 <span className="required">*</span></label>
            <input type="tel" name="client_phone" value={form.client_phone} onChange={handleChange} required placeholder="请输入联系电话" />
          </div>

          <div className="form-group">
            <label>邮箱</label>
            <input type="email" name="client_email" value={form.client_email} onChange={handleChange} placeholder="请输入邮箱地址" />
          </div>

          <div className="form-group full-width">
            <label>拍摄需求</label>
            <textarea name="requirements" value={form.requirements} onChange={handleChange} placeholder="请详细描述拍摄需求、服装、场景等" />
          </div>

          <div className="form-group full-width">
            <label>备注</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="内部备注，客户不可见" />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting || !!conflict || checkingConflict}>
            {submitting ? '提交中...' : checkingConflict ? '检查档期...' : '提交预约'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            取消
          </button>
        </div>
      </form>
    </>
  );
}
