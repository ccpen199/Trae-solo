import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Spin, message, Tag, DatePicker, Statistic, Row, Col, Select } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, WarningOutlined, TeamOutlined } from '@ant-design/icons';
import { api } from '../../api';
import { AttendanceRecord, ConstructionProject } from '../../types';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';

const { MonthPicker } = DatePicker;
const { Option } = Select;

const Attendance: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [projects, setProjects] = useState<ConstructionProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | undefined>(undefined);
  const [month, setMonth] = useState<Dayjs>(dayjs());

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.projects.getMy();
        setProjects(res.data || []);
      } catch (error: any) {
        message.error(error.response?.data?.error || '获取项目列表失败');
      }
    };
    fetchProjects();
  }, []);

  const fetchAttendance = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const res = await api.attendance.getProject({
        projectId: selectedProject,
        year: month.year(),
        month: month.month() + 1
      });
      setRecords(res.data || []);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取考勤记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProject) {
      fetchAttendance();
    }
  }, [selectedProject, month]);

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      normal: '正常',
      late: '迟到',
      early_leave: '早退',
      absent: '旷工',
      overtime: '加班'
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      normal: 'green',
      late: 'orange',
      early_leave: 'orange',
      absent: 'red',
      overtime: 'blue'
    };
    return map[status] || 'default';
  };

  const statistics = {
    totalRecords: records.length,
    normalCount: records.filter(r => r.status === 'normal').length,
    lateCount: records.filter(r => r.status === 'late').length,
    absentCount: records.filter(r => r.status === 'absent').length,
    overtimeCount: records.filter(r => r.status === 'overtime').length,
    totalHours: records.reduce((sum, r) => sum + (r.workHours || 0), 0).toFixed(1),
    workerCount: new Set(records.map(r => r.workerId)).size
  };

  const columns: ColumnsType<AttendanceRecord> = [
    {
      title: '工人信息',
      key: 'worker',
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.realName || record.username || '-'}</div>
          <div style={{ color: '#8c8c8c', fontSize: '12px' }}>ID: {record.workerId}</div>
        </div>
      )
    },
    {
      title: '日期',
      dataIndex: 'checkInTime',
      key: 'date',
      width: 180,
      render: (time) => time ? new Date(time).toLocaleDateString('zh-CN') : '-'
    },
    {
      title: '所属项目',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 200,
      render: (text) => text || '-'
    },
    {
      title: '上班打卡',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      width: 180,
      render: (time) => time ? new Date(time).toLocaleTimeString('zh-CN') : '未打卡'
    },
    {
      title: '下班打卡',
      dataIndex: 'checkOutTime',
      key: 'checkOutTime',
      width: 180,
      render: (time) => time ? new Date(time).toLocaleTimeString('zh-CN') : '未打卡'
    },
    {
      title: '工作时长',
      dataIndex: 'workHours',
      key: 'workHours',
      width: 120,
      render: (hours) => hours !== undefined ? `${hours}小时` : '-'
    },
    {
      title: '考勤状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '验证状态',
      key: 'verification',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.checkInGeofenceVerified ? (
            <Tag color="green">✓ 地点合规</Tag>
          ) : record.checkInTime ? (
            <Tag color="red">✗ 地点异常</Tag>
          ) : <Tag color="default">未打卡</Tag>}
          {record.checkInFaceVerified ? (
            <Tag color="green">✓ 人脸通过</Tag>
          ) : record.checkInTime ? (
            <Tag color="red">✗ 人脸未验证</Tag>
          ) : null}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="考勤总记录"
              value={statistics.totalRecords}
              suffix="条"
              prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="正常出勤"
              value={statistics.normalCount}
              suffix="条"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="异常记录"
              value={statistics.lateCount + statistics.absentCount}
              suffix="条"
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="总工时"
              value={statistics.totalHours}
              suffix="小时"
              prefix={<ClockCircleOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="项目考勤管理"
        extra={
          <Space>
            <span style={{ color: '#666' }}>选择项目：</span>
            <Select
              placeholder="请选择项目"
              style={{ width: 200 }}
              value={selectedProject}
              onChange={setSelectedProject}
              showSearch
              optionFilterProp="children"
            >
              {projects.map((project) => (
                <Option key={project.id} value={project.id}>
                  {project.projectName}
                </Option>
              ))}
            </Select>
            <MonthPicker
              value={month}
              onChange={(value) => value && setMonth(value)}
              format="YYYY年MM月"
            />
            <Button
              type="primary"
              onClick={fetchAttendance}
              loading={loading}
              disabled={!selectedProject}
            >
              查询
            </Button>
            <span style={{ color: '#8c8c8c', marginLeft: '8px' }}>
              共 {statistics.workerCount} 名工人
            </span>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={records}
            rowKey="id"
            scroll={{ x: 1400 }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default Attendance;
