import React, { useEffect, useState } from 'react';
import { apiGet, apiPost, apiDelete } from '../api.js';

export default function ProcessFlow() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [hazards, setHazards] = useState([]);
  const [ccps, setCcps] = useState([]);
  const [showProcessForm, setShowProcessForm] = useState(false);
  const [showHazardForm, setShowHazardForm] = useState(false);
  const [showCcpForm, setShowCcpForm] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState(null);

  const [processForm, setProcessForm] = useState({ name: '', sequence: 1, description: '', equipment: '' });
  const [hazardForm, setHazardForm] = useState({ type: '生物性', description: '', severity: '中', likelihood: '中', is_significant: false });
  const [ccpForm, setCcpForm] = useState({ hazard_id: '', name: '', limit_type: 'temperature', critical_limit: '', monitoring_method: '', monitoring_frequency: '', responsible_role: '' });

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const data = await apiGet('/products');
    setProducts(data);
    if (data.length > 0 && !selectedProduct) {
      const firstProduct = data[0];
      setSelectedProduct(firstProduct.id);
      loadProcesses(firstProduct.id);
    }
  }

  async function loadProcesses(productId) {
    const data = await apiGet(`/processes?product_id=${productId}`);
    setProcesses(data);
  }

  async function loadHazards(processId) {
    const data = await apiGet(`/hazards?process_id=${processId}`);
    setHazards(data);
  }

  async function loadCcps(processId) {
    const data = await apiGet(`/ccps?process_id=${processId}`);
    setCcps(data);
  }

  function handleProductChange(e) {
    const productId = e.target.value;
    if (productId) {
      setSelectedProduct(productId);
      loadProcesses(productId);
      setSelectedProcess(null);
      setHazards([]);
      setCcps([]);
    }
  }

  function handleProcessClick(process) {
    setSelectedProcess(process);
    loadHazards(process.id);
    loadCcps(process.id);
  }

  async function handleProcessSubmit(e) {
    e.preventDefault();
    await apiPost('/processes', { ...processForm, product_id: selectedProduct });
    setProcessForm({ name: '', sequence: processes.length + 1, description: '', equipment: '' });
    setShowProcessForm(false);
    loadProcesses(selectedProduct);
  }

  async function handleHazardSubmit(e) {
    e.preventDefault();
    await apiPost('/hazards', { ...hazardForm, process_id: selectedProcess.id });
    setHazardForm({ type: '生物性', description: '', severity: '中', likelihood: '中', is_significant: false });
    setShowHazardForm(false);
    loadHazards(selectedProcess.id);
  }

  async function handleCcpSubmit(e) {
    e.preventDefault();
    await apiPost('/ccps', { ...ccpForm, process_id: selectedProcess.id });
    setCcpForm({ hazard_id: '', name: '', limit_type: 'temperature', critical_limit: '', monitoring_method: '', monitoring_frequency: '', responsible_role: '' });
    setShowCcpForm(false);
    loadCcps(selectedProcess.id);
  }

  async function deleteProcess(id) {
    if (confirm('确定删除此工序？')) {
      await apiDelete(`/processes/${id}`);
      loadProcesses(selectedProduct);
      if (selectedProcess?.id === id) {
        setSelectedProcess(null);
        setHazards([]);
        setCcps([]);
      }
    }
  }

  async function deleteHazard(id) {
    if (confirm('确定删除此危害？')) {
      await apiDelete(`/hazards/${id}`);
      loadHazards(selectedProcess.id);
      loadCcps(selectedProcess.id);
    }
  }

  async function deleteCcp(id) {
    if (confirm('确定删除此CCP？')) {
      await apiDelete(`/ccps/${id}`);
      loadCcps(selectedProcess.id);
    }
  }

  return (
    <div>
      <div className="header">
        <h1>工艺流程与HACCP计划</h1>
      </div>

      <div className="card">
        <div className="form-row">
          <div className="form-group">
            <label>选择产品</label>
            <select onChange={handleProductChange} value={selectedProduct || ''}>
              <option value="">-- 请选择产品 --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedProduct && (
        <div className="card">
          <div className="button-group" style={{ marginBottom: '15px' }}>
            <h2 style={{ margin: 0 }}>工序列表</h2>
            <button className="btn btn-primary" onClick={() => setShowProcessForm(!showProcessForm)}>
              {showProcessForm ? '取消' : '+ 添加工序'}
            </button>
          </div>

          {showProcessForm && (
            <form onSubmit={handleProcessSubmit} style={{ marginBottom: '20px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>工序名称</label>
                  <input required value={processForm.name} onChange={e => setProcessForm({ ...processForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>顺序</label>
                  <input type="number" required value={processForm.sequence} onChange={e => setProcessForm({ ...processForm, sequence: parseInt(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>描述</label>
                  <input value={processForm.description} onChange={e => setProcessForm({ ...processForm, description: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>设备</label>
                  <input value={processForm.equipment} onChange={e => setProcessForm({ ...processForm, equipment: e.target.value })} />
                </div>
              </div>
              <div className="button-group">
                <button type="submit" className="btn btn-success">保存</button>
              </div>
            </form>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              {processes.map(p => (
                <div key={p.id} 
                     className={`process-step ${selectedProcess?.id === p.id ? 'alert-success' : ''}`}
                     onClick={() => handleProcessClick(p)}
                     style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4>步骤 {p.sequence}: {p.name}</h4>
                    <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); deleteProcess(p.id); }}>删除</button>
                  </div>
                  <p style={{ fontSize: '14px', color: '#666' }}>{p.description || '无描述'}</p>
                  {p.equipment && <p style={{ fontSize: '13px', color: '#888' }}>设备: {p.equipment}</p>}
                </div>
              ))}
            </div>

            {selectedProcess && (
              <div>
                <div className="button-group" style={{ marginBottom: '10px' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowHazardForm(!showHazardForm)}>
                    {showHazardForm ? '取消' : '+ 添加危害'}
                  </button>
                  <button className="btn btn-success btn-sm" onClick={() => setShowCcpForm(!showCcpForm)}>
                    {showCcpForm ? '取消' : '+ 添加CCP'}
                  </button>
                </div>

                {showHazardForm && (
                  <form onSubmit={handleHazardSubmit} style={{ marginBottom: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '6px' }}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>危害类型</label>
                        <select value={hazardForm.type} onChange={e => setHazardForm({ ...hazardForm, type: e.target.value })}>
                          <option value="生物性">生物性</option>
                          <option value="化学性">化学性</option>
                          <option value="物理性">物理性</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>描述</label>
                        <input required value={hazardForm.description} onChange={e => setHazardForm({ ...hazardForm, description: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>严重性</label>
                        <select value={hazardForm.severity} onChange={e => setHazardForm({ ...hazardForm, severity: e.target.value })}>
                          <option value="高">高</option>
                          <option value="中">中</option>
                          <option value="低">低</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>可能性</label>
                        <select value={hazardForm.likelihood} onChange={e => setHazardForm({ ...hazardForm, likelihood: e.target.value })}>
                          <option value="高">高</option>
                          <option value="中">中</option>
                          <option value="低">低</option>
                        </select>
                      </div>
                    </div>
                    <div className="button-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input type="checkbox" checked={hazardForm.is_significant} onChange={e => setHazardForm({ ...hazardForm, is_significant: e.target.checked })} />
                        显著危害
                      </label>
                      <button type="submit" className="btn btn-success btn-sm">保存</button>
                    </div>
                  </form>
                )}

                {showCcpForm && (
                  <form onSubmit={handleCcpSubmit} style={{ marginBottom: '15px', padding: '15px', background: '#d4edda', borderRadius: '6px' }}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>关联危害</label>
                        <select value={ccpForm.hazard_id} onChange={e => setCcpForm({ ...ccpForm, hazard_id: e.target.value })}>
                          <option value="">-- 选择危害 --</option>
                          {hazards.map(h => (
                            <option key={h.id} value={h.id}>{h.type} - {h.description}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>CCP名称</label>
                        <input required value={ccpForm.name} onChange={e => setCcpForm({ ...ccpForm, name: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>限值类型</label>
                        <select value={ccpForm.limit_type} onChange={e => setCcpForm({ ...ccpForm, limit_type: e.target.value })}>
                          <option value="temperature">温度</option>
                          <option value="time">时间</option>
                          <option value="metal">金属检测</option>
                          <option value="ph">pH值</option>
                          <option value="other">其他</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>关键限值</label>
                        <input required value={ccpForm.critical_limit} onChange={e => setCcpForm({ ...ccpForm, critical_limit: e.target.value })} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>监测方法</label>
                        <input required value={ccpForm.monitoring_method} onChange={e => setCcpForm({ ...ccpForm, monitoring_method: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>监测频次</label>
                        <input required value={ccpForm.monitoring_frequency} onChange={e => setCcpForm({ ...ccpForm, monitoring_frequency: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>负责岗位</label>
                        <input required value={ccpForm.responsible_role} onChange={e => setCcpForm({ ...ccpForm, responsible_role: e.target.value })} />
                      </div>
                    </div>
                    <div className="button-group">
                      <button type="submit" className="btn btn-success btn-sm">保存</button>
                    </div>
                  </form>
                )}

                <h4 style={{ marginBottom: '10px' }}>危害分析</h4>
                {hazards.length === 0 ? (
                  <p style={{ color: '#888' }}>暂无危害记录</p>
                ) : (
                  <div style={{ marginBottom: '15px' }}>
                    {hazards.map(h => (
                      <div key={h.id} style={{ padding: '10px', background: '#fff3cd', borderRadius: '4px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span className="badge badge-warning">{h.type}</span>
                          <span style={{ marginLeft: '8px' }}>{h.description}</span>
                          <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>严重:{h.severity} 可能:{h.likelihood}</span>
                          {h.is_significant ? <span className="badge badge-danger" style={{ marginLeft: '8px' }}>显著</span> : null}
                        </div>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteHazard(h.id)}>删除</button>
                      </div>
                    ))}
                  </div>
                )}

                <h4 style={{ marginBottom: '10px' }}>关键控制点 (CCP)</h4>
                {ccps.length === 0 ? (
                  <p style={{ color: '#888' }}>暂无CCP记录</p>
                ) : (
                  <div>
                    {ccps.map(c => (
                      <div key={c.id} style={{ padding: '10px', background: '#d4edda', borderRadius: '4px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{c.name}</strong>
                          <div style={{ fontSize: '12px', color: '#555' }}>
                            限值: {c.critical_limit} | 方法: {c.monitoring_method} | 频次: {c.monitoring_frequency}
                          </div>
                        </div>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteCcp(c.id)}>删除</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
