import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Select, Input, DatePicker, InputNumber, Tag, Space, message, Alert, Card, Descriptions, Row, Col, Drawer, Timeline, Switch, Divider } from 'antd';
import { PlusOutlined, CheckCircleOutlined, ExclamationCircleOutlined, StopOutlined, EyeOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getSlaughterBatches, createSlaughterBatch, getEntries, getSlaughterBatch, reviewSlaughterBatch } from '../api';

const STATUS_MAP = {
  processing: { text: '加工中', color: 'blue' },
  qualified: { text: '合格', color: 'green' },
  disqualified: { text: '不合格', color: 'red' },
};

const REVIEW_STATUS_MAP = {
  pending: { text: '待复核', color: 'orange' },
  reviewed: { text: '已复核', color: 'green' },
};

const SEGMENTATION_TYPES = ['二分体', '四分体', '带皮前腿', '带皮后腿', '里脊肉', '五花肉', '排骨', '内脏', '其他分割'];

const SEGMENTATION_WEIGHT_MAP = {
  '二分体': { min: 40, max: 60 },
  '四分体': { min: 20, max: 30 },
  '带皮前腿': { min: 8, max: 12 },
  '带皮后腿': { min: 10, max: 15 },
  '里脊肉': { min: 3, max: 5 },
  '五花肉': { min: 5, max: 8 },
  '排骨': { min: 4, max: 6 },
  '内脏': { min: 8, max: 12 },
  '其他分割': { min: 0, max: 50 },
};

