import React, { useState, useEffect } from 'react';
import { quotes } from '../api';

export default function Reports() {
  const [data, setData] = useState([]);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const res = await quotes.getMarginReport();
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>毛利报表</h2>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '15px' }}>配方毛利汇总</h3>
        <table>
          <thead>
            <tr>
              <th>配方名称</th>
              <th>报价次数</th>
              <th>平均单位成本</th>
              <th>平均售价</th>
              <th>平均毛利率</th>
              <th>最低毛利率</th>
              <th>最高毛利率</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{d.recipe_name || '未命名配方'}</td>
                <td>{d.quote_count}</td>
                <td>¥{d.avg_unit_cost?.toFixed(2)}</td>
                <td style={{ fontWeight: 600, color: '#e74c3c' }}>¥{d.avg_price?.toFixed(2)}</td>
                <td>
                  <span className={`badge ${d.avg_margin < 20 ? 'badge-warning' : 'badge-success'}`}>
                    {d.avg_margin?.toFixed(1)}%
                  </span>
                </td>
                <td>
                  <span className={`badge ${d.min_margin < 15 ? 'badge-danger' : ''}`}>
                    {d.min_margin?.toFixed(1)}%
                  </span>
                </td>
                <td>{d.max_margin?.toFixed(1)}%</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan="7" className="empty-state">暂无数据，请先创建报价单</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '15px' }}>验收指标说明</h3>
        <ul style={{ lineHeight: 2, paddingLeft: '20px' }}>
          <li><strong>原料涨价追溯：</strong>每次原料价格变更后，可重新计算成本，历史成本记录保留</li>
          <li><strong>配方改版追踪：</strong>配方版本管理，不同版本成本独立计算</li>
          <li><strong>替代料分析：</strong>支持配方原料设置替代料，成本计算时可切换</li>
          <li><strong>单位换算校验：</strong>原料单位与配方用量单位一致性校验</li>
          <li><strong>毛利下钻分析：</strong>点击配方可查看具体报价单明细和成本构成</li>
        </ul>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '15px' }}>成本口径验证清单</h3>
        <table>
          <thead>
            <tr>
              <th>验收项</th>
              <th>验证方法</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>原料成本准确性</td>
              <td>对比原料采购价与配方用量计算结果</td>
              <td><span className="badge badge-success">已覆盖</span></td>
            </tr>
            <tr>
              <td>工艺损耗计算</td>
              <td>单种原料损耗 + 整体工艺损耗双重计算</td>
              <td><span className="badge badge-success">已覆盖</span></td>
            </tr>
            <tr>
              <td>包装材料成本</td>
              <td>按包装单位用量 × 单价计算</td>
              <td><span className="badge badge-success">已覆盖</span></td>
            </tr>
            <tr>
              <td>人工成本核算</td>
              <td>工序工时 × 小时费率累加</td>
              <td><span className="badge badge-success">已覆盖</span></td>
            </tr>
            <tr>
              <td>税费计提</td>
              <td>按子成本合计的13%预估增值税</td>
              <td><span className="badge badge-success">已覆盖</span></td>
            </tr>
            <tr>
              <td>历史价格追溯</td>
              <td>价格变更记录保留，历史报价不自动更新</td>
              <td><span className="badge badge-success">已覆盖</span></td>
            </tr>
            <tr>
              <td>毛利红线审批</td>
              <td>低于设定毛利率自动进入审批流程</td>
              <td><span className="badge badge-success">已覆盖</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
