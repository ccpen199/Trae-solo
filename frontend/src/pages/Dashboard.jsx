import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { resultAPI, todoAPI, planAPI, assessmentAPI } from '../api';

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const [riskDistribution, setRiskDistribution] = useState({});
  const [todoCounts, setTodoCounts] = useState({});
  const [activePlans, setActivePlans] = useState([]);
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  const [myAssessments, setMyAssessments] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (hasRole('admin', 'psychologist')) {
        const [riskRes, todoRes, plansRes, studentsRes] = await Promise.all([
          resultAPI.getRiskDistribution(),
          todoAPI.getCounts(),
          planAPI.getPlans({ status: 'active' }),
          resultAPI.getAtRiskStudents({ min_risk: 'mild' })
        ]);
        setRiskDistribution(riskRes.data);
        setTodoCounts(todoRes.data);
        setActivePlans(plansRes.data);
        setAtRiskStudents(studentsRes.data);
      } else if (hasRole('teacher')) {
        const [todoRes, plansRes, studentsRes] = await Promise.all([
          todoAPI.getCounts(),
          planAPI.getPlans({ status: 'active' }),
          resultAPI.getAtRiskStudents({ min_risk: 'mild' })
        ]);
        setTodoCounts(todoRes.data);
        setActivePlans(plansRes.data);
        setAtRiskStudents(studentsRes.data);
      } else if (hasRole('student')) {
        const assessments = await assessmentAPI.getMyAssessments();
        setMyAssessments(assessments.data);
      }
    } catch (error) {
      console.error('Load dashboard error:', error);
    }
  };

  const getRiskBadge = (level) => {
    const badges = {
      severe: 'badge-severe',
      moderate: 'badge-moderate',
      mild: 'badge-mild',
      normal: 'badge-normal'
    };
    const labels = {
      severe: '严重风险',
      moderate: '中度风险',
      mild: '轻度风险',
      normal: '正常'
    };
    return <span className={`badge ${badges[level]}`}>{labels[level]}</span>;
  };

  const getStatusBadge = (status) => {
    const badges = {
      incomplete: 'badge-pending',
      submitted: 'badge-active',
      abnormal: 'badge-urgent'
    };
    const labels = {
      incomplete: '进行中',
      submitted: '已完成',
      abnormal: '异常'
    };
    return <span className={`badge ${badges[status]}`}>{labels[status]}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1>欢迎回来，{user.name}</h1>
      </div>

      {hasRole('admin', 'psychologist') && (
        <>
          <div className="grid grid-4">
            <div className="stat-card severe">
              <div className="label">严重风险</div>
              <div className="value">{riskDistribution.severe || 0}</div>
            </div>
            <div className="stat-card moderate">
              <div className="label">中度风险</div>
              <div className="value">{riskDistribution.moderate || 0}</div>
            </div>
            <div className="stat-card mild">
              <div className="label">轻度风险</div>
              <div className="value">{riskDistribution.mild || 0}</div>
            </div>
            <div className="stat-card normal">
              <div className="label">正常</div>
              <div className="value">{riskDistribution.normal || 0}</div>
            </div>
          </div>

          <div className="grid grid-2" style={{ marginTop: '20px' }}>
            <div className="card">
              <h2>待办事项</h2>
              <div className="grid grid-3">
                <div className="stat-card">
                  <div className="label">待处理</div>
                  <div className="value">{todoCounts.pending || 0}</div>
                </div>
                <div className="stat-card">
                  <div className="label">进行中</div>
                  <div className="value">{todoCounts.in_progress || 0}</div>
                </div>
                <div className="stat-card">
                  <div className="label">已完成</div>
                  <div className="value">{todoCounts.done || 0}</div>
                </div>
              </div>
            </div>

            <div className="card">
              <h2>进行中的测评计划</h2>
              {activePlans.length === 0 ? (
                <p style={{ color: '#666' }}>暂无进行中的测评计划</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>计划名称</th>
                      <th>量表</th>
                      <th>结束时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePlans.slice(0, 5).map(plan => (
                      <tr key={plan.id}>
                        <td>{plan.name}</td>
                        <td>{plan.scale_name}</td>
                        <td>{new Date(plan.end_time).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="card">
            <h2>需要关注的学生</h2>
            {atRiskStudents.length === 0 ? (
              <p style={{ color: '#666' }}>暂无需要关注的学生</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>学生姓名</th>
                    <th>年级班级</th>
                    <th>风险等级</th>
                    <th>测评计划</th>
                    <th>开放干预</th>
                  </tr>
                </thead>
                <tbody>
                  {atRiskStudents.slice(0, 10).map(student => (
                    <tr key={student.student_id}>
                      <td>{student.student_name}</td>
                      <td>{student.grade}年级{student.class}</td>
                      <td>{getRiskBadge(student.risk_level)}</td>
                      <td>{student.plan_name}</td>
                      <td>{student.open_interventions || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {hasRole('teacher') && (
        <>
          <div className="grid grid-3">
            <div className="stat-card">
              <div className="label">待办事项</div>
              <div className="value">{todoCounts.pending || 0}</div>
            </div>
            <div className="stat-card">
              <div className="label">进行中的计划</div>
              <div className="value">{activePlans.length}</div>
            </div>
            <div className="stat-card severe">
              <div className="label">需关注学生</div>
              <div className="value">{atRiskStudents.length}</div>
            </div>
          </div>

          <div className="card" style={{ marginTop: '20px' }}>
            <h2>本班需要关注的学生</h2>
            {atRiskStudents.length === 0 ? (
              <p style={{ color: '#666' }}>暂无需要关注的学生</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>学生姓名</th>
                    <th>风险等级</th>
                    <th>测评计划</th>
                    <th>开放干预</th>
                  </tr>
                </thead>
                <tbody>
                  {atRiskStudents.map(student => (
                    <tr key={student.student_id}>
                      <td>{student.student_name}</td>
                      <td>{getRiskBadge(student.risk_level)}</td>
                      <td>{student.plan_name}</td>
                      <td>{student.open_interventions || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {hasRole('student') && (
        <div className="card">
          <h2>我的测评</h2>
          {myAssessments.length === 0 ? (
            <p style={{ color: '#666' }}>暂无测评记录</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>测评计划</th>
                  <th>量表</th>
                  <th>进度</th>
                  <th>状态</th>
                  <th>截止时间</th>
                </tr>
              </thead>
              <tbody>
                {myAssessments.map(assessment => (
                  <tr key={assessment.id}>
                    <td>{assessment.plan_name}</td>
                    <td>{assessment.scale_name}</td>
                    <td>
                      <div className="progress-bar" style={{ width: '100px' }}>
                        <div className="progress-bar-fill" style={{ width: `${assessment.progress}%` }}></div>
                      </div>
                      <span style={{ marginLeft: '8px', fontSize: '12px' }}>{assessment.progress}%</span>
                    </td>
                    <td>{getStatusBadge(assessment.status)}</td>
                    <td>{new Date(assessment.end_time).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
