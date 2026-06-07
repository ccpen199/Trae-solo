import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Tag, Descriptions, message, Popconfirm, Badge } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { audiencesApi } from '../api';

const tagOptions = [
  'Action', 'Sci-Fi', 'Romance', 'Comedy', 'Animation', 'Thriller', 'Drama', 'Historical',
];

const memberLevelOptions = [
  { value: 'regular', label: 'Regular' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'platinum', label: 'Platinum' },
];

const memberLevelTagProps = {
  regular: { color: 'default' },
  silver: { color: 'grey' },
  gold: { color: 'gold' },
  platinum: { color: 'cyan' },
};

function Audiences() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [current, setCurrent] = useState(null);
  const [filterLevel, setFilterLevel] = useState(undefined);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterLevel) params.member_level = filterLevel;
      const res = await audiencesApi.list(params);
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterLevel]);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = async (record) => {
    try {
      const detail = await audiencesApi.get(record.id);
      setEditing(detail);
      form.setFieldsValue({
        ...detail,
        preference_tags: detail.preference_tags || [],
      });
      setModalOpen(true);
    } catch (err) {
      message.error(err.message);
    }
  };

  const openDetail = async (record) => {
    try {
      const detail = await audiencesApi.get(record.id);
      setCurrent(detail);
      setDetailOpen(true);
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await audiencesApi.update(editing.id, values);
        message.success('Updated');
      } else {
        await audiencesApi.create(values);
        message.success('Created');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await audiencesApi.delete(id);
      message.success('Deleted');
      fetchData();
    } catch (err) {
      message.error(err.message);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Preference Tags',
      dataIndex: 'preference_tags',
      key: 'preference_tags',
      render: (tags) => (tags || []).map((t) => <Tag key={t}>{t}</Tag>),
    },
    {
      title: 'Member Level',
      dataIndex: 'member_level',
      key: 'member_level',
      render: (level) => <Tag {...(memberLevelTagProps[level] || {})}>{level || '-'}</Tag>,
    },
    {
      title: 'Points Balance',
      dataIndex: 'points_balance',
      key: 'points_balance',
      render: (v) => v != null ? v : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => openDetail(record)} />
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="Delete this audience?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="Filter by member level"
          allowClear
          style={{ width: 180 }}
          value={filterLevel}
          onChange={setFilterLevel}
          options={memberLevelOptions}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Add Audience</Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editing ? 'Edit Audience' : 'Add Audience'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Required' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true, message: 'Required' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Required' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="preference_tags" label="Preference Tags">
            <Select mode="multiple" options={tagOptions.map((t) => ({ value: t, label: t }))} />
          </Form.Item>
          <Form.Item name="member_level" label="Member Level" rules={[{ required: true, message: 'Required' }]}>
            <Select options={memberLevelOptions} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Audience Detail"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={640}
      >
        {current && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Name">{current.name}</Descriptions.Item>
            <Descriptions.Item label="Phone">{current.phone}</Descriptions.Item>
            <Descriptions.Item label="Email">{current.email}</Descriptions.Item>
            <Descriptions.Item label="Preference Tags">
              {(current.preference_tags || []).map((t) => <Tag key={t}>{t}</Tag>)}
            </Descriptions.Item>
            <Descriptions.Item label="Member Level">
              <Tag {...(memberLevelTagProps[current.member_level] || {})}>{current.member_level || '-'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Points Balance">{current.points_balance != null ? current.points_balance : '-'}</Descriptions.Item>
            <Descriptions.Item label="Wallet Cards">
              {(current.wallet_cards || []).length > 0
                ? (current.wallet_cards).map((card) => (
                    <Badge key={card.id || card.card_number} status="processing" text={card.card_number || card.id} style={{ display: 'block', marginBottom: 4 }} />
                  ))
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Total Orders">{current.total_orders != null ? current.total_orders : '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
}

export default Audiences;
