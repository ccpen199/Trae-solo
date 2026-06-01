import { useState, useEffect } from 'react';
import api from '../services/api';

const Candidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [newCommunication, setNewCommunication] = useState({ content: '', communication_type: 'call' });
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    age: '',
    phone: '',
    email: '',
    source: '',
    resume: '',
    current_company: '',
    current_position: '',
    current_salary: '',
    expected_salary_min: '',
    expected_salary_max: '',
    intention_level: 'pending',
    has_nonce_competition: false,
    nonce_competition_notes: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [canRes, usrRes] = await Promise.all([
        api.get('/candidates'),
        api.get('/users')
      ]);
      setCandidates(canRes.data);
      setUsers(usrRes.data);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCandidateDetail = async (id) => {
    try {
      const response = await api.get(`/candidates/${id}`);
      setSelectedCandidate(response.data);
      setShowDetailModal(true);
    } catch (err) {
      console.error('加载候选人详情失败:', err);
    }
  };

  const addCommunication = async () => {
    if (!newCommunication.content.trim()) return;
    try {
      await api.post(`/candidates/${selectedCandidate.id}/communications`, {
        ...newCommunication,
        created_by: users[0]?.id
      });
      setNewCommunication({ content: '', communication_type: 'call' });
      loadCandidateDetail(selectedCandidate.id);
    } catch (err) {
      console.error('添加沟通记录失败:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCandidate) {
        await api.put(`/candidates/${editingCandidate.id}`, formData);
      } else {
        await api.post('/candidates', formData);
      }
      loadData();
      setShowModal(false);
      setEditingCandidate(null);
    } catch (err) {
      console.error('保存候选人失败:', err);
    }
  };

  const handleEdit = (candidate) => {
    setEditingCandidate(candidate);
    setFormData(candidate);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingCandidate(null);
    setFormData({
      name: '',
      gender: '',
      age: '',
      phone: '',
      email: '',
      source: '',
      resume: '',
      current_company: '',
      current_position: '',
      current_salary: '',
      expected_salary_min: '',
      expected_salary_max: '',
      intention_level: 'pending',
      has_nonce_competition: false,
      nonce_competition_notes: '',
      notes: ''
    });
    setShowModal(true);
  };

  const getIntentionColor = (level) => {
    switch (level) {
      case 'high': return '#27ae60';
      case 'medium': return '#f39c12';
      case 'low': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getIntentionText = (level) => {
    switch (level) {
      case 'high': return '高意向';
      case 'medium': return '中意向';
      case 'low': return '低意向';
      default: return '待沟通';
    }
  };

  const getCommunicationTypeText = (type) => {
    switch (type) {
      case 'call': return '电话';
      case 'wechat': return '微信';
      case 'email': return '邮件';
      case 'interview': return '面试';
      default: return type;
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', color: '#2c3e50' }}>候选人库</h1>
        <button
          onClick={handleAdd}
          style={{
            padding: '10px 20px',
            background: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + 新增候选人
        </button>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ textAlign: 'left', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>姓名</th>
              <th style={{ textAlign: 'left', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>联系方式</th>
              <th style={{ textAlign: 'left', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>当前公司/职位</th>
              <th style={{ textAlign: 'left', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>来源</th>
              <th style={{ textAlign: 'center', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>意向等级</th>
              <th style={{ textAlign: 'center', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {candidates.length > 0 ? (
              candidates.map((can) => (
                <tr key={can.id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                  <td style={{ padding: '15px 20px' }}>
                    <div style={{ fontWeight: '500' }}>{can.name}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{can.gender || ''} {can.age ? `${can.age}岁` : ''}</div>
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    <div>{can.phone || '-'}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{can.email || '-'}</div>
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    <div>{can.current_company || '-'}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{can.current_position || '-'}</div>
                  </td>
                  <td style={{ padding: '15px 20px' }}>{can.source || '-'}</td>
                  <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 10px',
                      background: getIntentionColor(can.intention_level),
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {getIntentionText(can.intention_level)}
                    </span>
                    {can.has_nonce_competition && <span style={{ marginLeft: '5px' }}>🚫</span>}
                  </td>
                  <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                    <button
                      onClick={() => loadCandidateDetail(can.id)}
                      style={{
                        padding: '6px 12px',
                        background: '#27ae60',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        marginRight: '5px'
                      }}
                    >
                      详情
                    </button>
                    <button
                      onClick={() => handleEdit(can)}
                      style={{
                        padding: '6px 12px',
                        background: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      编辑
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  暂无候选人数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>
              {editingCandidate ? '编辑候选人' : '新增候选人'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>姓名 *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>性别</label>
                  <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}>
                    <option value="">选择</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>年龄</label>
                  <input type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>电话</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>邮箱</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>当前公司</label>
                  <input type="text" value={formData.current_company} onChange={(e) => setFormData({ ...formData, current_company: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>当前职位</label>
                  <input type="text" value={formData.current_position} onChange={(e) => setFormData({ ...formData, current_position: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>当前薪资</label>
                  <input type="number" value={formData.current_salary} onChange={(e) => setFormData({ ...formData, current_salary: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>来源</label>
                  <input type="text" value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>期望薪资下限</label>
                  <input type="number" value={formData.expected_salary_min} onChange={(e) => setFormData({ ...formData, expected_salary_min: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>期望薪资上限</label>
                  <input type="number" value={formData.expected_salary_max} onChange={(e) => setFormData({ ...formData, expected_salary_max: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>意向等级</label>
                  <select value={formData.intention_level} onChange={(e) => setFormData({ ...formData, intention_level: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}>
                    <option value="pending">待沟通</option>
                    <option value="low">低意向</option>
                    <option value="medium">中意向</option>
                    <option value="high">高意向</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', marginTop: '30px' }}>
                    <input type="checkbox" checked={formData.has_nonce_competition} onChange={(e) => setFormData({ ...formData, has_nonce_competition: e.target.checked })} />
                    有竞业限制
                  </label>
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>竞业限制说明</label>
                <textarea value={formData.nonce_competition_notes} onChange={(e) => setFormData({ ...formData, nonce_competition_notes: e.target.value })} rows={2} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>简历</label>
                <textarea value={formData.resume} onChange={(e) => setFormData({ ...formData, resume: e.target.value })} rows={3} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>备注</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: '#ecf0f1', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>取消</button>
                <button type="submit" style={{ padding: '10px 20px', background: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedCandidate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>候选人详情 - {selectedCandidate.name}</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>性别 / 年龄</div>
                <div style={{ fontWeight: '500' }}>{selectedCandidate.gender || '-'} / {selectedCandidate.age || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>联系方式</div>
                <div style={{ fontWeight: '500' }}>{selectedCandidate.phone || '-'} / {selectedCandidate.email || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>当前公司 / 职位</div>
                <div style={{ fontWeight: '500' }}>{selectedCandidate.current_company || '-'} / {selectedCandidate.current_position || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>薪资 / 期望薪资</div>
                <div style={{ fontWeight: '500' }}>{selectedCandidate.current_salary || '-'} / {selectedCandidate.expected_salary_min || '-'}-{selectedCandidate.expected_salary_max || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>来源 / 意向等级</div>
                <div style={{ fontWeight: '500' }}>{selectedCandidate.source || '-'} / {getIntentionText(selectedCandidate.intention_level)}</div>
              </div>
              {selectedCandidate.has_nonce_competition && (
                <div>
                  <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>竞业限制说明</div>
                  <div style={{ fontWeight: '500', color: '#e74c3c' }}>{selectedCandidate.nonce_competition_notes || '有竞业限制'}</div>
                </div>
              )}
            </div>

            {selectedCandidate.resume && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>简历</div>
                <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{selectedCandidate.resume}</div>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>推荐记录</div>
              {selectedCandidate.recommendations && selectedCandidate.recommendations.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedCandidate.recommendations.map((rec, index) => (
                    <div key={index} style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', fontSize: '14px' }}>
                      <div style={{ fontWeight: '500' }}>{rec.position_title}</div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{rec.client_name} · {new Date(rec.created_at).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '14px' }}>暂无推荐记录</div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>沟通记录</div>
              <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                <select value={newCommunication.communication_type} onChange={(e) => setNewCommunication({ ...newCommunication, communication_type: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}>
                  <option value="call">电话</option>
                  <option value="wechat">微信</option>
                  <option value="email">邮件</option>
                  <option value="interview">面试</option>
                </select>
                <input type="text" value={newCommunication.content} onChange={(e) => setNewCommunication({ ...newCommunication, content: e.target.value })} placeholder="输入沟通内容..." style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }} />
                <button onClick={addCommunication} style={{ padding: '8px 16px', background: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>添加</button>
              </div>
              {selectedCandidate.communications && selectedCandidate.communications.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedCandidate.communications.map((comm, index) => (
                    <div key={index} style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '500' }}>{getCommunicationTypeText(comm.communication_type)}</span>
                        <span style={{ fontSize: '12px', color: '#999' }}>{comm.created_by_name || '-'}</span>
                      </div>
                      <div>{comm.content}</div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{new Date(comm.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '14px' }}>暂无沟通记录</div>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <button onClick={() => setShowDetailModal(false)} style={{ padding: '10px 20px', background: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Candidates;
