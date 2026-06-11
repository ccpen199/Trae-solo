import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Tag,
  Space,
  Modal,
  Form,
  Spin,
  message,
  Card,
  Popconfirm,
  Row,
  Col,
  InputNumber,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  SendOutlined,
  EditOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { offers, candidates, jobs } from '../api';
import { useAuth } from '../context/AuthContext';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

const statusMap = {
  draft: { color: 'default', text: '草稿' },
  sent: { color: 'blue', text: '已发送' },
  signed: { color: 'green', text: '已签署' },
  rejected: { color: 'red', text: '已拒绝' },
  withdrawn: { color: 'orange', text: '已撤回' },
};

function Offers() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({
    keyword: '',
    status: undefined,
    dateRange: undefined,
    jobId: undefined,
  });
  const [candidateOptions, setCandidateOptions] = useState([]);
  const [jobOptions, setJobOptions] = useState([]);

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        keyword: filters.keyword,
        status: filters.status,
        jobId: filters.jobId,
      };
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }
      const res = await offers.getList(params);
      if (res.code === 0) {
        setData(res.data.list);
        setPagination({
          current: page,
          pageSize,
          total: res.data.total,
        });
      } else {
        message.error(res.message || '获取Offer列表失败');
      }
    } catch (err) {
      console.error('获取Offer列表失败:', err);
      message.error('获取Offer列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [candidatesRes, jobsRes] = await Promise.all([
        candidates.getList({ pageSize: 100 }),
        jobs.getList({ pageSize: 100 }),
      ]);
      if (candidatesRes.code === 0) {
        setCandidateOptions(
          candidatesRes.data.list.map((c) => ({
            value: c.id,
            label: c.name,
          }))
        );
      }
      if (jobsRes.code === 0) {
        setJobOptions(
          jobsRes.data.list.map((j) => ({
            value: j.id,
            label: j.title,
          }))
        );
      }
    } catch (err) {
      console.error('获取选项失败:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
      fetchOptions();
    }
  }, [token, filters]);

  const handleSearch = (value) => {
    setFilters((prev) => ({ ...prev, keyword: value }));
  };

  const handleStatusChange = (value) => {
    setFilters((prev) => ({ ...prev, status: value }));
  };

  const handleDateChange = (dates) => {
    setFilters((prev) => ({ ...prev, dateRange: dates }));
  };

  const handleJobChange = (value) => {
    setFilters((prev) => ({ ...prev, jobId: value }));
  };

  const handleTableChange = (pag) => {
    fetchData(pag.current, pag.pageSize);
  };

  const handleCreate = () => {
    setModalVisible(true);
    form.resetFields();
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        joinDate: values.joinDate.format('YYYY-MM-DD'),
        validUntil: values.validUntil.format('YYYY-MM-DD'),
      };
      const res = await offers.create(data);
      if (res.code === 0) {
        message.success('创建Offer成功');
        setModalVisible(false);
        fetchData(pagination.current, pagination.pageSize);
      } else {
        message.error(res.message || '创建Offer失败');
      }
    } catch (err) {
      console.error('创建Offer失败:', err);
      if (err.errorFields) return;
      message.error('创建Offer失败，请稍后重试');
    }
  };

  const handleSend = async (id) => {
    try {
      const res = await offers.send(id);
      if (res.code === 0) {
        message.success('Offer已发送');
        fetchData(pagination.current, pagination.pageSize);
      } else {
        message.error(res.message || '发送Offer失败');
      }
    } catch (err) {
      console.error('发送Offer失败:', err);
      message.error('发送Offer失败，请稍后重试');
    }
  };

  const handleWithdraw = async (id) => {
    try {
      const res = await offers.withdraw(id);
      if (res.code === 0) {
        message.success('Offer已撤回');
        fetchData(pagination.current, pagination.pageSize);
      } else {
        message.error(res.message || '撤回Offer失败');
      }
    } catch (err) {
      console.error('撤回Offer失败:', err);
      message.error('撤回Offer失败，请稍后重试');
    }
  };

  const handleSign = async (id) => {
    try {
      const res = await offers.sign(id, { signature: '模拟签名' });
      if (res.code === 0) {
        message.success('Offer已签署');
        fetchData(pagination.current, pagination.pageSize);
      } else {
        message.error(res.message || '签署Offer失败');
      }
    } catch (err) {
      console.error('签署Offer失败:', err);
      message.error('签署Offer失败，请稍后重试');
    }
  };

  const columns = [
    {
      title: '候选人',
      dataIndex: 'candidateName',
      key: 'candidateName',
      render: (text) => <span>{text}</span>,
    },
    {
      title: '岗位',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      render: (text) => <span>{text}</span>,
    },
    {
      title: '薪资',
      dataIndex: 'salary',
      key: 'salary',
      render: (text, record) => (
        <span>
          {record.salaryMin}K - {record.salaryMax}K
        </span>
      ),
    },
    {
      title: '发送时间',
      dataIndex: 'sentAt',
      key: 'sentAt',
      render: (text) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '有效期',
      dataIndex: 'validUntil',
      key: 'validUntil',
      render: (text) => (text ? dayjs(text).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/offers/${record.id}`)}
          >
            详情
          </Button>
          {record.status === 'draft' && (
            <Button
              type="link"
              size="small"
              icon={<SendOutlined />}
              onClick={() => handleSend(record.id)}
            >
              发送
            </Button>
          )}
          {record.status === 'sent' && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleSign(record.id)}
            >
              签署
            </Button>
          )}
          {(record.status === 'sent' || record.status === 'draft') && (
            <Popconfirm
              title="确认撤回此Offer？"
              onConfirm={() => handleWithdraw(record.id)}
              okText="确认"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<RollbackOutlined />}>
                撤回
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Offer管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建Offer
          </Button>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Search
              placeholder="搜索候选人/岗位"
              allowClear
              onSearch={handleSearch}
              onChange={(e) => {
                if (!e.target.value) handleSearch('');
              }}
              icon={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="选择状态"
              allowClear
              style={{ width: '100%' }}
              onChange={handleStatusChange}
            >
              <Option value="draft">草稿</Option>
              <Option value="sent">已发送</Option>
              <Option value="signed">已签署</Option>
              <Option value="rejected">已拒绝</Option>
              <Option value="withdrawn">已撤回</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <RangePicker style={{ width: '100%' }} onChange={handleDateChange} />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="选择岗位"
              allowClear
              style={{ width: '100%' }}
              onChange={handleJobChange}
              options={jobOptions}
            />
          </Col>
        </Row>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 900 }}
          />
        )}
      </Card>

      <Modal
        title="新建Offer"
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        okText="创建"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="candidateId"
                label="候选人"
                rules={[{ required: true, message: '请选择候选人' }]}
              >
                <Select placeholder="请选择候选人" options={candidateOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="jobId"
                label="岗位"
                rules={[{ required: true, message: '请选择岗位' }]}
              >
                <Select placeholder="请选择岗位" options={jobOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="salaryMin"
                label="最低薪资(K)"
                rules={[{ required: true, message: '请输入最低薪资' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入最低薪资" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="salaryMax"
                label="最高薪资(K)"
                rules={[{ required: true, message: '请输入最高薪资' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入最高薪资" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="joinDate"
                label="入职时间"
                rules={[{ required: true, message: '请选择入职时间' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="probationMonths"
                label="试用期(月)"
                rules={[{ required: true, message: '请输入试用期' }]}
              >
                <InputNumber min={0} max={6} style={{ width: '100%' }} placeholder="请输入试用期" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="validUntil"
            label="Offer有效期"
            rules={[{ required: true, message: '请选择有效期' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item
            name="benefits"
            label="福利待遇"
            rules={[{ required: true, message: '请输入福利待遇' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="如：五险一金、年终奖、带薪年假等"
            />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Offers;
