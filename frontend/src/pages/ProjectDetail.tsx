import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Button,
  Spin,
  message,
  Row,
  Col,
  Statistic,
  Tabs,
  Table,
  Tag,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { projectApi, bugApi, moduleApi } from '@/services/api';
import { BugStatus, BugSeverity } from '@/types';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [bugs, setBugs] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    resolved: 0,
    closed: 0,
  });

  useEffect(() => {
    if (id) {
      fetchProjectDetail();
    }
  }, [id]);

  const fetchProjectDetail = async () => {
    setLoading(true);
    try {
      const [projectRes, bugsRes, modulesRes] = await Promise.all([
        projectApi.getProjectById(id!),
        bugApi.getBugs({ projectId: id, pageSize: 100 }),
        moduleApi.getModuleTree(id!),
      ]);

      if (projectRes.success && projectRes.data) {
        setProject(projectRes.data);
      }

      if (bugsRes.success && bugsRes.data) {
        setBugs(bugsRes.data);
        const bugsList = bugsRes.data;
        setStats({
          total: bugsRes.pagination?.total || 0,
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

      if (modulesRes.success && modulesRes.data) {
        setModules(modulesRes.data);
      }
    } catch (error) {
      message.error('加载项目详情失败');
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
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  const tabItems = [
    {
      key: 'overview',
      label: '概览',
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic title="Bug总数" value={stats.total} valueStyle={{ color: '#1890ff' }} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="待处理" value={stats.open} valueStyle={{ color: '#fa8c16' }} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="已解决" value={stats.resolved} valueStyle={{ color: '#52c41a' }} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="已关闭" value={stats.closed} valueStyle={{ color: '#8c8c8c' }} />
              </Card>
            </Col>
          </Row>

          <Card title="项目信息">
            <Descriptions column={2}>
              <Descriptions.Item label="项目名称">{project?.name}</Descriptions.Item>
              <Descriptions.Item label="项目代码">{project?.code}</Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {project?.description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={project?.isActive ? 'success' : 'default'}>
                  {project?.isActive ? '激活' : '停用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="排序">{project?.sortOrder}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {project?.createdAt ? new Date(project.createdAt).toLocaleString() : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      ),
    },
    {
      key: 'bugs',
      label: `Bug列表 (${bugs.length})`,
      children: (
        <Table
          columns={bugColumns}
          dataSource={bugs}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'modules',
      label: `模块结构 (${modules.length})`,
      children: (
        <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
          {JSON.stringify(modules, null, 2)}
        </pre>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <div className="page-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/projects')}
          style={{ marginBottom: 16 }}
        >
          返回项目列表
        </Button>
        <h1 className="page-title">{project?.name || '项目详情'}</h1>
      </div>

      <Card>
        <Tabs defaultActiveKey="overview" items={tabItems} />
      </Card>
    </Spin>
  );
};

export default ProjectDetail;
