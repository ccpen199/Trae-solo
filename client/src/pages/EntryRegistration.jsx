import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, InputNumber, Tag, Space, message, Popconfirm, Alert, Descriptions, Drawer, Timeline, Badge, Card, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, EyeOutlined, FileTextOutlined, SafetyOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getEntries, getEntry, getEntryDetail, getEntryImpact, createEntry, updateEntry, deleteEntry, verifyEntry } from '../api';

const STATUS_MAP = {
  pending: { text: '待检', color: 'blue' },
  inspecting: { text: '检疫中', color: 'orange' },
  qualified: { text: '合格', color: 'green' },
  disqualified: { text: '不合格', color: 'red' },
};

const VERIFICATION_MAP = {
  pending: { text: '待核验', color: 'orange' },
  verified: { text: '核验通过', color: 'green' },
  failed: { text: '核验不通过', color: 'red' },
};

const ISOLATION_MAP = {
  none: { text: '无', color: 'default' },
  pending: { text: '待隔离', color: 'orange' },
  in_progress: { text: '隔离中', color: 'blue' },
  completed: { text: '已隔离', color: 'red' },
};

const ANIMAL_TYPES = ['猪', '牛', '羊', '禽'];
const SEGMENTATION_TYPES = ['二分体', '四分体', '带皮前腿', '带皮后腿', '里脊肉', '五花肉', '排骨', '内脏', '其他分割'];

