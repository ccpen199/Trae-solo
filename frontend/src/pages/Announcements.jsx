import { useState, useEffect } from 'react';
import api from '../utils/api';

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedAnn, setSelectedAnn] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    scope_type: 'school',
    scope_id: '',
    priority: 'normal',
    need_confirmation: false
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canCreate = user.role === 'admin' || user.role === 'teacher';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [annRes, classRes] = await Promise.all([
        api.get('/announcements'),
        canCreate ? api.get('/contacts/classes').catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
      ]);
      setAnnouncements(annRes.data);
      setClasses(classRes.data);
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (ann) => {
    try {
      const res = await api.get(`/announcements/${ann.id}`);
      setSelectedAnn(res.data);
      setShowModal(true);
      if (!ann.read_at) {
        await api.post(`/announcements/${ann.id}/read`);
        setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, read_at: new Date().toISOString() } : a));
      }
    } catch (error) {
      console.error('获取详情失败:', error);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await api.post(`/announcements/${id}/confirm`);
      setSelectedAnn(prev => ({ ...prev, confirmed_at: new Date().toISOString() }));
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, confirmed_at: new Date().toISOString() } : a));
      alert('确认成功');
    } catch (error) {
      alert('确认失败');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/announcements', formData);
      setShowCreate(false);
      setFormData({
        title: '',
        content: '',
        scope_type: 'school',
        scope_id: '',
        priority: 'normal',
        need_confirmation: false
      });
      loadData();
      alert('发布成功');
    } catch (error) {
      alert('发布失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除此公告吗？')) return;
    try {
      await api.delete(`/announcements/${id}`);
      loadData();
      setShowModal(false);
      alert('删除成功');
    } catch (error) {
      alert('删除失败');
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <div className="flex flex-between items-center mb-4">
        <h1 className="page-title" style={{ margin: 0 }}>公告通知</h1>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + 发布公告
          </button>
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>暂无公告</p>
        </div>
      ) : (
        announcements.map((ann) => (
          <div
            key={ann.id}
            className={`announcement-item ${!ann.read_at ? 'unread' : ''}`}
            onClick={() => handleView(ann)}
          >
            <div className="flex flex-between items-center">
              <strong style={{ fontSize: '16px' }}>{ann.title}</strong>
              <div className="flex gap-2">
                {ann.priority === 'high' && <span className="badge badge-danger">重要</span>}
                {ann.need_confirmation && <span className="badge badge-warning">需确认</span>}
                {!ann.read_at && <span className="badge badge-info">未读</span>}
                {ann.confirmed_at && <span className="badge badge-success">已确认</span>}
              </div>
            </div>
            <p style={{ marginTop: '8px', color: '#666' }}>{ann.content.substring(0, 150)}...</p>
            <div className="announcement-meta">
              <span>发布人: {ann.author_name}</span>
              <span>发布时间: {new Date(ann.created_at).toLocaleString()}</span>
              {typeof ann.read_count !== 'undefined' && (
                <span>已读: {ann.read_count}/{ann.total_count || 0}</span>
              )}
            </div>
          </div>
        ))
      )}

      {showModal && selectedAnn && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedAnn.title}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div style={{ marginBottom: '15px', color: '#999', fontSize: '13px' }}>
              <span>发布人: {selectedAnn.author_name}</span>
              <span style={{ marginLeft: '20px' }}>发布时间: {new Date(selectedAnn.created_at).toLocaleString()}</span>
            </div>
            <div style={{ lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{selectedAnn.content}</div>
            
            {selectedAnn.attachments?.length > 0 && (
              <div className="mt-4">
                <h4>附件</h4>
                {selectedAnn.attachments.map(att => (
                  <div key={att.id}>
                    <a href={`/api/announcements/${selectedAnn.id}/attachments/${att.id}/download`} target="_blank">
                      📎 {att.original_name}
                    </a>
                  </div>
                ))}
              </div>
            )}

            {selectedAnn.read_status && (
              <div className="mt-4">
                <h4>已读状态</h4>
                <table className="table">
                  <thead>
                    <tr>
                      <th>姓名</th>
                      <th>已读时间</th>
                      <th>确认时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAnn.read_status.map(r => (
                      <tr key={r.id}>
                        <td>{r.name}</td>
                        <td>{r.read_at ? new Date(r.read_at).toLocaleString() : '-'}</td>
                        <td>{r.confirmed_at ? new Date(r.confirmed_at).toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              {selectedAnn.need_confirmation && !selectedAnn.confirmed_at && user.role === 'guardian' && (
                <button className="btn btn-success" onClick={() => handleConfirm(selectedAnn.id)}>
                  确认回执
                </button>
              )}
              {canCreate && (
                <button className="btn btn-danger" onClick={() => handleDelete(selectedAnn.id)}>
                  删除公告
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="modal" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>发布公告</h3>
              <button className="close-btn" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>内容 *</label>
                <textarea
                  rows="5"
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>发布范围 *</label>
                <select
                  value={formData.scope_type}
                  onChange={e => setFormData({ ...formData, scope_type: e.target.value })}
                >
                  <option value="school">全校</option>
                  <option value="class">指定班级</option>
                </select>
              </div>
              {formData.scope_type === 'class' && (
                <div className="form-group">
                  <label>选择班级</label>
                  <select
                    value={formData.scope_id}
                    onChange={e => setFormData({ ...formData, scope_id: e.target.value })}
                  >
                    <option value="">请选择</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.grade_name} {c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>优先级</label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="normal">普通</option>
                  <option value="high">重要</option>
                </select>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.need_confirmation}
                    onChange={e => setFormData({ ...formData, need_confirmation: e.target.checked })}
                  />
                  需要家长确认回执
                </label>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary">发布</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Announcements;
