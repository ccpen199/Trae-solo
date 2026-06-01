import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api.js';

function OptometryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('customer_id');
  const isEdit = !!id;

  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    customer_id: customerId || '',
    optometrist: '',
    sphere_od: '',
    sphere_os: '',
    cylinder_od: '',
    cylinder_os: '',
    axis_od: '',
    axis_os: '',
    pd: '',
    corrected_vision_od: '',
    corrected_vision_os: '',
    notes: ''
  });
  const [versions, setVersions] = useState([]);

  useEffect(() => {
    loadCustomers();
    if (isEdit) {
      loadRecord();
    }
  }, [id]);

  const loadCustomers = async () => {
    const res = await api.get('/customers', { params: { pageSize: 100 } });
    setCustomers(res.data.data);
  };

  const loadRecord = async () => {
    const res = await api.get(`/optometry/${id}`);
    const data = res.data;
    setForm({
      customer_id: data.customer_id,
      optometrist: data.optometrist,
      sphere_od: data.sphere_od || '',
      sphere_os: data.sphere_os || '',
      cylinder_od: data.cylinder_od || '',
      cylinder_os: data.cylinder_os || '',
      axis_od: data.axis_od || '',
      axis_os: data.axis_os || '',
      pd: data.pd || '',
      corrected_vision_od: data.corrected_vision_od || '',
      corrected_vision_os: data.corrected_vision_os || '',
      notes: data.notes || ''
    });
    setVersions(data.versions || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_id) {
      alert('请选择客户');
      return;
    }
    if (!form.optometrist) {
      alert('请填写验光师');
      return;
    }

    const data = {
      ...form,
      sphere_od: form.sphere_od ? parseFloat(form.sphere_od) : null,
      sphere_os: form.sphere_os ? parseFloat(form.sphere_os) : null,
      cylinder_od: form.cylinder_od ? parseFloat(form.cylinder_od) : null,
      cylinder_os: form.cylinder_os ? parseFloat(form.cylinder_os) : null,
      axis_od: form.axis_od ? parseInt(form.axis_od) : null,
      axis_os: form.axis_os ? parseInt(form.axis_os) : null,
      pd: form.pd ? parseFloat(form.pd) : null
    };

    if (isEdit) {
      await api.put(`/optometry/${id}`, data);
      alert('处方已更新，新版本已创建');
    } else {
      await api.post('/optometry', data);
      alert('验光记录创建成功');
    }
    navigate('/optometry');
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <button className="btn btn-default" onClick={() => navigate(-1)}>← 返回</button>
        <h2>{isEdit ? '修改验光处方（创建新版本）' : '新建验光记录'}</h2>
      </div>

      {isEdit && versions.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">版本历史（共 {versions.length} 个版本）</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {versions.map(v => (
              <div key={v.id} className="badge badge-info" style={{ padding: '6px 12px' }}>
                v{v.version} - {v.created_at?.split('T')[0]}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>客户 *</label>
              <select
                required
                value={form.customer_id}
                onChange={e => setForm({ ...form, customer_id: e.target.value })}
                disabled={isEdit || !!customerId}
              >
                <option value="">请选择客户</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>验光师 *</label>
              <input
                required
                value={form.optometrist}
                onChange={e => setForm({ ...form, optometrist: e.target.value })}
                placeholder="请输入验光师姓名"
              />
            </div>
          </div>

          <div className="card-title" style={{ marginTop: 20 }}>右眼 (OD)</div>
          <div className="form-row">
            <div className="form-group">
              <label>球镜 (SPH)</label>
              <input
                type="number"
                step="0.25"
                value={form.sphere_od}
                onChange={e => setForm({ ...form, sphere_od: e.target.value })}
                placeholder="例：-2.00"
              />
            </div>
            <div className="form-group">
              <label>柱镜 (CYL)</label>
              <input
                type="number"
                step="0.25"
                value={form.cylinder_od}
                onChange={e => setForm({ ...form, cylinder_od: e.target.value })}
                placeholder="例：-0.50"
              />
            </div>
            <div className="form-group">
              <label>轴位 (AXIS)</label>
              <input
                type="number"
                min="0"
                max="180"
                value={form.axis_od}
                onChange={e => setForm({ ...form, axis_od: e.target.value })}
                placeholder="例：180"
              />
            </div>
            <div className="form-group">
              <label>矫正视力</label>
              <input
                value={form.corrected_vision_od}
                onChange={e => setForm({ ...form, corrected_vision_od: e.target.value })}
                placeholder="例：1.0"
              />
            </div>
          </div>

          <div className="card-title" style={{ marginTop: 20 }}>左眼 (OS)</div>
          <div className="form-row">
            <div className="form-group">
              <label>球镜 (SPH)</label>
              <input
                type="number"
                step="0.25"
                value={form.sphere_os}
                onChange={e => setForm({ ...form, sphere_os: e.target.value })}
                placeholder="例：-2.00"
              />
            </div>
            <div className="form-group">
              <label>柱镜 (CYL)</label>
              <input
                type="number"
                step="0.25"
                value={form.cylinder_os}
                onChange={e => setForm({ ...form, cylinder_os: e.target.value })}
                placeholder="例：-0.50"
              />
            </div>
            <div className="form-group">
              <label>轴位 (AXIS)</label>
              <input
                type="number"
                min="0"
                max="180"
                value={form.axis_os}
                onChange={e => setForm({ ...form, axis_os: e.target.value })}
                placeholder="例：180"
              />
            </div>
            <div className="form-group">
              <label>矫正视力</label>
              <input
                value={form.corrected_vision_os}
                onChange={e => setForm({ ...form, corrected_vision_os: e.target.value })}
                placeholder="例：1.0"
              />
            </div>
          </div>

          <div className="form-row" style={{ marginTop: 20 }}>
            <div className="form-group">
              <label>瞳距 (PD)</label>
              <input
                type="number"
                step="0.5"
                value={form.pd}
                onChange={e => setForm({ ...form, pd: e.target.value })}
                placeholder="例：62"
              />
            </div>
          </div>

          <div className="form-group">
            <label>备注</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows="3"
              placeholder="验光备注信息"
            />
          </div>

          {isEdit && (
            <div className="alert alert-warning">
              ⚠️ 修改处方会创建新版本，原处方记录将被保留
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-default" onClick={() => navigate(-1)}>取消</button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? '保存并创建新版本' : '保存验光记录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OptometryForm;
