import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { candidatesAPI } from '../services/api.js';

function CandidateList() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [allCandidates, setAllCandidates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTags, setSearchTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      const res = await candidatesAPI.getAll();
      setCandidates(res.data);
      setAllCandidates(res.data);
      setSearchTags([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to load candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      const tags = searchQuery.split(/[,，\s]+/).filter(t => t.trim());
      if (tags.length > 0) {
        setSearchTags(tags);
        const res = await candidatesAPI.search(tags);
        setCandidates(res.data);
      }
    } else {
      loadCandidates();
    }
  };

  const handleReset = () => {
    loadCandidates();
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>👥 人才库</h1>
        <p>多维标签管理，智能检索相似人才</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div className="card-title" style={{ marginBottom: 0 }}>人才列表</div>
          <Link to="/candidates/new">
            <button className="btn btn-primary">➕ 添加人才</button>
          </Link>
        </div>

        <div className="search-box">
          <input
            type="text"
            className="form-input"
            placeholder="按标签搜索（多个标签用逗号分隔，如：React, Java, 电商平台）..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn btn-primary" onClick={handleSearch}>🔍 搜索</button>
          <button className="btn btn-secondary" onClick={handleReset}>重置</button>
        </div>

        {searchTags.length > 0 && (
          <div style={{ marginTop: '12px', padding: '12px', background: '#e3f2fd', borderRadius: '8px' }}>
            <div style={{ marginBottom: '8px', fontSize: '13px', color: '#1565c0', fontWeight: 500 }}>
              🔍 当前检索标签：
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              {searchTags.map((tag, idx) => (
                <span key={idx} className="tag tag-tech">{tag}</span>
              ))}
            </div>
            <div style={{ fontSize: '12px', color: '#555' }}>
              共检索到 <strong>{candidates.length}</strong> 位匹配人才（人才库总计 <strong>{allCandidates.length}</strong> 人）
            </div>
          </div>
        )}

        {candidates.length > 0 ? (
          <table className="table" style={{ marginTop: searchTags.length > 0 ? '16px' : 0 }}>
            <thead>
              <tr>
                <th>姓名</th>
                <th>技术栈</th>
                <th>离职原因</th>
                <th>求职活跃度</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map(candidate => (
                <tr key={candidate.id}>
                  <td style={{ fontWeight: 500, cursor: 'pointer', color: '#1976d2' }}
                      onClick={() => navigate(`/candidates/${candidate.id}`)}>
                    {candidate.name}
                  </td>
                  <td>
                    {candidate.tech_stack?.split(',').slice(0, 3).map((tech, i) => (
                      <span key={i} className="tag tag-tech">{tech.trim()}</span>
                    ))}
                  </td>
                  <td>
                    <span className="tag tag-reason">
                      {candidate.resignation_reason_display || candidate.resignation_reason || '-'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${candidate.job_activity === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                      {candidate.job_activity_display || (candidate.job_activity === 'active' ? '积极求职' : '待激活')}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => navigate(`/candidates/${candidate.id}`)}
                    >
                      查看详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state" style={{ marginTop: searchTags.length > 0 ? '16px' : 0 }}>
            <div className="empty-state-icon">👥</div>
            <div>{searchTags.length > 0 ? '未找到匹配的人才，请调整搜索标签' : '暂无人才数据'}</div>
            {searchTags.length > 0 && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                已搜索标签：{searchTags.join('、')}，共{allCandidates.length}人可检索
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CandidateList;
