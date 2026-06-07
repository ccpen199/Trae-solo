import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, Space, Tag, message, Popconfirm, Descriptions, Tabs, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, FileProtectOutlined, PlaySquareOutlined, PartitionOutlined, RiseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { moviesApi } from '../api';

const genreOptions = [
  'Sci-Fi', 'Historical', 'Thriller', 'Animation', 'Action', 'Comedy', 'Romance', 'Drama',
];

const preShowPackageOptions = ['standard', 'premium', 'family'];

const statusOptions = [
  { value: 'showing', label: 'Showing' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'offline', label: 'Offline' },
];

const copyrightRegionOptions = [
  { value: 'mainland_china', label: '中国大陆' },
  { value: 'hong_kong', label: '中国香港' },
  { value: 'taiwan', label: '中国台湾' },
  { value: 'north_america', label: '北美' },
  { value: 'europe', label: '欧洲' },
  { value: 'japan', label: '日本' },
  { value: 'korea', label: '韩国' },
  { value: 'southeast_asia', label: '东南亚' },
];

const languageOptions = [
  { value: 'mandarin', label: '国语' },
  { value: 'english', label: '英语' },
  { value: 'cantonese', label: '粤语' },
  { value: 'japanese', label: '日语' },
  { value: 'korean', label: '韩语' },
  { value: 'french', label: '法语' },
];

const subtitleOptions = [
  { value: 'simplified_chinese', label: '简体中文' },
  { value: 'traditional_chinese', label: '繁体中文' },
  { value: 'english', label: '英文' },
  { value: 'japanese', label: '日文' },
];

const statusTagProps = {
  showing: { color: 'green' },
  upcoming: { color: 'blue' },
  offline: { color: 'default' },
};

