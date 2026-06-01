import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:58890/api';

function Dashboard() {
  const [stats, setStats] = useState({});
  const [revenueByCollege, setRevenueByCollege] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/dashboard/stats`).then(r => r.json()).then(setStats);
    fetch(`${API_BASE}/dashboard/revenue-by-college`).then(r => r.json()).then(setRevenueByCollege);
  }, []);

  return (
    <div>
      <h2>成果转化看板</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', margin: '20px 0' }}>
        <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{stats.totalAchievements || 0}</div>
          <div>成果总数</div>
        </div>
        <div style={{ padding: '20px', background: '#e3f2fd', borderRadius: '8px' }}>
          <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{stats.totalContracts || 0}</div>
          <div>合同总数</div>
        </div>
        <div style={{ padding: '20px', background: '#e8f5e9', borderRadius: '8px' }}>
          <div style={{ fontSize: '2em', fontWeight: 'bold' }}>¥{(stats.totalRevenue || 0).toLocaleString()}</div>
          <div>到账总额</div>
        </div>
        <div style={{ padding: '20px', background: '#fff3e0', borderRadius: '8px' }}>
          <div style={{ fontSize: '2em', fontWeight: 'bold', color: stats.overduePayments > 0 ? 'red' : 'inherit' }}>{stats.overduePayments || 0}</div>
          <div>逾期付款</div>
        </div>
      </div>
      <h3>各学院收益</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>学院</th>
            <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>到账金额</th>
          </tr>
        </thead>
        <tbody>
          {revenueByCollege.map(item => (
            <tr key={item.college}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.college || '未分配'}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>¥{item.total.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'patent', inventors: '', college: '', maturity_level: '', ownership_clear: false, ownership_remark: '', patent_number: '', paper_doi: '', software_copyright: '', prototype_description: '' });

  useEffect(() => {
    fetch(`${API_BASE}/achievements`).then(r => r.json()).then(setAchievements);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${API_BASE}/achievements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    }).then(r => r.json()).then(() => {
      fetch(`${API_BASE}/achievements`).then(r => r.json()).then(setAchievements);
      setShowForm(false);
      setFormData({ name: '', type: 'patent', inventors: '', college: '', maturity_level: '', ownership_clear: false, ownership_remark: '', patent_number: '', paper_doi: '', software_copyright: '', prototype_description: '' });
    });
  };

  const typeLabels = { patent: '专利', paper: '论文', software: '软件著作权', prototype: '样机' };
  const statusLabels = { draft: '草稿', registered: '已登记', evaluated: '已评估', contracted: '已签约' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>成果登记</h2>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 16px' }}>{showForm ? '取消' : '新增成果'}</button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} style={{ margin: '20px 0', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            <div>
              <label>成果名称 *</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </div>
            <div>
              <label>类型 *</label>
              <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                <option value="patent">专利</option>
                <option value="paper">论文</option>
                <option value="software">软件著作权</option>
                <option value="prototype">样机</option>
              </select>
            </div>
            <div>
              <label>发明人</label>
              <input type="text" value={formData.inventors} onChange={e => setFormData({ ...formData, inventors: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </div>
            <div>
              <label>所属学院</label>
              <input type="text" value={formData.college} onChange={e => setFormData({ ...formData, college: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </div>
            <div>
              <label>技术成熟度</label>
              <select value={formData.maturity_level} onChange={e => setFormData({ ...formData, maturity_level: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                <option value="">请选择</option>
                <option value="TRL1">TRL1 - 基本原理</option>
                <option value="TRL2">TRL2 - 技术概念</option>
                <option value="TRL3">TRL3 - 实验验证</option>
                <option value="TRL4">TRL4 - 实验室验证</option>
                <option value="TRL5">TRL5 - 相关环境验证</option>
                <option value="TRL6">TRL6 - 原型系统演示</option>
                <option value="TRL7">TRL7 - 实际环境原型</option>
                <option value="TRL8">TRL8 - 实际系统完成</option>
                <option value="TRL9">TRL9 - 实际应用</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" checked={formData.ownership_clear} onChange={e => setFormData({ ...formData, ownership_clear: e.target.checked })} />
                权属清晰
              </label>
              {!formData.ownership_clear && <span style={{ color: 'orange', fontSize: '12px' }}>权属不清不能进入转化流程</span>}
            </div>
            <div>
              <label>权属说明</label>
              <input type="text" value={formData.ownership_remark} onChange={e => setFormData({ ...formData, ownership_remark: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </div>
            {formData.type === 'patent' && <div><label>专利号</label><input type="text" value={formData.patent_number} onChange={e => setFormData({ ...formData, patent_number: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }} /></div>}
            {formData.type === 'paper' && <div><label>DOI</label><input type="text" value={formData.paper_doi} onChange={e => setFormData({ ...formData, paper_doi: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }} /></div>}
            {formData.type === 'software' && <div><label>软著登记号</label><input type="text" value={formData.software_copyright} onChange={e => setFormData({ ...formData, software_copyright: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }} /></div>}
            {formData.type === 'prototype' && <div><label>样机描述</label><input type="text" value={formData.prototype_description} onChange={e => setFormData({ ...formData, prototype_description: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }} /></div>}
          </div>
          <button type="submit" style={{ marginTop: '15px', padding: '10px 20px' }}>提交</button>
        </form>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>名称</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>类型</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>发明人</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>学院</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>权属</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>状态</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {achievements.map(a => (
            <tr key={a.id}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{a.name}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{typeLabels[a.type]}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{a.inventors}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{a.college}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{a.ownership_clear ? '✅ 清晰' : '⚠️ 待确认'}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{statusLabels[a.status] || a.status}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                <Link to={`/achievements/${a.id}`} style={{ marginRight: '10px' }}>详情</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AchievementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [achievement, setAchievement] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [showEvalForm, setShowEvalForm] = useState(false);
  const [evalData, setEvalData] = useState({ market_scene: '', tech_advantage: '', conclusion: '', expert_opinion: '', valuation_basis: '', valuation_amount: '', status: 'pending' });

  useEffect(() => {
    fetch(`${API_BASE}/achievements/${id}`).then(r => r.json()).then(setAchievement);
    fetch(`${API_BASE}/achievements/${id}/evaluations`).then(r => r.json()).then(setEvaluations);
  }, [id]);

  const handleEvalSubmit = (e) => {
    e.preventDefault();
    fetch(`${API_BASE}/achievements/${id}/evaluations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evalData)
    }).then(r => {
      if (!r.ok) return r.json().then(err => { alert(err.error); throw err; });
      return r.json();
    }).then(() => {
      fetch(`${API_BASE}/achievements/${id}/evaluations`).then(r => r.json()).then(setEvaluations);
      fetch(`${API_BASE}/achievements/${id}`).then(r => r.json()).then(setAchievement);
      setShowEvalForm(false);
    }).catch(() => {});
  };

  if (!achievement) return <div>加载中...</div>;

  return (
    <div>
      <button onClick={() => navigate('/achievements')} style={{ marginBottom: '20px' }}>← 返回列表</button>
      <h2>{achievement.name}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', margin: '20px 0' }}>
        <div><strong>类型：</strong>{achievement.type}</div>
        <div><strong>发明人：</strong>{achievement.inventors}</div>
        <div><strong>学院：</strong>{achievement.college}</div>
        <div><strong>成熟度：</strong>{achievement.maturity_level}</div>
        <div><strong>权属：</strong>{achievement.ownership_clear ? '清晰' : '不清'}</div>
        <div><strong>状态：</strong>{achievement.status}</div>
      </div>
      <h3>评估记录</h3>
      <button onClick={() => setShowEvalForm(!showEvalForm)} style={{ marginBottom: '10px', padding: '8px 16px' }}>{showEvalForm ? '取消' : '新增评估'}</button>
      {showEvalForm && (
        <form onSubmit={handleEvalSubmit} style={{ margin: '20px 0', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div><label>市场应用场景</label><textarea value={evalData.market_scene} onChange={e => setEvalData({ ...evalData, market_scene: e.target.value })} rows={3} style={{ width: '100%', padding: '8px', marginTop: '4px' }} /></div>
            <div><label>技术优势</label><textarea value={evalData.tech_advantage} onChange={e => setEvalData({ ...evalData, tech_advantage: e.target.value })} rows={3} style={{ width: '100%', padding: '8px', marginTop: '4px' }} /></div>
            <div><label>评估结论</label><textarea value={evalData.conclusion} onChange={e => setEvalData({ ...evalData, conclusion: e.target.value })} rows={3} style={{ width: '100%', padding: '8px', marginTop: '4px' }} /></div>
            <div><label>专家意见</label><textarea value={evalData.expert_opinion} onChange={e => setEvalData({ ...evalData, expert_opinion: e.target.value })} rows={3} style={{ width: '100%', padding: '8px', marginTop: '4px' }} /></div>
            <div><label>估值依据</label><textarea value={evalData.valuation_basis} onChange={e => setEvalData({ ...evalData, valuation_basis: e.target.value })} rows={3} style={{ width: '100%', padding: '8px', marginTop: '4px' }} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              <div><label>估值金额（元）</label><input type="number" value={evalData.valuation_amount} onChange={e => setEvalData({ ...evalData, valuation_amount: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }} /></div>
              <div><label>状态</label>
                <select value={evalData.status} onChange={e => setEvalData({ ...evalData, status: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                  <option value="pending">待审批</option>
                  <option value="approved">通过</option>
                  <option value="rejected">退回</option>
                </select>
              </div>
            </div>
          </div>
          <button type="submit" style={{ marginTop: '15px', padding: '10px 20px' }}>提交评估</button>
        </form>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>版本</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>估值</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>结论</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>状态</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>时间</th>
          </tr>
        </thead>
        <tbody>
          {evaluations.map(e => (
            <tr key={e.id}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>v{e.version}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>¥{e.valuation_amount?.toLocaleString()}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{e.conclusion?.substring(0, 50)}...</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{e.status === 'approved' ? '✅ 通过' : e.status === 'rejected' ? '❌ 退回' : '⏳ 待审'}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{e.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [formData, setFormData] = useState({ achievement_id: '', contract_number: '', license_type: 'exclusive', amount: '', payment_schedule: '[]', inventor_share: 40, college_share: 20, status: 'draft' });

  useEffect(() => {
    fetch(`${API_BASE}/contracts`).then(r => r.json()).then(setContracts);
    fetch(`${API_BASE}/achievements`).then(r => r.json()).then(setAchievements);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${API_BASE}/contracts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    }).then(r => r.json()).then(() => {
      fetch(`${API_BASE}/contracts`).then(r => r.json()).then(setContracts);
      setShowForm(false);
    });
  };

  const licenseLabels = { exclusive: '独占许可', non_exclusive: '非独占许可', assignment: '转让' };
  const statusLabels = { draft: '草稿', review: '审核中', signed: '已签署', completed: '已完成' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>合同管理</h2>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 16px' }}>{showForm ? '取消' : '新增合同'}</button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} style={{ margin: '20px 0', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            <div>
              <label>关联成果 *</label>
              <select required value={formData.achievement_id} onChange={e => setFormData({ ...formData, achievement_id: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                <option value="">请选择</option>
                {achievements.filter(a => a.ownership_clear).map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label>合同编号</label>
              <input type="text" value={formData.contract_number} onChange={e => setFormData({ ...formData, contract_number: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </div>
            <div>
              <label>许可方式</label>
              <select value={formData.license_type} onChange={e => setFormData({ ...formData, license_type: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                <option value="exclusive">独占许可</option>
                <option value="non_exclusive">非独占许可</option>
                <option value="assignment">转让</option>
              </select>
            </div>
            <div>
              <label>合同金额（元）*</label>
              <input type="number" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </div>
            <div>
              <label>发明人分成（%）</label>
              <input type="number" value={formData.inventor_share} onChange={e => setFormData({ ...formData, inventor_share: parseFloat(e.target.value) })} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </div>
            <div>
              <label>学院分成（%）</label>
              <input type="number" value={formData.college_share} onChange={e => setFormData({ ...formData, college_share: parseFloat(e.target.value) })} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </div>
            <div>
              <label>状态</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                <option value="draft">草稿</option>
                <option value="review">审核中</option>
                <option value="signed">已签署</option>
                <option value="completed">已完成</option>
              </select>
            </div>
          </div>
          <button type="submit" style={{ marginTop: '15px', padding: '10px 20px' }}>创建合同</button>
        </form>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>合同编号</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>成果名称</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>许可方式</th>
            <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>金额</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>状态</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map(c => (
            <tr key={c.id}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{c.contract_number || '-'}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{c.achievement_name}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{licenseLabels[c.license_type]}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>¥{c.amount?.toLocaleString()}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{statusLabels[c.status]}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}><Link to={`/contracts/${c.id}`}>详情</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [payments, setPayments] = useState([]);
  const [changes, setChanges] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/contracts/${id}`).then(r => r.json()).then(setContract);
    fetch(`${API_BASE}/contracts/${id}/payments`).then(r => r.json()).then(setPayments);
  }, [id]);

  const handleReceivePayment = (paymentId) => {
    const actualDate = new Date().toISOString().split('T')[0];
    fetch(`${API_BASE}/payments/${paymentId}/receive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actual_date: actualDate })
    }).then(r => r.json()).then(() => {
      fetch(`${API_BASE}/contracts/${id}/payments`).then(r => r.json()).then(setPayments);
    });
  };

  if (!contract) return <div>加载中...</div>;

  return (
    <div>
      <button onClick={() => navigate('/contracts')} style={{ marginBottom: '20px' }}>← 返回列表</button>
      <h2>合同详情 - {contract.contract_number || '未编号'}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', margin: '20px 0' }}>
        <div><strong>成果名称：</strong><Link to={`/achievements/${contract.achievement_id}`}>{contract.achievement_name}</Link></div>
        <div><strong>合同金额：</strong>¥{contract.amount?.toLocaleString()}</div>
        <div><strong>发明人分成：</strong>{contract.inventor_share}%</div>
        <div><strong>学院分成：</strong>{contract.college_share}%</div>
      </div>
      <h3>付款计划</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>金额</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>到期日</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>实际到账</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>状态</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(p => {
            const isOverdue = p.status === 'pending' && p.due_date && new Date(p.due_date) < new Date();
            return (
              <tr key={p.id} style={{ background: isOverdue ? '#fff0f0' : 'inherit' }}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>¥{p.amount.toLocaleString()}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{p.due_date}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{p.actual_date || '-'}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {p.status === 'received' ? '✅ 已到账' : isOverdue ? '❌ 已逾期' : '⏳ 待支付'}
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {p.status === 'pending' && <button onClick={() => handleReceivePayment(p.id)} style={{ padding: '4px 12px' }}>确认到账</button>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RevenueLedger() {
  const [ledger, setLedger] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/revenue-ledger`).then(r => r.json()).then(setLedger);
  }, []);

  return (
    <div>
      <h2>收益台账</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>合同</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>成果</th>
            <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>到账总额</th>
            <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>发明人</th>
            <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>学院</th>
            <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>学校</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>时间</th>
          </tr>
        </thead>
        <tbody>
          {ledger.map(l => (
            <tr key={l.id}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}><Link to={`/contracts/${l.contract_id}`}>{l.contract_number}</Link></td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{l.achievement_name}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>¥{l.amount.toLocaleString()}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>¥{l.inventor_amount.toLocaleString()}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>¥{l.college_amount.toLocaleString()}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>¥{l.university_amount.toLocaleString()}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{l.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Engagements() {
  const [engagements, setEngagements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [formData, setFormData] = useState({ achievement_id: '', company_id: '', status: 'initial', nda_signed: false });

  useEffect(() => {
    fetch(`${API_BASE}/engagements`).then(r => r.json()).then(setEngagements);
    fetch(`${API_BASE}/achievements`).then(r => r.json()).then(setAchievements);
    fetch(`${API_BASE}/companies`).then(r => r.json()).then(setCompanies);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${API_BASE}/engagements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    }).then(r => r.json()).then(() => {
      fetch(`${API_BASE}/engagements`).then(r => r.json()).then(setEngagements);
      setShowForm(false);
    });
  };

  const statusLabels = { initial: '初步接触', negotiating: '洽谈中', nda_signed: '已签保密协议', trialing: '试用中', contracted: '已签约' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>企业对接</h2>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 16px' }}>{showForm ? '取消' : '新增对接'}</button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} style={{ margin: '20px 0', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            <div>
              <label>成果 *</label>
              <select required value={formData.achievement_id} onChange={e => setFormData({ ...formData, achievement_id: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                <option value="">请选择</option>
                {achievements.filter(a => a.ownership_clear).map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label>企业 *</label>
              <select required value={formData.company_id} onChange={e => setFormData({ ...formData, company_id: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                <option value="">请选择</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label>状态</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                <option value="initial">初步接触</option>
                <option value="negotiating">洽谈中</option>
                <option value="nda_signed">已签保密协议</option>
                <option value="trialing">试用中</option>
                <option value="contracted">已签约</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
                <input type="checkbox" checked={formData.nda_signed} onChange={e => setFormData({ ...formData, nda_signed: e.target.checked })} />
                已签署保密协议
              </label>
            </div>
          </div>
          <button type="submit" style={{ marginTop: '15px', padding: '10px 20px' }}>创建</button>
        </form>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>成果</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>企业</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>状态</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>保密协议</th>
          </tr>
        </thead>
        <tbody>
          {engagements.map(e => (
            <tr key={e.id}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{e.achievement_name}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{e.company_name}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{statusLabels[e.status]}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{e.nda_signed ? '✅ 已签' : '❌ 未签'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Companies() {
  const [companies, setCompanies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', contact_person: '', contact_phone: '', contact_email: '', industry: '' });

  useEffect(() => {
    fetch(`${API_BASE}/companies`).then(r => r.json()).then(setCompanies);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${API_BASE}/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    }).then(r => r.json()).then(() => {
      fetch(`${API_BASE}/companies`).then(r => r.json()).then(setCompanies);
      setShowForm(false);
      setFormData({ name: '', contact_person: '', contact_phone: '', contact_email: '', industry: '' });
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>企业管理</h2>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 16px' }}>{showForm ? '取消' : '新增企业'}</button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} style={{ margin: '20px 0', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            <div><label>企业名称 *</label><input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }} /></div>
            <div><label>行业</label><input type="text" value={formData.industry} onChange={e => setFormData({ ...formData, industry: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }} /></div>
            <div><label>联系人</label><input type="text" value={formData.contact_person} onChange={e => setFormData({ ...formData, contact_person: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }} /></div>
            <div><label>电话</label><input type="text" value={formData.contact_phone} onChange={e => setFormData({ ...formData, contact_phone: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }} /></div>
            <div><label>邮箱</label><input type="email" value={formData.contact_email} onChange={e => setFormData({ ...formData, contact_email: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }} /></div>
          </div>
          <button type="submit" style={{ marginTop: '15px', padding: '10px 20px' }}>创建</button>
        </form>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>企业名称</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>行业</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>联系人</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>电话</th>
          </tr>
        </thead>
        <tbody>
          {companies.map(c => (
            <tr key={c.id}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{c.name}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{c.industry}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{c.contact_person}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{c.contact_phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  const navStyle = { background: '#1976d2', color: 'white', padding: '0 20px', display: 'flex', gap: '5px' };
  const linkStyle = { color: 'white', textDecoration: 'none', padding: '15px 15px', display: 'inline-block' };

  return (
    <BrowserRouter>
      <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', background: '#ffffff', minHeight: '100vh', color: '#333333' }}>
        <nav style={navStyle}>
          <Link to="/" style={linkStyle}>看板</Link>
          <Link to="/achievements" style={linkStyle}>成果登记</Link>
          <Link to="/engagements" style={linkStyle}>企业对接</Link>
          <Link to="/contracts" style={linkStyle}>合同管理</Link>
          <Link to="/revenue-ledger" style={linkStyle}>收益台账</Link>
          <Link to="/companies" style={linkStyle}>企业库</Link>
        </nav>
        <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/achievements/:id" element={<AchievementDetail />} />
            <Route path="/engagements" element={<Engagements />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/contracts/:id" element={<ContractDetail />} />
            <Route path="/revenue-ledger" element={<RevenueLedger />} />
            <Route path="/companies" element={<Companies />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
