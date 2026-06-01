import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Patients() {
  const [patients, setPatients] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [formData, setFormData] = useState({
    patient_no: '',
    name: '',
    gender: '男',
    age: '',
    phone: '',
    diagnosis: '',
    contraindications: '',
    goals: '',
    therapist_id: '',
    training_cycle: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [patientsRes, usersRes] = await Promise.all([
        api.get('/patients'),
        api.get('/users')
      ]);
      setPatients(patientsRes.data);
      setUsers(usersRes.data.filter(u => u.role === 'therapist'));
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPatient) {
        await api.put(`/patients/${editingPatient.id}`, formData);
      } else {
        await api.post('/patients', formData);
      }
      setShowModal(false);
      setEditingPatient(null);
      loadData();
    } catch (err) {
      alert('保存失败');
    }
  };

  const openEdit = (patient) => {
    setEditingPatient(patient);
    setFormData(patient);
    setShowModal(true);
  };

  const openAdd = () => {
    setEditingPatient(null);
    setFormData({
      patient_no: 'P' + Date.now().toString().slice(-6),
      name: '',
      gender: '男',
      age: '',
      phone: '',
      diagnosis: '',
      contraindications: '',
      goals: '',
      therapist_id: '',
      training_cycle: ''
    });
    setShowModal(true);
  };

  return (
    <div>
      <div className="header">
        <h2>患者管理</h2>
        <button className="btn btn-primary" onClick={openAdd}>
          + 新增患者
        </button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>病历号</th>
              <th>姓名</th>
              <th>性别</th>
              <th>年龄</th>
              <th>诊断</th>
              <th>禁忌</th>
              <th>主治治疗师</th>
              <th>训练周期</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(patient => (
              <tr key={patient.id}>
                <td>{patient.patient_no}</td>
                <td>{patient.name}</td>
                <td>{patient.gender}</td>
                <td>{patient.age}</td>
                <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{patient.diagnosis || '-'}</td>
                <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={patient.contraindications || '无'}>
                  {patient.contraindications || '-'}
                </td>
                <td>{patient.therapist_name || '-'}</td>
                <td style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{patient.training_cycle || '-'}</td>
                <td>
                  <span className={`badge ${patient.status === 'active' ? 'badge-active' : 'badge-pending'}`}>
                    {patient.status === 'active' ? '在训' : '停用'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn btn-sm btn-primary" onClick={() => navigate(`/patients/${patient.id}`)}>
                      详情
                    </button>
                    <button className="btn btn-sm" onClick={() => openEdit(patient)} style={{ background: '#95a5a6', color: '#fff' }}>
                      编辑
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingPatient ? '编辑患者' : '新增患者'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>病历号</label>
                    <input
                      type="text"
                      value={formData.patient_no}
                      onChange={e => setFormData({ ...formData, patient_no: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>姓名</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>性别</label>
                    <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                      <option value="男">男</option>
                      <option value="女">女</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>年龄</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={e => setFormData({ ...formData, age: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>电话</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>主治治疗师</label>
                    <select value={formData.therapist_id} onChange={e => setFormData({ ...formData, therapist_id: e.target.value })}>
                      <option value="">请选择</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>诊断</label>
                  <textarea
                    value={formData.diagnosis}
                    onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}
                    rows="2"
                  />
                </div>
                <div className="form-group">
                  <label>禁忌症</label>
                  <textarea
                    value={formData.contraindications}
                    onChange={e => setFormData({ ...formData, contraindications: e.target.value })}
                    rows="2"
                  />
                </div>
                <div className="form-group">
                  <label>康复目标</label>
                  <textarea
                    value={formData.goals}
                    onChange={e => setFormData({ ...formData, goals: e.target.value })}
                    rows="2"
                  />
                </div>
                <div className="form-group">
                  <label>训练周期</label>
                  <input
                    type="text"
                    value={formData.training_cycle}
                    onChange={e => setFormData({ ...formData, training_cycle: e.target.value })}
                    placeholder="例如：4周，每周5次"
                  />
                </div>
                {editingPatient && (
                  <div className="form-group">
                    <label>状态</label>
                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                      <option value="active">在训</option>
                      <option value="inactive">停用</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" style={{ background: '#95a5a6', color: '#fff' }} onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Patients;
