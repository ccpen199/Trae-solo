import { useState, useEffect } from 'react';
import axios from 'axios';

function Operations({ user }) {
  const [activeTab, setActiveTab] = useState('leaves');
  const [leaves, setLeaves] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [renewalLeads, setRenewalLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [camps, setCamps] = useState([]);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [referralForm, setReferralForm] = useState({ referrer_id: '', referred_name: '', referred_phone: '', notes: '' });
  const [leadForm, setLeadForm] = useState({ user_id: '', camp_id: '', interest_level: 0, intended_camp: '', notes: '', status: 'new' });

  useEffect(() => {
    loadLeaves();
    loadReferrals();
    loadRenewalLeads();
    loadUsers();
    loadCamps();
  }, []);

  const loadLeaves = async () => {
    const res = await axios.get('/api/leaves');
    setLeaves(res.data);
  };

  const loadReferrals = async () => {
    const res = await axios.get('/api/referrals');
    setReferrals(res.data);
  };

  const loadRenewalLeads = async () => {
    const res = await axios.get('/api/renewal-leads');
    setRenewalLeads(res.data);
  };

  const loadUsers = async () => {
    const res = await axios.get('/api/users');
    setUsers(res.data);
  };

  const loadCamps = async () => {
    const res = await axios.get('/api/camps');
    setCamps(res.data);
  };

  const handleApproveLeave = async (id, status) => {
    await axios.put(`/api/leaves/${id}/approve`, { approved_by: user.id, status });
    loadLeaves();
  };

  const handleAddReferral = async (e) => {
    e.preventDefault();
    await axios.post('/api/referrals', referralForm);
    setShowReferralModal(false);
    setReferralForm({ referrer_id: '', referred_name: '', referred_phone: '', notes: '' });
    loadReferrals();
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    await axios.post('/api/renewal-leads', leadForm);
    setShowLeadModal(false);
    setLeadForm({ user_id: '', camp_id: '', interest_level: 0, intended_camp: '', notes: '', status: 'new' });
    loadRenewalLeads();
  };

  const handleUpdateLeadStatus = async (id, status) => {
    const lead = renewalLeads.find(l => l.id === id);
    await axios.put(`/api/renewal-leads/${id}`, { ...lead, status });
    loadRenewalLeads();
  };

  const handleUpdateReferralStatus = async (id, status) => {
    await axios.put(`/api/referrals/${id}`, { status });
    loadReferrals();
  };

  const leaveStatusMap = {
    pending: { label: '待审批', class: 'badge-warning' },
    approved: { label: '已通过', class: 'badge-success' },
    rejected: { label: '已驳回', class: 'badge-danger' }
  };

  const referralStatusMap = {
    pending: { label: '待跟进', class: 'badge-warning' },
    contacted: { label: '已联系', class: 'badge-info' },
    enrolled: { label: '已报名', class: 'badge-success' },
    lost: { label: '已流失', class: 'badge-danger' }
  };

  const leadStatusMap = {
    new: { label: '新建', class: 'badge-primary' },
    contacted: { label: '已联系', class: 'badge-info' },
    negotiating: { label: '跟进中', class: 'badge-warning' },
    converted: { label: '已转化', class: 'badge-success' },
    lost: { label: '已流失', class: 'badge-danger' }
  };

  const students = users.filter(u => u.role === 'student');

  return (
    <div>
      <div className="flex-between mb-4">
        <h2 style={{ margin: 0 }}>运营管理</h2>
        <div className="flex gap-2">
          {activeTab === 'referrals' && <button className="btn btn-primary" onClick={() => setShowReferralModal(true)}>+ 转介绍</button>}
          {activeTab === 'renewals' && <button className="btn btn-primary" onClick={() => setShowLeadModal(true)}>+ 续费线索</button>}
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'leaves' ? 'active' : ''}`} onClick={() => setActiveTab('leaves')}>请假审批</button>
        <button className={`tab ${activeTab === 'referrals' ? 'active' : ''}`} onClick={() => setActiveTab('referrals')}>转介绍</button>
        <button className={`tab ${activeTab === 'renewals' ? 'active' : ''}`} onClick={() => setActiveTab('renewals')}>续费线索</button>
      </div>

      {activeTab === 'leaves' && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>学员</th>
                <th>训练营</th>
                <th>请假时间</th>
                <th>原因</th>
                <th>状态</th>
                <th>审批人</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map(leave => (
                <tr key={leave.id}>
                  <td>{leave.user_name}</td>
                  <td>{leave.camp_name}</td>
                  <td>{leave.start_date} ~ {leave.end_date}</td>
                  <td>{leave.reason}</td>
                  <td><span className={`badge ${leaveStatusMap[leave.status].class}`}>{leaveStatusMap[leave.status].label}</span></td>
                  <td>{leave.approver_name || '-'}</td>
                  <td>
                    {leave.status === 'pending' && (
                      <div className="flex gap-2">
                        <button className="btn btn-success btn-sm" onClick={() => handleApproveLeave(leave.id, 'approved')}>通过</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleApproveLeave(leave.id, 'rejected')}>驳回</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leaves.length === 0 && <p className="text-center text-gray" style={{ padding: 40 }}>暂无请假申请</p>}
        </div>
      )}

      {activeTab === 'referrals' && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>推荐人</th>
                <th>被推荐人</th>
                <th>手机号</th>
                <th>备注</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map(ref => (
                <tr key={ref.id}>
                  <td>{ref.referrer_name || '-'}</td>
                  <td>{ref.referred_name}</td>
                  <td>{ref.referred_phone}</td>
                  <td>{ref.notes || '-'}</td>
                  <td>
                    <select 
                      className="btn btn-outline btn-sm"
                      value={ref.status}
                      onChange={(e) => handleUpdateReferralStatus(ref.id, e.target.value)}
                    >
                      {Object.entries(referralStatusMap).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>-</td>
                </tr>
              ))}
            </tbody>
          </table>
          {referrals.length === 0 && <p className="text-center text-gray" style={{ padding: 40 }}>暂无转介绍记录</p>}
        </div>
      )}

      {activeTab === 'renewals' && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>学员</th>
                <th>手机号</th>
                <th>来源训练营</th>
                <th>意向度</th>
                <th>意向课程</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {renewalLeads.map(lead => (
                <tr key={lead.id}>
                  <td>{lead.user_name}</td>
                  <td>{lead.phone}</td>
                  <td>{lead.camp_name || '-'}</td>
                  <td>{'⭐'.repeat(lead.interest_level)}{'☆'.repeat(5 - lead.interest_level)}</td>
                  <td>{lead.intended_camp || '-'}</td>
                  <td>
                    <select 
                      className="btn btn-outline btn-sm"
                      value={lead.status}
                      onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                    >
                      {Object.entries(leadStatusMap).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>-</td>
                </tr>
              ))}
            </tbody>
          </table>
          {renewalLeads.length === 0 && <p className="text-center text-gray" style={{ padding: 40 }}>暂无续费线索</p>}
        </div>
      )}

      {showReferralModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><h2>添加转介绍</h2><button className="modal-close" onClick={() => setShowReferralModal(false)}>×</button></div>
            <form onSubmit={handleAddReferral}>
              <div className="form-group"><label>推荐人（可选）</label><select value={referralForm.referrer_id} onChange={(e) => setReferralForm({ ...referralForm, referrer_id: e.target.value })}><option value="">无</option>{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div className="form-group"><label>被推荐人姓名</label><input required value={referralForm.referred_name} onChange={(e) => setReferralForm({ ...referralForm, referred_name: e.target.value })} /></div>
              <div className="form-group"><label>手机号</label><input required value={referralForm.referred_phone} onChange={(e) => setReferralForm({ ...referralForm, referred_phone: e.target.value })} /></div>
              <div className="form-group"><label>备注</label><textarea rows={3} value={referralForm.notes} onChange={(e) => setReferralForm({ ...referralForm, notes: e.target.value })} /></div>
              <div className="flex gap-2"><button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowReferralModal(false)}>取消</button><button type="submit" className="btn btn-primary" style={{ flex: 1 }}>添加</button></div>
            </form>
          </div>
        </div>
      )}

      {showLeadModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><h2>添加续费线索</h2><button className="modal-close" onClick={() => setShowLeadModal(false)}>×</button></div>
            <form onSubmit={handleAddLead}>
              <div className="form-group"><label>学员</label><select required value={leadForm.user_id} onChange={(e) => setLeadForm({ ...leadForm, user_id: e.target.value })}><option value="">请选择</option>{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div className="form-group"><label>来源训练营</label><select value={leadForm.camp_id} onChange={(e) => setLeadForm({ ...leadForm, camp_id: e.target.value })}><option value="">无</option>{camps.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div className="form-group"><label>意向度（1-5星）</label><select value={leadForm.interest_level} onChange={(e) => setLeadForm({ ...leadForm, interest_level: parseInt(e.target.value) })}>{[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n} 星</option>)}</select></div>
              <div className="form-group"><label>意向课程</label><input value={leadForm.intended_camp} onChange={(e) => setLeadForm({ ...leadForm, intended_camp: e.target.value })} /></div>
              <div className="form-group"><label>备注</label><textarea rows={3} value={leadForm.notes} onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })} /></div>
              <div className="flex gap-2"><button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowLeadModal(false)}>取消</button><button type="submit" className="btn btn-primary" style={{ flex: 1 }}>添加</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Operations;
