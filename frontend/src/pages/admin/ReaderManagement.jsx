import React, { useState, useEffect } from 'react';
import {
  Table,
  Input,
  Card,
  Button,
  Space,
  Tag,
  Typography,
  Modal,
  Form,
  message,
  Popconfirm,
  Drawer,
  Select,
  Descriptions,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { readerApi } from '../../utils/api';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

const ReaderManagement = () => {
  const [readers, setReaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingReader, setEditingReader] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedReader, setSelectedReader] = useState(null);
  const [form] = Form.useForm();

  const fetchReaders = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
      };
      if (keyword) params.keyword = keyword;

      const response = await readerApi.getReaders(params);
      setReaders(response.data.data);
      setTotal(response.data.total);
    } catch (err) {
      message.error('获取读者列表失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReaders();
  }, [page, pageSize]);

  const handleSearch = () => {
    setPage(1);
    fetchReaders();
  };

  const handleAdd = () => {
    setEditingReader(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const handleEdit = (reader) => {
    setEditingReader(reader);
    form.setFieldsValue({
      ...reader,
      username: reader.username,
    });
    setDrawerVisible(true);
  };

  const handleView = async (reader) => {
    try {
      const response = await readerApi.getReaderById(reader.id);
      setSelectedReader(response.data);
      setDetailVisible(true);
    } catch (err) {
      message.error('获取读者详情失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      await readerApi.deleteReader(id);
      message.success('删除成功');
      fetchReaders();
    } catch (err) {
      message.error(err.response?.data?.message || '删除失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingReader) {
        await readerApi.updateReader(editingReader.id, values);
        message.success('更新成功');
      } else {
        await readerApi.createReader(values);
        message.success('添加成功');
      }
      setDrawerVisible(false);
      fetchReaders();
    } catch (err) {
      message.error(err.response?.data?.message || '操作失败');
    }
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 100,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      render: (gender) => {
        if (gender === '男') return <Tag color="blue">男</Tag>;
        if (gender === '女') return <Tag color="pink">女</Tag>;
        return '-';
      },
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 150,
    },
    {
      title: '身份证号',
      dataIndex: 'id_card',
      key: 'id_card',
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '正常' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            详情
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除该读者吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>
              读者管理
            </Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加读者
            </Button>
          </div>
          <Search
            placeholder="搜索姓名、电话、邮箱或身份证号"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
            style={{ width: 400 }}
          />
        </Space>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Table
          columns={columns}
          dataSource={readers}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Drawer
        title={editingReader ? '编辑读者' : '添加读者'}
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={() => form.submit()}>
              提交
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!editingReader && (
            <>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
            </>
          )}
          {editingReader && (
            <Form.Item name="password" label="新密码 (留空则不修改)">
              <Input.Password placeholder="留空则不修改密码" />
            </Form.Item>
          )}

          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item name="gender" label="性别">
            <Select placeholder="请选择性别">
              <Option value="男">男</Option>
              <Option value="女">女</Option>
            </Select>
          </Form.Item>

          <Form.Item name="birth_date" label="出生日期">
            <Input type="date" />
          </Form.Item>

          <Form.Item name="phone" label="电话">
            <Input placeholder="请输入电话" />
          </Form.Item>

          <Form.Item name="email" label="邮箱">
            <Input type="email" placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item name="id_card" label="身份证号">
            <Input placeholder="请输入身份证号" />
          </Form.Item>

          <Form.Item name="address" label="地址">
            <TextArea rows={2} placeholder="请输入地址" />
          </Form.Item>

          {editingReader && (
            <Form.Item name="status" label="状态">
              <Select placeholder="请选择状态">
                <Option value="active">正常</Option>
                <Option value="inactive">停用</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Drawer>

      <Modal
        title="读者详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {selectedReader && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="姓名" span={2}>
              {selectedReader.name}
            </Descriptions.Item>
            <Descriptions.Item label="用户名">{selectedReader.username}</Descriptions.Item>
            <Descriptions.Item label="性别">{selectedReader.gender || '-'}</Descriptions.Item>
            <Descriptions.Item label="出生日期">{selectedReader.birth_date || '-'}</Descriptions.Item>
            <Descriptions.Item label="电话">{selectedReader.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{selectedReader.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="身份证号">{selectedReader.id_card || '-'}</Descriptions.Item>
            <Descriptions.Item label="地址" span={2}>
              {selectedReader.address || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={selectedReader.status === 'active' ? 'green' : 'red'}>
                {selectedReader.status === 'active' ? '正常' : '停用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="注册时间">{selectedReader.created_at}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default ReaderManagement;
