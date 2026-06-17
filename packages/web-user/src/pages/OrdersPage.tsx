import React, { useEffect, useState } from 'react';
import { Tabs, Empty, Spin, Tag, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '@/api';
import { OrderStatus } from '@platform/shared';

const statusColors: Record<string, string> = {
  CREATED: 'default', PENDING_PICKUP: 'processing', COURIER_ASSIGNED: 'processing', PICKED_UP: 'processing',
  OCR_PROCESSING: 'processing', PRE_REVIEW: 'processing', PRE_REVIEW_PASSED: 'processing', PRE_REVIEW_FAILED: 'warning',
  SUBMITTED_FOR_APPROVAL: 'processing', APPROVING: 'processing', APPROVED: 'success', REJECTED: 'error',
  CERTIFICATE_PRINTING: 'processing', PENDING_DELIVERY: 'processing', IN_DELIVERY: 'processing', COMPLETED: 'success',
  CANCELLED: 'default', EXPIRED: 'warning',
};

const statusText: Record<string, string> = {
  CREATED: '待支付', PENDING_PICKUP: '等待揽收', COURIER_ASSIGNED: '揽收员已分配', PICKED_UP: '已收件',
  OCR_PROCESSING: '材料识别中', PRE_REVIEW: '预审中', PRE_REVIEW_PASSED: '预审通过', PRE_REVIEW_FAILED: '预审不通过',
  SUBMITTED_FOR_APPROVAL: '待审批', APPROVING: '审批中', APPROVED: '审批通过', REJECTED: '审批驳回',
  CERTIFICATE_PRINTING: '制证中', PENDING_DELIVERY: '等待寄送', IN_DELIVERY: '寄送中', COMPLETED: '已完成',
  CANCELLED: '已取消', EXPIRED: '已超时',
};

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<any[]>([]);

  const load = async (status?: string) => {
    setLoading(true);
    try {
      const params: any = { page: 1, pageSize: 50 };
      if (status && status !== 'all') params.status = status;
      const res: any = await api.get('/orders/list', { params });
      setList(res.data.list || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const tabItems = [
    { key: 'all', label: '全部' },
    { key: 'PENDING_PICKUP', label: '待揽收' },
    { key: 'APPROVING', label: '审批中' },
    { key: 'IN_DELIVERY', label: '寄送中' },
    { key: 'COMPLETED', label: '已完成' },
  ].map(t => ({ ...t, children: null }));

  return (
    <div>
      <div className="page-header">
        <div style={{ fontSize: 20, fontWeight: 600 }}>我的订单</div>
        <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>共 {list.length} 条记录</div>
      </div>
      <Tabs
        activeKey={undefined as any}
        defaultActiveKey="all"
        onChange={(k) => load(k)}
        items={tabItems}
        style={{ padding: '0 12px', background: '#fff' }}
      />
      <Spin spinning={loading}>
        {list.length === 0 ? (
          <Empty style={{ marginTop: 80 }} description="暂无订单" />
        ) : (
          list.map(o => (
            <div key={o.id} className="order-card" onClick={() => navigate(`/order/${o.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{o.orderType.replace(/_/g, ' / ')}</div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>订单号：{o.orderNo}</div>
                </div>
                <Tag color={statusColors[o.status]} style={{ borderRadius: 12 }}>{statusText[o.status]}</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 13 }}>
                <span style={{ color: '#666' }}>联系人：{o.pickupContact?.name || '-'}</span>
                <span style={{ color: '#F53F3F', fontWeight: 500 }}>¥{o.totalAmount}</span>
              </div>
              <div style={{ fontSize: 12, color: '#bbb', marginTop: 8 }}>
                提交时间：{dayjs(o.createdAt).format('MM-DD HH:mm')} · 截止：{dayjs(o.slaDeadline).format('MM-DD HH:mm')}
              </div>
              {['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(o.status) ? null : (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, gap: 8 }}>
                  {!['PENDING_PICKUP'].includes(o.status) || null}
                  <Button size="small" onClick={(e) => { e.stopPropagation(); navigate(`/order/${o.id}`); }}>查看详情</Button>
                </div>
              )}
            </div>
          ))
        )}
      </Spin>
    </div>
  );
};

export default OrdersPage;
