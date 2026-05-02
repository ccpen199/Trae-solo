import { useState } from 'react';
import { traceApi } from '../services/api';
import type { CallLog } from '../types';

type SearchMode = 'traceId' | 'fingerprint';

export function Trace() {
  const [searchMode, setSearchMode] = useState<SearchMode>('traceId');
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<CallLog | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setSelectedLog(null);

    try {
      let data: CallLog[];
      if (searchMode === 'traceId') {
        data = await traceApi.getByTraceId(searchValue.trim());
      } else {
        data = await traceApi.getByFingerprint(searchValue.trim());
      }
      setResults(data);
      if (data.length === 0) {
        setError('未找到符合搜索条件的记录。');
      }
    } catch (err) {
      setError('搜索失败：' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return '#10b981';
    if (statusCode >= 400 && statusCode < 500) return '#f59e0b';
    return '#ef4444';
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: '#3b82f6',
      POST: '#10b981',
      PUT: '#f59e0b',
      DELETE: '#ef4444',
      PATCH: '#8b5cf6',
    };
    return colors[method] || '#6b7280';
  };

  const formatJson = (str: string | null) => {
    if (!str) return '无';
    try {
      const parsed = JSON.parse(str);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return str;
    }
  };

  const truncate = (str: string, maxLen: number = 50) => {
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen) + '...';
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>链路追踪</h1>
          <p style={styles.subtitle}>
            全请求可追溯与审计，满足零信任架构下的接口安全管控需求
          </p>
        </div>
      </div>

      <div style={styles.searchCard}>
        <div style={styles.searchTabs}>
          <button
            style={{
              ...styles.searchTab,
              ...(searchMode === 'traceId' ? styles.searchTabActive : {}),
            }}
            onClick={() => {
              setSearchMode('traceId');
              setSearchValue('');
              setResults([]);
              setSelectedLog(null);
            }}
          >
            🔗 按追踪 ID 搜索
          </button>
          <button
            style={{
              ...styles.searchTab,
              ...(searchMode === 'fingerprint' ? styles.searchTabActive : {}),
            }}
            onClick={() => {
              setSearchMode('fingerprint');
              setSearchValue('');
              setResults([]);
              setSelectedLog(null);
            }}
          >
            🎯 按请求指纹搜索
          </button>
        </div>

        <form onSubmit={handleSearch} style={styles.searchForm}>
          <input
            type="text"
            style={styles.searchInput}
            placeholder={
              searchMode === 'traceId'
                ? '输入追踪 ID（如：trace-abc123-def456）'
                : '输入请求指纹（SHA256 哈希值）'
            }
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <button
            type="submit"
            style={styles.searchButton}
            disabled={loading || !searchValue.trim()}
          >
            {loading ? '搜索中...' : '🔍 搜索'}
          </button>
        </form>

        <div style={styles.searchInfo}>
          {searchMode === 'traceId' ? (
            <p style={styles.infoText}>
              <strong>追踪 ID：</strong>每个请求流经 API 网关时分配的唯一标识符。使用此 ID 可追踪单个请求的完整生命周期。
            </p>
          ) : (
            <p style={styles.infoText}>
              <strong>请求指纹：</strong>根据请求方法、路径、请求头和请求体计算的加密哈希值。用于零信任架构中的法医分析和重复请求检测。
            </p>
          )}
        </div>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {results.length > 0 && (
        <div style={styles.resultsSection}>
          <div style={styles.resultsHeader}>
            <h2 style={styles.resultsTitle}>搜索结果</h2>
            <span style={styles.resultsCount}>
              找到 {results.length} 条记录
            </span>
          </div>

          <div style={styles.resultsGrid}>
            <div style={styles.resultsList}>
              {results.map((log) => (
                <div
                  key={log.id}
                  style={{
                    ...styles.resultItem,
                    ...(selectedLog?.id === log.id ? styles.resultItemSelected : {}),
                  }}
                  onClick={() => setSelectedLog(log)}
                >
                  <div style={styles.resultItemHeader}>
                    <span
                      style={{
                        ...styles.methodBadge,
                        backgroundColor: getMethodColor(log.method),
                      }}
                    >
                      {log.method}
                    </span>
                    <span
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: getStatusColor(log.status_code) + '20',
                        color: getStatusColor(log.status_code),
                      }}
                    >
                      {log.status_code}
                    </span>
                  </div>
                  <div style={styles.resultItemPath}>{truncate(log.path, 40)}</div>
                  <div style={styles.resultItemMeta}>
                    <span style={styles.metaText}>
                      📅 {new Date(log.created_at * 1000).toLocaleString()}
                    </span>
                    <span style={styles.metaText}>⏱️ {log.duration}ms</span>
                  </div>
                </div>
              ))}
            </div>

            {selectedLog && (
              <div style={styles.detailPanel}>
                <div style={styles.detailHeader}>
                  <h3 style={styles.detailTitle}>请求详情</h3>
                  <button
                    style={styles.closeButton}
                    onClick={() => setSelectedLog(null)}
                  >
                    ✕
                  </button>
                </div>

                <div style={styles.detailContent}>
                  <DetailSection title="基本信息">
                    <DetailRow label="追踪 ID" value={selectedLog.trace_id} mono />
                    <DetailRow label="请求指纹" value={selectedLog.request_fingerprint} mono />
                    <DetailRow label="服务 ID" value={selectedLog.service_id || '无'} mono />
                    <DetailRow label="API ID" value={selectedLog.api_id || '无'} mono />
                    <DetailRow label="API 密钥 ID" value={selectedLog.api_key_id || '无'} mono />
                  </DetailSection>

                  <DetailSection title="请求信息">
                    <DetailRow label="方法" value={selectedLog.method} />
                    <DetailRow label="路径" value={selectedLog.path} mono />
                    <DetailRow
                      label="状态"
                      value={`${selectedLog.status_code}`}
                      color={getStatusColor(selectedLog.status_code)}
                    />
                    <DetailRow label="耗时" value={`${selectedLog.duration}ms`} />
                    {selectedLog.client_ip && (
                      <DetailRow label="客户端 IP" value={selectedLog.client_ip} mono />
                    )}
                    {selectedLog.user_agent && (
                      <DetailRow label="User Agent" value={truncate(selectedLog.user_agent, 60)} />
                    )}
                  </DetailSection>

                  {selectedLog.error_message && (
                    <DetailSection title="错误信息">
                      <div style={styles.errorDetail}>
                        {selectedLog.error_message}
                      </div>
                    </DetailSection>
                  )}

                  {selectedLog.request_headers && (
                    <DetailSection title="请求头" collapsible>
                      <pre style={styles.jsonPreview}>
                        {formatJson(selectedLog.request_headers)}
                      </pre>
                    </DetailSection>
                  )}

                  {selectedLog.request_body && (
                    <DetailSection title="请求体" collapsible>
                      <pre style={styles.jsonPreview}>
                        {formatJson(selectedLog.request_body)}
                      </pre>
                    </DetailSection>
                  )}

                  {selectedLog.response_headers && (
                    <DetailSection title="响应头" collapsible>
                      <pre style={styles.jsonPreview}>
                        {formatJson(selectedLog.response_headers)}
                      </pre>
                    </DetailSection>
                  )}

                  {selectedLog.response_body && (
                    <DetailSection title="响应体" collapsible>
                      <pre style={styles.jsonPreview}>
                        {formatJson(selectedLog.response_body)}
                      </pre>
                    </DetailSection>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailSection({
  title,
  children,
  collapsible = false,
}: {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const content = (
    <div style={styles.detailSectionContent}>
      {children}
    </div>
  );

  return (
    <div style={styles.detailSection}>
      <div style={styles.detailSectionHeader}>
        <h4 style={styles.detailSectionTitle}>{title}</h4>
        {collapsible && (
          <button
            style={styles.collapseButton}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? '▼' : '▲'}
          </button>
        )}
      </div>
      {!collapsed && content}
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
  color,
}: {
  label: string;
  value: string;
  mono?: boolean;
  color?: string;
}) {
  return (
    <div style={styles.detailRow}>
      <span style={styles.detailRowLabel}>{label}</span>
      <span
        style={{
          ...styles.detailRowValue,
          fontFamily: mono ? 'monospace' : 'inherit',
          color: color || '#1f2937',
        }}
      >
        {value}
      </span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    marginBottom: '24px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 700,
    color: '#1f2937',
  },
  subtitle: {
    margin: '8px 0 0 0',
    fontSize: '14px',
    color: '#6b7280',
  },
  searchCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '24px',
  },
  searchTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
  },
  searchTab: {
    padding: '12px 24px',
    border: 'none',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  searchTabActive: {
    backgroundColor: '#3b82f6',
    color: '#fff',
  },
  searchForm: {
    display: 'flex',
    gap: '12px',
  },
  searchInput: {
    flex: 1,
    padding: '14px 20px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border-color 0.2s',
  },
  searchButton: {
    padding: '14px 32px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  searchInfo: {
    marginTop: '16px',
    padding: '12px 16px',
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
  },
  infoText: {
    margin: 0,
    fontSize: '13px',
    color: '#1d4ed8',
    lineHeight: 1.6,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    marginBottom: '24px',
    color: '#dc2626',
    fontSize: '14px',
  },
  resultsSection: {},
  resultsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  resultsTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#1f2937',
  },
  resultsCount: {
    fontSize: '14px',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '6px 16px',
    borderRadius: '20px',
  },
  resultsGrid: {
    display: 'grid',
    gridTemplateColumns: '350px 1fr',
    gap: '24px',
  },
  resultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  resultItem: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '16px',
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'all 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  resultItemSelected: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
  },
  resultItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  methodBadge: {
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#fff',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
  },
  resultItemPath: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1f2937',
    marginBottom: '8px',
    fontFamily: 'monospace',
  },
  resultItemMeta: {
    display: 'flex',
    gap: '16px',
  },
  metaText: {
    fontSize: '12px',
    color: '#6b7280',
  },
  detailPanel: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    maxHeight: '70vh',
    overflow: 'auto',
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #f3f4f6',
    position: 'sticky',
    top: 0,
    backgroundColor: '#fff',
  },
  detailTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: '#1f2937',
  },
  closeButton: {
    padding: '4px 12px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#6b7280',
  },
  detailContent: {
    padding: '24px',
  },
  detailSection: {
    marginBottom: '24px',
  },
  detailSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  detailSectionTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  collapseButton: {
    padding: '4px 8px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#6b7280',
  },
  detailSectionContent: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '8px 0',
    borderBottom: '1px solid #e5e7eb',
  },
  detailRowLabel: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: 500,
  },
  detailRowValue: {
    fontSize: '13px',
    fontWeight: 500,
    maxWidth: '60%',
    wordBreak: 'break-all',
  },
  errorDetail: {
    padding: '12px',
    backgroundColor: '#fef2f2',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#dc2626',
    lineHeight: 1.5,
  },
  jsonPreview: {
    margin: 0,
    fontSize: '12px',
    lineHeight: 1.6,
    overflow: 'auto',
    maxHeight: '300px',
  },
};
