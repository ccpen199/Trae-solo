import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Play, Upload, Mic } from 'lucide-react';
import { interviews, transcripts, speakers, topics, painPoints, evidence, summaries, workflow, upload } from '../api';
import PromptModal from '../components/Modal';

function InterviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [editData, setEditData] = useState({});
  const [modal, setModal] = useState({ isOpen: false, type: null, title: '', config: {} });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await interviews.getFull(id);
      setData(res.data);
      setEditData(res.data.interview);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleUpdateInterview = async () => {
    try {
      await interviews.update(id, editData);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const openTextModal = (type, title, placeholder, callback) => {
    setModal({
      isOpen: true,
      type,
      title,
      placeholder,
      inputType: 'text',
      callback
    });
  };

  const openTextareaModal = (type, title, placeholder, callback) => {
    setModal({
      isOpen: true,
      type,
      title,
      placeholder,
      inputType: 'textarea',
      callback
    });
  };

  const handleModalConfirm = async (value) => {
    const { callback } = modal;
    setModal({ ...modal, isOpen: false });
    if (callback) {
      await callback(value);
      loadData();
    }
  };

  const handleAddSpeaker = () => {
    openTextModal('speaker', '添加说话人', '请输入说话人姓名', async (name) => {
      await speakers.create(id, { name });
    });
  };

  const handleAddTranscript = () => {
    openTextareaModal('transcript', '添加转写文本', '请输入转写文本内容...', async (content) => {
      await transcripts.create(id, { content });
    });
  };

  const handleAddTopic = () => {
    openTextModal('topic', '添加主题', '请输入主题名称', async (name) => {
      await topics.create(id, { name, sentiment: 'neutral' });
    });
  };

  const [painPointStep, setPainPointStep] = useState(0);
  const [painPointData, setPainPointData] = useState({});

  const handleAddPainPoint = () => {
    setPainPointStep(1);
    openTextModal('painpoint_title', '添加痛点 - 标题', '请输入痛点标题', async (title) => {
      setPainPointData({ title });
      setTimeout(() => {
        openTextareaModal('painpoint_desc', '添加痛点 - 描述', '请输入痛点描述...', async (description) => {
          await painPoints.create(id, { 
            title: painPointData.title || title, 
            description, 
            severity: 'medium', 
            frequency: 'occasional' 
          });
          setPainPointStep(0);
          setPainPointData({});
        });
      }, 100);
    });
  };

  const handleAddEvidence = (painPointId) => {
    openTextareaModal('evidence', '添加证据引用', '请输入原文引用...', async (quote) => {
      await evidence.create(id, { pain_point_id: painPointId, quote });
    });
  };

  const handleAddSummary = (type) => {
    const typeNames = { executive: '执行摘要', detailed: '详细总结', action_items: '行动项' };
    openTextareaModal('summary', `添加${typeNames[type]}`, '请输入总结内容...', async (content) => {
      await summaries.create(id, { type, content });
    });
  };

  const handleGenerateWorkflow = () => {
    setConfirmModal({
      isOpen: true,
      title: '生成工作流任务',
      message: '确定要自动检测并生成工作流任务吗？',
      onConfirm: async () => {
        try {
          const res = await workflow.generate(id);
          alert(`成功生成 ${res.data.generated} 个任务`);
          loadData();
        } catch (err) {
          alert(err.message);
        }
      }
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: '待处理',
      transcribing: '转写中',
      transcribed: '已转写',
      reviewing: '审核中',
      clustering: '聚类中',
      summarizing: '总结中',
      completed: '已完成',
      archived: '已归档'
    };
    return labels[status] || status;
  };

  const formatDate = (ts) => {
    if (!ts) return '-';
    return new Date(ts * 1000).toLocaleString('zh-CN');
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (!data) {
    return <div className="empty-state">访谈不存在</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2>{data.interview.title}</h2>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', color: '#718096', fontSize: '14px' }}>
              <span>版本: v{data.interview.version}</span>
              <span>创建于: {formatDate(data.interview.created_at)}</span>
              <span className={`badge badge-${data.interview.status}`}>
                {getStatusLabel(data.interview.status)}
              </span>
            </div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleUpdateInterview}>
          <Save size={16} />
          保存更改
        </button>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>概览</button>
        <button className={`tab ${activeTab === 'transcript' ? 'active' : ''}`} onClick={() => setActiveTab('transcript')}>转写文本</button>
        <button className={`tab ${activeTab === 'speakers' ? 'active' : ''}`} onClick={() => setActiveTab('speakers')}>说话人</button>
        <button className={`tab ${activeTab === 'topics' ? 'active' : ''}`} onClick={() => setActiveTab('topics')}>主题聚类</button>
        <button className={`tab ${activeTab === 'painpoints' ? 'active' : ''}`} onClick={() => setActiveTab('painpoints')}>痛点分析</button>
        <button className={`tab ${activeTab === 'evidence' ? 'active' : ''}`} onClick={() => setActiveTab('evidence')}>证据库</button>
        <button className={`tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>总结</button>
        <button className={`tab ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>变更记录</button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <h3>基本信息</h3>
            </div>
            <div className="form-group">
              <label>访谈标题</label>
              <input 
                value={editData.title || ''}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>被访谈者</label>
                <input 
                  value={editData.interviewee_name || ''}
                  onChange={(e) => setEditData({ ...editData, interviewee_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>角色</label>
                <input 
                  value={editData.interviewee_role || ''}
                  onChange={(e) => setEditData({ ...editData, interviewee_role: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>状态</label>
              <select 
                value={editData.status || ''}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
              >
                <option value="pending">待处理</option>
                <option value="transcribing">转写中</option>
                <option value="transcribed">已转写</option>
                <option value="reviewing">审核中</option>
                <option value="clustering">聚类中</option>
                <option value="summarizing">总结中</option>
                <option value="completed">已完成</option>
                <option value="archived">已归档</option>
              </select>
            </div>
            <div className="form-group">
              <label>描述</label>
              <textarea 
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>数据统计</h3>
            </div>
            <div className="grid-2" style={{ gap: '16px' }}>
              <div className="stat-card">
                <div className="stat-value">{data.transcript?.segments?.length || 0}</div>
                <div className="stat-label">转写片段</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{data.speakers?.length || 0}</div>
                <div className="stat-label">说话人数量</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{data.topics?.length || 0}</div>
                <div className="stat-label">主题数量</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{data.painPoints?.length || 0}</div>
                <div className="stat-label">识别痛点</div>
              </div>
            </div>
            
            <div style={{ marginTop: '24px' }}>
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleGenerateWorkflow}>
                <Play size={16} />
                生成工作流检测任务
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transcript' && (
        <TranscriptTab 
          data={data} 
          interviewId={id} 
          onAddTranscript={handleAddTranscript}
          onRefresh={loadData}
        />
      )}

      {activeTab === 'speakers' && (
        <div className="card">
          <div className="card-header">
            <h3>说话人管理</h3>
            <button className="btn btn-primary btn-sm" onClick={handleAddSpeaker}>
              <Plus size={14} /> 添加说话人
            </button>
          </div>
          {data.speakers?.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-title">暂无说话人</div>
              <div>添加说话人以便标记转写内容</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>标签</th>
                  <th>姓名</th>
                  <th>角色</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {data.speakers.map(speaker => (
                  <tr key={speaker.id}>
                    <td>
                      <span className="speaker-tag" style={{ background: speaker.color }}>
                        {speaker.name?.charAt(0)}
                      </span>
                    </td>
                    <td>{speaker.name}</td>
                    <td>{speaker.role || '-'}</td>
                    <td>
                      <button className="btn btn-sm btn-secondary">编辑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'topics' && (
        <div className="card">
          <div className="card-header">
            <h3>主题聚类</h3>
            <button className="btn btn-primary btn-sm" onClick={handleAddTopic}>
              <Plus size={14} /> 添加主题
            </button>
          </div>
          {data.topics?.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏷️</div>
              <div className="empty-state-title">暂无主题</div>
              <div>添加或自动聚类访谈主题</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {data.topics.map(topic => (
                <div key={topic.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4>{topic.name}</h4>
                    <span className={`badge badge-${topic.sentiment}`}>{topic.sentiment}</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#718096' }}>{topic.description || '暂无描述'}</p>
                  {topic.keywords && (
                    <div style={{ marginTop: '12px' }}>
                      {topic.keywords.split(',').map((kw, i) => (
                        <span key={i} className="tag">{kw.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'painpoints' && (
        <div className="card">
          <div className="card-header">
            <h3>痛点分析</h3>
            <button className="btn btn-primary btn-sm" onClick={handleAddPainPoint}>
              <Plus size={14} /> 添加痛点
            </button>
          </div>
          {data.painPoints?.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⚠️</div>
              <div className="empty-state-title">暂无痛点识别</div>
              <div>从转写文本中识别用户痛点</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.painPoints.map(pp => (
                <div key={pp.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4>{pp.title}</h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span className={`badge badge-${pp.severity}`}>{pp.severity}</span>
                      <span className={`badge badge-${pp.status}`}>{pp.status}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '14px', color: '#4a5568', marginBottom: '12px' }}>{pp.description}</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleAddEvidence(pp.id)}
                    >
                      <Plus size={12} /> 添加证据
                    </button>
                    <span style={{ fontSize: '12px', color: '#a0aec0', alignSelf: 'center' }}>
                      证据数: {data.evidence?.filter(e => e.pain_point_id === pp.id).length || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'evidence' && (
        <div className="card">
          <div className="card-header">
            <h3>证据库</h3>
          </div>
          {data.evidence?.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📑</div>
              <div className="empty-state-title">暂无证据引用</div>
              <div>在痛点分析中添加原文引用作为证据</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.evidence.map(ev => (
                <div key={ev.id} style={{ padding: '16px', background: '#f7fafc', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#718096' }}>
                      关联痛点: {data.painPoints?.find(p => p.id === ev.pain_point_id)?.title || '未关联'}
                    </span>
                    <span className={`badge ${ev.verified ? 'badge-completed' : 'badge-pending'}`}>
                      {ev.verified ? '已验证' : '待验证'}
                    </span>
                  </div>
                  <blockquote style={{ 
                    borderLeft: '3px solid #4299e1', 
                    paddingLeft: '12px', 
                    fontStyle: 'italic',
                    color: '#2d3748'
                  }}>
                    "{ev.quote}"
                  </blockquote>
                  {ev.context && (
                    <p style={{ fontSize: '13px', color: '#718096', marginTop: '8px' }}>
                      上下文: {ev.context}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'summary' && (
        <div>
          <div className="card">
            <div className="card-header">
              <h3>执行摘要</h3>
              <button className="btn btn-primary btn-sm" onClick={() => handleAddSummary('executive')}>
                <Plus size={14} /> 生成
              </button>
            </div>
            {data.summaries?.filter(s => s.type === 'executive').length === 0 ? (
              <div className="empty-state" style={{ padding: '40px' }}>
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">暂无执行摘要</div>
              </div>
            ) : (
              data.summaries.filter(s => s.type === 'executive').map(s => (
                <div key={s.id}>
                  <div style={{ marginBottom: '8px', fontSize: '12px', color: '#718096' }}>
                    版本 v{s.version} · {formatDate(s.created_at)}
                  </div>
                  <p style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{s.content}</p>
                </div>
              ))
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <h3>详细总结</h3>
              <button className="btn btn-primary btn-sm" onClick={() => handleAddSummary('detailed')}>
                <Plus size={14} /> 生成
              </button>
            </div>
            {data.summaries?.filter(s => s.type === 'detailed').length === 0 ? (
              <div className="empty-state" style={{ padding: '40px' }}>
                <div className="empty-state-icon">📄</div>
                <div className="empty-state-title">暂无详细总结</div>
              </div>
            ) : (
              data.summaries.filter(s => s.type === 'detailed').map(s => (
                <div key={s.id}>
                  <p style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{s.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <AuditLog interviewId={id} />
      )}

      <PromptModal
        isOpen={modal.isOpen}
        title={modal.title}
        placeholder={modal.placeholder}
        type={modal.inputType === 'textarea' ? 'textarea' : 'text'}
        onClose={() => setModal({ ...modal, isOpen: false })}
        onConfirm={handleModalConfirm}
      />

      <PromptModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type="confirm"
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={() => {
          if (confirmModal.onConfirm) confirmModal.onConfirm();
          setConfirmModal({ ...confirmModal, isOpen: false });
        }}
      />
    </div>
  );
}

function AuditLog({ interviewId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [interviewId]);

  const loadLogs = async () => {
    try {
      const res = await interviews.getAudit(interviewId);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>变更记录</h3>
      </div>
      <div className="timeline">
        {logs.map(log => (
          <div key={log.id} className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-time">{new Date(log.created_at * 1000).toLocaleString('zh-CN')}</div>
            <div className="timeline-title">{log.actor_name} - {log.change_reason}</div>
            <div className="timeline-desc">
              操作: {log.action_type} · 对象: {log.object_type}
              {log.recovery_path && (
                <span style={{ marginLeft: '12px' }}>
                  <button className="btn btn-sm btn-secondary">恢复</button>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TranscriptTab({ data, interviewId, onAddTranscript, onRefresh }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/aac', 'audio/ogg', 'audio/webm', 'video/mp4'];
    const validExts = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.mp4', '.webm'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      alert('请上传有效的音频文件 (mp3, wav, m4a, aac, ogg, mp4, webm)');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadMessage('正在上传...');

    try {
      const res = await upload.audio(interviewId, file, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      setUploadMessage(res.data.message);
      setUploadProgress(100);
      
      setTimeout(() => {
        setUploading(false);
        setUploadMessage('');
        setUploadProgress(0);
        if (onRefresh) onRefresh();
      }, 5000);

    } catch (err) {
      setUploading(false);
      setUploadProgress(0);
      setUploadMessage('');
      alert('上传失败: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const hasSegments = data.transcript?.segments?.length > 0;

  return (
    <div className="card">
      <div className="card-header">
        <h3>音频转写系统</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {data.transcript?.confidence && (
            <span className="badge badge-completed">
              置信度: {Math.round(data.transcript.confidence * 100)}%
            </span>
          )}
          <button className="btn btn-primary btn-sm" onClick={onAddTranscript}>
            <Plus size={14} /> 手动输入
          </button>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload size={14} /> {data.transcript ? '重新上传' : '上传音频'}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,.m4a,.aac,.ogg,.mp4,.webm,audio/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {uploading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ marginBottom: '16px' }}>
            <Mic size={48} style={{ color: '#4299e1', margin: '0 auto 16px' }} />
            <div>{uploadMessage}</div>
          </div>
          <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
            <div 
              style={{ 
                height: '100%', 
                background: '#4299e1', 
                width: `${uploadProgress}%`,
                transition: 'width 0.3s'
              }}
            />
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#718096' }}>
            {uploadProgress}%
          </div>
        </div>
      ) : data.transcript ? (
        <div>
          <div style={{ 
            marginBottom: '16px', 
            padding: '16px', 
            background: '#f7fafc', 
            borderRadius: '8px',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            <p style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{data.transcript.content}</p>
          </div>

          {hasSegments && (
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ marginBottom: '16px' }}>片段列表</h4>
              {data.transcript.segments.map((seg, idx) => (
                <div key={idx} className="segment-item">
                  <div className="segment-speaker">
                    <span className="speaker-tag" style={{ background: data.speakers?.find(s => s.id === seg.speaker_id)?.color || '#a0aec0' }}>
                      {data.speakers?.find(s => s.id === seg.speaker_id)?.name || '未知'}
                    </span>
                  </div>
                  <div className="segment-content">
                    <div className="segment-time">{seg.start_time.toFixed(1)}s - {seg.end_time.toFixed(1)}s</div>
                    <div className="segment-text">{seg.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!hasSegments && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#718096', fontSize: '14px' }}>
              <p>💡 当前转写内容为手动输入，上传音频可自动生成带时间轴的分段转写</p>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '60px 20px',
            border: '2px dashed #cbd5e0',
            borderRadius: '12px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = '#4299e1';
            e.currentTarget.style.background = '#ebf8ff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e0';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <Mic size={48} style={{ color: '#a0aec0', margin: '0 auto 16px' }} />
          <div className="empty-state-title">点击或拖拽上传音频文件</div>
          <div style={{ color: '#718096', fontSize: '14px', marginTop: '8px' }}>
            支持 MP3, WAV, M4A, AAC, OGG, MP4, WebM 格式
          </div>
          <div style={{ color: '#a0aec0', fontSize: '12px', marginTop: '4px' }}>
            上传后将自动进行语音转写，生成带时间轴的分段文本
          </div>
        </div>
      )}
    </div>
  );
}

export default InterviewDetail;
