import { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Space, Empty, message, Tabs } from 'antd';
import { PlusOutlined, EyeOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { profileAPI, jobsAPI } from '../utils/api';

function MyJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const fallbackApplications = [
    {
      id: 'demo-match-1',
      job_id: 1,
      title: '地铁站木工班组补员',
      company_name: '中建三局华北项目部',
      daily_salary: 480,
      match_score: 92,
      status: 'accepted',
      created_at: '2026-06-04T09:30:00',
      guarantee_status: '押金已托管',
      attendance_status: '今日已打卡 8.0 小时',
      confirm_status: '企业待复核'
    },
    {
      id: 'demo-match-2',
      job_id: 2,
      title: '钢筋工短期支援',
      company_name: '华东基础工程有限公司',
      daily_salary: 520,
      match_score: 88,
      status: 'pending',
      created_at: '2026-06-04T10:15:00',
      guarantee_status: '待缴履约押金',
      attendance_status: '未开始',
      confirm_status: '等待项目方确认'
    }
  ];

  const fallbackCompanyJobs = [
    {
      id: 'demo-job-1',
      title: '旋挖钻机手实名招募',
      skill_required: '旋挖钻机手',
      daily_salary: 680,
      start_date: '2026-06-05',
      end_date: '2026-06-20',
      status: 'open',
      created_at: '2026-06-04T08:00:00',
      applicants_count: 4,
      compliance_status: '安全培训证明齐全'
    }
  ];

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await profileAPI.getMyJobs();
      if (user?.role === 'company') {
        setJobs(res.data);
      } else {
        setApplications(res.data);
      }
    } catch (error) {
      console.error('Load data error:', error);
    }
  };

  const handleAcceptApplication = async (matchId) => {
    setLoading(true);
    try {
      await jobsAPI.acceptMatch(matchId);
      message.success('已接受申请');
      loadData();
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      open: { color: 'green', text: '招聘中' },
      matched: { color: 'blue', text: '已匹配' },
      accepted: { color: 'blue', text: '已接受' },
      pending: { color: 'orange', text: '待确认' },
      in_progress: { color: 'orange', text: '进行中' },
      completed: { color: 'gray', text: '已完成' },
      cancelled: { color: 'red', text: '已取消' },
      rejected: { color: 'red', text: '已拒绝' }
    };
    const s = statusMap[status] || { color: 'default', text: status };
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  const companyColumns = [
    {
      title: '招工标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <a onClick={() => navigate(`/jobs/${record.id}`)}>{text}</a>
      )
    },
    { title: '工种', dataIndex: 'skill_required', key: 'skill_required' },
    { title: '日薪', dataIndex: 'daily_salary', key: 'daily_salary', render: v => `¥${v}/天` },
    { title: '工期', dataIndex: 'start_date', key: 'date', render: (_, r) => `${r.start_date} ~ ${r.end_date}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: s => getStatusTag(s) },
    { title: '报名管理', dataIndex: 'applicants_count', key: 'applicants_count', render: v => `${v || 0} 人报名` },
    { title: '合规复查', dataIndex: 'compliance_status', key: 'compliance_status', render: v => <Tag color="blue">{v || '待复查'}</Tag> },
    { title: '发布时间', dataIndex: 'created_at', key: 'created_at', render: t => t?.split('T')[0] },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/jobs/${record.id}`)}>
            查看
          </Button>
        </Space>
      )
    }
  ];

  const workerColumns = [
    {
      title: '招工标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <a onClick={() => navigate(`/jobs/${record.job_id}`)}>{text}</a>
      )
    },
    { title: '企业', dataIndex: 'company_name', key: 'company_name' },
    { title: '日薪', dataIndex: 'daily_salary', key: 'daily_salary', render: v => `¥${v}/天` },
    { title: '匹配度', dataIndex: 'match_score', key: 'match_score', render: s => <Tag color="green">{s}%</Tag> },
    { title: '申请状态', dataIndex: 'status', key: 'status', render: s => getStatusTag(s) },
    { title: '保证金', dataIndex: 'guarantee_status', key: 'guarantee_status', render: v => <Tag color="purple">{v || '待托管'}</Tag> },
    { title: '工时确认', dataIndex: 'attendance_status', key: 'attendance_status', render: v => v || '-' },
    { title: '企业复核', dataIndex: 'confirm_status', key: 'confirm_status', render: v => <Tag color="orange">{v || '待确认'}</Tag> },
    { title: '申请时间', dataIndex: 'created_at', key: 'created_at', render: t => t?.split('T')[0] },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/jobs/${record.job_id}`)}>
          查看
        </Button>
      )
    }
  ];

  return (
    <div className="page-container">
      <Card
        title="我的招工"
        extra={user?.role === 'company' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/create-job')}>
            发布招工
          </Button>
        )}
      >
        {user?.role === 'company' ? (
          <Table
            columns={companyColumns}
            dataSource={jobs.length > 0 ? jobs : fallbackCompanyJobs}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: <Empty description="暂无招工，点击右上角发布" /> }}
          />
        ) : (
          <Table
            columns={workerColumns}
            dataSource={applications.length > 0 ? applications : fallbackApplications}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: <Empty description="暂无申请，去招工大厅看看" /> }}
          />
        )}
      </Card>
    </div>
  );
}

export default MyJobs;
