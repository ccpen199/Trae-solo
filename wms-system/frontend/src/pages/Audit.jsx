import React, { useState, useEffect } from 'react';
import { auditService } from '../services/api';

const Audit = () => {
  const [audits, setAudits] = useState([]);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    auditType: 'cycle'
  });
  const [actualInventory, setActualInventory] = useState({});

  const loadAudits = async () => {
    setLoading(true);
    try {
      const data = await auditService.list();
      setAudits(data);
    } catch (error) {
      console.error('Failed to load audits:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAudits();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await auditService.create(formData);
      loadAudits();
    } catch (error) {
      console.error('Failed to create audit:', error);
    }
  };

  const handleStart = async (auditId) => {
    try {
      await auditService.start(auditId);
      loadAudits();
    } catch (error) {
      console.error('Failed to start audit:', error);
    }
  };

  const handleSubmitResults = async (auditId) => {
    try {
      const result = await auditService.submitResults(auditId, { actualInventory });
      setSelectedAudit(result);
      loadAudits();
      alert('Audit results submitted successfully');
    } catch (error) {
      console.error('Failed to submit results:', error);
    }
  };

  const handleAdjust = async (auditId, approvalRequired) => {
    try {
      await auditService.adjust(auditId, { approvalRequired });
      loadAudits();
      alert('Inventory adjustment completed');
    } catch (error) {
      console.error('Failed to adjust inventory:', error);
    }
  };

  const viewAuditDetails = async (auditId) => {
    try {
      const data = await auditService.getById(auditId);
      setSelectedAudit(data);
    } catch (error) {
      console.error('Failed to get audit details:', error);
    }
  };

  const updateActualInventory = (sku, value) => {
    setActualInventory({ ...actualInventory, [sku]: parseInt(value) || 0 });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { bg: '#fff3cd', color: '#856404' },
      processing: { bg: '#17a2b8', color: 'white' },
      completed: { bg: '#28a745', color: 'white' }
    };
    const style = statusMap[status] || { bg: '#e2e3e5', color: '#383d41' };
    return (
      <span style={{ ...style, padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
        {status}
      </span>
    );
  };

  const getItemStatusBadge = (status) => {
    const statusMap = {
      matched: { bg: '#28a745', color: 'white' },
      discrepancy: { bg: '#dc3545', color: 'white' },
      resolved: { bg: '#6c757d', color: 'white' }
    };
    const style = statusMap[status] || { bg: '#e2e3e5', color: '#383d41' };
    return (
      <span style={{ ...style, padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
        {status}
      </span>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>库存盘点</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <form onSubmit={handleCreate} style={{ marginBottom: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
            <h3>创建盘点任务</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select
                value={formData.auditType}
                onChange={(e) => setFormData({ ...formData, auditType: e.target.value })}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', flex: 1 }}
              >
                <option value="cycle">周期盘点</option>
                <option value="dynamic">动态盘点</option>
              </select>
              <button type="submit" style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                创建盘点
              </button>
            </div>
          </form>

          <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ padding: '15px', margin: 0, borderBottom: '1px solid #eee' }}>盘点任务列表</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {audits.map((audit) => (
                <div
                  key={audit.id}
                  onClick={() => viewAuditDetails(audit.id)}
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    background: selectedAudit?.audit?.id === audit.id ? '#e7f3ff' : 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>{audit.id}</span>
                    {getStatusBadge(audit.status)}
                  </div>
                  <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                    类型: {audit.auditType === 'cycle' ? '周期盘点' : '动态盘点'} | 差异项: {audit.discrepancyItems}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    开始时间: {new Date(audit.startTime).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          {selectedAudit && (
            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' }}>
              <h3>盘点详情</h3>
              <div style={{ marginBottom: '20px' }}>
                <div><strong>盘点单号:</strong> {selectedAudit.audit.id}</div>
                <div><strong>盘点类型:</strong> {selectedAudit.audit.auditType === 'cycle' ? '周期盘点' : '动态盘点'}</div>
                <div><strong>状态:</strong> {getStatusBadge(selectedAudit.audit.status)}</div>
                <div><strong>开始时间:</strong> {new Date(selectedAudit.audit.startTime).toLocaleString()}</div>
                {selectedAudit.audit.endTime && (
                  <div><strong>结束时间:</strong> {new Date(selectedAudit.audit.endTime).toLocaleString()}</div>
                )}
              </div>

              {selectedAudit.audit.status === 'pending' && (
                <button
                  onClick={() => handleStart(selectedAudit.audit.id)}
                  style={{ marginBottom: '15px', padding: '10px 20px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  开始盘点
                </button>
              )}

              {selectedAudit.audit.status === 'processing' && (
                <div style={{ marginBottom: '20px' }}>
                  <h4>录入实际库存</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {['SKU001', 'SKU002', 'SKU003'].map((sku) => (
                      <div key={sku}>
                        <label style={{ fontSize: '12px', color: '#666' }}>{sku}</label>
                        <input
                          type="number"
                          placeholder="实际数量"
                          onChange={(e) => updateActualInventory(sku, e.target.value)}
                          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', width: '100%' }}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleSubmitResults(selectedAudit.audit.id)}
                    style={{ marginTop: '10px', padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    提交盘点结果
                  </button>
                </div>
              )}

              {selectedAudit.audit.status === 'completed' && selectedAudit.items && (
                <>
                  <h4>盘点结果</h4>
                  <div style={{ marginBottom: '20px', padding: '15px', background: selectedAudit.audit.discrepancyItems > 0 ? '#fff3cd' : '#d4edda', borderRadius: '8px' }}>
                    <div><strong>总商品数:</strong> {selectedAudit.audit.totalItems}</div>
                    <div><strong>差异项数:</strong> {selectedAudit.audit.discrepancyItems}</div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>SKU</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>库位</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>系统数量</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>实际数量</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>差异</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAudit.items.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '8px' }}>{item.sku}</td>
                          <td style={{ padding: '8px' }}>{item.locationId}</td>
                          <td style={{ padding: '8px' }}>{item.systemQuantity}</td>
                          <td style={{ padding: '8px' }}>{item.actualQuantity}</td>
                          <td style={{ padding: '8px', color: item.discrepancy > 0 ? '#28a745' : item.discrepancy < 0 ? '#dc3545' : '#666' }}>
                            {item.discrepancy > 0 ? '+' : ''}{item.discrepancy}
                          </td>
                          <td style={{ padding: '8px' }}>{getItemStatusBadge(item.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleAdjust(selectedAudit.audit.id, false)}
                      style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      直接调整
                    </button>
                    <button
                      onClick={() => handleAdjust(selectedAudit.audit.id, true)}
                      style={{ padding: '10px 20px', background: '#ffc107', color: '#856404', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      提交审批
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Audit;