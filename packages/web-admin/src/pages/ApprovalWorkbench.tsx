import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Modal, Drawer, Descriptions, Space, Tooltip, message, Tabs, Form, Input, Radio } from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/api';
import type { ColumnsType } from 'antd/es/table';

const statusText: Record<string, string> = {
  SUBMITTED_FOR_APPROVAL: '待提交网关', APPROVING: '省级系统审批中', APPROVED: '审批通过',
  REJECTED: '审批驳回', PRE_REVIEW: '预审中', PRE_REVIEW_FAILED: '预审未通过',
  OCR_PROCESSING: 'OCR识别中',
};
const statusColor: Record<string, string> = {
  SUBMITTED_FOR_APPROVAL: 'processing', APPROVING: 'processing', APPROVED: 'success',
  REJECTED: 'error', PRE_REVIEW: 'default', PRE_REVIEW_FAILED: 'warning',
  OCR_PROCESSING: 'blue',
};

const mockData = Array.from({ length: 28 }).map((_, i) => ({
  key: i,
  id: `ORD-${10000 + i}`,
  orderNo: `GDHKM${202406}${String(15 + i).padStart(6, '0')}`,
  orderType: ['港澳签注-G签', '港澳签注-T签', '赴台签注', '身份证补换领'][i % 4],
  city: ['广州市', '深圳市', '佛山市', '东莞市', '珠海市'][i % 5],
  applicantName: `${['张','李','王','陈','刘'][i % 5]}**`,
  idCard: `4401****${String(1234 + i).slice(-4)}`,
  status: ['SUBMITTED_FOR_APPROVAL', 'APPROVING', 'PRE_REVIEW', 'OCR_PROCESSING'][i % 4],
  submittedAt: dayjs().subtract(i * 0.8, 'hour').toISOString(),
  slaDeadline: dayjs().add(48 - i, 'hour').toISOString(),
  ocrPassed: i % 6 !== 0,
  materials: ['证件原件', '申请表', '照片回执'],
}));

