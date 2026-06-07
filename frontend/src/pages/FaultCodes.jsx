import { useState, useEffect } from 'react';
import api from '../utils/api';

const FaultCodes = () => {
  const [faultCodes, setFaultCodes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaultCodes = async () => {
      try {
        setLoading(true);
        const data = await api.get('/fault-codes');
        setFaultCodes(data);
      } catch (error) {
        console.error('Failed to fetch fault codes:', error);
        setFaultCodes([
          { id: 1, code: 'P0300', description: '随机/多缸失火检测', vehicleModel: '通用', severity: 'high', solution: '检查火花塞、点火线圈、燃油喷射器' },
          { id: 2, code: 'P0420', description: '催化器系统效率低于阈值', vehicleModel: '重汽豪沃', severity: 'medium', solution: '检查催化器、氧传感器' },
          { id: 3, code: 'P0171', description: '系统过稀（第1排）', vehicleModel: '东风天龙', severity: 'medium', solution: '检查进气系统泄漏、燃油压力' },
          { id: 4, code: 'P0562', description: '系统电压过低', vehicleModel: '解放J6', severity: 'low', solution: '检查电池、发电机、充电系统' },
          { id: 5, code: 'P0230', description: '燃油泵初级电路故障', vehicleModel: '陕汽德龙', severity: 'high', solution: '检查燃油泵继电器、电路' },
          { id: 6, code: 'P0700', description: '变速箱控制系统故障', vehicleModel: '欧曼GTL', severity: 'high', solution: '使用专业诊断工具读取变速箱故障码' },
          { id: 7, code: 'P0401', description: 'EGR流量不足检测', vehicleModel: '通用', severity: 'low', solution: '清洁EGR阀、检查管路' },
          { id: 8, code: 'P0128', description: '冷却液温度低于节温器调节温度', vehicleModel: '江淮格尔发', severity: 'low', solution: '更换节温器、检查冷却液' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchFaultCodes();
  }, []);

  const getSeverityBadge = (severity) => {
    const styles = {
      high: { backgroundColor: '#f8d7da', color: '#721c24', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' },
      medium: { backgroundColor: '#fff3cd', color: '#856404', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' },
      low: { backgroundColor: '#d4edda', color: '#155724', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' },
    };
    const labels = { high: '高', medium: '中', low: '低' };
    const dots = { high: '🔴', medium: '🟡', low: '🟢' };
    return (
      <span style={styles[severity]}>
        {dots[severity]} {labels[severity]}
      </span>
    );
  };

  const filteredCodes = faultCodes.filter(code => {
    const matchesCode = code.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDescription = code.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModel = code.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCode || matchesDescription || matchesModel;
  });

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>加载中...</div>;
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8f9fc', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px', color: '#5a5c69' }}>
        ⚠️ 故障代码库
      </h1>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#5a5c69', margin: 0 }}>故障代码查询</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ color: '#858796', fontSize: '14px' }}>共 {filteredCodes.length} 条记录</span>
            <input
              type="text"
              placeholder="搜索故障码、描述或车型..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '10px 16px', border: '1px solid #d1d3e2', borderRadius: '6px', fontSize: '14px', width: '300px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', padding: '16px', backgroundColor: '#f8f9fc', borderRadius: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#e74a3b' }}></span>
            <span style={{ fontSize: '14px', color: '#5a5c69' }}>高严重度 - 立即维修</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f6c23e' }}></span>
            <span style={{ fontSize: '14px', color: '#5a5c69' }}>中严重度 - 尽快维修</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#1cc88a' }}></span>
            <span style={{ fontSize: '14px', color: '#5a5c69' }}>低严重度 - 常规检查</span>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e3e6f0', backgroundColor: '#f8f9fc' }}>
              <th style={{ textAlign: 'left', padding: '14px', color: '#858796', fontSize: '14px', fontWeight: '600' }}>故障码</th>
              <th style={{ textAlign: 'left', padding: '14px', color: '#858796', fontSize: '14px', fontWeight: '600' }}>描述</th>
              <th style={{ textAlign: 'left', padding: '14px', color: '#858796', fontSize: '14px', fontWeight: '600' }}>适用车型</th>
              <th style={{ textAlign: 'left', padding: '14px', color: '#858796', fontSize: '14px', fontWeight: '600' }}>严重度</th>
              <th style={{ textAlign: 'left', padding: '14px', color: '#858796', fontSize: '14px', fontWeight: '600' }}>解决方案</th>
            </tr>
          </thead>
          <tbody>
            {filteredCodes.map((code) => (
              <tr key={code.id} style={{ borderBottom: '1px solid #e3e6f0', transition: 'background-color 0.2s' }}>
                <td style={{ padding: '14px' }}>
                  <span style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '16px', 
                    fontWeight: 'bold', 
                    color: '#4e73df',
                    backgroundColor: '#e8f0fe',
                    padding: '6px 12px',
                    borderRadius: '6px',
                  }}>
                    {code.code}
                  </span>
                </td>
                <td style={{ padding: '14px', color: '#5a5c69', fontWeight: '500' }}>{code.description}</td>
                <td style={{ padding: '14px', color: '#858796' }}>{code.vehicleModel}</td>
                <td style={{ padding: '14px' }}>{getSeverityBadge(code.severity)}</td>
                <td style={{ padding: '14px', color: '#5a5c69', fontSize: '14px', maxWidth: '300px' }}>{code.solution}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCodes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#858796' }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>🔍</p>
            <p>未找到匹配的故障代码</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaultCodes;
