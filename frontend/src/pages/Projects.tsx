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
  message,
  Popconfirm,
  Spin,
  Space,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { projectApi } from '@/services/api';
import { Project, UserRole } from '@/types';
import { useAuthStore } from '@/store/authStore';

const Projects: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const canManage =
    user?.role === UserRole.ADMIN || user?.role === UserRole.TEST_LEAD;

  useEffect(() => {
    fetchProjects();
  }, [pagination.current, pagination.pageSize]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await projectApi.getProjects({
        page: pagination.current,
        pageSize: pagination.pageSize,
      });

      if (response.success && response.data) {
        setProjects(response.data);
        if (response.pagination) {
          setPagination({
            current: response.pagination.page,
            pageSize: response.pagination.pageSize,
            total: response.pagination.total,
          });
        }
      }
    } catch (error) {
      message.error('加载项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingProject(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Project) => {
    setEditingProject(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await projectApi.deleteProject(id);
      if (response.success) {
        message.success('删除成功');
        fetchProjects();
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

      if (editingProject) {
        const response = await projectApi.updateProject(editingProject.id, values);
        if (response.success) {
          message.success('更新成功');
          setModalVisible(false);
          fetchProjects();
        } else {
          message.error(response.message || '更新失败');
        }
      } else {
        const response = await projectApi.createProject(values);
        if (response.success) {
          message.success('创建成功');
          setModalVisible(false);
          fetchProjects();
        } else {
          message.error(response.message || '创建失败');
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Project) => (
        <a onClick={() => navigate(`/projects/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '项目代码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => text || '-',
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
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
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
      width: 180,
      render: (_: any, record: Project) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/projects/${record.id}`)}
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
              <Popconfirm
                title="确定要删除这个项目吗？"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="text" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <div className="page-header">
        <h1 className="page-title">项目管理</h1>
      </div>

      <Card
        extra={
          canManage && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建项目
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          dataSource={projects}
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
        title={editingProject ? '编辑项目' : '新建项目'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item
            name="code"
            label="项目代码"
            rules={[
              { required: true, message: '请输入项目代码' },
              { pattern: /^[A-Z0-9_]+$/, message: '只能包含大写字母、数字和下划线' },
            ]}
          >
            <Input placeholder="例如：PRJ001" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={4} placeholder="请输入项目描述" />
          </Form.Item>
          {editingProject && (
            <Form.Item name="isActive" label="是否激活" valuePropName="checked">
              <input type="checkbox" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Spin>
  );
};

export default Projects;
