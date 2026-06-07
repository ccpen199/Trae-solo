import { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Modal, Form, Select, InputNumber, DatePicker, Input, message } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { feeApi } from '../../services/api';

const categoryMap = {
  food_delivery: { label: '餐饮外卖', color: 'orange' },
  ride_hailing: { label: '出行打车', color: 'blue' },
  gov_payment: { label: '政务缴费', color: 'green' },
  retail: { label: '商超零售', color: 'purple' },
};

const statusMap = {
  active: { label: '生效中', color: 'green' },
  inactive: { label: '已停用', color: 'red' },
};

export default function FeeConfig() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await feeApi.getList({ page, pageSize });
      const d = res.data.data || res.data;
      setData(d.list || d.records || []);
      setPagination({ current: page, pageSize, total: d.total || 0 });
    } catch {
      message.error('获取费率配置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTableChange = (pag) => {
    fetchData(pag.current, pag.pageSize);
  };

  const openAdd = () => {
    setEditRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEdit = (record) => {
    setEditRecord(record);
    form.setFieldsValue({
      ...record,
      effectiveDate: record.effectiveDate ? dayjs(record.effectiveDate) : undefined,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      const payload = {
        ...values,
        effectiveDate: values.effectiveDate ? values.effectiveDate.format('YYYY-MM-DD') : undefined,
      };
      if (editRecord) {
        await feeApi.update(editRecord.id, payload);
        message.success('更新成功');
      } else {
        await feeApi.create(payload);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData(pagination.current, pagination.pageSize);
    } catch (err) {
      if (err.response) message.error('操作失败');
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: (v) => {
        const c = categoryMap[v] || { label: v, color: 'default' };
        return <Tag color={c.color}>{c.label}</Tag>;
      },
    },
    { title: '服务商', dataIndex: 'providerName', key: 'providerName' },
    { title: '费率(%)', dataIndex: 'feeRate', key: 'feeRate', render: (v) => `${v}%` },
    { title: '最低手续费', dataIndex: 'minFee', key: 'minFee', render: (v) => (v != null ? `¥${v}` : '-') },
    { title: '最高手续费', dataIndex: 'maxFee', key: 'maxFee', render: (v) => (v != null ? `¥${v}` : '-') },
    { title: '生效日期', dataIndex: 'effectiveDate', key: 'effectiveDate' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v) => {
        const s = statusMap[v] || { label: v, color: 'default' };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          新增费率
        </Button>
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ ...pagination, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        onChange={handleTableChange}
      />
      <Modal
        title={editRecord ? '编辑费率' : '新增费率'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitLoading}
        okText="提交"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="category" label="类别" rules={[{ required: true, message: '请选择类别' }]}>
            <Select>
              {Object.entries(categoryMap).map(([k, v]) => (
                <Select.Option key={k} value={k}>{v.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="providerId" label="服务商ID" rules={[{ required: true, message: '请输入服务商ID' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="feeRate" label="费率(%)" rules={[{ required: true, message: '请输入费率' }]}>
            <InputNumber min={0} max={100} precision={2} style={{ width: '100%' }} addonAfter="%" />
          </Form.Item>
          <Form.Item name="minFee" label="最低手续费">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
          <Form.Item name="maxFee" label="最高手续费">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
          <Form.Item name="effectiveDate" label="生效日期" rules={[{ required: true, message: '请选择生效日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
