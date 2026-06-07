import React, { useEffect, useState } from 'react';
import { Table, Button, Select, Tag, Space, Modal, Form, Input, InputNumber, message, Typography, Spin, Drawer, Descriptions, Row, Col, Card, Divider } from 'antd';
import { PlusOutlined, CheckCircleOutlined, StopOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../../api';

const { Title, Text } = Typography;
const { Option } = Select;

const statusColor = { approved: 'green', pending: 'orange', rejected: 'red' };
const statusMap = { approved: '已批准', pending: '待审批', rejected: '已拒绝' };
const collateralMap = { land: '土地经营权', machine: '农机设备', livestock: '活体', business: '商铺经营权' };
const creditCheckMap = { pass: '通过', pending: '待核验', reject: '拒绝' };
const autoDecisionMap = { approve: '自动通过', review: '人工复核', reject: '自动拒绝' };

export default function LoanApplications() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [productId, setProductId] = useState('');
  const [status, setStatus] = useState('');
  const [products, setProducts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);
  const [currentLoan, setCurrentLoan] = useState(null);
  const [detailDrawer, setDetailDrawer] = useState(false);
  const [form] = Form.useForm();
  const [reviewForm] = Form.useForm();

  useEffect(() => {
    async function load() {
      try {
        const [pr, pf] = await Promise.all([
          api.get('/finance/products', { params: { status: 'active', page: 1, pageSize: 100 } }),
          api.get('/credit/profiles', { params: { page: 1, pageSize: 100 } }),
        ]);
        setProducts(pr.data || []);
        setProfiles(pf.data || []);
      } catch (e) { message.error(e.message); }
    }
    load();
  }, []);

  const load = async (p = page, filters = { productId, status }) => {
    setLoading(true);
    try {
      const params = { page: p, pageSize: 10 };
      if (filters.productId) params.product_id = filters.productId;
      if (filters.status) params.status = filters.status;
      const res = await api.get('/finance/loans', { params });
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch (e) { message.error(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submitAdd = async () => {
    const vals = await form.validateFields();
    const profile = profiles.find(p => p.id === vals.profile_id);
    try {
      await api.post('/finance/loans', {
        ...vals,
        user_id_card: profile.id_card,
        user_name: profile.name,
      });
      message.success('贷款申请已提交');
      setAddModal(false);
      form.resetFields();
      load();
    } catch (e) { message.error(e.message); }
  };

  const submitReview = async () => {
    const vals = await reviewForm.validateFields();
    try {
      await api.put(`/finance/loans/${currentLoan.id}/review`, {
        status: currentLoan.review_status,
        approved_amount: currentLoan.review_status === 'approved' ? vals.approved_amount : 0,
        review_remark: vals.review_remark || '',
      });
      message.success('审核完成');
      setReviewModal(false);
      load();
    } catch (e) { message.error(e.message); }
  };

  const openDetail = async (rec) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/finance/loans/${rec.id}`);
      setCurrentLoan(res.data);
      setDetailDrawer(true);
    } catch (e) {
      message.error(e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    { title: '申请人', dataIndex: 'user_name', width: 100 },
    { title: '身份证号', dataIndex: 'user_id_card', width: 190 },
    { title: '产品', dataIndex: 'product_name', width: 130 },
    { title: '申请金额(元)', dataIndex: 'apply_amount', width: 120, render: v => v?.toLocaleString() },
    { title: '批核金额(元)', dataIndex: 'approved_amount', width: 120, render: v => v ? v.toLocaleString() : '-' },
    { title: '期限(月)', dataIndex: 'apply_periods', width: 80 },
    { title: '担保方式', dataIndex: 'collateral_type', width: 110, render: v => collateralMap[v] || v },
    { title: '征信核验', dataIndex: 'credit_check_result', width: 100, render: v => v ? <Tag color={v === 'pass' ? 'green' : v === 'reject' ? 'red' : 'orange'}>{creditCheckMap[v]}</Tag> : '-' },
    { title: '状态', dataIndex: 'status', width: 100, render: v => <Tag color={statusColor[v]}>{statusMap[v]}</Tag> },
    { title: '操作', width: 120, render: (_, r) => (
      <Space>
        <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)}>详情</Button>
        {r.status === 'pending' && (
          <>
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => openReview(r, 'approved')}>批准</Button>
            <Button size="small" danger icon={<StopOutlined />} onClick={() => openReview(r, 'rejected')}>拒绝</Button>
          </>
        )}
      </Space>
    ) },
  ];

  return (
    <div>
      <Title level={4}>贷款申请管理</Title>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Select placeholder="产品" value={productId || undefined} onChange={v => { const nextProductId = v || ''; setProductId(nextProductId); setPage(1); load(1, { productId: nextProductId, status }); }} style={{ width: 180 }} allowClear showSearch optionFilterProp="children">
          {products.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
        </Select>
        <Select placeholder="状态" value={status || undefined} onChange={v => { const nextStatus = v || ''; setStatus(nextStatus); setPage(1); load(1, { productId, status: nextStatus }); }} style={{ width: 120 }} allowClear>
          <Option value="pending">待审批</Option>
          <Option value="approved">已批准</Option>
          <Option value="rejected">已拒绝</Option>
        </Select>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>新申请</Button>
      </div>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
        pagination={{ current: page, total, pageSize: 10, onChange: p => { setPage(p); load(p); } }} scroll={{ x: 1250 }} />

      <Drawer title="贷款审批详情" width={720} open={detailDrawer} onClose={() => setDetailDrawer(false)}
        extra={<Button icon={<ReloadOutlined />} onClick={() => currentLoan && openDetail(currentLoan)}>刷新</Button>}>
        {detailLoading && <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />}
        {!detailLoading && currentLoan && (
          <div>
            <Card title="基本信息" size="small">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="申请人">{currentLoan.user_name}</Descriptions.Item>
                <Descriptions.Item label="身份证">{currentLoan.user_id_card}</Descriptions.Item>
                <Descriptions.Item label="产品">{currentLoan.product_name} ({currentLoan.product_code})</Descriptions.Item>
                <Descriptions.Item label="状态"><Tag color={statusColor[currentLoan.status]}>{statusMap[currentLoan.status]}</Tag></Descriptions.Item>
                <Descriptions.Item label="申请金额">{currentLoan.apply_amount?.toLocaleString()}元</Descriptions.Item>
                <Descriptions.Item label="批核金额">{currentLoan.approved_amount ? currentLoan.approved_amount.toLocaleString() + '元' : '-'}</Descriptions.Item>
                <Descriptions.Item label="期限">{currentLoan.apply_periods}个月</Descriptions.Item>
                <Descriptions.Item label="年利率">{currentLoan.annual_rate ? (currentLoan.annual_rate * 100).toFixed(1) + '%' : '-'}</Descriptions.Item>
                <Descriptions.Item label="担保方式">{collateralMap[currentLoan.collateral_type] || currentLoan.collateral_type}</Descriptions.Item>
                <Descriptions.Item label="担保物">{currentLoan.collateral_desc}</Descriptions.Item>
                <Descriptions.Item label="审核备注">{currentLoan.review_remark || '-'}</Descriptions.Item>
                <Descriptions.Item label="申请时间">{currentLoan.created_at}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Divider orientation="left">征信核验 · 人民银行征信系统</Divider>
            <Card size="small">
              <Row gutter={16}>
                <Col xs={12} md={6}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="征信报告ID">{currentLoan.pboc_report_id || '-'}</Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col xs={12} md={6}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="征信评分">{currentLoan.pboc_credit_score || '-'}分</Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col xs={12} md={6}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="逾期记录">{currentLoan.pboc_overdue_count ?? '-'}次</Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col xs={12} md={6}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="核验结果">{currentLoan.credit_check_result ? <Tag color={currentLoan.credit_check_result === 'pass' ? 'green' : currentLoan.credit_check_result === 'reject' ? 'red' : 'orange'}>{creditCheckMap[currentLoan.credit_check_result]}</Tag> : '-'}</Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            <Divider orientation="left">农业农村数据 · 农业农村部数据平台</Divider>
            <Card size="small">
              <Row gutter={16}>
                <Col xs={12} md={6}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="确权土地">{currentLoan.moa_land_area ?? currentLoan.profile_land_area ?? '-'}亩</Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col xs={12} md={6}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="确权证号">{currentLoan.moa_land_cert_no || currentLoan.profile_land_cert_no || '-'}</Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col xs={12} md={6}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="累计补贴">{(currentLoan.moa_subsidy_total ?? currentLoan.profile_subsidy_total ?? 0).toLocaleString()}元</Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col xs={12} md={6}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="数据来源"><Tag color="green">农业农村部</Tag></Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            <Divider orientation="left">政务数据 · 地方政务服务平台</Divider>
            <Card size="small">
              <Row gutter={16}>
                <Col xs={12} md={8}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="营业执照">{currentLoan.gov_business_license || (currentLoan.profile_type === 'merchant' ? '已核验' : '无')}</Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col xs={12} md={8}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="税务记录">{currentLoan.gov_tax_record || (currentLoan.profile_type === 'merchant' ? '已核验' : '无')}</Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col xs={12} md={8}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="数据来源"><Tag color="blue">政务服务平台</Tag></Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            <Divider orientation="left">额度模型复查结果</Divider>
            <Card size="small">
              <Row gutter={16}>
                <Col xs={12} md={6}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="模型版本">{currentLoan.model_version || '-'}</Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col xs={12} md={6}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="模型评分">{currentLoan.model_score ?? '-'}分</Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col xs={12} md={6}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="模型结果">{currentLoan.model_result ? <Tag color={currentLoan.model_result === 'approve' ? 'green' : currentLoan.model_result === 'reject' ? 'red' : 'orange'}>{currentLoan.model_result === 'approve' ? '通过' : currentLoan.model_result === 'reject' ? '拒绝' : '待复核'}</Tag> : '-'}</Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col xs={12} md={6}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="自动审批">{currentLoan.auto_decision ? <Tag color={currentLoan.auto_decision === 'approve' ? 'green' : currentLoan.auto_decision === 'reject' ? 'red' : 'orange'}>{autoDecisionMap[currentLoan.auto_decision]}</Tag> : '-'}</Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
              {currentLoan.model_details && (
                <div style={{ marginTop: 12, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                  <Text type="secondary"><b>模型计算说明：</b>{currentLoan.model_details}</Text>
                </div>
              )}
              {currentLoan.reviewer && (
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary"><b>复核人：</b>{currentLoan.reviewer}</Text>
                </div>
              )}
            </Card>

            <Divider orientation="left">关联信用流水</Divider>
            <Card size="small">
              <Table rowKey="id" size="small" pagination={{ pageSize: 5 }}
                dataSource={currentLoan.flows || []}
                columns={[
                  { title: '类型', dataIndex: 'flow_type', width: 100, render: v => ({ subsidy: '补贴', income: '经营', loan: '贷款', other: '其他' })[v] || v },
                  { title: '金额(元)', dataIndex: 'amount', width: 120, render: v => v?.toLocaleString() },
                  { title: '描述', dataIndex: 'description' },
                  { title: '日期', dataIndex: 'flow_date', width: 120 },
                ]}
                locale={{ emptyText: '暂无关联流水' }} />
            </Card>
          </div>
        )}
      </Drawer>

      <Modal title="新贷款申请" open={addModal} onOk={submitAdd} onCancel={() => setAddModal(false)} width={500}>
        <Form form={form} layout="vertical">
          <Form.Item label="申请人" name="profile_id" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children">
              {profiles.map(p => <Option key={p.id} value={p.id}>{p.name} - {p.id_card} ({p.type === 'farmer' ? '农户' : '商户'})</Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="产品" name="product_id" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children">
              {products.map(p => <Option key={p.id} value={p.id}>{p.name} - 最高{p.max_amount.toLocaleString()}元</Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="申请金额(元)" name="apply_amount" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="期限(月)" name="apply_periods" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="担保方式" name="collateral_type" rules={[{ required: true }]}>
            <Select><Option value="land">土地经营权</Option><Option value="machine">农机设备</Option><Option value="livestock">活体</Option><Option value="business">商铺经营权</Option></Select>
          </Form.Item>
          <Form.Item label="担保物描述" name="collateral_desc"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      <Modal title={`${currentLoan?.review_status === 'approved' ? '批准' : '拒绝'}贷款`} open={reviewModal} onOk={submitReview} onCancel={() => setReviewModal(false)}>
        <p>申请人: <b>{currentLoan?.user_name}</b></p>
        <p>申请金额: <b>{currentLoan?.apply_amount?.toLocaleString()}元</b></p>
        <Form form={reviewForm} layout="vertical">
          {currentLoan?.review_status === 'approved' && (
            <Form.Item label="批准金额" name="approved_amount" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          )}
          <Form.Item label="审核意见" name="review_remark" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
