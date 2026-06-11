import React, { useState } from 'react';
import InputForm from './components/InputForm.jsx';
import NameList from './components/NameList.jsx';
import NameDetail from './components/NameDetail.jsx';
import BaziInfo from './components/BaziInfo.jsx';
import MasterReviewModal from './components/MasterReviewModal.jsx';

function App() {
  const [loading, setLoading] = useState(false);
  const [baziData, setBaziData] = useState(null);
  const [liuNianData, setLiuNianData] = useState(null);
  const [namesList, setNamesList] = useState([]);
  const [selectedName, setSelectedName] = useState(null);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [targetWuxing, setTargetWuxing] = useState(null);

  const handleSubmit = async (formData) => {
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
        setBaziData(result.data.bazi);
        setLiuNianData(result.data.liuNian2025);
        setNamesList(result.data.names.names);
        setTargetWuxing(result.data.names.targetWuxing);
        
        if (result.data.names.names.length > 0) {
          setSelectedName(result.data.names.names[0]);
        }
      } else {
        alert(result.message || '分析失败');
      }
    } catch (error) {
      console.error('请求失败:', error);
      alert('网络错误，请检查后端服务是否启动');
    } finally {
      setLoading(false);
    }
  };

  const handleNameSelect = (name) => {
    setSelectedName(name);
  };

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

export default App;
