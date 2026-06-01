import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, InputNumber, message, DatePicker, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ratesAPI, usersAPI } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const Rates = () => {
  const [rates, setRates] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ratesData, usersData] = await Promise.all([
        ratesAPI.getAll(),
        usersAPI.getAll(),
      ]);
      setRates(ratesData || []);
      setUsers(usersData || []);
    } catch (error) {
      message.error('加载数据失败');
    }
    setLoading(false);
  };

  const handleAdd = () => {
    form.resetFields();
    form.setFieldsValue({ effective_date: dayjs() });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      await ratesAPI.create({
        ...values,
        effective_date: values.effective_date.format('YYYY-MM-DD'),
      });
      message.success('创建费率成功');
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const columns = [
    { title: '人员', dataIndex: 'user_name', key: 'user_name', width: 150 },
    { title: '费率(元/小时)', dataIndex: 'rate_amount', key: 'rate_amount', width: 150,
      render: v => <span style={{ fontSize: 16, fontWeight: 'bold', color: '#1890ff' }}>¥{v?.toFixed(2)}</span>
    },
    { title: '生效日期', dataIndex: 'effective_date', key: 'effective_date', width: 150 },
    { title: '状态', dataIndex: 'is_active', key: 'is_active', width: 100,
      render: v => v ? <Tag color="green">当前有效</Tag> : <Tag>历史</Tag>
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">费率管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          设置费率
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={rates}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="设置费率"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="user_id" label="选择人员" rules={[{ required: true }]}>
            <Select>
              {users.map(u => <Option key={u.id} value={u.id}>{u.name} ({u.role})</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="rate_amount" label="费率(元/小时)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} precision={2} />
          </Form.Item>
          <Form.Item name="effective_date" label="生效日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Rates;
