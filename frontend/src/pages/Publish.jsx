import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workAPI, CREATOR_ID } from '../utils/api.js';

const Publish = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    cover_url: '',
    video_url: '',
    type: 'video',
    topics: '',
    copyright_declaration: '原创',
    scheduled_at: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedWork, setSavedWork] = useState(null);

  useEffect(() => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = '请输入标题';
    } else if (formData.title.trim().length < 5) {
      errors.title = '标题至少需要5个字符';
    } else if (formData.title.trim().length > 50) {
      errors.title = '标题不能超过50个字符';
    }

    if (formData.type === 'video') {
      if (!formData.video_url.trim()) {
        errors.video_url = '请输入视频链接';
      } else if (!formData.video_url.startsWith('http')) {
        errors.video_url = '请输入有效的URL地址';
      }
    }

    if (!formData.cover_url.trim()) {
      errors.cover_url = '请上传封面图片';
    } else if (!formData.cover_url.startsWith('http')) {
      errors.cover_url = '请输入有效的封面URL';
    }

    if (!formData.content.trim()) {
      errors.content = formData.type === 'video' ? '请输入视频简介' : '请输入正文内容';
    } else if (formData.content.trim().length < 10) {
      errors.content = formData.type === 'video' ? '简介至少需要10个字符' : '正文至少需要10个字符';
    }

    if (!formData.topics.trim()) {
      errors.topics = '请至少添加一个话题标签';
    }

    if (formData.copyright_declaration === 'authorized' && !formData.content.includes('授权')) {
      errors.copyright = '授权转载请在内容中注明授权来源';
    }

    setValidationErrors(errors);
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const validateForm = (forSubmit = true) => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = '请输入标题';
    } else if (formData.title.trim().length < 5) {
      errors.title = '标题至少需要5个字符';
    }

    if (forSubmit) {
      if (formData.type === 'video' && !formData.video_url.trim()) {
        errors.video_url = '请输入视频链接';
      }

      if (!formData.cover_url.trim()) {
        errors.cover_url = '请上传封面图片';
      }

      if (!formData.content.trim()) {
        errors.content = formData.type === 'video' ? '请输入视频简介' : '请输入正文内容';
      }

      if (!formData.topics.trim()) {
        errors.topics = '请至少添加一个话题标签';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(true)) {
      showFeedback('error', '请完善必填项后再提交');
      return;
    }
    
    setSubmitting(true);
    setActionType('submit');
    
    try {
      const res = await workAPI.create({
        ...formData,
        creator_id: CREATOR_ID,
      });
      
      setSavedWork(res.data);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Failed to submit:', error);
      const errorMsg = error.response?.data?.error || '提交失败，请稍后重试';
      showFeedback('error', errorMsg);
    } finally {
      setSubmitting(false);
      setActionType(null);
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.title.trim()) {
      showFeedback('error', '请先输入标题再保存草稿');
      return;
    }
    
    setSubmitting(true);
    setActionType('draft');
    
    try {
      const res = await workAPI.create({
        ...formData,
        creator_id: CREATOR_ID,
        status: 'draft',
      });
      
      setSavedWork(res.data);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Failed to save draft:', error);
      const errorMsg = error.response?.data?.error || '保存失败，请稍后重试';
      showFeedback('error', errorMsg);
    } finally {
      setSubmitting(false);
      setActionType(null);
    }
  };

  const handleCancel = () => {
    if (formData.title.trim() || formData.content.trim()) {
      if (confirm('您有未保存的内容，确定要离开吗？')) {
        navigate('/works');
      }
    } else {
      navigate('/works');
    }
  };

  const getValidationStatus = () => {
    const required = [
      { key: 'title', label: '标题' },
      { key: formData.type === 'video' ? 'video_url' : 'content', label: formData.type === 'video' ? '视频链接' : '正文' },
      { key: 'cover_url', label: '封面图片' },
      { key: 'content', label: formData.type === 'video' ? '视频简介' : '正文内容' },
      { key: 'topics', label: '话题标签' },
      { key: 'copyright_declaration', label: '版权声明' },
    ];

    const completed = required.filter(item => {
      if (item.key === 'copyright_declaration') return true;
      return formData[item.key]?.trim();
    });

    return {
      completed: completed.length,
      total: required.length,
      percentage: Math.round((completed.length / required.length) * 100),
    };
  };

  const validationStatus = getValidationStatus();

  return (
    <div>
      <div className="page-header">
        <h2>发布内容</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="text-muted" style={{ fontSize: '13px' }}>完成度：</span>
            <div style={{ width: '120px', height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${validationStatus.percentage}%`, 
                  height: '100%', 
                  background: validationStatus.percentage === 100 ? '#52c41a' : '#1890ff',
                  transition: 'width 0.3s'
                }}
              ></div>
            </div>
            <span style={{ fontSize: '13px', color: validationStatus.percentage === 100 ? '#52c41a' : '#1890ff' }}>
              {validationStatus.percentage}%
            </span>
          </div>
          <span className="status-badge status-draft">草稿状态</span>
        </div>
      </div>
      <div className="page-content">
        {feedback && (
          <div 
            className="card" 
            style={{ 
              marginBottom: '16px', 
              padding: '12px 20px',
              background: feedback.type === 'success' ? '#f6ffed' : '#fff1f0',
              border: `1px solid ${feedback.type === 'success' ? '#b7eb8f' : '#ffa39e'}`,
              color: feedback.type === 'success' ? '#389e0d' : '#cf1322'
            }}
          >
            {feedback.message}
          </div>
        )}
        
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 0 }}>
            <div className="form-group">
              <label className="form-label">内容类型</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="type"
                    value="video"
                    checked={formData.type === 'video'}
                    onChange={(e) => handleChange('type', e.target.value)}
                    disabled={submitting}
                  />
                  视频
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="type"
                    value="article"
                    checked={formData.type === 'article'}
                    onChange={(e) => handleChange('type', e.target.value)}
                    disabled={submitting}
                  />
                  图文
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                标题 * 
                <span className="text-muted" style={{ fontSize: '12px', marginLeft: '8px' }}>（{formData.title.length}/50）</span>
                {validationErrors.title && <span className="text-danger" style={{ marginLeft: '8px' }}>⚠️ {validationErrors.title}</span>}
              </label>
              <input
                type="text"
                className={`form-input ${validationErrors.title ? 'form-input-error' : ''}`}
                placeholder="请输入标题（建议15-30字）"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                maxLength={50}
                disabled={submitting}
                style={validationErrors.title ? { borderColor: '#ff4d4f' } : {}}
              />
            </div>

            {formData.type === 'video' && (
              <div className="form-group">
                <label className="form-label">
                  视频链接 *
                  {validationErrors.video_url && <span className="text-danger" style={{ marginLeft: '8px' }}>⚠️ {validationErrors.video_url}</span>}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="请输入视频URL（支持mp4、mov等格式）"
                  value={formData.video_url}
                  onChange={(e) => handleChange('video_url', e.target.value)}
                  disabled={submitting}
                  style={validationErrors.video_url ? { borderColor: '#ff4d4f' } : {}}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                封面图片 *
                {validationErrors.cover_url && <span className="text-danger" style={{ marginLeft: '8px' }}>⚠️ {validationErrors.cover_url}</span>}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="请输入封面图片URL"
                value={formData.cover_url}
                onChange={(e) => handleChange('cover_url', e.target.value)}
                disabled={submitting}
                style={validationErrors.cover_url ? { borderColor: '#ff4d4f' } : {}}
              />
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                建议尺寸：16:9 或 4:3，支持 JPG、PNG 格式
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                {formData.type === 'video' ? '视频简介' : '正文内容'} *
                {validationErrors.content && <span className="text-danger" style={{ marginLeft: '8px' }}>⚠️ {validationErrors.content}</span>}
              </label>
              <textarea
                className="form-textarea"
                placeholder={formData.type === 'video' ? '请输入视频简介，让观众快速了解内容...' : '请输入文章正文...'}
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                disabled={submitting}
                style={validationErrors.content ? { borderColor: '#ff4d4f' } : {}}
              />
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px', textAlign: 'right' }}>
                {formData.content.length} 字
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  话题标签 *
                  {validationErrors.topics && <span className="text-danger" style={{ marginLeft: '8px' }}>⚠️ {validationErrors.topics}</span>}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="多个话题用逗号分隔，如：创作技巧,短视频"
                  value={formData.topics}
                  onChange={(e) => handleChange('topics', e.target.value)}
                  disabled={submitting}
                  style={validationErrors.topics ? { borderColor: '#ff4d4f' } : {}}
                />
                {formData.topics && (
                  <div className="tags" style={{ marginTop: '8px' }}>
                    {formData.topics.split(',').filter(t => t.trim()).map((t, i) => (
                      <span key={i} className="tag">#{t.trim()}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">版权声明 *</label>
                <select
                  className="form-select"
                  value={formData.copyright_declaration}
                  onChange={(e) => handleChange('copyright_declaration', e.target.value)}
                  disabled={submitting}
                >
                  <option value="原创">原创作品</option>
                  <option value="authorized">授权转载</option>
                  <option value="mixed">混合创作（含引用）</option>
                </select>
                {formData.copyright_declaration !== '原创' && (
                  <div style={{ fontSize: '12px', color: '#fa8c16', marginTop: '4px' }}>
                    ⚠️ 请确保已获得合法授权，违规内容将被下架
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">定时发布</label>
              <input
                type="datetime-local"
                className="form-input"
                value={formData.scheduled_at}
                onChange={(e) => handleChange('scheduled_at', e.target.value)}
                disabled={submitting}
              />
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                {formData.scheduled_at ? `将于 ${formData.scheduled_at} 自动发布（审核通过后）` : '不设置则审核通过后立即发布'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={submitting || Object.keys(validationErrors).length > 0}
              >
                {submitting && actionType === 'submit' ? '提交中...' : '提交审核'}
              </button>
              <button 
                type="button" 
                className="btn btn-default" 
                onClick={handleSaveDraft}
                disabled={submitting}
              >
                {submitting && actionType === 'draft' ? '保存中...' : '保存草稿'}
              </button>
              <button 
                type="button" 
                className="btn btn-default" 
                onClick={handleCancel}
                disabled={submitting}
              >
                取消
              </button>
            </div>
          </form>

          <div>
            <div className="card" style={{ background: '#fff7e6', border: '1px solid #ffd591', marginBottom: '16px' }}>
              <h3 className="card-title" style={{ marginBottom: '12px', color: '#fa8c16' }}>📋 发布须知</h3>
              <div style={{ fontSize: '13px', lineHeight: '1.8', color: '#595959' }}>
                <div>• 提交后将进入审核队列</div>
                <div>• 审核周期通常为 1-2 小时</div>
                <div>• 审核通过后自动发布</div>
                <div>• 未通过审核的作品可修改后重新提交</div>
                <div>• 违规内容将被驳回并记录</div>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '12px' }}>📝 必填项检查</h3>
              <div style={{ fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span>标题</span>
                  <span className={formData.title.trim() ? 'text-success' : 'text-danger'}>
                    {formData.title.trim() ? '✅ 已填写' : '❌ 未填写'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span>{formData.type === 'video' ? '视频链接' : '正文'}</span>
                  <span className={(formData.type === 'video' ? formData.video_url : formData.content).trim() ? 'text-success' : 'text-danger'}>
                    {(formData.type === 'video' ? formData.video_url : formData.content).trim() ? '✅ 已填写' : '❌ 未填写'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span>封面图片</span>
                  <span className={formData.cover_url.trim() ? 'text-success' : 'text-danger'}>
                    {formData.cover_url.trim() ? '✅ 已填写' : '❌ 未填写'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span>{formData.type === 'video' ? '视频简介' : '正文内容'}</span>
                  <span className={formData.content.trim() ? 'text-success' : 'text-danger'}>
                    {formData.content.trim() ? '✅ 已填写' : '❌ 未填写'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span>话题标签</span>
                  <span className={formData.topics.trim() ? 'text-success' : 'text-danger'}>
                    {formData.topics.trim() ? '✅ 已填写' : '❌ 未填写'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span>版权声明</span>
                  <span className="text-success">✅ 已选择</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ background: '#fafafa' }}>
              <h3 className="card-title" style={{ marginBottom: '12px' }}>🔄 状态流转</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#bfbfbf', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>1</div>
                  <span>编辑内容（草稿状态）</span>
                </div>
                <div style={{ width: '2px', height: '16px', background: '#d9d9d9', marginLeft: '11px' }}></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#fa8c16', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>2</div>
                  <span>提交审核（审核中）</span>
                </div>
                <div style={{ width: '2px', height: '16px', background: '#d9d9d9', marginLeft: '11px' }}></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#52c41a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>3</div>
                  <span>审核通过（已发布）</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSuccessModal && savedWork && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {savedWork.status === 'draft' ? '✅ 草稿已保存' : '✅ 已提交审核'}
              </h3>
            </div>
            <div className="modal-body">
              <div style={{ background: '#f6ffed', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 500, marginBottom: '8px', color: '#389e0d' }}>
                  {savedWork.status === 'draft' ? '草稿保存成功！' : '作品已提交审核！'}
                </div>
                <div style={{ fontSize: '13px', color: '#595959' }}>
                  <div>作品名称：{savedWork.title}</div>
                  <div>作品ID：{savedWork.id}</div>
                  <div>当前状态：{savedWork.status === 'draft' ? '草稿' : '审核中'}</div>
                  <div>创建时间：{savedWork.created_at}</div>
                </div>
              </div>
              
              {savedWork.status === 'draft' ? (
                <div style={{ fontSize: '13px', color: '#595959', lineHeight: '1.8' }}>
                  <div>• 您可以在"内容管理-草稿"中继续编辑</div>
                  <div>• 编辑完成后可提交审核</div>
                  <div>• 草稿内容仅您本人可见</div>
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: '#595959', lineHeight: '1.8' }}>
                  <div>• 审核通常需要 1-2 小时，请耐心等待</div>
                  <div>• 审核结果将通过系统消息通知您</div>
                  <div>• 审核通过后作品将自动发布</div>
                  <div>• 您可以在"内容管理"中查看审核状态</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => {
                setShowSuccessModal(false);
                setFormData({
                  title: '',
                  content: '',
                  cover_url: '',
                  video_url: '',
                  type: 'video',
                  topics: '',
                  copyright_declaration: '原创',
                  scheduled_at: '',
                });
              }}>
                继续创作
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/works')}>
                查看作品列表
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Publish;
