import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Button, Table, Space, Tag, Modal, Form, Input, message, Tabs, Descriptions, Select } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, UserOutlined, DeleteOutlined, FolderOutlined } from '@ant-design/icons';
import { teamApi, authApi } from '../services/api';
import dayjs from 'dayjs';

const { TabPane } = Tabs;

function TeamDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [memberModal, setMemberModal] = useState(false);
  const [projectModal, setProjectModal] = useState(false);
  const [form] = Form.useForm();
  const [projectForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [teamRes, usersRes] = await Promise.all([
        teamApi.get(id),
        authApi.getUsers(),
      ]);
      setTeam(teamRes.data.team);
      setMembers(teamRes.data.members);
      setProjects(teamRes.data.projects);
      setUsers(usersRes.data.users);
    } catch (err) {
      message.error('加载失败');
    }
  };

  const handleAddMember = async (values) => {
    try {
      await teamApi.addMember(id, values);
      message.success('添加成功');
      setMemberModal(false);
      form.resetFields();
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '添加失败');
    }
  };

  const handleRemoveMember = async (userId) => {
    Modal.confirm({
      title: '确认移除',
      content: '确定要移除该成员吗？',
      onOk: async () => {
        try {
          await teamApi.removeMember(id, userId);
          message.success('移除成功');
          loadData();
        } catch (err) {
          message.error('移除失败');
        }
      },
    });
  };

  const handleCreateProject = async (values) => {
    try {
      await teamApi.createProject(id, values);
      message.success('创建成功');
      setProjectModal(false);
      projectForm.resetFields();
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '创建失败');
    }
  };

  const isTeamAdmin = members.some(m => m.user_id === user?.id && m.role === 'admin');

  const memberColumns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '部门', dataIndex: 'department', key: 'dept' },
    { title: '角色', dataIndex: 'role', key: 'role', render: r => <Tag color={r === 'admin' ? 'blue' : 'default'}>{r}</Tag> },
    { title: '加入时间', dataIndex: 'joined_at', key: 'joined', render: d => dayjs(d).format('YYYY-MM-DD') },
    { title: '操作', key: 'actions', render: (_, r) => (isTeamAdmin || user?.role === 'admin') ? (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveMember(r.id)} />
      ) : null }
  ];

  const projectColumns = [
    { title: '项目名称', dataIndex: 'name', key: 'name' },
    { title: '描述', dataIndex: 'description', key: 'desc' },
    { title: '凭据数量', dataIndex: 'credential_count', key: 'count' },
    { title: '创建者', dataIndex: 'creator_name', key: 'creator' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created', render: d => dayjs(d).format('YYYY-MM-DD') },
  ];

  if (!team) return <div>加载中...</div>;

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/teams')} style={{ marginBottom: 16 }}>
        返回列表
      </Button>

      <Card title={team.name}>
        <Descriptions column={3}>
          <Descriptions.Item label="描述">{team.description || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建者">{team.creator_name}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{dayjs(team.created_at).format('YYYY-MM-DD')}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Tabs defaultActiveKey="members">
          <TabPane tab="成员管理" key="members">
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
              {(isTeamAdmin || user?.role === 'admin') && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setMemberModal(true)}>
                  添加成员
                </Button>
              )}
            </div>
            <Table
              columns={memberColumns}
              dataSource={members}
              rowKey="id"
              pagination={false}
            />
          </TabPane>
          <TabPane tab="项目列表" key="projects">
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setProjectModal(true)}>
                创建项目
              </Button>
            </div>
            <Table
              columns={projectColumns}
              dataSource={projects}
              rowKey="id"
              pagination={false}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="添加成员"
        open={memberModal}
        onCancel={() => setMemberModal(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddMember}>
          <Form.Item name="user_id" label="选择用户" rules={[{ required: true }]}>
            <Select
              options={users
                .filter(u => !members.some(m => m.id === u.id))
                .map(u => ({ value: u.id, label: `${u.username} (${u.department})`}))}
            />
          </Form.Item>
          <Form.Item name="role" label="角色" initialValue="member">
            <Select options={[
              { value: 'member', label: '成员' },
              { value: 'admin', label: '管理员' },
            ]} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">添加</Button>
              <Button onClick={() => setMemberModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="创建项目"
        open={projectModal}
        onCancel={() => setProjectModal(false)}
        footer={null}
      >
        <Form form={projectForm} layout="vertical" onFinish={handleCreateProject}>
          <Form.Item name="name" label="项目名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="项目描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">创建</Button>
              <Button onClick={() => setProjectModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default TeamDetail;
