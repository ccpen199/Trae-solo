
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanSearch,
  Search,
  BarChart3,
  CloudSun,
  Store,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import MetricCard from '@/components/ui/MetricCard';
import QualityTrendChart from '@/components/chart/QualityTrendChart';
import { useApi } from '@/hooks/useApi';
import { formatCurrency } from '@/utils/format';
import type { DashboardData, Product } from '@/types';

const DEFAULT_TRACE_CODE = 'TRC-2026-RICE-89138';

function Dashboard() {
  const navigate = useNavigate();
  const [traceCode, setTraceCode] = useState(DEFAULT_TRACE_CODE);

  const { data, loading, error } = useApi<DashboardData>('/api/dashboard', {
    metrics: [],
    qualityTrend: [],
    alerts: [],
  });

  const { data: productsData } = useApi<{ products: Product[] }>('/api/products', { products: [] });

  const latestTrend = data.qualityTrend[data.qualityTrend.length - 1];

  return (
    <section className="page-space">
      <div className="dashboard-grid">
        <motion.section
          className="command-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="panel-copy">
            <p className="eyebrow">今日监管概览</p>
            <h2>区域质量、链上批次与订单协同集中监控</h2>
            <p>已接入生产档案、检测报告、冷链温湿度和电子合同数据，当前批次可从扫码查询直达链上存证。</p>
          </div>
          <form
            className="trace-search"
            onSubmit={(event) => {
              event.preventDefault();
              navigate(`/trace?code=${encodeURIComponent(traceCode)}`);
            }}
          >
            <ScanSearch size={20} />
            <input
              value={traceCode}
              onChange={(event) => setTraceCode(event.target.value)}
              aria-label="溯源码"
              placeholder="输入溯源码查询..."
            />
            <button type="submit">
              <Search size={18} />
              查询
            </button>
          </form>
          <div className="media-strip" aria-label="农产品流通场景">
            <img
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"
              alt="农田"
            />
            <img
              src="https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?auto=format&fit=crop&w=1200&q=80"
              alt="农产品分拣"
            />
          </div>
        </motion.section>

        <motion.section
          className="quality-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="panel-head">
            <div>
              <p className="eyebrow">质量趋势</p>
              <h3>{latestTrend ? `${latestTrend.passRate}%` : loading ? '加载中' : '--'}</h3>
            </div>
            <BarChart3 size={24} />
          </div>
          {data.qualityTrend.length > 0 ? (
            <div className="chart-container">
              <QualityTrendChart data={data.qualityTrend} height={148} />
            </div>
          ) : (
            <div className="trend-chart">
              {data.qualityTrend.map((item) => (
                <div key={item.month} className="trend-item">
                  <span style={{ height: `${Math.max(16, (item.passRate - 96) * 28)}px` }} />
                  <small>{item.month}</small>
                </div>
              ))}
            </div>
          )}
          <div className="risk-row">
            <span>抽检样本 {latestTrend?.sampling ?? '--'}</span>
            <strong>风险事件 {latestTrend?.risk ?? '--'}</strong>
          </div>
        </motion.section>
      </div>

      {loading && <div className="status-line">数据加载中</div>}
      {error && <div className="status-line error">接口异常：{error}</div>}

      <div className="metrics-grid">
        {data.metrics.map((metric, index) => (
          <MetricCard key={metric.id} metric={metric} index={index} />
        ))}
      </div>

      <div className="content-grid two">
        <motion.section
          className="section-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="section-title">
            <div>
              <p className="eyebrow">气象与农事</p>
              <h2>主动预警</h2>
            </div>
            <CloudSun size={22} />
          </div>
          <div className="stack-list">
            {data.alerts.map((alert, index) => (
              <motion.article
                key={alert.id}
                className="alert-row"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
              >
                <div className={`alert-level ${alert.level}`}>{alert.level}</div>
                <div>
                  <strong>{alert.region} · {alert.alertType}</strong>
                  <p>{alert.suggestion}</p>
                  <span>{alert.startsAt}</span>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="section-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="section-title">
            <div>
              <p className="eyebrow">交易市场</p>
              <h2>热销农品</h2>
            </div>
            <Store size={22} />
          </div>
          <div className="product-mini-list">
            {productsData.products.slice(0, 3).map((product, index) => (
              <motion.article
                key={product.id}
                className="mini-product"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                whileHover={{ x: 4, transition: { duration: 0.2 } }}
              >
                <img src={product.imageUrl} alt={product.name} />
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.origin} · {product.specification}</span>
                </div>
                <b>{formatCurrency(product.price)}</b>
              </motion.article>
            ))}
          </div>
          <div className="more-link">
            <span>查看全部商品</span>
            <ChevronRight size={16} />
          </div>
        </motion.section>
      </div>
    </section>
  );
}

export default Dashboard;
