import { useState, useEffect } from 'react';
import api from '../services/api';

const Positions = () => {
  const [positions, setPositions] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [positionVersions, setPositionVersions] = useState([]);
  const [formData, setFormData] = useState({
    client_id: '',
    title: '',
    description: '',
    requirements: '',
    salary_min: '',
    salary_max: '',
    priority: 'normal',
    consultant_id: '',
    service_rate: 0.2,
    is_confidential: false,
    status: 'active',
    change_reason: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [posRes, cliRes, usrRes] = await Promise.all([
        api.get('/positions'),
        api.get('/clients'),
        api.get('/users')
      ]);
      setPositions(posRes.data);
      setClients(cliRes.data);
      setUsers(usrRes.data);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async (id) => {
    try {
      const response = await api.get(`/positions/${id}`);
      setPositionVersions(response.data.versions || []);
      setShowVersionModal(true);
    } catch (err) {
      console.error('加载版本失败:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPosition) {
        await api.put(`/positions/${editingPosition.id}`, formData);
      } else {
        await api.post('/positions', formData);
      }
      loadData();
      setShowModal(false);
      setEditingPosition(null);
    } catch (err) {
      console.error('保存职位失败:', err);
    }
  };

  const handleEdit = (position) => {
    setEditingPosition(position);
    setFormData(position);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingPosition(null);
    setFormData({
      client_id: '',
      title: '',
      description: '',
      requirements: '',
      salary_min: '',
      salary_max: '',
      priority: 'normal',
      consultant_id: '',
      service_rate: 0.2,
      is_confidential: false,
      status: 'active',
      change_reason: ''
    });
    setShowModal(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#e74c3c';
      case 'high': return '#f39c12';
      case 'normal': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'urgent': return '紧急';
      case 'high': return '高';
      case 'normal': return '普通';
      default: return priority;
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', color: '#2c3e50' }}>职位管理</h1>
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
          + 新增职位
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
              <th style={{ textAlign: 'left', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>职位名称</th>
              <th style={{ textAlign: 'left', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>客户</th>
              <th style={{ textAlign: 'left', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>薪资范围</th>
              <th style={{ textAlign: 'center', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>优先级</th>
              <th style={{ textAlign: 'left', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>顾问</th>
              <th style={{ textAlign: 'center', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>版本</th>
              <th style={{ textAlign: 'center', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {positions.length > 0 ? (
              positions.map((pos) => (
                <tr key={pos.id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                  <td style={{ padding: '15px 20px' }}>
                    {pos.title}
                    {pos.is_confidential && <span style={{ marginLeft: '8px', color: '#e74c3c', fontSize: '12px' }}>🔒保密</span>}
                  </td>
                  <td style={{ padding: '15px 20px' }}>{pos.client_name || '-'}</td>
                  <td style={{ padding: '15px 20px' }}>{pos.salary_min && pos.salary_max ? `${pos.salary_min}-${pos.salary_max}` : '-'}</td>
                  <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 10px',
                      background: getPriorityColor(pos.priority),
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {getPriorityText(pos.priority)}
                    </span>
                  </td>
                  <td style={{ padding: '15px 20px' }}>{pos.consultant_name || '-'}</td>
                  <td style={{ padding: '15px 20px', textAlign: 'center' }}>v{pos.version || 1}</td>
                  <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleEdit(pos)}
                      style={{
                        padding: '6px 12px',
                        background: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        marginRight: '5px'
                      }}
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => loadVersions(pos.id)}
                      style={{
                        padding: '6px 12px',
                        background: '#95a5a6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      版本
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  暂无职位数据
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
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>
              {editingPosition ? '编辑职位' : '新增职位'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  职位名称 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  客户 *
                </label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  required
                >
                  <option value="">选择客户</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                    最低薪资
                  </label>
                  <input
                    type="number"
                    value={formData.salary_min}
                    onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                    最高薪资
                  </label>
                  <input
                    type="number"
                    value={formData.salary_max}
                    onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                    优先级
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="normal">普通</option>
                    <option value="high">高</option>
                    <option value="urgent">紧急</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                    负责顾问
                  </label>
                  <select
                    value={formData.consultant_id}
                    onChange={(e) => setFormData({ ...formData, consultant_id: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">选择顾问</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                    服务费率
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.service_rate}
                    onChange={(e) => setFormData({ ...formData, service_rate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                    状态
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="active">进行中</option>
                    <option value="closed">已关闭</option>
                    <option value="suspended">暂停</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_confidential}
                    onChange={(e) => setFormData({ ...formData, is_confidential: e.target.checked })}
                  />
                  保密职位
                </label>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  职位描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  任职要求
                </label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>
              {editingPosition && (
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                    变更原因 *
                  </label>
                  <input
                    type="text"
                    value={formData.change_reason}
                    onChange={(e) => setFormData({ ...formData, change_reason: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 20px',
                    background: '#ecf0f1',
                    color: '#333',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
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
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVersionModal && (
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
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>版本历史</h2>
            {positionVersions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {positionVersions.map((v, index) => (
                  <div key={index} style={{
                    padding: '15px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    borderLeft: '4px solid #3498db'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong>版本 {v.version}</strong>
                      <span style={{ fontSize: '12px', color: '#999' }}>
                        {v.changed_by_name || '未知用户'}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                      <strong>{v.title}</strong>
                    </div>
                    {v.change_reason && (
                      <div style={{ fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
                        变更原因: {v.change_reason}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                      {new Date(v.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                暂无版本历史
              </div>
            )}
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                onClick={() => setShowVersionModal(false)}
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
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Positions;
