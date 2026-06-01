import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../App';
import { dashboardAPI } from '../api';

function Dashboard() {
  const user = useContext(UserContext);
  const [stats, setStats] = useState({
    change_count: 0,
    visa_count: 0,
    pending_approval: 0,
    total_settlement_amount: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await dashboardAPI.getStats();
      setStats(res.data);
    } catch (err) {
      console.error('加载统计数据失败', err);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount);
  };

  const getRoleInstructions = () => {
    switch (user.role) {
      case 'construction':
        return (
          <>
            <p><strong>我的职责：</strong>负责发起变更申请、填写签证单、提交审批、处理退回修改</p>
            <p><strong>变更申请：</strong>记录合同、标段、变更原因、影响范围、图纸依据、现场照片和预计费用。<span style={{ color: '#dc2626' }}>缺少现场照片不能提交审批</span>。</p>
            <p><strong>签证单：</strong>维护工程量、单价、计算式、附件和责任单位，提交后等待造价复核。</p>
            <p><strong>注意事项：</strong>审批被退回时，请根据意见修改后重新提交。</p>
          </>
        );
      case 'supervision':
        return (
          <>
            <p><strong>我的职责：</strong>审核变更申请的真实性、核查现场情况、确认签证工程量</p>
            <p><strong>变更申请审核：</strong>核实变更原因是否属实，现场情况是否与描述一致。</p>
            <p><strong>签证单审核：</strong>确认工程量是否准确，是否符合现场实际情况。</p>
            <p><strong>注意事项：</strong>请在"待我审批"中查看需要您审批的事项。</p>
          </>
        );
      case 'owner':
        return (
          <>
            <p><strong>我的职责：</strong>最终确认变更的必要性、审批费用调整、把控项目整体成本</p>
            <p><strong>变更审批：</strong>确认变更是否必要，是否符合项目整体规划。</p>
            <p><strong>费用把控：</strong>审核费用调整的合理性，控制项目预算。</p>
            <p><strong>注意事项：</strong>签证单金额超过10万元时，需成本部门参与审批。</p>
          </>
        );
      case 'cost':
        return (
          <>
            <p><strong>我的职责：</strong>造价复核、费用测算、成本部门审批、结算依据归档</p>
            <p><strong>造价复核：</strong>对施工单位提交的签证单进行造价审核，可退回修改。</p>
            <p><strong>成本审批：</strong>对金额超限（10万元以上）的签证单进行最终审批。</p>
            <p><strong>结算归档：</strong>将已完成审批的签证单归档为结算依据，供后续结算使用。</p>
          </>
        );
      case 'admin':
      default:
        return (
          <>
            <p><strong>变更申请：</strong>记录合同、标段、变更原因、影响范围、图纸依据、现场照片和预计费用。资料不全（缺少现场照片）不能提交审批。</p>
            <p><strong>签证单：</strong>维护工程量、单价、计算式、附件和责任单位。造价人员可以复核并退回修改。</p>
            <p><strong>审批中心：</strong>区分施工、监理、业主和成本部门意见。签证单金额超过10万元时，自动升级增加成本部门审批。</p>
            <p><strong>结算依据：</strong>归档最终签证、审批记录、费用调整和关联合同，后续结算可直接引用。</p>
          </>
        );
    }
  };

  const getRoleTitle = () => {
    const titles = {
      admin: '系统管理员',
      construction: '施工单位',
      supervision: '监理单位',
      owner: '业主方',
      cost: '成本部门'
    };
    return titles[user.role] || user.role;
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">首页概览</h2>
        <span className="badge" style={{ background: '#dbeafe', color: '#1e40af', padding: '6px 12px', fontSize: '14px' }}>
          {getRoleTitle()}工作台
        </span>
      </div>

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-value">{stats.change_count}</div>
          <div className="stat-label">变更申请总数</div>
        </div>
        <div className="stat-card success">
          <div className="stat-value">{stats.visa_count}</div>
          <div className="stat-label">签证单总数</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-value">{stats.pending_approval}</div>
          <div className="stat-label">待审批事项</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-value amount-large">{formatAmount(stats.total_settlement_amount)}</div>
          <div className="stat-label">累计结算金额</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">我的工作台说明</h3>
        </div>
        <div style={{ lineHeight: 1.8 }}>
          {getRoleInstructions()}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">业务流程图</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '20px 0' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: user.role === 'construction' ? '#bfdbfe' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <span style={{ fontSize: '24px' }}>📝</span>
            </div>
            <div style={{ fontWeight: '500' }}>变更申请</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>施工单位</div>
          </div>
          <div style={{ color: '#94a3b8', fontSize: '24px' }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: user.role === 'construction' ? '#a7f3d0' : '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <span style={{ fontSize: '24px' }}>📋</span>
            </div>
            <div style={{ fontWeight: '500' }}>现场签证</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>施工单位</div>
          </div>
          <div style={{ color: '#94a3b8', fontSize: '24px' }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: user.role === 'cost' ? '#fde68a' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <span style={{ fontSize: '24px' }}>💰</span>
            </div>
            <div style={{ fontWeight: '500' }}>造价复核</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>成本部门</div>
          </div>
          <div style={{ color: '#94a3b8', fontSize: '24px' }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <span style={{ fontSize: '24px' }}>✅</span>
            </div>
            <div style={{ fontWeight: '500' }}>多级审批</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>施工→监理→业主→成本</div>
          </div>
          <div style={{ color: '#94a3b8', fontSize: '24px' }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: user.role === 'cost' || user.role === 'owner' ? '#c7d2fe' : '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <span style={{ fontSize: '24px' }}>📊</span>
            </div>
            <div style={{ fontWeight: '500' }}>结算归档</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>成本/业主</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
