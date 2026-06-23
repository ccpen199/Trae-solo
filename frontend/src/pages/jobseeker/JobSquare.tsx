import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Input,
  Select,
  Tag,
  message,
  Row,
  Col,
  Typography,
  Pagination,
  Empty,
  Drawer,
  Form,
  Radio,
  Slider,
  Checkbox,
} from 'antd';
import {
  SearchOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  MoneyCollectOutlined,
  FilterOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Job } from '../../types';
import { jobs, jobseeker } from '../../api/endpoints';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const industries = [
  { value: 'packaging', label: '包装印刷' },
  { value: 'publishing', label: '出版印刷' },
  { value: 'commercial', label: '商业印刷' },
  { value: 'label', label: '标签印刷' },
  { value: 'flexo', label: '柔版印刷' },
];

const processTypes = [
  { value: 'offset', label: '胶印' },
  { value: 'gravure', label: '凹印' },
  { value: 'flexo', label: '柔印' },
  { value: 'screen', label: '丝印' },
  { value: 'digital', label: '数码印刷' },
];

const equipmentTypes = [
  { value: 'heidelberg', label: '海德堡' },
  { value: 'komori', label: '小森' },
  { value: 'roland', label: '罗兰' },
  { value: 'kba', label: '高宝' },
  { value: 'ryobi', label: '良明' },
];

const locations = [
  { value: 'beijing', label: '北京' },
  { value: 'shanghai', label: '上海' },
  { value: 'guangzhou', label: '广州' },
  { value: 'shenzhen', label: '深圳' },
  { value: 'hangzhou', label: '杭州' },
  { value: 'suzhou', label: '苏州' },
  { value: 'dongguan', label: '东莞' },
];

