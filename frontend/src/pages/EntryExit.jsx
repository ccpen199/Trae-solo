import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api.js';

export default function EntryExit() {
  const [lots, setLots] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [plateNumber, setPlateNumber] = useState('');
  const [spotNumber, setSpotNumber] = useState('');
  const [verifyData, setVerifyData] = useState(null);
  const [loading, setLoading] = useState({ lots: true, records: true, verify: false, entry: false, exit: false });
  const [message, setMessage] = useState(null);

  function showMessage(text, type = 'success') {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }

  const loadLots = useCallback(async () => {
    try {
      const data = await api.getParkingLots();
      setLots(data);
      if (data.length > 0 && !selectedLot) {
        setSelectedLot(data[0].id);
      }
    } catch (e) {
      showMessage('加载停车场失败: ' + e.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, lots: false }));
    }
  }, [selectedLot]);

  const loadRecords = useCallback(async () => {
    try {
      const data = await api.getEntryExitRecords();
      setRecords(data);
    } catch (e) {
      showMessage('加载记录失败: ' + e.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, records: false }));
    }
  }, []);

  const loadVerify = useCallback(async () => {
    if (!selectedLot) return;
    setLoading(prev => ({ ...prev, verify: true }));
    try {
      const data = await api.verifyData(selectedLot);
      setVerifyData(data);
    } catch (e) {
      console.error('Verify error:', e);
    } finally {
      setLoading(prev => ({ ...prev, verify: false }));
    }
  }, [selectedLot]);

  useEffect(() => { loadLots(); }, [loadLots]);
  useEffect(() => { loadRecords(); }, [loadRecords]);
  useEffect(() => { if (selectedLot) loadVerify(); }, [selectedLot, loadVerify]);

  async function handleEntry() {
    if (!plateNumber.trim()) { showMessage('请输入车牌号', 'error'); return; }
    if (!selectedLot) { showMessage('请选择停车场', 'error'); return; }
    
    setLoading(prev => ({ ...prev, entry: true }));
    try {
      await api.recordEntry({
        plate_number: plateNumber.toUpperCase().trim(),
        parking_lot_id: selectedLot,
        spot_number: spotNumber.trim() || null
      });
      showMessage('✓ 入场登记成功！车牌: ' + plateNumber.toUpperCase());
      setPlateNumber('');
      setSpotNumber('');
      loadRecords();
      loadVerify();
    } catch (e) {
      showMessage('入场登记失败: ' + e.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, entry: false }));
    }
  }

  async function handleExit() {
    if (!plateNumber.trim()) { showMessage('请输入车牌号', 'error'); return; }
    if (!selectedLot) { showMessage('请选择停车场', 'error'); return; }
    
    setLoading(prev => ({ ...prev, exit: true }));
    try {
      const result = await api.recordExit({
        plate_number: plateNumber.toUpperCase().trim(),
        parking_lot_id: selectedLot
      });
      showMessage(`✓ 离场结算成功！时长: ${result.duration}分钟, 费用: ¥${result.fee}`);
      setPlateNumber('');
      loadRecords();
      loadVerify();
    } catch (e) {
      showMessage('离场结算失败: ' + e.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, exit: false }));
    }
  }

  async function handlePay(recordId) {
    try {
      await api.payRecord(recordId);
      showMessage('✓ 支付成功！');
      loadRecords();
    } catch (e) {
      showMessage('支付失败: ' + e.message, 'error');
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>🚙 入离场管理</h2>

      {message && (
        <div className="card" style={{ 
          background: message.type === 'error' ? '#fee2e2' : '#d1fae5', 
          marginBottom: '1rem' 
        }}>
          <p style={{ color: message.type === 'error' ? '#991b1b' : '#065f46', margin: 0 }}>{message.text}</p>
        </div>
      )}

      <div className="card">
        <h3>车辆登记</h3>
        <div className="form-row">
          <div className="form-group">
            <label>选择停车场</label>
            <select 
              value={selectedLot || ''} 
              onChange={e => setSelectedLot(parseInt(e.target.value))}
              disabled={loading.lots}
            >
              {lots.length === 0 ? (
                <option value="">暂无停车场</option>
              ) : (
                lots.map(lot => (
                  <option key={lot.id} value={lot.id}>{lot.name}</option>
                ))
              )}
            </select>
          </div>
          <div className="form-group">
            <label>车牌号</label>
            <input 
              value={plateNumber} 
              onChange={e => setPlateNumber(e.target.value.toUpperCase())} 
              placeholder="例: 京A12345"
              maxLength={10}
            />
          </div>
          <div className="form-group">
            <label>车位号（可选）</label>
            <input 
              value={spotNumber} 
              onChange={e => setSpotNumber(e.target.value)} 
              placeholder="例: A001"
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-success" 
            onClick={handleEntry} 
            disabled={loading.entry || loading.lots}
          >
            {loading.entry ? '登记中...' : '入场登记'}
          </button>
          <button 
            className="btn btn-danger" 
            onClick={handleExit}
            disabled={loading.exit || loading.lots}
          >
            {loading.exit ? '结算中...' : '离场结算'}
          </button>
        </div>
      </div>

      {verifyData && (
        <div className="card">
          <h3>📊 数据一致性校验</h3>
          {loading.verify ? <p>校验中...</p> : (
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div className="stat-card">
                <div className="label">入场记录占用</div>
                <div className="value">{verifyData.occupied_records}</div>
              </div>
              <div className="stat-card">
                <div className="label">车位状态占用</div>
                <div className="value">{verifyData.occupied_spots}</div>
              </div>
              <div className={`stat-card ${verifyData.mismatch ? 'danger' : 'success'}`}>
                <div className="label">一致性</div>
                <div className="value">{verifyData.mismatch ? '不一致' : '一致'}</div>
              </div>
              <div className="stat-card info">
                <div className="label">建议</div>
                <div className="value" style={{ fontSize: '0.875rem' }}>{verifyData.recommendation}</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h3>📋 入离场记录</h3>
        {loading.records ? <p>加载中...</p> : (
          <table className="table">
            <thead>
              <tr>
                <th>车牌号</th>
                <th>停车场</th>
                <th>车位</th>
                <th>入场时间</th>
                <th>离场时间</th>
                <th>时长</th>
                <th>费用</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? records.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.plate_number}</strong></td>
                  <td>{r.parking_lot_name || '-'}</td>
                  <td>{r.spot_number || '-'}</td>
                  <td>{r.entry_time}</td>
                  <td>{r.exit_time || <span className="badge badge-warning">停车中</span>}</td>
                  <td>{r.duration ? `${r.duration}分钟` : '-'}</td>
                  <td>{r.fee ? `¥${r.fee}` : '-'}</td>
                  <td>
                    <span className={`badge ${r.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                      {r.payment_status === 'paid' ? '已支付' : '未支付'}
                    </span>
                  </td>
                  <td>
                    {r.exit_time && r.payment_status !== 'paid' && (
                      <button className="btn btn-sm btn-primary" onClick={() => handlePay(r.id)}>支付</button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="9">
                    <div className="empty-state">
                      <div className="icon">📋</div>
                      <p>暂无入离场记录</p>
                      <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>请先在上方登记车辆入场</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
