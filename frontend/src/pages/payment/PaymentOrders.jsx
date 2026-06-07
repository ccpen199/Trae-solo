import React, { useEffect, useState } from 'react';
import { Table, Button, Select, Tag, Typography, message, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const { Title } = Typography;
const { Option } = Select;

const categoryMap = { water: '自来水', electricity: '电费', gas: '天然气', heating: '供暖', tuition: '学费', party_fee: '党费', social_security: '社保' };
const statusColor = { paid: 'green', pending: 'orange', failed: 'red', refunded: 'default' };
const statusMap = { paid: '已支付', pending: '待支付', failed: '支付失败', refunded: '已退款' };
const payTypeMap = { normal: '正常缴费', arrears: '补缴欠费', prepay: '预存缴费' };
const autoDebitMap = { 0: '未签约', 1: '已签约', 2: '本次代扣' };

export default function PaymentOrders() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const load = async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, pageSize: 10 };
      if (status) params.status = status;
      const res = await api.get('/payment/orders', { params });
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch (e) { message.error(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { title: '订单号', dataIndex: 'order_no', width: 170, fixed: 'left' },
    { title: '缴费户号', dataIndex: 'account_no', width: 130 },
    { title: '身份证号', dataIndex: 'user_id_card', width: 170 },
    { title: '缴费类型', dataIndex: 'category', width: 100, render: v => categoryMap[v] || v },
    { title: '项目名称', dataIndex: 'item_name', width: 120 },
    { title: '缴费方式', dataIndex: 'pay_type', width: 100, render: v => payTypeMap[v] || v },
    { title: '收款单位', dataIndex: 'payee_name', width: 100 },
    { title: '应缴金额', dataIndex: 'payable_amount', width: 100, render: v => v ? v.toFixed(2) : '-' },
    { title: '实缴金额', dataIndex: 'amount', width: 100, render: v => v?.toFixed(2) },
    { title: '代扣状态', dataIndex: 'auto_debit', width: 100, render: v => {
      const map = { 0: { text: '未签约', color: 'default' }, 1: { text: '已签约', color: 'blue' }, 2: { text: '本次代扣', color: 'green' } };
      const s = map[v] || map[0];
      return <Tag color={s.color}>{s.text}</Tag>;
    } },
    { title: '核销状态', dataIndex: 'status', width: 90, render: v => {
      const map = { paid: { text: '已核销', color: 'green' }, pending: { text: '待核销', color: 'orange' }, failed: { text: '核销失败', color: 'red' }, refunded: { text: '已退缴', color: 'default' } };
      const s = map[v] || map.pending;
      return <Tag color={s.color}>{s.text}</Tag>;
    } },
    { title: '异常反馈', dataIndex: 'remark', width: 120, render: v => {
      if (!v) return <Tag color="default">无异常</Tag>;
      if (v.includes('失败') || v.includes('错误')) return <Tag color="red">交易异常</Tag>;
      if (v.includes('延迟') || v.includes('超时')) return <Tag color="orange">处理延迟</Tag>;
      return <Tag color="blue">{v.substring(0, 8)}...</Tag>;
    } },
    { title: '支付时间', dataIndex: 'paid_at', width: 160 },
  ];

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/payment')} style={{ marginBottom: 16 }}>返回缴费</Button>
      <Title level={4}>缴费记录</Title>
      <div style={{ marginBottom: 16 }}>
        <Select placeholder="状态" value={status || undefined} onChange={v => { setStatus(v || ''); load(1); }} style={{ width: 120 }} allowClear>
          <Option value="paid">已支付</Option>
          <Option value="pending">待支付</Option>
        </Select>
      </div>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
        pagination={{ current: page, total, pageSize: 10, onChange: p => { setPage(p); load(p); } }} scroll={{ x: 1100 }} />
    </div>
  );
}
