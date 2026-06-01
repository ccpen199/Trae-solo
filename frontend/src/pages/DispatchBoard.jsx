import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Descriptions, Space, message, Rate, Spin, Divider, Empty } from 'antd';
import { api } from '../api';
import dayjs from 'dayjs';

const statusMap = {
  pending: { color: 'default', text: '待派单' },
  dispatched: { color: 'processing', text: '已派单' },
  accepted: { color: 'blue', text: '已接单' },
  departed: { color: 'cyan', text: '已出发' },
  arrived: { color: 'green', text: '已到场' },
  repairing: { color: 'orange', text: '维修中' },
  quoting: { color: 'gold', text: '报价中' },
  confirmed: { color: 'lime', text: '已确认' },
  completed: { color: 'success', text: '已完成' },
  cancelled: { color: 'error', text: '已取消' },
  exception: { color: 'red', text: '异常' },
};

const priorityMap = {
  low: { color: 'default', text: '低' },
  normal: { color: 'blue', text: '普通' },
  high: { color: 'orange', text: '高' },
  urgent: { color: 'red', text: '紧急' },
};

export default function DispatchBoard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recModal, setRecModal] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);

  const loadPending = async () => {
    setLoading(true);
    try {
      const data = await api.dispatch.pending();
      setOrders(data);
    } catch (err) { message.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadPending(); }, []);

  const showRecommendations = async (order) => {
    setSelectedOrder(order);
    setRecModal(true);
    setRecLoading(true);
    try {
      const data = await api.dispatch.recommendations(order.id);
      setRecommendations(data);
    } catch (err) {
      message.error(err.message);
      setRecommendations([]);
    } finally {
      setRecLoading(false);
    }
  };

  const handleAssign = async (engineerId, dispatchType) => {
    if (!selectedOrder) return;
    try {
      await api.dispatch.assign({
        order_id: selectedOrder.id,
        engineer_id: engineerId,
        dispatch_type: dispatchType || 'manual',
      });
      message.success('派工成功');
      setRecModal(false);
      loadPending();
    } catch (err) { message.error(err.message); }
  };

  const showDetail = async (id) => {
    try {
      const data = await api.workorders.get(id);
      setDetailOrder(data);
      setDetailModal(true);
    } catch (err) { message.error(err.message); }
  };

  const columns = [
    { title: '工单号', dataIndex: 'order_no', key: 'order_no', render: (t, r) => <a onClick={() => showDetail(r.id)}>{t}</a> },
    { title: '故障描述', dataIndex: 'fault_description', key: 'fault_description', ellipsis: true },
    { title: '地址', key: 'address', render: (_, r) => `${r.city || ''}${r.district || ''}${r.street || ''}`, ellipsis: true },
    { title: '优先级', dataIndex: 'priority', key: 'priority', render: v => <Tag color={priorityMap[v]?.color}>{priorityMap[v]?.text}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', render: v => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text}</Tag> },
    { title: 'SLA截止', dataIndex: 'sla_deadline', key: 'sla', render: v => {
      if (!v) return '-';
      const overdue = dayjs(v).isBefore(dayjs());
      return <span style={{ color: overdue ? 'red' : 'inherit' }}>{dayjs(v).format('MM-DD HH:mm')}</span>;
    }},
    { title: '已有派工', key: 'dispatches', render: (_, r) => {
      if (!r.existingDispatches || r.existingDispatches.length === 0) return <Tag>无</Tag>;
      return r.existingDispatches.map(d => (
        <Tag key={d.id} color={d.status === 'accepted' ? 'green' : d.status === 'pending' ? 'blue' : 'default'}>
          {d.engineer_name}({d.status === 'pending' ? '待响应' : d.status === 'accepted' ? '已接受' : d.status})
        </Tag>
      ));
    }},
    { title: '操作', key: 'action', render: (_, r) => (
      <Space>
        <Button type="primary" size="small" onClick={() => showRecommendations(r)}>派工</Button>
      </Space>
    )},
  ];

  return (
    <div>
      <Card title="待派工单" extra={<Button onClick={loadPending}>刷新</Button>}>
        <Table columns={columns} dataSource={orders} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title={`派工推荐 - ${selectedOrder?.order_no || ''}`} open={recModal} onCancel={() => setRecModal(false)} width={700} footer={null}>
        {recLoading ? <Spin /> : (
          recommendations.length === 0 ? <Empty description="无可用工程师" /> : (
            <div>
              {recommendations.map((rec, idx) => (
                <Card key={idx} size="small" style={{ marginBottom: 12 }} hoverable>
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="工程师">{rec.engineer.name}</Descriptions.Item>
                    <Descriptions.Item label="电话">{rec.engineer.phone}</Descriptions.Item>
                    <Descriptions.Item label="技能">{rec.engineer.skills.join('、') || '-'}</Descriptions.Item>
                    <Descriptions.Item label="区域">{rec.engineer.area || '-'}</Descriptions.Item>
                    <Descriptions.Item label="推荐分"><strong style={{ fontSize: 18, color: '#1890ff' }}>{rec.score}</strong></Descriptions.Item>
                    <Descriptions.Item label="当前工单数">{rec.currentWorkload}</Descriptions.Item>
                    <Descriptions.Item label="推荐理由" span={2}>{rec.reasons.join('；')}</Descriptions.Item>
                  </Descriptions>
                  <div style={{ textAlign: 'right', marginTop: 8 }}>
                    <Space>
                      <Button size="small" onClick={() => handleAssign(rec.engineer.id, 'auto')}>自动派单</Button>
                      <Button type="primary" size="small" onClick={() => handleAssign(rec.engineer.id, 'manual')}>手动派单</Button>
                    </Space>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}
      </Modal>

      <Modal title="工单详情" open={detailModal} onCancel={() => setDetailModal(false)} width={700} footer={null}>
        {detailOrder && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="工单号">{detailOrder.order_no}</Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color={statusMap[detailOrder.status]?.color}>{statusMap[detailOrder.status]?.text}</Tag></Descriptions.Item>
            <Descriptions.Item label="优先级"><Tag color={priorityMap[detailOrder.priority]?.color}>{priorityMap[detailOrder.priority]?.text}</Tag></Descriptions.Item>
            <Descriptions.Item label="服务类型">{detailOrder.service_type || '-'}</Descriptions.Item>
            <Descriptions.Item label="地址" span={2}>{detailOrder.province}{detailOrder.city}{detailOrder.district}{detailOrder.street || ''}{detailOrder.detail ? ' ' + detailOrder.detail : ''}</Descriptions.Item>
            <Descriptions.Item label="故障描述" span={2}>{detailOrder.fault_description}</Descriptions.Item>
            <Descriptions.Item label="联系人">{detailOrder.contact_name}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{detailOrder.contact_phone}</Descriptions.Item>
            <Descriptions.Item label="SLA截止">{detailOrder.sla_deadline ? dayjs(detailOrder.sla_deadline).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{dayjs(detailOrder.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
