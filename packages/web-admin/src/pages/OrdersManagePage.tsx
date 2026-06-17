import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Drawer, Form, Input, Select, DatePicker, Space, Descriptions, Timeline, Progress, message, Row, Col } from 'antd';
import { SearchOutlined, EyeOutlined, DownloadOutlined, FilterOutlined, ReloadOutlined, TruckOutlined, SafetyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/api';

const types: Record<string, string> = {
  HK_MACAO_VISA: '港澳签注', TAIWAN_VISA: '赴台签注', ID_CARD_REPLACEMENT: '身份证补换领',
  VIOLATION_PAYMENT: '违章缴费', VEHICLE_INSPECTION: '六年免检',
};
const typeColors: Record<string, string> = { HK_MACAO_VISA: 'green', TAIWAN_VISA: 'cyan', ID_CARD_REPLACEMENT: 'geekblue', VIOLATION_PAYMENT: 'volcano', VEHICLE_INSPECTION: 'purple' };
const statusText: Record<string, string> = {
  CREATED: '待支付', PENDING_PICKUP: '待揽收', COURIER_ASSIGNED: '揽收员已分配', PICKED_UP: '已收件',
  OCR_PROCESSING: '识别中', PRE_REVIEW: '预审中', PRE_REVIEW_PASSED: '预审通过', PRE_REVIEW_FAILED: '预审不通过',
  SUBMITTED_FOR_APPROVAL: '待审批', APPROVING: '审批中', APPROVED: '审批通过', REJECTED: '审批驳回',
  CERTIFICATE_PRINTING: '制证中', PENDING_DELIVERY: '待寄出', IN_DELIVERY: '寄送中', COMPLETED: '已完成',
  CANCELLED: '已取消', EXPIRED: '已超时',
};
const statusColors: Record<string, string> = {
  CREATED: 'default', PENDING_PICKUP: 'processing', COURIER_ASSIGNED: 'processing', PICKED_UP: 'processing',
  OCR_PROCESSING: 'processing', PRE_REVIEW: 'processing', PRE_REVIEW_PASSED: 'success', PRE_REVIEW_FAILED: 'warning',
  SUBMITTED_FOR_APPROVAL: 'processing', APPROVING: 'processing', APPROVED: 'success', REJECTED: 'error',
  CERTIFICATE_PRINTING: 'processing', PENDING_DELIVERY: 'processing', IN_DELIVERY: 'processing', COMPLETED: 'success',
  CANCELLED: 'default', EXPIRED: 'warning',
};
const gdCities = ['广州市', '深圳市', '珠海市', '汕头市', '佛山市', '韶关市', '湛江市', '肇庆市', '江门市', '茂名市', '惠州市', '梅州市', '汕尾市', '河源市', '阳江市', '清远市', '东莞市', '中山市', '潮州市', '揭阳市', '云浮市'];

const OrdersManagePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm();
  const [list, setList] = useState<any[]>([]);

  const mockList = Array.from({ length: 50 }).map((_, i) => {
    const orderTypes = Object.keys(types) as any[];
    const ot = orderTypes[i % orderTypes.length];
    const statuses = Object.keys(statusText) as any[];
    const st = statuses[i % statuses.length];
    return {
      key: i, id: `ORD-${10000 + i}`,
      orderNo: `GD${ot === 'HK_MACAO_VISA' ? 'HKM' : ot === 'TAIWAN_VISA' ? 'TWN' : ot === 'ID_CARD_REPLACEMENT' ? 'IDC' : ot === 'VIOLATION_PAYMENT' ? 'VIO' : 'INS'}202406${String(1500 + i).padStart(6, '0')}`,
      orderType: ot,
      applicantCity: gdCities[i % gdCities.length],
      applicantName: `${['张', '李', '王', '陈', '刘', '黄'][i % 6]}**`,
      applicantPhone: `139****${String(5678 + i).slice(-4)}`,
      totalAmount: (80 + i * 3.5 + (i % 5) * 15).toFixed(2),
      paymentStatus: i % 7 === 0 ? 'UNPAID' : 'PAID',
      status: st,
      created: dayjs().subtract(i, 'hour').toISOString(),
      slaDeadline: dayjs().add(48 - i * 0.7, 'hour').toISOString(),
    };
  });

  useEffect(() => { setList(mockList); }, []);

  const columns: any[] = [
    { title: '订单号', dataIndex: 'orderNo', width: 200, render: (v, r) => <a onClick={() => { setDetail(r); setDrawerOpen(true); }} style={{ fontFamily: 'monospace' }}>{v}</a> },
    { title: '业务类型', dataIndex: 'orderType', width: 120, render: v => <Tag color={typeColors[v]}>{types[v]}</Tag> },
    { title: '办理地市', dataIndex: 'applicantCity', width: 90, render: v => <Tag>{v}</Tag> },
    { title: '申请人', width: 100, render: (_, r) => <div><div>{r.applicantName}</div><div style={{ fontSize: 11, color: '#999' }}>{r.applicantPhone}</div></div> },
    { title: '订单金额(元)', dataIndex: 'totalAmount', width: 100, align: 'right', sorter: (a, b) => parseFloat(a.totalAmount) - parseFloat(b.totalAmount), render: v => <b>¥{v}</b> },
    { title: '支付状态', dataIndex: 'paymentStatus', width: 90, render: v => v === 'PAID' ? <Tag color="green">已支付</Tag> : <Tag color="red">未支付</Tag> },
    { title: '当前状态', dataIndex: 'status', width: 120, render: v => <Tag color={statusColors[v]}>{statusText[v]}</Tag> },
    { title: 'SLA时效', width: 130, dataIndex: 'slaDeadline', render: (v) => {
      const d = dayjs(v); const diff = d.diff(dayjs(), 'hour'); const pct = Math.min(100, Math.max(0, 100 - diff / 72 * 100));
      return <div><Progress percent={Math.floor(pct)} size="small" status={diff < 0 ? 'exception' : diff < 12 ? 'active' : undefined} showInfo={false} /><div style={{ fontSize: 11, color: diff < 0 ? '#F53F3F' : diff < 12 ? '#FF7D00' : '#00B42A' }}>{d.format('MM-DD HH:mm')} {diff < 0 ? `已超时${-diff}h` : `剩${diff}h`}</div></div>;
    } },
    { title: '创建时间', dataIndex: 'created', width: 150, render: v => dayjs(v).format('MM-DD HH:mm:ss'), sorter: (a, b) => dayjs(a.created).valueOf() - dayjs(b.created).valueOf() },
    { title: '操作', width: 140, fixed: 'right', render: (_, r) => <Space>
      <Button size="small" icon={<EyeOutlined />} onClick={() => { setDetail(r); setDrawerOpen(true); }}>详情</Button>
      {['PENDING_PICKUP'].includes(r.status) && <Button size="small" type="primary" danger onClick={() => message.success('已强制指派揽收员')}>指派</Button>}
    </Space> },
  ];

  return (
    <div>
      <Card style={{ borderRadius: 10, marginBottom: 16 }} size="small" title={<span><FilterOutlined /> 筛选条件</span>}>
        <Form form={form} layout="inline">
          <Form.Item name="keyword" label="关键字"><Input allowClear placeholder="订单号/姓名/电话" prefix={<SearchOutlined />} style={{ width: 220 }} /></Form.Item>
          <Form.Item name="orderType" label="业务类型"><Select allowClear style={{ width: 140 }} options={Object.entries(types).map(([v, l]) => ({ value: v, label: l }))} /></Form.Item>
          <Form.Item name="status" label="订单状态"><Select allowClear style={{ width: 140 }} options={Object.entries(statusText).map(([v, l]) => ({ value: v, label: l }))} /></Form.Item>
          <Form.Item name="city" label="地市"><Select allowClear style={{ width: 130 }} options={gdCities.map(c => ({ value: c, label: c }))} /></Form.Item>
          <Form.Item label="创建时间"><DatePicker.RangePicker /></Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>查询</Button>
            <Button icon={<ReloadOutlined />} onClick={() => form.resetFields()}>重置</Button>
            <Button icon={<DownloadOutlined />}>导出Excel</Button>
          </Space>
        </Form>
      </Card>
      <Card style={{ borderRadius: 10 }} size="small" title={`📋 订单列表（共 ${list.length} 条）`}>
        <Table loading={loading} columns={columns} dataSource={list} scroll={{ x: 1500 }} rowKey="id" size="middle"
          pagination={{ pageSize: 15, showSizeChanger: true, showQuickJumper: true, showTotal: t => `共 ${t} 条` }} />
      </Card>

      <Drawer title={`订单详情 - ${detail?.orderNo || ''}`} width={720} open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {detail && (<>
          <Descriptions title="基本信息" column={2} bordered size="small">
            <Descriptions.Item label="订单号" span={2}><code style={{ color: '#165DFF' }}>{detail.orderNo}</code></Descriptions.Item>
            <Descriptions.Item label="业务类型"><Tag color={typeColors[detail.orderType]}>{types[detail.orderType]}</Tag></Descriptions.Item>
            <Descriptions.Item label="办理地市">{detail.applicantCity}</Descriptions.Item>
            <Descriptions.Item label="申请人">{detail.applicantName} {detail.applicantPhone}</Descriptions.Item>
            <Descriptions.Item label="支付状态">{detail.paymentStatus === 'PAID' ? <Tag color="green">已支付 ¥{detail.totalAmount}</Tag> : <Tag color="red">未支付</Tag>}</Descriptions.Item>
            <Descriptions.Item label="订单金额" span={2}><b style={{ color: '#F53F3F', fontSize: 16 }}>¥{detail.totalAmount}</b>
              <span style={{ marginLeft: 16, fontSize: 12, color: '#999' }}>（服务费¥25 + 规费¥80 + 快递费¥36）</span>
            </Descriptions.Item>
          </Descriptions>

          <Card title="🔄 全流程时效进度" size="small" style={{ marginTop: 16 }}>
            <Timeline
              mode="left"
              items={[
                { label: '用户提交', children: dayjs(detail.created).format('YYYY-MM-DD HH:mm:ss') + ' · 在线支付完成' },
                { label: '揽收上门', children: dayjs(detail.created).add(1.5, 'hour').format('MM-DD HH:mm') + ' · 广州1号支局·黄师傅' },
                { label: 'OCR识别+预审', children: '自动完成 · 识别率98.6% · 预审通过' },
                { label: statusText[detail.status] === '审批通过' ? '审批通过✅' : '省级审批中', color: statusText[detail.status] === '审批通过' ? 'green' : 'blue', children: statusText[detail.status] === '审批通过' ? '已对接广东省政务系统网关' : <Progress percent={62} status="active" size="small" showInfo={false} /> },
                { label: '制证中心', children: statusText[detail.status] === '审批通过' ? '完成制证，等待EMS寄出' : '待完成' },
                { label: 'EMS寄回', children: <span><TruckOutlined /> 暂无轨迹 · 预计2天送达</span> },
              ]}
            />
          </Card>

          <Card title="🔐 安全与合规" size="small" style={{ marginTop: 16 }}>
            <Row gutter={12}>
              <Space><Tag color="green"><SafetyOutlined /> 敏感字段已加密</Tag>
                <Tag color="blue">资金已进入监管账户</Tag>
                <Tag color="purple">操作审计全记录</Tag>
                <Tag color="cyan">对接公安库核验通过</Tag></Space>
            </Row>
          </Card>
        </>)}
      </Drawer>
    </div>
  );
};
export default OrdersManagePage;
