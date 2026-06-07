import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Tag, message, Popconfirm, Tabs, DatePicker, Descriptions } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileSearchOutlined, AuditOutlined, ClusterOutlined, InfoCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { cinemasApi } from '../api';
import dayjs from 'dayjs';

const equipmentLevelMap = {
  dolby: { color: 'blue', label: 'Dolby' },
  imax: { color: 'gold', label: 'IMAX' },
  '4dx': { color: 'purple', label: '4DX' },
  standard: { color: 'default', label: 'Standard' },
};

const statusMap = {
  active: { color: 'green', label: 'Active' },
  inactive: { color: 'red', label: 'Inactive' },
};

const reviewStatusMap = {
  normal: { color: 'green', label: 'Normal' },
  warning: { color: 'orange', label: 'Warning' },
  attention: { color: 'red', label: 'Attention' },
};

const verifyStatusMap = {
  verified: { color: 'green', label: 'Verified' },
  pending: { color: 'orange', label: 'Pending' },
  rejected: { color: 'red', label: 'Rejected' },
};

function Cinemas() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [filters, setFilters] = useState({ city: undefined, status: undefined });
  const [activeTabKey, setActiveTabKey] = useState('1');
  const [form] = Form.useForm();

  const tabItems = [
    { key: '1', label: '基础信息', icon: <InfoCircleOutlined /> },
    { key: '2', label: '影厅明细', icon: <ClusterOutlined /> },
    { key: '3', label: '设备等级与排片协议', icon: <FileSearchOutlined /> },
    { key: '4', label: '运营复查', icon: <AuditOutlined /> },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await cinemasApi.list(filters);
      setData(res.items || res.data || res || []);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    setActiveTabKey('1');
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditing(record);
    const formData = { ...record };
    if (formData.equipment_verify_date) formData.equipment_verify_date = dayjs(formData.equipment_verify_date);
    if (formData.protocol_start_date) formData.protocol_start_date = dayjs(formData.protocol_start_date);
    if (formData.protocol_end_date) formData.protocol_end_date = dayjs(formData.protocol_end_date);
    if (formData.last_review_date) formData.last_review_date = dayjs(formData.last_review_date);
    if (formData.next_review_date) formData.next_review_date = dayjs(formData.next_review_date);
    form.setFieldsValue(formData);
    setActiveTabKey('1');
    setModalOpen(true);
  };

  const handleView = (record) => {
    setViewing(record);
    setViewModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await cinemasApi.delete(id);
      message.success('Deleted');
      fetchData();
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = { ...values };
      const dateFields = ['equipment_verify_date', 'protocol_start_date', 'protocol_end_date', 'last_review_date', 'next_review_date'];
      dateFields.forEach(field => {
        if (payload[field]) {
          payload[field] = payload[field].format('YYYY-MM-DD');
        }
      });
      if (editing) {
        await cinemasApi.update(editing.id, payload);
        message.success('Updated');
      } else {
        await cinemasApi.create(payload);
        message.success('Created');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'City', dataIndex: 'city', key: 'city' },
    { title: 'District', dataIndex: 'district', key: 'district' },
    { title: 'Hall Count', dataIndex: 'hall_count', key: 'hall_count' },
    {
      title: 'Equipment Level',
      dataIndex: 'equipment_level',
      key: 'equipment_level',
      render: (val) => {
        const info = equipmentLevelMap[val] || equipmentLevelMap.standard;
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    { title: 'Scheduling Protocol', dataIndex: 'scheduling_protocol', key: 'scheduling_protocol' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val) => {
        const info = statusMap[val] || { color: 'default', label: val };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>View Detail</Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Are you sure?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderViewDetail = () => {
    if (!viewing) return null;
    const eqInfo = equipmentLevelMap[viewing.equipment_level] || equipmentLevelMap.standard;
    const statusInfo = statusMap[viewing.status] || { color: 'default', label: viewing.status };
    const reviewInfo = reviewStatusMap[viewing.review_status] || { color: 'default', label: viewing.review_status };
    const verifyInfo = verifyStatusMap[viewing.equipment_verify_status] || { color: 'default', label: viewing.equipment_verify_status };

    return (
      <Modal
        title={`Cinema Detail: ${viewing.name}`}
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Name" span={2}>{viewing.name}</Descriptions.Item>
          <Descriptions.Item label="City">{viewing.city}</Descriptions.Item>
          <Descriptions.Item label="District">{viewing.district}</Descriptions.Item>
          <Descriptions.Item label="Address" span={2}>{viewing.address}</Descriptions.Item>
          <Descriptions.Item label="Status"><Tag color={statusInfo.color}>{statusInfo.label}</Tag></Descriptions.Item>
          <Descriptions.Item label="Hall Count">{viewing.hall_count || (viewing.halls ? viewing.halls.length : 0)}</Descriptions.Item>
          <Descriptions.Item label="Equipment Level"><Tag color={eqInfo.color}>{eqInfo.label}</Tag></Descriptions.Item>
          <Descriptions.Item label="Equipment Verify Date">{viewing.equipment_verify_date}</Descriptions.Item>
          <Descriptions.Item label="Equipment Verify By">{viewing.equipment_verify_by}</Descriptions.Item>
          <Descriptions.Item label="Equipment Verify Status"><Tag color={verifyInfo.color}>{verifyInfo.label}</Tag></Descriptions.Item>
          <Descriptions.Item label="Scheduling Protocol">{viewing.scheduling_protocol}</Descriptions.Item>
          <Descriptions.Item label="Protocol Start Date">{viewing.protocol_start_date}</Descriptions.Item>
          <Descriptions.Item label="Protocol End Date">{viewing.protocol_end_date}</Descriptions.Item>
          <Descriptions.Item label="Min Schedule Ratio">{viewing.min_schedule_ratio}</Descriptions.Item>
          <Descriptions.Item label="Max Daily Showtimes">{viewing.max_daily_showtimes}</Descriptions.Item>
          <Descriptions.Item label="Last Review Date">{viewing.last_review_date}</Descriptions.Item>
          <Descriptions.Item label="Next Review Date">{viewing.next_review_date}</Descriptions.Item>
          <Descriptions.Item label="Review Status"><Tag color={reviewInfo.color}>{reviewInfo.label}</Tag></Descriptions.Item>
          <Descriptions.Item label="Reviewed By">{viewing.reviewed_by}</Descriptions.Item>
          <Descriptions.Item label="Review Notes" span={2}>{viewing.review_notes}</Descriptions.Item>
        </Descriptions>
        {viewing.halls && viewing.halls.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h4 style={{ marginBottom: 8 }}>影厅明细 (Hall Details)</h4>
            <Table
              size="small"
              dataSource={viewing.halls}
              rowKey={(record, index) => index}
              pagination={false}
              columns={[
                { title: 'Hall Name', dataIndex: 'hall_name', key: 'hall_name' },
                { title: 'Seat Count', dataIndex: 'seat_count', key: 'seat_count' },
                {
                  title: 'Equipment Level',
                  dataIndex: 'equipment_level',
                  key: 'equipment_level',
                  render: (val) => {
                    const info = equipmentLevelMap[val] || equipmentLevelMap.standard;
                    return <Tag color={info.color}>{info.label}</Tag>;
                  },
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (val) => {
                    const info = statusMap[val] || { color: 'default', label: val };
                    return <Tag color={info.color}>{info.label}</Tag>;
                  },
                },
              ]}
            />
          </div>
        )}
      </Modal>
    );
  };

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="Filter by city"
          allowClear
          style={{ width: 160 }}
          value={filters.city}
          onChange={(val) => setFilters((f) => ({ ...f, city: val }))}
        >
          {(() => {
            const cities = [...new Set(data.map((d) => d.city).filter(Boolean))];
            return cities.map((c) => (
              <Select.Option key={c} value={c}>{c}</Select.Option>
            ));
          })()}
        </Select>
        <Select
          placeholder="Filter by status"
          allowClear
          style={{ width: 160 }}
          value={filters.status}
          onChange={(val) => setFilters((f) => ({ ...f, status: val }))}
        >
          <Select.Option value="active">Active</Select.Option>
          <Select.Option value="inactive">Inactive</Select.Option>
        </Select>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Cinema
        </Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editing ? 'Edit Cinema' : 'Add Cinema'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
        width={700}
      >
        <Form form={form} layout="vertical">
          <Tabs
            activeKey={activeTabKey}
            onChange={setActiveTabKey}
            items={tabItems}
          />
          {activeTabKey === '1' && (
            <div style={{ marginTop: 16 }}>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="city" label="City" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="district" label="District" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="address" label="Address">
                <Input />
              </Form.Item>
              <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="active">Active</Select.Option>
                  <Select.Option value="inactive">Inactive</Select.Option>
                </Select>
              </Form.Item>
            </div>
          )}
          {activeTabKey === '2' && (
            <div style={{ marginTop: 16 }}>
              <Form.List
                name="halls"
                rules={[{ validator: async (_, halls) => { if (!halls || halls.length === 0) throw new Error('At least one hall is required'); } }]}
              >
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                        <Form.Item
                          {...restField}
                          name={[name, 'hall_name']}
                          rules={[{ required: true, message: 'Hall name is required' }]}
                          style={{ width: 150, marginBottom: 8 }}
                        >
                          <Input placeholder="Hall Name" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'seat_count']}
                          rules={[{ required: true, message: 'Seat count is required' }]}
                          style={{ width: 120, marginBottom: 8 }}
                        >
                          <InputNumber min={10} placeholder="Seats" style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'equipment_level']}
                          rules={[{ required: true, message: 'Equipment level is required' }]}
                          style={{ width: 130, marginBottom: 8 }}
                        >
                          <Select placeholder="Equipment">
                            <Select.Option value="dolby">Dolby</Select.Option>
                            <Select.Option value="imax">IMAX</Select.Option>
                            <Select.Option value="4dx">4DX</Select.Option>
                            <Select.Option value="standard">Standard</Select.Option>
                          </Select>
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'status']}
                          rules={[{ required: true, message: 'Status is required' }]}
                          style={{ width: 110, marginBottom: 8 }}
                        >
                          <Select placeholder="Status">
                            <Select.Option value="active">Active</Select.Option>
                            <Select.Option value="inactive">Inactive</Select.Option>
                          </Select>
                        </Form.Item>
                        <DeleteOutlined onClick={() => remove(name)} style={{ color: 'red', cursor: 'pointer' }} />
                      </Space>
                    ))}
                    <Form.Item>
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Add Hall
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </div>
          )}
          {activeTabKey === '3' && (
            <div style={{ marginTop: 16 }}>
              <Form.Item name="equipment_level" label="Equipment Level" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="dolby">Dolby</Select.Option>
                  <Select.Option value="imax">IMAX</Select.Option>
                  <Select.Option value="4dx">4DX</Select.Option>
                  <Select.Option value="standard">Standard</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="equipment_verify_date" label="Equipment Verify Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="equipment_verify_by" label="Equipment Verify By">
                <Input />
              </Form.Item>
              <Form.Item name="equipment_verify_status" label="Equipment Verify Status">
                <Select>
                  <Select.Option value="verified">Verified</Select.Option>
                  <Select.Option value="pending">Pending</Select.Option>
                  <Select.Option value="rejected">Rejected</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="scheduling_protocol" label="Scheduling Protocol" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="auto">Auto</Select.Option>
                  <Select.Option value="manual">Manual</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="protocol_start_date" label="Protocol Start Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="protocol_end_date" label="Protocol End Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="min_schedule_ratio" label="Min Schedule Ratio">
                <InputNumber step={0.01} min={0} max={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="max_daily_showtimes" label="Max Daily Showtimes">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </div>
          )}
          {activeTabKey === '4' && (
            <div style={{ marginTop: 16 }}>
              <Form.Item name="last_review_date" label="Last Review Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="next_review_date" label="Next Review Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="review_notes" label="Review Notes">
                <Input.TextArea rows={4} />
              </Form.Item>
              <Form.Item name="review_status" label="Review Status">
                <Select>
                  <Select.Option value="normal">Normal</Select.Option>
                  <Select.Option value="warning">Warning</Select.Option>
                  <Select.Option value="attention">Attention</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="reviewed_by" label="Reviewed By">
                <Input />
              </Form.Item>
            </div>
          )}
        </Form>
      </Modal>

      {renderViewDetail()}
    </>
  );
}

export default Cinemas;
