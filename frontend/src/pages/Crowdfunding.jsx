import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Space,
  Tag,
  Descriptions,
  Progress,
  Switch,
  Tabs,
  message,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  UsergroupAddOutlined,
  TeamOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { crowdfundingApi, cinemasApi, moviesApi, audiencesApi } from '../api';

const priceStrategyConfig = {
  fixed: { color: 'blue', label: 'Fixed' },
  dynamic: { color: 'orange', label: 'Dynamic' },
};

const statusConfig = {
  draft: { color: 'default', label: 'Draft' },
  open: { color: 'green', label: 'Open' },
  full: { color: 'orange', label: 'Full' },
  success: { color: 'cyan', label: 'Success' },
  cancelled: { color: 'red', label: 'Cancelled' },
};

export default function Crowdfunding() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: undefined, movie_id: undefined, cinema_id: undefined });
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [audiences, setAudiences] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [halls, setHalls] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  const [joinOpen, setJoinOpen] = useState(false);
  const [joinForm] = Form.useForm();
  const [joinId, setJoinId] = useState(null);
  const [joinSubmitting, setJoinSubmitting] = useState(false);

  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [participantsData, setParticipantsData] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.movie_id) params.movie_id = filters.movie_id;
      if (filters.cinema_id) params.cinema_id = filters.cinema_id;
      const data = await crowdfundingApi.list(params);
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      message.error(err.message || 'Failed to load crowdfunding events');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    moviesApi.list().then((data) => setMovies(Array.isArray(data) ? data : [])).catch(() => {});
    cinemasApi.list().then((data) => setCinemas(Array.isArray(data) ? data : [])).catch(() => {});
    audiencesApi.list().then((data) => setAudiences(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const openCreate = () => {
    createForm.resetFields();
    setHalls([]);
    setCreateOpen(true);
  };

  const handleCinemaChange = async (cinemaId) => {
    createForm.setFieldValue('hall_id', undefined);
    if (!cinemaId) {
      setHalls([]);
      return;
    }
    try {
      const data = await cinemasApi.halls(cinemaId);
      setHalls(Array.isArray(data) ? data : []);
    } catch {
      setHalls([]);
    }
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setSubmitting(true);
      const payload = {
        ...values,
        target_show_date: values.target_show_date ? values.target_show_date.format('YYYY-MM-DD') : undefined,
        deadline_date: values.deadline_date ? values.deadline_date.format('YYYY-MM-DD') : undefined,
      };
      await crowdfundingApi.create(payload);
      message.success('Event created');
      setCreateOpen(false);
      createForm.resetFields();
      fetchEvents();
    } catch (err) {
      if (err.message) message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleView = async (record) => {
    try {
      const data = await crowdfundingApi.get(record.id);
      setViewData(data);
      setViewOpen(true);
    } catch (err) {
      message.error(err.message || 'Failed to load event detail');
    }
  };

  const openJoin = (record) => {
    joinForm.resetFields();
    setJoinId(record.id);
    setJoinOpen(true);
  };

  const handleJoin = async () => {
    try {
      const values = await joinForm.validateFields();
      setJoinSubmitting(true);
      await crowdfundingApi.join(joinId, values);
      message.success('Joined successfully');
      setJoinOpen(false);
      fetchEvents();
    } catch (err) {
      if (err.message) message.error(err.message);
    } finally {
      setJoinSubmitting(false);
    }
  };

  const openParticipants = async (record) => {
    setParticipantsOpen(true);
    setParticipantsLoading(true);
    try {
      const data = await crowdfundingApi.participants(record.id);
      setParticipantsData(Array.isArray(data) ? data : []);
    } catch (err) {
      message.error(err.message || 'Failed to load participants');
      setParticipantsData([]);
    } finally {
      setParticipantsLoading(false);
    }
  };

  const handleAutoConfirm = async (id) => {
    try {
      const result = await crowdfundingApi.autoConfirm(id);
      const newStatus = result?.status || 'success';
      message.success(`已触发自动成团，状态更新为: ${newStatus}`);
      fetchEvents();
    } catch (err) {
      message.error(err.message || 'Auto confirm failed');
    }
  };

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: 'Movie', dataIndex: 'movie_title', key: 'movie_title', ellipsis: true },
    { title: 'Cinema', dataIndex: 'cinema_name', key: 'cinema_name', ellipsis: true },
    {
      title: 'Target',
      dataIndex: 'target_audience_count',
      key: 'target_audience_count',
      render: (v) => v ?? '-',
    },
    {
      title: 'Current',
      dataIndex: 'current_count',
      key: 'current_count',
      render: (v, record) => {
        const target = record.target_audience_count || 1;
        const current = v || 0;
        const percent = Math.min(Math.round((current / target) * 100), 100);
        return (
          <div style={{ minWidth: 120 }}>
            <Progress percent={percent} size="small" format={() => `${current}/${target}`} />
          </div>
        );
      },
    },
    {
      title: 'Base Price',
      dataIndex: 'base_price',
      key: 'base_price',
      render: (v) => (v != null ? `¥${v}` : '-'),
    },
    {
      title: 'Price Strategy',
      dataIndex: 'price_strategy',
      key: 'price_strategy',
      render: (v) => {
        const cfg = priceStrategyConfig[v];
        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : v || '-';
      },
    },
    { title: 'Target Date', dataIndex: 'target_show_date', key: 'target_show_date' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => {
        const cfg = statusConfig[v];
        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : v || '-';
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            View
          </Button>
          <Button type="link" icon={<UsergroupAddOutlined />} onClick={() => openJoin(record)} disabled={record.status !== 'open'}>
            Join
          </Button>
          <Button type="link" icon={<TeamOutlined />} onClick={() => openParticipants(record)}>
            Participants
          </Button>
          <Button type="link" icon={<CheckCircleOutlined />} onClick={() => handleAutoConfirm(record.id)} disabled={record.status !== 'open' && record.status !== 'full'}>
            Auto Confirm
          </Button>
        </Space>
      ),
    },
  ];

  const participantColumns = [
    { title: 'Audience', dataIndex: 'audience_name', key: 'audience_name' },
    { title: 'Seats Reserved', dataIndex: 'seats_reserved', key: 'seats_reserved' },
    { title: 'Price Paid', dataIndex: 'price_paid', key: 'price_paid', render: (v) => (v != null ? `¥${v}` : '-') },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => {
        const cfg = statusConfig[v];
        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : v || '-';
      },
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="Filter by status"
          allowClear
          style={{ width: 160 }}
          value={filters.status}
          onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
        >
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <Select.Option key={key} value={key}>{cfg.label}</Select.Option>
          ))}
        </Select>
        <Select
          placeholder="Filter by movie"
          allowClear
          showSearch
          optionFilterProp="label"
          style={{ width: 200 }}
          value={filters.movie_id}
          onChange={(v) => setFilters((f) => ({ ...f, movie_id: v }))}
          options={movies.map((m) => ({ label: m.title, value: m.id }))}
        />
        <Select
          placeholder="Filter by cinema"
          allowClear
          showSearch
          optionFilterProp="label"
          style={{ width: 200 }}
          value={filters.cinema_id}
          onChange={(v) => setFilters((f) => ({ ...f, cinema_id: v }))}
          options={cinemas.map((c) => ({ label: c.name, value: c.id }))}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Create Event
        </Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={events}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Total ${t}` }}
        scroll={{ x: 1400 }}
      />

      <Modal
        title="Create Event"
        open={createOpen}
        onCancel={() => { createForm.resetFields(); setCreateOpen(false); }}
        onOk={handleCreate}
        confirmLoading={submitting}
        width={640}
      >
        <Form form={createForm} layout="vertical">
          <Tabs
            items={[
              {
                key: '1',
                label: '基础信息',
                children: (
                  <>
                    <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please enter title' }]}>
                      <Input />
                    </Form.Item>
                    <Form.Item name="movie_id" label="Movie" rules={[{ required: true, message: 'Please select movie' }]}>
                      <Select
                        placeholder="Select movie"
                        showSearch
                        optionFilterProp="label"
                        options={movies.map((m) => ({ label: m.title, value: m.id }))}
                      />
                    </Form.Item>
                    <Form.Item name="cinema_id" label="Cinema" rules={[{ required: true, message: 'Please select cinema' }]}>
                      <Select
                        placeholder="Select cinema"
                        showSearch
                        optionFilterProp="label"
                        options={cinemas.map((c) => ({ label: c.name, value: c.id }))}
                        onChange={handleCinemaChange}
                      />
                    </Form.Item>
                    <Form.Item name="hall_id" label="Hall" rules={[{ required: true, message: 'Please select hall' }]}>
                      <Select
                        placeholder="Select hall"
                        showSearch
                        optionFilterProp="label"
                        options={halls.map((h) => ({ label: h.name, value: h.id }))}
                      />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                      <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="target_show_date" label="Target Show Date" rules={[{ required: true, message: 'Please select date' }]}>
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Please select status' }]}>
                      <Select placeholder="Select status">
                        {Object.entries(statusConfig).map(([key, cfg]) => (
                          <Select.Option key={key} value={key}>{cfg.label}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </>
                ),
              },
              {
                key: '2',
                label: '成团规则',
                children: (
                  <>
                    <Form.Item name="target_audience_count" label="Target Audience Count" rules={[{ required: true, message: 'Please enter target count' }]}>
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="reserved_seats_count" label="Reserved Seats Count">
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="auto_confirm" label="Auto Confirm" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item name="deadline_date" label="Deadline Date">
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="group_rules" label="Group Rules">
                      <Input.TextArea rows={3} />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: '3',
                label: '价格策略',
                children: (
                  <>
                    <Form.Item name="base_price" label="Base Price" rules={[{ required: true, message: 'Please enter base price' }]}>
                      <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="min_price" label="Min Price">
                      <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="max_price" label="Max Price">
                      <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="price_strategy" label="Price Strategy" rules={[{ required: true, message: 'Please select strategy' }]}>
                      <Select placeholder="Select strategy">
                        <Select.Option value="fixed">Fixed</Select.Option>
                        <Select.Option value="dynamic">Dynamic</Select.Option>
                      </Select>
                    </Form.Item>
                  </>
                ),
              },
            ]}
          />
        </Form>
      </Modal>

      <Modal
        title="Event Detail"
        open={viewOpen}
        onCancel={() => { setViewOpen(false); setViewData(null); }}
        footer={null}
        width={640}
      >
        {viewData && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Title">{viewData.title}</Descriptions.Item>
            <Descriptions.Item label="Movie">{viewData.movie_title}</Descriptions.Item>
            <Descriptions.Item label="Cinema">{viewData.cinema_name}</Descriptions.Item>
            <Descriptions.Item label="Hall">{viewData.hall_name}</Descriptions.Item>
            <Descriptions.Item label="Target Count">{viewData.target_audience_count}</Descriptions.Item>
            <Descriptions.Item label="Current Count">{viewData.current_count}</Descriptions.Item>
            <Descriptions.Item label="Base Price">¥{viewData.base_price}</Descriptions.Item>
            <Descriptions.Item label="Min Price">{viewData.min_price != null ? `¥${viewData.min_price}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="Max Price">{viewData.max_price != null ? `¥${viewData.max_price}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="Price Strategy">
              <Tag color={priceStrategyConfig[viewData.price_strategy]?.color}>
                {priceStrategyConfig[viewData.price_strategy]?.label || viewData.price_strategy}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Target Date">{viewData.target_show_date}</Descriptions.Item>
            <Descriptions.Item label="Auto Confirm">{viewData.auto_confirm ? 'Yes' : 'No'}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusConfig[viewData.status]?.color}>
                {statusConfig[viewData.status]?.label || viewData.status}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        title="Join Event"
        open={joinOpen}
        onCancel={() => setJoinOpen(false)}
        onOk={handleJoin}
        confirmLoading={joinSubmitting}
      >
        <Form form={joinForm} layout="vertical">
          <Form.Item name="audience_id" label="Audience" rules={[{ required: true, message: 'Please select audience' }]}>
            <Select
              placeholder="Select audience"
              showSearch
              optionFilterProp="label"
              options={audiences.map((a) => ({ label: a.name || a.phone || `#${a.id}`, value: a.id }))}
            />
          </Form.Item>
          <Form.Item name="seats_reserved" label="Seats Reserved" rules={[{ required: true, message: 'Please enter seats' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Participants"
        open={participantsOpen}
        onCancel={() => { setParticipantsOpen(false); setParticipantsData([]); }}
        footer={null}
        width={640}
      >
        <Table
          rowKey="id"
          columns={participantColumns}
          dataSource={participantsData}
          loading={participantsLoading}
          pagination={false}
          size="small"
        />
      </Modal>
    </div>
  );
}
