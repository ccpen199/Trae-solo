import React, { useState, useEffect } from 'react';
import { getBills, getBill, addCollection } from '../api.js';

export default function Collection() {
  const [bills, setBills] = useState([]);
  const [showDetail, setShowDetail] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [collectionForm, setCollectionForm] = useState({
    collection_date: '',
    collection_method: 'phone',
    collector: '',
    result: '',
    notes: ''
  });

  useEffect(() => {
    loadOverdueBills();
  }, []);

  const loadOverdueBills = async () => {
    try {
      const res = await getBills({ overdue: 'true' });
      setBills(res.data.filter(b => b.status !== 'paid'));
    } catch (error) {
      console.error('加载逾期账单失败:', error);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await getBill(id);
      setDetailData(res.data);
      setShowDetail(id);
    } catch (error) {
      console.error('加载账单详情失败:', error);
    }
  };

  const handleOpenCollectionModal = (bill) => {
    setSelectedBill(bill);
    setCollectionForm({
      collection_date: new Date().toISOString().split('T')[0],
      collection_method: 'phone',
      collector: '',
      result: 'in_progress',
      notes: ''
    });
    setShowCollectionModal(true);
  };

  const handleAddCollection = async (e) => {
    e.preventDefault();
    try {
      await addCollection(selectedBill.id, collectionForm);
      setShowCollectionModal(false);
      loadOverdueBills();
      if (showDetail) {
        handleViewDetail(showDetail);
      }
    } catch (error) {
      alert('添加催收记录失败: ' + error.message);
    }
  };

  const getOverdueLevel = (days) => {
    if (days >= 60) return { text: '严重逾期', class: 'danger' };
    if (days >= 30) return { text: '高度逾期', class: 'warning' };
    return { text: '轻度逾期', class: 'info' };
  };

  const totalOverdueAmount = bills.reduce((sum, b) => sum + (b.amount - b.paid_amount), 0);

  return (
    <div>
      <div className="page-header">
        <h1>催收工作台</h1>
        <p>逾期账单集中催收处理</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">逾期账单数</div>
          <div className="value text-danger">{bills.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">逾期总金额</div>
          <div className="value currency text-danger">{totalOverdueAmount.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="label">30天以上逾期</div>
          <div className="value text-warning">{bills.filter(b => b.overdue_days >= 30).length}</div>
        </div>
        <div className="stat-card">
          <div className="label">60天以上逾期</div>
          <div className="value text-danger">{bills.filter(b => b.overdue_days >= 60).length}</div>
        </div>
      </div>

      <div className="card">
        <h3>逾期账单列表</h3>
        <table className="table">
          <thead>
            <tr>
              <th>账单编号</th>
              <th>客户名称</th>
              <th>逾期金额</th>
              <th>到期日</th>
              <th>逾期天数</th>
              <th>逾期等级</th>
              <th>催收状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {bills.map(bill => {
              const level = getOverdueLevel(bill.overdue_days);
              return (
                <tr key={bill.id}>
                  <td><code>{bill.bill_no}</code></td>
                  <td>{bill.customer_name}</td>
                  <td className="text-danger">¥{(bill.amount - bill.paid_amount).toLocaleString()}</td>
                  <td>{bill.due_date}</td>
                  <td className="text-danger">{bill.overdue_days} 天</td>
                  <td><span className={`badge ${level.class}`}>{level.text}</span></td>
                  <td>
                    <span className={`badge ${bill.collection_status === 'in_progress' ? 'warning' : 'secondary'}`}>
                      {bill.collection_status === 'in_progress' ? '催收中' : '待催收'}
                    </span>
                  </td>
                  <td>
                    <div className="flex-gap">
                      <button className="btn btn-sm btn-primary" onClick={() => handleViewDetail(bill.id)}>
                        详情
                      </button>
                      <button className="btn btn-sm btn-warning" onClick={() => handleOpenCollectionModal(bill)}>
                        催收
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {bills.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center text-muted py-4">
                  暂无逾期账单
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showDetail && detailData && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>逾期账单详情 - {detailData.bill_no}</h2>
              <button className="close-btn" onClick={() => setShowDetail(null)}>&times;</button>
            </div>
            <div className="grid-2 mb-2">
              <div>客户名称: {detailData.customer_name}</div>
              <div>合同编号: {detailData.contract_no}</div>
              <div>账单金额: ¥{detailData.amount?.toLocaleString()}</div>
              <div>已付金额: ¥{detailData.paid_amount?.toLocaleString()}</div>
              <div className="text-danger">待收金额: ¥{(detailData.amount - detailData.paid_amount).toLocaleString()}</div>
              <div className="text-danger">逾期天数: {detailData.overdue_days} 天</div>
            </div>
            <div className="mb-2">
              <div className="flex-between">
                <h4>催收记录</h4>
                <button className="btn btn-sm btn-warning" onClick={() => handleOpenCollectionModal(detailData)}>
                  + 新增催收
                </button>
              </div>
              {detailData.collections?.length === 0 ? (
                <div className="text-muted">暂无催收记录</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>日期</th>
                      <th>方式</th>
                      <th>催收人</th>
                      <th>结果</th>
                      <th>备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailData.collections?.map(c => (
                      <tr key={c.id}>
                        <td>{c.collection_date}</td>
                        <td>{c.collection_method === 'phone' ? '电话' : 
                            c.collection_method === 'email' ? '邮件' :
                            c.collection_method === 'visit' ? '上门' : '其他'}</td>
                        <td>{c.collector}</td>
                        <td>{c.result === 'success' ? '成功' : c.result === 'failed' ? '失败' : '进行中'}</td>
                        <td>{c.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {showCollectionModal && (
        <div className="modal-overlay" onClick={() => setShowCollectionModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>新增催收记录</h2>
              <button className="close-btn" onClick={() => setShowCollectionModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddCollection}>
              <div className="mb-2">
                <div className="text-muted">账单: {selectedBill?.bill_no}</div>
                <div className="text-muted">客户: {selectedBill?.customer_name}</div>
                <div className="text-muted">逾期金额: ¥{(selectedBill?.amount - selectedBill?.paid_amount)?.toLocaleString()}</div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>催收日期 *</label>
                  <input type="date" required value={collectionForm.collection_date}
                    onChange={e => setCollectionForm({...collectionForm, collection_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>催收方式</label>
                  <select value={collectionForm.collection_method}
                    onChange={e => setCollectionForm({...collectionForm, collection_method: e.target.value})}>
                    <option value="phone">电话</option>
                    <option value="email">邮件</option>
                    <option value="visit">上门</option>
                    <option value="letter">函件</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>催收人 *</label>
                <input type="text" required value={collectionForm.collector}
                  onChange={e => setCollectionForm({...collectionForm, collector: e.target.value})} />
              </div>
              <div className="form-group">
                <label>催收结果</label>
                <select value={collectionForm.result}
                  onChange={e => setCollectionForm({...collectionForm, result: e.target.value})}>
                  <option value="in_progress">进行中</option>
                  <option value="success">催收成功</option>
                  <option value="partial">部分还款</option>
                  <option value="failed">催收失败</option>
                  <option value="promise">承诺还款</option>
                </select>
              </div>
              <div className="form-group">
                <label>催收备注</label>
                <textarea rows="3" value={collectionForm.notes}
                  onChange={e => setCollectionForm({...collectionForm, notes: e.target.value})}
                  placeholder="请记录催收情况" />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCollectionModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">保存记录</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
