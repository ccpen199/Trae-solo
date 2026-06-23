import { useEffect, useState } from 'react';
import { Table, Card, Tag, Button, Modal, Rate, Form, Input, message, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import dayjs from 'dayjs';

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待接单' },
  processing: { color: 'blue', text: '处理中' },
  completed: { color: 'green', text: '待评价' },
  closed: { color: 'default', text: '已完成' },
};

export default function WorkOrders() {
  const navigate = useNavigate();
  const [list, setList] = useState<any[]>([]);
  const [rateModal, setRateModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form] = Form.useForm();

  const loadData = () => {
    api.get('/workorders').then((res) => setList(res.data));
  };

  useEffect(() => { loadData(); }, []);

  const handleRate = async (values: any) => {
    try {
      await api.post(`/workorders/${selected.id}/rate`, values);
      message.success('评价提交成功');
      setRateModal(false);
      form.resetFields();
      loadData();
    } catch (err: any) {
      message.error(err.response?.data?.message || '提交失败');
    }
  };

  const columns = [
    { title: '工单号', dataIndex: 'id', render: (v: string) => v.substring(0, 8) },
    { title: '类型', dataIndex: 'type', render: (t: string) => ({ plumbing: '水电', electrical: '电器', structural: '土建', other: '其他' }[t] || t) },
    { title: '标题', dataIndex: 'title' },
    { title: '优先级', dataIndex: 'priority', render: (p: string) => ({ high: <Tag color="red">高</Tag>, medium: <Tag color="orange">中</Tag>, low: <Tag color="blue">低</Tag> }[p]) },
    { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text}</Tag> },
    { title: '分配给', dataIndex: ['assignedTo', 'name'], render: (v: string) => v || '-' },
    { title: '创建时间', dataIndex: 'createdAt', render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      render: (_: any, record: any) => {
        if (record.status === 'completed') {
          return <Button size="small" type="primary" onClick={() => { setSelected(record); setRateModal(true); }}>评价</Button>;
        }
        return <Button size="small" onClick={() => message.info('工单详情：' + record.description)}>查看</Button>;
      },
    },
  ];

  return (
    <div>
      <Card
        title="我的报修工单"
        style={{ borderRadius: 12 }}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/workorders/new')}>提交报修</Button>}
      >
        {list.length === 0 ? (
          <Empty description="暂无工单，点击右上角提交报修" />
        ) : (
          <Table columns={columns} dataSource={list} rowKey="id" pagination={{ pageSize: 10 }} />
        )}
      </Card>

      <Modal title="服务评价" open={rateModal} onCancel={() => setRateModal(false)} footer={null}>
        <Form form={form} onFinish={handleRate} layout="vertical">
          <Form.Item name="rating" label="服务评分" rules={[{ required: true, message: '请评分' }]}>
            <Rate />
          </Form.Item>
          <Form.Item name="comment" label="评价内容">
            <Input.TextArea rows={4} placeholder="请输入您的评价..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>提交评价</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
