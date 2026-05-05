import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Button,
  Spin,
  message,
  Tag,
  Space,
  Tabs,
  Select,
  Input,
  Form,
  Timeline,
  Divider,
  Row,
  Col,
} from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { bugApi, userApi } from '@/services/api';
import { Bug, BugStatus, BugSeverity, BugPriority, UserRole } from '@/types';
import { useAuthStore } from '@/store/authStore';

const BugDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [bug, setBug] = useState<Bug | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [statusEdit, setStatusEdit] = useState(false);
  const [assignEdit, setAssignEdit] = useState(false);
  const [form] = Form.useForm();
  const { user } = useAuthStore();

  const canEdit =
    user?.role === UserRole.ADMIN ||
    user?.role === UserRole.TEST_LEAD ||
    user?.role === UserRole.TESTER;

  const canHandleBug =
    user?.role === UserRole.ADMIN ||
    user?.role === UserRole.DEVELOPER ||
    user?.role === UserRole.TESTER;

  useEffect(() => {
    if (id) {
      fetchBugDetail();
      fetchUsers();
    }
  }, [id]);

  const fetchBugDetail = async () => {
    setLoading(true);
    try {
      const response = await bugApi.getBugById(id!);
      if (response.success && response.data) {
        setBug(response.data);
        form.setFieldsValue(response.data);
      }
    } catch (error) {
      message.error('加载Bug详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userApi.getUsers({ pageSize: 100 });
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch users');
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

  const getAvailableStatuses = (currentStatus: BugStatus): BugStatus[] => {
    const transitions: Record<BugStatus, BugStatus[]> = {
      [BugStatus.NEW]: [BugStatus.ASSIGNED],
      [BugStatus.ASSIGNED]: [BugStatus.IN_PROGRESS],
      [BugStatus.IN_PROGRESS]: [BugStatus.RESOLVED, BugStatus.REJECTED],
      [BugStatus.RESOLVED]: [BugStatus.VERIFIED, BugStatus.REOPENED],
      [BugStatus.VERIFIED]: [BugStatus.CLOSED],
      [BugStatus.REOPENED]: [BugStatus.IN_PROGRESS, BugStatus.ASSIGNED],
      [BugStatus.CLOSED]: [BugStatus.REOPENED],
      [BugStatus.REJECTED]: [BugStatus.REOPENED, BugStatus.CLOSED],
    };
    return transitions[currentStatus] || [];
  };

  const handleStatusChange = async (newStatus: BugStatus) => {
    try {
      const response = await bugApi.updateBugStatus(id!, newStatus);
      if (response.success) {
        message.success('状态更新成功');
        setStatusEdit(false);
        fetchBugDetail();
      } else {
        message.error(response.message || '更新失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新失败');
    }
  };

  const handleAssign = async (assigneeId: string) => {
    try {
      const response = await bugApi.assignBug(id!, assigneeId);
      if (response.success) {
        message.success('分配成功');
        setAssignEdit(false);
        fetchBugDetail();
      } else {
        message.error(response.message || '分配失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '分配失败');
    }
  };

  const handlePublish = async () => {
    try {
      const response = await bugApi.publishBugs([id!]);
      if (response.success) {
        message.success('发布成功');
        fetchBugDetail();
      } else {
        message.error(response.message || '发布失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '发布失败');
    }
  };

  const tabItems = [
    {
      key: 'overview',
      label: '基本信息',
      children: (
        <div>
          <Row gutter={[32, 16]}>
            <Col span={12}>
              <Card title="基本信息">
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="Bug编号">{bug?.bugNumber}</Descriptions.Item>
                  <Descriptions.Item label="标题">{bug?.title}</Descriptions.Item>
                  <Descriptions.Item label="描述">
                    {bug?.description || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="状态">
                    {canHandleBug ? (
                      statusEdit ? (
                        <Space>
                          <Select
                            defaultValue={bug?.status}
                            style={{ width: 150 }}
                            options={getAvailableStatuses(bug?.status || BugStatus.NEW).map((s) => ({
                              label: s,
                              value: s,
                            }))}
                            onSelect={handleStatusChange}
                          />
                          <Button onClick={() => setStatusEdit(false)}>取消</Button>
                        </Space>
                      ) : (
                        <Space>
                          {getStatusTag(bug?.status || BugStatus.NEW)}
                          <Button type="link" onClick={() => setStatusEdit(true)}>
                            变更
                          </Button>
                        </Space>
                      )
                    ) : (
                      getStatusTag(bug?.status || BugStatus.NEW)
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="严重程度">
                    {bug?.severity ? getSeverityText(bug.severity) : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="优先级">{bug?.priority || '-'}</Descriptions.Item>
                  <Descriptions.Item label="发布状态">
                    <Tag color={bug?.isPublished ? 'green' : 'orange'}>
                      {bug?.isPublished ? '已发布' : '未发布'}
                    </Tag>
                    {!bug?.isPublished && canEdit && (
                      <Button type="link" size="small" onClick={handlePublish}>
                        发布
                      </Button>
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="归属信息">
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="所属项目">{bug?.project?.name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="所属模块">{bug?.module?.name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="测试需求">{bug?.testRequirement?.title || '-'}</Descriptions.Item>
                  <Descriptions.Item label="测试版本">{bug?.testVersion?.version || '-'}</Descriptions.Item>
                  <Descriptions.Item label="创建人">{bug?.reporter?.username || '-'}</Descriptions.Item>
                  <Descriptions.Item label="处理人">
                    {canEdit ? (
                      assignEdit ? (
                        <Space>
                          <Select
                            defaultValue={bug?.assigneeId}
                            style={{ width: 150 }}
                            options={users.map((u) => ({ label: u.username, value: u.id }))}
                            onSelect={handleAssign}
                            allowClear
                            placeholder="选择处理人"
                          />
                          <Button onClick={() => setAssignEdit(false)}>取消</Button>
                        </Space>
                      ) : (
                        <Space>
                          {bug?.assignee?.username || <Tag color="default">未分配</Tag>}
                          <Button type="link" onClick={() => setAssignEdit(true)}>
                            分配
                          </Button>
                        </Space>
                      )
                    ) : (
                      bug?.assignee?.username || <Tag color="default">未分配</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="创建时间">
                    {bug?.createdAt ? new Date(bug.createdAt).toLocaleString() : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="更新时间">
                    {bug?.updatedAt ? new Date(bug.updatedAt).toLocaleString() : '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>

          <Divider />

          <Row gutter={[32, 16]}>
            <Col span={24}>
              <Card title="详细信息">
                <Descriptions column={2} bordered>
                  <Descriptions.Item label="复现步骤" span={2}>
                    {bug?.stepsToReproduce || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="预期结果">{bug?.expectedResult || '-'}</Descriptions.Item>
                  <Descriptions.Item label="实际结果">{bug?.actualResult || '-'}</Descriptions.Item>
                  <Descriptions.Item label="环境信息" span={2}>
                    {bug?.environment || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'history',
      label: `变更历史 (${bug?.history?.length || 0})`,
      children: (
        <Timeline>
          {(bug?.history || []).map((item: any, index: number) => (
            <Timeline.Item key={index}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <strong>{item.changedBy?.username || '系统'}</strong>
                  <span style={{ color: '#999' }}>
                    {new Date(item.changedAt).toLocaleString()}
                  </span>
                </Space>
                {item.oldStatus && item.newStatus && (
                  <div>
                    状态变更: {getStatusTag(item.oldStatus as BugStatus)} →{' '}
                    {getStatusTag(item.newStatus as BugStatus)}
                  </div>
                )}
                {item.changes && item.changes.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {item.changes.map((change: any, i: number) => (
                      <li key={i}>
                        {change.field}: {change.oldValue} → {change.newValue}
                      </li>
                    ))}
                  </ul>
                )}
                {item.comment && <div style={{ fontStyle: 'italic' }}>备注: {item.comment}</div>}
              </Space>
            </Timeline.Item>
          ))}
          {(!bug?.history || bug.history.length === 0) && (
            <Timeline.Item>暂无变更历史</Timeline.Item>
          )}
        </Timeline>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <div className="page-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/bugs')}
          style={{ marginBottom: 16 }}
        >
          返回Bug列表
        </Button>
        <Space>
          <h1 className="page-title">
            {bug?.title || 'Bug详情'} <Tag>{bug?.bugNumber}</Tag>
          </h1>
          {canEdit && (
            <Button icon={<EditOutlined />} onClick={() => setEditMode(!editMode)}>
              编辑
            </Button>
          )}
        </Space>
      </div>

      <Card>
        <Tabs defaultActiveKey="overview" items={tabItems} />
      </Card>
    </Spin>
  );
};

export default BugDetail;
