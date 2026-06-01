import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, InputNumber, Space, message, Tag, Descriptions, Card, Result, Statistic, Row, Col } from 'antd';
import { PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, DollarOutlined } from '@ant-design/icons';
import { applicationsApi, customersApi, productsApi, segmentsApi } from '../api';
import dayjs from 'dayjs';

const { Option } = Select;

function Applications() {
  const [list, setList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [segments, setSegments] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
    loadCustomers();
    loadProducts();
    loadSegments();
  }, [pagination.current, pagination.pageSize, statusFilter]);

  const loadData = async () => {
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize
      };
      if (statusFilter) {
        params.status = statusFilter;
      }
      const res = await applicationsApi.getList(params);
      setList(res.data.data);
      setPagination(prev => ({ ...prev, total: res.data.pagination.total }));
      
      const allRes = await applicationsApi.getList({ pageSize: 1000 });
      const allData = allRes.data.data;
      setStats({
        total: allData.length,
        pending: allData.filter(a => a.status === '待审批').length,
        approved: allData.filter(a => a.status === '已通过').length,
        rejected: allData.filter(a => a.status === '已拒绝').length
      });
    } catch (error) {
      message.error('加载失败');
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await customersApi.getList({ pageSize: 100 });
      setCustomers(res.data.data);
    } catch (error) {
      message.error('加载客户失败');
    }
  };

  const loadProducts = async () => {
    try {
      const res = await productsApi.getList({ active_only: true });
      setProducts(res.data.data);
    } catch (error) {
      message.error('加载产品失败');
    }
  };

  const loadSegments = async () => {
    try {
      const res = await segmentsApi.getRules();
      setSegments(res.data.data);
    } catch (error) {
      message.error('加载客群失败');
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await applicationsApi.create(values);
      message.success('申请提交成功');
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '提交失败');
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await applicationsApi.getById(id);
      setSelectedRecord(res.data.data);
      setDetailVisible(true);
    } catch (error) {
      message.error('加载详情失败');
    }
  };

  const handleApprove = async (approved) => {
    try {
      await applicationsApi.approve(selectedRecord.id, { 
        approved, 
        reviewed_by: '审批员'
      });
      message.success(approved ? '审批通过' : '已拒绝');
      setDetailVisible(false);
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const columns = [
    { title: '申请编号', dataIndex: 'application_no', key: 'application_no', width: 140 },
    { title: '客户', dataIndex: 'name', key: 'name', width: 100 },
    { title: '产品', dataIndex: 'product_name', key: 'product_name', width: 120 },
    { title: '分期金额', dataIndex: 'amount', key: 'amount', width: 120, render: (v) => `¥${v?.toLocaleString()}` },
    { title: '期数', dataIndex: 'periods', key: 'periods', width: 80 },
    { title: '月还款', dataIndex: 'monthly_payment', key: 'monthly_payment', width: 120, render: (v) => `¥${v?.toLocaleString()}` },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (v) => {
        const colors = { '待审批': 'orange', '已通过': 'green', '已拒绝': 'red' };
        return <Tag color={colors[v]}>{v}</Tag>;
      }
    },
    { title: '申请时间', dataIndex: 'created_at', key: 'created_at', width: 160,
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm')
    },
    { title: '操作', key: 'action', width: 120,
      render: (_, record) => (
        <Button size="small" type="primary" onClick={() => handleViewDetail(record.id)}>详情</Button>
      )
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>分期申请</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建申请</Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card>
            <Statistic title="申请总数" value={stats.total} prefix={<DollarOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="待审批" value={stats.pending} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="已通过" value={stats.approved} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="已拒绝" value={stats.rejected} prefix={<CloseCircleOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Space>
              <Button onClick={() => setStatusFilter(null)} type={!statusFilter ? 'primary' : 'default'}>全部</Button>
              <Button onClick={() => setStatusFilter('待审批')} type={statusFilter === '待审批' ? 'primary' : 'default'}>待审批</Button>
              <Button onClick={() => setStatusFilter('已通过')} type={statusFilter === '已通过' ? 'primary' : 'default'}>已通过</Button>
              <Button onClick={() => setStatusFilter('已拒绝')} type={statusFilter === '已拒绝' ? 'primary' : 'default'}>已拒绝</Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Table columns={columns} dataSource={list} rowKey="id"
        pagination={{ ...pagination, showSizeChanger: true, showQuickJumper: true, showTotal: total => `共 ${total} 条` }}
        onChange={(p) => setPagination(prev => ({ ...prev, current: p.current, pageSize: p.pageSize }))}
      />

      <Modal title="新建分期申请" open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="customer_id" label="选择客户" rules={[{ required: true }]}>
            <Select showSearch placeholder="搜索客户">
              {customers.map(c => (
                <Option key={c.id} value={c.id}>{c.name} - {c.card_no} ({c.card_level}/{c.risk_level}风险)</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="product_id" label="选择产品" rules={[{ required: true }]}>
            <Select placeholder="选择分期产品">
              {products.filter(p => p.is_active).map(p => (
                <Option key={p.id} value={p.id}>{p.name} - {p.periods}期</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="segment_rule_id" label="所属客群（用于营销效果统计）">
            <Select placeholder="选择客群规则">
              {segments.map(s => (
                <Option key={s.id} value={s.id}>{s.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="分期金额" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="申请详情" open={detailVisible} onCancel={() => setDetailVisible(false)} width={800} footer={selectedRecord?.status === '待审批' ? [
        <Button key="reject" danger onClick={() => handleApprove(false)}>拒绝</Button>,
        <Button key="approve" type="primary" onClick={() => handleApprove(true)}>通过</Button>
      ] : null}>
        {selectedRecord && (
          <div>
            <Descriptions column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="申请编号">{selectedRecord.application_no}</Descriptions.Item>
              <Descriptions.Item label="申请状态">
                <Tag color={selectedRecord.status === '已通过' ? 'green' : selectedRecord.status === '已拒绝' ? 'red' : 'orange'}>
                  {selectedRecord.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="客户">{selectedRecord.name}</Descriptions.Item>
              <Descriptions.Item label="卡号">{selectedRecord.card_no}</Descriptions.Item>
              <Descriptions.Item label="产品">{selectedRecord.product_name}</Descriptions.Item>
              <Descriptions.Item label="分期期数">{selectedRecord.periods}期</Descriptions.Item>
              <Descriptions.Item label="分期金额">{`¥${selectedRecord.amount?.toLocaleString() || 0}`}</Descriptions.Item>
              <Descriptions.Item label="执行费率">{((selectedRecord.applied_rate || 0) * 100).toFixed(2)}%</Descriptions.Item>
              <Descriptions.Item label="每月还款">{`¥${selectedRecord.monthly_payment?.toLocaleString() || 0}`}</Descriptions.Item>
              <Descriptions.Item label="总手续费">{`¥${selectedRecord.total_fee?.toLocaleString() || 0}`}</Descriptions.Item>
            </Descriptions>

            {selectedRecord.status !== '待审批' && (
              <Card title="审批信息" size="small" style={{ marginBottom: 16 }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="审批结果">{selectedRecord.risk_review_result}</Descriptions.Item>
                  <Descriptions.Item label="审批人">{selectedRecord.reviewed_by}</Descriptions.Item>
                  <Descriptions.Item label="审批时间" span={2}>{selectedRecord.reviewed_at ? dayjs(selectedRecord.reviewed_at).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="备注" span={2}>{selectedRecord.review_remark || '-'}</Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {selectedRecord.repayment_plans && selectedRecord.repayment_plans.length > 0 && (
              <Card title="还款计划" size="small">
                <Table dataSource={selectedRecord.repayment_plans} rowKey="id" pagination={false} size="small">
                  <Table.Column title="期次" dataIndex="period_no" key="period_no" width={80} render={v => `第${v}期`} />
                  <Table.Column title="到期日" dataIndex="due_date" key="due_date" width={120} />
                  <Table.Column title="本金" dataIndex="principal" key="principal" width={120} render={v => `¥${v?.toLocaleString() || 0}`} />
                  <Table.Column title="手续费" dataIndex="fee" key="fee" width={120} render={v => `¥${v?.toLocaleString() || 0}`} />
                  <Table.Column title="总额" dataIndex="total_amount" key="total_amount" width={120} render={v => `¥${v?.toLocaleString() || 0}`} />
                  <Table.Column title="状态" dataIndex="status" key="status" width={100}
                    render={v => <Tag color={v === '已还款' ? 'green' : 'default'}>{v}</Tag>} />
                </Table>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Applications;
