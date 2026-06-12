import React, { useEffect, useRef, useState } from 'react';
import InputForm from './components/InputForm.jsx';
import NameList from './components/NameList.jsx';
import NameDetail from './components/NameDetail.jsx';
import BaziInfo from './components/BaziInfo.jsx';
import MasterReviewModal from './components/MasterReviewModal.jsx';

const initialForm = {
  surname: '',
  gender: '男',
  birthday: '',
  birthHour: 12,
  birthMinute: 0,
  longitude: 116.4,
  nameLength: 2,
  wish: ''
};

function App() {
  const [loading, setLoading] = useState(false);
  const [baziData, setBaziData] = useState(null);
  const [liuNianData, setLiuNianData] = useState(null);
  const [namesList, setNamesList] = useState([]);
  const [selectedName, setSelectedName] = useState(null);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [targetWuxing, setTargetWuxing] = useState(null);
  const [generationStats, setGenerationStats] = useState(null);
  const [userFormData, setUserFormData] = useState(null);
  const [activeReviewId, setActiveReviewId] = useState(null);
  const [masterStatus, setMasterStatus] = useState(null);
  const [showReviewTimeline, setShowReviewTimeline] = useState(false);
  const [reviewTimeline, setReviewTimeline] = useState([]);
  const [selectedForReport, setSelectedForReport] = useState(new Set());
  const [generatingReport, setGeneratingReport] = useState(false);

  const applyAnalysisResult = (result, formData) => {
    const { bazi, liuNian2025, names } = result.data;
    
    setBaziData(bazi);
    setLiuNianData(liuNian2025);
    setNamesList(names.names);
    setTargetWuxing(names.targetWuxing);
    setGenerationStats(names.generationStats);
    setUserFormData(formData);
    setSelectedForReport(new Set());
    setMasterStatus(null);
    setReviewTimeline([]);
    setShowReviewTimeline(false);

    if (names.names.length > 0) {
      setSelectedName(names.names[0]);
      setSelectedForReport(new Set([names.names[0].id]));
    }
  };

  const handleSubmit = async (formData, options = {}) => {
    setLoading(true);
    setSelectedName(null);
    setBaziData(null);
    setNamesList([]);
    
    try {
      const response = await fetch('/api/names/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        applyAnalysisResult(result, formData);
      } else {
        if (!options.silent) alert(result.message || '分析失败');
      }
    } catch (error) {
      console.error('请求失败:', error);
      if (!options.silent) alert('网络错误，请检查后端服务是否启动');
    } finally {
      setLoading(false);
    }
  };

  const handleNameSelect = (name) => {
    setSelectedName(name);
  };

  const handleGenerateReport = async (format = 'html') => {
    if (selectedForReport.size === 0) {
      alert('请先选择要生成报告的名字');
      return;
    }
    
    setGeneratingReport(true);
    
    try {
      const selectedNames = namesList.filter(n => selectedForReport.has(n.id));
      
      const response = await fetch('/api/report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          names: selectedNames,
          bazi: baziData,
          userInfo: {
            ...userFormData,
            birthHour: userFormData.birthHour
          },
          selectedNameIds: Array.from(selectedForReport),
          reviewInfo: masterStatus,
          format
        })
      });
      
      if (response.ok) {
        if (format === 'json') {
          const result = await response.json();
          if (result.success) {
            const preview = window.open('', '_blank');
            preview.document.write(result.data.html);
            preview.document.close();
          }
        } else {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `起名方案_${new Date().toISOString().slice(0, 10)}.html`;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      console.error('生成报告失败:', error);
      alert('生成报告失败');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handlePrintAsPDF = async () => {
    if (selectedForReport.size === 0) {
      alert('请先选择要生成报告的名字');
      return;
    }
    
    try {
      const selectedNames = namesList.filter(n => selectedForReport.has(n.id));
      
      const response = await fetch('/api/report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          names: selectedNames,
          bazi: baziData,
          userInfo: {
            ...userFormData,
            birthHour: userFormData.birthHour
          },
          selectedNameIds: Array.from(selectedForReport),
          reviewInfo: masterStatus,
          format: 'json'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        const preview = window.open('', '_blank');
        preview.document.write(result.data.html);
        preview.document.close();
        
        setTimeout(() => {
          preview.print();
        }, 1000);
      }
    } catch (error) {
      console.error('生成报告失败:', error);
      alert('生成报告失败');
    }
  };

  const handleReviewSubmitSuccess = (reviewId) => {
    setActiveReviewId(reviewId);
    setShowMasterModal(false);
    fetchReviewStatus(reviewId);
    fetchReviewTimeline(reviewId);
  };

  const fetchReviewStatus = async (reviewId) => {
    try {
      const response = await fetch(`/api/master/reviews/${reviewId}`);
      const result = await response.json();
      if (result.success) {
        setMasterStatus(result.data);
      }
    } catch (error) {
      console.error('查询复核状态失败:', error);
    }
  };

  const fetchReviewTimeline = async (reviewId) => {
    try {
      const response = await fetch(`/api/master/reviews/${reviewId}/timeline`);
      const result = await response.json();
      if (result.success) {
        setReviewTimeline(result.data.timeline);
      }
    } catch (error) {
      console.error('查询审核轨迹失败:', error);
    }
  };

  const toggleNameSelection = (nameId) => {
    const newSet = new Set(selectedForReport);
    if (newSet.has(nameId)) {
      newSet.delete(nameId);
    } else {
      newSet.add(nameId);
    }
    setSelectedForReport(newSet);
  };

  const refreshReviewStatus = () => {
    if (activeReviewId) {
      fetchReviewStatus(activeReviewId);
      fetchReviewTimeline(activeReviewId);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>🏮 中华姓名学智能起名系统</h1>
        <p>融合八字命理 · 生肖喜忌 · 五格数理 · 周易卦象</p>
      </div>

      <div className="main-content">
        <div>
          <div className="card">
            <div className="card-title">
              <span>📝</span>
              <span>起名信息</span>
            </div>
            <InputForm onSubmit={handleSubmit} loading={loading} />
          </div>

          {baziData && (
            <AdminAuditPanel 
              selectedName={selectedName}
              namesList={namesList}
              liuNianData={liuNianData}
              baziData={baziData}
              targetWuxing={targetWuxing}
              generationStats={generationStats}
              masterStatus={masterStatus}
              reviewTimeline={reviewTimeline}
              showReviewTimeline={showReviewTimeline}
              setShowReviewTimeline={setShowReviewTimeline}
              activeReviewId={activeReviewId}
              refreshReviewStatus={refreshReviewStatus}
            />
          )}
          
          {baziData && (
            <div className="card" style={{ marginTop: '20px' }}>
              <div className="card-title">
                <span>🔮</span>
                <span>八字命盘</span>
              </div>
              <BaziInfo baziData={baziData} liuNianData={liuNianData} targetWuxing={targetWuxing} />
            </div>
          )}
        </div>

        <div>
          <div className="card">
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span>✨</span>
                <span>候选名字 ({namesList.length}个)</span>
              </div>
              {namesList.length > 0 && (
                <div style={{ fontSize: '12px', color: '#888', fontWeight: 'normal' }}>
                  已选 {selectedForReport.size} 个加入报告
                </div>
              )}
            </div>
            
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>正在智能生成名字，请稍候...</p>
                <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                  融合八字排盘、五行平衡、五格数理、卦象解析...
                </p>
              </div>
            ) : namesList.length > 0 ? (
              <div>
                <div style={{ 
                  padding: '12px', 
                  background: '#f6ffed', 
                  borderRadius: '8px', 
                  marginBottom: '16px',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: '#52c41a', fontWeight: 600 }}>✅</span>
                      已成功生成 <strong>{namesList.length}</strong> 个候选名
                      {generationStats && (
                        <span style={{ color: '#888', marginLeft: '8px' }}>
                          (尝试{generationStats.totalAttempts}次，通过率{Math.round(generationStats.passRate * 100)}%)
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    目标五行：补{targetWuxing?.bu?.join('、') || ''}，泄{targetWuxing?.xie?.join('、') || ''}
                  </div>
                </div>
                
                <div style={{ 
                  marginBottom: '12px', 
                  padding: '8px 12px', 
                  background: '#f0f5ff', 
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  💡 点击名字查看详情，勾选左侧复选框可加入PDF报告
                </div>
                
                <div className="name-list">
                  {namesList.map((name) => (
                    <div 
                      key={name.id}
                      className={`name-item ${selectedName?.id === name.id ? 'selected' : ''}`}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}
                      onClick={() => handleNameSelect(name)}
                    >
                      <div style={{ 
                        flexShrink: 0, 
                        paddingTop: '4px',
                        cursor: 'pointer'
                      }} onClick={(e) => {
                        e.stopPropagation();
                        toggleNameSelection(name.id);
                      }}>
                        <input 
                          type="checkbox" 
                          checked={selectedForReport.has(name.id)}
                          onChange={() => {}}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="name-header">
                          <span className="name-text">
                            {name.rank}. {name.fullName}
                          </span>
                          <span className="name-score">
                            {name.analysis?.totalScore || 0}分
                          </span>
                        </div>
                        <div className="name-meta">
                          <span>五行: {name.analysis?.wuxingBalance?.score || 0}分</span>
                          <span>五格: {name.analysis?.wuge?.score || 0}分</span>
                          <span>{name.analysis?.fayinTone?.pattern || ''}</span>
                          {name.analysis?.gua?.benGua && (
                            <span style={{ 
                              color: name.analysis.gua.benGua.jixiong === '大吉' || name.analysis.gua.benGua.jixiong === '吉' ? '#52c41a' : '#fa8c16'
                            }}>
                              {name.analysis.gua.benGua.jixiong}
                            </span>
                          )}
                          <span style={{ color: '#888' }}>策略: {name.strategy}</span>
                        </div>
                        
                        {name.review && name.review.checkItems && (
                          <div style={{ 
                            display: 'flex', 
                            gap: '6px', 
                            marginTop: '6px',
                            flexWrap: 'wrap'
                          }}>
                            {name.review.checkItems.map((item, idx) => (
                              <span 
                                key={idx}
                                style={{ 
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: item.result ? '#f6ffed' : '#fff1f0',
                                  color: item.result ? '#389e0d' : '#cf1322'
                                }}
                              >
                                {item.result ? '✓' : '✗'} {item.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📛</div>
                <p>请填写左侧信息并提交</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>
                  系统将根据生辰八字智能生成30个吉祥好名
                </p>
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px', 
                  background: '#fffbe6', 
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#874d00',
                  textAlign: 'left'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '8px' }}>📋 系统将为您提供：</div>
                  <div>• 真太阳时校准的八字排盘</div>
                  <div>• 五行平衡度评分与图解</div>
                  <div>• 五格数理分析（含变格校验）</div>
                  <div>• 周易卦象解析（本卦+之卦+爻辞）</div>
                  <div>• 2025流年生肖冲合分析</div>
                  <div>• 重名率统计（公安脱敏接口）</div>
                  <div>• 发音声调可视化</div>
                  <div>• 敏感字/谐音实时过滤</div>
                </div>
              </div>
            )}
          </div>
          
          {selectedName && (
            <div className="card" style={{ marginTop: '20px' }}>
              <div className="card-title">
                <span>📊</span>
                <span>详细分析 - {selectedName.fullName}</span>
                <span style={{ 
                  marginLeft: '12px', 
                  fontSize: '12px', 
                  color: '#888',
                  fontWeight: 'normal'
                }}>
                  排名第{selectedName.rank}名 · {selectedName.strategy}策略
                </span>
              </div>
              
              <NameDetail nameData={selectedName} />
              
              {selectedName.baziSnapshot && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px', 
                  background: '#f0f5ff', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '8px', color: '#1890ff' }}>
                    🔗 业务链路核验
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div>
                      <strong>八字四柱：</strong>
                      {selectedName.baziSnapshot.eightChars?.join(' ') || '-'}
                    </div>
                    <div>
                      <strong>目标五行：</strong>
                      补{selectedName.baziSnapshot.targetWuxing?.bu?.join('、') || '-'}，
                      泄{selectedName.baziSnapshot.targetWuxing?.xie?.join('、') || '-'}
                    </div>
                    <div>
                      <strong>名字五行：</strong>
                      {selectedName.characters?.map(c => `${c.char}(${c.wuxing})`).join(' + ') || '-'}
                    </div>
                    <div>
                      <strong>五格验证：</strong>
                      {selectedName.analysis?.verification?.wugeVerification?.verified ? (
                        <span style={{ color: '#52c41a' }}>✓ 通过</span>
                      ) : (
                        <span style={{ color: '#f5222d' }}>
                          ✗ {selectedName.analysis?.verification?.wugeVerification?.issues?.join('、') || '不通过'}
                        </span>
                      )}
                    </div>
                    <div>
                      <strong>卦象验证：</strong>
                      {selectedName.analysis?.verification?.guaVerification?.verified ? (
                        <span style={{ color: '#52c41a' }}>✓ 通过</span>
                      ) : (
                        <span style={{ color: '#f5222d' }}>
                          ✗ {selectedName.analysis?.verification?.guaVerification?.issues?.join('、') || '不通过'}
                        </span>
                      )}
                    </div>
                    <div>
                      <strong>合规审查：</strong>
                      {selectedName.review?.passed ? (
                        <span style={{ color: '#52c41a' }}>✓ 全部通过</span>
                      ) : (
                        <span style={{ color: '#f5222d' }}>
                          ✗ 发现{selectedName.review?.summary?.errors || 0}个错误
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="action-buttons">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowMasterModal(true)}
                >
                  👨‍🏫 申请命理师复核
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handlePrintAsPDF}
                  disabled={generatingReport || selectedForReport.size === 0}
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                  {generatingReport ? '📄 生成中...' : `📄 生成PDF报告 (${selectedForReport.size}个名字)`}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleGenerateReport('html')}
                  disabled={generatingReport || selectedForReport.size === 0}
                >
                  📥 下载HTML版报告
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showMasterModal && (
        <MasterReviewModal 
          nameData={selectedName}
          baziData={baziData}
          onClose={() => setShowMasterModal(false)}
          onSubmitSuccess={handleReviewSubmitSuccess}
        />
      )}
    </div>
  );
}

function AdminAuditPanel({ 
  selectedName, 
  namesList,
  liuNianData, 
  baziData, 
  targetWuxing,
  generationStats,
  masterStatus,
  reviewTimeline,
  showReviewTimeline,
  setShowReviewTimeline,
  activeReviewId,
  refreshReviewStatus
}) {
  const getAuditItems = () => {
    if (namesList.length === 0) {
      return [
        { label: '敏感字词审查', status: '待检测', detail: '提交生辰信息后自动检测' },
        { label: '谐音审查', status: '待检测', detail: '提交生辰信息后自动检测' },
        { label: '通用规范汉字表', status: '待检测', detail: '提交生辰信息后自动检测' },
        { label: '命理师人工复核', status: '待申请', detail: '生成候选名后可申请命理师人工复核' },
        { label: 'PDF报告', status: '待生成', detail: '选择名字后可一键生成完整命名方案报告' }
      ];
    }
    
    if (!selectedName) {
      return [
        { label: '敏感字词审查', status: '已检测', detail: `已完成${namesList.length}个名字的敏感词筛查` },
        { label: '谐音审查', status: '已检测', detail: '所有候选名均经过普通话谐音排查' },
        { label: '通用规范汉字表', status: '已检测', detail: '所有候选名均符合《通用规范汉字表》' },
        { label: '命理师人工复核', status: '待选择', detail: '请选择一个名字后申请复核' },
        { label: 'PDF报告', status: '待选择', detail: '请选择要加入报告的名字' }
      ];
    }
    
    const review = selectedName.review;
    const summary = review?.summary;
    
    return [
      { 
        label: '敏感字词审查', 
        status: summary?.sensitivePassed ? '通过' : '不通过', 
        detail: summary?.sensitivePassed ? '未命中敏感词库' : `命中：${review?.issues?.find(i => i.type === 'sensitive')?.hit || ''}`,
        hit: !summary?.sensitivePassed ? review?.issues?.find(i => i.type === 'sensitive') : null
      },
      { 
        label: '谐音审查', 
        status: summary?.homophonePassed ? '通过' : '需复查', 
        detail: summary?.homophonePassed ? '无不良谐音' : `谐音：${review?.issues?.find(i => i.type === 'homophone')?.hit || ''}`,
        hit: !summary?.homophonePassed ? review?.issues?.find(i => i.type === 'homophone') : null
      },
      { 
        label: '通用规范汉字表', 
        status: summary?.guifanPassed ? '通过' : '不通过', 
        detail: summary?.guifanPassed ? '全部为规范汉字' : `不规范：${review?.issues?.find(i => i.type === 'guifan')?.hit || ''}`,
        hit: !summary?.guifanPassed ? review?.issues?.find(i => i.type === 'guifan') : null
      },
      { 
        label: '偏旁吉凶审查', 
        status: review?.checkItems?.[3]?.result ? '通过' : '需注意', 
        detail: review?.checkItems?.[3]?.detail || '无不良部首'
      },
      { 
        label: '命理师人工复核', 
        status: masterStatus ? masterStatus.statusLabel : '可申请', 
        detail: masterStatus 
          ? `${masterStatus.masterName}${masterStatus.statusLabel} · ${masterStatus.masterComment || '已提交申请'}`
          : '点击下方按钮申请专业命理师复核，附意见留痕与电子签章',
        action: true
      },
      { 
        label: 'PDF命名方案报告', 
        status: '可生成', 
        detail: '包含八字排盘、五行评分、三才图解、重名率、声调可视化、复核意见等完整内容'
      }
    ];
  };

  const auditItems = getAuditItems();

  return (
    <div className="card" style={{ marginTop: '20px' }}>
      <div className="card-title">
        <span>🛡️</span>
        <span>后台管理与审查闭环</span>
        {namesList.length > 0 && (
          <span style={{ 
            marginLeft: '8px', 
            fontSize: '12px', 
            color: '#888',
            fontWeight: 'normal'
          }}>
            {selectedName ? `当前：${selectedName.fullName}` : `已处理${namesList.length}个名字`}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gap: '10px' }}>
        {auditItems.map((item, idx) => (
          <div key={item.label} style={{
            border: '1px solid #eee',
            borderRadius: '10px',
            padding: '12px',
            background: item.status === '通过' || item.status === '可生成' || item.status === '可申请' ? '#f6ffed' 
              : item.status === '不通过' ? '#fff1f0' 
              : item.status === '需复查' || item.status === '需注意' ? '#fffbe6'
              : '#fafafa'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
              <strong>{item.label}</strong>
              <span style={{ 
                color: item.status === '通过' || item.status === '可生成' || item.status === '可申请' || item.status === '已检测' ? '#237804' 
                  : item.status === '不通过' ? '#cf1322' 
                  : '#ad6800',
                fontWeight: 600
              }}>
                {item.status}
              </span>
            </div>
            <div style={{ fontSize: '12px', lineHeight: 1.6, color: '#666' }}>
              {item.detail}
              {item.hit && (
                <div style={{ 
                  marginTop: '6px', 
                  padding: '6px 10px', 
                  background: 'white', 
                  borderRadius: '4px',
                  border: '1px dashed #ffccc7',
                  fontSize: '11px'
                }}>
                  <span style={{ color: '#cf1322', fontWeight: 600 }}>⚠️ 规则命中：</span>
                  {item.hit.rule} → {item.hit.hit}：{item.hit.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {masterStatus && (
        <div style={{ 
          marginTop: '16px', 
          padding: '14px', 
          background: masterStatus.statusColor + '15',
          borderRadius: '10px',
          borderLeft: `4px solid ${masterStatus.statusColor}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <span style={{ fontWeight: 600 }}>📋 复核申请状态</span>
              <span style={{ 
                marginLeft: '8px', 
                padding: '2px 10px', 
                background: masterStatus.statusColor,
                color: 'white',
                borderRadius: '20px',
                fontSize: '12px'
              }}>
                {masterStatus.statusLabel}
              </span>
            </div>
            <button 
              onClick={refreshReviewStatus}
              style={{ 
                background: 'none', 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                padding: '4px 10px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              🔄 刷新状态
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
            <div>申请编号：<strong>{masterStatus.id}</strong></div>
            <div>命理师：<strong>{masterStatus.masterName}</strong></div>
            {masterStatus.masterScore > 0 && (
              <div>复核评分：<strong>{masterStatus.masterScore}分</strong></div>
            )}
            {masterStatus.completedAt && (
              <div>完成时间：<strong>{masterStatus.completedAt}</strong></div>
            )}
          </div>
          
          {masterStatus.masterComment && (
            <div style={{ 
              marginTop: '10px', 
              padding: '10px', 
              background: 'white', 
              borderRadius: '6px',
              fontSize: '12px',
              lineHeight: 1.8
            }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>💬 命理师意见：</div>
              {masterStatus.masterComment}
            </div>
          )}
          
          {masterStatus.suggestions && masterStatus.suggestions.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '12px' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>📝 改进建议：</div>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {masterStatus.suggestions.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          
          {masterStatus.signature && (
            <div style={{ textAlign: 'right', marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #ddd' }}>
              <div style={{ fontSize: '20px', fontFamily: 'serif' }}>{masterStatus.signature}</div>
              <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                签章日期：{masterStatus.signatureDate}
              </div>
            </div>
          )}
          
          <button 
            onClick={() => setShowReviewTimeline(!showReviewTimeline)}
            style={{ 
              marginTop: '10px', 
              background: 'none', 
              border: 'none', 
              color: '#1890ff',
              fontSize: '12px',
              cursor: 'pointer',
              padding: 0
            }}
          >
            {showReviewTimeline ? '▼ 收起状态流转' : '▶ 查看状态流转记录'}
          </button>
          
          {showReviewTimeline && reviewTimeline && reviewTimeline.length > 0 && (
            <div style={{ 
              marginTop: '10px', 
              padding: '12px', 
              background: 'white', 
              borderRadius: '6px',
              fontSize: '12px'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '10px' }}>⏱️ 审核轨迹</div>
              {reviewTimeline.map((log, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  padding: '8px 0',
                  borderBottom: idx < reviewTimeline.length - 1 ? '1px dashed #eee' : 'none'
                }}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: '#1890ff', 
                    marginTop: '5px',
                    flexShrink: 0
                  }}></div>
                  <div style={{ flex: 1 }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{log.label}</span>
                      <span style={{ marginLeft: '8px', color: '#888' }}>{log.timestamp}</span>
                    </div>
                    <div style={{ color: '#666', fontSize: '11px', marginTop: '2px' }}>
                      操作人：{log.operator} · {log.remark}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{
        marginTop: '14px',
        padding: '12px',
        borderRadius: '10px',
        background: '#f8f9ff',
        fontSize: '12px',
        lineHeight: 1.7,
        color: '#555'
      }}>
        <div style={{ fontWeight: 600, marginBottom: '8px', color: '#667eea' }}>
          🔗 业务链路说明
        </div>
        <div>
          <strong>真太阳时校准</strong>：出生地经度{userFormData?.longitude || 116.4}°E已参与排盘，
          当前真太阳时 <strong style={{ color: '#333' }}>
            {baziData?.trueSolarTime ? `${baziData.trueSolarTime.hour}时${baziData.trueSolarTime.minute}分` : '待计算'}
          </strong>。
        </div>
        <div>
          <strong>五行依据</strong>：日主、旺衰和宜补五行联动，
          建议补益 <strong style={{ color: '#1890ff' }}>{targetWuxing?.bu?.join('、') || '待计算'}</strong>，
          泄 <strong style={{ color: '#f5222d' }}>{targetWuxing?.xie?.join('、') || '待计算'}</strong>。
        </div>
        <div>
          <strong>生肖与2025流年冲合</strong>：
          生肖 <strong>{baziData?.shengxiao || '待计算'}</strong>，
          2025乙巳年关系 <strong>{liuNianData?.relation || '待计算'}</strong>，
          结论 <strong>{liuNianData?.jixiong || '待计算'}</strong>。
        </div>
        <div>
          <strong>重名率统计与声调可视化</strong>：
          候选名详情页展示重名率等级（公安脱敏接口）、发音节奏和声调可视化。
        </div>
        <div>
          <strong>可追溯闭环</strong>：
          输入资料 → 八字排盘 → 30个候选名生成 → 合规审查 → 名字排行 → 
          五格/卦象验证 → 命理师复核（可选项）→ PDF报告生成，全链路可核验。
        </div>
      </div>
    </div>
  );
}

export default App;
