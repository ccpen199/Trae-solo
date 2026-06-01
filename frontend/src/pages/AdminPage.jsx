import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { categoriesAPI, newsAPI } from '../services/api';

function AdminPage() {
  const { currentUser, isEditorOrAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [news, setNews] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', description: '' });
  const [newNews, setNewNews] = useState({
    title: '',
    slug: '',
    summary: '',
    content: '',
    category_id: '',
  });

  useEffect(() => {
    if (isEditorOrAdmin()) {
      loadData();
    }
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'categories') {
        const response = await categoriesAPI.getAll();
        setCategories(response.data);
      } else if (activeTab === 'news') {
        const response = await newsAPI.getAll({ size: 100 });
        setNews(response.data.items);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await categoriesAPI.create(newCategory);
      setNewCategory({ name: '', slug: '', description: '' });
      loadData();
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleCreateNews = async (e) => {
    e.preventDefault();
    try {
      await newsAPI.create(newNews);
      setNewNews({ title: '', slug: '', summary: '', content: '', category_id: '' });
      loadData();
    } catch (error) {
      console.error('Failed to create news:', error);
    }
  };

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (!isEditorOrAdmin()) {
    return <div className="empty-state">权限不足，无法访问后台管理</div>;
  }

  return (
    <div>
      <h1 className="page-title">后台管理</h1>
      
      <div className="admin-layout">
        <aside className="sidebar">
          <div className="sidebar-section">
            <ul className="category-list">
              <li>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setActiveTab('categories'); }}
                  style={{ fontWeight: activeTab === 'categories' ? 'bold' : 'normal', color: activeTab === 'categories' ? '#3b82f6' : undefined }}
                >
                  分类管理
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setActiveTab('news'); }}
                  style={{ fontWeight: activeTab === 'news' ? 'bold' : 'normal', color: activeTab === 'news' ? '#3b82f6' : undefined }}
                >
                  新闻管理
                </a>
              </li>
            </ul>
          </div>
        </aside>

        <div className="profile-content">
          {activeTab === 'categories' && (
            <div>
              <h3 style={{ marginBottom: 20 }}>添加新分类</h3>
              <form onSubmit={handleCreateCategory} style={{ marginBottom: 40 }}>
                <div className="form-group">
                  <label>分类名称</label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>URL别名</label>
                  <input
                    type="text"
                    value={newCategory.slug}
                    onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>描述</label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <button type="submit" className="btn btn-primary">创建分类</button>
              </form>

              <h3 style={{ marginBottom: 20 }}>现有分类</h3>
              {categories.map((cat) => (
                <div key={cat.id} className="comment-item">
                  <div style={{ fontWeight: 'bold' }}>{cat.name}</div>
                  <div style={{ color: '#666', fontSize: 14 }}>别名: {cat.slug}</div>
                  {cat.description && <div style={{ color: '#999', fontSize: 14 }}>{cat.description}</div>}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'news' && (
            <div>
              <h3 style={{ marginBottom: 20 }}>发布新新闻</h3>
              <form onSubmit={handleCreateNews} style={{ marginBottom: 40 }}>
                <div className="form-group">
                  <label>标题</label>
                  <input
                    type="text"
                    value={newNews.title}
                    onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>URL别名</label>
                  <input
                    type="text"
                    value={newNews.slug}
                    onChange={(e) => setNewNews({ ...newNews, slug: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>摘要</label>
                  <textarea
                    value={newNews.summary}
                    onChange={(e) => setNewNews({ ...newNews, summary: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="form-group">
                  <label>内容</label>
                  <textarea
                    value={newNews.content}
                    onChange={(e) => setNewNews({ ...newNews, content: e.target.value })}
                    rows={8}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>分类</label>
                  <select
                    value={newNews.category_id}
                    onChange={(e) => setNewNews({ ...newNews, category_id: e.target.value })}
                  >
                    <option value="">选择分类</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary">发布新闻</button>
              </form>

              <h3 style={{ marginBottom: 20 }}>已发布新闻</h3>
              {news.map((item) => (
                <div key={item.id} className="comment-item">
                  <div style={{ fontWeight: 'bold' }}>{item.title}</div>
                  <div style={{ color: '#666', fontSize: 14 }}>
                    浏览: {item.views} | 分类: {item.category?.name || '未分类'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
