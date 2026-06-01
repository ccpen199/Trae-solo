import { useEffect, useState } from 'react';
import api from '../utils/api';
import { CustomerProfile, CustomerTag } from '../types';

export default function CustomerList() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [allTags, setAllTags] = useState<{ tags: CustomerTag[]; grouped: Record<string, CustomerTag[]> }>({ tags: [], grouped: {} });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    industry: '',
    purchase_intent: '',
    lifecycle_stage: '',
    followup_status: '',
    tag_id: '',
  });
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [filters]);

  const loadTags = async () => {
    try {
      const res = await api.get('/customers/tags');
      setAllTags(res.data);
    } catch (error) {
      console.error('Load tags error:', error);
    }
  };

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.industry) params.append('industry', filters.industry);
      if (filters.purchase_intent) params.append('purchase_intent', filters.purchase_intent);
      if (filters.lifecycle_stage) params.append('lifecycle_stage', filters.lifecycle_stage);
      if (filters.followup_status) params.append('followup_status', filters.followup_status);
      if (filters.tag_id) params.append('tag_id', filters.tag_id);
      
      const res = await api.get(`/customers?${params.toString()}`);
      setCustomers(res.data.data || []);
    } catch (error) {
      console.error('Load customers error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(customers.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#1890ff';
    if (score >= 40) return '#faad14';
    return '#8c8c8c';
  };

  const getIntentLabel = (intent: string) => {
    const labels: Record<string, string> = { high: '高意向', medium: '中意向', low: '低意向' };
    return labels[intent] || intent;
  };

  const getIntentColor = (intent: string) => {
    const colors: Record<string, string> = { high: '#ff4d4f', medium: '#faad14', low: '#52c41a' };
    return colors[intent] || '#1890ff';
  };

  const splitArray = (str: string, separator = ',') => {
    return str ? str.split(separator).filter(Boolean) : [];
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="page-title" style={{ margin: 0 }}>客户画像</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-default'} btn-sm`} onClick={() => setViewMode('table')}>
            表格
          </button>
          <button className={`btn ${viewMode === 'card' ? 'btn-primary' : 'btn-default'} btn-sm`} onClick={() => setViewMode('card')}>
            卡片
          </button>
        </div>
      </div>

      <div className="card">
        <div className="filters">
          <div className="filter-item">
            <input
              type="text"
              placeholder="搜索姓名、邮箱、公司、职位..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div className="filter-item">
            <select
              value={filters.industry}
              onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
            >
              <option value="">所有行业</option>
              <option value="软件服务">软件服务</option>
              <option value="金融">金融</option>
              <option value="零售">零售</option>
              <option value="制造业">制造业</option>
              <option value="医疗健康">医疗健康</option>
            </select>
          </div>
          <div className="filter-item">
            <select
              value={filters.purchase_intent}
              onChange={(e) => setFilters({ ...filters, purchase_intent: e.target.value })}
            >
              <option value="">购买意向</option>
              <option value="high">高意向</option>
              <option value="medium">中意向</option>
              <option value="low">低意向</option>
            </select>
          </div>
          <div className="filter-item">
            <select
              value={filters.lifecycle_stage}
              onChange={(e) => setFilters({ ...filters, lifecycle_stage: e.target.value })}
            >
              <option value="">生命周期</option>
              <option value="初步接触">初步接触</option>
              <option value="需求确认">需求确认</option>
              <option value="方案评估">方案评估</option>
              <option value="商务谈判">商务谈判</option>
            </select>
          </div>
          <div className="filter-item">
            <select
              value={filters.tag_id}
              onChange={(e) => setFilters({ ...filters, tag_id: e.target.value })}
            >
              <option value="">按标签筛选</option>
              {allTags.tags.map(tag => (
                <option key={tag.id} value={tag.id}>[{tag.category}] {tag.name}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div style={{ marginBottom: 16, padding: 12, background: '#e6f7ff', borderRadius: 4 }}>
            已选择 {selectedIds.length} 项
            <select style={{ marginLeft: 12 }} onChange={async (e) => {
              if (e.target.value) {
                await api.post('/customers/batch', {
                  ids: selectedIds,
                  action: 'add_tags',
                  data: { tag_ids: [parseInt(e.target.value)] }
                });
                loadCustomers();
                e.target.value = '';
              }
            }}>
              <option value="">批量打标签</option>
              {allTags.tags.map(tag => (
                <option key={tag.id} value={tag.id}>[{tag.category}] {tag.name}</option>
              ))}
            </select>
          </div>
        )}

        {viewMode === 'table' ? (
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.length === customers.length && customers.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>客户</th>
                <th>公司</th>
                <th>画像标签</th>
                <th>意向</th>
                <th>阶段</th>
                <th>跟进状态</th>
                <th>预算</th>
                <th>评分</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(customer.id)}
                      onChange={() => handleSelect(customer.id)}
                    />
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{customer.name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{customer.email}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{customer.position}</div>
                  </td>
                  <td>
                    <div>{customer.company}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{customer.industry} · {customer.region}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 200 }}>
                      {customer.tags?.slice(0, 4).map((tag, i) => (
                        <span
                          key={i}
                          style={{
                            padding: '2px 8px',
                            borderRadius: 10,
                            fontSize: 11,
                            background: tag.color + '20',
                            color: tag.color,
                            border: `1px solid ${tag.color}40`
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                      {customer.tags && customer.tags.length > 4 && (
                        <span style={{ fontSize: 11, color: '#888' }}>+{customer.tags.length - 4}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{ color: getIntentColor(customer.purchase_intent), fontWeight: 500 }}>
                      {getIntentLabel(customer.purchase_intent)}
                    </span>
                  </td>
                  <td>{customer.lifecycle_stage || '-'}</td>
                  <td>{customer.followup_status || '-'}</td>
                  <td>{customer.budget_range || '-'}</td>
                  <td>
                    <span style={{ 
                      color: getScoreColor(customer.score), 
                      fontWeight: 600, 
                      fontSize: 16 
                    }}>
                      {customer.score}
                    </span>
                  </td>
                  <td>
                    {customer.is_sensitive ? (
                      <span className="status-badge status-critical">敏感</span>
                    ) : (
                      <span className="status-badge status-info">普通</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="card"
                style={{ margin: 0, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{customer.name}</div>
                    <div style={{ fontSize: 13, color: '#666' }}>{customer.position}</div>
                    <div style={{ fontSize: 13, color: '#666' }}>{customer.company}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: 24, 
                      fontWeight: 700, 
                      color: getScoreColor(customer.score) 
                    }}>
                      {customer.score}
                    </div>
                    <div style={{ fontSize: 11, color: '#888' }}>画像评分</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 13 }}>
                  <span style={{ color: getIntentColor(customer.purchase_intent) }}>
                    ● {getIntentLabel(customer.purchase_intent)}
                  </span>
                  <span style={{ color: '#666' }}>{customer.lifecycle_stage}</span>
                  <span style={{ color: '#666' }}>{customer.budget_range || '预算未明'}</span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                  {customer.tags?.map((tag, i) => (
                    <span
                      key={i}
                      title={tag.description}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: 11,
                        background: tag.color + '20',
                        color: tag.color,
                        border: `1px solid ${tag.color}40`
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>

                {customer.pain_points && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>痛点</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {splitArray(customer.pain_points).map((p, i) => (
                        <span key={i} style={{ 
                          padding: '2px 6px', 
                          fontSize: 11, 
                          background: '#fff1f0', 
                          color: '#ff4d4f',
                          borderRadius: 4
                        }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {customer.key_requirements && (
                  <div>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>核心需求</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {splitArray(customer.key_requirements).map((r, i) => (
                        <span key={i} style={{ 
                          padding: '2px 6px', 
                          fontSize: 11, 
                          background: '#e6f7ff', 
                          color: '#1890ff',
                          borderRadius: 4
                        }}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
