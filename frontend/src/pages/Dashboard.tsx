import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Spin, message } from 'antd';
import {
  BugOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { bugApi, projectApi } from '@/services/api';
import { Bug, Project, BugStatus, BugSeverity } from '@/types';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    resolved: 0,
    closed: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bugsResponse, projectsResponse] = await Promise.all([
        bugApi.getBugs({ pageSize: 10, sortBy: 'createdAt', sortOrder: 'DESC' }),
        projectApi.getProjects({ pageSize: 5 }),
      ]);

      if (bugsResponse.success && bugsResponse.data) {
        setBugs(bugsResponse.data);
        const pagination = bugsResponse.pagination;
        if (pagination) {
          const bugsList = bugsResponse.data;
          setStats({
            total: pagination.total,
            open: bugsList.filter(
              (b) =>
                [BugStatus.NEW, BugStatus.ASSIGNED, BugStatus.IN_PROGRESS, BugStatus.REOPENED].includes(
                  b.status
                )
            ).length,
            resolved: bugsList.filter((b) => b.status === BugStatus.RESOLVED).length,
            closed: bugsList.filter((b) => b.status === BugStatus.CLOSED).length,
          });
        }
      }

      if (projectsResponse.success && projectsResponse.data) {
        setProjects(projectsResponse.data);
      }
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: BugStatus) => {
    const statusMap: Record<BugStatus, { color: string; text: string }> = {
      [BugStatus.NEW]: { color: 'blue', text: '新建' },
      [BugStatus.ASSIGNED]: { color: 'orange', text: '已分配' },
      [BugStatus.IN_PROGRESS]: { color: 'processing', text: '进行中' },
      [BugStatus.RESOLVED]: { color: 'cyan', text: '已解决' },
      [BugStatus.VERIFIED]: { color: 'purple', text: '已验证' },
      [BugStatus.REOPENED]: { color: 'red', text: '重开' },
      [BugStatus.CLOSED]: { color: 'success', text: '已关闭' },
      [BugStatus.REJECTED]: { color: 'default', text: '已拒绝' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getSeverityText = (severity: BugSeverity) => {
    const severityMap: Record<BugSeverity, { text: string; className: string }> = {
      [BugSeverity.CRITICAL]: { text: '严重', className: 'severity-critical' },
      [BugSeverity.HIGH]: { text: '高', className: 'severity-high' },
      [BugSeverity.MEDIUM]: { text: '中', className: 'severity-medium' },
      [BugSeverity.LOW]: { text: '低', className: 'severity-low' },
      [BugSeverity.TRIVIAL]: { text: '轻微', className: 'severity-trivial' },
    };
    const config = severityMap[severity] || { text: severity, className: '' };
    return <span className={config.className}>{config.text}</span>;
  };

  const bugColumns = [
    {
      title: 'Bug编号',
      dataIndex: 'bugNumber',
      key: 'bugNumber',
      width: 120,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: BugStatus) => getStatusTag(status),
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 80,
      render: (severity: BugSeverity) => getSeverityText(severity),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  const projectColumns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '项目代码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>{active ? '激活' : '停用'}</Tag>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <div className="page-header">
        <h1 className="page-title">仪表板</h1>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="Bug总数"
              value={stats.total}
              prefix={<BugOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="待处理Bug"
              value={stats.open}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="已解决Bug"
              value={stats.resolved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="已关闭Bug"
              value={stats.closed}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={14}>
          <Card title="最新Bug列表" extra={<a href="/bugs">查看全部</a>}>
            <Table
              columns={bugColumns}
              dataSource={bugs}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="项目列表" extra={<a href="/projects">查看全部</a>}>
            <Table
              columns={projectColumns}
              dataSource={projects}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </Spin>
  );
};

export default Dashboard;