export default function SlaughterProcess() {
  const [data, setData] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form] = Form.useForm();

  const inspectResult = Form.useWatch('inspect_result', form);
  const selectedEntryId = Form.useWatch('entry_id', form);
  const selectedSegmentation = Form.useWatch('segmentation_details', form);
  const isDisqualified = inspectResult === 'disqualified';
  const reviewConfirmation = Form.useWatch('review_confirmation', form);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [batches, allEntries] = await Promise.all([getSlaughterBatches(), getEntries()]);
      setData(batches);
      setEntries(allEntries);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const existingEntryIds = new Set(data.map((b) => b.entry_id));
  const qualifiedEntries = entries.filter((e) => e.status === 'qualified' && !existingEntryIds.has(e.id) && !e.is_deleted);

  const selectedEntry = selectedEntryId ? entries.find((e) => e.id === selectedEntryId) : null;

  const openAdd = () => {
    form.resetFields();
    form.setFieldsValue({ inspect_result: 'qualified', review_status: 'pending', review_confirmation: false });
    setModalOpen(true);
  };

  const openDetail = async (id) => {
    setDetailLoading(true);
    try {
      const data = await getSlaughterBatch(id);
      setDetailData(data);
      setDetailOpen(true);
    } catch (err) {
      message.error(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleReviewConfirm = async (record) => {
    Modal.confirm({
      title: '复核确认',
      icon: <CheckCircleOutlined />,
      content: record.inspect_result === 'disqualified'
        ? '确认已完成无害化处理，不合格批次已阻断出证和产品流向？'
        : '确认该批次检验合格，复核通过？',
      okText: '确认复核',
      okType: 'primary',
      cancelText: '取消',
      onOk: async () => {
        try {
          await reviewSlaughterBatch(record.id, {
            reviewer: record.responsible_person || '当前用户',
            review_confirmation: true,
            blocking_reason: record.blocking_reason,
            harmless_treatment_details: record.harmless_treatment_details,
          });
          if (record.inspect_result === 'disqualified') {
            message.success('复核确认完成，不合格批次已阻断出证和产品流向');
          } else {
            message.success('复核确认完成，合格批次可进入出证环节');
          }
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
      values.slaughter_time = values.slaughter_time ? values.slaughter_time.toISOString() : null;
      values.meat_yield = values.meat_yield || 0;
      values.status = values.inspect_result;
      
      if (values.segmentation_details) {
        values.segmentation_details = JSON.stringify(values.segmentation_details);
      }
      
      if (values.inspect_result === 'disqualified') {
        if (!values.harmless_treatment) {
          message.error('检验不合格必须填写无害化处理方式');
          return;
        }
        if (!values.harmless_treatment_details) {
          message.error('检验不合格必须填写无害化处理明细');
          return;
        }
        if (!values.blocking_reason) {
          message.error('检验不合格必须填写异常阻断说明');
          return;
        }
        if (!values.reviewer) {
          message.error('检验不合格必须填写复核人');
          return;
        }
        if (!values.review_confirmation) {
          message.error('请确认复核确认开关，确认已完成无害化处理和阻断措施');
          return;
        }
        values.review_status = 'reviewed';
        values.review_time = new Date().toISOString();
        values.review_confirmation = 1;
      } else {
        values.review_confirmation = 0;
      }

      await createSlaughterBatch(values);
      
      if (values.inspect_result === 'qualified') {
        message.success('屠宰批次创建成功，检验合格');
      } else {
        message.error('屠宰批次创建成功，检验不合格，已执行无害化处理并阻断流向');
      }
      
      setModalOpen(false);
      fetchData();
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const columns = [
    { title: '批次号', dataIndex: 'batch_no', width: 180, ellipsis: true },
    { title: '入场编号', dataIndex: 'entry_id', width: 90 },
    { title: '养殖场', dataIndex: 'farm_name', ellipsis: true },
    { title: '动物种类', dataIndex: 'animal_type', width: 90 },
    { title: '屠宰时间', dataIndex: 'slaughter_time', width: 160, render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
    {
      title: '检验结果', dataIndex: 'inspect_result', width: 90,
      render: (v) => {
        const map = { qualified: { text: '合格', color: 'green' }, disqualified: { text: '不合格', color: 'red' } };
        const info = map[v] || { text: v, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    { title: '出肉量(kg)', dataIndex: 'meat_yield', width: 100 },
    { title: '责任人', dataIndex: 'responsible_person', width: 90 },
    {
      title: '复核确认', dataIndex: 'review_confirmation', width: 90,
      render: (v) => v ? <Tag color="green" icon={<CheckCircleOutlined />}>已确认</Tag> : <Tag color="orange">待确认</Tag>,
    },
    {
      title: '复核状态', dataIndex: 'review_status', width: 90,
      render: (v) => {
        const info = REVIEW_STATUS_MAP[v] || { text: v, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    { title: '复核人', dataIndex: 'reviewer', width: 90 },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: (s) => {
        const info = STATUS_MAP[s] || { text: s, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(record.id)}>详情</Button>
          {record.review_confirmation === 0 && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleReviewConfirm(record)}>复核确认</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>创建屠宰批次</Button>
        <Alert
          type="info"
          showIcon
          message="屠宰流程规则"
          description="检验不合格批次必须填写无害化处理明细、阻断说明并经复核人确认，自动阻断后续出证和流向"
          style={{ marginLeft: 16, flex: 1 }}
        />
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: 1500 }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        expandable={{
          expandedRowRender: (record) => {
            let segDetails = record.segmentation_details;
            if (typeof segDetails === 'string') {
              try { segDetails = JSON.parse(segDetails); } catch (e) { segDetails = record.segmentation_details; }
            }
            return (
              <Row gutter={16}>
                <Col span={12}>
                  <Descriptions column={1} size="small" bordered title="批次分割明细">
                    <Descriptions.Item label="分割部位">
                      {Array.isArray(segDetails) ? segDetails.join('、') : segDetails || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="无害化处理方式">{record.harmless_treatment || '-'}</Descriptions.Item>
                    <Descriptions.Item label="无害化处理明细">{record.harmless_treatment_details || '-'}</Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col span={12}>
                  {record.inspect_result === 'disqualified' ? (
                    <Descriptions column={1} size="small" bordered title="异常阻断与复核">
                      <Descriptions.Item label="异常阻断说明">{record.blocking_reason || '-'}</Descriptions.Item>
                      <Descriptions.Item label="复核确认">{record.review_confirmation ? '已确认' : '未确认'}</Descriptions.Item>
                      <Descriptions.Item label="复核人">{record.reviewer || '-'}</Descriptions.Item>
                      <Descriptions.Item label="复核时间">{record.review_time ? dayjs(record.review_time).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
                    </Descriptions>
                  ) : (
                    <Alert
                      type="success"
                      showIcon
                      icon={<SafetyCertificateOutlined />}
                      message="检验合格"
                      description="该批次检验合格，可进入出证环节"
                    />
                  )}
                </Col>
              </Row>
            );
          },
        }}
      />

      <Modal
        title="创建屠宰批次"
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={720}
        destroyOnHidden
        okText="提交并完成屠宰"
      >
        <Form form={form} layout="vertical">
          {isDisqualified && (
            <Alert
              type="error"
              showIcon
              icon={<StopOutlined />}
              message="该批次检验不合格"
              description="必须填写无害化处理方式、处理明细、阻断说明，并经复核人确认"
              style={{ marginBottom: 16 }}
            />
          )}

          <Form.Item name="entry_id" label="入场批次" rules={[{ required: true, message: '请选择合格入场记录' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="选择检疫合格且未屠宰的入场记录"
              options={qualifiedEntries.map((e) => ({
                value: e.id,
                label: `#${e.id} - ${e.farm_name} (${e.animal_type} ${e.quantity}头)`,
              }))}
            />
          </Form.Item>

          {selectedEntry && (
            <Alert
              type="info"
              showIcon
              message={`入场信息：${selectedEntry.farm_name}，${selectedEntry.animal_type} ${selectedEntry.quantity} 头，检疫证号 ${selectedEntry.quarantine_cert_no}`}
              style={{ marginBottom: 16 }}
            />
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="slaughter_time" label="屠宰时间" rules={[{ required: true, message: '请选择屠宰时间' }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="responsible_person" label="屠宰责任人" rules={[{ required: true, message: '请输入责任人' }]}>
                <Input placeholder="屠宰线负责人" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="inspect_result" label="检验结果" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'qualified', label: '合格' },
                  { value: 'disqualified', label: '不合格' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="meat_yield" label="出肉量(kg)">
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="实际出肉重量" />
              </Form.Item>
            </Col>
          </Row>

          <Card size="small" title="批次分割明细" type="inner" style={{ marginBottom: 16 }}>
            <Form.Item name="segmentation_details" label="分割部位">
              <Select
                mode="multiple"
                placeholder="选择分割部位，可多选"
                options={SEGMENTATION_TYPES.map((s) => ({ value: s, label: s }))}
                style={{ width: '100%' }}
              />
            </Form.Item>
            {selectedSegmentation && selectedSegmentation.length > 0 && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <div style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>请填写各分割部位重量（kg），参考范围已标注：</div>
                <Row gutter={16}>
                  {selectedSegmentation.map((seg) => (
                    <Col span={12} key={seg}>
                      <Form.Item
                        name={`seg_weight_${seg}`}
                        label={`${seg}重量(kg)`}
                        extra={`参考: ${SEGMENTATION_WEIGHT_MAP[seg]?.min || 0}-${SEGMENTATION_WEIGHT_MAP[seg]?.max || 50}kg`}
                      >
                        <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder={`请输入${seg}重量`} />
                      </Form.Item>
                    </Col>
                  ))}
                </Row>
              </>
            )}
          </Card>

          {isDisqualified && (
            <Card size="small" title="不合格批次必填信息" type="inner" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="harmless_treatment" label="无害化处理方式" rules={[{ required: true, message: '请选择处理方式' }]}>
                    <Select options={[
                      { value: '焚烧', label: '焚烧' },
                      { value: '高温', label: '高温处理' },
                      { value: '深埋', label: '深埋' },
                      { value: '化制', label: '化制' },
                      { value: '其他', label: '其他' },
                    ]} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="harmless_treatment_details" label="无害化处理明细" rules={[{ required: true, message: '请填写处理明细' }]}>
                    <Input.TextArea
                      rows={3}
                      placeholder="请详细描述处理过程：处理地点、处理时间、处理人员、监督人员、处理量、处理设备参数等，必要时拍照留证"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="blocking_reason" label="异常阻断说明" rules={[{ required: true, message: '请填写阻断说明' }]}>
                    <Input.TextArea
                      rows={2}
                      placeholder="说明阻断原因：检出的疫病/不合格项、可能受影响的范围、已采取的阻断措施、追溯排查情况"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="reviewer" label="复核人" rules={[{ required: true, message: '请输入复核人' }]}>
                    <Input placeholder="授权复核人员签名/姓名" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="review_status" label="复核状态" initialValue="pending">
                    <Select
                      disabled
                      options={[
                        { value: 'pending', label: '待复核' },
                        { value: 'reviewed', label: '已复核' },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Divider style={{ margin: '12px 0' }} />
              <Form.Item
                name="review_confirmation"
                label="复核确认"
                valuePropName="checked"
                rules={[{ required: true, message: '请确认已完成无害化处理和阻断措施' }]}
                extra="开启后表示确认已完成所有无害化处理、阻断措施，并对处理结果负责"
              >
                <Switch checkedChildren="已确认" unCheckedChildren="未确认" />
              </Form.Item>
              {!reviewConfirmation && (
                <Alert
                  type="warning"
                  showIcon
                  message="请开启复核确认开关"
                  description="确认无害化处理已按规定执行，异常批次已完全阻断，相关记录已完整归档"
                />
              )}
            </Card>
          )}

          {isDisqualified && (
            <Alert
              type="warning"
              showIcon
              icon={<ExclamationCircleOutlined />}
              message="提交后将自动执行以下操作"
              description={[
                '• 该批次标记为不合格',
                '• 无害化处理记录永久保存',
                '• 阻断后续出证和流向',
                '• 监管看板同步异常数据',
              ].map((item, i) => <div key={i}>{item}</div>)}
            />
          )}

          {!isDisqualified && inspectResult === 'qualified' && (
            <Alert
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              message="检验合格"
              description="提交后可进入出证环节，开具检疫合格证明"
            />
          )}
        </Form>
      </Modal>

      <Drawer
        title="屠宰批次详情"
        width={720}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        loading={detailLoading}
        destroyOnHidden
      >
        {detailData && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions column={2} bordered size="small" title="基本信息">
              <Descriptions.Item label="批次号">{detailData.batch_no}</Descriptions.Item>
              <Descriptions.Item label="入场编号">{detailData.entry_id}</Descriptions.Item>
              <Descriptions.Item label="养殖场">{detailData.farm_name}</Descriptions.Item>
              <Descriptions.Item label="动物种类">{detailData.animal_type}</Descriptions.Item>
              <Descriptions.Item label="屠宰时间" span={2}>{detailData.slaughter_time ? dayjs(detailData.slaughter_time).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
              <Descriptions.Item label="出肉量(kg)">{detailData.meat_yield || 0}</Descriptions.Item>
              <Descriptions.Item label="责任人">{detailData.responsible_person || '-'}</Descriptions.Item>
              <Descriptions.Item label="检验结果">
                <Tag color={detailData.inspect_result === 'qualified' ? 'green' : 'red'}>
                  {detailData.inspect_result === 'qualified' ? '合格' : '不合格'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={STATUS_MAP[detailData.status]?.color || 'default'}>
                  {STATUS_MAP[detailData.status]?.text || detailData.status}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Card size="small" title="批次分割明细" type="inner">
              {(() => {
                let segDetails = detailData.segmentation_details;
                if (typeof segDetails === 'string') {
                  try { segDetails = JSON.parse(segDetails); } catch (e) { segDetails = detailData.segmentation_details; }
                }
                return Array.isArray(segDetails) ? segDetails.join('、') : segDetails || '-';
              })()}
            </Card>

            {detailData.inspect_result === 'disqualified' && (
              <Card size="small" title="不合格处置信息" type="inner">
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="无害化处理方式">{detailData.harmless_treatment || '-'}</Descriptions.Item>
                  <Descriptions.Item label="复核确认">{detailData.review_confirmation ? '已确认' : '未确认'}</Descriptions.Item>
                  <Descriptions.Item label="无害化处理明细" span={2}>{detailData.harmless_treatment_details || '-'}</Descriptions.Item>
                  <Descriptions.Item label="异常阻断说明" span={2}>{detailData.blocking_reason || '-'}</Descriptions.Item>
                  <Descriptions.Item label="复核人">{detailData.reviewer || '-'}</Descriptions.Item>
                  <Descriptions.Item label="复核时间">{detailData.review_time ? dayjs(detailData.review_time).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {detailData.audit_log && detailData.audit_log.length > 0 && (
              <Card size="small" title="审计记录" type="inner">
                <Timeline
                  size="small"
                  items={detailData.audit_log.map((log, idx) => ({
                    color: log.type === 'block' ? 'red' : log.type === 'review' ? 'orange' : 'blue',
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
    </div>
  );
}
