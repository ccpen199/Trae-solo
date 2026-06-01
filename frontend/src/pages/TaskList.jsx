import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Typography,
  Row,
  Col
} from 'antd';
import { PlusOutlined, EyeOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { queryTasks, dataSources } from '../api';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const statusColors = {
  draft: 'default',
  submitted: 'blue',
  executed: 'cyan',
  reviewed: 'green',
  blocked: 'red',
  closed: 'gray'
};

const statusLabels = {
  draft: '草稿',
  submitted: '已提交',
  executed: '已执行',
  reviewed: '已复核',
  blocked: '已拦截',
  closed: '已关闭'
};

function TaskList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [dataSources, setDataSourcesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, dsRes] = await Promise.all([
        queryTasks.list({}),
        dataSources.list({})
      ]);
      setTasks(tasksRes.data);
      setDataSourcesList(dsRes.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values) => {
    try {
      await queryTasks.create({
        ...values,
        due_date: values.due_date?.format('YYYY-MM-DD')
      });
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleSubmit = async (id) => {
    try {
      await queryTasks.submit(id, { reason: '提交审核' });
      message.success('提交成功');
      loadData();
    } catch (error) {
      message.error('提交失败');
    }
  };

  const handleExecute = async (id) => {
    try {
      const res = await queryTasks.execute(id);
      if (res.data.exception) {
        message.warning(`执行完成，发现异常: ${res.data.exception.detail}`);
      } else {
        message.success('执行成功');
      }
      loadData();
    } catch (error) {
      message.error('执行失败');
    }
  };

  const handleClose = async (id) => {
    try {
      await queryTasks.close(id, { reason: '手动关闭' });
      message.success('关闭成功');
      loadData();
    } catch (error) {
      message.error('关闭失败');
    }
  };

  const columns = [
    { title: '任务名称', dataIndex: 'task_name', key: 'task_name', width: 200 },
    { title: '数据源', dataIndex: 'data_source_name', key: 'data_source_name' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => <Tag color={statusColors[s]}>{statusLabels[s]}</Tag> },
    { title: '优先级', dataIndex: 'priority', key: 'priority', render: (p) => p === 'high' ? <Tag color="red">高</Tag> : p === 'low' ? <Tag color="green">低</Tag> : <Tag>中</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/tasks/${record.id}`)}>
            详情
          </Button>
          {record.status === 'draft' && (
            <Button type="link" size="small" onClick={() => handleSubmit(record.id)}>
              提交
            </Button>
          )}
          {['submitted', 'reviewed'].includes(record.status) && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleExecute(record.id)}>
              执行
            </Button>
          )}
          {record.status !== 'closed' && (
            <Popconfirm title="确定关闭?" onConfirm={() => handleClose(record.id)}>
              <Button type="link" size="small" danger>关闭</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col><Title level={3}>查询任务</Title></Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            新建任务
          </Button>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="新建查询任务"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="task_name" label="任务名称" rules={[{ required: true }]}>
            <Input placeholder="请输入任务名称" />
          </Form.Item>
          <Form.Item name="data_source_id" label="数据源">
            <Select placeholder="请选择数据源">
              {dataSources.map(ds => (
                <Option key={ds.id} value={ds.id}>{ds.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="query_sql" label="SQL语句">
            <TextArea rows={4} placeholder="SELECT * FROM table_name" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Select defaultValue="normal">
              <Option value="low">低</Option>
              <Option value="normal">中</Option>
              <Option value="high">高</Option>
            </Select>
          </Form.Item>
          <Form.Item name="due_date" label="截止日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">创建</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default TaskList;
