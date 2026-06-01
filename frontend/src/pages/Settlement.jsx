import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Form, DatePicker, Select, Space, Descriptions, Statistic, Row, Col, message, Divider } from 'antd';
import { DollarOutlined, TeamOutlined, ShoppingCartOutlined, CarOutlined } from '@ant-design/icons';
import { api } from '../api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const settlementStatusMap = {
  pending: { color: 'default', text: '待确认' },
  confirmed: { color: 'blue', text: '已确认' },
  paid: { color: 'green', text: '已支付' },
};

export default function Settlement() {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [genModal, setGenModal] = useState(false);
  const [genForm] = Form.useForm();
  const [report, setReport] = useState(null);
  const [reportGroup, setReportGroup] = useState('summary');
  const [dateRange, setDateRange] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const loadSettlements = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const data = await api.settlements.list(params);
      setSettlements(data);
    } catch (err) { message.error(err.message); }
    finally { setLoading(false); }
  };

  const loadReport = async () => {
    try {
      const params = { group_by: reportGroup };
      if (dateRange) {
        params.period_start = dateRange[0].format('YYYY-MM-DD');
        params.period_end = dateRange[1].format('YYYY-MM-DD');
      }
      const data = await api.settlements.report(params);
      setReport(data);
    } catch (err) { message.error(err.message); }
  };

  useEffect(() => { loadSettlements(); }, [filterStatus]);
  useEffect(() => { loadReport(); }, [reportGroup, dateRange]);

  const handleGenerate = async () => {
    try {
      const values = await genForm.validateFields();
      const body = {
        period_start: values.period[0].format('YYYY-MM-DD'),
        period_end: values.period[1].format('YYYY-MM-DD'),
      };
      if (values.engineer_id) body.engineer_id = values.engineer_id;
      if (values.area) body.area = values.area;
      if (values.service_type) body.service_type = values.service_type;
      const data = await api.settlements.generate(body);
      message.success(`生成 ${data.length} 条结算记录`);
      setGenModal(false);
      genForm.resetFields();
      loadSettlements();
    } catch (err) { message.error(err.message); }
  };

  const handleConfirm = async (id, status) => {
    try {
      await api.settlements.confirm(id, { status });
      message.success(status === 'confirmed' ? '已确认' : '已标记为已支付');
      loadSettlements();
    } catch (err) { message.error(err.message); }
  };

  const columns = [
    { title: '工程师', dataIndex: 'engineer_name', key: 'engineer_name' },
    { title: '区域', dataIndex: 'engineer_area', key: 'engineer_area' },
    { title: '周期', key: 'period', render: (_, r) => `${r.period_start} ~ ${r.period_end}` },
    { title: '工单数', dataIndex: 'order_count', key: 'order_count' },
    { title: '人工收入', dataIndex: 'labor_income', key: 'labor_income', render: v => `¥${(v || 0).toFixed(2)}` },
    { title: '配件收入', dataIndex: 'parts_income', key: 'parts_income', render: v => `¥${(v || 0).toFixed(2)}` },
    { title: '出行补贴', dataIndex: 'travel_subsidy', key: 'travel_subsidy', render: v => `¥${(v || 0).toFixed(2)}` },
    { title: '总收入', dataIndex: 'total_income', key: 'total_income', render: v => <strong>¥{(v || 0).toFixed(2)}</strong> },
    { title: '状态', dataIndex: 'status', key: 'status', render: v => <Tag color={settlementStatusMap[v]?.color}>{settlementStatusMap[v]?.text}</Tag> },
    { title: '操作', key: 'action', render: (_, r) => (
      <Space>
        {r.status === 'pending' && user.role === 'finance' && (
          <Button type="primary" size="small" onClick={() => handleConfirm(r.id, 'confirmed')}>确认</Button>
        )}
        {r.status === 'confirmed' && user.role === 'finance' && (
          <Button size="small" onClick={() => handleConfirm(r.id, 'paid')}>标记已支付</Button>
        )}
      </Space>
    )},
  ];

  const renderReport = () => {
    if (!report) return null;
    const { group_by, data } = report;

    if (group_by === 'summary' && data) {
      return (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}><Card><Statistic title="工程师数" value={data.engineer_count || 0} prefix={<TeamOutlined />} /></Card></Col>
          <Col span={6}><Card><Statistic title="总工单" value={data.total_orders || 0} /></Card></Col>
          <Col span={6}><Card><Statistic title="总收入" value={data.total_income || 0} prefix="¥" precision={2} /></Card></Col>
          <Col span={6}><Card><Statistic title="配件费" value={data.total_parts || 0} prefix="¥" precision={2} /></Card></Col>
        </Row>
      );
    }

    if (group_by === 'engineer' && Array.isArray(data)) {
      return (
        <Table columns={[
          { title: '工程师', dataIndex: 'engineer_name' },
          { title: '区域', dataIndex: 'area' },
          { title: '结算次数', dataIndex: 'settlement_count' },
          { title: '总工单', dataIndex: 'total_orders' },
          { title: '人工收入', dataIndex: 'total_labor', render: v => `¥${(v || 0).toFixed(2)}` },
          { title: '配件收入', dataIndex: 'total_parts', render: v => `¥${(v || 0).toFixed(2)}` },
          { title: '出行补贴', dataIndex: 'total_travel', render: v => `¥${(v || 0).toFixed(2)}` },
          { title: '总收入', dataIndex: 'total_income', render: v => <strong>¥{(v || 0).toFixed(2)}</strong> },
        ]} dataSource={data} rowKey="engineer_id" pagination={false} size="small" style={{ marginBottom: 24 }} />
      );
    }

    if (group_by === 'area' && Array.isArray(data)) {
      return (
        <Table columns={[
          { title: '区域', dataIndex: 'area' },
          { title: '结算次数', dataIndex: 'settlement_count' },
          { title: '总工单', dataIndex: 'total_orders' },
          { title: '人工收入', dataIndex: 'total_labor', render: v => `¥${(v || 0).toFixed(2)}` },
          { title: '配件收入', dataIndex: 'total_parts', render: v => `¥${(v || 0).toFixed(2)}` },
          { title: '总收入', dataIndex: 'total_income', render: v => <strong>¥{(v || 0).toFixed(2)}</strong> },
        ]} dataSource={data} rowKey="area" pagination={false} size="small" style={{ marginBottom: 24 }} />
      );
    }

    if (group_by === 'parts' && Array.isArray(data)) {
      return (
        <Table columns={[
          { title: '配件名', dataIndex: 'part_name' },
          { title: '编码', dataIndex: 'part_code' },
          { title: '总用量', dataIndex: 'total_quantity' },
          { title: '总费用', dataIndex: 'total_cost', render: v => `¥${(v || 0).toFixed(2)}` },
        ]} dataSource={data} rowKey="part_code" pagination={false} size="small" style={{ marginBottom: 24 }} />
      );
    }

    return null;
  };

  return (
    <div>
      <Card title="结算报表" extra={
        <Space>
          <Select placeholder="分组维度" style={{ width: 120 }} value={reportGroup} onChange={setReportGroup}>
            <Select.Option value="summary">汇总</Select.Option>
            <Select.Option value="engineer">按工程师</Select.Option>
            <Select.Option value="area">按区域</Select.Option>
            <Select.Option value="parts">按配件</Select.Option>
          </Select>
          <RangePicker onChange={(dates) => setDateRange(dates)} />
          <Button onClick={loadReport}>刷新报表</Button>
        </Space>
      }>
        {renderReport()}
      </Card>

      <Card title="结算记录" style={{ marginTop: 16 }} extra={
        <Space>
          <Select placeholder="状态" allowClear style={{ width: 120 }} onChange={setFilterStatus} value={filterStatus || undefined}>
            <Select.Option value="pending">待确认</Select.Option>
            <Select.Option value="confirmed">已确认</Select.Option>
            <Select.Option value="paid">已支付</Select.Option>
          </Select>
          {user.role === 'finance' && <Button type="primary" onClick={() => setGenModal(true)}>生成结算</Button>}
          <Button onClick={loadSettlements}>刷新</Button>
        </Space>
      }>
        <Table columns={columns} dataSource={settlements} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="生成结算" open={genModal} onCancel={() => setGenModal(false)} onOk={handleGenerate} width={500}>
        <Form form={genForm} layout="vertical">
          <Form.Item name="period" label="结算周期" rules={[{ required: true, message: '请选择周期' }]}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="engineer_id" label="工程师ID（可选）">
            <Select placeholder="留空表示全部" allowClear style={{ width: '100%' }}>
              <Select.Option value={4}>赵工程师</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="area" label="区域（可选）"><input style={{ width: '100%', padding: 8, border: '1px solid #d9d9d9', borderRadius: 4 }} placeholder="如：北京市" /></Form.Item>
          <Form.Item name="service_type" label="服务类型（可选）">
            <Select placeholder="留空表示全部" allowClear>
              <Select.Option value="空调维修">空调维修</Select.Option>
              <Select.Option value="冰箱维修">冰箱维修</Select.Option>
              <Select.Option value="洗衣机维修">洗衣机维修</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
