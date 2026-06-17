import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Descriptions, Timeline, Spin, Divider, Tag, Modal, message, Steps, Space } from 'antd';
import { ArrowLeftOutlined, ExclamationCircleOutlined, DownloadOutlined, TruckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/api';

const statusSteps: Record<string, number> = {
  CREATED: 0, PENDING_PICKUP: 1, COURIER_ASSIGNED: 1, PICKED_UP: 2,
  OCR_PROCESSING: 2, PRE_REVIEW: 3, PRE_REVIEW_PASSED: 3, PRE_REVIEW_FAILED: 3,
  SUBMITTED_FOR_APPROVAL: 4, APPROVING: 4, APPROVED: 5, REJECTED: 5,
  CERTIFICATE_PRINTING: 5, PENDING_DELIVERY: 6, IN_DELIVERY: 6, COMPLETED: 7,
};

const stepTitles = ['提交申请', '等待揽收', '材料已收件', '材料预审', '审批机关审核', '制证完成', 'EMS寄送中', '已完成'];

const statusText: Record<string, string> = {
  CREATED: '待支付', PENDING_PICKUP: '等待揽收', COURIER_ASSIGNED: '揽收员已分配', PICKED_UP: '已收件',
  OCR_PROCESSING: '材料识别中', PRE_REVIEW: '预审中', PRE_REVIEW_PASSED: '预审通过', PRE_REVIEW_FAILED: '预审不通过',
  SUBMITTED_FOR_APPROVAL: '待审批', APPROVING: '审批中', APPROVED: '审批通过', REJECTED: '审批驳回',
  CERTIFICATE_PRINTING: '制证中', PENDING_DELIVERY: '等待寄送', IN_DELIVERY: '寄送中', COMPLETED: '已完成',
  CANCELLED: '已取消', EXPIRED: '已超时',
};

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await api.get(`/orders/${id}`);
      setData(res.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const handleCancel = () => {
    Modal.confirm({
      title: '确认取消订单',
      content: '订单取消后不可恢复，是否继续？',
      onOk: async () => {
        await api.post(`/orders/${id}/cancel`);
        message.success('订单已取消');
        load();
      },
    });
  };

  const handlePay = async () => {
    const res: any = await api.post(`/payments/${id}/create`, { channel: 'WECHAT_PAY' });
    message.info('调起微信支付...');
    setTimeout(() => load(), 2000);
  };

  const viewEms = async () => {
    const res: any = await api.get(`/ems/orders/${id}/shipments`);
    if (res.data.length > 0) {
      navigate(`/ems/${res.data[0].shipmentNo}`);
    } else {
      message.info('暂无EMS运单信息');
    }
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}><Spin size="large" /></div>;
  if (!data) return <div>订单不存在</div>;

  return (
    <div>
      <div className="page-header" style={{ padding: 16 }}>
        <div onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', marginBottom: 12, cursor: 'pointer' }}>
          <ArrowLeftOutlined style={{ marginRight: 8 }} />返回
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{data.orderType.replace(/_/g, ' / ')}</div>
            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>订单号：{data.orderNo}</div>
          </div>
          <Tag color={data.status === 'COMPLETED' ? 'green' : data.status === 'REJECTED' ? 'red' : 'blue'}>
            {statusText[data.status]}
          </Tag>
        </div>
        {new Date(data.slaDeadline).getTime() - Date.now() < 24 * 3600 * 1000 && data.status !== 'COMPLETED' && (
          <div style={{ marginTop: 12, padding: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center' }}>
            <ExclamationCircleOutlined style={{ marginRight: 6 }} />
            SLA截止：{dayjs(data.slaDeadline).format('MM月DD日 HH:mm')}
          </div>
        )}
      </div>

      <div style={{ padding: 16, background: '#fff' }}>
        <Steps
          size="small"
          direction="vertical"
          current={statusSteps[data.status] || 0}
          status={data.status === 'REJECTED' ? 'error' : data.status === 'CANCELLED' || data.status === 'EXPIRED' ? 'error' : 'process'}
          items={stepTitles.map(t => ({ title: t }))}
        />
      </div>

      <Card style={{ margin: 12, borderRadius: 12 }} size="small" title="📋 订单信息">
        <Descriptions column={1} size="small">
          <Descriptions.Item label="办理城市">{data.applicantCity}</Descriptions.Item>
          <Descriptions.Item label="取件地址">{data.pickupAddressMasked}</Descriptions.Item>
          <Descriptions.Item label="取件联系人">{data.pickupContact?.name} {data.pickupContact?.phone}</Descriptions.Item>
          <Descriptions.Item label="送达地址">{data.deliveryAddressMasked}</Descriptions.Item>
          <Descriptions.Item label="送达联系人">{data.deliveryContact?.name} {data.deliveryContact?.phone}</Descriptions.Item>
          <Descriptions.Item label="提交时间">{dayjs(data.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card style={{ margin: 12, borderRadius: 12 }} size="small" title="💰 费用明细">
        <div className="amount-row"><span>服务服务费</span><span>¥{data.serviceFee}</span></div>
        <div className="amount-row"><span>政府规费</span><span>¥{data.governmentFee}</span></div>
        <div className="amount-row"><span>EMS快递费（往返）</span><span>¥{data.courierFee}</span></div>
        <div className="amount-row" style={{ fontWeight: 600, fontSize: 15, border: 'none' }}>
          <span>合计金额</span><span style={{ color: '#F53F3F' }}>¥{data.totalAmount}</span>
        </div>
      </Card>

      {data.emsShipments?.length > 0 && (
        <Card style={{ margin: 12, borderRadius: 12 }} size="small"
          title={<span><TruckOutlined style={{ marginRight: 6 }} />EMS物流轨迹</span>}
          extra={<Button size="small" type="link" onClick={viewEms}>查看详情</Button>}
        >
          {data.emsShipments[0].trackingLogs?.slice(-3).reverse().map((l: any, i: number) => (
            <div key={i} style={{ fontSize: 12, padding: '4px 0', color: i === 0 ? '#00B42A' : '#666' }}>
              <div style={{ fontWeight: i === 0 ? 500 : 400 }}>{l.statusDesc}</div>
              <div style={{ color: '#999' }}>{l.location} · {dayjs(l.occurredAt).format('MM-DD HH:mm')}</div>
            </div>
          ))}
        </Card>
      )}

      {data.statusLogs?.length > 0 && (
        <Card style={{ margin: 12, borderRadius: 12 }} size="small" title="📜 办理进度">
          <Timeline
            className="timeline-with-status"
            items={data.statusLogs.map((l: any) => ({
              color: l.toStatus === 'COMPLETED' ? 'green' : l.toStatus === 'REJECTED' ? 'red' : 'blue',
              children: (
                <div>
                  <div style={{ fontWeight: 500 }}>{statusText[l.toStatus] || l.toStatus}
                    {l.remark && <span style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>{l.remark}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#999' }}>{dayjs(l.createdAt).format('MM-DD HH:mm:ss')}</div>
                </div>
              ),
            }))}
          />
        </Card>
      )}

      {data.electronicReceipt && (
        <Card style={{ margin: 12, borderRadius: 12 }} size="small" title="📄 电子回执" extra={<Button size="small" icon={<DownloadOutlined />}>下载</Button>}>
          <div style={{ fontSize: 13 }}>回执编号：{data.electronicReceipt.receiptNo}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>签发时间：{dayjs(data.electronicReceipt.issuedAt).format('YYYY-MM-DD HH:mm')}</div>
          <div style={{ marginTop: 8, padding: 8, background: '#f5f7fa', borderRadius: 6, fontSize: 11, color: '#666' }}>
            验证码：{data.electronicReceipt.verifyCode} · 可在省级政务平台核验
          </div>
        </Card>
      )}

      <div style={{ padding: 16, display: 'flex', gap: 10 }}>
        {['CREATED'].includes(data.status) && (
          <Button type="primary" block onClick={handlePay}>立即支付 ¥{data.totalAmount}</Button>
        )}
        {['COMPLETED', 'APPROVED', 'PENDING_DELIVERY', 'IN_DELIVERY'].includes(data.status) && (
          <Button block icon={<TruckOutlined />} onClick={viewEms}>查看物流</Button>
        )}
        {['CREATED', 'PENDING_PICKUP', 'COURIER_ASSIGNED'].includes(data.status) && (
          <Button danger block onClick={handleCancel}>取消订单</Button>
        )}
      </div>
    </div>
  );
};

export default OrderDetailPage;
