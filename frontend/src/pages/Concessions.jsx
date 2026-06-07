import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Tag, Card, Tabs, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { concessionsApi } from '../api';

const categoryOptions = [
  { value: 'popcorn', label: 'Popcorn' },
  { value: 'drink', label: 'Drink' },
  { value: 'snack', label: 'Snack' },
  { value: 'combo', label: 'Combo' },
];

const categoryTagProps = {
  popcorn: { color: 'gold' },
  drink: { color: 'blue' },
  snack: { color: 'green' },
  combo: { color: 'purple' },
};

const statusOptions = [
  { value: 'available', label: 'Available' },
  { value: 'unavailable', label: 'Unavailable' },
];

const statusTagProps = {
  available: { color: 'green' },
  unavailable: { color: 'red' },
};

function Concessions() {
  const [items, setItems] = useState([]);
  const [combos, setCombos] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [combosLoading, setCombosLoading] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [comboModalOpen, setComboModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [itemForm] = Form.useForm();
  const [comboForm] = Form.useForm();

  const fetchItems = async () => {
    setItemsLoading(true);
    try {
      const res = await concessionsApi.list();
      setItems(Array.isArray(res) ? res : []);
    } catch (err) {
      message.error(err.message);
    } finally {
      setItemsLoading(false);
    }
  };

  const fetchCombos = async () => {
    setCombosLoading(true);
    try {
      const res = await concessionsApi.combos();
      setCombos(Array.isArray(res) ? res : []);
    } catch (err) {
      message.error(err.message);
    } finally {
      setCombosLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchCombos();
  }, []);

  const openAddItem = () => {
    setEditing(null);
    itemForm.resetFields();
    setItemModalOpen(true);
  };

  const openEditItem = (record) => {
    setEditing(record);
    itemForm.setFieldsValue(record);
    setItemModalOpen(true);
  };

  const handleItemOk = async () => {
    try {
      const values = await itemForm.validateFields();
      if (editing) {
        await concessionsApi.update(editing.id, values);
        message.success('Updated');
      } else {
        await concessionsApi.create(values);
        message.success('Created');
      }
      setItemModalOpen(false);
      fetchItems();
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await concessionsApi.delete(id);
      message.success('Deleted');
      fetchItems();
    } catch (err) {
      message.error(err.message);
    }
  };

  const openAddCombo = () => {
    comboForm.resetFields();
    setComboModalOpen(true);
  };

  const handleComboOk = async () => {
    try {
      const values = await comboForm.validateFields();
      await concessionsApi.createCombo(values);
      message.success('Created');
      setComboModalOpen(false);
      fetchCombos();
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const handleDeleteCombo = async (id) => {
    try {
      await concessionsApi.delete(id);
      message.success('Deleted');
      fetchCombos();
    } catch (err) {
      message.error(err.message);
    }
  };

  const itemColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (c) => <Tag {...(categoryTagProps[c] || {})}>{c || '-'}</Tag>,
    },
    {
      title: 'Price(¥)',
      dataIndex: 'price',
      key: 'price',
      render: (v) => v != null ? `¥${v}` : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag {...(statusTagProps[s] || {})}>{s || '-'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditItem(record)} />
          <Popconfirm title="Delete this item?" onConfirm={() => handleDeleteItem(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const comboColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items) =>
        Array.isArray(items) ? items.map((it) => `${it.name || it.concession_id}×${it.quantity}`).join(', ') : '-',
    },
    {
      title: 'Total Price(¥)',
      dataIndex: 'total_price',
      key: 'total_price',
      render: (v) => v != null ? `¥${v}` : '-',
    },
    {
      title: 'Discount(%)',
      dataIndex: 'discount_rate',
      key: 'discount_rate',
      render: (v) => v != null ? `${(v * 100).toFixed(0)}%` : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag {...(statusTagProps[s] || {})}>{s || '-'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Popconfirm title="Delete this combo?" onConfirm={() => handleDeleteCombo(record.id)}>
          <Button type="link" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'items',
      label: '单品管理',
      children: (
        <Card>
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openAddItem}>Add Item</Button>
          </Space>
          <Table rowKey="id" columns={itemColumns} dataSource={items} loading={itemsLoading} pagination={{ pageSize: 10 }} />
        </Card>
      ),
    },
    {
      key: 'combos',
      label: '套餐管理',
      children: (
        <Card>
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openAddCombo}>Add Combo</Button>
          </Space>
          <Table rowKey="id" columns={comboColumns} dataSource={combos} loading={combosLoading} pagination={{ pageSize: 10 }} />
        </Card>
      ),
    },
  ];

  return (
    <>
      <Tabs items={tabItems} />

      <Modal
        title={editing ? 'Edit Item' : 'Add Item'}
        open={itemModalOpen}
        onOk={handleItemOk}
        onCancel={() => setItemModalOpen(false)}
        destroyOnClose
      >
        <Form form={itemForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Required' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Required' }]}>
            <Select options={categoryOptions} />
          </Form.Item>
          <Form.Item name="price" label="Price" rules={[{ required: true, message: 'Required' }]}>
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="image_url" label="Image URL">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Required' }]}>
            <Select options={statusOptions} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Add Combo"
        open={comboModalOpen}
        onOk={handleComboOk}
        onCancel={() => setComboModalOpen(false)}
        width={640}
        destroyOnClose
      >
        <Form form={comboForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Required' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input />
          </Form.Item>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item {...restField} name={[name, 'concession_id']} rules={[{ required: true, message: 'Required' }]}>
                      <Select
                        style={{ width: 200 }}
                        placeholder="Select item"
                        options={items.map((it) => ({ value: it.id, label: it.name }))}
                      />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'quantity']} rules={[{ required: true, message: 'Required' }]}>
                      <InputNumber min={1} placeholder="Qty" />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add Item
                </Button>
              </>
            )}
          </Form.List>
          <Form.Item name="total_price" label="Total Price" rules={[{ required: true, message: 'Required' }]}>
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="discount_rate" label="Discount Rate" rules={[{ required: true, message: 'Required' }]}>
            <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Required' }]}>
            <Select options={statusOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default Concessions;
