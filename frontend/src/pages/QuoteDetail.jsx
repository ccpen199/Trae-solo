import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quotes } from '../api';

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    loadQuote();
  }, [id]);

  const loadQuote = async () => {
    try {
      const res = await quotes.get(id);
      setQuote(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (action) => {
    const comment = prompt('请输入审批意见:');
    try {
      await quotes.approve(id, {
        approver: '管理员',
        action,
        comment
      });
      loadQuote();
    } catch (err) {
      alert('操作失败');
    }
  };

  if (!quote) return <div>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>报价单详情</h2>
          <small style={{ color: '#888' }}>{quote.quote_no}</small>
        </div>
        <button className="btn" onClick={() => navigate('/quotes')}>返回列表</button>
      </div>

      <div className="card">
        <div className="form-row">
          <div>
            <strong>配方：</strong>{quote.recipe_name} ({quote.recipe_code})
          </div>
          <div>
            <strong>渠道：</strong>{quote.channel}
          </div>
          <div>
            <strong>状态：</strong>
            <span className={`badge ${quote.approval_status === 'approved' ? 'badge-success' : quote.approval_status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
              {quote.approval_status === 'approved' ? '已审批' : quote.approval_status === 'pending' ? '待审批' : '已拒绝'}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '15px' }}>价格信息</h3>
        <div className="cost-breakdown">
          <div className="cost-item">
            <div className="label">单位成本</div>
            <div className="amount">¥{quote.total_cost?.toFixed(2)}</div>
          </div>
          <div className="cost-item">
            <div className="label">目标毛利</div>
            <div className="amount">{quote.target_margin}%</div>
          </div>
          <div className="cost-item">
            <div className="label">建议售价</div>
            <div className="amount">¥{quote.base_price?.toFixed(2)}</div>
          </div>
          <div className="cost-item">
            <div className="label">折扣</div>
            <div className="amount">{quote.discount}%</div>
          </div>
          <div className="cost-item">
            <div className="label">实际毛利</div>
            <div className={`amount ${quote.actual_margin < quote.red_line_margin ? 'color: #e74c3c' : ''}`}>
              {quote.actual_margin?.toFixed(1)}%
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '6px', marginTop: '15px' }}>
          <span style={{ fontSize: '14px', color: '#888' }}>最终报价</span>
          <div style={{ fontSize: '36px', fontWeight: 700, color: '#e74c3c' }}>
            ¥{quote.final_price?.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '15px' }}>成本明细</h3>
        <table>
          <thead>
            <tr>
              <th>类型</th>
              <th>项目</th>
              <th>数量</th>
              <th>单价</th>
              <th>小计</th>
            </tr>
          </thead>
          <tbody>
            {quote.cost_details?.map((d, i) => (
              <tr key={i}>
                <td>
                  <span className={`badge ${d.item_type === 'material' ? 'badge-success' : d.item_type === 'packaging' ? 'badge-info' : d.item_type === 'labor' ? 'badge-warning' : 'badge-danger'}`}>
                    {d.item_type === 'material' ? '原料' : d.item_type === 'packaging' ? '包装' : d.item_type === 'labor' ? '人工' : d.item_type === 'loss' ? '损耗' : '税费'}
                  </span>
                </td>
                <td>{d.item_name}</td>
                <td>{d.quantity} {d.unit}</td>
                <td>¥{d.unit_price?.toFixed(2) || '-'}</td>
                <td>¥{d.total_price?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {quote.approval_status === 'pending' && (
        <div className="card">
          <h3 style={{ marginBottom: '15px' }}>审批操作</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-success" onClick={() => handleApprove('approve')}>
              ✓ 通过审批
            </button>
            <button className="btn btn-danger" onClick={() => handleApprove('reject')}>
              ✗ 拒绝
            </button>
          </div>
        </div>
      )}

      {quote.approvals?.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '15px' }}>审批记录</h3>
          <table>
            <thead>
              <tr>
                <th>审批人</th>
                <th>操作</th>
                <th>意见</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              {quote.approvals.map((a, i) => (
                <tr key={i}>
                  <td>{a.approver}</td>
                  <td>
                    <span className={`badge ${a.action === 'approve' ? 'badge-success' : 'badge-danger'}`}>
                      {a.action === 'approve' ? '通过' : '拒绝'}
                    </span>
                  </td>
                  <td>{a.comment || '-'}</td>
                  <td>{a.created_at?.slice(0, 19)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
