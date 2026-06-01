import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Upload, DatePicker, message, Table, Modal, Tag, Space, Descriptions, Divider } from 'antd';
import { PlusOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { api } from '../api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const statusMap = {
  pending: { color: 'default', text: '待派单' },
  dispatched: { color: 'processing', text: '已派单' },
  accepted: { color: 'blue', text: '已接单' },
  departed: { color: 'cyan', text: '已出发' },
  arrived: { color: 'green', text: '已到场' },
  repairing: { color: 'orange', text: '维修中' },
  quoting: { color: 'gold', text: '报价中' },
  confirmed: { color: 'lime', text: '已确认' },
  completed: { color: 'success', text: '已完成' },
  cancelled: { color: 'error', text: '已取消' },
  exception: { color: 'red', text: '异常' },
};

const priorityMap = {
  low: { color: 'default', text: '低' },
  normal: { color: 'blue', text: '普通' },
  high: { color: 'orange', text: '高' },
  urgent: { color: 'red', text: '紧急' },
};

export default function UserSubmit() {
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form] = Form.useForm();
  const [addrForm] = Form.useForm();
  const [addrModal, setAddrModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const loadAddresses = async () => {
    try {
      const data = await api.addresses.list();
      setAddresses(data);
    } catch (err) { message.error(err.message); }
  };

  const loadOrders = async () => {
    try {
      const data = await api.workorders.list({ user_id: user.id });
      setOrders(data);
    } catch (err) { message.error(err.message); }
  };

  useEffect(() => { loadAddresses(); loadOrders(); }, []);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const photoPaths = (values.photos || []).map(f => f.response?.path).filter(Boolean);
      let warrantyProof = null;
      if (values.warranty_proof && values.warranty_proof.file) {
        warrantyProof = values.warranty_proof.file.response?.path || null;
      }
      await api.workorders.create({
        ...values,
        photos: photoPaths,
        warranty_proof: warrantyProof,
        expected_time: values.expected_time ? values.expected_time.toISOString() : null,
      });
      message.success('报修提交成功');
      form.resetFields();
      loadOrders();
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (values) => {
    try {
      await api.addresses.create(values);
      message.success('地址添加成功');
      setAddrModal(false);
      addrForm.resetFields();
      loadAddresses();
    } catch (err) { message.error(err.message); }
  };

  const handleUpload = async ({ file, onSuccess, onError }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.upload.file(formData);
      onSuccess(res, file);
    } catch (err) {
      onError(err);
    }
  };

  const showDetail = async (id) => {
    try {
      const data = await api.workorders.get(id);
      setCurrentOrder(data);
      setDetailModal(true);
    } catch (err) { message.error(err.message); }
  };

  const columns = [
    { title: '工单号', dataIndex: 'order_no', key: 'order_no', render: (t, r) => <a onClick={() => showDetail(r.id)}>{t}</a> },
    { title: '故障描述', dataIndex: 'fault_description', key: 'fault_description', ellipsis: true },
    { title: '优先级', dataIndex: 'priority', key: 'priority', render: v => <Tag color={priorityMap[v]?.color}>{priorityMap[v]?.text}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', render: v => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text}</Tag> },
    { title: '服务范围', dataIndex: 'in_service_area', key: 'in_service_area', render: v => v ? <Tag color="green">范围内</Tag> : <Tag color="red">范围外</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
  ];

  return (
    <div>
      <Card title="提交报修" style={{ marginBottom: 24 }}>
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item label="服务地址" required>
            <Space>
              <Form.Item name="address_id" noStyle rules={[{ required: true, message: '请选择或添加地址' }]}>
                <Select placeholder="选择地址" style={{ width: 400 }}>
                  {addresses.map(a => (
                    <Option key={a.id} value={a.id}>
                      <EnvironmentOutlined /> {a.province}{a.city}{a.district}{a.street || ''}{a.detail ? ' ' + a.detail : ''} ({a.contact_name} {a.contact_phone})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Button icon={<PlusOutlined />} onClick={() => setAddrModal(true)}>添加地址</Button>
            </Space>
          </Form.Item>
          <Form.Item name="fault_description" label="故障描述" rules={[{ required: true, message: '请描述故障' }]}>
            <TextArea rows={3} placeholder="请详细描述故障情况" />
          </Form.Item>
          <Form.Item name="photos" label="故障照片" valuePropName="fileList" getValueFromEvent={e => Array.isArray(e) ? e : e?.fileList}>
            <Upload customRequest={handleUpload} listType="picture-card" multiple accept="image/*">
              <div><PlusOutlined /> 上传</div>
            </Upload>
          </Form.Item>
          <Form.Item name="expected_time" label="期望上门时间">
            <DatePicker showTime format="YYYY-MM-DD HH:mm" placeholder="选择时间" />
          </Form.Item>
          <Form.Item name="warranty_type" label="保修凭证" initialValue="none">
            <Select>
              <Option value="none">无保修</Option>
              <Option value="in_warranty">保修期内</Option>
              <Option value="out_warranty">保修期外</Option>
            </Select>
          </Form.Item>
          <Form.Item name="warranty_proof" label="保修凭证附件" valuePropName="fileList" getValueFromEvent={e => Array.isArray(e) ? e : e?.fileList}>
            <Upload customRequest={handleUpload} maxCount={1} accept="image/*,.pdf">
              <Button icon={<PlusOutlined />}>上传凭证</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="service_type" label="服务类型">
            <Select placeholder="选择服务类型" allowClear>
              <Option value="空调维修">空调维修</Option>
              <Option value="冰箱维修">冰箱维修</Option>
              <Option value="洗衣机维修">洗衣机维修</Option>
              <Option value="热水器维修">热水器维修</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue="normal">
            <Select>
              <Option value="low">低</Option>
              <Option value="normal">普通</Option>
              <Option value="high">高</Option>
              <Option value="urgent">紧急</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>提交报修</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="我的工单">
        <Table columns={columns} dataSource={orders} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="添加地址" open={addrModal} onCancel={() => setAddrModal(false)} onOk={() => addrForm.submit()}>
        <Form form={addrForm} onFinish={handleAddAddress} layout="vertical">
          <Form.Item name="province" label="省份" rules={[{ required: true }]}><Input placeholder="如：北京市" /></Form.Item>
          <Form.Item name="city" label="城市" rules={[{ required: true }]}><Input placeholder="如：北京市" /></Form.Item>
          <Form.Item name="district" label="区县" rules={[{ required: true }]}><Input placeholder="如：朝阳区" /></Form.Item>
          <Form.Item name="street" label="街道"><Input placeholder="如：建国路" /></Form.Item>
          <Form.Item name="detail" label="详细地址"><Input placeholder="如：88号SOHO现代城A座1201" /></Form.Item>
          <Form.Item name="contact_name" label="联系人" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="contact_phone" label="联系电话" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="is_default" label="设为默认" valuePropName="checked"><Select options={[{ value: 1, label: '是' }, { value: 0, label: '否' }]} placeholder="选择" /></Form.Item>
        </Form>
      </Modal>

      <Modal title="工单详情" open={detailModal} onCancel={() => setDetailModal(false)} width={700} footer={null}>
        {currentOrder && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="工单号">{currentOrder.order_no}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={statusMap[currentOrder.status]?.color}>{statusMap[currentOrder.status]?.text}</Tag></Descriptions.Item>
              <Descriptions.Item label="优先级"><Tag color={priorityMap[currentOrder.priority]?.color}>{priorityMap[currentOrder.priority]?.text}</Tag></Descriptions.Item>
              <Descriptions.Item label="服务范围">{currentOrder.in_service_area ? '范围内' : '范围外'}</Descriptions.Item>
              <Descriptions.Item label="服务类型">{currentOrder.service_type || '-'}</Descriptions.Item>
              <Descriptions.Item label="保修">{currentOrder.warranty_type === 'in_warranty' ? '保修期内' : currentOrder.warranty_type === 'out_warranty' ? '保修期外' : '无保修'}</Descriptions.Item>
              <Descriptions.Item label="地址" span={2}>{currentOrder.province}{currentOrder.city}{currentOrder.district}{currentOrder.street || ''}{currentOrder.detail ? ' ' + currentOrder.detail : ''}</Descriptions.Item>
              <Descriptions.Item label="故障描述" span={2}>{currentOrder.fault_description}</Descriptions.Item>
              <Descriptions.Item label="期望时间" span={2}>{currentOrder.expected_time ? dayjs(currentOrder.expected_time).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
              <Descriptions.Item label="SLA截止">{currentOrder.sla_deadline ? dayjs(currentOrder.sla_deadline).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(currentOrder.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            </Descriptions>
            {currentOrder.dispatch && (
              <>
                <Divider>派工信息</Divider>
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="工程师">{currentOrder.dispatch.engineer_name}</Descriptions.Item>
                  <Descriptions.Item label="工程师电话">{currentOrder.dispatch.engineer_phone}</Descriptions.Item>
                </Descriptions>
              </>
            )}
            {currentOrder.quote && (
              <>
                <Divider>费用报价</Divider>
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="人工费">¥{currentOrder.quote.labor_cost}</Descriptions.Item>
                  <Descriptions.Item label="配件费">¥{currentOrder.quote.parts_cost}</Descriptions.Item>
                  <Descriptions.Item label="上门费">¥{currentOrder.quote.travel_cost}</Descriptions.Item>
                  <Descriptions.Item label="其他费用">¥{currentOrder.quote.other_cost}</Descriptions.Item>
                  <Descriptions.Item label="总计" span={2}><strong>¥{currentOrder.quote.total_cost}</strong></Descriptions.Item>
                </Descriptions>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
