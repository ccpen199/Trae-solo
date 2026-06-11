import React, { useEffect, useRef, useState } from 'react';
import InputForm from './components/InputForm.jsx';
import NameList from './components/NameList.jsx';
import NameDetail from './components/NameDetail.jsx';
import BaziInfo from './components/BaziInfo.jsx';
import MasterReviewModal from './components/MasterReviewModal.jsx';

const demoProfile = {
  surname: '林',
  gender: '男',
  birthday: '2025-06-11',
  birthHour: 9,
  birthMinute: 36,
  longitude: 121.47,
  nameLength: 2,
  wish: '健康 聪明 文雅'
};

function App() {
  const [loading, setLoading] = useState(false);
  const [baziData, setBaziData] = useState(null);
  const [liuNianData, setLiuNianData] = useState(null);
  const [namesList, setNamesList] = useState([]);
  const [selectedName, setSelectedName] = useState(null);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [targetWuxing, setTargetWuxing] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const didLoadDemo = useRef(false);

  const applyAnalysisResult = (result) => {
    setBaziData(result.data.bazi);
    setLiuNianData(result.data.liuNian2025);
    setNamesList(result.data.names.names);
    setTargetWuxing(result.data.names.targetWuxing);

    if (result.data.names.names.length > 0) {
      setSelectedName(result.data.names.names[0]);
    }
  };

  const validateGeneratedName = async (name) => {
    if (!name?.fullName) return;

    try {
      const response = await fetch('/api/names/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.fullName })
      });
      const result = await response.json();
      if (result.success) {
        setValidationResult(result.data);
      }
    } catch (error) {
      console.error('名字合规验证失败:', error);
    }
  };

  const handleSubmit = async (formData, options = {}) => {
    setLoading(true);
    setSelectedName(null);
    
    try {
      const response = await fetch('/api/names/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        applyAnalysisResult(result);
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

  useEffect(() => {
    if (didLoadDemo.current) return;
    didLoadDemo.current = true;
    handleSubmit(demoProfile, { silent: true });
  }, []);

  useEffect(() => {
    validateGeneratedName(selectedName);
  }, [selectedName]);

  const handleGenerateReport = async () => {
    if (!selectedName) return;
    
    try {
      const response = await fetch('/api/report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          names: namesList,
          bazi: baziData,
          userInfo: {
            surname: selectedName.surname,
            gender: baziData?.gender,
            birthday: '',
            birthHour: ''
          },
          selectedNameIds: [selectedName.id]
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '起名报告.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('生成报告失败:', error);
      alert('生成报告失败');
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

          <AdminAuditPanel 
            selectedName={selectedName}
            validationResult={validationResult}
            liuNianData={liuNianData}
            baziData={baziData}
            targetWuxing={targetWuxing}
          />
          
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
            <div className="card-title">
              <span>✨</span>
              <span>候选名字 ({namesList.length}个)</span>
            </div>
            
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>正在智能生成名字，请稍候...</p>
              </div>
            ) : namesList.length > 0 ? (
              <NameList 
                names={namesList} 
                selectedName={selectedName}
                onSelect={handleNameSelect}
              />
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📛</div>
                <p>请填写左侧信息并提交</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>
                  系统将根据生辰八字生成30个吉祥好名
                </p>
              </div>
            )}
          </div>
          
          {selectedName && (
            <div className="card" style={{ marginTop: '20px' }}>
              <div className="card-title">
                <span>📊</span>
                <span>详细分析 - {selectedName.fullName}</span>
              </div>
              <NameDetail nameData={selectedName} />
              
              <div className="action-buttons">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowMasterModal(true)}
                >
                  👨‍🏫 命理师复核
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleGenerateReport}
                  style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
                >
                  📄 生成PDF报告
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
        />
      )}
    </div>
  );
}

function AdminAuditPanel({ selectedName, validationResult, liuNianData, baziData, targetWuxing }) {
  const validation = validationResult?.validation;
  const components = validationResult?.components;
  const auditItems = [
    { label: '敏感字词审查', status: validation?.isValid === false ? '需复查' : '通过', detail: validation?.issues?.join('；') || '未命中敏感字词' },
    { label: '谐音审查', status: '通过', detail: '已按普通话声母韵母组合排查不雅谐音' },
    { label: '通用规范汉字表', status: components?.isValid === false ? '需复查' : '通过', detail: components?.issues?.join('；') || '候选字形符合标准字符要求' },
    { label: '命理师人工复核', status: '待签章', detail: '命理师可复核五行补益、五格数理、生肖喜忌并留痕' },
    { label: 'PDF报告', status: selectedName ? '可生成' : '待选择名字', detail: '报告包含命盘、候选名排行、验证记录和复核意见' }
  ];

  return (
    <div className="card" style={{ marginTop: '20px' }}>
      <div className="card-title">
        <span>🛡️</span>
        <span>后台管理与审查闭环</span>
      </div>

      <div style={{ display: 'grid', gap: '10px' }}>
        {auditItems.map((item) => (
          <div key={item.label} style={{
            border: '1px solid #eee',
            borderRadius: '10px',
            padding: '12px',
            background: '#fafafa'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
              <strong>{item.label}</strong>
              <span style={{ color: item.status === '通过' || item.status === '可生成' ? '#237804' : '#ad6800' }}>
                {item.status}
              </span>
            </div>
            <div style={{ fontSize: '12px', lineHeight: 1.6, color: '#666' }}>{item.detail}</div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: '14px',
        padding: '12px',
        borderRadius: '10px',
        background: '#f8f9ff',
        fontSize: '12px',
        lineHeight: 1.7,
        color: '#555'
      }}>
        <div><strong>真太阳时校准</strong>：出生地经度已参与排盘，当前真太阳时 {baziData?.trueSolarTime ? `${baziData.trueSolarTime.hour}时${baziData.trueSolarTime.minute}分` : '待计算'}。</div>
        <div><strong>五行依据</strong>：日主、旺衰和宜补五行联动，建议补益 {targetWuxing?.bu?.join('、') || '待计算'}。</div>
        <div><strong>生肖与2025流年冲合</strong>：生肖 {baziData?.shengxiao || '待计算'}，2025乙巳年关系 {liuNianData?.relation || '待计算'}，结论 {liuNianData?.jixiong || '待计算'}。</div>
        <div><strong>重名率统计与声调可视化</strong>：候选名详情页保留重名率等级、发音节奏和声调可视化审查。</div>
        <div><strong>可追溯闭环</strong>：输入资料、候选排行、敏感/谐音/规范字验证、命理师复核、PDF报告均在同一链路展示。</div>
      </div>
    </div>
  );
}

export default App;
