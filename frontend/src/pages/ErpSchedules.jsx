import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Typography, Select, Modal, Form, Input, DatePicker, message, Calendar, Badge, List } from 'antd';
import { ScheduleOutlined, PlusOutlined, EditOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { getDesignerSchedules, createSchedule, updateSchedule } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ErpSchedules = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [viewMode, setViewMode] = useState('table');

  const statusMap = {
    scheduled: { color: 'blue', text: '已排期', icon: <ClockCircleOutlined /> },
    in_progress: { color: 'orange', text: '进行中', icon: <ClockCircleOutlined /> },
    completed: { color: 'green', text: '已完成', icon: <CheckCircleOutlined /> },
    cancelled: { color: 'default', text: '已取消', icon: <ClockCircleOutlined /> }
  };

  const typeMap = {
    site_visit: { color: 'blue', text: '现场交底' },
    material_select: { color: 'green', text: '材料选型' },
    presentation: { color: 'purple', text: '方案汇报' },
    design: { color: 'orange', text: '方案设计' },
    meeting: { color: 'cyan', text: '客户会议' },
    other: { color: 'default', text: '其他' }
  };

  const priorityMap = {
    1: { color: 'red', text: '紧急' },
    2: { color: 'orange', text: '重要' },
    3: { color: 'blue', text: '普通' }
  };

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize]);

  const loadData = async () => {
    setLoading(true);
    const res = await getDesignerSchedules({
      page: pagination.current,
      pageSize: pagination.pageSize
    });
    if (res.code === 200) {
      setData(res.data.list);
      setPagination(prev => ({ ...prev, total: res.data.total }));
    }
    setLoading(false);
  };

  const handleSubmit = async (values) => {
    const payload = {
      ...values,
      start_time: values.time_range[0].format('YYYY-MM-DD HH:mm:ss'),
      end_time: values.time_range[1].format('YYYY-MM-DD HH:mm:ss')
    };
    delete payload.time_range;

    const res = editingItem
      ? await updateSchedule(editingItem.id, payload)
      : await createSchedule(payload);

    if (res.code === 200) {
      message.success(editingItem ? '更新成功' : '创建成功');
      setModalVisible(false);
      setEditingItem(null);
      form.resetFields();
      loadData();
    } else {
      message.error(res.message);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    form.setFieldsValue({
      ...item,
      time_range: [dayjs(item.start_time), dayjs(item.end_time)]
    });
    setModalVisible(true);
  };

  const columns = [
    { title: '任务名称', dataIndex: 'task_name', key: 'task_name', ellipsis: true },
    { title: '类型', dataIndex: 'task_type', key: 'task_type', width: 120, render: v => <Tag color={typeMap[v]?.color}>{typeMap[v]?.text || v}</Tag> },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 100, render: v => <Tag color={priorityMap[v]?.color}>{priorityMap[v]?.text}</Tag> },
    { title: '关联项目', dataIndex: 'project_title', key: 'project_title', ellipsis: true },
    { title: '设计师', dataIndex: 'designer_name', key: 'designer_name', width: 100 },
    { title: '开始时间', dataIndex: 'start_time', key: 'start_time', width: 160, render: v => dayjs(v).format('MM-DD HH:mm') },
    { title: '结束时间', dataIndex: 'end_time', key: 'end_time', width: 160, render: v => dayjs(v).format('MM-DD HH:mm') },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: v => <Tag color={statusMap[v]?.color}>{statusMap[v]?.icon} {statusMap[v]?.text}</Tag> },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          {record.status === 'scheduled' && (
            <Button type="link" size="small" onClick={async () => {
              await updateSchedule(record.id, { status: 'completed' });
              message.success('已标记完成');
              loadData();
            }}>完成</Button>
          )}
        </Space>
      )
    }
  ];

  const getListData = (value) => {
    return data.filter(item => dayjs(item.start_time).isSame(value, 'day'));
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    return (
      <ul className="events" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {listData.slice(0, 3).map(item => (
          <li key={item.id} style={{ fontSize: 12, lineHeight: '20px' }}>
            <Badge status={item.status === 'completed' ? 'success' : 'processing'} text={
              <span style={{ color: typeMap[item.task_type]?.color }}>
                {item.task_name.substring(0, 8)}
              </span>
            } />
          </li>
        ))}
        {listData.length > 3 && (
          <li style={{ fontSize: 12, color: '#888' }}>+{listData.length - 3} 更多</li>
        )}
      </ul>
    );
  };

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>
          <ScheduleOutlined style={{ marginRight: 8 }} />
          设计师排期
        </Title>
        <Space>
          <Button.Group>
            <Button type={viewMode === 'table' ? 'primary' : 'default'} onClick={() => setViewMode('table')}>列表视图</Button>
            <Button type={viewMode === 'calendar' ? 'primary' : 'default'} onClick={() => setViewMode('calendar')}>日历视图</Button>
          </Button.Group>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingItem(null); form.resetFields(); setModalVisible(true); }}>
            新增排期
          </Button>
        </Space>
      </div>

      {viewMode === 'table' ? (
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条`
          }}
          onChange={(p) => setPagination(prev => ({ ...prev, current: p.current, pageSize: p.pageSize }))}
        />
      ) : (
        <Card>
          <Calendar
            dateCellRender={dateCellRender}
            value={selectedDate}
            onChange={setSelectedDate}
          />
          <Divider />
          <Title level={5}>{selectedDate.format('YYYY年MM月DD日')} 排期</Title>
          <List
            dataSource={getListData(selectedDate)}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Tag color={typeMap[item.task_type]?.color}>{typeMap[item.task_type]?.text}</Tag>}
                  title={item.task_name}
                  description={
                    <div>
                      <Text type="secondary">
                        {dayjs(item.start_time).format('HH:mm')} - {dayjs(item.end_time).format('HH:mm')}
                      </Text>
                      <Tag style={{ marginLeft: 8 }} color={statusMap[item.status]?.color}>{statusMap[item.status]?.text}</Tag>
                      {item.project_title && <span style={{ marginLeft: 8 }}>项目: {item.project_title}</span>}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      <Modal
        title={editingItem ? '编辑排期' : '新增排期'}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); setEditingItem(null); }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="task_name" label="任务名称" rules={[{ required: true }]}>
            <Input placeholder="请输入任务名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="task_type" label="任务类型" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(typeMap).map(([k, v]) => (
                    <Select.Option key={k} value={k}>{v.text}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="优先级" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(priorityMap).map(([k, v]) => (
                    <Select.Option key={k} value={parseInt(k)}>{v.text}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="time_range" label="时间范围" rules={[{ required: true }]}>
            <RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ErpSchedules;
