import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAPI } from '../api';

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await searchAPI.getHistory();
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const res = await searchAPI.search(query);
      setResults(res.data);
      loadHistory();
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchFromHistory = (term) => {
    setQuery(term);
    handleSearch();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button 
          style={styles.backBtn}
          onClick={() => navigate('/')}
        >
          ← 返回
        </button>
        <h1 style={styles.title}>搜索</h1>
      </div>

      <div style={styles.searchBar}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="搜索任务、清单或标签..."
          style={styles.searchInput}
          autoFocus
        />
        <button onClick={handleSearch} style={styles.searchBtn}>
          🔍
        </button>
      </div>

      {!results && history.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>搜索历史</div>
          <div style={styles.historyList}>
            {history.map((term, idx) => (
              <button
                key={idx}
                onClick={() => searchFromHistory(term)}
                style={styles.historyItem}
              >
                <span>🕐</span>
                <span>{term}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div style={styles.loading}>搜索中...</div>
      )}

      {results && (
        <div style={styles.results}>
          {results.tasks.length > 0 && (
            <div style={styles.resultSection}>
              <div style={styles.resultSectionTitle}>
                任务 ({results.tasks.length})
              </div>
              {results.tasks.map(task => (
                <div key={task.id} style={styles.taskResult}>
                  <div style={styles.taskTitle}>
                    {task.title}
                  </div>
                  <div style={styles.taskMeta}>
                    <span style={styles.taskList}>{task.list_name}</span>
                    {task.is_completed && (
                      <span style={styles.completedBadge}>已完成</span>
                    )}
                  </div>
                  {task.tags && task.tags.length > 0 && (
                    <div style={styles.tags}>
                      {task.tags.map((tag, idx) => (
                        <span key={idx} style={styles.tag}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {results.lists.length > 0 && (
            <div style={styles.resultSection}>
              <div style={styles.resultSectionTitle}>
                清单 ({results.lists.length})
              </div>
              {results.lists.map(list => (
                <div key={list.id} style={styles.listResult}>
                  <span style={{ color: list.color, marginRight: '8px', fontSize: '18px' }}>
                    {list.icon || '📋'}
                  </span>
                  <span style={styles.listName}>{list.name}</span>
                </div>
              ))}
            </div>
          )}

          {results.tags.length > 0 && (
            <div style={styles.resultSection}>
              <div style={styles.resultSectionTitle}>
                标签 ({results.tags.length})
              </div>
              <div style={styles.tagsList}>
                {results.tags.map(tag => (
                  <span key={tag.id} style={{
                    ...styles.searchTag,
                    background: tag.color + '20',
                    color: tag.color,
                    borderColor: tag.color
                  }}>
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {results.tasks.length === 0 && 
           results.lists.length === 0 && 
           results.tags.length === 0 && (
            <div style={styles.noResults}>
              <div style={styles.noResultsIcon}>🔍</div>
              <p>未找到相关结果</p>
              <p style={styles.noResultsHint}>尝试其他关键词</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f8f9fa'
  },
  header: {
    padding: '16px 20px',
    background: 'white',
    borderBottom: '1px solid #e8e8e8',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  backBtn: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    color: '#666',
    padding: 0
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#333'
  },
  searchBar: {
    padding: '16px 20px',
    background: 'white',
    display: 'flex',
    gap: '12px'
  },
  searchInput: {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid #e8e8e8',
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  searchBtn: {
    padding: '0 20px',
    background: '#dd4b39',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer'
  },
  section: {
    padding: '20px'
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: '12px'
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  historyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    background: 'white',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#333',
    textAlign: 'left'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#999'
  },
  results: {
    padding: '0 20px 20px'
  },
  resultSection: {
    marginBottom: '24px'
  },
  resultSectionTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: '12px',
    paddingTop: '16px'
  },
  taskResult: {
    background: 'white',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '8px'
  },
  taskTitle: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#333',
    marginBottom: '6px'
  },
  taskMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px'
  },
  taskList: {
    fontSize: '12px',
    color: '#999',
    background: '#f5f5f5',
    padding: '2px 8px',
    borderRadius: '10px'
  },
  completedBadge: {
    fontSize: '12px',
    color: '#4caf50',
    background: '#e8f5e9',
    padding: '2px 8px',
    borderRadius: '10px'
  },
  tags: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap'
  },
  tag: {
    background: '#f0f0f0',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    color: '#666'
  },
  listResult: {
    background: 'white',
    padding: '14px 16px',
    borderRadius: '8px',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center'
  },
  listName: {
    fontSize: '14px',
    color: '#333'
  },
  tagsList: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  searchTag: {
    padding: '6px 14px',
    borderRadius: '16px',
    fontSize: '13px',
    border: '1px solid'
  },
  noResults: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#999'
  },
  noResultsIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.5
  },
  noResultsHint: {
    fontSize: '13px',
    marginTop: '4px'
  }
};
