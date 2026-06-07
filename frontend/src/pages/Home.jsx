import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get('/api/admin/dashboard')
      .then(res => {
        if (res.data.success) {
          setStats(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="card">
        <h2>欢迎使用省级社保民生综合服务平台</h2>
        <p style={{ marginBottom: '1rem', color: '#666' }}>
          本平台提供养老待遇资格认证、医保新农合缴费、电子社保卡申领、养老钱包管理等一站式民生服务
        </p>
      </div>

      {stats && (
        <div className="grid">
          <div className="stat-card">
            <div className="value">{stats.total_persons}</div>
            <div className="label">参保人数</div>
          </div>
          <div className="stat-card">
            <div className="value">{stats.total_certifications}</div>
            <div className="label">认证完成数</div>
          </div>
          <div className="stat-card">
            <div className="value">{stats.total_payments}</div>
            <div className="label">缴费订单数</div>
          </div>
          <div className="stat-card">
            <div className="value">¥{stats.total_wallet_balance.toLocaleString()}</div>
            <div className="label">钱包总余额</div>
          </div>
        </div>
      )}

      <div className="grid" style={{ marginTop: '1.5rem' }}>
        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ marginBottom: '1rem' }}>服务入口</h3>
          <ul style={{ listStyle: 'none', lineHeight: '2.5' }}>
            <li>✓ 公安部身份证OCR识别</li>
            <li>✓ 自研活体检测SDK</li>
            <li>✓ 区块链存证可审计</li>
            <li>✓ 离线预加载认证包</li>
            <li>✓ 断网续传能力</li>
          </ul>
        </div>
        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ marginBottom: '1rem' }}>缴费服务</h3>
          <ul style={{ listStyle: 'none', lineHeight: '2.5' }}>
            <li>✓ 养老保险多档位缴费</li>
            <li>✓ 医保新农合线上缴费</li>
            <li>✓ 财政补贴自动核算</li>
            <li>✓ 税务/医保局接口对接</li>
            <li>✓ 缴费完成率热力图</li>
          </ul>
        </div>
        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ marginBottom: '1rem' }}>养老钱包</h3>
          <ul style={{ listStyle: 'none', lineHeight: '2.5' }}>
            <li>✓ 银行级资金隔离</li>
            <li>✓ T+0申赎规则</li>
            <li>✓ 收益日结结转</li>
            <li>✓ 央行备付金监管对账</li>
            <li>✓ 资产健康度诊断</li>
          </ul>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2>测试账号</h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
            <strong>参保人1:</strong><br />
            身份证: 110101199001011234<br />
            姓名: 张三 | 地区: 北京市
          </div>
          <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
            <strong>参保人2:</strong><br />
            身份证: 310101198505155678<br />
            姓名: 李四 | 地区: 上海市
          </div>
          <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
            <strong>管理员:</strong><br />
            用户名: admin<br />
            密码: admin123
          </div>
        </div>
      </div>
    </div>
  );
}
