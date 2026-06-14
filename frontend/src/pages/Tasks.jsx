import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import TaskCard from '../components/TaskCard';

function Tasks({ showToast }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    task_type: '',
    category: '',
    keyword: '',
    min_budget: '',
    max_budget: '',
    location: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    total: 0
  });

  useEffect(() => {
    loadTasks();
  }, [pagination.page, filters]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('pageSize', pagination.pageSize);
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await api.get(`/tasks?${params.toString()}`);
      setTasks(response.data.data || []);
      setPagination(prev => ({ ...prev, total: response.data.total || 0 }));
    } catch (error) {
      showToast('加载任务失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleReset = () => {
    setFilters({
      task_type: '',
      category: '',
      keyword: '',
      min_budget: '',
      max_budget: '',
      location: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '32px' }}>任务大厅</h1>
      
      <div className="filter-bar">
        <div className="filter-item">
          <label>关键词</label>
          <input
            type="text"
            name="keyword"
            value={filters.keyword}
            onChange={handleFilterChange}
            placeholder="搜索任务"
          />
        </div>
        
        <div className="filter-item">
          <label>任务类型</label>
          <select name="task_type" value={filters.task_type} onChange={handleFilterChange}>
            <option value="">全部</option>
            <option value="online">线上任务</option>
            <option value="offline">线下任务</option>
            <option value="hybrid">混合任务</option>
          </select>
        </div>
        
        <div className="filter-item">
          <label>任务分类</label>
          <select name="category" value={filters.category} onChange={handleFilterChange}>
            <option value="">全部</option>
            <option value="问卷填写">问卷填写</option>
            <option value="内容审核">内容审核</option>
            <option value="试玩推广">试玩推广</option>
            <option value="地推">地推</option>
            <option value="快闪活动">快闪活动</option>
            <option value="门店驻点">门店驻点</option>
            <option value="社区团购">社区团购</option>
            <option value="校园代理">校园代理</option>
            <option value="数据录入">数据录入</option>
          </select>
        </div>
        
        <div className="filter-item">
          <label>最低金额</label>
          <input
            type="number"
            name="min_budget"
            value={filters.min_budget}
            onChange={handleFilterChange}
            placeholder="最低"
          />
        </div>
        
        <div className="filter-item">
          <label>最高金额</label>
          <input
            type="number"
            name="max_budget"
            value={filters.max_budget}
            onChange={handleFilterChange}
            placeholder="最高"
          />
        </div>
        
        <div className="filter-item">
          <label>地区</label>
          <input
            type="text"
            name="location"
            value={filters.location}
            onChange={handleFilterChange}
            placeholder="城市/区域"
          />
        </div>
        
        <button 
          className="btn btn-secondary" 
          onClick={handleReset}
          style={{ height: '40px', padding: '0 20px', alignSelf: 'flex-end' }}
        >
          重置
        </button>
      </div>
      
      {loading ? (
        <div className="empty-state">加载中...</div>
      ) : tasks.length > 0 ? (
        <>
          <div style={{ marginBottom: '16px', color: '#64748b', fontSize: '14px' }}>
            共找到 {pagination.total} 个任务
          </div>
          
          <div className="grid-3">
            {tasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                showToast={showToast}
                onAcceptSuccess={loadTasks}
              />
            ))}
          </div>
          
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
              <button
                className="btn btn-secondary"
                style={{ padding: '8px 16px' }}
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
              >
                上一页
              </button>
              
              <span style={{ display: 'flex', alignItems: 'center', color: '#64748b' }}>
                {pagination.page} / {totalPages}
              </span>
              
              <button
                className="btn btn-secondary"
                style={{ padding: '8px 16px' }}
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
                disabled={pagination.page === totalPages}
              >
                下一页
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
          <p>暂无符合条件的任务</p>
        </div>
      )}
    </div>
  );
}

export default Tasks;