const ApprovalWorkbench: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try { await api.get('/approval/pending', { params: { page: 1, pageSize: 10 } }); } catch {}
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const columns: ColumnsType<any> = [
    { title: '订单号', dataIndex: 'orderNo', width: 200, render: v => <a onClick={() => setDetail(mockData.find(d => d.orderNo === v))}><u>{v}</u></a> },
    { title: '业务类型', dataIndex: 'orderType', width: 140 },
    { title: '办理地市', dataIndex: 'city', width: 100, render: v => <Tag>{v}</Tag> },
    { title: '申请人', dataIndex: 'applicantName', width: 100 },
    { title: '身份证号', dataIndex: 'idCard', width: 130 },
    { title: 'OCR结果', dataIndex: 'ocrPassed', width: 100, render: (v) => v ? <Tag color="green"><CheckOutlined /> 识别通过</Tag> : <Tag color="red"><CloseOutlined /> 待复核</Tag> },
    { title: '当前状态', dataIndex: 'status', width: 130, render: (v) => <Tag color={statusColor[v]}>{statusText[v] || v}</Tag> },
    { title: '提交时间', dataIndex: 'submittedAt', width: 160, render: v => dayjs(v).format('MM-DD HH:mm:ss') },
    { title: 'SLA时效', dataIndex: 'slaDeadline', width: 180, render: (v) => {
      const d = dayjs(v); const diff = d.diff(dayjs(), 'hour');
      return <div>
        <div>{d.format('MM-DD HH:mm')}</div>
        <div style={{ fontSize: 11, color: diff < 0 ? '#F53F3F' : diff < 12 ? '#FF7D00' : '#00B42A' }}>
          {diff < 0 ? `已超时${-diff}h` : `剩${diff}小时`}
        </div>
      </div>;
    } },
    { title: '操作', width: 200, fixed: 'right', render: (_, r) => (
      <Space>
        <Button size="small" icon={<EyeOutlined />} onClick={() => { setDetail(r); setDrawerOpen(true); }}>详情</Button>
        {r.status !== 'APPROVED' && <Button size="small" type="primary" onClick={() => Modal.confirm({
          title: '确认审批通过？', content: `订单号：${r.orderNo}`, onOk: async () => {
            try { await api.post(`/approval/${r.id}/approve`, { decision: 'APPROVED' }); message.success('审批通过'); load(); } catch {}
          },
        })}>通过</Button>}
        <Button size="small" danger onClick={() => Modal.confirm({
          title: '审批驳回', content: <Form form={form} layout="vertical"><Form.Item name="rejectReason" label="驳回原因" rules={[{ required: true }]}><Input.TextArea rows={3} placeholder="请填写驳回原因" /></Form.Item></Form>,
          onOk: async () => { const v = await form.validateFields(); try { await api.post(`/approval/${r.id}/approve`, { decision: 'REJECTED', ...v }); message.success('已驳回'); load(); } catch {} },
        })}>驳回</Button>
      </Space>
    ) },
  ];

  const batchApprove = () => Modal.confirm({
    title: '批量通过审批', content: '将对当前列表中符合条件的订单批量提交至省级政务系统', onOk: () => message.success('已批量提交审批'),
  });

  return (
    <div>
      <Card style={{ borderRadius: 10, marginBottom: 16 }} size="small" title="📋 审批工作台">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs defaultActiveKey="pending" size="small" items={[
            { key: 'pending', label: `待处理 <b style="color:#F53F3F">(${mockData.filter(d => !['APPROVED','REJECTED'].includes(d.status)).length})</b>` as any },
            { key: 'approved', label: '已通过' },
            { key: 'rejected', label: '已驳回' },
            { key: 'ocr', label: 'OCR待复核' },
          ]} onChange={() => {}} />
          <Space>
            <Input allowClear placeholder="搜索订单号/姓名/身份证" prefix={<SearchOutlined />} style={{ width: 240 }} />
            <Button type="primary" onClick={batchApprove}>批量通过</Button>
            <Button>提交省级网关</Button>
            <Button>导出审批台账</Button>
          </Space>
        </div>
      </Card>
      <Card style={{ borderRadius: 10 }} size="small">
        <Table loading={loading} columns={columns} dataSource={mockData} scroll={{ x: 1500 }} pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }} rowKey="id"
          rowClassName={(r) => dayjs(r.slaDeadline).diff(dayjs(), 'hour') < 12 ? 'sla-at-risk' : ''} />
      </Card>

      <Drawer title={`审批详情 - ${detail?.orderNo || ''}`} width={680} open={drawerOpen} onClose={() => setDrawerOpen(false)} extra={<Space>
        <Button danger>驳回</Button>
        <Button type="primary">审批通过</Button>
      </Space>}>
        {detail && (
          <div>
            <Descriptions title="基本信息" column={2} bordered size="small">
              <Descriptions.Item label="订单号">{detail.orderNo}</Descriptions.Item>
              <Descriptions.Item label="业务类型">{detail.orderType}</Descriptions.Item>
              <Descriptions.Item label="申请人">{detail.applicantName}</Descriptions.Item>
              <Descriptions.Item label="身份证">{detail.idCard}</Descriptions.Item>
              <Descriptions.Item label="办理地市">{detail.city}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={statusColor[detail.status]}>{statusText[detail.status]}</Tag></Descriptions.Item>
              <Descriptions.Item label="提交时间" span={2}>{dayjs(detail.submittedAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            </Descriptions>
            <Card title="OCR识别结果" size="small" style={{ marginTop: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="证件姓名">张**（置信度98.6%）</Descriptions.Item>
                <Descriptions.Item label="证件号码">4401****1234（置信度99.2%）</Descriptions.Item>
                <Descriptions.Item label="有效期至">2034-06-15</Descriptions.Item>
                <Descriptions.Item label="签发机关">广州市公安局</Descriptions.Item>
              </Descriptions>
              <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, height: 140, background: '#f5f7fa', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>📷 证件正面照</div>
                <div style={{ flex: 1, height: 140, background: '#f5f7fa', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>📷 证件背面照</div>
              </div>
            </Card>
            <Card title="📤 省级政务网关日志" size="small" style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: '#595959', lineHeight: 1.8, background: '#f5f7fa', padding: 12, borderRadius: 6, fontFamily: 'monospace' }}>
                [{dayjs().subtract(10, 'minute').format('HH:mm:ss')}] INFO → SubmitRequest(reqId=GW-2024-{detail.id})<br/>
                [{dayjs().subtract(9, 'minute').format('HH:mm:ss')}] INFO ← GatewayResponse(status=ACCEPTED, ticketId=GDT{100000+detail.id})<br/>
                [{dayjs().subtract(3, 'minute').format('HH:mm:ss')}] INFO ← GatewayCallback(status=APPROVING, progress=60%)<br/>
                [{dayjs().format('HH:mm:ss')}] WAIT ⏳ 等待省级审批系统最终结果...
              </div>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};
export default ApprovalWorkbench;