const JobSquare = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [form] = Form.useForm();
  const [quickFilters, setQuickFilters] = useState<{
    industry?: string;
    location?: string;
    processType?: string;
    equipmentType?: string;
  }>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        pageSize,
        keyword,
        ...quickFilters,
        ...form.getFieldsValue(),
      };
      const response = await jobs.list(params);
      const list = response.data?.list || response.data?.data || response.data || [];
      const total = response.data?.total ?? 0;
      setData(list);
      setTotal(total);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, quickFilters]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleApply = async (jobId: number) => {
    try {
      const result = await jobseeker.apply(jobId);
      if (result.success) {
        message.success('申请成功！企业将尽快与您联系');
      }
    } catch (error) {
      message.error('申请失败，请稍后重试');
    }
  };

  const handleFilterReset = () => {
    form.resetFields();
  };

  const handleFilterSubmit = () => {
    setPage(1);
    fetchData();
    setFilterVisible(false);
  };

  const getSalaryText = (record: Job) => {
    if (record.salaryMin && record.salaryMax) {
      return `${record.salaryMin}K - ${record.salaryMax}K`;
    }
    return '面议';
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      active: { color: 'green', text: '招聘中' },
      paused: { color: 'orange', text: '已暂停' },
      closed: { color: 'default', text: '已关闭' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <ShopOutlined /> 求职广场
          </Title>
        </Col>
        <Col>
          <Button icon={<FilterOutlined />} onClick={() => setFilterVisible(true)}>
            筛选
          </Button>
        </Col>
      </Row>

      <Card style={{ marginBottom: '16px' }}>
        <Space style={{ width: '100%' }} wrap>
          <Search
            placeholder="搜索岗位名称、公司、技能关键词"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 380 }}
            onSearch={handleSearch}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Select
            placeholder="行业筛选"
            allowClear
            style={{ width: 160 }}
            value={quickFilters.industry}
            onChange={(value) => {
              setQuickFilters(prev => ({ ...prev, industry: value }));
              setPage(1);
            }}
          >
            {industries.map(item => (
              <Option key={item.value} value={item.value}>{item.label}</Option>
            ))}
          </Select>
          <Select
            placeholder="地点筛选"
            allowClear
            style={{ width: 140 }}
            value={quickFilters.location}
            onChange={(value) => {
              setQuickFilters(prev => ({ ...prev, location: value }));
              setPage(1);
            }}
          >
            {locations.map(item => (
              <Option key={item.value} value={item.value}>{item.label}</Option>
            ))}
          </Select>
          <Select
            placeholder="工艺类型"
            allowClear
            style={{ width: 140 }}
            value={quickFilters.processType}
            onChange={(value) => {
              setQuickFilters(prev => ({ ...prev, processType: value }));
              setPage(1);
            }}
          >
            {processTypes.map(item => (
              <Option key={item.value} value={item.value}>{item.label}</Option>
            ))}
          </Select>
          <Select
            placeholder="设备类型"
            allowClear
            style={{ width: 140 }}
            value={quickFilters.equipmentType}
            onChange={(value) => {
              setQuickFilters(prev => ({ ...prev, equipmentType: value }));
              setPage(1);
            }}
          >
            {equipmentTypes.map(item => (
              <Option key={item.value} value={item.value}>{item.label}</Option>
            ))}
          </Select>
          <Button type="primary" onClick={handleSearch}>查询</Button>
        </Space>
      </Card>

      {loading ? (
        <Card loading />
      ) : data.length === 0 ? (
        <Empty description="暂无符合条件的岗位" />
      ) : (
        <Row gutter={[16, 16]}>
          {data.map(job => (
            <Col xs={24} sm={12} lg={8} key={job.id}>
              <Card
                hoverable
                onClick={() => navigate(`/jobseeker/jobs/${job.id}`)}
                actions={[
                  <Button
                    type="primary"
                    size="small"
                    icon={<SendOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApply(job.id);
                    }}
                  >
                    申请岗位
                  </Button>,
                ]}
              >
                <div style={{ marginBottom: '12px' }}>
                  <Space align="start" style={{ width: '100%' }}>
                    <div style={{ flex: 1 }}>
                      <Title level={5} style={{ margin: 0, marginBottom: '4px' }}>
                        {job.title}
                      </Title>
                      <Text type="secondary" style={{ fontSize: '13px' }}>
                        {job.company?.companyName || '某印刷企业'}
                      </Text>
                    </div>
                    {getStatusTag(job.status)}
                  </Space>
                </div>

                <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: '12px' }}>
                  <div>
                    <MoneyCollectOutlined style={{ color: '#faad14', marginRight: '4px' }} />
                    <Text strong style={{ color: '#faad14' }}>{getSalaryText(job)}</Text>
                  </div>
                  <div>
                    <EnvironmentOutlined style={{ color: '#1890ff', marginRight: '4px' }} />
                    <Text>{job.workLocation || '地点待定'}</Text>
                  </div>
                  {job.jobType && (
                    <div>
                      <Text type="secondary">{job.jobType}</Text>
                    </div>
                  )}
                </Space>

                {job.requiredSkills && job.requiredSkills.length > 0 && (
                  <Space wrap size={[4, 4]} style={{ marginBottom: '12px' }}>
                    {job.requiredSkills.slice(0, 3).map((skill, idx) => (
                      <Tag key={idx} color="blue">{skill}</Tag>
                    ))}
                    {job.requiredSkills.length > 3 && (
                      <Tag>等{job.requiredSkills.length}项技能</Tag>
                    )}
                  </Space>
                )}

                <div style={{ color: '#999', fontSize: '12px', textAlign: 'right' }}>
                  发布于 {dayjs(job.createdAt).format('MM-DD')}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <div style={{ marginTop: '24px', textAlign: 'right' }}>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          showSizeChanger
          showQuickJumper
          showTotal={(t) => `共 ${t} 条`}
          onChange={(p, ps) => {
            setPage(p);
            setPageSize(ps);
          }}
        />
      </div>

      <Drawer
        title="高级筛选"
        placement="right"
        width={400}
        open={filterVisible}
        onClose={() => setFilterVisible(false)}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={handleFilterReset}>重置</Button>
            <Button type="primary" onClick={handleFilterSubmit}>确定</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="industry" label="行业">
            <Select placeholder="请选择行业" allowClear>
              {industries.map(item => (
                <Option key={item.value} value={item.value}>{item.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="location" label="工作地点">
            <Select placeholder="请选择地点" allowClear>
              {locations.map(item => (
                <Option key={item.value} value={item.value}>{item.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="processType" label="工艺类型">
            <Checkbox.Group options={processTypes} />
          </Form.Item>
          <Form.Item name="equipmentType" label="设备类型">
            <Checkbox.Group options={equipmentTypes} />
          </Form.Item>
          <Form.Item name="salaryRange" label="薪资范围（K/月）">
            <Slider
              range
              min={0}
              max={50}
              step={1}
              marks={{
                0: '0',
                10: '10K',
                20: '20K',
                30: '30K',
                40: '40K',
                50: '50K+',
              }}
            />
          </Form.Item>
          <Form.Item name="jobType" label="工作性质">
            <Radio.Group>
              <Radio value="full_time">全职</Radio>
              <Radio value="part_time">兼职</Radio>
              <Radio value="contract">合同工</Radio>
              <Radio value="intern">实习</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="experience" label="工作经验">
            <Select placeholder="请选择" allowClear>
              <Option value="0">不限</Option>
              <Option value="1">1年以内</Option>
              <Option value="3">1-3年</Option>
              <Option value="5">3-5年</Option>
              <Option value="10">5-10年</Option>
              <Option value="99">10年以上</Option>
            </Select>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default JobSquare;
