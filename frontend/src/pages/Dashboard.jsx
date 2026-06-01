import { useState, useEffect } from 'react'
import { common } from '../api'

export default function Dashboard({ currentUser }) {
  const [stats, setStats] = useState({})

  useEffect(() => {
    if (currentUser) {
      loadStats()
    }
  }, [currentUser])

  async function loadStats() {
    const data = await common.getStats(currentUser.id, currentUser.role)
    setStats(data)
  }

  const roleNames = {
    manager: '客户经理',
    specialist: '资料专员',
    reviewer: '初审人员',
    director: '审批主管'
  }

  const roleFeatures = {
    manager: [
      { icon: '👤', title: '客户建档', desc: '录入客户基本信息，选择贷款产品，系统自动生成资料清单' },
      { icon: '📋', title: '资料提交', desc: '收集并提交客户资料，跟踪审核进度，处理补件通知' },
      { icon: '🔍', title: '征信授权', desc: '发起征信授权查询，记录征信状态，确保审批流程顺利进行' },
      { icon: '📈', title: '进度跟踪', desc: '实时查看客户审批进度，及时跟进处理中的环节' }
    ],
    specialist: [
      { icon: '📄', title: '资料审核', desc: '审核客户提交的各类资料，确保文件完整、合规' },
      { icon: '✏️', title: '补件处理', desc: '标记不合格资料，说明补正原因，推送客户经理处理' },
      { icon: '✅', title: '资料通过', desc: '审核通过的资料自动进入下一流程，通知相关人员' },
      { icon: '📊', title: '资料统计', desc: '查看资料审核统计，掌握当前审核工作量和进度' }
    ],
    reviewer: [
      { icon: '🔍', title: '初审审批', desc: '对资料齐全的客户进行初审，出具审批意见' },
      { icon: '⚠️', title: '风险提示', desc: '识别潜在风险点，记录风险提示，为终审提供参考' },
      { icon: '💰', title: '额度建议', desc: '根据客户资质，给出合理的贷款额度建议' },
      { icon: '📝', title: '初审记录', desc: '保留完整审批记录，退回后保留完整审批链路' }
    ],
    director: [
      { icon: '🏛️', title: '终审审批', desc: '对初审通过的客户进行终审，做出最终决策' },
      { icon: '📊', title: '综合评估', desc: '综合评估客户资质、征信情况、初审意见，做出准确判断' },
      { icon: '🔒', title: '额度审批', desc: '最终确定贷款额度，把控整体贷款风险' },
      { icon: '📈', title: '审批统计', desc: '查看审批数据统计，掌握整体业务进度和质量' }
    ]
  }

  const statLabels = {
    manager: [
      { key: 'totalCustomers', label: '我的客户', icon: '👥' },
      { key: 'pendingDocs', label: '待审核资料', icon: '📄', class: 'warning' },
      { key: 'approvedCount', label: '已通过审批', icon: '✅', class: 'info' }
    ],
    specialist: [
      { key: 'totalCustomers', label: '客户总数', icon: '👥' },
      { key: 'pendingDocs', label: '待审核资料', icon: '📄', class: 'warning' },
      { key: 'approvedCount', label: '已通过审批', icon: '✅', class: 'info' }
    ],
    reviewer: [
      { key: 'totalCustomers', label: '客户总数', icon: '👥' },
      { key: 'pendingApprovals', label: '待初审案件', icon: '📋', class: 'warning' },
      { key: 'approvedCount', label: '已通过审批', icon: '✅', class: 'info' }
    ],
    director: [
      { key: 'totalCustomers', label: '客户总数', icon: '👥' },
      { key: 'pendingApprovals', label: '待终审案件', icon: '📋', class: 'warning' },
      { key: 'approvedCount', label: '已通过审批', icon: '✅', class: 'info' }
    ]
  }

  const currentStats = statLabels[currentUser?.role] || statLabels.manager
  const currentFeatures = roleFeatures[currentUser?.role] || roleFeatures.manager

  return (
    <div className="dashboard">
      <div className="welcome-card">
        <h2>欢迎回来，{currentUser?.name}</h2>
        <p>您当前的角色是：<span className="role-tag">{roleNames[currentUser?.role]}</span></p>
      </div>

      <div className="stats-grid">
        {currentStats.map((stat, idx) => (
          <div key={idx} className={`stat-card ${stat.class || ''}`}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <div className="stat-value">{stats[stat.key] || 0}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="info-section">
        <h3>📖 我的工作台功能</h3>
        <div className="features-grid">
          {currentFeatures.map((feature, idx) => (
            <div key={idx} className="feature-card">
              <h4>{feature.icon} {feature.title}</h4>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
