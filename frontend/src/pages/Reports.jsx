import React, { useState, useEffect } from 'react';
import { reportAPI, appointmentAPI } from '../api.js';

function Reports({ user }) {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [editingReport, setEditingReport] = useState(null);
  const [reportForm, setReportForm] = useState({ overall_conclusion: '', recommendations: '' });

  useEffect(() => {
    loadReports();
  }, [activeTab]);

  const loadReports = async () => {
    try {
      const res = await reportAPI.getAll(activeTab === 'all' ? null : activeTab);
      setReports(res.data);
    } catch (err) {
      setMessage({ type: 'error', text: '加载报告失败' });
    }
  };

  const loadReportDetail = async (report) => {
    try {
      const res = await reportAPI.getByAppointment(report.appointment_id);
      setSelectedReport(res.data);
    } catch (err) {
      setMessage({ type: 'error', text: '加载报告详情失败' });
    }
  };

  const handleGenerate = async (appointmentId) => {
    try {
      await reportAPI.generate(appointmentId);
      setMessage({ type: 'success', text: '报告生成成功' });
      loadReports();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || '生成报告失败' });
    }
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setReportForm({
      overall_conclusion: report.overall_conclusion || '',
      recommendations: report.recommendations || ''
    });
  };

  const handleSaveReport = async () => {
    try {
      await reportAPI.update(editingReport.id, reportForm);
      setMessage({ type: 'success', text: '报告更新成功' });
      setEditingReport(null);
      loadReports();
      if (selectedReport?.id === editingReport.id) {
        loadReportDetail(editingReport);
      }
    } catch (err) {
      setMessage({ type: 'error', text: '保存失败' });
    }
  };

  const handleSubmit = async (id) => {
    try {
      await reportAPI.submit(id);
      setMessage({ type: 'success', text: '报告已提交审核' });
      loadReports();
    } catch (err) {
      setMessage({ type: 'error', text: '提交失败' });
    }
  };

  const handleReject = async (id) => {
    const comment = prompt('请输入退回原因：');
    if (comment) {
      try {
        await reportAPI.reject(id, comment);
        setMessage({ type: 'success', text: '报告已退回修改' });
        loadReports();
      } catch (err) {
        setMessage({ type: 'error', text: '操作失败' });
      }
    }
  };

  const handleApprove = async (id) => {
    try {
      await reportAPI.approve(id);
      setMessage({ type: 'success', text: '报告审核通过' });
      loadReports();
    } catch (err) {
      setMessage({ type: 'error', text: '操作失败' });
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge-gray',
      pending_review: 'badge-warning',
      rejected: 'badge-danger',
      final: 'badge-success'
    };
    return badges[status] || 'badge-gray';
  };

  const getStatusText = (status) => {
    const texts = {
      draft: '草稿',
      pending_review: '待审核',
      rejected: '已退回',
      final: '已完成'
    };
    return texts[status] || status;
  };

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'draft', label: '草稿' },
    { key: 'pending_review', label: '待审核' },
    { key: 'final', label: '已完成' }
  ];

  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  useEffect(() => {
    if (user.role !== 'customer') {
      appointmentAPI.getAll('completed').then(res => {
        const withReport = reports.map(r => r.appointment_id);
        setCompletedAppointments(res.data.filter(a => !withReport.includes(a.id)));
      });
    }
  }, [reports, user.role]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="page-title" style={{ margin: 0 }}>报告管理</h2>
        {user.role !== 'customer' && (
          <button className="btn btn-primary" onClick={() => setShowGenerateModal(true)}>
            + 生成报告
          </button>
        )}
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '20px' }}>
        <div className="card">
          <div className="tabs" style={{ border: 'none', margin: '0 0 16px 0' }}>
            {tabs.map(tab => (
              <div
                key={tab.key}
                className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </div>
            ))}
          </div>

          <div style={{ maxHeight: 550, overflowY: 'auto' }}>
            {reports.map(report => (
              <div
                key={report.id}
                className={`check-item ${selectedReport?.id === report.id ? 'abnormal' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => loadReportDetail(report)}
              >
                <div className="check-item-header">
                  <div className="check-item-name">{report.customer_name}</div>
                  <div className="check-item-range">
                    {report.report_no} | {report.package_name}
                  </div>
                </div>
                <span className={`badge ${getStatusBadge(report.status)}`}>
                  {getStatusText(report.status)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          {selectedReport ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3>报告详情</h3>
                {user.role !== 'customer' && selectedReport.status === 'draft' && (
                  <div>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(selectedReport)}>编辑</button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleSubmit(selectedReport.id)}>提交审核</button>
                  </div>
                )}
                {user.role === 'admin' && selectedReport.status === 'pending_review' && (
                  <div>
                    <button className="btn btn-danger btn-sm" onClick={() => handleReject(selectedReport.id)}>退回</button>
                    <button className="btn btn-success btn-sm" onClick={() => handleApprove(selectedReport.id)}>审核通过</button>
                  </div>
                )}
              </div>

              <div className="card" style={{ padding: '16px', marginBottom: '16px', background: 'var(--gray-50)' }}>
                <div className="form-row">
                  <div>
                    <p><strong>报告编号：</strong>{selectedReport.report_no}</p>
                    <p><strong>客户：</strong>{selectedReport.customer_name}</p>
                    <p><strong>性别/年龄：</strong>{selectedReport.gender} / {selectedReport.age || '未填写'}</p>
                  </div>
                  <div>
                    <p><strong>套餐：</strong>{selectedReport.package_name}</p>
                    <p><strong>状态：</strong><span className={`badge ${getStatusBadge(selectedReport.status)}`}>{getStatusText(selectedReport.status)}</span></p>
                    <p><strong>异常项数：</strong><span className="text-danger font-bold">{selectedReport.abnormal_count}</span></p>
                  </div>
                </div>
              </div>

              {selectedReport.overall_conclusion && (
                <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                  <h4 className="mb-2">诊断结论</h4>
                  <p>{selectedReport.overall_conclusion}</p>
                </div>
              )}

              {selectedReport.recommendations && (
                <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                  <h4 className="mb-2">建议</h4>
                  <p>{selectedReport.recommendations}</p>
                </div>
              )}

              <h4 className="mb-4">检查结果</h4>
              {selectedReport.records?.map((record, i) => (
                <div key={i} className={`check-item ${record.is_abnormal ? 'abnormal' : ''}`}>
                  <div className="check-item-header">
                    <div className="check-item-name">
                      {record.item_name}
                      {record.is_key && <span className="badge badge-danger" style={{ marginLeft: 8 }}>关键</span>}
                    </div>
                    <div className="check-item-range">
                      参考范围: {record.reference_range} {record.unit}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={record.is_abnormal ? 'text-danger font-bold' : ''}>
                      {record.result || '-'}
                    </div>
                    <div className="text-xs text-gray">{getStatusText(record.status)}</div>
                  </div>
                </div>
              ))}

              {selectedReport.history?.length > 0 && (
                <>
                  <h4 className="mt-4 mb-4">历史报告</h4>
                  {selectedReport.history.map(h => (
                    <div key={h.id} className="check-item">
                      <div className="check-item-header">
                        <div className="check-item-name">{h.report_no}</div>
                        <div className="check-item-range">{h.package_name} | {h.finalized_at?.split('T')[0]}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          ) : (
            <p className="text-gray">请选择一份报告查看详情</p>
          )}
        </div>
      </div>

      {showGenerateModal && (
        <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>选择预约生成报告</h3>
            {completedAppointments.length === 0 ? (
              <p className="text-gray">暂无已完成但未生成报告的预约</p>
            ) : (
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {completedAppointments.map(apt => (
                  <div key={apt.id} className="check-item" style={{ cursor: 'pointer' }} onClick={() => handleGenerate(apt.id)}>
                    <div className="check-item-header">
                      <div className="check-item-name">{apt.customer_name}</div>
                      <div className="check-item-range">{apt.appointment_no} | {apt.package_name}</div>
                    </div>
                    <button className="btn btn-primary btn-sm">生成报告</button>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowGenerateModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {editingReport && (
        <div className="modal-overlay" onClick={() => setEditingReport(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>编辑报告</h3>
            <div className="form-group">
              <label>诊断结论</label>
              <textarea
                rows="4"
                value={reportForm.overall_conclusion}
                onChange={e => setReportForm({ ...reportForm, overall_conclusion: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>建议</label>
              <textarea
                rows="4"
                value={reportForm.recommendations}
                onChange={e => setReportForm({ ...reportForm, recommendations: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setEditingReport(null)}>取消</button>
              <button className="btn btn-primary" onClick={handleSaveReport}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
