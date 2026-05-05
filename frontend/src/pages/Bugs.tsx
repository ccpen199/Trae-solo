import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Spin,
  Space,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { bugApi, projectApi } from '@/services/api';
import { Bug, Project, BugStatus, BugSeverity, BugPriority, UserRole } from '@/types';
import { useAuthStore } from '@/store/authStore';

const { Search } = Input;

const Bugs: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    projectId: undefined as string | undefined,
    status: undefined as string | undefined,
    severity: undefined as string | undefined,
    search: undefined as string | undefined,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBug, setEditingBug] = useState<Bug | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const canManage =
    user?.role === UserRole.ADMIN ||
    user?.role === UserRole.TEST_LEAD ||
    user?.role === UserRole.TESTER;

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchBugs();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchProjects = async () => {
    try {
      const response = await projectApi.getProjects({ pageSize: 100 });
      if (response.success && response.data) {
        setProjects(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch projects');
    }
  };

  const fetchBugs = async () => {
    setLoading(true);
    try {
      const response = await bugApi.getBugs({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });

      if (response.success && response.data) {
        setBugs(response.data);
        if (response.pagination) {
          setPagination({
            current: response.pagination.page,
            pageSize: response.pagination.pageSize,
            total: response.pagination.total,
          });
        }
      }
    } catch (error) {
      message.error('加载Bug列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingBug(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Bug) => {
    setEditingBug(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await bugApi.deleteBug(id);
      if (response.success) {
        message.success('删除成功');
        fetchBugs();
      } else {
        message.error(response.message || '删除失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingBug) {
        const response = await bugApi.updateBug(editingBug.id, values);
        if (response.success) {
          message.success('更新成功');
          setModalVisible(false);
          fetchBugs();
        } else {
          message.error(response.message || '更新失败');
        }
      } else {
        const response = await bugApi.createBug(values);
        if (response.success) {
          message.success('创建成功');
          setModalVisible(false);
          fetchBugs();
        } else {
          message.error(response.message || '创建失败');
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
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

  const columns = [
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
      render: (text: string, record: Bug) => (
        <a onClick={() => navigate(`/bugs/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: BugStatus) => getStatusTag(status),
      filters: Object.values(BugStatus).map((s) => ({
        text: s,
        value: s,
      })),
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 80,
      render: (severity: BugSeverity) => getSeverityText(severity),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
    },
    {
      title: '是否发布',
      dataIndex: 'isPublished',
      key: 'isPublished',
      width: 80,
      render: (published: boolean) => (
        <Tag color={published ? 'green' : 'orange'}>{published ? '已发布' : '未发布'}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Bug) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/bugs/${record.id}`)}
          >
            查看
          </Button>
          {canManage && (
            <>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
              {!record.status === BugStatus.NEW && (
                <Popconfirm
                  title="确定要删除这个Bug吗？"
                  onConfirm={() => handleDelete(record.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="text" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              )}
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <div className="page-header">
        <h1 className="page-title">Bug管理</h1>
      </div>

      <Card
        extra={
          canManage && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建Bug
            </Button>
          )
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Select
              placeholder="选择项目"
              allowClear
              style={{ width: 200 }}
              value={filters.projectId}
              onChange={(value) => setFilters({ ...filters, projectId: value })}
              options={projects.map((p) => ({ label: p.name, value: p.id })}
            />
            <Select
              placeholder="选择状态"
              allowClear
              style={{ width: 150 }}
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              options={Object.values(BugStatus).map((s) => ({ label: s, value: s })}
            />
            <Select
              placeholder="选择严重程度"
              allowClear
              style={{ width: 150 }}
              value={filters.severity}
              onChange={(value) => setFilters({ ...filters, severity: value })}
              options={Object.values(BugSeverity).map((s) => ({ label: s, value: s })}
            />
            <Search
              placeholder="搜索标题或描述"
              style={{ width: 250 }}
              onSearch={(value) => setFilters({ ...filters, search: value || undefined })}
              allowClear
            />
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={bugs}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize: pageSize || 10 });
            },
          }}
        />
      </Card>

      <Modal
        title={editingBug ? '编辑Bug' : '新建Bug'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="projectId"
            label="所属项目"
            rules={[{ required: true, message: '请选择项目' }]}
          >
            <Select placeholder="请选择项目">
              {projects.map((p) => (
                <Select.Option key={p.id} value={p.id}>
                  {p.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入Bug标题" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入Bug描述" />
          </Form.Item>
          <Form.Item name="severity" label="严重程度">
            <Select defaultValue={BugSeverity.MEDIUM}>
              {Object.values(BugSeverity).map((s) => (
                <Select.Option key={s} value={s}>
                  {s}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Select defaultValue={BugPriority.P3}>
              {Object.values(BugPriority).map((p) => (
                <Select.Option key={p} value={p}>
                  {p}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="stepsToReproduce" label="复现步骤">
            <Input.TextArea rows={3} placeholder="请输入复现步骤" />
          </Form.Item>
          <Form.Item name="expectedResult" label="预期结果">
            <Input placeholder="请输入预期结果" />
          </Form.Item>
          <Form.Item name="actualResult" label="实际结果">
            <Input placeholder="请输入实际结果" />
          </Form.Item>
          <Form.Item name="environment" label="环境信息">
            <Input placeholder="请输入环境信息" />
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  );
};

export default Bugs;
