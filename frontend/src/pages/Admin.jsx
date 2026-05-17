import { useState, useEffect } from 'react';
import { getTopics, createTopic, updateTopic, deleteTopic } from '../api/topics';
import Loading, { EmptyState } from '../components/Loading';
import { showSuccess } from '../utils/request';
import './Admin.css';

const Admin = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    keywords: '',
    background_image: '',
    tags: '',
    start_time: '',
    end_time: '',
    status: 1,
    priority: 0,
  });

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const res = await getTopics({ pageSize: 100 });
      setTopics(res.data?.list || []);
    } catch (err) {
      console.error('Get topics error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const handleAdd = () => {
    setEditingTopic(null);
    setFormData({
      name: '',
      description: '',
      keywords: '',
      background_image: '',
      tags: '',
      start_time: '',
      end_time: '',
      status: 1,
      priority: 0,
    });
    setModalOpen(true);
  };

  const handleEdit = (topic) => {
    setEditingTopic(topic);
    setFormData({
      name: topic.name,
      description: topic.description || '',
      keywords: Array.isArray(topic.keywords) ? topic.keywords.join(',') : topic.keywords || '',
      background_image: topic.background_image || '',
      tags: Array.isArray(topic.tags) ? topic.tags.join(',') : topic.tags || '',
      start_time: topic.start_time || '',
      end_time: topic.end_time || '',
      status: topic.status,
      priority: topic.priority,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这个话题吗？')) {
      await deleteTopic(id);
      showSuccess('删除成功');
      fetchTopics();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTopic) {
        await updateTopic(editingTopic.id, formData);
        showSuccess('更新成功');
      } else {
        await createTopic(formData);
        showSuccess('创建成功');
      }
      setModalOpen(false);
      fetchTopics();
    } catch (err) {
      console.error('Submit error:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value,
    }));
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>话题管理</h1>
        <button className="add-btn" onClick={handleAdd}>
          + 新增话题
        </button>
      </div>

      <div className="admin-content">
        {loading ? (
          <Loading />
        ) : topics.length === 0 ? (
          <EmptyState message="暂无话题" />
        ) : (
          <div className="topics-table">
            <div className="table-header">
              <span className="col-name">话题名称</span>
              <span className="col-status">状态</span>
              <span className="col-stats">数据</span>
              <span className="col-actions">操作</span>
            </div>
            {topics.map((topic) => (
              <div key={topic.id} className="table-row">
                <span className="col-name">{topic.name}</span>
                <span className="col-status">
                  <span className={`status-badge ${topic.status ? 'active' : 'inactive'}`}>
                    {topic.status ? '启用' : '禁用'}
                  </span>
                </span>
                <span className="col-stats">
                  <span>{topic.note_count || 0} 笔记</span>
                  <span>{topic.view_count || 0} 浏览</span>
                </span>
                <span className="col-actions">
                  <button className="edit-btn" onClick={() => handleEdit(topic)}>
                    编辑
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(topic.id)}>
                    删除
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTopic ? '编辑话题' : '新增话题'}</h2>
              <button className="close-btn" onClick={() => setModalOpen(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>话题名称 *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="请输入话题名称"
                />
              </div>
              <div className="form-group">
                <label>话题描述</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="请输入话题描述"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>搜索关键词</label>
                <input
                  type="text"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleChange}
                  placeholder="多个关键词用逗号分隔"
                />
              </div>
              <div className="form-group">
                <label>标签</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="多个标签用逗号分隔"
                />
              </div>
              <div className="form-group">
                <label>背景图片URL</label>
                <input
                  type="text"
                  name="background_image"
                  value={formData.background_image}
                  onChange={handleChange}
                  placeholder="请输入图片URL"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>优先级</label>
                  <input
                    type="number"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    placeholder="数字越大越靠前"
                  />
                </div>
                <div className="form-group">
                  <label>状态</label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="status"
                      checked={formData.status === 1}
                      onChange={handleChange}
                    />
                    启用
                  </label>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>开始时间</label>
                  <input
                    type="datetime-local"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>结束时间</label>
                  <input
                    type="datetime-local"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setModalOpen(false)}>
                  取消
                </button>
                <button type="submit" className="submit-btn">
                  {editingTopic ? '更新' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
