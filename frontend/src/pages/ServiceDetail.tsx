import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { serviceApi, metricsApi } from '../services/api';
import type { Service, API, RateLimitRule, CircuitBreakerRule, APIKey, ServiceMetrics, ServiceStatus } from '../types';

type TabType = 'overview' | 'apis' | 'rate-limits' | 'circuit-breakers' | 'api-keys' | 'metrics';

const getStatusLabel = (status: ServiceStatus) => {
  switch (status) {
    case 'RUNNING':
      return '运行中';
    case 'OFFLINE':
      return '离线';
    case 'MAINTENANCE':
      return '维护中';
    case 'DEGRADED':
      return '降级';
    default:
      return status;
  }
};

const getStatusBadgeLabel = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return '启用';
    case 'INACTIVE':
      return '禁用';
    default:
      return status;
  }
};

export function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [service, setService] = useState<Service | null>(null);
  const [apis, setApis] = useState<API[]>([]);
  const [rateLimitRules, setRateLimitRules] = useState<RateLimitRule[]>([]);
  const [circuitBreakerRules, setCircuitBreakerRules] = useState<CircuitBreakerRule[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [metrics, setMetrics] = useState<ServiceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAPIModal, setShowAPIModal] = useState(false);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [showCircuitBreakerModal, setShowCircuitBreakerModal] = useState(false);
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false);
  const [apiForm, setApiForm] = useState({ name: '', path: '', method: 'GET', description: '', timeout: 30000 });
  const [rateLimitForm, setRateLimitForm] = useState({ name: '', requests_per_second: 100, burst_size: 200, window_size: 60 });
  const [circuitBreakerForm, setCircuitBreakerForm] = useState({ name: '', failure_threshold: 0.5, timeout: 10000, reset_timeout: 30000, min_requests: 10 });
  const [apiKeyForm, setApiKeyForm] = useState({ rate_limit: 1000, rate_window: 60 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadServiceData(id);
    }
  }, [id]);

  const loadServiceData = async (serviceId: string) => {
    setLoading(true);
    try {
      const [serviceData, apisData, rateLimitData, circuitBreakerData, apiKeysData, metricsData] = await Promise.all([
        serviceApi.getById(serviceId),
        serviceApi.getAPIs(serviceId),
        serviceApi.getRateLimitRules(serviceId),
        serviceApi.getCircuitBreakerRules(serviceId),
        serviceApi.getAPIKeys(serviceId),
        metricsApi.getServiceMetrics(serviceId),
      ]);

      setService(serviceData);
      setApis(apisData);
      setRateLimitRules(rateLimitData);
      setCircuitBreakerRules(circuitBreakerData);
      setApiKeys(apiKeysData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to load service data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!id) return;
    try {
      await serviceApi.deploy(id);
      alert('服务部署成功！状态已变更为"运行中"。');
      loadServiceData(id);
    } catch (error) {
      alert('服务部署失败：' + (error as Error).message);
    }
  };

  const handleProbe = async () => {
    if (!id) return;
    try {
      const result = await serviceApi.probe(id);
      if (result.success) {
        alert(`探测成功！延迟：${result.latency}ms，状态码：${result.statusCode}`);
      } else {
        alert(`探测失败：${result.error}`);
      }
    } catch (error) {
      alert('服务探测失败：' + (error as Error).message);
    }
  };

  const handleCreateAPI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    try {
      await serviceApi.createAPI(id, {
        name: apiForm.name,
        path: apiForm.path,
        method: apiForm.method,
        description: apiForm.description || undefined,
        timeout: apiForm.timeout,
      });
      setShowAPIModal(false);
      setApiForm({ name: '', path: '', method: 'GET', description: '', timeout: 30000 });
      loadServiceData(id);
    } catch (error) {
      alert('创建 API 失败：' + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRateLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    try {
      await serviceApi.createRateLimitRule(id, {
        name: rateLimitForm.name,
        limit_type: 'GLOBAL',
        requests_per_second: rateLimitForm.requests_per_second,
        burst_size: rateLimitForm.burst_size,
        window_size: rateLimitForm.window_size,
      });
      setShowRateLimitModal(false);
      setRateLimitForm({ name: '', requests_per_second: 100, burst_size: 200, window_size: 60 });
      loadServiceData(id);
    } catch (error) {
      alert('创建限流规则失败：' + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCircuitBreaker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    try {
      await serviceApi.createCircuitBreakerRule(id, {
        name: circuitBreakerForm.name,
        failure_threshold: circuitBreakerForm.failure_threshold,
        timeout: circuitBreakerForm.timeout,
        reset_timeout: circuitBreakerForm.reset_timeout,
        min_requests: circuitBreakerForm.min_requests,
      });
      setShowCircuitBreakerModal(false);
      setCircuitBreakerForm({ name: '', failure_threshold: 0.5, timeout: 10000, reset_timeout: 30000, min_requests: 10 });
      loadServiceData(id);
    } catch (error) {
      alert('创建熔断规则失败：' + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAPIKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    try {
      const result = await serviceApi.createAPIKey(id, {
        rate_limit: apiKeyForm.rate_limit,
        rate_window: apiKeyForm.rate_window,
      });
      setShowAPIKeyModal(false);
      setApiKeyForm({ rate_limit: 1000, rate_window: 60 });
      alert(`API 密钥创建成功！\n\n密钥：${result.key}\n\n请保存此密钥 - 后续将不再显示。`);
      loadServiceData(id);
    } catch (error) {
      alert('创建 API 密钥失败：' + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <p>正在加载服务详情...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div style={styles.notFound}>
        <h2>服务不存在</h2>
        <button style={styles.button} onClick={() => navigate('/services')}>
          返回服务列表
        </button>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview', label: '概览', icon: '📋' },
    { id: 'apis', label: 'API 端点', icon: '🔗' },
    { id: 'rate-limits', label: '限流规则', icon: '🚦' },
    { id: 'circuit-breakers', label: '熔断规则', icon: '🔌' },
    { id: 'api-keys', label: 'API 密钥', icon: '🔑' },
    { id: 'metrics', label: '指标统计', icon: '📊' },
  ];

  return (
    <div>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate('/services')}>
          ← 返回
        </button>
        <div>
          <h1 style={styles.title}>{service.name}</h1>
          <p style={styles.subtitle}>{service.description || '暂无描述'}</p>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.secondaryButton} onClick={handleProbe}>
            🔍 探测
          </button>
          <button style={styles.primaryButton} onClick={handleDeploy}>
            🚀 部署
          </button>
        </div>
      </div>

      <div style={styles.statusBar}>
        <div style={styles.statusItem}>
          <span style={styles.statusLabel}>状态：</span>
          <span style={{
            ...styles.statusValue,
            color: service.status === 'RUNNING' ? '#10b981' : service.status === 'OFFLINE' ? '#6b7280' : '#f59e0b',
          }}>
            {getStatusLabel(service.status)}
          </span>
        </div>
        <div style={styles.statusItem}>
          <span style={styles.statusLabel}>基础 URL：</span>
          <span style={styles.statusValue}>{service.base_url}</span>
        </div>
        <div style={styles.statusItem}>
          <span style={styles.statusLabel}>创建时间：</span>
          <span style={styles.statusValue}>
            {new Date(service.created_at * 1000).toLocaleString()}
          </span>
        </div>
      </div>

      <div style={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            <span style={{ marginRight: '8px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.tabContent}>
        {activeTab === 'overview' && (
          <div style={styles.overview}>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>服务信息</h3>
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>服务 ID</span>
                  <span style={styles.infoValue}>{service.id}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>服务名称</span>
                  <span style={styles.infoValue}>{service.name}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>基础 URL</span>
                  <span style={styles.infoValue}>{service.base_url}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>创建者</span>
                  <span style={styles.infoValue}>{service.created_by}</span>
                </div>
              </div>
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>快捷操作</h3>
              <div style={styles.actionGrid}>
                <button style={styles.actionCard} onClick={() => setActiveTab('apis')}>
                  <span style={styles.actionIcon}>🔗</span>
                  <span style={styles.actionText}>添加 API 端点</span>
                  <span style={styles.actionCount}>{apis.length} 个 API</span>
                </button>
                <button style={styles.actionCard} onClick={() => setActiveTab('rate-limits')}>
                  <span style={styles.actionIcon}>🚦</span>
                  <span style={styles.actionText}>配置限流规则</span>
                  <span style={styles.actionCount}>{rateLimitRules.length} 条规则</span>
                </button>
                <button style={styles.actionCard} onClick={() => setActiveTab('circuit-breakers')}>
                  <span style={styles.actionIcon}>🔌</span>
                  <span style={styles.actionText}>配置熔断规则</span>
                  <span style={styles.actionCount}>{circuitBreakerRules.length} 条规则</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'apis' && (
          <div>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>API 端点管理</h3>
              <button style={styles.button} onClick={() => setShowAPIModal(true)}>
                + 添加 API
              </button>
            </div>

            {apis.length === 0 ? (
              <div style={styles.emptyState}>
                <p>暂无配置的 API 端点，请添加第一个 API。</p>
              </div>
            ) : (
              <div style={styles.list}>
                {apis.map((api) => (
                  <div key={api.id} style={styles.listItem}>
                    <div style={styles.listItemLeft}>
                      <span style={{
                        ...styles.methodBadge,
                        backgroundColor: getMethodColor(api.method),
                      }}>
                        {api.method}
                      </span>
                      <div>
                        <h4 style={styles.listItemTitle}>{api.name}</h4>
                        <p style={styles.listItemSubtitle}>{api.path}</p>
                      </div>
                    </div>
                    <div style={styles.listItemRight}>
                      <span style={styles.metaText}>超时：{api.timeout}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'rate-limits' && (
          <div>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>限流规则</h3>
              <button style={styles.button} onClick={() => setShowRateLimitModal(true)}>
                + 添加规则
              </button>
            </div>

            {rateLimitRules.length === 0 ? (
              <div style={styles.emptyState}>
                <p>暂无限流规则配置，请添加第一条规则。</p>
              </div>
            ) : (
              <div style={styles.cardGrid}>
                {rateLimitRules.map((rule) => (
                  <div key={rule.id} style={styles.card}>
                    <h4 style={styles.cardTitle}>{rule.name}</h4>
                    <div style={styles.cardMeta}>
                      <div style={styles.cardMetaItem}>
                        <span style={styles.cardMetaLabel}>速率</span>
                        <span style={styles.cardMetaValue}>{rule.requests_per_second}/秒</span>
                      </div>
                      <div style={styles.cardMetaItem}>
                        <span style={styles.cardMetaLabel}>突发</span>
                        <span style={styles.cardMetaValue}>{rule.burst_size}</span>
                      </div>
                      <div style={styles.cardMetaItem}>
                        <span style={styles.cardMetaLabel}>窗口</span>
                        <span style={styles.cardMetaValue}>{rule.window_size}秒</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'circuit-breakers' && (
          <div>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>熔断规则</h3>
              <button style={styles.button} onClick={() => setShowCircuitBreakerModal(true)}>
                + 添加规则
              </button>
            </div>

            {circuitBreakerRules.length === 0 ? (
              <div style={styles.emptyState}>
                <p>暂无熔断规则配置，请添加第一条规则。</p>
              </div>
            ) : (
              <div style={styles.cardGrid}>
                {circuitBreakerRules.map((rule) => (
                  <div key={rule.id} style={styles.card}>
                    <h4 style={styles.cardTitle}>{rule.name}</h4>
                    <div style={styles.cardMeta}>
                      <div style={styles.cardMetaItem}>
                        <span style={styles.cardMetaLabel}>阈值</span>
                        <span style={styles.cardMetaValue}>{(rule.failure_threshold * 100).toFixed(0)}%</span>
                      </div>
                      <div style={styles.cardMetaItem}>
                        <span style={styles.cardMetaLabel}>超时</span>
                        <span style={styles.cardMetaValue}>{rule.timeout}ms</span>
                      </div>
                      <div style={styles.cardMetaItem}>
                        <span style={styles.cardMetaLabel}>恢复</span>
                        <span style={styles.cardMetaValue}>{rule.reset_timeout}ms</span>
                      </div>
                      <div style={styles.cardMetaItem}>
                        <span style={styles.cardMetaLabel}>最小请求</span>
                        <span style={styles.cardMetaValue}>{rule.min_requests}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'api-keys' && (
          <div>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>API 密钥</h3>
              <button style={styles.button} onClick={() => setShowAPIKeyModal(true)}>
                + 添加密钥
              </button>
            </div>
            {apiKeys.length === 0 ? (
              <div style={styles.emptyState}>
                <p>暂无 API 密钥。点击上方按钮添加新密钥。</p>
              </div>
            ) : (
              <div style={styles.list}>
                {apiKeys.map((key) => (
                  <div key={key.id} style={styles.listItem}>
                    <div style={styles.listItemLeft}>
                      <span style={styles.keyIcon}>🔑</span>
                      <div>
                        <h4 style={styles.listItemTitle}>{key.key_prefix}...</h4>
                        <p style={styles.listItemSubtitle}>
                          限流：{key.rate_limit} 请求 / {key.rate_window}秒
                        </p>
                      </div>
                    </div>
                    <div style={styles.listItemRight}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: key.status === 'ACTIVE' ? '#d1fae5' : '#f3f4f6',
                        color: key.status === 'ACTIVE' ? '#059669' : '#6b7280',
                      }}>
                        {getStatusBadgeLabel(key.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'metrics' && (
          <div>
            <h3 style={styles.sectionTitle}>服务指标</h3>
            {metrics ? (
              <div style={styles.metricsGrid}>
                <div style={styles.metricCard}>
                  <span style={styles.metricLabel}>请求总数</span>
                  <span style={styles.metricValue}>{metrics.requestCount}</span>
                </div>
                <div style={styles.metricCard}>
                  <span style={styles.metricLabel}>成功率</span>
                  <span style={{
                    ...styles.metricValue,
                    color: metrics.successRate >= 90 ? '#10b981' : metrics.successRate >= 70 ? '#f59e0b' : '#ef4444',
                  }}>
                    {metrics.successRate.toFixed(2)}%
                  </span>
                </div>
                <div style={styles.metricCard}>
                  <span style={styles.metricLabel}>平均耗时</span>
                  <span style={styles.metricValue}>{metrics.avgDuration.toFixed(0)}ms</span>
                </div>
                <div style={styles.metricCard}>
                  <span style={styles.metricLabel}>P95 耗时</span>
                  <span style={styles.metricValue}>{metrics.p95Duration.toFixed(0)}ms</span>
                </div>
                <div style={styles.metricCard}>
                  <span style={styles.metricLabel}>P99 耗时</span>
                  <span style={styles.metricValue}>{metrics.p99Duration.toFixed(0)}ms</span>
                </div>
                <div style={styles.metricCard}>
                  <span style={styles.metricLabel}>错误数量</span>
                  <span style={{
                    ...styles.metricValue,
                    color: metrics.errorCount > 0 ? '#ef4444' : '#10b981',
                  }}>
                    {metrics.errorCount}
                  </span>
                </div>
              </div>
            ) : (
              <div style={styles.emptyState}>
                <p>暂无指标数据。</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showAPIModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAPIModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>添加 API 端点</h2>
              <button style={styles.modalClose} onClick={() => setShowAPIModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateAPI}>
              <div style={styles.formGroup}>
                <label style={styles.label}>API 名称 *</label>
                <input
                  type="text"
                  style={styles.input}
                  value={apiForm.name}
                  onChange={(e) => setApiForm({ ...apiForm, name: e.target.value })}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>路径 *</label>
                <input
                  type="text"
                  style={styles.input}
                  value={apiForm.path}
                  onChange={(e) => setApiForm({ ...apiForm, path: e.target.value })}
                  placeholder="/api/v1/resource"
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>请求方法 *</label>
                <select
                  style={styles.input}
                  value={apiForm.method}
                  onChange={(e) => setApiForm({ ...apiForm, method: e.target.value })}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>超时时间 (毫秒)</label>
                <input
                  type="number"
                  style={styles.input}
                  value={apiForm.timeout}
                  onChange={(e) => setApiForm({ ...apiForm, timeout: parseInt(e.target.value) })}
                />
              </div>
              <div style={styles.modalFooter}>
                <button type="button" style={styles.cancelButton} onClick={() => setShowAPIModal(false)}>
                  取消
                </button>
                <button type="submit" style={styles.submitButton} disabled={submitting}>
                  {submitting ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRateLimitModal && (
        <div style={styles.modalOverlay} onClick={() => setShowRateLimitModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>添加限流规则</h2>
              <button style={styles.modalClose} onClick={() => setShowRateLimitModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateRateLimit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>规则名称 *</label>
                <input
                  type="text"
                  style={styles.input}
                  value={rateLimitForm.name}
                  onChange={(e) => setRateLimitForm({ ...rateLimitForm, name: e.target.value })}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>每秒请求数 *</label>
                <input
                  type="number"
                  style={styles.input}
                  value={rateLimitForm.requests_per_second}
                  onChange={(e) => setRateLimitForm({ ...rateLimitForm, requests_per_second: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>突发流量上限</label>
                <input
                  type="number"
                  style={styles.input}
                  value={rateLimitForm.burst_size}
                  onChange={(e) => setRateLimitForm({ ...rateLimitForm, burst_size: parseInt(e.target.value) })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>统计窗口 (秒)</label>
                <input
                  type="number"
                  style={styles.input}
                  value={rateLimitForm.window_size}
                  onChange={(e) => setRateLimitForm({ ...rateLimitForm, window_size: parseInt(e.target.value) })}
                />
              </div>
              <div style={styles.modalFooter}>
                <button type="button" style={styles.cancelButton} onClick={() => setShowRateLimitModal(false)}>
                  取消
                </button>
                <button type="submit" style={styles.submitButton} disabled={submitting}>
                  {submitting ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCircuitBreakerModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCircuitBreakerModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>添加熔断规则</h2>
              <button style={styles.modalClose} onClick={() => setShowCircuitBreakerModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateCircuitBreaker}>
              <div style={styles.formGroup}>
                <label style={styles.label}>规则名称 *</label>
                <input
                  type="text"
                  style={styles.input}
                  value={circuitBreakerForm.name}
                  onChange={(e) => setCircuitBreakerForm({ ...circuitBreakerForm, name: e.target.value })}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>失败阈值 (0-1) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  style={styles.input}
                  value={circuitBreakerForm.failure_threshold}
                  onChange={(e) => setCircuitBreakerForm({ ...circuitBreakerForm, failure_threshold: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>请求超时 (毫秒)</label>
                <input
                  type="number"
                  style={styles.input}
                  value={circuitBreakerForm.timeout}
                  onChange={(e) => setCircuitBreakerForm({ ...circuitBreakerForm, timeout: parseInt(e.target.value) })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>恢复等待 (毫秒)</label>
                <input
                  type="number"
                  style={styles.input}
                  value={circuitBreakerForm.reset_timeout}
                  onChange={(e) => setCircuitBreakerForm({ ...circuitBreakerForm, reset_timeout: parseInt(e.target.value) })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>最小请求数</label>
                <input
                  type="number"
                  style={styles.input}
                  value={circuitBreakerForm.min_requests}
                  onChange={(e) => setCircuitBreakerForm({ ...circuitBreakerForm, min_requests: parseInt(e.target.value) })}
                />
              </div>
              <div style={styles.modalFooter}>
                <button type="button" style={styles.cancelButton} onClick={() => setShowCircuitBreakerModal(false)}>
                  取消
                </button>
                <button type="submit" style={styles.submitButton} disabled={submitting}>
                  {submitting ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAPIKeyModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAPIKeyModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>添加 API 密钥</h2>
              <button style={styles.modalClose} onClick={() => setShowAPIKeyModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateAPIKey}>
              <div style={styles.formGroup}>
                <label style={styles.label}>每秒请求数上限</label>
                <input
                  type="number"
                  style={styles.input}
                  value={apiKeyForm.rate_limit}
                  onChange={(e) => setApiKeyForm({ ...apiKeyForm, rate_limit: parseInt(e.target.value) })}
                  min="1"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>统计窗口 (秒)</label>
                <input
                  type="number"
                  style={styles.input}
                  value={apiKeyForm.rate_window}
                  onChange={(e) => setApiKeyForm({ ...apiKeyForm, rate_window: parseInt(e.target.value) })}
                  min="1"
                />
              </div>
              <div style={styles.modalFooter}>
                <button type="button" style={styles.cancelButton} onClick={() => setShowAPIKeyModal(false)}>
                  取消
                </button>
                <button type="submit" style={styles.submitButton} disabled={submitting}>
                  {submitting ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: '#3b82f6',
    POST: '#10b981',
    PUT: '#f59e0b',
    DELETE: '#ef4444',
    PATCH: '#8b5cf6',
  };
  return colors[method] || '#6b7280';
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
    fontSize: '18px',
    color: '#6b7280',
  },
  notFound: {
    textAlign: 'center',
    padding: '80px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '24px',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
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
  headerActions: {
    marginLeft: 'auto',
    display: 'flex',
    gap: '12px',
  },
  primaryButton: {
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '12px 24px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  statusBar: {
    display: 'flex',
    gap: '32px',
    padding: '16px 24px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusLabel: {
    fontSize: '13px',
    color: '#6b7280',
  },
  statusValue: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#1f2937',
  },
  tabBar: {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
    backgroundColor: '#fff',
    padding: '8px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    flexWrap: 'wrap',
  },
  tab: {
    padding: '10px 20px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#6b7280',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#3b82f6',
    color: '#fff',
  },
  tabContent: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  overview: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  section: {},
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: 600,
    color: '#1f2937',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  infoItem: {
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  infoLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  infoValue: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#1f2937',
    fontFamily: 'monospace',
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  actionCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  actionIcon: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  actionText: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '4px',
  },
  actionCount: {
    fontSize: '12px',
    color: '#6b7280',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  listItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  listItemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  methodBadge: {
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#fff',
  },
  listItemTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: '#1f2937',
  },
  listItemSubtitle: {
    margin: '4px 0 0 0',
    fontSize: '12px',
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  metaText: {
    fontSize: '12px',
    color: '#6b7280',
  },
  keyIcon: {
    fontSize: '24px',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  card: {
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
  },
  cardTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#1f2937',
  },
  cardMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
  },
  cardMetaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  cardMetaLabel: {
    fontSize: '11px',
    color: '#6b7280',
  },
  cardMetaValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1f2937',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
  },
  metricCard: {
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  metricLabel: {
    fontSize: '12px',
    color: '#6b7280',
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1f2937',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    borderBottom: '1px solid #f3f4f6',
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#1f2937',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '4px',
  },
  formGroup: {
    padding: '0 24px',
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '20px 24px',
    borderTop: '1px solid #f3f4f6',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
};
