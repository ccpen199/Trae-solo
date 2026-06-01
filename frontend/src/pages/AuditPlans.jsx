import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuditPlans, createAuditPlan, updateAuditPlan, deleteAuditPlan, getSuppliers, getSupplierFactories, getAuditors, checkConflict } from '../api.js';

function AuditPlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [factories, setFactories] = useState([]);
  const [auditors, setAuditors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    supplier_id: '',
    factory_id: '',
    audit_type: '全面审核',
    auditor_id: '',
    audit_date: '',
    start_time: '09:00',
    end_time: '17:00',
    standards: 'BSCI,SA8000',
    notes: ''
  });
  const [conflictWarning, setConflictWarning] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansRes, suppliersRes, auditorsRes] = await Promise.all([
        getAuditPlans(),
        getSuppliers(),
        getAuditors()
      ]);
      setPlans(plansRes.data);
      setSuppliers(suppliersRes.data);
      setAuditors(auditorsRes.data);
    } catch (error) {
      console.error('加载数据失败', error);
    }
  };

  const handleSupplierChange = async (supplierId) => {
    setFormData({ ...formData, supplier_id: supplierId, factory_id: '' });
    if (supplierId) {
      try {
        const res = await getSupplierFactories(supplierId);
        setFactories(res.data);
      } catch (error) {
        console.error('加载工厂失败', error);
      }
    } else {
      setFactories([]);
    }
  };

  const checkScheduleConflict = async (data) => {
    try {
      const res = await checkConflict({
        auditor_id: data.auditor_id,
        audit_date: data.audit_date,
        start_time: data.start_time,
        end_time: data.end_time,
        exclude_id: editingPlan?.id
      });
      return res.data.hasConflict;
    } catch (error) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setConflictWarning('');

    if (!formData.supplier_id || !formData.factory_id || !formData.auditor_id || !formData.audit_date) {
      setError('请填写所有必填项');
      return;
    }

    const hasConflict = await checkScheduleConflict(formData);
    if (hasConflict) {
      setConflictWarning('该审核员此时间段已有安排，请重新选择时间或审核员');
      return;
    }

    try {
      if (editingPlan) {
        await updateAuditPlan(editingPlan.id, { ...formData, status: editingPlan.status });
      } else {
        await createAuditPlan(formData);
      }
      setShowModal(false);
      setEditingPlan(null);
      loadData();
      resetForm();
    } catch (error) {
      setError(error.response?.data?.error || '保存失败');
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      supplier_id: plan.supplier_id,
      factory_id: plan.factory_id,
      audit_type: plan.audit_type,
      auditor_id: plan.auditor_id,
      audit_date: plan.audit_date,
      start_time: plan.start_time,
      end_time: plan.end_time,
      standards: plan.standards || '',
      notes: plan.notes || ''
    });
    handleSupplierChange(plan.supplier_id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('确定要删除此验厂计划吗？')) {
      try {
        await deleteAuditPlan(id);
        loadData();
      } catch (error) {
        console.error('删除失败', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_id: '',
      factory_id: '',
      audit_type: '全面审核',
      auditor_id: '',
      audit_date: '',
      start_time: '09:00',
      end_time: '17:00',
      standards: 'BSCI,SA8000',
      notes: ''
    });
    setFactories([]);
    setError('');
    setConflictWarning('');
  };

  const getStatusTag = (status) => {
    const statusMap = {
      scheduled: { text: '已排期', class: 'tag-info' },
      in_progress: { text: '进行中', class: 'tag-warning' },
      completed: { text: '已完成', class: 'tag-success' },
      cancelled: { text: '已取消', class: 'tag-default' }
    };
    const s = statusMap[status] || statusMap.scheduled;
    return <span className={`tag ${s.class}`}>{s.text}</span>;
  };

  return (
    <div>
      <h2 className="page-title">验厂计划管理</h2>
      
      <div className="actions">
        <button className="btn btn-primary" onClick={() => { setShowModal(true); resetForm(); }}>
          + 新建验厂计划
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>供应商</th>
              <th>工厂</th>
              <th>审核类型</th>
              <th>审核员</th>
              <th>审核日期</th>
              <th>时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {plans.map(plan => (
              <tr key={plan.id}>
                <td>{plan.supplier_name}</td>
                <td>{plan.factory_name}</td>
                <td>{plan.audit_type}</td>
                <td>{plan.auditor_name}</td>
                <td>{plan.audit_date}</td>
                <td>{plan.start_time} - {plan.end_time}</td>
                <td>{getStatusTag(plan.status)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-sm btn-default" onClick={() => handleEdit(plan)}>编辑</button>
                    <button className="btn btn-sm btn-default" onClick={() => navigate(`/checklist/${plan.id}`)}>检查</button>
                    <button className="btn btn-sm btn-default" onClick={() => navigate(`/issues/${plan.id}`)}>问题</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(plan.id)}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingPlan ? '编辑验厂计划' : '新建验厂计划'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                {conflictWarning && <div className="alert alert-warning">{conflictWarning}</div>}
                
                <div className="form-row">
                  <div className="form-group">
                    <label>供应商 *</label>
                    <select className="select-control" value={formData.supplier_id} onChange={e => handleSupplierChange(e.target.value)}>
                      <option value="">请选择供应商</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>工厂 *</label>
                    <select className="select-control" value={formData.factory_id} onChange={e => setFormData({ ...formData, factory_id: e.target.value })} disabled={!formData.supplier_id}>
                      <option value="">请选择工厂</option>
                      {factories.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>审核类型 *</label>
                    <select className="select-control" value={formData.audit_type} onChange={e => setFormData({ ...formData, audit_type: e.target.value })}>
                      <option value="全面审核">全面审核</option>
                      <option value="质量审核">质量审核</option>
                      <option value="社会责任审核">社会责任审核</option>
                      <option value="反恐审核">反恐审核</option>
                      <option value="环境审核">环境审核</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>审核员 *</label>
                    <select className="select-control" value={formData.auditor_id} onChange={e => setFormData({ ...formData, auditor_id: e.target.value })}>
                      <option value="">请选择审核员</option>
                      {auditors.map(a => (
                        <option key={a.id} value={a.id}>{a.name} - {a.department}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>审核日期 *</label>
                    <input type="date" className="form-control" value={formData.audit_date} onChange={e => setFormData({ ...formData, audit_date: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>适用标准</label>
                    <input type="text" className="form-control" value={formData.standards} onChange={e => setFormData({ ...formData, standards: e.target.value })} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>开始时间 *</label>
                    <input type="time" className="form-control" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>结束时间 *</label>
                    <input type="time" className="form-control" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label>备注</label>
                  <textarea className="notes-textarea" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditPlans;
