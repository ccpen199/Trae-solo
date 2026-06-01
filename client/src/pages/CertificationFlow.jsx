import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Table, Tabs, Tag, message, Alert, Drawer, Row, Col, Card, Statistic } from 'antd';
import { PlusOutlined, RollbackOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  createCertificate,
  createFlow,
  createRecall,
  getCertificates,
  getFlows,
  getRecalls,
  getSlaughterBatches,
  getRecallScope,
} from '../api';

const CERT_STATUS = {
  valid: { text: '有效', color: 'green' },
  recalled: { text: '已召回', color: 'red' },
};

export default function CertificationFlow() {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [batches, setBatches] = useState([]);
  const [flows, setFlows] = useState([]);
  const [recalls, setRecalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [flowModalOpen, setFlowModalOpen] = useState(false);
  const [recallModalOpen, setRecallModalOpen] = useState(false);
  const [scopeReviewOpen, setScopeReviewOpen] = useState(false);
  const [scopeData, setScopeData] = useState(null);
  const [scopeLoading, setScopeLoading] = useState(false);
  const [selectedCertNo, setSelectedCertNo] = useState(null);
  const [certForm] = Form.useForm();
  const [flowForm] = Form.useForm();
  const [recallForm] = Form.useForm();

  const recallFormCertNo = Form.useWatch('cert_no', recallForm);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [certRows, batchRows, flowRows, recallRows] = await Promise.all([
        getCertificates(),
        getSlaughterBatches(),
        getFlows(),
        getRecalls(),
      ]);
      setCertificates(certRows);
      setBatches(batchRows);
      setFlows(flowRows);
      setRecalls(recallRows);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const certifiedBatchNos = useMemo(() => new Set(certificates.map((item) => item.batch_no)), [certificates]);
  const eligibleBatches = batches.filter((batch) => batch.status === 'qualified' && !certifiedBatchNos.has(batch.batch_no));
  const validCertificates = certificates.filter((cert) => cert.status === 'valid');

  const openCertModal = () => {
    certForm.resetFields();
    setCertModalOpen(true);
  };

  const openFlowModal = () => {
    flowForm.resetFields();
    setFlowModalOpen(true);
  };

  const openRecallModal = () => {
    recallForm.resetFields();
    setRecallModalOpen(true);
  };

  const checkScope = async (certNo) => {
    if (!certNo) {
      message.warning('请先选择证书编号');
      return;
    }
    setScopeLoading(true);
    setSelectedCertNo(certNo);
    try {
      const data = await getRecallScope(certNo);
      setScopeData(data);
      setScopeReviewOpen(true);
    } catch (err) {
      message.error(err.message);
    } finally {
      setScopeLoading(false);
    }
  };

  const handleBatchChange = (batchNo) => {
    const batch = batches.find((item) => item.batch_no === batchNo);
    if (!batch) return;
    certForm.setFieldsValue({
      animal_type: batch.animal_type,
      quantity: batch.entry_quantity,
      origin_farm: batch.farm_name,
      slaughter_date: batch.slaughter_time ? dayjs(batch.slaughter_time) : null,
    });
  };

  const submitCertificate = async () => {
    try {
      const values = await certForm.validateFields();
      values.slaughter_date = values.slaughter_date ? values.slaughter_date.toISOString() : null;
      await createCertificate(values);
      message.success('出证成功');
      setCertModalOpen(false);
      fetchData();
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const submitFlow = async () => {
    try {
      const values = await flowForm.validateFields();
      values.flow_time = values.flow_time ? values.flow_time.toISOString() : null;
      await createFlow(values);
      message.success('流向登记成功');
      setFlowModalOpen(false);
      fetchData();
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const submitRecall = async () => {
    try {
      const values = await recallForm.validateFields();
      values.recall_time = values.recall_time ? values.recall_time.toISOString() : null;
      await createRecall(values);
      message.success('召回登记成功');
      setRecallModalOpen(false);
      fetchData();
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const certificateColumns = [
    { title: '证书编号', dataIndex: 'cert_no', width: 180, ellipsis: true },
    { title: '批次号', dataIndex: 'batch_no', width: 180, ellipsis: true },
    { title: '动物种类', dataIndex: 'animal_type', width: 90 },
    { title: '数量', dataIndex: 'quantity', width: 80 },
    { title: '来源养殖场', dataIndex: 'origin_farm', ellipsis: true },
    { title: '签发人', dataIndex: 'issuer', width: 90 },
    { title: '签发日期', dataIndex: 'issue_date', width: 160, render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: (status) => {
        const info = CERT_STATUS[status] || { text: status, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
  ];

  const flowColumns = [
    { title: '证书编号', dataIndex: 'cert_no', width: 180, ellipsis: true },
    { title: '采购方', dataIndex: 'buyer_name', ellipsis: true },
    { title: '联系方式', dataIndex: 'buyer_contact', width: 130 },
    { title: '目的地', dataIndex: 'destination', ellipsis: true },
    { title: '产品类型', dataIndex: 'product_type', width: 100 },
    { title: '重量(kg)', dataIndex: 'weight', width: 100 },
    { title: '流向时间', dataIndex: 'flow_time', width: 160, render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
  ];

  const recallColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '证书编号', dataIndex: 'cert_no', width: 180, ellipsis: true },
    { title: '召回原因', dataIndex: 'reason', ellipsis: true },
    { title: '召回范围', dataIndex: 'scope', ellipsis: true },
    {
      title: '影响流向',
      dataIndex: 'affected_flows',
      width: 100,
      render: (v) => v ? <Tag color="red">{v} 条</Tag> : '-',
    },
    {
      title: '影响重量',
      dataIndex: 'affected_quantity',
      width: 100,
      render: (v) => v ? <Tag color="orange">{v} kg</Tag> : '-',
    },
    { title: '发起人', dataIndex: 'initiator', width: 100 },
    { title: '召回时间', dataIndex: 'recall_time', width: 160, render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
    { title: '状态', dataIndex: 'status', width: 90, render: (v) => <Tag color="red">{v === 'active' ? '生效' : v}</Tag> },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<SearchOutlined />} onClick={() => checkScope(record.cert_no)}>范围复查</Button>
        </Space>
      ),
    },
  ];

  const certOptions = validCertificates.map((cert) => ({
    value: cert.cert_no,
    label: `${cert.cert_no} - ${cert.origin_farm}`,
  }));

  return (
    <div>
      <Tabs
        items={[
          {
            key: 'certificates',
            label: '检疫出证',
            children: (
              <>
                <Space style={{ marginBottom: 16 }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={openCertModal}>新增证书</Button>
                </Space>
                <Table
                  rowKey="id"
                  columns={certificateColumns}
                  dataSource={certificates}
                  loading={loading}
                  scroll={{ x: 1100 }}
                  pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
                />
              </>
            ),
          },
          {
            key: 'flows',
            label: '产品流向',
            children: (
              <>
                <Space style={{ marginBottom: 16 }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={openFlowModal}>新增流向</Button>
                </Space>
                <Table
                  rowKey="id"
                  columns={flowColumns}
                  dataSource={flows}
                  loading={loading}
                  scroll={{ x: 1000 }}
                  pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
                />
              </>
            ),
          },
          {
            key: 'recalls',
            label: '召回记录',
            children: (
              <>
                <Space style={{ marginBottom: 16 }}>
                  <Button danger icon={<PlusOutlined />} onClick={openRecallModal}>登记召回</Button>
                  <Button icon={<RollbackOutlined />} onClick={() => navigate('/recall')}>进入召回管理</Button>
                  <Alert
                    type="info"
                    showIcon
                    message="召回业务已升级"
                    description="完整的召回管理包含范围复查、影响分析、完成闭环等功能，请进入召回管理模块操作"
                    style={{ marginLeft: 16, flex: 1 }}
                  />
                </Space>
                <Table
                  rowKey="id"
                  columns={recallColumns}
                  dataSource={recalls}
                  loading={loading}
                  scroll={{ x: 1400 }}
                  pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
                />
              </>
            ),
          },
        ]}
      />

      <Modal title="新增检疫证书" open={certModalOpen} onOk={submitCertificate} onCancel={() => setCertModalOpen(false)} width={620} destroyOnHidden>
        <Form form={certForm} layout="vertical">
          <Form.Item name="batch_no" label="屠宰批次" rules={[{ required: true, message: '请选择屠宰批次' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="选择合格且未出证批次"
              onChange={handleBatchChange}
              options={eligibleBatches.map((batch) => ({
                value: batch.batch_no,
                label: `${batch.batch_no} - ${batch.farm_name} (${batch.animal_type})`,
              }))}
            />
          </Form.Item>
          <Form.Item name="animal_type" label="动物种类" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="quantity" label="数量" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="origin_farm" label="来源养殖场" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slaughter_date" label="屠宰日期" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="issuer" label="签发人" rules={[{ required: true, message: '请输入签发人' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="新增产品流向" open={flowModalOpen} onOk={submitFlow} onCancel={() => setFlowModalOpen(false)} width={620} destroyOnHidden>
        <Form form={flowForm} layout="vertical">
          <Form.Item name="cert_no" label="证书编号" rules={[{ required: true, message: '请选择证书' }]}>
            <Select showSearch optionFilterProp="label" placeholder="选择有效证书" options={certOptions} />
          </Form.Item>
          <Form.Item name="buyer_name" label="采购方" rules={[{ required: true, message: '请输入采购方' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="buyer_contact" label="联系方式">
            <Input />
          </Form.Item>
          <Form.Item name="destination" label="目的地" rules={[{ required: true, message: '请输入目的地' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="product_type" label="产品类型" rules={[{ required: true, message: '请输入产品类型' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="weight" label="重量(kg)">
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="flow_time" label="流向时间" rules={[{ required: true, message: '请选择流向时间' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="登记召回" open={recallModalOpen} onOk={submitRecall} onCancel={() => setRecallModalOpen(false)} width={720} destroyOnHidden>
        <Form form={recallForm} layout="vertical">
          <Alert
            type="warning"
            showIcon
            message="建议先进行召回范围复查"
            description="完整的召回管理请使用【召回管理】模块，包含范围复查、影响分析、完成闭环等功能"
            style={{ marginBottom: 16 }}
          />
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="cert_no" label="证书编号" rules={[{ required: true, message: '请选择证书' }]}>
                <Select showSearch optionFilterProp="label" placeholder="选择有效证书" options={certOptions} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="召回范围预查">
                <Button icon={<SearchOutlined />} onClick={() => recallFormCertNo && checkScope(recallFormCertNo)} block>
                  复查影响范围
                </Button>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="reason" label="召回原因" rules={[{ required: true, message: '请输入召回原因' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="scope" label="召回范围">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="initiator" label="发起人" rules={[{ required: true, message: '请输入发起人' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="recall_time" label="召回时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={selectedCertNo ? `召回范围复查 - ${selectedCertNo}` : '召回范围复查'}
        width={800}
        open={scopeReviewOpen}
        onClose={() => setScopeReviewOpen(false)}
        loading={scopeLoading}
        destroyOnHidden
        extra={
          <Space>
            <Button onClick={() => setScopeReviewOpen(false)}>关闭</Button>
            <Button type="primary" danger icon={<RollbackOutlined />} onClick={() => { setScopeReviewOpen(false); navigate('/recall'); }}>
              进入召回管理
            </Button>
          </Space>
        }
      >
        {scopeData && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Alert
              type="warning"
              showIcon
              message="召回影响范围分析"
              description={`证书 ${selectedCertNo} 下的产品将执行召回，请确认以下影响范围`}
            />

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Card size="small">
                  <Statistic title="影响流向数" value={scopeData.affected_flows || 0} suffix="条" valueStyle={{ color: '#cf1322' }} />
                </Card>
              </Col>
              <Col xs={24} sm={12}>
                <Card size="small">
                  <Statistic title="影响总重量" value={scopeData.affected_weight || 0} suffix="kg" precision={1} valueStyle={{ color: '#cf1322' }} />
                </Card>
              </Col>
            </Row>

            {scopeData.affected_destinations && scopeData.affected_destinations.length > 0 && (
              <Card size="small" title="涉及目的地" type="inner">
                <Space wrap>
                  {scopeData.affected_destinations.map((dest, idx) => (
                    <Tag key={idx} color="orange">{dest}</Tag>
                  ))}
                </Space>
              </Card>
            )}

            {scopeData.affected_buyers && scopeData.affected_buyers.length > 0 && (
              <Card size="small" title="涉及采购方" type="inner">
                <Space wrap>
                  {scopeData.affected_buyers.map((buyer, idx) => (
                    <Tag key={idx} color="red">{buyer}</Tag>
                  ))}
                </Space>
              </Card>
            )}

            {scopeData.flows && scopeData.flows.length > 0 && (
              <Card size="small" title="受影响流向明细" type="inner">
                <Table
                  rowKey="id"
                  size="small"
                  dataSource={scopeData.flows}
                  columns={[
                    { title: '证书编号', dataIndex: 'cert_no', width: 160 },
                    { title: '采购方', dataIndex: 'buyer_name' },
                    { title: '联系方式', dataIndex: 'buyer_contact', width: 120 },
                    { title: '目的地', dataIndex: 'destination' },
                    { title: '产品类型', dataIndex: 'product_type', width: 100 },
                    { title: '重量(kg)', dataIndex: 'weight', width: 90 },
                    { title: '流向时间', dataIndex: 'flow_time', width: 150, render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
                  ]}
                  pagination={false}
                  scroll={{ x: 800 }}
                />
              </Card>
            )}

            {(!scopeData.flows || scopeData.flows.length === 0) && (
              <Alert type="info" message="该证书下暂无产品流向记录，召回仅影响证书本身有效性" />
            )}
          </Space>
        )}
      </Drawer>
    </div>
  );
}
