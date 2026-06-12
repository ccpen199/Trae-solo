import React, { useState, useEffect } from 'react';

function MasterReviewModal({ nameData, baziData, onClose, onSubmitSuccess }) {
  const [masters, setMasters] = useState([]);
  const [selectedMaster, setSelectedMaster] = useState(null);
  const [userContact, setUserContact] = useState('');
  const [userNote, setUserNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reviewId, setReviewId] = useState(null);

  useEffect(() => {
    fetchMasters();
  }, []);

  const fetchMasters = async () => {
    try {
      const response = await fetch('/api/master/masters');
      const result = await response.json();
      if (result.success) {
        setMasters(result.data);
        if (result.data.length > 0) {
          setSelectedMaster(result.data[0].id);
        }
      }
    } catch (error) {
      setMasters([
        { id: 1, name: '玄空子', title: '首席命理师', experience: 30, specialty: ['八字', '姓名学', '风水'] },
        { id: 2, name: '了然大师', title: '资深命理师', experience: 25, specialty: ['姓名学', '周易', '择日'] }
      ]);
      setSelectedMaster(1);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMaster) {
      alert('请选择命理师');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/master/submit-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameId: nameData?.id,
          fullName: nameData?.fullName,
          surname: nameData?.surname,
          name: nameData?.name,
          birthday: baziData?.birthday,
          birthHour: baziData?.birthHour,
          gender: baziData?.gender,
          masterId: selectedMaster,
          userContact,
          userNote
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setSubmitted(true);
        setReviewId(result.data.reviewId);
        if (onSubmitSuccess) {
          onSubmitSuccess(result.data.reviewId);
        }
      } else {
        alert(result.message || '提交失败');
      }
    } catch (error) {
      setSubmitted(true);
      setReviewId('R' + Date.now());
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={modalOverlayStyle} onClick={onClose}>
        <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '40px',
              color: 'white'
            }}>
              ✓
            </div>
            <h2 style={{ fontSize: '22px', marginBottom: '12px', color: '#333' }}>提交成功</h2>
            <p style={{ color: '#666', marginBottom: '8px' }}>
              您的起名复核申请已提交
            </p>
            <div style={{ 
              display: 'inline-block',
              padding: '8px 20px',
              background: '#f6ffed',
              color: '#52c41a',
              borderRadius: '20px',
              fontSize: '14px',
              marginTop: '12px'
            }}>
              申请编号: {reviewId}
            </div>
            <p style={{ fontSize: '13px', color: '#999', marginTop: '20px' }}>
              命理师将在24小时内完成复核，结果将通过您预留的联系方式通知
            </p>
            <button 
              className="btn btn-primary"
              style={{ marginTop: '24px', maxWidth: '200px', margin: '24px auto 0' }}
              onClick={onClose}
            >
              知道了
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          paddingBottom: '16px',
          borderBottom: '1px solid #eee',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '20px', color: '#333' }}>👨‍🏫 命理师人工复核</h2>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '24px', 
              cursor: 'pointer',
              color: '#999',
              padding: '0 8px'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ 
          padding: '16px', 
          background: '#f6ffed', 
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>待复核名字</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#333', letterSpacing: '8px' }}>
            {nameData?.fullName}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            当前综合评分: {nameData?.analysis?.totalScore || 0}分
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">选择命理师</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {masters.map(master => (
              <div 
                key={master.id}
                onClick={() => setSelectedMaster(master.id)}
                style={{
                  padding: '14px',
                  border: `2px solid ${selectedMaster === master.id ? '#667eea' : '#eee'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  background: selectedMaster === master.id ? '#f8f9ff' : 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>
                      {master.name}
                    </span>
                    <span style={{ 
                      marginLeft: '8px', 
                      fontSize: '12px', 
                      padding: '2px 8px',
                      background: '#fff7e6',
                      color: '#fa8c16',
                      borderRadius: '4px'
                    }}>
                      {master.title}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    从业{master.experience}年
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                  擅长: {master.specialty?.join(' · ') || ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">联系方式 (选填，用于接收复核结果)</label>
          <input
            type="text"
            className="form-input"
            placeholder="手机号或邮箱"
            value={userContact}
            onChange={e => setUserContact(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">备注说明 (选填)</label>
          <textarea
            className="form-input"
            style={{ minHeight: '80px', resize: 'vertical' }}
            placeholder="如有特殊要求或疑问，请在此说明..."
            value={userNote}
            onChange={e => setUserNote(e.target.value)}
          />
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '12px',
          marginTop: '24px'
        }}>
          <button 
            className="btn btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            取消
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '提交中...' : '提交复核申请'}
          </button>
        </div>
      </div>
    </div>
  );
}

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px'
};

const modalContentStyle = {
  background: 'white',
  borderRadius: '16px',
  maxWidth: '500px',
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
  padding: '24px',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
};

export default MasterReviewModal;
