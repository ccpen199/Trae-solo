import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, message, Button, Typography } from 'antd';
import { IdcardOutlined, StarOutlined, FileTextOutlined, ClockCircleOutlined, FolderOutlined, BookOutlined, CalendarOutlined, DollarOutlined, PlusOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { api } from '../api';
import { TradeCertification, LaborContract, AttendanceRecord } from '../types';
import { useAppStore } from '../store';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const { user } = useAppStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [certifications, setCertifications] = useState<TradeCertification[]>([]);
  const [contracts, setContracts] = useState<LaborContract[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [certRes, contractRes, attendRes, jobRes] = await Promise.all([
        api.certifications.getMy(),
        api.contracts.getMy({ status: 'signed' }),
        api.attendance.getMy({
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1
        }),
        api.jobs.getAll()
      ]);
      setCertifications(certRes.data || []);
      setContracts(contractRes.data || []);
      setAttendance(attendRes.data || []);
      setJobs(jobRes.data?.data || jobRes.data || []);
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const verifiedCount = certifications.filter(c => c.verificationStatus === 'verified').length;
  const totalHours = attendance.reduce((sum, record) => sum + (record.workHours || 0), 0);
  const pendingContracts = contracts.filter(c => c.status === 'draft').length;

  const quickActions = [
    { title: '工种认证', desc: '焊工证、塔吊操作证等', icon: <IdcardOutlined style={{ fontSize: '32px', color: '#1890ff' }} />, action: () => navigate('/certifications/submit'), color: '#e6f7ff', borderColor: '#91d5ff' },
    { title: '技能评定', desc: '在线考试+实操视频', icon: <BookOutlined style={{ fontSize: '32px', color: '#faad14' }} />, action: () => navigate('/assessments'), color: '#fffbe6', borderColor: '#ffe58f' },
    { title: '找工作', desc: '海量优质岗位', icon: <FolderOutlined style={{ fontSize: '32px', color: '#52c41a' }} />, action: () => navigate('/jobs'), color: '#f6ffed', borderColor: '#b7eb8f' },
    { title: '考勤打卡', desc: '今日上班打卡', icon: <CalendarOutlined style={{ fontSize: '32px', color: '#eb2f96' }} />, action: () => navigate('/attendance/check'), color: '#fff0f6', borderColor: '#ffadd2' },
    { title: '我的合同', desc: `${pendingContracts}份待签署`, icon: <FileTextOutlined style={{ fontSize: '32px', color: '#722ed1' }} />, action: () => navigate('/contracts'), color: '#f9f0ff', borderColor: '#d3adf7' },
    { title: '工资条', desc: '查看工资明细', icon: <DollarOutlined style={{ fontSize: '32px', color: '#fa8c16' }} />, action: () => navigate('/payrolls'), color: '#fff7e6', borderColor: '#ffd591' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          欢迎回来，{user?.realName || user?.username} 👋
        </Title>
        <Text type="secondary" style={{ fontSize: '14px', marginTop: '8px', display: 'block' }}>
          今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </Text>
      </div>

      <Spin spinning={loading}>
        <Title level={4} style={{ marginTop: 0 }}>📊 我的数据</Title>
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="工种认证"
                value={verifiedCount}
                suffix={`/ ${certifications.length}`}
                prefix={<IdcardOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
              <p style={{ marginTop: '8px', color: '#8c8c8c', fontSize: '12px', marginBottom: 0 }}>
                已通过认证 / 总认证数
              </p>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="技能等级"
                value={user?.skillLevel || 0}
                suffix="级"
                prefix={<StarOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
              <p style={{ marginTop: '8px', color: '#8c8c8c', fontSize: '12px', marginBottom: 0 }}>
                当前技能等级
              </p>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="在岗合同"
                value={contracts.length}
                suffix="份"
                prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
              <p style={{ marginTop: '8px', color: '#8c8c8c', fontSize: '12px', marginBottom: 0 }}>
                正在履行的合同
              </p>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="本月工时"
                value={totalHours}
                suffix="小时"
                prefix={<ClockCircleOutlined style={{ color: '#eb2f96' }} />}
                valueStyle={{ color: '#eb2f96' }}
              />
              <p style={{ marginTop: '8px', color: '#8c8c8c', fontSize: '12px', marginBottom: 0 }}>
                累计工作时长
              </p>
            </Card>
          </Col>
        </Row>

        <Title level={4}>⚡ 快捷入口</Title>
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          {quickActions.map((action, index) => (
            <Col xs={24} sm={12} md={8} lg={4} key={index}>
              <Card
                hoverable
                onClick={action.action}
                style={{
                  textAlign: 'center',
                  background: action.color,
                  borderColor: action.borderColor,
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                bodyStyle={{ padding: '24px 16px' }}
              >
                <div style={{ marginBottom: '12px' }}>{action.icon}</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>{action.title}</div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{action.desc}</div>
                <div style={{ marginTop: '12px', color: '#1890ff', fontSize: '12px' }}>
                  立即办理 <ArrowRightOutlined />
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <Title level={4}>🔥 最新岗位推荐</Title>
        <Row gutter={[16, 16]}>
          {jobs.length > 0 ? jobs.slice(0, 4).map((job: any) => (
            <Col xs={24} sm={12} lg={6} key={job.id}>
              <Card
                hoverable
                onClick={() => navigate(`/jobs/${job.id}`)}
                style={{ cursor: 'pointer' }}
                bodyStyle={{ padding: '20px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>{job.title}</div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{job.enterpriseName}</div>
                  </div>
                  <div style={{ color: '#f5222d', fontSize: '16px', fontWeight: 'bold' }}>
                    ¥{job.salaryMin / 1000}-{job.salaryMax / 1000}K
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#595959', marginBottom: '12px' }}>
                  <span style={{ marginRight: '12px' }}>📍 {job.workLocation}</span>
                  <span>📋 {job.salaryType === 'daily' ? '日薪' : job.salaryType === 'piece' ? '计件' : '月薪'}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {job.requirements?.slice(0, 2).map((req: string, i: number) => (
                    <span key={i} style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      background: '#f0f5ff',
                      color: '#1890ff',
                      borderRadius: '4px'
                    }}>{req}</span>
                  ))}
                </div>
              </Card>
            </Col>
          )) : (
            <Col span={24}>
              <Card style={{ textAlign: 'center', color: '#8c8c8c' }}>
                <p>暂无岗位推荐</p>
                <Button type="primary" onClick={() => navigate('/jobs')}>
                  查看全部岗位 <ArrowRightOutlined />
                </Button>
              </Card>
            </Col>
          )}
        </Row>
      </Spin>
    </div>
  );
};

export default Dashboard;
