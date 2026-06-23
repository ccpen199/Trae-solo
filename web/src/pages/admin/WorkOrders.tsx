import { useEffect, useState } from 'react';
import { Table, Card, Tag, Button, Modal, Form, Select, message, Drawer, Descriptions, Rate, Timeline } from 'antd';
import { UserSwitchOutlined, CheckCircleOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../../api';
import dayjs from 'dayjs';

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待接单' },
  processing: { color: 'blue', text: '处理中' },
  completed: { color: 'green', text: '待评价' },
  closed: { color: 'default', text: '已完成' },
};

export default function AdminWorkOrders() {
  const [list, setList] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [assignModal, setAssignModal] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form] = Form.useForm();

  const loadData = () => {
    api.get('/workorders').then((res) => setList(res.data));
  };

  useEffect(() => {
    loadData();
    api.get('/auth').catch(() => {}).finally(() => {
      api.get('/communities').then(async (res) => {
        if (res.data.length > 0) {
          const all: any[] = [];
          for (const c of res.data) {
            const users = await api.get('/communities').catch(() => ({ data: [] }));
            all.push(...users.data);
          }
          setWorkers(all);
        }
      });
    });
  }, []);

  const handleAssign = async (values: any) => {
    try {
      await api.post(`/workorders/${selected.id}/assign`, values);
      message.success('派单成功');
      setAssignModal(false);
      loadData();
    } catch (err: any) {
      message.error(err.response?.data?.message || '派单失败');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await api.post(`/workorders/${id}/complete`);
      message.success('工单已标记完成');
      loadData();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: '工单号', dataIndex: 'id', render: (v: string) => v.substring(0, 10) },
    { title: '类型', dataIndex: 'type', render: (t: string) => ({ plumbing: '水电', electrical: '电器', structural: '土建', other: '其他' }[t] || t) },
    { title: '标题', dataIndex: 'title' },
    { title: '报修人', dataIndex: ['user', 'name'] },
    { title: '优先级', dataIndex: 'priority', render: (p: string) => ({ high: <Tag color="red">紧急</Tag>, medium: <Tag color="orange">中</Tag>, low: <Tag color="blue">低</Tag> }[p]) },
    { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text}</Tag> },
    { title: '处理人', dataIndex: ['assignedTo', 'name'], render: (v: string) => v || '-' },
    {
      title: '评分',
      dataIndex: 'rating',
      render: (v: number) => v ? <Rate disabled value={v} /> : '-',
    },
    { title: '创建时间', dataIndex: 'createdAt', render: (t: string) => dayjs(t).format('MM-DD HH:mm') },
    {
      title: '操作',
      render: (_: any, record: any) => (
        <>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setDetail(record)}>详情</Button>
          {record.status === 'pending' && (
            <Button type="link" size="small" icon={<UserSwitchOutlined />} onClick={() => { setSelected(record); setAssignModal(true); }}>
              派单
            </Button>
          )}
          {record.status === 'processing' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleComplete(record.id)}>
              完成
            </Button>
          )}
        </>
      ),
    },
  ];

  return (
    <div>
      <Card title="工单管理" style={{ borderRadius: 12 }}>
        <Table columns={columns} dataSource={list} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="智能派单" open={assignModal} onCancel={() => setAssignModal(false)} footer={null}>
        <Form form={form} onFinish={handleAssign} layout="vertical">
          <Form.Item label="分配给维修人员" name="workerId" rules={[{ required: true, message: '请选择维修人员' }]}>
            <Select placeholder="选择维修人员">
              <Select.Option value="mock-worker-1">李师傅（水电）</Select.Option>
              <Select.Option value="mock-worker-2">王师傅（电器）</Select.Option>
              <Select.Option value="mock-worker-3">张师傅（土建）</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>确认派单</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title="工单详情" open={!!detail} onClose={() => setDetail(null)} width={560}>
        {detail && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="工单号">{detail.id}</Descriptions.Item>
              <Descriptions.Item label="标题">{detail.title}</Descriptions.Item>
              <Descriptions.Item label="类型">{detail.type}</Descriptions.Item>
              <Descriptions.Item label="优先级">
                {{ high: '紧急', medium: '中', low: '低' }[detail.priority]}
              </Descriptions.Item>
              <Descriptions.Item label="报修人">{detail.user?.name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{detail.user?.phone}</Descriptions.Item>
              <Descriptions.Item label="地址">{detail.location?.address || detail.user?.address}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[detail.status]?.color}>{statusMap[detail.status]?.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="处理人">{detail.assignedTo?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="问题描述">{detail.description}</Descriptions.Item>
              {detail.rating && (
                <>
                  <Descriptions.Item label="服务评分"><Rate disabled value={detail.rating} /></Descriptions.Item>
                  <Descriptions.Item label="评价内容">{detail.ratingComment || '-'}</Descriptions.Item>
                </>
              )}
            </Descriptions>
            <h4 style={{ marginTop: 24 }}>工单时间线</h4>
            <Timeline
              items={[
                { color: 'green', children: `创建：${dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm')}` },
                ...(detail.completedAt ? [{ color: 'blue', children: `完成：${dayjs(detail.completedAt).format('YYYY-MM-DD HH:mm')}` }] : []),
              ]}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
}
