import React, { useState } from 'react';
import { customerApi } from '../services/api';
import { getNodeLabel, getExceptionLabel } from '../constants';

const CustomerTrack = () => {
  const [searchType, setSearchType] = useState('container');
  const [searchValue, setSearchValue] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchValue.trim()) {
      setError('请输入查询内容');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);

      const params = searchType === 'container' 
        ? { container_number: searchValue.trim() }
        : { booking_number: searchValue.trim() };

      const response = await customerApi.track(params);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || '查询失败，请检查输入是否正确');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.pageTitle}>物流进度查询</h2>
        <p style={styles.subtitle}>输入箱号或订舱号查询货物状态</p>
      </div>

      <form onSubmit={handleSearch} style={styles.searchForm}>
        <div style={styles.searchType}>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              value="container"
              checked={searchType === 'container'}
              onChange={(e) => setSearchType(e.target.value)}
              style={styles.radio}
            />
            按箱号查询
          </label>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              value="booking"
              checked={searchType === 'booking'}
              onChange={(e) => setSearchType(e.target.value)}
              style={styles.radio}
            />
            按订舱号查询
          </label>
        </div>
        <div style={styles.searchInputWrapper}>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={searchType === 'container' ? '请输入箱号，如 ABCU1234567' : '请输入订舱号'}
            style={styles.searchInput}
          />
          <button type="submit" style={styles.searchButton} disabled={loading}>
            {loading ? '查询中...' : '查询'}
          </button>
        </div>
      </form>

      {error && <div style={styles.error}>{error}</div>}

      {result && (
        <div style={styles.result}>
          <div style={styles.infoCard}>
            <h3 style={styles.sectionTitle}>货物信息</h3>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>箱号</span>
                <span style={styles.infoValue}>{result.container.container_number}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>订舱号</span>
                <span style={styles.infoValue}>{result.container.booking_number || '-'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>箱型</span>
                <span style={styles.infoValue}>{result.container.container_type}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>起运港</span>
                <span style={styles.infoValue}>{result.container.origin_port || '-'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>目的港</span>
                <span style={styles.infoValue}>{result.container.destination_port || '-'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>当前状态</span>
                <span style={styles.statusBadge}>{result.nodes.length > 0 ? getNodeLabel(result.nodes[0].node_type) : '待起运'}</span>
              </div>
            </div>
          </div>

          <div style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}>物流轨迹</h3>
            <div style={styles.timeline}>
              {result.nodes.length === 0 ? (
                <div style={styles.empty}>暂无物流节点数据</div>
              ) : (
                result.nodes.slice().sort((a, b) => new Date(b.node_time) - new Date(a.node_time)).map((node, index) => (
                  <div key={node.id} style={styles.timelineItem}>
                    <div style={styles.timelineDot(index === 0)}></div>
                    <div style={styles.timelineContent(index === 0)}>
                      <div style={styles.timelineHeader}>
                        <span style={styles.nodeType(index === 0)}>{getNodeLabel(node.node_type)}</span>
                        <span style={styles.nodeTime}>{new Date(node.node_time).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {result.exceptions && result.exceptions.length > 0 && (
            <div style={styles.sectionCard}>
              <h3 style={styles.sectionTitle}>异常提醒</h3>
              <div style={styles.exceptionList}>
                {result.exceptions.map((exception) => (
                  <div key={exception.id} style={styles.exceptionCard}>
                    <div style={styles.exceptionHeader}>
                      <span style={styles.exceptionType}>{getExceptionLabel(exception.exception_type)}</span>
                      <span style={styles.exceptionTime}>{new Date(exception.reported_at).toLocaleString()}</span>
                    </div>
                    {exception.description && (
                      <div style={styles.exceptionDesc}>{exception.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  pageTitle: {
    fontSize: '2rem',
    fontWeight: 600,
    color: '#1a365d',
    margin: '0 0 0.5rem 0',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#718096',
    margin: 0,
  },
  searchForm: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '1.5rem',
  },
  searchType: {
    display: 'flex',
    gap: '2rem',
    marginBottom: '1rem',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    color: '#2d3748',
  },
  radio: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  searchInputWrapper: {
    display: 'flex',
    gap: '0.5rem',
  },
  searchInput: {
    flex: 1,
    padding: '1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '1rem',
    transition: 'border-color 0.2s',
  },
  searchButton: {
    backgroundColor: '#3182ce',
    color: 'white',
    border: 'none',
    padding: '1rem 2rem',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  error: {
    backgroundColor: '#fed7d7',
    color: '#c53030',
    padding: '1rem',
    borderRadius: '6px',
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  result: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#2d3748',
    margin: '0 0 1rem 0',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.5rem',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  infoLabel: {
    fontSize: '0.875rem',
    color: '#718096',
  },
  infoValue: {
    fontSize: '1.125rem',
    color: '#2d3748',
    fontWeight: 500,
  },
  statusBadge: {
    display: 'inline-block',
    backgroundColor: '#c6f6d5',
    color: '#2f855a',
    padding: '0.5rem 1rem',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    fontWeight: 600,
    alignSelf: 'flex-start',
  },
  timeline: {
    position: 'relative',
    paddingLeft: '2rem',
  },
  timelineItem: {
    position: 'relative',
    paddingBottom: '1.5rem',
  },
  timelineDot: (isLatest) => ({
    position: 'absolute',
    left: '-2rem',
    top: '0.25rem',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: isLatest ? '#38a169' : '#a0aec0',
    border: '3px solid white',
    boxShadow: isLatest ? '0 0 0 2px #38a169' : '0 0 0 2px #a0aec0',
  }),
  timelineContent: (isLatest) => ({
    backgroundColor: isLatest ? '#f0fff4' : '#f7fafc',
    borderRadius: '6px',
    padding: '1rem',
  }),
  timelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nodeType: (isLatest) => ({
    fontWeight: 600,
    color: isLatest ? '#2f855a' : '#2b6cb0',
    fontSize: '1.125rem',
  }),
  nodeTime: {
    fontSize: '0.875rem',
    color: '#718096',
  },
  empty: {
    textAlign: 'center',
    padding: '2rem',
    color: '#718096',
    backgroundColor: '#f7fafc',
    borderRadius: '6px',
  },
  exceptionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  exceptionCard: {
    backgroundColor: '#fff5f5',
    borderRadius: '6px',
    padding: '1rem',
    borderLeft: '4px solid #e53e3e',
  },
  exceptionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  exceptionType: {
    fontWeight: 600,
    color: '#c53030',
  },
  exceptionTime: {
    fontSize: '0.875rem',
    color: '#718096',
  },
  exceptionDesc: {
    fontSize: '0.875rem',
    color: '#4a5568',
  },
};

export default CustomerTrack;
