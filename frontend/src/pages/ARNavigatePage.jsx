import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { voiceAPI, jobsAPI } from '../utils/api.js';

function ARNavigatePage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [navData, setNavData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    loadData();
  }, [jobId]);

  const loadData = async () => {
    try {
      const jobRes = await jobsAPI.get(jobId);
      setJob(jobRes.data);

      const navRes = await voiceAPI.arNavigate({ job_id: jobId, start_point: '当前位置' });
      setNavData(navRes.data);
    } catch (err) {
      console.error('加载失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (navData && navData.route && currentStep < navData.route.length) {
      const timer = setTimeout(() => {
        setCurrentStep(s => Math.min(s + 1, navData.route.length));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, navData]);

  const getDirectionArrow = (instruction) => {
    if (instruction.includes('左转')) return '↰';
    if (instruction.includes('右转')) return '↱';
    if (instruction.includes('直行')) return '↑';
    return '📍';
  };

  if (loading) return <div className="empty-state">正在加载AR导航...</div>;
  if (!job || !navData) return <div className="empty-state">加载失败</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '1rem' }}>🧭 AR实景导航</h1>

      <div className="sidebar-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4>🎯 目的地</h4>
            <p style={{ color: '#374151', fontSize: '1.05rem', marginTop: '0.3rem' }}>
              <strong>{job.company_name}</strong> - {job.title}
            </p>
            <p style={{ color: '#6b7280', marginTop: '0.3rem' }}>
              📍 {navData.end_point}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>
              {navData.duration}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>预计分钟</div>
          </div>
        </div>
      </div>

      <div className="ar-container">
        <div className="ar-overlay">
          <div className="ar-top">
            <div>
              <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>剩余距离</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {currentStep < navData.route.length
                  ? `${navData.route[currentStep]?.distance || 0}米`
                  : '已到达'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>预计到达</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {new Date(Date.now() + navData.duration * 60000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          <div>
            <div className="ar-direction" style={{ animation: 'pulse 2s infinite' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                {currentStep < navData.route.length
                  ? getDirectionArrow(navData.route[currentStep]?.instruction || '')
                  : '✅'}
              </div>
              {currentStep < navData.route.length
                ? navData.route[currentStep]?.instruction
                : '您已到达目的地'}
            </div>

            <div className="ar-arrows">
              <div className="ar-arrow">↰</div>
              <div className="ar-arrow" style={{ background: 'rgba(16,185,129,0.8)' }}>↑</div>
              <div className="ar-arrow">↱</div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', opacity: 0.9 }}>
              📍 沿途地标
            </div>
            {navData.ar_anchors && navData.ar_anchors.map((anchor, idx) => (
              <div
                key={idx}
                className={`ar-anchor ${anchor.type === 'destination' ? 'destination' : ''}`}
                style={{
                  opacity: idx < currentStep ? 0.5 : 1,
                  borderLeftColor: idx === currentStep ? '#f59e0b' : undefined
                }}
              >
                <strong>{anchor.type === 'sign' ? '🚦' : anchor.type === 'landmark' ? '🏢' : '🎯'}</strong>
                {' '}{anchor.content}
                {anchor.distance > 0 && <span style={{ opacity: 0.7 }}> ({anchor.distance}米)</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h3>📋 详细路线</h3>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>步骤</th>
              <th>导航指令</th>
              <th style={{ width: '100px' }}>距离</th>
              <th style={{ width: '100px' }}>状态</th>
            </tr>
          </thead>
          <tbody>
            {navData.route && navData.route.map((step, idx) => (
              <tr key={idx} style={{ background: idx === currentStep ? '#fef3c7' : idx < currentStep ? '#f9fafb' : 'white' }}>
                <td style={{ fontWeight: 'bold', color: idx <= currentStep ? '#10b981' : '#6b7280' }}>
                  {idx < currentStep ? '✓' : step.step}
                </td>
                <td>{step.instruction}</td>
                <td>{step.distance > 0 ? `${step.distance}米` : '-'}</td>
                <td>
                  {idx < currentStep ? (
                    <span className="status-badge active">已完成</span>
                  ) : idx === currentStep ? (
                    <span className="status-badge pending">进行中</span>
                  ) : (
                    <span className="status-badge">待前往</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <button className="btn btn-success" onClick={() => setCurrentStep(0)}>
          🔄 重新导航
        </button>
      </div>

      <div className="alert alert-warning" style={{ marginTop: '1.5rem', fontSize: '0.85rem' }}>
        <strong>💡 提示：</strong> 此为AR实景导航功能演示。在实际应用中，将调用手机摄像头和AR SDK，
        在真实场景上叠加导航箭头和地标信息，帮助您快速找到面试地点。
      </div>
    </div>
  );
}

export default ARNavigatePage;
