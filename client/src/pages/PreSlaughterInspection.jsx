import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Select, Input, Radio, Switch, DatePicker, Tag, Space, message, Alert, Row, Col, Card, Descriptions, Timeline, Drawer } from 'antd';
import { PlusOutlined, CheckCircleOutlined, ExclamationCircleOutlined, StopOutlined, EyeOutlined, RollbackOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getInspections, createInspection, getEntries, getInspection, updateInspectionFollowUp } from '../api';

const RESULT_MAP = {
  qualified: { text: '合格', color: 'green' },
  disqualified: { text: '不合格', color: 'red' },
};

const DISPOSAL_OPTIONS = [
  { value: 'pass', label: '通过', color: 'green' },
  { value: 'isolate', label: '隔离观察', color: 'orange' },
  { value: 'return', label: '退回', color: 'blue' },
  { value: 'destroy', label: '销毁', color: 'red' },
];

const FOLLOW_UP_STATUS_MAP = {
  pending: { text: '待复查', color: 'orange' },
  completed: { text: '已完成', color: 'green' },
  in_progress: { text: '处理中', color: 'blue' },
};

export default function PreSlaughterInspection() {
  const [data, setData] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form] = Form.useForm();

  const appearance = Form.useWatch('appearance', form);
  const docCheck = Form.useWatch('doc_check', form);
  const disposalResult = Form.useWatch('disposal_result', form);
  const isolation = Form.useWatch('isolation', form);
  const entryId = Form.useWatch('entry_id', form);
  const isDisqualified = Form.useWatch('result', form) === 'disqualified' || (appearance && docCheck && disposalResult && (appearance !== 'normal' || docCheck !== 'pass' || disposalResult !== 'pass'));

  const showAbnormal = appearance === 'abnormal' || docCheck === 'fail';
  const requiresIsolation = disposalResult === 'isolate' || disposalResult === 'return' || disposalResult === 'destroy';
  
  const isQualified = appearance === 'normal' && docCheck === 'pass' && disposalResult === 'pass';
  const autoResult = isQualified ? 'qualified' : 'disqualified';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [inspections, allEntries] = await Promise.all([getInspections(), getEntries()]);
      setData(inspections);
      setEntries(allEntries);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const eligibleEntries = entries.filter((e) => (e.status === 'pending' || e.status === 'inspecting') && !e.is_deleted);

  const openAdd = () => {
    form.resetFields();
    form.setFieldsValue({ isolation: false, follow_up_status: 'pending' });
    setModalOpen(true);
  };

  const openDetail = async (id) => {
    setDetailLoading(true);
    try {
      const data = await getInspection(id);
      setDetailData(data);
      setDetailOpen(true);
    } catch (err) {
      message.error(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleFollowUpComplete = async (record) => {
    Modal.confirm({
      title: '确认完成处置闭环',
      icon: <CheckCircleOutlined />,
      content: '确认该异常批次的处置已全部完成，后续复查已完成？',
      okText: '确认完成',
      okType: 'primary',
      cancelText: '取消',
      onOk: async () => {
        try {
          await updateInspectionFollowUp(record.id, {
            follow_up_status: 'completed',
            disposal_closure: record.disposal_closure || '后续复查已完成，处置闭环确认',
            disposal_person: record.disposal_person || record.inspector,
            disposal_time: new Date().toISOString(),
          });
          message.success('处置闭环已完成，状态已更新');
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
      
      if (values.appearance !== 'normal' || values.doc_check !== 'pass') {
        if (!values.abnormal_desc) {
          message.error('外观异常或证照不通过时必须填写异常描述');
          return;
        }
      }
      
      if (values.disposal_result === 'isolate' || values.disposal_result === 'return' || values.disposal_result === 'destroy') {
        if (!values.isolation) {
          message.error('处置结果为隔离、退回或销毁时必须标记隔离');
          return;
        }
        if (!values.disposal_closure) {
          message.error('异常处置必须填写处置闭环说明');
          return;
        }
        if (!values.disposal_person) {
          message.error('异常处置必须填写处置执行人');
          return;
        }
      }

      values.inspect_time = values.inspect_time ? values.inspect_time.toISOString() : null;
      values.disposal_time = values.disposal_time ? values.disposal_time.toISOString() : null;
      values.isolation = values.isolation ? 1 : 0;

      const result = await createInspection(values);
      
      if (result.result === 'qualified') {
        message.success('检疫完成，结果：合格，准予进入屠宰环节');
      } else {
        message.error('检疫完成，结果：不合格，该批次已阻断，不得进入屠宰环节');
      }
      
      setModalOpen(false);
      fetchData();
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '入场编号', dataIndex: 'entry_id', width: 90 },
    { title: '养殖场', dataIndex: 'farm_name', ellipsis: true },
    { title: '体温(℃)', dataIndex: 'body_temp', width: 90 },
    {
      title: '外观', dataIndex: 'appearance', width: 80,
      render: (v) => v === 'normal' ? <Tag color="green">正常</Tag> : <Tag color="red">异常</Tag>,
    },
    {
      title: '证照核验', dataIndex: 'doc_check', width: 90,
      render: (v) => v === 'pass' ? <Tag color="green">通过</Tag> : <Tag color="red">不通过</Tag>,
    },
    {
      title: '隔离', dataIndex: 'isolation', width: 70,
      render: (v) => v ? <Tag color="orange">是</Tag> : <Tag>否</Tag>,
    },
    {
      title: '处置结果', dataIndex: 'disposal_result', width: 100,
      render: (v) => {
        const opt = DISPOSAL_OPTIONS.find((o) => o.value === v) || {};
        return <Tag color={opt.color || 'default'}>{opt.label || v}</Tag>;
      },
    },
    {
      title: '后续状态', dataIndex: 'follow_up_status', width: 100,
      render: (v) => {
        const info = FOLLOW_UP_STATUS_MAP[v] || { text: v, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    { title: '检疫员', dataIndex: 'inspector', width: 90 },
    { title: '检疫时间', dataIndex: 'inspect_time', width: 160, render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
    {
      title: '结果', dataIndex: 'result', width: 110,
      render: (v) => {
        const info = RESULT_MAP[v] || { text: v, color: 'default' };
        return (
          <Space>
            {v === 'qualified' && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
            {v === 'disqualified' && <StopOutlined style={{ color: '#ff4d4f' }} />}
            <Tag color={info.color}>{info.text}</Tag>
          </Space>
        );
      },
    },
    {
      title: '操作',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(record.id)}>详情</Button>
          {record.result === 'disqualified' && record.follow_up_status !== 'completed' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleFollowUpComplete(record)}>完成闭环</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增检疫</Button>
        <Alert
          type="info"
          showIcon
          message="检疫规则"
          description="外观异常、证照不通过或处置非通过的批次将自动判定为不合格，阻断进入屠宰环节"
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
          expandedRowRender: (record) => (
            <Row gutter={16}>
              <Col span={12}>
                <Descriptions column={1} size="small" bordered title="检疫与处置详情">
                  <Descriptions.Item label="判定依据">{record.judge_basis || '-'}</Descriptions.Item>
                  <Descriptions.Item label="异常描述">{record.abnormal_desc || '-'}</Descriptions.Item>
                  <Descriptions.Item label="处置闭环说明">{record.disposal_closure || '-'}</Descriptions.Item>
                  <Descriptions.Item label="处置执行人">{record.disposal_person || '-'}</Descriptions.Item>
                  <Descriptions.Item label="处置完成时间">{record.disposal_time ? dayjs(record.disposal_time).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={12}>
                {record.result === 'disqualified' && (
                  <Alert
                    type="error"
                    showIcon
                    icon={<StopOutlined />}
                    message="业务阻断"
                    description={record.blocking_explanation || '该批次检疫不合格，已阻断进入屠宰环节'}
                  />
                )}
              </Col>
            </Row>
          ),
        }}
      />

      <Modal
        title="新增宰前检疫"
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={680}
        destroyOnHidden
        okText="提交检疫结果"
        okButtonProps={{ disabled: !appearance || !docCheck || !disposalResult }}
      >
        <Form form={form} layout="vertical">
          <Alert
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
            message="检疫结果由系统根据检查项自动判定，不可人工干预"
            description="不合格批次将自动阻断进入屠宰流程"
            style={{ marginBottom: 16 }}
          />

          <Form.Item name="entry_id" label="入场批次" rules={[{ required: true, message: '请选择入场记录' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="选择待检入场记录"
              options={eligibleEntries.map((e) => ({
                value: e.id,
                label: `#${e.id} - ${e.farm_name} (${e.animal_type} ${e.quantity}头) - ${e.quarantine_cert_no}`,
              }))}
            />
          </Form.Item>

          {entryId && (() => {
            const entry = entries.find((e) => e.id === entryId);
            return entry ? (
              <Alert
                type="info"
                showIcon
                message={`入场信息：${entry.farm_name}，${entry.animal_type} ${entry.quantity} 头，检疫证号 ${entry.quarantine_cert_no}`}
                style={{ marginBottom: 16 }}
              />
            ) : null;
          })()}

          <Space.Compact block style={{ marginBottom: 16 }}>
            <Form.Item name="body_temp" label="体温(℃)" rules={[{ required: true, message: '请输入体温' }]} style={{ flex: 1, marginBottom: 0 }}>
              <Input placeholder="如 38.5" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="inspect_time" label="检疫时间" rules={[{ required: true, message: '请选择检疫时间' }]} style={{ flex: 2, marginBottom: 0 }}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <Form.Item name="appearance" label="外观检查" rules={[{ required: true, message: '请选择外观检查结果' }]}>
                <Radio.Group>
                  <Radio value="normal">正常</Radio>
                  <Radio value="abnormal">异常</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="doc_check" label="证照核验" rules={[{ required: true, message: '请选择证照核验结果' }]}>
                <Radio.Group>
                  <Radio value="pass">通过</Radio>
                  <Radio value="fail">不通过</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          {showAbnormal && (
            <Alert
              type="error"
              showIcon
              message="检测到异常项"
              description={[
                appearance === 'abnormal' && '外观异常，',
                docCheck === 'fail' && '证照不通过，',
                '该批次将自动判定为不合格',
              ].filter(Boolean).join('')}
              style={{ marginBottom: 16 }}
            />
          )}

          {showAbnormal && (
            <Form.Item name="abnormal_desc" label="异常描述" rules={[{ required: true, message: '请填写异常描述' }]}>
              <Input.TextArea rows={3} placeholder="请详细描述异常症状、异常数量、涉及耳标等信息，必要时拍照留证" />
            </Form.Item>
          )}

          <Form.Item name="isolation" label="隔离处理" valuePropName="checked" extra="处置为隔离、退回、销毁时必须开启">
            <Switch checkedChildren="隔离" unCheckedChildren="正常" />
          </Form.Item>

          <Form.Item name="disposal_result" label="处置结果" rules={[{ required: true, message: '请选择处置结果' }]}>
            <Select
              options={DISPOSAL_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
            />
          </Form.Item>

          {requiresIsolation && !isolation && (
            <Alert type="warning" showIcon message="处置为隔离、退回或销毁时必须开启隔离开关" style={{ marginBottom: 16 }} />
          )}

          <Form.Item name="inspector" label="检疫员" rules={[{ required: true, message: '请输入检疫员姓名' }]}>
            <Input placeholder="检疫员签名/姓名" />
          </Form.Item>

          {isDisqualified && requiresIsolation && (
            <Card size="small" title="异常批次处置闭环" type="inner" style={{ marginBottom: 16 }}>
              <Alert
                type="warning"
                showIcon
                icon={<RollbackOutlined />}
                message="异常处置必须闭环"
                description="请详细填写处置过程、执行人、时间和后续跟踪状态"
                style={{ marginBottom: 12 }}
              />
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="disposal_person" label="处置执行人" rules={[{ required: true, message: '请输入处置执行人' }]}>
                    <Input placeholder="实际执行处置的人员姓名" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="disposal_time" label="处置完成时间" rules={[{ required: true, message: '请选择处置完成时间' }]}>
                    <DatePicker showTime style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="disposal_closure" label="处置闭环说明" rules={[{ required: true, message: '请填写处置闭环说明' }]}>
                <Input.TextArea
                  rows={3}
                  placeholder="请详细描述：处置过程、处置地点、监督人员、处置效果确认、是否需要后续跟踪复查、同群动物处置情况等"
                />
              </Form.Item>
              <Form.Item name="follow_up_status" label="后续复查状态">
                <Select options={[
                  { value: 'pending', label: '待复查' },
                  { value: 'in_progress', label: '处理中' },
                  { value: 'completed', label: '已完成' },
                ]} />
              </Form.Item>
            </Card>
          )}

          {appearance && docCheck && disposalResult && (
            <Card size="small" title="自动判定结果" bordered style={{ marginTop: 16 }}>
              <Space>
                {isQualified ? (
                  <>
                    <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                    <Tag color="green" style={{ fontSize: 16, padding: '4px 12px' }}>合格 - 准予进入屠宰</Tag>
                  </>
                ) : (
                  <>
                    <StopOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
                    <Tag color="red" style={{ fontSize: 16, padding: '4px 12px' }}>不合格 - 阻断屠宰流程</Tag>
                  </>
                )}
              </Space>
              <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
                判定依据：
                外观={appearance === 'normal' ? '正常 ✓' : '异常 ✗'}，
                证照={docCheck === 'pass' ? '通过 ✓' : '不通过 ✗'}，
                处置={disposalResult === 'pass' ? '通过 ✓' : '非通过 ✗'}
              </div>
            </Card>
          )}
        </Form>
      </Modal>

      <Drawer
        title="检疫记录详情"
        width={720}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        loading={detailLoading}
        destroyOnHidden
      >
        {detailData && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions column={2} bordered size="small" title="基本信息">
              <Descriptions.Item label="检疫ID">{detailData.id}</Descriptions.Item>
              <Descriptions.Item label="入场编号">{detailData.entry_id}</Descriptions.Item>
              <Descriptions.Item label="养殖场">{detailData.farm_name}</Descriptions.Item>
              <Descriptions.Item label="体温">{detailData.body_temp}℃</Descriptions.Item>
              <Descriptions.Item label="外观">{detailData.appearance === 'normal' ? '正常' : '异常'}</Descriptions.Item>
              <Descriptions.Item label="证照核验">{detailData.doc_check === 'pass' ? '通过' : '不通过'}</Descriptions.Item>
              <Descriptions.Item label="隔离">{detailData.isolation ? '是' : '否'}</Descriptions.Item>
              <Descriptions.Item label="处置结果">{DISPOSAL_OPTIONS.find(o => o.value === detailData.disposal_result)?.label || detailData.disposal_result}</Descriptions.Item>
              <Descriptions.Item label="后续状态">
                <Tag color={FOLLOW_UP_STATUS_MAP[detailData.follow_up_status]?.color || 'default'}>
                  {FOLLOW_UP_STATUS_MAP[detailData.follow_up_status]?.text || detailData.follow_up_status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="检疫员">{detailData.inspector}</Descriptions.Item>
              <Descriptions.Item label="检疫时间" span={2}>{detailData.inspect_time ? dayjs(detailData.inspect_time).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
            </Descriptions>

            <Card size="small" title="检疫判定" type="inner">
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <div>
                  <strong>判定结果：</strong>
                  {detailData.result === 'qualified' ? (
                    <Tag color="green" icon={<CheckCircleOutlined />}>合格</Tag>
                  ) : (
                    <Tag color="red" icon={<StopOutlined />}>不合格</Tag>
                  )}
                </div>
                <div><strong>判定依据：</strong>{detailData.judge_basis || '-'}</div>
                {detailData.abnormal_desc && <div><strong>异常描述：</strong>{detailData.abnormal_desc}</div>}
              </Space>
            </Card>

            {detailData.result === 'disqualified' && (
              <Card size="small" title="处置闭环信息" type="inner">
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="处置执行人">{detailData.disposal_person || '-'}</Descriptions.Item>
                  <Descriptions.Item label="处置完成时间">{detailData.disposal_time ? dayjs(detailData.disposal_time).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="处置闭环说明" span={2}>{detailData.disposal_closure || '-'}</Descriptions.Item>
                  <Descriptions.Item label="业务阻断说明" span={2}>
                    {detailData.blocking_explanation || '该批次检疫不合格，已阻断进入屠宰环节'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {detailData.audit_log && detailData.audit_log.length > 0 && (
              <Card size="small" title="审计记录" type="inner">
                <Timeline
                  size="small"
                  items={detailData.audit_log.map((log, idx) => ({
                    color: log.type === 'block' ? 'red' : log.type === 'disposal' ? 'orange' : 'blue',
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
