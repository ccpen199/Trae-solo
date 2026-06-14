import React, { useState, useEffect } from 'react';
import api from '../../api';

const resultMap = {
  won: { label: '胜诉', color: '#52c41a' },
  partial: { label: '部分胜诉', color: '#faad14' },
  lost: { label: '败诉', color: '#ff4d4f' },
  mediated: { label: '调解', color: '#1890ff' }
};

const caseTypeMap = {
  copyright: '著作权',
  trademark: '商标权',
  patent: '专利权',
  contract: '合同纠纷',
  tort: '侵权纠纷'
};

export default function Statistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingWhitePaper, setGeneratingWhitePaper] = useState(false);
  const [whitePaperProgress, setWhitePaperProgress] = useState(0);
  const [showWhitePaper, setShowWhitePaper] = useState(false);
  const [whitePaperData, setWhitePaperData] = useState(null);
  const [showCaseDetail, setShowCaseDetail] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  const resultStats = [
    { type: 'won', count: 45, label: '胜诉' },
    { type: 'partial', count: 28, label: '部分胜诉' },
    { type: 'lost', count: 15, label: '败诉' },
    { type: 'mediated', count: 12, label: '调解' }
  ];

  const closedCases = [
    { id: 1, caseNumber: '(2025)京0101民初1234号', type: 'copyright', result: 'won', lawyer: '张明律师', closeDate: '2025-12-15' },
    { id: 2, caseNumber: '(2025)沪0202民初5678号', type: 'trademark', result: 'partial', lawyer: '李华律师', closeDate: '2025-11-28' },
    { id: 3, caseNumber: '(2025)粤0303民初9012号', type: 'patent', result: 'lost', lawyer: '王芳律师', closeDate: '2025-10-20' },
    { id: 4, caseNumber: '(2025)浙0404民初3456号', type: 'contract', result: 'mediated', lawyer: '赵强律师', closeDate: '2025-09-15' },
    { id: 5, caseNumber: '(2025)苏0505民初7890号', type: 'tort', result: 'won', lawyer: '陈静律师', closeDate: '2025-08-22' },
    { id: 6, caseNumber: '(2025)京0101民初2345号', type: 'copyright', result: 'won', lawyer: '张明律师', closeDate: '2025-07-18' },
    { id: 7, caseNumber: '(2025)沪0202民初6789号', type: 'trademark', result: 'partial', lawyer: '李华律师', closeDate: '2025-06-30' },
    { id: 8, caseNumber: '(2025)粤0303民初0123号', type: 'patent', result: 'won', lawyer: '王芳律师', closeDate: '2025-05-12' }
  ];

  const totalResults = resultStats.reduce((sum, item) => sum + item.count, 0);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try { const res = await api.get('/manager/statistics/win-rate'); setStats(res.data); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const generateWhitePaper = () => {
    setGeneratingWhitePaper(true);
    setWhitePaperProgress(0);
    const interval = setInterval(() => {
      setWhitePaperProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setGeneratingWhitePaper(false);
          const data = {
            overview: {
              totalClosed: stats?.overall?.totalClosed || 100,
              winRate: stats?.overall?.winRate || 45,
              wonCases: stats?.overall?.wonCases || 45,
              period: '2025年1月 - 2025年12月',
              generateDate: new Date().toLocaleDateString('zh-CN')
            },
            byType: stats?.byType || [
              { case_type: 'copyright', rate: 55, won: 22, total: 40 },
              { case_type: 'trademark', rate: 48, won: 12, total: 25 },
              { case_type: 'patent', rate: 42, won: 8, total: 19 },
              { case_type: 'contract', rate: 50, won: 10, total: 20 },
              { case_type: 'tort', rate: 38, won: 7, total: 18 }
            ],
            byYear: stats?.byYear || [
              { year: '2025', total: 100, won: 45 },
              { year: '2024', total: 85, won: 36 },
              { year: '2023', total: 72, won: 28 }
            ],
            typicalCases: [
              {
                title: '某科技公司软件著作权侵权纠纷案',
                description: '代理原告某科技公司起诉被告侵犯其软件著作权，经审理法院认定侵权成立，判决被告赔偿经济损失500万元及合理开支20万元。',
                result: '胜诉',
                highlight: '本案涉及复杂的技术比对，通过司法鉴定和专家证人作证，成功证明了侵权事实。'
              },
              {
                title: '某知名品牌商标侵权及不正当竞争案',
                description: '代理被告某电商公司，在充分举证后促成双方达成和解，被告获得商标授权使用，原告获得合理赔偿。',
                result: '调解',
                highlight: '本案通过调解方式实现了双赢，既保护了原告的知识产权，也使被告能够继续合法经营。'
              },
              {
                title: '某医疗器械公司专利权属纠纷案',
                description: '代理原告某医疗器械公司，主张其为涉案专利的实际权利人，法院判决确认专利权归原告所有。',
                result: '胜诉',
                highlight: '本案涉及职务发明创造的认定，通过大量研发文档和沟通记录的举证，厘清了权属争议。'
              }
            ],
            suggestions: [
              '完善知识产权管理体系，建立从研发到保护的全流程管理制度',
              '加强合同审查，在合作协议中明确知识产权归属和侵权责任条款',
              '定期开展知识产权风险排查，及时发现并处理潜在的侵权问题',
              '建立知识产权预警机制，关注行业动态和竞争对手的专利布局',
              '加强员工知识产权培训，提高全员知识产权保护意识',
              '对于核心技术，考虑采用专利+商业秘密的复合保护模式'
            ]
          };
          setWhitePaperData(data);
          setShowWhitePaper(true);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 200);
  };

  const downloadWhitePaper = () => {
    alert('白皮书下载功能（模拟）：白皮书已保存为 "知识产权案件数据白皮书.pdf"');
  };

  const viewCaseDetail = (caseItem) => {
    const caseDetail = {
      ...caseItem,
      plaintiff: '北京某某科技有限公司',
      defendant: '上海某某网络科技有限公司',
      caseAmount: '500万元',
      court: '北京市第一中级人民法院',
      judge: '李某某',
      clerk: '王某某',
      filingDate: '2025-03-15',
      hearingDate: '2025-06-20',
      summary: '原告起诉被告侵犯其软件著作权，请求法院判令被告停止侵权并赔偿经济损失500万元。经审理，法院认定被告构成侵权，判决支持原告全部诉讼请求。',
      evidence: [
        '软件著作权登记证书',
        '源程序比对报告',
        '侵权行为公证书',
        '被告获利证据',
        '原告合理支出凭证'
      ]
    };
    setSelectedCase(caseDetail);
    setShowCaseDetail(true);
  };

  const renderPieChart = () => {
    const segments = [];
    let currentAngle = 0;
    resultStats.forEach((item, index) => {
      const percentage = (item.count / totalResults) * 100;
      const angle = (item.count / totalResults) * 360;
      segments.push({ ...item, percentage, startAngle: currentAngle, endAngle: currentAngle + angle });
      currentAngle += angle;
    });

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
        <div style={{ width: '200px', height: '200px', position: 'relative', borderRadius: '50%', overflow: 'hidden' }}>
          {segments.map((seg, index) => {
            const color = resultMap[seg.type]?.color || '#888';
            const startRad = (seg.startAngle - 90) * Math.PI / 180;
            const endRad = (seg.endAngle - 90) * Math.PI / 180;
            const x1 = 100 + 100 * Math.cos(startRad);
            const y1 = 100 + 100 * Math.sin(startRad);
            const x2 = 100 + 100 * Math.cos(endRad);
            const y2 = 100 + 100 * Math.sin(endRad);
            const largeArc = seg.endAngle - seg.startAngle > 180 ? 1 : 0;
            const d = `M 100 100 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`;
            return (
              <svg key={index} width="200" height="200" style={{ position: 'absolute', top: 0, left: 0 }}>
                <path d={d} fill={color} />
              </svg>
            );
          })}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '80px', height: '80px', borderRadius: '50%', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', fontSize: '12px', color: '#8c8c8c'
          }}>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#262626' }}>{totalResults}</div>
            <div>案件总数</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          {resultStats.map((item, index) => {
            const percentage = ((item.count / totalResults) * 100).toFixed(1);
            return (
              <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{
                  display: 'inline-block', width: '16px', height: '16px', borderRadius: '4px',
                  marginRight: '10px', background: resultMap[item.type]?.color
                }}></span>
                <span style={{ flex: 1 }}>{resultMap[item.type]?.label}</span>
                <span style={{ fontWeight: '600', marginRight: '10px' }}>{item.count} 件</span>
                <span style={{ color: '#8c8c8c' }}>{percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>加载中...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.overviewCard}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '48px', fontWeight: '700', color: '#52c41a', lineHeight: 1 }}>
            {stats?.overall?.winRate || 0}%
          </div>
          <div style={{ fontSize: '14px', color: '#fff', opacity: 0.85, marginTop: '8px' }}>总体胜诉率</div>
        </div>
        <div style={{ ...styles.divider }}></div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#fff' }}>
            {stats?.overall?.totalClosed || 0}
          </div>
          <div style={{ fontSize: '14px', color: '#fff', opacity: 0.85, marginTop: '8px' }}>已结案总数</div>
        </div>
        <div style={{ ...styles.divider }}></div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#fff' }}>
            {stats?.overall?.wonCases || 0}
          </div>
          <div style={{ fontSize: '14px', color: '#fff', opacity: 0.85, marginTop: '8px' }}>胜诉案件</div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>📋 案件结果口径说明</h3>
        <div style={styles.caliberGrid}>
          <div style={styles.caliberItem}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ ...styles.caliberDot, background: '#52c41a' }}></span>
              <span style={{ fontWeight: '600' }}>胜诉</span>
            </div>
            <div style={{ fontSize: '13px', color: '#595959' }}>法院判决支持全部诉讼请求</div>
          </div>
          <div style={styles.caliberItem}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ ...styles.caliberDot, background: '#faad14' }}></span>
              <span style={{ fontWeight: '600' }}>部分胜诉</span>
            </div>
            <div style={{ fontSize: '13px', color: '#595959' }}>法院判决支持部分诉讼请求</div>
          </div>
          <div style={styles.caliberItem}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ ...styles.caliberDot, background: '#ff4d4f' }}></span>
              <span style={{ fontWeight: '600' }}>败诉</span>
            </div>
            <div style={{ fontSize: '13px', color: '#595959' }}>法院判决驳回全部诉讼请求</div>
          </div>
          <div style={styles.caliberItem}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ ...styles.caliberDot, background: '#1890ff' }}></span>
              <span style={{ fontWeight: '600' }}>调解</span>
            </div>
            <div style={{ fontSize: '13px', color: '#595959' }}>以调解/和解方式结案</div>
          </div>
        </div>
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #f0f0f0', fontSize: '13px', color: '#8c8c8c' }}>
          <div style={{ marginBottom: '4px' }}>📅 数据更新时间：{new Date().toLocaleString('zh-CN')}</div>
          <div>📊 统计范围：所有已结案（status = closed）的案件，包含判决、调解、和解等结案方式</div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>🥧 按结果类型统计</h3>
          <button style={styles.whitePaperBtn} onClick={generateWhitePaper} disabled={generatingWhitePaper}>
            {generatingWhitePaper ? '生成中...' : '📄 生成数据白皮书'}
          </button>
        </div>
        {generatingWhitePaper && (
          <div style={{ marginBottom: '20px', padding: '16px', background: '#f0f5ff', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span>正在生成白皮书...</span>
              <span style={{ color: '#1890ff', fontWeight: '500' }}>{Math.min(100, Math.round(whitePaperProgress))}%</span>
            </div>
            <div style={{ height: '8px', background: '#e6f7ff', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${Math.min(100, whitePaperProgress)}%`,
                background: 'linear-gradient(90deg, #1890ff, #597ef7)', borderRadius: '4px',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>
        )}
        {renderPieChart()}
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>📊 按案件类型胜诉率</h3>
        <div style={styles.statsGrid}>
          {stats?.byType?.map((item, index) => (
            <div key={index} style={styles.typeStat}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: '500' }}>
                  {item.case_type?.replace('_', ' ') || '其他'}
                </span>
                <span style={{ color: '#52c41a', fontWeight: '600' }}>{item.rate || 0}%</span>
              </div>
              <div style={{ height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${item.rate || 0}%`,
                  background: 'linear-gradient(90deg, #52c41a, #73d13d)',
                  borderRadius: '4px'
                }}></div>
              </div>
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '6px' }}>
                {item.won} 胜 / {item.total} 案
              </div>
            </div>
          ))}
          {!stats?.byType?.length && <div style={{ textAlign: 'center', padding: '20px', color: '#8c8c8c' }}>暂无数据</div>}
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>📈 年度趋势</h3>
        <div style={styles.yearlyStats}>
          {stats?.byYear?.map((item, index) => (
            <div key={index} style={styles.yearItem}>
              <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '12px' }}>{item.year}</div>
              <div style={styles.yearBars}>
                <div style={{ ...styles.barContainer }}>
                  <div style={{
                    ...styles.bar,
                    height: `${(item.total / (stats?.byYear?.[0]?.total || 1)) * 120}px`,
                    background: '#1890ff'
                  }}></div>
                  <div style={{ fontSize: '12px', color: '#1890ff', marginTop: '4px', textAlign: 'center' }}>{item.total} 案</div>
                </div>
                <div style={{ ...styles.barContainer }}>
                  <div style={{
                    ...styles.bar,
                    height: `${(item.won / (stats?.byYear?.[0]?.total || 1)) * 120}px`,
                    background: '#52c41a'
                  }}></div>
                  <div style={{ fontSize: '12px', color: '#52c41a', marginTop: '4px', textAlign: 'center' }}>{item.won} 胜</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px', fontSize: '13px' }}>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#1890ff', marginRight: '6px', verticalAlign: 'middle' }}></span>总案件</span>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#52c41a', marginRight: '6px', verticalAlign: 'middle' }}></span>胜诉</span>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>📁 已结案案件列表</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                <th style={styles.tableHeader}>案号</th>
                <th style={styles.tableHeader}>案件类型</th>
                <th style={styles.tableHeader}>结果</th>
                <th style={styles.tableHeader}>代理律师</th>
                <th style={styles.tableHeader}>结案日期</th>
                <th style={styles.tableHeader}>操作</th>
              </tr>
            </thead>
            <tbody>
              {closedCases.map((caseItem, index) => (
                <tr key={caseItem.id} style={styles.tableRow}>
                  <td style={styles.tableCell}>{caseItem.caseNumber}</td>
                  <td style={styles.tableCell}>{caseTypeMap[caseItem.type] || caseItem.type}</td>
                  <td style={styles.tableCell}>
                    <span style={{
                      ...styles.resultBadge,
                      background: resultMap[caseItem.result]?.color + '15',
                      color: resultMap[caseItem.result]?.color
                    }}>
                      {resultMap[caseItem.result]?.label}
                    </span>
                  </td>
                  <td style={styles.tableCell}>{caseItem.lawyer}</td>
                  <td style={styles.tableCell}>{caseItem.closeDate}</td>
                  <td style={styles.tableCell}>
                    <button style={styles.detailBtn} onClick={() => viewCaseDetail(caseItem)}>查看详情</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={styles.tipsCard}>
        <h4 style={{ margin: '0 0 12px 0' }}>💡 数据说明</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#595959', fontSize: '13px', lineHeight: '2' }}>
          <li>胜诉率 = 胜诉案件数 / 已结案总数 × 100%</li>
          <li>数据范围：所有已结案（status = closed）的案件</li>
          <li>案件结果标记为"胜诉"的计入胜诉统计</li>
          <li>建议定期更新案件状态，保证统计准确性</li>
        </ul>
      </div>

      {showWhitePaper && whitePaperData && (
        <div style={styles.modalOverlay} onClick={() => setShowWhitePaper(false)}>
          <div style={{ ...styles.modal, maxWidth: '800px', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #1890ff' }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', color: '#1890ff' }}>📄 知识产权案件数据白皮书</h2>
                <div style={{ fontSize: '13px', color: '#8c8c8c' }}>
                  统计周期：{whitePaperData.overview.period} | 生成时间：{whitePaperData.overview.generateDate}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={styles.downloadBtn} onClick={downloadWhitePaper}>⬇️ 下载PDF</button>
                <button style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: '#8c8c8c', padding: '0 8px' }} onClick={() => setShowWhitePaper(false)}>×</button>
              </div>
            </div>

            <div style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 120px)', paddingRight: '8px' }}>
              <div style={{ marginBottom: '28px' }}>
                <h3 style={{ ...styles.whitePaperSectionTitle }}>一、统计概览</h3>
                <div style={styles.overviewGrid}>
                  <div style={styles.overviewStatCard}>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#1890ff' }}>{whitePaperData.overview.totalClosed}</div>
                    <div style={{ fontSize: '13px', color: '#8c8c8c', marginTop: '4px' }}>已结案总数</div>
                  </div>
                  <div style={styles.overviewStatCard}>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#52c41a' }}>{whitePaperData.overview.winRate}%</div>
                    <div style={{ fontSize: '13px', color: '#8c8c8c', marginTop: '4px' }}>总体胜诉率</div>
                  </div>
                  <div style={styles.overviewStatCard}>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#722ed1' }}>{whitePaperData.overview.wonCases}</div>
                    <div style={{ fontSize: '13px', color: '#8c8c8c', marginTop: '4px' }}>胜诉案件数</div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '28px' }}>
                <h3 style={{ ...styles.whitePaperSectionTitle }}>二、各类型案件胜诉率分析</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {whitePaperData.byType.map((item, index) => (
                    <div key={index} style={{ padding: '16px', background: '#fafafa', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: '500', fontSize: '15px' }}>{caseTypeMap[item.case_type] || item.case_type?.replace('_', ' ')}</span>
                        <span style={{ color: item.rate >= 50 ? '#52c41a' : '#fa8c16', fontWeight: '600', fontSize: '18px' }}>{item.rate}%</span>
                      </div>
                      <div style={{ height: '10px', background: '#f0f0f0', borderRadius: '5px', overflow: 'hidden', marginBottom: '8px' }}>
                        <div style={{
                          height: '100%', width: `${item.rate}%`,
                          background: item.rate >= 50 ? 'linear-gradient(90deg, #52c41a, #73d13d)' : 'linear-gradient(90deg, #faad14, #fa8c16)',
                          borderRadius: '5px'
                        }}></div>
                      </div>
                      <div style={{ fontSize: '13px', color: '#8c8c8c' }}>胜诉 {item.won} 件 / 共 {item.total} 件</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '28px' }}>
                <h3 style={{ ...styles.whitePaperSectionTitle }}>三、年度趋势分析</h3>
                <div style={{ padding: '20px', background: '#fafafa', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '200px', marginBottom: '20px' }}>
                    {whitePaperData.byYear.map((item, index) => {
                      const maxTotal = Math.max(...whitePaperData.byYear.map(y => y.total));
                      return (
                        <div key={index} style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ fontWeight: '600', marginBottom: '12px', fontSize: '14px' }}>{item.year}</div>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'flex-end', height: '160px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{
                                width: '40px', background: '#1890ff', borderRadius: '4px 4px 0 0',
                                height: `${(item.total / maxTotal) * 140}px`
                              }}></div>
                              <div style={{ fontSize: '12px', color: '#1890ff', marginTop: '4px', fontWeight: '500' }}>{item.total}</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{
                                width: '40px', background: '#52c41a', borderRadius: '4px 4px 0 0',
                                height: `${(item.won / maxTotal) * 140}px`
                              }}></div>
                              <div style={{ fontSize: '12px', color: '#52c41a', marginTop: '4px', fontWeight: '500' }}>{item.won}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '13px', color: '#595959' }}>
                    <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#1890ff', marginRight: '6px', borderRadius: '2px' }}></span>总案件数</span>
                    <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#52c41a', marginRight: '6px', borderRadius: '2px' }}></span>胜诉数</span>
                  </div>
                </div>
                <div style={{ marginTop: '12px', padding: '16px', background: '#e6f7ff', borderRadius: '8px', border: '1px solid #91d5ff' }}>
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>📊 趋势分析</div>
                  <div style={{ fontSize: '13px', color: '#595959', lineHeight: '1.8' }}>
                    近三年案件量呈稳步增长趋势，2025年较2023年增长约38.9%。胜诉率整体保持在40%-50%区间，
                    反映出知识产权诉讼的专业性和复杂性。建议加强案件前期评估，提高案件质量。
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '28px' }}>
                <h3 style={{ ...styles.whitePaperSectionTitle }}>四、典型案例精选</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {whitePaperData.typicalCases.map((item, index) => (
                    <div key={index} style={{ padding: '20px', border: '1px solid #e8e8e8', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, fontSize: '15px', color: '#262626' }}>案例 {index + 1}：{item.title}</h4>
                        <span style={{
                          padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500',
                          background: item.result === '胜诉' ? '#f6ffed' : '#e6f7ff',
                          color: item.result === '胜诉' ? '#52c41a' : '#1890ff'
                        }}>{item.result}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#595959', lineHeight: '1.8', marginBottom: '12px' }}>{item.description}</div>
                      <div style={{ padding: '12px', background: '#fffbe6', borderRadius: '6px', fontSize: '12px', color: '#874d00' }}>
                        <strong>💡 亮点：</strong>{item.highlight}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ ...styles.whitePaperSectionTitle }}>五、建议措施</h3>
                <div style={{ padding: '20px', background: '#fff7e6', borderRadius: '8px', border: '1px solid #ffd591' }}>
                  <ol style={{ margin: 0, paddingLeft: '24px', fontSize: '13px', lineHeight: '2.2', color: '#595959' }}>
                    {whitePaperData.suggestions.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCaseDetail && selectedCase && (
        <div style={styles.modalOverlay} onClick={() => setShowCaseDetail(false)}>
          <div style={{ ...styles.modal, maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>📁 案件详情</h3>
              <button style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }} onClick={() => setShowCaseDetail(false)}>×</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: '15px', fontWeight: '600' }}>{selectedCase.caseNumber}</div>
              <span style={{
                ...styles.resultBadge,
                background: resultMap[selectedCase.result]?.color + '15',
                color: resultMap[selectedCase.result]?.color
              }}>
                {resultMap[selectedCase.result]?.label}
              </span>
            </div>

            <div style={{ background: '#f5f5f5', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div><span style={{ color: '#8c8c8c' }}>案件类型：</span><strong>{caseTypeMap[selectedCase.type] || selectedCase.type}</strong></div>
                <div><span style={{ color: '#8c8c8c' }}>标的金额：</span>{selectedCase.caseAmount}</div>
                <div><span style={{ color: '#8c8c8c' }}>原告：</span>{selectedCase.plaintiff}</div>
                <div><span style={{ color: '#8c8c8c' }}>被告：</span>{selectedCase.defendant}</div>
                <div><span style={{ color: '#8c8c8c' }}>受理法院：</span>{selectedCase.court}</div>
                <div><span style={{ color: '#8c8c8c' }}>代理律师：</span>{selectedCase.lawyer}</div>
                <div><span style={{ color: '#8c8c8c' }}>立案日期：</span>{selectedCase.filingDate}</div>
                <div><span style={{ color: '#8c8c8c' }}>结案日期：</span>{selectedCase.closeDate}</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>📝 案情摘要</h4>
              <div style={{ fontSize: '13px', color: '#595959', lineHeight: '1.8', padding: '12px', background: '#fafafa', borderRadius: '6px' }}>
                {selectedCase.summary}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>📋 主要证据</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedCase.evidence?.map((ev, index) => (
                  <span key={index} style={{
                    padding: '6px 12px', background: '#e6f7ff', color: '#1890ff',
                    borderRadius: '14px', fontSize: '12px'
                  }}>
                    {ev}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button style={styles.pageBtn} onClick={() => setShowCaseDetail(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px' },
  overviewCard: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '16px', padding: '32px', display: 'flex', alignItems: 'center', color: '#fff' },
  divider: { width: '1px', height: '60px', background: 'rgba(255,255,255,0.2)', margin: '0 20px' },
  card: { background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
  typeStat: { padding: '16px', background: '#fafafa', borderRadius: '10px' },
  yearlyStats: { display: 'flex', gap: '32px', overflowX: 'auto', paddingBottom: '10px' },
  yearItem: { textAlign: 'center', minWidth: '80px' },
  yearBars: { display: 'flex', gap: '8px', alignItems: 'flex-end', justifyContent: 'center', height: '140px' },
  barContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', width: '32px' },
  bar: { width: '24px', borderRadius: '4px 4px 0 0' },
  tipsCard: { background: '#e6f7ff', borderRadius: '12px', padding: '20px 24px', border: '1px solid #91d5ff' },
  caliberGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  caliberItem: { padding: '16px', background: '#fafafa', borderRadius: '10px' },
  caliberDot: { display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', marginRight: '8px' },
  whitePaperBtn: {
    padding: '8px 20px', background: '#fff', border: '1px solid #1890ff', color: '#1890ff',
    borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500',
    transition: 'all 0.3s'
  },
  tableHeader: {
    padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600',
    color: '#595959', borderBottom: '1px solid #f0f0f0'
  },
  tableCell: {
    padding: '12px 16px', fontSize: '13px', borderBottom: '1px solid #f0f0f0'
  },
  tableRow: {
    transition: 'background 0.2s',
    cursor: 'default'
  },
  resultBadge: {
    padding: '4px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '500'
  },
  detailBtn: {
    padding: '4px 12px', border: '1px solid #d9d9d9', background: '#fff', borderRadius: '6px',
    fontSize: '12px', cursor: 'pointer', color: '#1890ff'
  },
  pageBtn: { padding: '6px 14px', border: '1px solid #d9d9d9', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: '#fff', borderRadius: '12px', padding: '28px', width: '100%', overflowY: 'auto' },
  downloadBtn: {
    padding: '8px 16px', background: '#52c41a', color: '#fff', border: 'none',
    borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500'
  },
  whitePaperSectionTitle: {
    margin: '0 0 16px 0', fontSize: '18px', color: '#1890ff',
    paddingBottom: '8px', borderBottom: '2px solid #e6f7ff'
  },
  overviewGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px'
  },
  overviewStatCard: {
    padding: '20px', textAlign: 'center', background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)',
    borderRadius: '12px'
  }
};
