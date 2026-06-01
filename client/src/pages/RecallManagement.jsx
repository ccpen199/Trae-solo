import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Select, Input, DatePicker, Tag, Space, message, Alert, Row, Col, Card, Descriptions, Drawer, Timeline, Divider, Statistic } from 'antd';
import { PlusOutlined, WarningOutlined, EyeOutlined, CheckCircleOutlined, StopOutlined, SearchOutlined, RollbackOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getRecalls, createRecall, getRecall, getRecallScope, completeRecall, getCertificates } from '../api';

const RECALL_STATUS_MAP = {
  active: { text: '召回中', color: 'red' },
  completed: { text: '已完成', color: 'green' },
  in_progress: { text: '处理中', color: 'orange' },
};

const COMPLETION_STATUS_MAP = {
  in_progress: { text: '进行中', color: 'orange' },
  completed: { text: '已完成', color: 'green' },
  partial: { text: '部分完成', color: 'blue' },
};

const RECALL_REASONS = [
  '疫病风险',
  '质量不合格',
  '标签错误',
  '污染风险',
  '检疫证明问题',
  '其他原因',
];

const RECALL_SCOPES = [
  '全部召回',
  '指定批次召回',
  '指定流向召回',
  '指定时间段召回',
];

export default function RecallManagement() {
  const [data, setData] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [scopeReviewOpen, setScopeReviewOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [scopeData, setScopeData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [scopeLoading, setScopeLoading] = useState(false);
  const [selectedCertNo, setSelectedCertNo] = useState(null);
  const [form] = Form.useForm();

  const formCertNo = Form.useWatch('cert_no', form);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recalls, certs] = await Promise.all([getRecalls(), getCertificates()]);
      setData(recalls);
      setCertificates(certs);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const validCertificates = certificates.filter((cert) => cert.status === 'valid');

  const openAdd = () => {
    form.resetFields();
    form.setFieldsValue({ completion_status: 'in_progress' });
    setModalOpen(true);
  };

  const openDetail = async (id) => {
    setDetailLoading(true);
    try {
      const data = await getRecall(id);
      setDetailData(data);
      setDetailOpen(true);
    } catch (err) {
      message.error(err.message);
    } finally {
      setDetailLoading(false);
    }
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

  const handleComplete = async (id) => {
    Modal.confirm({
      title: '确认完成召回',
      icon: <CheckCircleOutlined />,
      content: '确认该召回已全部完成，所有受影响产品已召回并处置完毕？此操作不可撤销。',
      okText: '确认完成',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await completeRecall(id);
          message.success('召回已标记为完成');
          fetchData();
        } catch (err) {
          message.error(err.message);
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      values.recall_time = values.recall_time ? values.recall_time.toISOString() : null;
      values.status = 'active';
      
      if (!values.scope_details) {
        values.scope_details = `召回证书：${values.cert_no}，召回原因：${values.reason}，召回范围：${values.scope || '全部'}`;
      }

      await createRecall(values);
      message.success('召回登记成功');
      setModalOpen(false);
      fetchData();
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '证书编号', dataIndex: 'cert_no', width: 180, ellipsis: true },
    { title: '召回原因', dataIndex: 'reason', ellipsis: true, width: 150 },
    { title: '召回范围', dataIndex: 'scope', ellipsis: true, width: 120 },
    {
      title: '影响流向数', dataIndex: 'affected_flows', width: 110,
      render: (v) => v ? <Tag color="red">{v} 条</Tag> : '-',
    },
    {
      title: '影响重量(kg)', dataIndex: 'affected_quantity', width: 120,
      render: (v) => v ? <Tag color="orange">{v}</Tag> : '-',
    },
    {
      title: '完成状态', dataIndex: 'completion_status', width: 100,
      render: (v) => {
        const info = COMPLETION_STATUS_MAP[v] || { text: v, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    { title: '发起人', dataIndex: 'initiator', width: 90 },
    { title: '召回时间', dataIndex: 'recall_time', width: 160, render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: (v) => {
        const info = RECALL_STATUS_MAP[v] || { text: v, color: 'default' };
        return <Tag color={info.color} icon={v === 'active' ? <WarningOutlined /> : <CheckCircleOutlined />}>{info.text}</Tag>;
      },
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(record.id)}>详情</Button>
          <Button type="link" size="small" icon={<SearchOutlined />} onClick={() => checkScope(record.cert_no)}>范围复查</Button>
          {record.status === 'active' && record.completion_status !== 'completed' && (
            <Button type="link" size="small" danger icon={<CheckCircleOutlined />} onClick={() => handleComplete(record.id)}>完成召回</Button>
          )}
        </Space>
      ),
    },
  ];

  const recallStats = {
    total: data.length,
    active: data.filter((r) => r.status === 'active').length,
    completed: data.filter((r) => r.completion_status === 'completed').length,
    affectedQty: data.reduce((sum, r) => sum + (r.affected_quantity || 0), 0),
  };

  return (
    <div>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small">
              <Statistic title="召回总数" value={recallStats.total} prefix={<WarningOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small">
              <Statistic title="进行中召回" value={recallStats.active} valueStyle={{ color: '#cf1322' }} prefix={<StopOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small">
              <Statistic title="已完成召回" value={recallStats.completed} valueStyle={{ color: '#3f8600' }} prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small">
              <Statistic title="影响总重量(kg)" value={recallStats.affectedQty} precision={1} />
            </Card>
          </Col>
        </Row>

        <Space style={{ marginBottom: 8 }}>
          <Button type="primary" danger icon={<PlusOutlined />} onClick={openAdd}>登记召回</Button>
          <Button icon={<SearchOutlined />} onClick={() => formCertNo && checkScope(formCertNo)}>复查召回范围</Button>
          <Alert
            type="info"
            showIcon
            message="召回管理"
            description="召回业务需要先复查影响范围，确认受影响的流向、重量和采购方后再执行召回，完成后需标记完成状态形成闭环"
            style={{ marginLeft: 16, flex: 1 }}
          />
        </Space>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
          expandable={{
            expandedRowRender: (record) => (
              <Row gutter={16}>
                <Col span={12}>
                  <Descriptions column={1} size="small" bordered title="召回详情">
                    <Descriptions.Item label="召回原因">{record.reason || '-'}</Descriptions.Item>
                    <Descriptions.Item label="召回范围说明">{record.scope_details || '-'}</Descriptions.Item>
                    <Descriptions.Item label="完成时间">{record.completed_time ? dayjs(record.completed_time).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col span={12}>
                  <Descriptions column={1} size="small" bordered title="影响范围">
                    <Descriptions.Item label="影响流向数">{record.affected_flows || 0} 条</Descriptions.Item>
                    <Descriptions.Item label="影响重量">{record.affected_quantity || 0} kg</Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            ),
          }}
        />
      </Space>

      <Modal
        title="登记产品召回"
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={720}
        destroyOnHidden
        okText="提交召回登记"
        okButtonProps={{ danger: true }}
      >
        <Form form={form} layout="vertical">
          <Alert
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            message="召回操作将阻断相关产品的继续流通"
            description="请务必先通过【范围复查】功能确认受影响的流向、重量和采购方，再执行召回登记"
            style={{ marginBottom: 16 }}
          />

          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="cert_no" label="证书编号" rules={[{ required: true, message: '请选择召回的证书' }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="选择需要召回的有效证书"
                  options={validCertificates.map((cert) => ({
                    value: cert.cert_no,
                    label: `${cert.cert_no} - ${cert.origin_farm} (${cert.animal_type} ${cert.quantity})`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="召回范围预查">
                <Button icon={<SearchOutlined />} onClick={() => formCertNo && checkScope(formCertNo)} block>
                  复查影响范围
                </Button>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="reason" label="召回原因" rules={[{ required: true, message: '请选择召回原因' }]}>
                <Select options={RECALL_REASONS.map((r) => ({ value: r, label: r }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="scope" label="召回范围">
                <Select options={RECALL_SCOPES.map((s) => ({ value: s, label: s }))} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="scope_details" label="召回范围详细说明">
            <Input.TextArea
              rows={3}
              placeholder="请详细描述召回范围：涉及批次、流向区域、时间范围、产品类型、受影响的采购方等信息"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="initiator" label="发起人" rules={[{ required: true, message: '请输入发起人' }]}>
                <Input placeholder="召回发起人姓名/部门" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="recall_time" label="召回时间" rules={[{ required: true, message: '请选择召回时间' }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="completion_status" label="完成状态" initialValue="in_progress">
            <Select options={[
              { value: 'in_progress', label: '进行中' },
              { value: 'partial', label: '部分完成' },
              { value: 'completed', label: '已完成' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="召回详情"
        width={720}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        loading={detailLoading}
        destroyOnHidden
      >
        {detailData && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions column={2} bordered size="small" title="基本信息">
              <Descriptions.Item label="召回ID">{detailData.id}</Descriptions.Item>
              <Descriptions.Item label="证书编号">{detailData.cert_no}</Descriptions.Item>
              <Descriptions.Item label="召回原因">{detailData.reason}</Descriptions.Item>
              <Descriptions.Item label="召回范围">{detailData.scope || '-'}</Descriptions.Item>
              <Descriptions.Item label="发起人">{detailData.initiator}</Descriptions.Item>
              <Descriptions.Item label="召回时间">{detailData.recall_time ? dayjs(detailData.recall_time).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={RECALL_STATUS_MAP[detailData.status]?.color || 'default'}>
                  {RECALL_STATUS_MAP[detailData.status]?.text || detailData.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="完成状态">
                <Tag color={COMPLETION_STATUS_MAP[detailData.completion_status]?.color || 'default'}>
                  {COMPLETION_STATUS_MAP[detailData.completion_status]?.text || detailData.completion_status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="影响流向数">{detailData.affected_flows || 0} 条</Descriptions.Item>
              <Descriptions.Item label="影响重量">{detailData.affected_quantity || 0} kg</Descriptions.Item>
              <Descriptions.Item label="完成时间" span={2}>{detailData.completed_time ? dayjs(detailData.completed_time).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
              <Descriptions.Item label="范围说明" span={2}>{detailData.scope_details || '-'}</Descriptions.Item>
            </Descriptions>

            {detailData.audit_log && detailData.audit_log.length > 0 && (
              <Card size="small" title="审计记录" type="inner">
                <Timeline
                  size="small"
                  items={detailData.audit_log.map((log, idx) => ({
                    color: log.type === 'recall' ? 'red' : log.type === 'complete' ? 'green' : 'blue',
                    children: (
                      <div>
                        <div style={{ fontWeight: 600 }}>{log.action}</div>
                        <div style={{ color: '#666', fontSize: 12 }}>{log.detail}</div>
                        <div style={{ color: '#999', fontSize: 11, marginTop: 4 }}>
                          {log.operator && `操作人：${log.operator}，`}
                          {log.time && dayjs(log.time).format('YYYY-MM-DD HH:mm:ss')}
                        </div>
                      </div>
                    ),
                  }))}
                />
              </Card>
            )}
          </Space>
        )}
      </Drawer>

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
            <Button type="primary" danger icon={<RollbackOutlined />} onClick={() => { setScopeReviewOpen(false); openAdd(); }}>
              基于此范围登记召回
            </Button>
          </Space>
        }
      >
        {scopeData && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Alert
              type="warning"
              showIcon
              icon={<WarningOutlined />}
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
