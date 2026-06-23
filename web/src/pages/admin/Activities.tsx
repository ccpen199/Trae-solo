import { useEffect, useState } from 'react';
import { Table, Card, Tag, Button, Modal, Form, Input, DatePicker, TimePicker, InputNumber, message, Drawer, List, Avatar, Badge, Descriptions } from 'antd';
import { PlusOutlined, UserOutlined, TeamOutlined, CalendarOutlined } from '@ant-design/icons';
import api from '../../api';
import dayjs from 'dayjs';

export default function AdminActivities() {
  const [list, setList] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [form] = Form.useForm();

  const loadData = () => {
    api.get('/activities').then((res) => setList(res.data));
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (values: any) => {
    try {
      await api.post('/activities', {
        ...values,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm'),
      });
      message.success('活动创建成功');
      setModal(false);
      form.resetFields();
      loadData();
    } catch (err: any) {
      message.error(err.response?.data?.message || '创建失败');
    }
  };

  const viewRegistrations = async (id: string) => {
    const activity = list.find((a) => a.id === id);
    setDetail(activity);
    const res = await api.get(`/activities/${id}/registrations`);
    setRegistrations(res.data);
  };

  const columns = [
    { title: '活动标题', dataIndex: 'title' },
    { title: '活动地点', dataIndex: 'location' },
    { title: '开始时间', render: (_: any, r: any) => `${r.startDate} ${r.startTime}` },
    { title: '结束时间', render: (_: any, r: any) => `${r.endDate} ${r.endTime}` },
    {
      title: '报名情况',
      render: (_: any, r: any) => (
        <span>
          <TeamOutlined /> {r.registrations?.length || 0}
          {r.maxParticipants > 0 && <span style={{ color: '#999' }}> / {r.maxParticipants}</span>}
        </span>
      ),
    },
    { title: '状态', dataIndex: 'status', render: (s: string) => s === 'published' ? <Tag color="green">已发布</Tag> : <Tag>草稿</Tag> },
    {
      title: '操作',
      render: (_: any, record: any) => (
        <Button type="link" size="small" onClick={() => viewRegistrations(record.id)}>
          查看报名
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="社区活动管理"
        style={{ borderRadius: 12 }}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setModal(true)}>创建活动</Button>}
      >
        <Table columns={columns} dataSource={list} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="创建社区活动" open={modal} onCancel={() => setModal(false)} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="活动标题" name="title" rules={[{ required: true }]}>
            <Input placeholder="请输入活动标题" />
          </Form.Item>
          <Form.Item label="活动地点" name="location" rules={[{ required: true }]}>
            <Input placeholder="活动地点" />
          </Form.Item>
          <Form.Item label="活动详情" name="description" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="请详细描述活动内容" />
          </Form.Item>
          <Form.Item label="开始日期" name="startDate" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="结束日期" name="endDate" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="开始时间" name="startTime" rules={[{ required: true }]}>
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="结束时间" name="endTime" rules={[{ required: true }]}>
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="最大参与人数" name="maxParticipants" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="0表示不限制" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>发布活动</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title="活动报名详情" open={!!detail} onClose={() => setDetail(null)} width={560}>
        {detail && (
          <div>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="活动标题">{detail.title}</Descriptions.Item>
              <Descriptions.Item label="活动时间">{detail.startDate} {detail.startTime} ~ {detail.endDate} {detail.endTime}</Descriptions.Item>
              <Descriptions.Item label="活动地点">{detail.location}</Descriptions.Item>
              <Descriptions.Item label="报名人数">
                <Badge count={registrations.length} showZero />
              </Descriptions.Item>
            </Descriptions>
            <h4 style={{ marginTop: 24 }}>报名列表</h4>
            {registrations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无报名</div>
            ) : (
              <List
                dataSource={registrations}
                renderItem={(r) => (
                  <List.Item key={r.id}>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <div>
                          {r.user?.name || r.contactName}
                          <Tag style={{ marginLeft: 8 }}>{r.participantCount}人</Tag>
                        </div>
                      }
                      description={
                        <div>
                          <div>{r.contactPhone}</div>
                          <div style={{ color: '#999' }}>{dayjs(r.createdAt).format('YYYY-MM-DD HH:mm')} 报名</div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
