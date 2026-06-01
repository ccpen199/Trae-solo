import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Card, Button, Space, Tag, Modal, Form, Input, Select,
  InputNumber, message, Row, Col, Tooltip, DatePicker, Popconfirm
} from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { credentialApi, teamApi } from '../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

function Credentials({ user }) {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState([]);
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [credRes, teamRes] = await Promise.all([
        credentialApi.list(),
        teamApi.list(),
      ]);
      setCredentials(credRes.data.credentials);
      setTeams(teamRes.data.teams);
    } catch (err) {
      message.error('加载数据失败');
    }
  };

  const handleTeamChange = async (teamId) => {
    setSelectedTeam(teamId);
    try {
      const res = await teamApi.getProjects(teamId);
      setProjects(res.data.projects);
    } catch (err) {
      message.error('加载项目失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const submitData = {
        ...values,
        expires_at: values.expires_at ? values.expires_at.format('YYYY-MM-DD') : null,
      };
      
      if (editingId) {
        await credentialApi.update(editingId, submitData);
        message.success('更新成功');
      } else {
        await credentialApi.create(submitData);
        message.success('创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingId(null);
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后无法恢复，确定吗？',
      onOk: async () => {
        try {
          await credentialApi.delete(id);
          message.success('删除成功');
          loadData();
        } catch (err) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleFreeze = async (id, frozen) => {
    try {
      if (frozen) {
        await credentialApi.unfreeze(id);
        message.success('已解冻');
      } else {
        await credentialApi.freeze(id);
        message.success('已冻结');
      }
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '操作失败');
    }
  };

  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title',
      render: (t, r) => <a onClick={() => navigate(`/credentials/${r.id}`)}>{t}</a> },
    { title: '类型', dataIndex: 'type', key: 'type', render: t => <Tag color="blue">{t}</Tag>,
      filters: [
        { text: '账号密码', value: 'password' },
        { text: 'API Token', value: 'token' },
        { text: '证书', value: 'certificate' },
        { text: '数据库', value: 'database' },
      ],
      onFilter: (v, r) => r.type === v
    },
    { title: '用户名', dataIndex: 'username', key: 'username', className: 'credential-masked' },
    { title: '项目', dataIndex: 'project_name', key: 'project' },
    { title: '团队', dataIndex: 'team_name', key: 'team' },
    { title: '状态', dataIndex: 'is_frozen', key: 'status',
      render: f => f ? <Tag color="red">已冻结</Tag> : <Tag color="green">正常</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created',
      render: d => dayjs(d).format('YYYY-MM-DD') },
    { title: '操作', key: 'actions', render: (_, r) => (
      <Space>
        <Tooltip title="查看详情">
          <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/credentials/${r.id}`)} />
        </Tooltip>
        <Tooltip title="编辑">
          <Button type="text" icon={<EditOutlined />} onClick={() => {
            setEditingId(r.id);
            form.setFieldsValue(r);
            setModalVisible(true);
          }} />
        </Tooltip>
        {user?.role === 'admin' && (
          <Tooltip title={r.is_frozen ? '解冻' : '冻结'}>
            <Button type="text" danger={!r.is_frozen}
              icon={r.is_frozen ? <UnlockOutlined /> : <LockOutlined />}
              onClick={() => handleFreeze(r.id, r.is_frozen)} />
          </Tooltip>
        )}
        <Tooltip title="删除">
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.id)} />
        </Tooltip>
      </Space>
    )},
  ];

  const credentialTypes = [
    { value: 'password', label: '账号密码' },
    { value: 'token', label: 'API Token' },
    { value: 'certificate', label: '证书' },
    { value: 'database', label: '数据库连接' },
    { value: 'note', label: '备注附件' },
  ];

  return (
    <Card title="凭据管理" extra={
      <Button type="primary" icon={<PlusOutlined />} onClick={() => {
        setEditingId(null);
        form.resetFields();
        setModalVisible(true);
      }}>
        新建凭据
      </Button>
    }>
      <Table
        columns={columns}
        dataSource={credentials}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingId ? '编辑凭据' : '新建凭据'}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); setEditingId(null); }}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="title" label="标题" rules={[{ required: true }]}>
                <Input placeholder="例如: 生产数据库主账号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="类型" rules={[{ required: true }]}>
                <Select options={credentialTypes} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="team_id" label="团队" rules={[{ required: true }]}>
                <Select
                  options={teams.map(t => ({ value: t.id, label: t.name }))}
                  onChange={handleTeamChange}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="project_id" label="项目" rules={[{ required: true }]}>
                <Select options={projects.map(p => ({ value: p.id, label: p.name }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="username" label="用户名">
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="password" label="密码" rules={[
                { min: 6, message: '密码至少6位' }
              ]}>
                <Input.Password placeholder="请输入密码（至少6位）" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="token" label="API Token / 密钥" rules={[
            { min: 10, message: 'Token至少10位' }
          ]}>
            <Input.Password placeholder="请输入Token或密钥（至少10位）" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="expires_at" label="过期日期" rules={[
                { required: true, message: '请选择过期日期' }
              ]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="rotation_period_days" label="轮换周期(天)">
                <InputNumber min={1} max={365} style={{ width: '100%' }} placeholder="默认90天" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default Credentials;
