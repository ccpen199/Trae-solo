import React, { useState, useEffect } from 'react';
import {
  Button,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  Spin,
  Empty,
  Popconfirm,
  message,
  Card
} from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { announcementApi } from '../services/api';
import { useUserStore } from '../store/userStore';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const getTypeTag = (type) => {
  const typeMap = {
    DEPARTMENT: { text: '院系通知', color: 'blue' },
    CLASS: { text: '班级事项', color: 'green' },
    REMINDER: { text: '事务提醒', color: 'orange' }
  };
  const config = typeMap[type] || { text: type, color: 'default' };
  return <Tag color={config.color}>{config.text}</Tag>;
};

const Announcements = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
  const [form] = Form.useForm();
  const { isMonitor } = useUserStore();
  const canManage = isMonitor();

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await announcementApi.getList({ page, pageSize });
      setData(result.data.list);
      setTotal(result.data.total);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const handleCreate = () => {
    form.resetFields();
    setCurrentAnnouncement(null);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setCurrentAnnouncement(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDetail = (record) => {
    setCurrentAnnouncement(record);
    setDetailVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await announcementApi.delete(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (currentAnnouncement) {
        await announcementApi.update(currentAnnouncement.id, values);
        message.success('更新成功');
      } else {
        await announcementApi.create(values);
        message.success('发布成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('Failed to submit:', error);
    }
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text, record) => (
        <a onClick={() => handleDetail(record)}>{text}</a>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: getTypeTag
    },
    {
      title: '发布者',
      dataIndex: ['author', 'name'],
      key: 'author'
    },
    {
      title: '浏览次数',
      dataIndex: 'viewCount',
      key: 'viewCount'
    },
    {
      title: '发布时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleDetail(record)}>
            查看
          </Button>
          {canManage && (
            <>
              <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                编辑
              </Button>
              <Popconfirm
                title="确定要删除吗？"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h2>公告通知</h2>
        {canManage && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            发布公告
          </Button>
        )}
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : data.length > 0 ? (
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={{
              current: page,
              pageSize,
              total,
              showTotal: (total) => `共 ${total} 条`,
              onChange: (p) => setPage(p)
            }}
          />
        ) : (
          <Empty description="暂无公告" />
        )}
      </div>

      <Modal
        title={currentAnnouncement ? '编辑公告' : '发布公告'}
        open={modalVisible}
        width={700}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="form-modal"
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入公告标题" />
          </Form.Item>

          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select placeholder="请选择公告类型">
              <Option value="DEPARTMENT">院系通知</Option>
              <Option value="CLASS">班级事项</Option>
              <Option value="REMINDER">事务提醒</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="targetClass"
            label="目标班级"
            help="为空则所有班级可见"
          >
            <Input placeholder="例如：CS2021-01" />
          </Form.Item>

          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea rows={8} placeholder="请输入公告内容" />
          </Form.Item>

          <Form.Item
            name="isPinned"
            label="是否置顶"
            valuePropName="checked"
          >
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {currentAnnouncement ? '更新' : '发布'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="公告详情"
        open={detailVisible}
        width={700}
        onCancel={() => setDetailVisible(false)}
        footer={null}
      >
        {currentAnnouncement && (
          <div className="announcement-detail">
            <h3 className="title">{currentAnnouncement.title}</h3>
            <div className="meta">
              <Space>
                <span>发布者：{currentAnnouncement.author?.name}</span>
                <span>|</span>
                {getTypeTag(currentAnnouncement.type)}
                <span>|</span>
                <span>浏览：{currentAnnouncement.viewCount} 次</span>
                <span>|</span>
                <span>{dayjs(currentAnnouncement.createdAt).format('YYYY-MM-DD HH:mm')}</span>
              </Space>
            </div>
            <div className="content" style={{ whiteSpace: 'pre-wrap' }}>
              {currentAnnouncement.content}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Announcements;
