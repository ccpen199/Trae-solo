import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Table, Space, Tag, Modal, Form, Input, message } from 'antd';
import { PlusOutlined, TeamOutlined, UserOutlined, FolderOutlined } from '@ant-design/icons';
import { teamApi } from '../services/api';
import dayjs from 'dayjs';

function Teams({ user }) {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const res = await teamApi.list();
      setTeams(res.data.teams);
    } catch (err) {
      message.error('加载失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      await teamApi.create(values);
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadTeams();
    } catch (err) {
      message.error(err.response?.data?.error || '创建失败');
    }
  };

  const columns = [
    { title: '团队名称', dataIndex: 'name', key: 'name',
      render: (n, r) => <a onClick={() => navigate(`/teams/${r.id}`)}>{n}</a> },
    { title: '描述', dataIndex: 'description', key: 'desc' },
    { title: '成员数', dataIndex: 'member_count', key: 'members',
      render: c => <Space><UserOutlined />{c}</Space> },
    { title: '项目数', dataIndex: 'project_count', key: 'projects',
      render: c => <Space><FolderOutlined />{c}</Space> },
    { title: '创建者', dataIndex: 'creator_name', key: 'creator' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created',
      render: d => dayjs(d).format('YYYY-MM-DD') },
  ];

  return (
    <Card title="团队管理" extra={
      user?.role === 'admin' && (
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          创建团队
        </Button>
      )
    }>
      <Table
        columns={columns}
        dataSource={teams}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="创建团队"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="团队名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="团队描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">创建</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default Teams;