export default function EntryRegistration() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [viewingDetail, setViewingDetail] = useState(null);
  const [entryDetail, setEntryDetail] = useState(null);
  const [impact, setImpact] = useState(null);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [filterStatus, setFilterStatus] = useState(undefined);
  const [filterAnimalType, setFilterAnimalType] = useState(undefined);
  const [filterDateRange, setFilterDateRange] = useState(null);
  const [form] = Form.useForm();
  const [deleteForm] = Form.useForm();

  const verificationStatus = Form.useWatch('verification_status', form);
  const isolationStatus = Form.useWatch('isolation_status', form);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterAnimalType) params.animal_type = filterAnimalType;
      if (filterDateRange && filterDateRange[0]) {
        params.date_from = filterDateRange[0].startOf('day').toISOString();
        params.date_to = filterDateRange[1].endOf('day').toISOString();
      }
      const rows = await getEntries(params);
      setData(rows);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterAnimalType, filterDateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 'pending', verification_status: 'pending', isolation_status: 'none' });
    setModalOpen(true);
  };

  const openEdit = async (record) => {
    setLoading(true);
    try {
      const fullRecord = await getEntry(record.id);
      setEditing(fullRecord);
      form.setFieldsValue({
        ...fullRecord,
        arrival_time: fullRecord.arrival_time ? dayjs(fullRecord.arrival_time) : null,
      });
      setModalOpen(true);
    } catch (err) {
      message.error('读取详情失败：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (record) => {
    setViewingDetail(record);
    setEntryDetail(null);
    setLoadingDetail(true);
    setDetailDrawerOpen(true);
    try {
      const detail = await getEntryDetail(record.id);
      setEntryDetail(detail);
    } catch (err) {
      message.error('读取详情失败：' + err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const openDelete = async (record) => {
    setDeleting(record);
    setImpact(null);
    deleteForm.resetFields();
    setLoadingImpact(true);
    try {
      const impactData = await getEntryImpact(record.id);
      setImpact(impactData);
    } catch (err) {
      message.error('检查影响范围失败：' + err.message);
    } finally {
      setLoadingImpact(false);
    }
    setDeleteModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      values.arrival_time = values.arrival_time ? values.arrival_time.toISOString() : null;
      if (editing) {
        await updateEntry(editing.id, values);
        message.success('更新成功');
      } else {
        await createEntry(values);
        message.success('新增成功');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const handleVerify = async (id, status) => {
    try {
      await verifyEntry(id, { verification_status: status, operator: '当前用户' });
      if (status === 'verified') {
        message.success('证照核验通过，该批次可进入宰前检疫环节');
      } else {
        message.error('证照核验不通过，该批次已标记为不合格并阻断后续流程');
      }
      fetchData();
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      const values = await deleteForm.validateFields();
      await deleteEntry(deleting.id, values);
      message.success('作废成功，该批次已标记为作废并退出追溯链');
      setDeleteModalOpen(false);
      setDeleting(null);
      setImpact(null);
      fetchData();
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const expandedRowRender = (record) => (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      {record.status === 'disqualified' && record.blocking_explanation && (
        <Alert
          type="error"
          showIcon
          icon={<StopOutlined />}
          message="业务阻断说明"
          description={record.blocking_explanation}
        />
      )}
      {record.verification_status === 'failed' && (
        <Alert
          type="error"
          showIcon
          message="证照核验不通过"
          description="检疫证明信息与实际不符或证明无效，已阻断进入宰前检疫环节"
        />
      )}
      {record.isolation_status && record.isolation_status !== 'none' && (
        <Alert
          type="warning"
          showIcon
          message={`隔离状态：${ISOLATION_MAP[record.isolation_status]?.text || record.isolation_status}`}
          description={record.isolation_details || '暂无隔离处置明细'}
        />
      )}
      {record.is_deleted && record.delete_reason && (
        <Alert
          type="warning"
          showIcon
          message="该记录已作废"
          description={`作废原因：${record.delete_reason}，复核人：${record.delete_reviewer}，作废时间：${record.delete_time ? dayjs(record.delete_time).format('YYYY-MM-DD HH:mm') : '-'}`}
        />
      )}
      {record.audit_log && record.audit_log.length > 0 && (
        <Card size="small" title="审计记录" type="inner">
          <Timeline
            size="small"
            items={record.audit_log.map((log, idx) => ({
              color: log.type === 'block' ? 'red' : log.type === 'disposal' ? 'orange' : log.type === 'void' ? 'red' : log.type === 'verify' ? 'green' : 'blue',
              children: (
                <div>
                  <Space>
                    <span style={{ color: '#666' }}>{dayjs(log.time).format('YYYY-MM-DD HH:mm')}</span>
                    <Tag color={log.type === 'block' ? 'red' : log.type === 'disposal' ? 'orange' : log.type === 'verify' ? 'green' : 'blue'}>{log.action}</Tag>
                    <span style={{ color: '#999' }}>操作人：{log.operator}</span>
                  </Space>
                  <div style={{ marginTop: 4, color: '#333' }}>{log.detail}</div>
                </div>
              ),
            }))}
          />
        </Card>
      )}
      <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)}>
        查看完整追溯链（检疫/屠宰/出证/流向/召回）
      </Button>
    </Space>
  );

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '养殖场', dataIndex: 'farm_name', ellipsis: true },
    { title: '车牌', dataIndex: 'vehicle_plate', width: 100 },
    { title: '种类', dataIndex: 'animal_type', width: 60 },
    { title: '数量', dataIndex: 'quantity', width: 70 },
    { title: '耳标/批次', dataIndex: 'ear_tags', ellipsis: true, width: 140 },
    { title: '检疫证号', dataIndex: 'quarantine_cert_no', ellipsis: true, width: 120 },
    {
      title: '核验',
      dataIndex: 'verification_status',
      width: 90,
      render: (s) => {
        const info = VERIFICATION_MAP[s] || { text: s, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '隔离',
      dataIndex: 'isolation_status',
      width: 80,
      render: (s) => {
        const info = ISOLATION_MAP[s] || { text: s, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    { title: '到场时间', dataIndex: 'arrival_time', width: 160, render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (s, record) => {
        const info = STATUS_MAP[s] || { text: s, color: 'default' };
        return (
          <Space>
            <Tag color={info.color}>{info.text}</Tag>
            {record.blocking_explanation && s === 'disqualified' && (
              <Badge status="error" title="已阻断" />
            )}
          </Space>
        );
      },
    },
    { title: '操作人', dataIndex: 'operator', width: 90 },
    {
      title: '操作',
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)}>追溯</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          {record.verification_status === 'pending' && (
            <Popconfirm
              title="证照核验"
              description="请确认检疫证明核验结论"
              onConfirm={() => handleVerify(record.id, 'verified')}
              onCancel={() => handleVerify(record.id, 'failed')}
              okText="核验通过"
              cancelText="核验不通过"
              okButtonProps={{ danger: false }}
            >
              <Button type="link" size="small" icon={<CheckCircleOutlined />}>核验</Button>
            </Popconfirm>
          )}
          {record.status === 'disqualified' && (
            <Tag color="red" style={{ margin: 0 }}>已阻断</Tag>
          )}
          {record.status !== 'disqualified' && (
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => openDelete(record)}>作废</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          placeholder="状态筛选"
          allowClear
          style={{ width: 130 }}
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: 'pending', label: '待检' },
            { value: 'inspecting', label: '检疫中' },
            { value: 'qualified', label: '合格' },
            { value: 'disqualified', label: '不合格' },
          ]}
        />
        <Select
          placeholder="动物种类"
          allowClear
          style={{ width: 120 }}
          value={filterAnimalType}
          onChange={setFilterAnimalType}
          options={ANIMAL_TYPES.map((t) => ({ value: t, label: t }))}
        />
        <DatePicker.RangePicker value={filterDateRange} onChange={setFilterDateRange} />
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增入场</Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: 1500 }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        expandable={{ expandedRowRender }}
      />

      <Modal
        title={editing ? '编辑入场记录' : '新增入场记录'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={720}
        destroyOnHidden
        okText="确认提交"
      >
        <Form form={form} layout="vertical">
          <Alert
            type="info"
            showIcon
            icon={<FileTextOutlined />}
            message="入场登记信息"
            description="请完整填写入场登记信息，包括检疫证明附件、到场核验状态和隔离处置信息，确保可追溯"
            style={{ marginBottom: 16 }}
          />

          <Card size="small" title="基础信息" type="inner" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item name="farm_name" label="养殖场名称" rules={[{ required: true, message: '请输入养殖场名称' }]}>
                <Input placeholder="如：绿源生态养殖场" />
              </Form.Item>
              <Form.Item name="farm_address" label="养殖场地址">
                <Input placeholder="详细地址" />
              </Form.Item>
              <Form.Item name="vehicle_plate" label="运输车牌号" rules={[{ required: true, message: '请输入车牌号' }]}>
                <Input placeholder="如：鲁Q88231" />
              </Form.Item>
              <Form.Item name="animal_type" label="动物种类" rules={[{ required: true, message: '请选择种类' }]}>
                <Select options={ANIMAL_TYPES.map((t) => ({ value: t, label: t }))} />
              </Form.Item>
              <Form.Item name="quantity" label="数量(头/只)" rules={[{ required: true, message: '请输入数量' }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="arrival_time" label="到场时间" rules={[{ required: true, message: '请选择到场时间' }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item name="ear_tags" label="耳标/批次号">
                <Input.TextArea rows={2} placeholder="多个耳标用逗号分隔" />
              </Form.Item>
              <Form.Item name="quarantine_cert_no" label="检疫证号">
                <Input placeholder="原产地检疫证明编号" />
              </Form.Item>
            </div>
          </Card>

          <Card size="small" title="检疫证明与到场核验" type="inner" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item name="cert_attachment" label="检疫证明附件">
                <Input.TextArea rows={2} placeholder="附件编号/上传路径/拍照记录说明" />
              </Form.Item>
              <Form.Item name="verification_status" label="到场核验状态" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'pending', label: '待核验' },
                    { value: 'verified', label: '核验通过' },
                    { value: 'failed', label: '核验不通过' },
                  ]}
                />
              </Form.Item>
            </div>
            {verificationStatus === 'failed' && (
              <Alert
                type="warning"
                showIcon
                message="到场核验不通过将自动标记为不合格，阻断后续流程"
                style={{ marginBottom: 12 }}
              />
            )}
            <Form.Item name="operator" label="登记操作人" rules={[{ required: true, message: '请输入操作人' }]}>
              <Input placeholder="登记人员姓名" />
            </Form.Item>
          </Card>

          <Card size="small" title="异常批次隔离处置" type="inner" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item name="isolation_status" label="隔离状态" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'none', label: '无异常' },
                    { value: 'pending', label: '待隔离' },
                    { value: 'in_progress', label: '隔离中' },
                    { value: 'completed', label: '已隔离处置' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="status" label="入场状态" hidden={!!editing}>
                <Select
                  options={[
                    { value: 'pending', label: '待检' },
                    { value: 'inspecting', label: '检疫中' },
                    { value: 'qualified', label: '合格' },
                    { value: 'disqualified', label: '不合格' },
                  ]}
                />
              </Form.Item>
            </div>
            {isolationStatus && isolationStatus !== 'none' && (
              <Form.Item name="isolation_details" label="隔离处置明细" rules={[{ required: true, message: '隔离处置必须填写明细' }]}>
                <Input.TextArea
                  rows={3}
                  placeholder="请详细描述：隔离地点、隔离时间、观察情况、处置措施、监督人员、拍照记录说明等"
                />
              </Form.Item>
            )}
          </Card>

          {editing && editing.blocking_explanation && (
            <Alert
              type="error"
              showIcon
              icon={<StopOutlined />}
              message="该批次已被阻断"
              description={editing.blocking_explanation}
              style={{ marginBottom: 16 }}
            />
          )}

          {editing && editing.delete_reason && (
            <Alert
              type="warning"
              showIcon
              message="该记录已作废"
              description={`作废原因：${editing.delete_reason}，复核人：${editing.delete_reviewer}`}
              style={{ marginBottom: 16 }}
            />
          )}
        </Form>
      </Modal>

      <Modal
        title={<Space><ExclamationCircleOutlined style={{ color: '#faad14' }} />作废入场记录</Space>}
        open={deleteModalOpen}
        onOk={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
        width={640}
        okText="确认作废"
        okButtonProps={{ danger: true }}
        destroyOnHidden
      >
        {deleting && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Alert
              type="warning"
              showIcon
              message="该操作将标记记录为作废并退出追溯链路，不可撤销"
              description="作废后，该批次将无法继续进行宰前检疫、屠宰、出证等后续操作"
            />

            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="入场编号">#{deleting.id}</Descriptions.Item>
              <Descriptions.Item label="养殖场">{deleting.farm_name}</Descriptions.Item>
              <Descriptions.Item label="动物种类">{deleting.animal_type} {deleting.quantity} 头</Descriptions.Item>
              <Descriptions.Item label="检疫证号">{deleting.quarantine_cert_no || '-'}</Descriptions.Item>
            </Descriptions>

            {loadingImpact && <div>正在检查追溯链影响...</div>}
            {!loadingImpact && impact && impact.total_impacted > 0 && (
              <Alert
                type="error"
                showIcon
                message={`该批次已关联 ${impact.total_impacted} 条追溯记录`}
                description={
                  <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
                    {impact.details.inspections > 0 && <li>宰前检疫记录：{impact.details.inspections} 条</li>}
                    {impact.details.batches > 0 && <li>屠宰批次：{impact.details.batches} 条</li>}
                    {impact.details.certs > 0 && <li>检疫证书：{impact.details.certs} 张</li>}
                    {impact.details.flows > 0 && <li>产品流向记录：{impact.details.flows} 条</li>}
                    {impact.details.recalls > 0 && <li>召回记录：{impact.details.recalls} 条</li>}
                  </ul>
                }
              />
            )}
            {!loadingImpact && impact && impact.total_impacted === 0 && (
              <Alert type="info" showIcon message="该批次尚未关联后续记录，作废无追溯影响" />
            )}

            <Form form={deleteForm} layout="vertical">
              <Form.Item name="delete_reason" label="作废原因" rules={[{ required: true, message: '请填写作废原因' }]}>
                <Input.TextArea rows={3} placeholder="请详细说明作废原因，以便追溯审计" />
              </Form.Item>
              <Form.Item name="delete_reviewer" label="复核人" rules={[{ required: true, message: '请输入复核人' }]}>
                <Input placeholder="授权复核人员姓名" />
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>

      <Drawer
        title={<Space><SafetyOutlined />入场批次完整追溯链</Space>}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        width={800}
        destroyOnHidden
      >
        {loadingDetail && <div>加载中...</div>}
        {!loadingDetail && entryDetail && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card size="small" title="入场基本信息">
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="入场编号">#{entryDetail.entry.id}</Descriptions.Item>
                <Descriptions.Item label="养殖场">{entryDetail.entry.farm_name}</Descriptions.Item>
                <Descriptions.Item label="地址">{entryDetail.entry.farm_address}</Descriptions.Item>
                <Descriptions.Item label="动物种类">{entryDetail.entry.animal_type} {entryDetail.entry.quantity} 头</Descriptions.Item>
                <Descriptions.Item label="检疫证号">{entryDetail.entry.quarantine_cert_no || '-'}</Descriptions.Item>
                <Descriptions.Item label="到场时间">{entryDetail.entry.arrival_time ? dayjs(entryDetail.entry.arrival_time).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
                <Descriptions.Item label="核验状态">{VERIFICATION_MAP[entryDetail.entry.verification_status]?.text || entryDetail.entry.verification_status}</Descriptions.Item>
                <Descriptions.Item label="当前状态">
                  <Tag color={STATUS_MAP[entryDetail.entry.status]?.color}>{STATUS_MAP[entryDetail.entry.status]?.text}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {entryDetail.entry.blocking_explanation && (
              <Alert type="error" showIcon message="阻断说明" description={entryDetail.entry.blocking_explanation} />
            )}

            {entryDetail.entry.audit_log && entryDetail.entry.audit_log.length > 0 && (
              <Card size="small" title="审计记录">
                <Timeline size="small">
                  {entryDetail.entry.audit_log.map((log, idx) => (
                    <Timeline.Item key={idx} color={log.action.includes('不合格') ? 'red' : 'blue'}>
                      <Space>
                        <span style={{ color: '#666' }}>{dayjs(log.time).format('YYYY-MM-DD HH:mm')}</span>
                        <Tag>{log.action}</Tag>
                        <span>操作人：{log.operator}</span>
                      </Space>
                      <div style={{ marginTop: 4 }}>{log.detail}</div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Card>
            )}

            <Divider orientation="left">检疫记录 ({entryDetail.inspections.length})</Divider>
            {entryDetail.inspections.length === 0 ? (
              <Alert type="info" message="暂无检疫记录" />
            ) : (
              entryDetail.inspections.map((insp) => (
                <Card key={insp.id} size="small" title={`检疫记录 #${insp.id}`}>
                  <Descriptions column={3} size="small">
                    <Descriptions.Item label="体温">{insp.body_temp}℃</Descriptions.Item>
                    <Descriptions.Item label="外观">{insp.appearance === 'normal' ? '正常' : '异常'}</Descriptions.Item>
                    <Descriptions.Item label="证照">{insp.doc_check === 'pass' ? '通过' : '不通过'}</Descriptions.Item>
                    <Descriptions.Item label="处置">{insp.disposal_result}</Descriptions.Item>
                    <Descriptions.Item label="隔离">{insp.isolation ? '是' : '否'}</Descriptions.Item>
                    <Descriptions.Item label="检疫员">{insp.inspector}</Descriptions.Item>
                    <Descriptions.Item label="结果" span={3}>
                      <Tag color={insp.result === 'qualified' ? 'green' : 'red'}>{insp.result === 'qualified' ? '合格' : '不合格'}</Tag>
                      {insp.judge_basis && <span style={{ marginLeft: 8, color: '#666' }}>判定依据：{insp.judge_basis}</span>}
                    </Descriptions.Item>
                    {insp.abnormal_desc && (
                      <Descriptions.Item label="异常描述" span={3}>{insp.abnormal_desc}</Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>
              ))
            )}

            <Divider orientation="left">屠宰批次 ({entryDetail.batches.length})</Divider>
            {entryDetail.batches.length === 0 ? (
              <Alert type="info" message="暂无屠宰批次" />
            ) : (
              entryDetail.batches.map((batch) => (
                <Card key={batch.id} size="small" title={`屠宰批次 ${batch.batch_no}`}>
                  <Descriptions column={3} size="small">
                    <Descriptions.Item label="屠宰时间">{batch.slaughter_time ? dayjs(batch.slaughter_time).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
                    <Descriptions.Item label="检验结果">
                      <Tag color={batch.inspect_result === 'qualified' ? 'green' : 'red'}>{batch.inspect_result === 'qualified' ? '合格' : '不合格'}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="出肉量">{batch.meat_yield} kg</Descriptions.Item>
                    <Descriptions.Item label="分割部位">{Array.isArray(batch.segmentation_details) ? batch.segmentation_details.join('、') : batch.segmentation_details || '-'}</Descriptions.Item>
                    <Descriptions.Item label="责任人">{batch.responsible_person}</Descriptions.Item>
                    <Descriptions.Item label="复核">{batch.review_status === 'reviewed' ? `已复核 (${batch.reviewer})` : '待复核'}</Descriptions.Item>
                    {batch.blocking_reason && (
                      <Descriptions.Item label="阻断说明" span={3}>{batch.blocking_reason}</Descriptions.Item>
                    )}
                    {batch.harmless_treatment_details && (
                      <Descriptions.Item label="无害化处理" span={3}>{batch.harmless_treatment}：{batch.harmless_treatment_details}</Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>
              ))
            )}

            <Divider orientation="left">检疫证书 ({entryDetail.certificates.length})</Divider>
            {entryDetail.certificates.length === 0 ? (
              <Alert type="info" message="暂无检疫证书" />
            ) : (
              entryDetail.certificates.map((cert) => (
                <Card key={cert.id} size="small" title={`证书 ${cert.cert_no}`}>
                  <Descriptions column={3} size="small">
                    <Descriptions.Item label="批次号">{cert.batch_no}</Descriptions.Item>
                    <Descriptions.Item label="签发人">{cert.issuer}</Descriptions.Item>
                    <Descriptions.Item label="状态">
                      <Tag color={cert.status === 'valid' ? 'green' : 'red'}>{cert.status === 'valid' ? '有效' : '已召回'}</Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              ))
            )}

            <Divider orientation="left">产品流向 ({entryDetail.flows.length})</Divider>
            {entryDetail.flows.length === 0 ? (
              <Alert type="info" message="暂无产品流向记录" />
            ) : (
              <Table
                rowKey="id"
                size="small"
                columns={[
                  { title: '采购方', dataIndex: 'buyer_name' },
                  { title: '目的地', dataIndex: 'destination' },
                  { title: '产品类型', dataIndex: 'product_type', width: 100 },
                  { title: '重量(kg)', dataIndex: 'weight', width: 100 },
                  { title: '流向时间', dataIndex: 'flow_time', width: 160, render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
                ]}
                dataSource={entryDetail.flows}
                pagination={false}
              />
            )}

            <Divider orientation="left">召回记录 ({entryDetail.recalls.length})</Divider>
            {entryDetail.recalls.length === 0 ? (
              <Alert type="info" message="暂无召回记录" />
            ) : (
              entryDetail.recalls.map((recall) => (
                <Card key={recall.id} size="small" title={`召回记录 #${recall.id}`}>
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="证书编号">{recall.cert_no}</Descriptions.Item>
                    <Descriptions.Item label="发起人">{recall.initiator}</Descriptions.Item>
                    <Descriptions.Item label="召回原因" span={2}>{recall.reason}</Descriptions.Item>
                    <Descriptions.Item label="召回范围" span={2}>{recall.scope}</Descriptions.Item>
                    <Descriptions.Item label="完成状态">{recall.completion_status === 'completed' ? '已完成' : '进行中'}</Descriptions.Item>
                    <Descriptions.Item label="召回时间">{recall.recall_time ? dayjs(recall.recall_time).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
                  </Descriptions>
                </Card>
              ))
            )}
          </Space>
        )}
      </Drawer>
    </div>
  );
}
