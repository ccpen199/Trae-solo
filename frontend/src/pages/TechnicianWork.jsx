import React, { useState, useEffect } from 'react';
import { Card, Steps, Button, Table, Tag, Modal, Form, Input, InputNumber, Upload, Space, Descriptions, Divider, message } from 'antd';
import { CheckCircleOutlined, CarOutlined, EnvironmentOutlined, ToolOutlined, DollarOutlined, SafetyOutlined, PlusOutlined } from '@ant-design/icons';
import { api } from '../api';
import dayjs from 'dayjs';

const { TextArea } = Input;

const statusMap = {
  dispatched: { color: 'processing', text: '已派单' },
  accepted: { color: 'blue', text: '已接单' },
  departed: { color: 'cyan', text: '已出发' },
  arrived: { color: 'green', text: '已到场' },
  repairing: { color: 'orange', text: '维修中' },
  quoting: { color: 'gold', text: '报价中' },
  confirmed: { color: 'lime', text: '已确认' },
  completed: { color: 'success', text: '已完成' },
  exception: { color: 'red', text: '异常' },
};

const stepMap = {
  accepted: 0,
  departed: 1,
  arrived: 2,
  repairing: 3,
  quoting: 4,
  confirmed: 5,
  completed: 5,
};

export default function TechnicianWork() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [repairModal, setRepairModal] = useState(false);
  const [partsModal, setPartsModal] = useState(false);
  const [quoteModal, setQuoteModal] = useState(false);
  const [signModal, setSignModal] = useState(false);
  const [exceptionModal, setExceptionModal] = useState(false);
  const [repairForm] = Form.useForm();
  const [partsForm] = Form.useForm();
  const [quoteForm] = Form.useForm();
  const [exceptionForm] = Form.useForm();

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await api.service.myOrders();
      setOrders(data);
      if (data.length > 0 && !selected) setSelected(data[0]);
    } catch (err) { message.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadOrders(); }, []);

  const handleAction = async (action, orderId) => {
    try {
      await action(orderId);
      message.success('操作成功');
      loadOrders();
    } catch (err) { message.error(err.message); }
  };

  const handleUpload = async ({ file, onSuccess, onError }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.upload.file(formData);
      onSuccess(res, file);
    } catch (err) { onError(err); }
  };

  const handleRepair = async () => {
    try {
      const values = await repairForm.validateFields();
      const photoPaths = (values.repair_photos || []).map(f => f.response?.path).filter(Boolean);
      await api.service.repair(selected.id, { ...values, repair_photos: photoPaths });
      message.success('维修记录已提交');
      setRepairModal(false);
      repairForm.resetFields();
      loadOrders();
    } catch (err) { message.error(err.message); }
  };

  const handleAddPart = async () => {
    try {
      const values = await partsForm.validateFields();
      await api.service.addPart(selected.id, values);
      message.success('配件已添加');
      partsForm.resetFields();
      loadOrders();
    } catch (err) { message.error(err.message); }
  };

  const handleQuote = async () => {
    try {
      const values = await quoteForm.validateFields();
      await api.service.quote(selected.id, values);
      message.success('报价已提交');
      setQuoteModal(false);
      quoteForm.resetFields();
      loadOrders();
    } catch (err) { message.error(err.message); }
  };

  const handleSign = async () => {
    try {
      await api.service.sign(selected.id, { signature: `用户确认_${dayjs().format('YYYYMMDDHHmmss')}` });
      message.success('用户已签字确认');
      setSignModal(false);
      loadOrders();
    } catch (err) { message.error(err.message); }
  };

  const handleException = async () => {
    try {
      const values = await exceptionForm.validateFields();
      await api.exceptions.create({ order_id: selected.id, ...values });
      message.success('异常已上报');
      setExceptionModal(false);
      exceptionForm.resetFields();
      loadOrders();
    } catch (err) { message.error(err.message); }
  };

  const currentStep = selected ? (stepMap[selected.status] ?? -1) : -1;

  const columns = [
    { title: '工单号', dataIndex: 'order_no', key: 'order_no' },
    { title: '故障描述', dataIndex: 'fault_description', key: 'fault_description', ellipsis: true },
    { title: '地址', key: 'addr', render: (_, r) => `${r.city || ''}${r.district || ''}${r.street || ''}`, ellipsis: true },
    { title: '状态', dataIndex: 'status', key: 'status', render: v => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text}</Tag> },
    { title: '操作', key: 'action', render: (_, r) => <Button size="small" onClick={() => setSelected(r)}>查看</Button> },
  ];

  return (
    <div>
      <Card title="我的工单" extra={<Button onClick={loadOrders}>刷新</Button>} style={{ marginBottom: 16 }}>
        <Table columns={columns} dataSource={orders} rowKey="id" loading={loading} pagination={{ pageSize: 8 }}
          onRow={(r) => ({ onClick: () => setSelected(r), style: { cursor: 'pointer', background: selected?.id === r.id ? '#e6f7ff' : undefined } })}
        />
      </Card>

      {selected && (
        <Card title={`工单 ${selected.order_no}`}>
          <Steps current={currentStep} style={{ marginBottom: 24 }}
            items={[
              { title: '接单', icon: <CheckCircleOutlined /> },
              { title: '出发', icon: <CarOutlined /> },
              { title: '到场', icon: <EnvironmentOutlined /> },
              { title: '维修', icon: <ToolOutlined /> },
              { title: '报价', icon: <DollarOutlined /> },
              { title: '确认', icon: <SafetyOutlined /> },
            ]}
          />

          <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="故障描述" span={2}>{selected.fault_description}</Descriptions.Item>
            <Descriptions.Item label="地址" span={2}>{selected.province}{selected.city}{selected.district}{selected.street || ''}{selected.detail ? ' ' + selected.detail : ''}</Descriptions.Item>
            <Descriptions.Item label="联系人">{selected.contact_name}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{selected.contact_phone}</Descriptions.Item>
            <Descriptions.Item label="服务类型">{selected.service_type || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color={statusMap[selected.status]?.color}>{statusMap[selected.status]?.text}</Tag></Descriptions.Item>
          </Descriptions>

          {selected.serviceRecord && selected.serviceRecord.parts && selected.serviceRecord.parts.length > 0 && (
            <>
              <Divider>已使用配件</Divider>
              <Table columns={[
                { title: '配件名', dataIndex: 'part_name' },
                { title: '编码', dataIndex: 'part_code' },
                { title: '数量', dataIndex: 'quantity' },
                { title: '单价', dataIndex: 'unit_price', render: v => `¥${v}` },
                { title: '小计', dataIndex: 'total_price', render: v => `¥${v}` },
              ]} dataSource={selected.serviceRecord.parts} rowKey="id" pagination={false} size="small" />
            </>
          )}

          <Divider>操作</Divider>
          <Space wrap>
            {selected.status === 'dispatched' && (
              <Button type="primary" onClick={() => handleAction(api.service.accept, selected.id)}>接单</Button>
            )}
            {selected.status === 'accepted' && (
              <Button type="primary" onClick={() => handleAction(api.service.depart, selected.id)}>出发</Button>
            )}
            {selected.status === 'departed' && (
              <Button type="primary" onClick={() => handleAction(api.service.arrive, selected.id)}>到场</Button>
            )}
            {['arrived', 'repairing'].includes(selected.status) && (
              <>
                <Button onClick={() => setRepairModal(true)}>记录维修</Button>
                <Button onClick={() => setPartsModal(true)}>添加配件</Button>
                <Button onClick={() => setQuoteModal(true)}>提交报价</Button>
              </>
            )}
            {selected.status === 'quoting' && (
              <Button type="primary" onClick={() => setSignModal(true)}>用户签字确认</Button>
            )}
            {!['completed', 'cancelled'].includes(selected.status) && (
              <Button danger onClick={() => setExceptionModal(true)}>上报异常</Button>
            )}
          </Space>
        </Card>
      )}

      <Modal title="记录维修" open={repairModal} onCancel={() => setRepairModal(false)} onOk={handleRepair}>
        <Form form={repairForm} layout="vertical">
          <Form.Item name="repair_description" label="维修描述" rules={[{ required: true, message: '请输入维修描述' }]}>
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="repair_photos" label="维修照片" valuePropName="fileList" getValueFromEvent={e => Array.isArray(e) ? e : e?.fileList}>
            <Upload customRequest={handleUpload} listType="picture-card" multiple accept="image/*">
              <div><PlusOutlined /> 上传</div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="添加配件" open={partsModal} onCancel={() => setPartsModal(false)} onOk={handleAddPart}>
        <Form form={partsForm} layout="vertical">
          <Form.Item name="part_name" label="配件名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="part_code" label="配件编码" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="quantity" label="数量" initialValue={1}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="unit_price" label="单价" initialValue={0}><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="提交报价" open={quoteModal} onCancel={() => setQuoteModal(false)} onOk={handleQuote}>
        <Form form={quoteForm} layout="vertical">
          <Form.Item name="labor_cost" label="人工费" initialValue={0}><InputNumber min={0} precision={2} style={{ width: '100%' }} addonAfter="元" /></Form.Item>
          <Form.Item name="parts_cost" label="配件费" initialValue={0}><InputNumber min={0} precision={2} style={{ width: '100%' }} addonAfter="元" /></Form.Item>
          <Form.Item name="travel_cost" label="上门费" initialValue={0}><InputNumber min={0} precision={2} style={{ width: '100%' }} addonAfter="元" /></Form.Item>
          <Form.Item name="other_cost" label="其他费用" initialValue={0}><InputNumber min={0} precision={2} style={{ width: '100%' }} addonAfter="元" /></Form.Item>
          <Form.Item name="cost_description" label="费用说明"><TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="用户签字确认" open={signModal} onCancel={() => setSignModal(false)} onOk={handleSign}>
        <p>确认费用报价并完成签字？此操作将标记工单为已完成。</p>
      </Modal>

      <Modal title="上报异常" open={exceptionModal} onCancel={() => setExceptionModal(false)} onOk={handleException}>
        <Form form={exceptionForm} layout="vertical">
          <Form.Item name="type" label="异常类型" rules={[{ required: true }]}>
            <select style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d9d9d9' }}>
              <option value="no_contact">无法联系用户</option>
              <option value="wrong_address">地址错误</option>
              <option value="out_of_stock">备件缺货</option>
              <option value="user_refuse">用户拒付</option>
              <option value="second_visit">二次上门</option>
              <option value="other">其他</option>
            </select>
          </Form.Item>
          <Form.Item name="description" label="异常描述"><TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
