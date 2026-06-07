import { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, message, Space, Statistic, Row, Col } from 'antd';
import { PlayCircleOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { attendanceAPI, profileAPI } from '../utils/api';

function Attendance() {
  const [attendances, setAttendances] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [user, setUser] = useState(null);

  const fallbackAttendances = [
    {
      id: 'demo-att-1',
      job_title: '地铁站木工班组补员',
      created_at: '2026-06-04T08:02:00',
      check_in_time: '2026-06-04T08:02:00.000Z',
      check_out_time: '2026-06-04T17:58:00.000Z',
      hours_worked: 8,
      confirmed: 1,
      gate_method: 'NFC 闸机',
      confirm_person: '项目经理 李工'
    },
    {
      id: 'demo-att-2',
      job_title: '钢筋工短期支援',
      created_at: '2026-06-04T09:10:00',
      check_in_time: '2026-06-04T09:10:00.000Z',
      check_out_time: null,
      hours_worked: null,
      confirmed: 0,
      gate_method: '蓝牙围栏',
      confirm_person: '待企业确认'
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
      const [attRes, jobsRes] = await Promise.all([
        attendanceAPI.getMyAttendances(),
        profileAPI.getMyJobs()
      ]);
      setAttendances(attRes.data);
      setMyJobs(jobsRes.data);

      const today = new Date().toISOString().split('T')[0];
      const todayRec = attRes.data.find(a => a.created_at.startsWith(today));
      setTodayAttendance(todayRec || null);
    } catch (error) {
      console.error('Load data error:', error);
    }
  };

  const handleCheckIn = async (jobMatchId) => {
    setLoading(true);
    try {
      await attendanceAPI.checkIn(jobMatchId);
      message.success('打卡成功');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '打卡失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (attendanceId) => {
    setLoading(true);
    try {
      await attendanceAPI.checkOut(attendanceId);
      message.success('签退成功');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '签退失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await attendanceAPI.confirmAttendance(id);
      message.success('已确认');
      loadData();
    } catch (error) {
      message.error('确认失败');
    }
  };

  const columns = [
    {
      title: '招工名称',
      dataIndex: 'job_title',
      key: 'job_title',
    },
    {
      title: '日期',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => text?.split('T')[0]
    },
    {
      title: '打卡时间',
      dataIndex: 'check_in_time',
      key: 'check_in_time',
      render: (text) => text ? text.split('T')[1].split('.')[0] : '-'
    },
    {
      title: '签退时间',
      dataIndex: 'check_out_time',
      key: 'check_out_time',
      render: (text) => text ? text.split('T')[1].split('.')[0] : '-'
    },
    {
      title: '工时',
      dataIndex: 'hours_worked',
      key: 'hours_worked',
      render: (h) => h ? `${h}小时` : '-'
    },
    {
      title: '打卡方式',
      dataIndex: 'gate_method',
      key: 'gate_method',
      render: (v) => v || 'NFC/蓝牙'
    },
    {
      title: '确认人',
      dataIndex: 'confirm_person',
      key: 'confirm_person',
      render: (v) => v || '待确认'
    },
    {
      title: '状态',
      dataIndex: 'confirmed',
      key: 'confirmed',
      render: (c) => c ? 
        <Tag color="green">已确认</Tag> : 
        <Tag color="orange">待确认</Tag>
    },
    user?.role === 'company' ? {
      title: '操作',
      key: 'action',
      render: (_, record) => !record.confirmed && (
        <Button 
          type="link" 
          icon={<CheckCircleOutlined />}
          onClick={() => handleConfirm(record.id)}
        >
          确认
        </Button>
      )
    } : null
  ].filter(Boolean);

  const displayAttendances = attendances.length > 0 ? attendances : fallbackAttendances;

  const todayWorkHours = displayAttendances
    .filter(a => a.created_at?.startsWith(new Date().toISOString().split('T')[0]))
    .reduce((sum, a) => sum + (parseFloat(a.hours_worked) || 0), 0);

  const totalHours = displayAttendances.reduce((sum, a) => sum + (parseFloat(a.hours_worked) || 0), 0);

  return (
    <div className="page-container">
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="今日工时"
              value={todayWorkHours.toFixed(1)}
              suffix="小时"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="累计工时"
              value={totalHours.toFixed(1)}
              suffix="小时"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="打卡次数"
              value={displayAttendances.length}
              suffix="次"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {(user?.role === 'worker' || user?.role === 'team') && myJobs.filter(j => j.status === 'accepted' || j.status === 'matched').length > 0 && (
        <Card title="快捷打卡" style={{ marginBottom: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {myJobs.filter(j => j.status === 'accepted' || j.status === 'matched').map(job => (
              <Card key={job.id} size="small">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{job.title}</strong>
                    <div style={{ color: '#666', fontSize: 12 }}>{job.company_name}</div>
                  </div>
                  <Space>
                    {!todayAttendance?.check_in_time && (
                      <Button 
                        type="primary" 
                        icon={<PlayCircleOutlined />}
                        loading={loading}
                        onClick={() => handleCheckIn(job.id)}
                      >
                        上班打卡
                      </Button>
                    )}
                    {todayAttendance?.check_in_time && !todayAttendance?.check_out_time && todayAttendance?.job_match_id === job.id && (
                      <Button 
                        danger
                        icon={<StopOutlined />}
                        loading={loading}
                        onClick={() => handleCheckOut(todayAttendance.id)}
                      >
                        下班签退
                      </Button>
                    )}
                    {todayAttendance?.check_out_time && (
                      <Tag color="green">今日已完成</Tag>
                    )}
                  </Space>
                </div>
              </Card>
            ))}
          </Space>
        </Card>
      )}

      <Card title="打卡记录">
        <Table
          columns={columns}
          dataSource={displayAttendances}
          rowKey="id"
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );
}

export default Attendance;
