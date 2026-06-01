import { useState } from 'react';
import { shipments } from '../api';

export default function ShipmentCreate() {
  const [form, setForm] = useState({
    shipper_name: '', shipper_phone: '', shipper_address: '',
    consignee_name: '', consignee_phone: '', consignee_address: '',
    pieces: '', weight: '', length: '', width: '', height: '',
    product_name: '', is_dangerous: false, is_battery: false,
    origin: '', destination: '', flight_no: '', flight_date: '', service_level: 'standard'
  });

  const [volumeWeight, setVolumeWeight] = useState(null);
  const [chargeableWeight, setChargeableWeight] = useState(null);

  function updateField(name, value) {
    setForm(f => ({ ...f, [name]: value }));
    if (['pieces', 'length', 'width', 'height', 'weight'].includes(name)) {
      setTimeout(calcVolumeWeight, 100);
    }
  }

  function calcVolumeWeight() {
    if (form.pieces && form.length && form.width && form.height) {
      const vw = (parseFloat(form.length) * parseFloat(form.width) * parseFloat(form.height) * parseInt(form.pieces)) / 6000;
      setVolumeWeight(vw.toFixed(2));
      setChargeableWeight(Math.max(vw, parseFloat(form.weight) || 0).toFixed(2));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const result = await shipments.create({
        ...form,
        pieces: parseInt(form.pieces),
        weight: parseFloat(form.weight),
        length: form.length ? parseFloat(form.length) : null,
        width: form.width ? parseFloat(form.width) : null,
        height: form.height ? parseFloat(form.height) : null
      });
      if (result.id) {
        alert('运单创建成功！');
        window.location.href = `/shipments/${result.id}`;
      } else {
        alert('创建失败: ' + (result.error || '未知错误'));
      }
    } catch (err) {
      alert('创建失败: ' + err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>新建运单</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h2>发货人信息</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>姓名 *</label>
              <input required value={form.shipper_name} onChange={e => updateField('shipper_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label>电话</label>
              <input value={form.shipper_phone} onChange={e => updateField('shipper_phone', e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>地址</label>
              <input value={form.shipper_address} onChange={e => updateField('shipper_address', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card">
          <h2>收货人信息</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>姓名 *</label>
              <input required value={form.consignee_name} onChange={e => updateField('consignee_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label>电话</label>
              <input value={form.consignee_phone} onChange={e => updateField('consignee_phone', e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>地址</label>
              <input value={form.consignee_address} onChange={e => updateField('consignee_address', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card">
          <h2>货物信息</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>品名 *</label>
              <input required value={form.product_name} onChange={e => updateField('product_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label>件数 *</label>
              <input type="number" required min="1" value={form.pieces} onChange={e => updateField('pieces', e.target.value)} />
            </div>
            <div className="form-group">
              <label>实际重量(kg) *</label>
              <input type="number" required min="0.01" step="0.01" value={form.weight} onChange={e => updateField('weight', e.target.value)} />
            </div>
            <div className="form-group">
              <label>长(cm)</label>
              <input type="number" min="0" step="0.1" value={form.length} onChange={e => updateField('length', e.target.value)} />
            </div>
            <div className="form-group">
              <label>宽(cm)</label>
              <input type="number" min="0" step="0.1" value={form.width} onChange={e => updateField('width', e.target.value)} />
            </div>
            <div className="form-group">
              <label>高(cm)</label>
              <input type="number" min="0" step="0.1" value={form.height} onChange={e => updateField('height', e.target.value)} />
            </div>
          </div>

          {volumeWeight && (
            <div style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '0.5rem', margin: '1rem 0' }}>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <span>体积重: <strong>{volumeWeight}kg</strong></span>
                <span>计费重: <strong style={{ color: '#2563eb' }}>{chargeableWeight}kg</strong></span>
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="checkbox-group">
              <input type="checkbox" id="dangerous" checked={form.is_dangerous} onChange={e => updateField('is_dangerous', e.target.checked)} />
              <label htmlFor="dangerous">危险品（需审核）</label>
            </div>
            <div className="checkbox-group">
              <input type="checkbox" id="battery" checked={form.is_battery} onChange={e => updateField('is_battery', e.target.checked)} />
              <label htmlFor="battery">含电池（需审核）</label>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>航线与航班</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>始发站 *</label>
              <input required value={form.origin} onChange={e => updateField('origin', e.target.value)} />
            </div>
            <div className="form-group">
              <label>目的站 *</label>
              <input required value={form.destination} onChange={e => updateField('destination', e.target.value)} />
            </div>
            <div className="form-group">
              <label>航班号</label>
              <input value={form.flight_no} onChange={e => updateField('flight_no', e.target.value)} />
            </div>
            <div className="form-group">
              <label>航班日期</label>
              <input type="date" value={form.flight_date} onChange={e => updateField('flight_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label>服务等级</label>
              <select value={form.service_level} onChange={e => updateField('service_level', e.target.value)}>
                <option value="standard">标准</option>
                <option value="express">加急</option>
                <option value="priority">优先</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.875rem 3rem', fontSize: '1rem' }}>创建运单</button>
        </div>
      </form>
    </div>
  );
}
