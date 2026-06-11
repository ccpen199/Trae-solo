import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  Progress,
  Avatar,
  Tag,
  message,
  Spin,
  Popconfirm,
  Row,
  Col,
  Card,
  DatePicker,
  Dropdown,
  Menu,
  Checkbox,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DownOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { useAuth } from '../context/AuthContext';
import { applications, jobs } from '../api';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { confirm } = Modal;

const statusOptions = [
  { value: 'applied', label: '已投递', color: 'default' },
  { value: 'screening', label: '筛选中', color: 'blue' },
  { value: 'interview', label: '面试中', color: 'cyan' },
  { value: 'offer', label: '已发Offer', color: 'gold' },
  { value: 'hired', label: '已入职', color: 'green' },
  { value: 'rejected', label: '已淘汰', color: 'red' },
];

function Applications() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [funnelLoading, setFunnelLoading] = useState(false);
  const [data, setData] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({
    keyword: '',
    jobId: undefined,
    status: undefined,
    startDate: undefined,
    endDate: undefined,
  });
  const [jobOptions, setJobOptions] = useState([]);
  const [funnelData, setFunnelData] = useState([]);
  const [remarkModalVisible, setRemarkModalVisible] = useState(false);
  const [currentApplication, setCurrentApplication] = useState(null);
  const [remarkForm] = Form.useForm();

  useEffect(() => {
    fetchJobOptions();
    fetchApplications();
    fetchFunnel();
  }, []);

  const fetchJobOptions = async () => {
    try {
      const res = await jobs.getList({ pageSize: 100 });
      if (res.code === 0) {
        setJobOptions(res.data.list || []);
      }
    } catch (err) {
      console.error('获取岗位列表失败:', err);
    }
  };

  const fetchApplications = async (page = 1, pageSize = 10, newFilters = filters) => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        ...newFilters,
      };
      const res = await applications.getList(params);
      if (res.code === 0) {
        setData(res.data.list || []);
        setPagination({
          current: page,
          pageSize,
          total: res.data.total || 0,
        });
      }
    } catch (err) {
      console.error('获取投递列表失败:', err);
      message.error('获取投递列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchFunnel = async () => {
    setFunnelLoading(true);
    try {
      const res = await applications.getFunnel();
      if (res.code === 0) {
        setFunnelData(res.data || []);
      }
    } catch (err) {
      console.error('获取漏斗数据失败:', err);
    } finally {
      setFunnelLoading(false);
    }
  };

  const handleSearch = (value) => {
    const newFilters = { ...filters, keyword: value };
    setFilters(newFilters);
    fetchApplications(1, pagination.pageSize, newFilters);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchApplications(1, pagination.pageSize, newFilters);
  };

  const handleDateChange = (dates) => {
    if (dates && dates.length === 2) {
      const newFilters = {
        ...filters,
        startDate: dates[0]?.format('YYYY-MM-DD'),
        endDate: dates[1]?.format('YYYY-MM-DD'),
      };
      setFilters(newFilters);
      fetchApplications(1, pagination.pageSize, newFilters);
    } else {
      const newFilters = { ...filters, startDate: undefined, endDate: undefined };
      setFilters(newFilters);
      fetchApplications(1, pagination.pageSize, newFilters);
    }
  };

  const handleTableChange = (newPagination) => {
    fetchApplications(newPagination.current, newPagination.pageSize, filters);
  };

  const handleStatusChange = async (record, status) => {
    try {
      const res = await applications.updateStatus(record.id, status);
      if (res.code === 0) {
        message.success('状态更新成功');
        fetchApplications(pagination.current, pagination.pageSize, filters);
        fetchFunnel();
      }
    } catch (err) {
      console.error('状态更新失败:', err);
      message.error('状态更新失败');
    }
  };

  const handleBatchStatusChange = (status) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的投递记录');
      return;
    }
    confirm({
      title: '确认批量更新状态',
      icon: <ExclamationCircleOutlined />,
      content: `确定要将选中的 ${selectedRowKeys.length} 条记录状态更新为 ${statusOptions.find((s) => s.value === status)?.label} 吗？`,
      onOk: async () => {
        try {
          const res = await applications.batchUpdateStatus(selectedRowKeys, status);
          if (res.code === 0) {
            message.success('批量更新成功');
            setSelectedRowKeys([]);
            fetchApplications(pagination.current, pagination.pageSize, filters);
            fetchFunnel();
          }
        } catch (err) {
          console.error('批量更新失败:', err);
          message.error('批量更新失败');
        }
      },
    });
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的投递记录');
      return;
    }
    confirm({
      title: '确认批量删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除选中的 ${selectedRowKeys.length} 条记录吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await applications.batchDelete(selectedRowKeys);
          if (res.code === 0) {
            message.success('批量删除成功');
            setSelectedRowKeys([]);
            fetchApplications(pagination.current, pagination.pageSize, filters);
            fetchFunnel();
          }
        } catch (err) {
          console.error('批量删除失败:', err);
          message.error('批量删除失败');
        }
      },
    });
  };

  const handleRemark = (record) => {
    setCurrentApplication(record);
    remarkForm.setFieldsValue({ remark: record.remark || '' });
    setRemarkModalVisible(true);
  };

  const handleSaveRemark = async (values) => {
    try {
      const res = await applications.updateRemark(currentApplication.id, values.remark);
      if (res.code === 0) {
        message.success('备注保存成功');
        setRemarkModalVisible(false);
        remarkForm.resetFields();
        fetchApplications(pagination.current, pagination.pageSize, filters);
      }
    } catch (err) {
      console.error('保存备注失败:', err);
      message.error('保存备注失败');
    }
  };

  const getStatusMenu = (record) => {
    const currentIndex = statusOptions.findIndex((s) => s.value === record.status);
    const nextStatuses = statusOptions.slice(currentIndex + 1).filter((s) => s.value !== 'rejected');
    const items = [
      ...nextStatuses.map((s) => ({
        key: s.value,
        label: (
          <span>
            标记为 <Tag color={s.color}>{s.label}</Tag>
          </span>
        ),
      })),
      { type: 'divider' },
      {
        key: 'rejected',
        label: (
          <span style={{ color: '#ff4d4f' }}>
            <ExclamationCircleOutlined /> 淘汰
          </span>
        ),
      },
    ];
    return {
      items,
      onClick: ({ key }) => handleStatusChange(record, key),
    };
  };

  const getFunnelOption = () => {
    const statusMap = {
      applied: '已投递',
      screening: '筛选中',
      interview: '面试中',
      offer: '已发Offer',
      hired: '已入职',
    };
    const data = Object.keys(statusMap).map((key) => ({
      name: statusMap[key],
      value: funnelData[key] || 0,
    }));
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}',
      },
      series: [
        {
          type: 'funnel',
          left: '10%',
          width: '80%',
          label: {
            show: true,
            position: 'inside',
            formatter: '{b}\n{c}',
            fontSize: 11,
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 2,
          },
          emphasis: {
            label: {
              fontSize: 14,
            },
          },
          data: data,
          color: ['#1890ff', '#36cfc9', '#597ef7', '#faad14', '#52c41a'],
        },
      ],
    };
  };

  const columns = [
    {
      title: '求职者',
      dataIndex: 'candidateName',
      key: 'candidateName',
      width: 150,
      render: (text, record) => (
        <Space>
          <Avatar size={32} src={record.candidateAvatar}>
            {text?.charAt(0)}
          </Avatar>
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '岗位',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      width: 150,
    },
    {
      title: '投递时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
      width: 170,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '当前状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const info = statusOptions.find((s) => s.value === status) || {
          color: 'default',
          label: status,
        };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '匹配度',
      dataIndex: 'matchScore',
      key: 'matchScore',
      width: 150,
      render: (score) => (
        <Progress
          percent={score || 0}
          size="small"
          status={score >= 80 ? 'success' : score >= 60 ? 'normal' : 'exception'}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Dropdown menu={getStatusMenu(record)} trigger={['click']}>
            <Button type="link" size="small">
              状态流转 <DownOutlined />
            </Button>
          </Dropdown>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/applications/${record.id}`)}
          >
            查看详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleRemark(record)}
          >
            备注
          </Button>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  const batchStatusMenu = {
    items: statusOptions.map((s) => ({
      key: s.value,
      label: (
        <span>
          标记为 <Tag color={s.color}>{s.label}</Tag>
        </span>
      ),
    })),
    onClick: ({ key }) => handleBatchStatusChange(key),
  };

  return (
    <div style={{ padding: '16px' }}>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Spin spinning={funnelLoading}>
              <div style={{ height: 120 }}>
                <ReactECharts
                  option={getFunnelOption()}
                  style={{ height: '100%', width: '100%' }}
                  opts={{ renderer: 'svg' }}
                />
              </div>
            </Spin>
          </Col>
          <Col xs={24} md={18}>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12} md={8}>
                <Search
                  placeholder="搜索求职者姓名、岗位"
                  allowClear
                  enterButton={<SearchOutlined />}
                  size="middle"
                  onSearch={handleSearch}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Select
                  placeholder="岗位"
                  allowClear
                  style={{ width: '100%' }}
                  onChange={(value) => handleFilterChange('jobId', value)}
                  showSearch
                  optionFilterProp="children"
                >
                  {jobOptions.map((job) => (
                    <Option key={job.id} value={job.id}>
                      {job.title}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={12} sm={6}>
                <Select
                  placeholder="状态"
                  allowClear
                  style={{ width: '100%' }}
                  onChange={(value) => handleFilterChange('status', value)}
                >
                  {statusOptions.map((item) => (
                    <Option key={item.value} value={item.value}>
                      <Tag color={item.color}>{item.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12}>
                <RangePicker
                  style={{ width: '100%' }}
                  onChange={handleDateChange}
                  placeholder={['开始日期', '结束日期']}
                />
              </Col>
            </Row>

            {selectedRowKeys.length > 0 && (
              <Row gutter={[16, 16]} style={{ marginBottom: 16, padding: 12, background: '#f0f5ff', borderRadius: 8 }}>
                <Col span={24}>
                  <Space>
                    <span>已选择 <strong>{selectedRowKeys.length}</strong> 条记录</span>
                    <Dropdown menu={batchStatusMenu} trigger={['click']}>
                      <Button size="small">
                        批量更新状态 <DownOutlined />
                      </Button>
                    </Dropdown>
                    <Popconfirm
                      title="确认删除"
                      description="确定要删除选中的记录吗？"
                      onConfirm={handleBatchDelete}
                      okText="确认"
                      cancelText="取消"
                      okType="danger"
                    >
                      <Button size="small" danger icon={<DeleteOutlined />}>
                        批量删除
                      </Button>
                    </Popconfirm>
                    <Button size="small" onClick={() => setSelectedRowKeys([])}>
                      取消选择
                    </Button>
                  </Space>
                </Col>
              </Row>
            )}
          </Col>
        </Row>
      </Card>

      <Card>
        <Spin spinning={loading}>
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 900, y: 'calc(100vh - 420px)' }}
            responsive
            onRow={(record) => ({
              onClick: (e) => {
                if (!e.target.closest('button') && !e.target.closest('.ant-dropdown')) {
                  navigate(`/applications/${record.id}`);
                }
              },
              style: { cursor: 'pointer' },
            })}
          />
        </Spin>
      </Card>

      <Modal
        title="编辑备注"
        open={remarkModalVisible}
        onCancel={() => setRemarkModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={remarkForm}
          layout="vertical"
          onFinish={handleSaveRemark}
        >
          <Form.Item
            name="remark"
            label="备注内容"
            rules={[{ required: true, message: '请输入备注内容' }]}
          >
            <TextArea rows={4} placeholder="请输入备注内容" maxLength={500} showCount />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setRemarkModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Applications;
