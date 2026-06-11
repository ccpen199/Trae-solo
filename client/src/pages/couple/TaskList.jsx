import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Typography,
  Space,
  Tag,
  List,
  Empty,
  Spin,
  message,
  Checkbox,
  Select,
  Row,
  Col,
  Progress,
  Modal,
  Form,
  Input,
  DatePicker,
  Radio,
  Divider,
  Popconfirm
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  CalendarOutlined,
  FlagOutlined,
  FilterOutlined,
  EditOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { coupleAPI } from '../../api/index.js';

const { Title, Text } = Typography;
const { Option } = Select;

const CATEGORY_MAP = {
  booking: { name: '预订', color: '#1890ff' },
  photography: { name: '摄影', color: '#722ed1' },
  wedding: { name: '婚庆', color: '#ff4d6d' },
  dress: { name: '礼服', color: '#eb2f96' },
  invitation: { name: '请柬', color: '#faad14' },
  other: { name: '其他', color: '#13c2c2' }
};

const PRIORITY_MAP = {
  1: { name: '高优先级', color: 'red' },
  2: { name: '中优先级', color: 'orange' },
  3: { name: '低优先级', color: 'blue' }
};

const TaskList = () => {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all'
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form] = Form.useForm();
  const [profile, setProfile] = useState(null);

  const fetchProfile = async () => {
    try {
      const response = await coupleAPI.getProfile();
      setProfile(response.data);
    } catch (error) {
      console.error('获取用户信息失败', error);
    }
  };

  const fetchTasks = async (status, category) => {
    setLoading(true);
    try {
      const params = {};
      if (status !== 'all') params.status = status;
      if (category !== 'all') params.category = category;
      
      const response = await coupleAPI.getTasks(params);
      const taskList = response.data || [];
      setTasks(taskList);
      setFilteredTasks(taskList);
    } catch (error) {
      if (error.response?.status === 404) {
        message.warning('请先设置婚礼信息以生成任务清单');
      } else {
        message.error('获取任务列表失败');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchTasks(filters.status, filters.category);
  }, []);

  useEffect(() => {
    let filtered = [...tasks];
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === parseInt(filters.status));
    }
    
    if (filters.category !== 'all') {
      filtered = filtered.filter(t => t.category === filters.category);
    }
    
    setFilteredTasks(filtered);
  }, [filters, tasks]);

  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      await coupleAPI.updateTask(taskId, { status: newStatus });
      
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: newStatus } : t
      ));
      
      message.success(newStatus === 1 ? '任务已完成！' : '任务已恢复');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await coupleAPI.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const taskData = {
        title: values.title,
        description: values.description,
        category: values.category,
        due_date: values.due_date?.format('YYYY-MM-DD'),
        priority: values.priority
      };

      if (editingTask) {
        await coupleAPI.updateTask(editingTask.id, taskData);
        message.success('更新成功');
      } else {
        await coupleAPI.createTask(taskData);
        message.success('创建成功');
      }

      setModalVisible(false);
      setEditingTask(null);
      form.resetFields();
      fetchTasks(filters.status, filters.category);
    } catch (error) {
      message.error(editingTask ? '更新失败' : '创建失败');
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    form.setFieldsValue({
      title: task.title,
      description: task.description,
      category: task.category,
      due_date: dayjs(task.due_date),
      priority: task.priority
    });
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingTask(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getDaysBeforeWedding = (dueDate) => {
    if (!profile?.wedding_date || !dueDate) return null;
    const wedding = dayjs(profile.wedding_date);
    const due = dayjs(dueDate);
    return wedding.diff(due, 'day');
  };

  const getTimePhase = (daysBefore) => {
    if (daysBefore === null) return { label: '未安排', color: '#999' };
    if (daysBefore >= 365) return { label: '提前1年+', color: '#1890ff' };
    if (daysBefore >= 180) return { label: '提前6个月', color: '#722ed1' };
    if (daysBefore >= 90) return { label: '提前3个月', color: '#faad14' };
    if (daysBefore >= 30) return { label: '提前1个月', color: '#ff7a45' };
    if (daysBefore >= 7) return { label: '提前1周', color: '#ff4d6d' };
    if (daysBefore >= 0) return { label: '临近期', color: '#eb2f96' };
    return { label: '已过期', color: '#999' };
  };

  const completedCount = tasks.filter(t => t.status === 1).length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const groupTasksByPhase = () => {
    const groups = {};
    filteredTasks.forEach(task => {
      const daysBefore = getDaysBeforeWedding(task.due_date);
      const phase = getTimePhase(daysBefore);
      if (!groups[phase.label]) {
        groups[phase.label] = {
          phase,
          tasks: []
        };
      }
      groups[phase.label].tasks.push(task);
    });
    return Object.values(groups).sort((a, b) => {
      const order = ['提前1年+', '提前6个月', '提前3个月', '提前1个月', '提前1周', '临近期', '已过期', '未安排'];
      return order.indexOf(a.phase.label) - order.indexOf(b.phase.label);
    });
  };

  const groupedTasks = groupTasksByPhase();

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto', background: '#fafafa', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#ff4d6d' }}>
              婚礼筹备计划
            </Title>
            <Text type="secondary" style={{ fontSize: 15 }}>
              按婚期自动倒推，让每一步都有条不紊
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            style={{
              height: 44,
              padding: '0 24px',
              fontSize: 15,
              background: '#ff4d6d',
              border: 'none',
              borderRadius: 22
            }}
          >
            添加任务
          </Button>
        </div>

        <Card
          style={{ borderRadius: 16, marginBottom: 24 }}
          bodyStyle={{ padding: 24 }}
        >
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={12}>
              <Space size={16}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 'bold', color: '#ff4d6d' }}>{completedCount}</div>
                  <Text type="secondary" style={{ fontSize: 13 }}>已完成</Text>
                </div>
                <div style={{ color: '#d9d9d9', fontSize: 24 }}>/</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 'bold', color: '#333' }}>{totalCount}</div>
                  <Text type="secondary" style={{ fontSize: 13 }}>总任务</Text>
                </div>
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <Progress
                percent={progress}
                size="large"
                strokeColor={{
                  '0%': '#ff9a9e',
                  '100%': '#ff4d6d'
                }}
                format={(percent) => (
                  <span style={{ fontSize: 18, fontWeight: 'bold', color: '#ff4d6d' }}>{percent}%</span>
                )}
              />
            </Col>
          </Row>
        </Card>

        <Card
          style={{ borderRadius: 16, marginBottom: 24 }}
          bodyStyle={{ padding: '16px 24px' }}
        >
          <Space wrap size="large">
            <Space size={8}>
              <FilterOutlined style={{ color: '#ff4d6d' }} />
              <Text strong>状态：</Text>
              <Select
                value={filters.status}
                style={{ width: 120 }}
                onChange={(v) => handleFilterChange('status', v)}
              >
                <Option value="all">全部</Option>
                <Option value="0">待完成</Option>
                <Option value="1">已完成</Option>
              </Select>
            </Space>
            <Space size={8}>
              <Text strong>分类：</Text>
              <Select
                value={filters.category}
                style={{ width: 120 }}
                onChange={(v) => handleFilterChange('category', v)}
              >
                <Option value="all">全部分类</Option>
                {Object.entries(CATEGORY_MAP).map(([key, value]) => (
                  <Option key={key} value={key}>{value.name}</Option>
                ))}
              </Select>
            </Space>
          </Space>
        </Card>
      </div>

      <Spin spinning={loading}>
        {filteredTasks.length > 0 ? (
          groupedTasks.map(group => (
            <Card
              key={group.phase.label}
              style={{ marginBottom: 24, borderRadius: 16 }}
              bodyStyle={{ padding: 0 }}
              title={
                <Space size={12}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: group.phase.color
                    }}
                  />
                  <Text strong style={{ color: group.phase.color }}>
                    {group.phase.label}
                  </Text>
                  <Tag style={{ margin: 0 }}>{group.tasks.length}项</Tag>
                </Space>
              }
            >
              <List
                dataSource={group.tasks}
                renderItem={(task) => {
                  const category = CATEGORY_MAP[task.category] || CATEGORY_MAP.other;
                  const priority = PRIORITY_MAP[task.priority] || PRIORITY_MAP[2];
                  const daysBefore = getDaysBeforeWedding(task.due_date);
                  
                  return (
                    <List.Item
                      style={{
                        padding: '20px 24px',
                        background: task.status === 1 ? '#f9f9f9' : '#fff',
                        opacity: task.status === 1 ? 0.6 : 1,
                        borderBottom: '1px solid #f0f0f0'
                      }}
                    >
                      <Space size={16} style={{ width: '100%', alignItems: 'flex-start' }}>
                        <Checkbox
                          checked={task.status === 1}
                          onChange={() => handleToggleTask(task.id, task.status)}
                          style={{ marginTop: 4 }}
                        />
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <Text
                              strong
                              style={{
                                fontSize: 16,
                                color: task.status === 1 ? '#999' : '#333',
                                textDecoration: task.status === 1 ? 'line-through' : 'none'
                              }}
                            >
                              {task.title}
                            </Text>
                            <Tag color={category.color} style={{ margin: 0 }}>
                              {category.name}
                            </Tag>
                            <Tag color={priority.color} style={{ margin: 0 }}>
                              <FlagOutlined /> {priority.name}
                            </Tag>
                          </div>
                          
                          {task.description && (
                            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                              {task.description}
                            </Text>
                          )}
                          
                          <Space size={16} style={{ color: '#999', fontSize: 13 }}>
                            <span>
                              <CalendarOutlined /> 截止：{task.due_date}
                            </span>
                            {daysBefore !== null && daysBefore >= 0 && (
                              <span>
                                <ClockCircleOutlined /> 婚前{daysBefore}天
                              </span>
                            )}
                            {daysBefore !== null && daysBefore < 0 && (
                              <span style={{ color: '#ff4d4f' }}>
                                <ClockCircleOutlined /> 已过期{Math.abs(daysBefore)}天
                              </span>
                            )}
                          </Space>
                        </div>
                        
                        <Space>
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(task)}
                            style={{ color: '#1890ff' }}
                          />
                          <Popconfirm
                            title="确定要删除这个任务吗？"
                            onConfirm={() => handleDeleteTask(task.id)}
                            okText="确定"
                            cancelText="取消"
                          >
                            <Button
                              type="text"
                              icon={<DeleteOutlined />}
                              danger
                            />
                          </Popconfirm>
                        </Space>
                      </Space>
                    </List.Item>
                  );
                }}
              />
            </Card>
          ))
        ) : (
          <Card style={{ borderRadius: 16 }}>
            <Empty
              description={
                <div style={{ padding: '40px 0' }}>
                  <Title level={4} style={{ color: '#999', marginBottom: 16 }}>
                    {filters.status !== 'all' || filters.category !== 'all' 
                      ? '没有符合条件的任务' 
                      : '暂无任务清单'}
                  </Title>
                  {filters.status === 'all' && filters.category === 'all' && (
                    <Text type="secondary">
                      设置婚礼信息后系统会自动生成筹备任务清单
                    </Text>
                  )}
                </div>
              }
            />
          </Card>
        )}
      </Spin>

      <Modal
        title={editingTask ? '编辑任务' : '添加任务'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingTask(null);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="任务名称"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="请输入任务名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="任务描述"
          >
            <Input.TextArea
              rows={3}
              placeholder="请输入任务描述（选填）"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="任务分类"
                rules={[{ required: true, message: '请选择任务分类' }]}
              >
                <Select placeholder="请选择分类">
                  {Object.entries(CATEGORY_MAP).map(([key, value]) => (
                    <Option key={key} value={key}>{value.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请选择优先级' }]}
              >
                <Radio.Group style={{ width: '100%' }}>
                  <Radio.Button value={1} style={{ width: '33%', textAlign: 'center' }}>高</Radio.Button>
                  <Radio.Button value={2} style={{ width: '33%', textAlign: 'center' }}>中</Radio.Button>
                  <Radio.Button value={3} style={{ width: '34%', textAlign: 'center' }}>低</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="due_date"
            label="截止日期"
            rules={[{ required: true, message: '请选择截止日期' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="选择截止日期"
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <Divider />

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  background: '#ff4d6d',
                  border: 'none'
                }}
              >
                {editingTask ? '保存修改' : '添加任务'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskList;