function Movies() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [current, setCurrent] = useState(null);
  const [filterStatus, setFilterStatus] = useState(undefined);
  const [filterGenre, setFilterGenre] = useState(undefined);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterGenre) params.genre = filterGenre;
      const res = await moviesApi.list(params);
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterGenre]);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = async (record) => {
    try {
      const detail = await moviesApi.get(record.id);
      setEditing(detail);
      form.setFieldsValue({
        ...detail,
        release_date: detail.release_date ? dayjs(detail.release_date) : undefined,
        copyright_expiry: detail.copyright_expiry ? dayjs(detail.copyright_expiry) : undefined,
        share_effective_date: detail.share_effective_date ? dayjs(detail.share_effective_date) : undefined,
        share_expiry_date: detail.share_expiry_date ? dayjs(detail.share_expiry_date) : undefined,
        lifecycle_first_schedule: detail.lifecycle_first_schedule ? dayjs(detail.lifecycle_first_schedule) : undefined,
        lifecycle_last_schedule: detail.lifecycle_last_schedule ? dayjs(detail.lifecycle_last_schedule) : undefined,
      });
      setModalOpen(true);
    } catch (err) {
      message.error(err.message);
    }
  };

  const openDetail = async (record) => {
    try {
      const detail = await moviesApi.get(record.id);
      setCurrent(detail);
      setDetailOpen(true);
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        release_date: values.release_date ? values.release_date.format('YYYY-MM-DD') : null,
        copyright_expiry: values.copyright_expiry ? values.copyright_expiry.format('YYYY-MM-DD') : null,
        share_effective_date: values.share_effective_date ? values.share_effective_date.format('YYYY-MM-DD') : null,
        share_expiry_date: values.share_expiry_date ? values.share_expiry_date.format('YYYY-MM-DD') : null,
        lifecycle_first_schedule: values.lifecycle_first_schedule ? values.lifecycle_first_schedule.format('YYYY-MM-DD') : null,
        lifecycle_last_schedule: values.lifecycle_last_schedule ? values.lifecycle_last_schedule.format('YYYY-MM-DD') : null,
      };
      if (editing) {
        await moviesApi.update(editing.id, payload);
        message.success('Updated');
      } else {
        await moviesApi.create(payload);
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
      await moviesApi.delete(id);
      message.success('Deleted');
      fetchData();
    } catch (err) {
      message.error(err.message);
    }
  };

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Genre', dataIndex: 'genre', key: 'genre' },
    { title: 'Duration(min)', dataIndex: 'duration', key: 'duration' },
    { title: 'Director', dataIndex: 'director', key: 'director' },
    { title: 'Release Date', dataIndex: 'release_date', key: 'release_date' },
    {
      title: 'Revenue Share(%)',
      dataIndex: 'revenue_share_ratio',
      key: 'revenue_share_ratio',
      render: (v) => v != null ? (v * 100).toFixed(0) : '-',
    },
    { title: 'Pre-show Package', dataIndex: 'pre_show_package', key: 'pre_show_package' },
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
          <Button type="link" icon={<EyeOutlined />} onClick={() => openDetail(record)} />
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="Delete this movie?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const formTabs = [
    {
      key: '1',
      label: (
        <span>
          <PartitionOutlined />
          基础信息
        </span>
      ),
      children: (
        <>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Required' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="genre" label="Genre" rules={[{ required: true, message: 'Required' }]}>
            <Select options={genreOptions.map((g) => ({ value: g, label: g }))} />
          </Form.Item>
          <Form.Item name="duration" label="Duration(min)" rules={[{ required: true, message: 'Required' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="director" label="Director" rules={[{ required: true, message: 'Required' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="release_date" label="Release Date" rules={[{ required: true, message: 'Required' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="poster_url" label="Poster URL">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Required' }]}>
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item name="synopsis" label="Synopsis">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="cast" label="Cast">
            <Input placeholder="主演列表，逗号分隔" />
          </Form.Item>
        </>
      ),
    },
    {
      key: '2',
      label: (
        <span>
          <FileProtectOutlined />
          版权有效期
        </span>
      ),
      children: (
        <>
          <Form.Item name="copyright_expiry" label="Copyright Expiry">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="copyright_holder" label="版权方">
            <Input />
          </Form.Item>
          <Form.Item name="copyright_reg_no" label="版权登记号">
            <Input />
          </Form.Item>
          <Form.Item name="copyright_region" label="版权地区">
            <Select mode="multiple" options={copyrightRegionOptions} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="copyright_terms" label="版权条款摘要">
            <Input.TextArea rows={3} />
          </Form.Item>
        </>
      ),
    },
    {
      key: '3',
      label: (
        <span>
          <PlaySquareOutlined />
          映前物料包
        </span>
      ),
      children: (
        <>
          <Form.Item name="pre_show_package" label="Pre-show Package">
            <Select allowClear options={preShowPackageOptions.map((p) => ({ value: p, label: p }))} />
          </Form.Item>
          <Form.Item name="pre_show_ad_duration" label="广告时长">
            <InputNumber min={0} style={{ width: '100%' }} suffix="秒" />
          </Form.Item>
          <Form.Item name="pre_show_trailer_count" label="预告片数量">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="pre_show_material_version" label="物料版本号">
            <Input />
          </Form.Item>
          <Form.Item name="pre_show_material_path" label="物料存储路径">
            <Input />
          </Form.Item>
          <Form.Item name="pre_show_languages" label="语言版本">
            <Select mode="multiple" options={languageOptions} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="pre_show_subtitles" label="字幕版本">
            <Select mode="multiple" options={subtitleOptions} style={{ width: '100%' }} />
          </Form.Item>
        </>
      ),
    },
    {
      key: '4',
      label: (
        <span>
          <RiseOutlined />
          分账与生命周期
        </span>
      ),
      children: (
        <>
          <Form.Item name="revenue_share_ratio" label="Revenue Share Ratio" rules={[{ required: true, message: 'Required' }]}>
            <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="share_effective_date" label="分账生效日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="share_expiry_date" label="分账结束日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="share_tiered" label="是否阶梯分账" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="share_tier1_ratio" label="第一周分账比例">
            <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="share_tier2_ratio" label="第二周分账比例">
            <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="share_tier3_ratio" label="第三周及以后分账比例">
            <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="lifecycle_first_schedule" label="首次排片日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="lifecycle_last_schedule" label="最后排片日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="lifecycle_notes" label="排片协同备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </>
      ),
    },
  ];

  const getOptionLabel = (options, value) => {
    const opt = options.find((o) => o.value === value);
    return opt ? opt.label : value;
  };

  const getMultiOptionLabels = (options, values) => {
    if (!values || !values.length) return '-';
    return values.map((v) => getOptionLabel(options, v)).join(', ');
  };

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="Filter by status"
          allowClear
          style={{ width: 160 }}
          value={filterStatus}
          onChange={setFilterStatus}
          options={statusOptions}
        />
        <Select
          placeholder="Filter by genre"
          allowClear
          style={{ width: 160 }}
          value={filterGenre}
          onChange={setFilterGenre}
          options={genreOptions.map((g) => ({ value: g, label: g }))}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Add Movie</Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editing ? 'Edit Movie' : 'Add Movie'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Tabs items={formTabs} />
        </Form>
      </Modal>

      <Modal
        title="Movie Detail"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={720}
      >
        {current && (
          <div>
            <Descriptions title="基础信息" column={1} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Title">{current.title}</Descriptions.Item>
              <Descriptions.Item label="Genre">{current.genre}</Descriptions.Item>
              <Descriptions.Item label="Duration(min)">{current.duration}</Descriptions.Item>
              <Descriptions.Item label="Director">{current.director}</Descriptions.Item>
              <Descriptions.Item label="Release Date">{current.release_date || '-'}</Descriptions.Item>
              <Descriptions.Item label="Poster URL">{current.poster_url || '-'}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag {...(statusTagProps[current.status] || {})}>{current.status || '-'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Synopsis">{current.synopsis || '-'}</Descriptions.Item>
              <Descriptions.Item label="Cast">{current.cast || '-'}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="版权有效期" column={1} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Copyright Expiry">{current.copyright_expiry || '-'}</Descriptions.Item>
              <Descriptions.Item label="版权方">{current.copyright_holder || '-'}</Descriptions.Item>
              <Descriptions.Item label="版权登记号">{current.copyright_reg_no || '-'}</Descriptions.Item>
              <Descriptions.Item label="版权地区">
                {getMultiOptionLabels(copyrightRegionOptions, current.copyright_region)}
              </Descriptions.Item>
              <Descriptions.Item label="版权条款摘要">{current.copyright_terms || '-'}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="映前物料包" column={1} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Pre-show Package">{current.pre_show_package || '-'}</Descriptions.Item>
              <Descriptions.Item label="广告时长">{current.pre_show_ad_duration != null ? `${current.pre_show_ad_duration} 秒` : '-'}</Descriptions.Item>
              <Descriptions.Item label="预告片数量">{current.pre_show_trailer_count != null ? current.pre_show_trailer_count : '-'}</Descriptions.Item>
              <Descriptions.Item label="物料版本号">{current.pre_show_material_version || '-'}</Descriptions.Item>
              <Descriptions.Item label="物料存储路径">{current.pre_show_material_path || '-'}</Descriptions.Item>
              <Descriptions.Item label="语言版本">
                {getMultiOptionLabels(languageOptions, current.pre_show_languages)}
              </Descriptions.Item>
              <Descriptions.Item label="字幕版本">
                {getMultiOptionLabels(subtitleOptions, current.pre_show_subtitles)}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="分账与生命周期" column={1} bordered>
              <Descriptions.Item label="Revenue Share Ratio">
                {current.revenue_share_ratio != null ? (current.revenue_share_ratio * 100).toFixed(0) + '%' : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="分账生效日期">{current.share_effective_date || '-'}</Descriptions.Item>
              <Descriptions.Item label="分账结束日期">{current.share_expiry_date || '-'}</Descriptions.Item>
              <Descriptions.Item label="是否阶梯分账">
                <Switch checked={current.share_tiered} disabled />
              </Descriptions.Item>
              <Descriptions.Item label="第一周分账比例">
                {current.share_tier1_ratio != null ? (current.share_tier1_ratio * 100).toFixed(0) + '%' : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="第二周分账比例">
                {current.share_tier2_ratio != null ? (current.share_tier2_ratio * 100).toFixed(0) + '%' : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="第三周及以后分账比例">
                {current.share_tier3_ratio != null ? (current.share_tier3_ratio * 100).toFixed(0) + '%' : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="首次排片日期">{current.lifecycle_first_schedule || '-'}</Descriptions.Item>
              <Descriptions.Item label="最后排片日期">{current.lifecycle_last_schedule || '-'}</Descriptions.Item>
              <Descriptions.Item label="排片协同备注">{current.lifecycle_notes || '-'}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </>
  );
}

export default Movies;
