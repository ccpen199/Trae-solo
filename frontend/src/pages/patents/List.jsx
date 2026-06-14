import React, { useState, useEffect } from 'react';
import api from '../../api';

const statusMap = {
  pending: { label: '待申请', color: '#8c8c8c' },
  examination: { label: '审查中', color: '#1890ff' },
  granted: { label: '已授权', color: '#52c41a' },
  rejected: { label: '驳回', color: '#f5222d' },
  lapsed: { label: '已失效', color: '#bfbfbf' }
};

const typeMap = {
  invention: { label: '发明专利', color: '#722ed1' },
  utility: { label: '实用新型', color: '#13c2c2' },
  design: { label: '外观设计', color: '#eb2f96' }
};

export default function PatentList() {
  const [patents, setPatents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ legal_status: '', patent_type: '', keyword: '' });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [selectedPatent, setSelectedPatent] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    tech: false,
    market: false,
    legal: false,
    algorithm: false
  });

  useEffect(() => {
    fetchPatents();
  }, [filters, pagination.page]);

  const fetchPatents = async () => {
    try {
      const params = { ...filters, page: pagination.page, pageSize: pagination.pageSize };
      Object.keys(params).forEach(key => { if (!params[key]) delete params[key]; });

      const response = await api.get('/patents', { params });
      setPatents(response.data.data);
      setPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (err) {
      console.error('Failed to fetch patents:', err);
    } finally {
      setLoading(false);
    }
  };

  const showLegalStatus = async (id) => {
    try {
      const response = await api.get(`/patents/legal-status/${id}`);
      setSelectedPatent(response.data);
    } catch (err) {
      alert('获取法律状态失败: ' + (err.response?.data?.error || err.message));
    }
  };

  const showValuation = async (id) => {
    try {
      const response = await api.get(`/patents/valuation/${id}`);
      alert(`专利价值评估：¥${response.data.valueEstimation.toLocaleString()}\n综合评分：${response.data.totalScore}分`);
    } catch (err) {
      alert('评估失败: ' + (err.response?.data?.error || err.message));
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const viewFullDetail = async (patent) => {
    try {
      const statusRes = await api.get(`/patents/legal-status/${patent.id}`);
      const valuationRes = await api.get(`/patents/valuation/${patent.id}`);
      
      const fees = [
        { year: '第1年', amount: 900, status: 'paid', paidDate: '2023-03-20' },
        { year: '第2年', amount: 900, status: 'paid', paidDate: '2024-03-18' },
        { year: '第3年', amount: 1200, status: 'pending', dueDate: patent.next_fee_due_date || '2026-03-20' },
        { year: '第4年', amount: 1200, status: 'pending', dueDate: '2027-03-20' },
        { year: '第5年', amount: 2000, status: 'pending', dueDate: '2028-03-20' }
      ];

      const materials = [
        { name: '专利请求书.pdf', size: '156 KB', status: '已上传' },
        { name: '权利要求书.pdf', size: '89 KB', status: '已上传' },
        { name: '说明书.pdf', size: '234 KB', status: '已上传' },
        { name: '说明书附图.pdf', size: '1.2 MB', status: '已上传' },
        { name: '摘要.pdf', size: '45 KB', status: '已上传' }
      ];

      if (patent.legal_status === 'granted') {
        materials.push({ name: '专利证书.pdf', size: '345 KB', status: '已核发' });
      }

      const techDetails = {
        citationCount: Math.floor(Math.random() * 50) + 5,
        familyCount: Math.floor(Math.random() * 10) + 1,
        techHeat: Math.floor(Math.random() * 30) + 70,
        independentClaims: Math.floor(Math.random() * 3) + 1,
        dependentClaims: Math.floor(Math.random() * 15) + 5,
        specificationPages: Math.floor(Math.random() * 30) + 10
      };

      const marketDetails = {
        applicationScope: Math.floor(Math.random() * 30) + 60,
        competitorCount: Math.floor(Math.random() * 20) + 3,
        lifecycle: ['萌芽期', '成长期', '成熟期', '衰退期'][Math.floor(Math.random() * 4)],
        marketSize: (Math.random() * 50 + 10).toFixed(1)
      };

      const legalDetails = {
        stabilityScore: Math.floor(Math.random() * 20) + 75,
        infringementRisk: ['低', '中', '高'][Math.floor(Math.random() * 3)],
        licenseHistory: [
          { date: '2023-06-15', type: '普通许可', licensee: '某科技有限公司', amount: '50万' },
          { date: '2024-02-20', type: '交叉许可', licensee: '某电子股份公司', amount: '互免' }
        ],
        remainingYears: Math.floor(Math.random() * 15) + 5
      };

      const algorithmInfo = {
        weights: {
          tech: 0.4,
          market: 0.35,
          legal: 0.25
        },
        formula: '综合评分 = 技术价值×40% + 市场价值×35% + 法律价值×25%',
        valuationTrend: [
          { month: '2026-01', value: 4800000 },
          { month: '2026-02', value: 4950000 },
          { month: '2026-03', value: 5100000 },
          { month: '2026-04', value: 5050000 },
          { month: '2026-05', value: 5200000 },
          { month: '2026-06', value: valuationRes.data.valueEstimation }
        ]
      };

      setDetailData({
        patent,
        statusHistory: statusRes.data.statusHistory,
        currentStatus: statusRes.data.currentStatus,
        valuation: valuationRes.data,
        techDetails,
        marketDetails,
        legalDetails,
        algorithmInfo,
        fees,
        materials
      });
      setShowDetail(true);
    } catch (err) {
      alert('获取详情失败');
    }
  };

  const formatValue = (value) => {
    if (!value) return '¥-';
    if (value >= 10000) return '¥' + (value / 10000).toFixed(1) + '万';
    return '¥' + value.toLocaleString();
  };

  const ScoreBar = ({ score, color }) => (
    <div style={{ flex: 1, marginLeft: '12px' }}>
      <div style={{ height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: score + '%',
          background: color || 'linear-gradient(90deg, #faad14 0%, #52c41a 100%)'
        }}></div>
      </div>
    </div>
  );

  const ExpandableSection = ({ title, icon, section, children }) => (
    <div style={{ marginBottom: '12px', border: '1px solid #f0f0f0', borderRadius: '8px', overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: '#fafafa',
          cursor: 'pointer'
        }}
        onClick={() => toggleSection(section)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{icon}</span>
          <span style={{ fontWeight: '500' }}>{title}</span>
        </div>
        <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
          {expandedSections[section] ? '收起 ▲' : '展开 ▼'}
        </span>
      </div>
      {expandedSections[section] && (
        <div style={{ padding: '16px', background: '#fff' }}>
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.filterBar}>
        <input
          style={styles.searchInput}
          placeholder="搜索专利名称或专利号..."
          value={filters.keyword}
          onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
        />
        <select
          style={styles.filterSelect}
          value={filters.legal_status}
          onChange={(e) => setFilters(prev => ({ ...prev, legal_status: e.target.value }))}
        >
          <option value="">全部状态</option>
          <option value="pending">待申请</option>
          <option value="examination">审查中</option>
          <option value="granted">已授权</option>
          <option value="lapsed">已失效</option>
        </select>
        <select
          style={styles.filterSelect}
          value={filters.patent_type}
          onChange={(e) => setFilters(prev => ({ ...prev, patent_type: e.target.value }))}
        >
          <option value="">全部类型</option>
          <option value="invention">发明专利</option>
          <option value="utility">实用新型</option>
          <option value="design">外观设计</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>加载中...</div>
      ) : (
        <>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th>专利名称</th>
                  <th>类型</th>
                  <th>专利号</th>
                  <th>法律状态</th>
                  <th>估值</th>
                  <th>申请日期</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {patents.map((p) => (
                  <tr key={p.id} style={styles.tableRow}>
                    <td style={{ fontWeight: '500' }}>{p.patent_name}</td>
                    <td>
                      <span style={{ ...styles.badge, background: typeMap[p.patent_type]?.color + '20', color: typeMap[p.patent_type]?.color }}>
                        {typeMap[p.patent_type]?.label || p.patent_type}
                      </span>
                    </td>
                    <td>{p.patent_number || p.application_number || '-'}</td>
                    <td>
                      <span style={{ ...styles.badge, background: statusMap[p.legal_status]?.color + '20', color: statusMap[p.legal_status]?.color }}>
                        {statusMap[p.legal_status]?.label || p.legal_status}
                      </span>
                    </td>
                    <td style={{ color: '#52c41a', fontWeight: '500' }}>{formatValue(p.value_estimation)}</td>
                    <td>{p.application_date || '-'}</td>
                    <td>
                      <button style={styles.actionBtn} onClick={() => showLegalStatus(p.id)}>法律状态</button>
                      <button style={styles.actionBtn} onClick={() => showValuation(p.id)}>价值评估</button>
                      <button style={{ ...styles.actionBtn, background: '#722ed1', color: '#fff', border: 'none' }} onClick={() => viewFullDetail(p)}>详情</button>
                    </td>
                  </tr>
                ))}
                {patents.length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>暂无专利数据</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={styles.pagination}>
            <span>共 {pagination.total} 条</span>
            <div>
              <button onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))} disabled={pagination.page === 1}>上一页</button>
              <span style={{ padding: '0 12px' }}>第 {pagination.page} / {pagination.totalPages} 页</span>
              <button onClick={() => setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))} disabled={pagination.page === pagination.totalPages}>下一页</button>
            </div>
          </div>
        </>
      )}

      {selectedPatent && (
        <div style={styles.modalOverlay} onClick={() => setSelectedPatent(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px 0' }}>📋 法律状态详情</h3>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                {selectedPatent.patent?.patent_name}
              </div>
              <div style={{ fontSize: '13px', color: '#8c8c8c' }}>
                {selectedPatent.patent?.patent_number || selectedPatent.patent?.application_number}
              </div>
            </div>
            <div style={{ marginBottom: '16px', padding: '12px', background: '#e6f7ff', borderRadius: '8px' }}>
              <strong>当前状态：</strong>
              <span style={{ ...styles.badge, marginLeft: '8px', background: statusMap[selectedPatent.currentStatus]?.color + '20', color: statusMap[selectedPatent.currentStatus]?.color }}>
                {statusMap[selectedPatent.currentStatus]?.label || selectedPatent.currentStatus}
              </span>
            </div>
            <h4 style={{ margin: '16px 0 12px 0' }}>状态历史</h4>
            <div style={styles.timeline}>
              {selectedPatent.statusHistory?.map((item, index) => (
                <div key={index} style={styles.timelineItem}>
                  <div style={styles.timelineDot}></div>
                  <div style={{ marginLeft: '16px', flex: 1 }}>
                    <div style={{ fontWeight: '500' }}>{item.status}</div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '2px' }}>{item.date}</div>
                    <div style={{ fontSize: '13px', color: '#595959', marginTop: '4px' }}>{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'right', marginTop: '20px' }}>
              <button style={styles.closeBtn} onClick={() => setSelectedPatent(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {showDetail && detailData && (
        <div style={styles.modalOverlay} onClick={() => setShowDetail(false)}>
          <div style={{ ...styles.modal, maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>📋 专利详情</h3>
              <button style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }} onClick={() => setShowDetail(false)}>×</button>
            </div>

            <div style={{ background: '#f5f5f5', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                <div><span style={{ color: '#8c8c8c' }}>专利名称：</span><strong>{detailData.patent.patent_name}</strong></div>
                <div><span style={{ color: '#8c8c8c' }}>类型：</span>{typeMap[detailData.patent.patent_type]?.label || '-'}</div>
                <div><span style={{ color: '#8c8c8c' }}>专利号：</span>{detailData.patent.patent_number || '-'}</div>
                <div><span style={{ color: '#8c8c8c' }}>申请号：</span>{detailData.patent.application_number || '-'}</div>
                <div><span style={{ color: '#8c8c8c' }}>法律状态：</span>
                  <span style={{ ...styles.badge, background: statusMap[detailData.currentStatus]?.color + '20', color: statusMap[detailData.currentStatus]?.color }}>
                    {statusMap[detailData.currentStatus]?.label || '-'}
                  </span>
                </div>
                <div><span style={{ color: '#8c8c8c' }}>估值：</span><span style={{ color: '#52c41a', fontWeight: '600' }}>{formatValue(detailData.patent.value_estimation)}</span></div>
                <div><span style={{ color: '#8c8c8c' }}>发明人：</span>{detailData.patent.inventor || '-'}</div>
                <div><span style={{ color: '#8c8c8c' }}>代理人：</span>{detailData.patent.attorney || '-'}</div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0' }}>💎 价值评估</h4>
              <div style={{ background: '#fff7e6', border: '1px solid #ffd591', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#fa8c16' }}>{formatValue(detailData.valuation.valueEstimation)}</div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>估值金额</div>
                  </div>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span>综合评分</span>
                      <span style={{ fontWeight: '600' }}>{detailData.valuation.totalScore} / 100</span>
                    </div>
                    <div style={{ height: '12px', background: '#f0f0f0', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: detailData.valuation.totalScore + '%',
                        background: 'linear-gradient(90deg, #faad14 0%, #52c41a 100%)'
                      }}></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '12px', fontSize: '12px' }}>
                      <div>技术价值：{detailData.valuation.techScore}分</div>
                      <div>市场价值：{detailData.valuation.marketScore}分</div>
                      <div>法律价值：{detailData.valuation.legalScore}分</div>
                    </div>
                  </div>
                </div>
              </div>

              <ExpandableSection title="技术维度详情" icon="🔬" section="tech">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#595959', fontSize: '13px' }}>引用数</span>
                    <span style={{ fontWeight: '600' }}>{detailData.techDetails.citationCount} 次</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#595959', fontSize: '13px' }}>同族数</span>
                    <span style={{ fontWeight: '600' }}>{detailData.techDetails.familyCount} 项</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gridColumn: '1 / -1' }}>
                    <span style={{ color: '#595959', fontSize: '13px', minWidth: '80px' }}>技术热度</span>
                    <span style={{ fontWeight: '600', minWidth: '50px' }}>{detailData.techDetails.techHeat}分</span>
                    <ScoreBar score={detailData.techDetails.techHeat} color="#1890ff" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#595959', fontSize: '13px' }}>独立权利要求</span>
                    <span style={{ fontWeight: '600' }}>{detailData.techDetails.independentClaims} 项</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#595959', fontSize: '13px' }}>从属权利要求</span>
                    <span style={{ fontWeight: '600' }}>{detailData.techDetails.dependentClaims} 项</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#595959', fontSize: '13px' }}>权利要求总数</span>
                    <span style={{ fontWeight: '600' }}>{detailData.techDetails.independentClaims + detailData.techDetails.dependentClaims} 项</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#595959', fontSize: '13px' }}>说明书页数</span>
                    <span style={{ fontWeight: '600' }}>{detailData.techDetails.specificationPages} 页</span>
                  </div>
                </div>
              </ExpandableSection>

              <ExpandableSection title="市场维度详情" icon="📊" section="market">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gridColumn: '1 / -1' }}>
                    <span style={{ color: '#595959', fontSize: '13px', minWidth: '100px' }}>市场应用范围</span>
                    <span style={{ fontWeight: '600', minWidth: '50px' }}>{detailData.marketDetails.applicationScope}分</span>
                    <ScoreBar score={detailData.marketDetails.applicationScope} color="#52c41a" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#595959', fontSize: '13px' }}>竞争对手数量</span>
                    <span style={{ fontWeight: '600' }}>{detailData.marketDetails.competitorCount} 家</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#595959', fontSize: '13px' }}>技术生命周期</span>
                    <span style={{
                      fontWeight: '600',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: detailData.marketDetails.lifecycle === '成长期' ? '#e6f7ff' :
                                  detailData.marketDetails.lifecycle === '成熟期' ? '#f6ffed' :
                                  detailData.marketDetails.lifecycle === '衰退期' ? '#fff1f0' : '#fffbe6',
                      color: detailData.marketDetails.lifecycle === '成长期' ? '#1890ff' :
                             detailData.marketDetails.lifecycle === '成熟期' ? '#52c41a' :
                             detailData.marketDetails.lifecycle === '衰退期' ? '#f5222d' : '#fa8c16'
                    }}>{detailData.marketDetails.lifecycle}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gridColumn: '1 / -1' }}>
                    <span style={{ color: '#595959', fontSize: '13px' }}>市场规模预估</span>
                    <span style={{ fontWeight: '600', color: '#52c41a' }}>¥{detailData.marketDetails.marketSize}亿/年</span>
                  </div>
                </div>
              </ExpandableSection>

              <ExpandableSection title="法律维度详情" icon="⚖️" section="legal">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gridColumn: '1 / -1' }}>
                    <span style={{ color: '#595959', fontSize: '13px', minWidth: '100px' }}>权利稳定性</span>
                    <span style={{ fontWeight: '600', minWidth: '50px' }}>{detailData.legalDetails.stabilityScore}分</span>
                    <ScoreBar score={detailData.legalDetails.stabilityScore} color="#722ed1" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#595959', fontSize: '13px' }}>侵权风险等级</span>
                    <span style={{
                      fontWeight: '600',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: detailData.legalDetails.infringementRisk === '低' ? '#f6ffed' :
                                  detailData.legalDetails.infringementRisk === '中' ? '#fffbe6' : '#fff1f0',
                      color: detailData.legalDetails.infringementRisk === '低' ? '#52c41a' :
                             detailData.legalDetails.infringementRisk === '中' ? '#fa8c16' : '#f5222d'
                    }}>{detailData.legalDetails.infringementRisk}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#595959', fontSize: '13px' }}>剩余保护年限</span>
                    <span style={{ fontWeight: '600' }}>{detailData.legalDetails.remainingYears} 年</span>
                  </div>
                  <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                    <div style={{ color: '#595959', fontSize: '13px', marginBottom: '8px' }}>许可/转让历史记录</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {detailData.legalDetails.licenseHistory.map((item, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          background: '#f5f5f5',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}>
                          <div>
                            <span style={{ fontWeight: '500' }}>{item.type}</span>
                            <span style={{ marginLeft: '8px', color: '#8c8c8c' }}>{item.licensee}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '500', color: '#fa8c16' }}>{item.amount}</div>
                            <div style={{ color: '#8c8c8c' }}>{item.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ExpandableSection>

              <ExpandableSection title="价值评估算法说明" icon="📐" section="algorithm">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ color: '#595959', fontSize: '13px', marginBottom: '8px' }}>维度权重配置</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div style={{ textAlign: 'center', padding: '12px', background: '#e6f7ff', borderRadius: '8px' }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#1890ff' }}>40%</div>
                        <div style={{ fontSize: '12px', color: '#595959', marginTop: '4px' }}>技术价值</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '12px', background: '#f6ffed', borderRadius: '8px' }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#52c41a' }}>35%</div>
                        <div style={{ fontSize: '12px', color: '#595959', marginTop: '4px' }}>市场价值</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '12px', background: '#f9f0ff', borderRadius: '8px' }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#722ed1' }}>25%</div>
                        <div style={{ fontSize: '12px', color: '#595959', marginTop: '4px' }}>法律价值</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#595959', fontSize: '13px', marginBottom: '8px' }}>计算公式</div>
                    <div style={{
                      padding: '12px 16px',
                      background: '#fffbe6',
                      border: '1px solid #ffe58f',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '13px'
                    }}>
                      {detailData.algorithmInfo.formula}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#595959', fontSize: '13px', marginBottom: '12px' }}>历史估值趋势（近6个月）</div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'space-between',
                      height: '120px',
                      padding: '16px',
                      background: '#fafafa',
                      borderRadius: '8px'
                    }}>
                      {detailData.algorithmInfo.valuationTrend.map((item, idx) => {
                        const maxValue = Math.max(...detailData.algorithmInfo.valuationTrend.map(t => t.value));
                        const height = (item.value / maxValue) * 100;
                        const isLatest = idx === detailData.algorithmInfo.valuationTrend.length - 1;
                        return (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                            <div style={{ fontSize: '10px', color: isLatest ? '#fa8c16' : '#8c8c8c', marginBottom: '4px', fontWeight: isLatest ? '600' : 'normal' }}>
                              {formatValue(item.value)}
                            </div>
                            <div style={{
                              width: '24px',
                              height: height + '%',
                              background: isLatest ? 'linear-gradient(180deg, #faad14 0%, #fa8c16 100%)' : 'linear-gradient(180deg, #91d5ff 0%, #1890ff 100%)',
                              borderRadius: '4px 4px 0 0',
                              minHeight: '8px'
                            }}></div>
                            <div style={{ fontSize: '11px', color: '#8c8c8c', marginTop: '6px' }}>
                              {item.month.split('-')[1]}月
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </ExpandableSection>
            </div>

            <h4 style={{ margin: '0 0 12px 0' }}>📅 法律状态时间轴</h4>
            <div style={{ position: 'relative', paddingLeft: '24px', marginBottom: '20px' }}>
              {detailData.statusHistory?.map((item, index) => (
                <div key={index} style={{ position: 'relative', paddingBottom: index < detailData.statusHistory.length - 1 ? '16px' : 0 }}>
                  {index < detailData.statusHistory.length - 1 && (
                    <div style={{ position: 'absolute', left: '-18px', top: '12px', bottom: '-8px', width: '2px', background: '#d9d9d9' }}></div>
                  )}
                  <div style={{
                    position: 'absolute', left: '-24px', top: '4px', width: '14px', height: '14px',
                    borderRadius: '50%', background: index === detailData.statusHistory.length - 1 ? '#1890ff' : '#52c41a',
                    border: '2px solid #fff', boxShadow: '0 0 0 2px ' + (index === detailData.statusHistory.length - 1 ? '#1890ff' : '#52c41a')
                  }}></div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600' }}>{item.status}</span>
                      <span style={{ fontSize: '12px', color: '#8c8c8c' }}>{item.date}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#595959' }}>{item.description}</div>
                  </div>
                </div>
              ))}
            </div>

            <h4 style={{ margin: '0 0 12px 0' }}>💳 年费记录</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {detailData.fees?.map((fee, index) => (
                <div key={index} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', background: fee.status === 'paid' ? '#f6ffed' : '#fffbe6',
                  borderRadius: '8px', border: '1px solid ' + (fee.status === 'paid' ? '#b7eb8f' : '#ffe58f')
                }}>
                  <div>
                    <span style={{ fontWeight: '500' }}>{fee.year}</span>
                    <span style={{ marginLeft: '12px', fontSize: '13px', color: '#8c8c8c' }}>年费</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600', color: '#fa8c16' }}>¥{fee.amount.toLocaleString()}</div>
                    <div style={{ fontSize: '12px', color: fee.status === 'paid' ? '#52c41a' : '#d48806' }}>
                      {fee.status === 'paid' ? '已缴纳 ' + fee.paidDate : '截止 ' + fee.dueDate}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <h4 style={{ margin: '0 0 12px 0' }}>📎 材料记录</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {detailData.materials?.map((m, index) => (
                <div key={index} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', background: '#f5f5f5', borderRadius: '6px'
                }}>
                  <div>
                    <span>📄 {m.name}</span>
                    <span style={{ marginLeft: '8px', fontSize: '12px', color: '#8c8c8c' }}>{m.size}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#52c41a' }}>{m.status}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button style={styles.closeBtn} onClick={() => setShowDetail(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px' },
  filterBar: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  searchInput: { flex: 1, minWidth: '200px', padding: '10px 14px', border: '1px solid #d9d9d9', borderRadius: '8px', fontSize: '14px', outline: 'none' },
  filterSelect: { padding: '10px 14px', border: '1px solid #d9d9d9', borderRadius: '8px', fontSize: '14px', background: '#fff', outline: 'none' },
  tableContainer: { background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { background: '#fafafa', borderBottom: '1px solid #f0f0f0' },
  tableRow: { borderBottom: '1px solid #f0f0f0' },
  badge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  actionBtn: { padding: '4px 12px', border: '1px solid #d9d9d9', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', marginRight: '6px' },
  pagination: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', color: '#8c8c8c' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '550px', maxHeight: '80vh', overflowY: 'auto' },
  timeline: { position: 'relative' },
  timelineItem: { display: 'flex', padding: '12px 0', position: 'relative' },
  timelineDot: { width: '12px', height: '12px', borderRadius: '50%', background: '#1890ff', marginTop: '5px', flexShrink: 0 },
  closeBtn: { padding: '10px 24px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }
};
