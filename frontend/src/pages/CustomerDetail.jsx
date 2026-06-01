import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customersAPI, materialsAPI, progressAPI, resultsAPI } from '../api';

const STATUS_FLOW = ['已签约', '材料审核中', '材料审核通过', '已提交异议', '机构受理中', '补件中', '机构驳回', '已更正', '已结案'];

function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [customer, setCustomer] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [progress, setProgress] = useState([]);
  const [result, setResult] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [progressSubmitting, setProgressSubmitting] = useState(false);
  const [resultSubmitting, setResultSubmitting] = useState(false);
  const [progressForm, setProgressForm] = useState({ status: '', remark: '' });
  const [resultForm, setResultForm] = useState({
    service_conclusion: '',
    refund_status: 'no_refund',
    final_balance: 0,
    before_screenshot: null,
    after_screenshot: null,
    institution_reply: null
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [custRes, matRes, progRes, resRes] = await Promise.all([
        customersAPI.get(id),
        customersAPI.getMaterials(id),
        customersAPI.getProgress(id),
        customersAPI.getResult(id)
      ]);
      setCustomer(custRes.data);
      setMaterials(matRes.data || []);
      setProgress(progRes.data || []);
      setResult(resRes.data);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const handleFileUpload = async (materialId, file) => {
    try {
      await materialsAPI.upload(materialId, file);
      alert('材料上传成功！');
      loadData();
    } catch (error) {
      console.error('上传失败:', error);
      alert('材料上传失败，请重试');
    }
  };

  const handleMaterialAudit = async (materialId, status, remark = '') => {
    try {
      await materialsAPI.audit(materialId, { status, audit_remark: remark });
      alert(status === 'approved' ? '材料审核通过！' : '材料已驳回');
      loadData();
    } catch (error) {
      console.error('审核失败:', error);
      alert('审核操作失败，请重试');
    }
  };

  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    
    const currentStatus = progress[0]?.status || '';
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    const newIndex = STATUS_FLOW.indexOf(progressForm.status);
    
    if (newIndex - currentIndex > 1) {
      alert(`不能跳过中间步骤！当前状态是"${currentStatus}"，下一步应该是"${STATUS_FLOW[currentIndex + 1]}"`);
      return;
    }
    
    if (newIndex < currentIndex) {
      alert('不能回退到之前的状态！');
      return;
    }
    
    setProgressSubmitting(true);
    try {
      await progressAPI.create({ customer_id: id, ...progressForm });
      setShowProgressModal(false);
      setProgressForm({ status: '', remark: '' });
      alert('进度更新成功！');
      loadData();
    } catch (error) {
      console.error('更新进度失败:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('进度更新失败，请重试');
      }
    } finally {
      setProgressSubmitting(false);
    }
  };

  const handleResultSubmit = async (e) => {
    e.preventDefault();
    setResultSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('service_conclusion', resultForm.service_conclusion);
      formData.append('refund_status', resultForm.refund_status);
      formData.append('final_balance', resultForm.final_balance);
      if (resultForm.before_screenshot) formData.append('before_screenshot', resultForm.before_screenshot);
      if (resultForm.after_screenshot) formData.append('after_screenshot', resultForm.after_screenshot);
      if (resultForm.institution_reply) formData.append('institution_reply', resultForm.institution_reply);
      
      await resultsAPI.create(id, formData);
      setShowResultModal(false);
      alert('结案提交成功！');
      loadData();
    } catch (error) {
      console.error('提交结果失败:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('提交失败，请重试');
      }
    } finally {
      setResultSubmitting(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      approved: 'status-active',
      pending: 'status-pending',
      submitted: 'status-processing',
      rejected: 'status-rejected'
    };
    return `status-badge ${statusMap[status] || 'status-pending'}`;
  };

  const getStatusText = (status) => {
    const map = { approved: '已通过', pending: '待提交', submitted: '待审核', rejected: '已驳回' };
    return map[status] || status;
  };

  if (!customer) return <div className="card">加载中...</div>;

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button className="btn" onClick={() => navigate('/customers')}>← 返回列表</button>
        <span style={{ marginLeft: '20px', fontSize: '18px', fontWeight: 'bold' }}>
          {customer.customer_no} - {customer.name}
        </span>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>基本信息</div>
        <div className={`tab ${activeTab === 'materials' ? 'active' : ''}`} onClick={() => setActiveTab('materials')}>材料管理</div>
        <div className={`tab ${activeTab === 'progress' ? 'active' : ''}`} onClick={() => setActiveTab('progress')}>进度跟踪</div>
        <div className={`tab ${activeTab === 'result' ? 'active' : ''}`} onClick={() => setActiveTab('result')}>结果归档</div>
      </div>

      {activeTab === 'info' && (
        <div className="card">
          <h3>客户基本信息</h3>
          <div className="form-row">
            <div><strong>客户编号：</strong>{customer.customer_no}</div>
            <div><strong>姓名：</strong>{customer.name}</div>
          </div>
          <div className="form-row">
            <div><strong>身份证号：</strong>{customer.id_card || '-'}</div>
            <div><strong>手机号：</strong>{customer.phone || '-'}</div>
          </div>
          <div className="form-row">
            <div><strong>邮箱：</strong>{customer.email || '-'}</div>
            <div><strong>联系人：</strong>{customer.contact_person || '-'}</div>
          </div>
          <div className="form-row">
            <div><strong>征信问题类型：</strong>{
              customer.credit_problem_type === 'overdue' ? '逾期记录' :
              customer.credit_problem_type === 'misinformation' ? '信息不实' :
              customer.credit_problem_type === 'unauthorized' ? '非本人操作' : '其他'
            }</div>
            <div><strong>涉及机构：</strong>{customer.involved_institutions || '-'}</div>
          </div>
          <div className="form-group">
            <strong>问题原因说明：</strong>
            <p style={{ marginTop: '8px', padding: '12px', background: '#f8f9fa', borderRadius: '4px' }}>
              {customer.overdue_reason || '-'}
            </p>
          </div>
          <div className="form-row">
            <div><strong>总服务费：</strong>¥{customer.total_fee}</div>
            <div><strong>已支付：</strong>¥{customer.paid_fee || 0}</div>
          </div>
        </div>
      )}

      {activeTab === 'materials' && (
        <div className="card">
          <h3>材料清单</h3>
          {materials.length === 0 ? (
            <div className="empty-state">暂无材料</div>
          ) : (
            materials.map(mat => (
              <div key={mat.id} className="material-item">
                <div>
                  <div style={{ fontWeight: 500 }}>{mat.material_name}</div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                    {mat.file_path ? (
                      <a href={`/uploads/${mat.file_path}`} target="_blank" rel="noreferrer">查看附件</a>
                    ) : '未上传'}
                    {mat.audit_remark && ` | 审核意见：${mat.audit_remark}`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={getStatusBadgeClass(mat.status)}>{getStatusText(mat.status)}</span>
                  {mat.status === 'pending' && (
                    <input type="file" size="small" onChange={e => e.target.files[0] && handleFileUpload(mat.id, e.target.files[0])} />
                  )}
                  {mat.status === 'submitted' && (
                    <>
                      <button className="btn btn-sm btn-success" onClick={() => handleMaterialAudit(mat.id, 'approved')}>通过</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleMaterialAudit(mat.id, 'rejected', '材料不完整')}>驳回</button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'progress' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>进度跟踪</h3>
            <button className="btn btn-primary" onClick={() => setShowProgressModal(true)}>更新进度</button>
          </div>
          
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ marginBottom: '12px' }}>当前状态</h4>
            {STATUS_FLOW.map((status, index) => {
              const currentStatus = progress.length > 0 ? progress[0].status : '';
              const currentIndex = STATUS_FLOW.indexOf(currentStatus);
              const isCompleted = currentIndex !== -1 && index < currentIndex;
              const isCurrent = currentStatus === status;
              return (
                <div key={status} className={`progress-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                  <div className="step-icon">{index + 1}</div>
                  <div>{status}</div>
                </div>
              );
            })}
          </div>

          <h4 style={{ marginBottom: '12px' }}>操作日志</h4>
          <div className="timeline">
            {progress.map(p => (
              <div key={p.id} className="timeline-item">
                <div className="time">{new Date(p.created_at).toLocaleString()}</div>
                <div className="status">{p.status}</div>
                {p.remark && p.remark !== p.status && <div className="remark">备注：{p.remark}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'result' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>结果归档</h3>
            {!result && <button className="btn btn-primary" onClick={() => setShowResultModal(true)}>提交结案</button>}
          </div>
          
          {result ? (
            <div>
              <div className="form-row">
                <div><strong>服务结论：</strong>{result.service_conclusion}</div>
                <div><strong>退款状态：</strong>{result.refund_status === 'full_refund' ? '全额退款' : result.refund_status === 'partial_refund' ? '部分退款' : '无需退款'}</div>
              </div>
              <div className="form-group">
                <strong>最终结算金额：</strong>¥{result.final_balance}
              </div>
              <div className="form-row-3">
                <div>
                  <strong>修复前截图：</strong>
                  {result.before_screenshot && <div><img src={`/uploads/${result.before_screenshot}`} alt="before" className="file-preview" /></div>}
                </div>
                <div>
                  <strong>修复后截图：</strong>
                  {result.after_screenshot && <div><img src={`/uploads/${result.after_screenshot}`} alt="after" className="file-preview" /></div>}
                </div>
                <div>
                  <strong>机构回函：</strong>
                  {result.institution_reply && <div><a href={`/uploads/${result.institution_reply}`} target="_blank">查看附件</a></div>}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">尚未结案</div>
          )}
        </div>
      )}

      {showProgressModal && (
        <div className="modal-overlay" onClick={() => setShowProgressModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>更新进度</h3>
              <button className="close-btn" onClick={() => setShowProgressModal(false)}>×</button>
            </div>
            <form onSubmit={handleProgressSubmit}>
              <div className="form-group">
                <label>状态 *</label>
                <select required value={progressForm.status} onChange={e => setProgressForm({...progressForm, status: e.target.value})}>
                  <option value="">请选择</option>
                  {STATUS_FLOW.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>备注说明</label>
                <textarea rows="3" value={progressForm.remark} onChange={e => setProgressForm({...progressForm, remark: e.target.value})} />
              </div>
              <div style={{ textAlign: 'right', marginTop: '20px' }}>
                <button type="button" className="btn" style={{ marginRight: '10px' }} onClick={() => setShowProgressModal(false)} disabled={progressSubmitting}>取消</button>
                <button type="submit" className="btn btn-primary" disabled={progressSubmitting}>
                  {progressSubmitting ? '提交中...' : '提交'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResultModal && (
        <div className="modal-overlay" onClick={() => setShowResultModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>提交结案</h3>
              <button className="close-btn" onClick={() => setShowResultModal(false)}>×</button>
            </div>
            <form onSubmit={handleResultSubmit}>
              <div className="form-group">
                <label>服务结论 *</label>
                <textarea rows="3" required value={resultForm.service_conclusion} onChange={e => setResultForm({...resultForm, service_conclusion: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>退款状态</label>
                  <select value={resultForm.refund_status} onChange={e => setResultForm({...resultForm, refund_status: e.target.value})}>
                    <option value="no_refund">无需退款</option>
                    <option value="full_refund">全额退款</option>
                    <option value="partial_refund">部分退款</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>最终结算金额</label>
                  <input type="number" value={resultForm.final_balance} onChange={e => setResultForm({...resultForm, final_balance: Number(e.target.value)})} />
                </div>
              </div>
              <div className="form-group">
                <label>修复前截图</label>
                <input type="file" accept="image/*" onChange={e => setResultForm({...resultForm, before_screenshot: e.target.files[0]})} />
              </div>
              <div className="form-group">
                <label>修复后截图</label>
                <input type="file" accept="image/*" onChange={e => setResultForm({...resultForm, after_screenshot: e.target.files[0]})} />
              </div>
              <div className="form-group">
                <label>机构回函附件</label>
                <input type="file" onChange={e => setResultForm({...resultForm, institution_reply: e.target.files[0]})} />
              </div>
              <div style={{ textAlign: 'right', marginTop: '20px' }}>
                <button type="button" className="btn" style={{ marginRight: '10px' }} onClick={() => setShowResultModal(false)} disabled={resultSubmitting}>取消</button>
                <button type="submit" className="btn btn-primary" disabled={resultSubmitting}>
                  {resultSubmitting ? '提交中...' : '提交结案'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerDetail;
