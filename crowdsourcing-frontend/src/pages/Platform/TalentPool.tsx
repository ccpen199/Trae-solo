import React, { useState, useEffect } from 'react';
import {
  Card,
  Input,
  Select,
  Slider,
  Button,
  Table,
  Tag,
  Avatar,
  Rate,
  Space,
  Drawer,
  Form,
  Checkbox,
  Spin,
  Empty,
  message
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  SafetyOutlined,
  UserOutlined,
  StarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Provider, TaskCategory, ProviderFilterParams } from '@/types';
import { providerApi } from '@/api';
import ProviderCard from '@/components/ProviderCard';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { Range } = Slider;

const categories: { value: TaskCategory; label: string }[] = [
  { value: 'design', label: '政务办事' },
  { value: 'development', label: '民生服务' },
  { value: 'writing', label: '社区治理' },
  { value: 'marketing', label: '市场监管' },
  { value: 'video', label: '公共安全' },
  { value: 'consulting', label: '数据分析' }
];

const levels = [
  { value: 1, label: '初级' },
  { value: 2, label: '中级' },
  { value: 3, label: '高级' },
  { value: 4, label: '专家' },
  { value: 5, label: '大师' }
];

const locations = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '常州'
];

const sortOptions = [
  { value: 'rating_desc', label: '评分最高' },
  { value: 'completedTasks_desc', label: '成交最多' },
  { value: 'totalEarnings_desc', label: '收入最高' },
  { value: 'responseRate_desc', label: '响应最快' },
  { value: 'createdAt_desc', label: '最新入驻' }
];

const skillOptions = [
  '行政审批', '证件办理', '政策解读', '社保医保', '住房保障', '就业创业',
  '物业管理', '消费维权', '企业登记', '食品安全', '治安管理', '应急管理',
  '数据采集', '统计分析', '决策支持', '法律咨询', '品牌策划', '财务咨询'
];

const PlatformTalentPool: React.FC = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [filterForm] = Form.useForm();
  const [filters, setFilters] = useState<ProviderFilterParams>({
    page: 1,
    pageSize: 12
  });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 12, total: 0 });
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const fetchProviders = async (newFilters?: Partial<ProviderFilterParams>) => {
    try {
      setLoading(true);
      const params: ProviderFilterParams = { ...filters, ...newFilters };
      const result = await providerApi.getList(params);
      setProviders(result.list || []);
      setPagination({
        current: params.page || 1,
        pageSize: params.pageSize || 12,
        total: result.total || 0
      });
      setFilters(params);
    } catch (error) {
      console.error('Fetch providers error:', error);
      message.error('获取服务商列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleSearch = (keyword: string) => {
    fetchProviders({ keyword, page: 1 });
  };

  const handleCategoryChange = (category: TaskCategory) => {
    fetchProviders({ category, page: 1 });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('_');
    fetchProviders({ sortBy, sortOrder: sortOrder as 'asc' | 'desc', page: 1 });
  };

  const handleFilterSubmit = (values: any) => {
    fetchProviders({
      ...values,
      skills: values.skills,
      minRating: values.rating ? values.rating[0] : undefined,
      page: 1
    });
    setFilterDrawerVisible(false);
  };

  const handleReset = () => {
    filterForm.resetFields();
    setFilters({ page: 1, pageSize: 12 });
    fetchProviders({ page: 1, pageSize: 12 });
  };

  const handlePageChange = (page: number, pageSize: number) => {
    fetchProviders({ page, pageSize });
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString('zh-CN')}`;
  };

  const columns = [
    {
      title: '服务商',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Provider) => (
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/platform/talent/${record.id}`)}>
          <Avatar size={48} src={record.avatar} icon={<UserOutlined />}>
            {text?.charAt(0)}
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800 hover:text-primary-700">{text}</span>
              {record.verified && <Tag color="green" icon={<SafetyOutlined />}>已认证</Tag>}
              <Tag color="blue">Lv.{record.level} {record.levelName}</Tag>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Rate disabled allowHalf defaultValue={record.rating} style={{ fontSize: 12 }} />
              <span>({record.reviewCount}条评价)</span>
              {record.location && (
                <span className="flex items-center gap-1">
                  <EnvironmentOutlined /> {record.location}
                </span>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '技能',
      dataIndex: 'skills',
      key: 'skills',
      render: (skills: string[]) => (
        <div className="flex flex-wrap gap-1">
          {skills?.slice(0, 4).map((skill, index) => (
            <Tag key={index} color="blue">{skill}</Tag>
          ))}
          {skills?.length > 4 && <Tag>+{skills.length - 4}</Tag>}
        </div>
      )
    },
    {
      title: '成交数据',
      key: 'stats',
      render: (_: any, record: Provider) => (
        <div>
          <div className="flex items-center gap-1 text-sm">
            <TeamOutlined className="text-gray-400" />
            <span>完成 {record.completedTasks} 个项目</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <StarOutlined className="text-yellow-400" />
            <span>总收入 {formatCurrency(record.totalEarnings)}</span>
          </div>
        </div>
      )
    },
    {
      title: '响应率',
      dataIndex: 'responseRate',
      key: 'responseRate',
      render: (rate: number) => (
        <div>
          <div className="text-lg font-bold text-green-600">{rate}%</div>
          <div className="text-xs text-gray-500">平均响应 - 分钟</div>
        </div>
      ),
      sorter: (a: Provider, b: Provider) => a.responseRate - b.responseRate
    },
    {
      title: '入驻时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      sorter: (a: Provider, b: Provider) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf()
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Provider) => (
        <Space>
          <Button type="primary" onClick={() => navigate(`/platform/talent/${record.id}`)}>
            查看详情
          </Button>
          <Button>
            邀请合作
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-800">人才库</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <Button
                type={viewMode === 'card' ? 'primary' : 'text'}

                onClick={() => setViewMode('card')}
                className="!rounded-md"
              >
                卡片视图
              </Button>
              <Button
                type={viewMode === 'list' ? 'primary' : 'text'}

                onClick={() => setViewMode('list')}
                className="!rounded-md"
              >
                列表视图
              </Button>
            </div>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setFilterDrawerVisible(true)}
            >
              筛选
            </Button>
            <Select
              placeholder="排序方式"
              style={{ width: 140 }}
              onChange={handleSortChange}
              defaultValue="rating_desc"
            >
              {sortOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <Search
            placeholder="搜索服务商名称、技能..."
            allowClear
            enterButton={<SearchOutlined />}

            onSearch={handleSearch}
            style={{ flex: 1 }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type={!filters.category ? 'primary' : 'default'}
              onClick={() => handleCategoryChange(undefined as any)}
            >
              全部
            </Button>
            {categories.map(cat => (
              <Button
                key={cat.value}
                type={filters.category === cat.value ? 'primary' : 'default'}
                onClick={() => handleCategoryChange(cat.value)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="flex justify-center py-16">
            <Spin />
          </div>
        ) : providers.length === 0 ? (
          <Empty description="暂无服务商数据" />
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {providers.map(provider => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onClick={() => navigate(`/platform/talent/${provider.id}`)}
              />
            ))}
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={providers}
            rowKey="id"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 位服务商`,
              onChange: handlePageChange
            }}
            scroll={{ x: 1200 }}
          />
        )}

        {viewMode === 'card' && (
          <div className="flex justify-center mt-6">
            <Button.Group>
              <Button
                disabled={pagination.current === 1}
                onClick={() => handlePageChange(pagination.current - 1, pagination.pageSize)}
              >
                上一页
              </Button>
              <Button>
                {pagination.current} / {Math.ceil(pagination.total / pagination.pageSize) || 1}
              </Button>
              <Button
                disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                onClick={() => handlePageChange(pagination.current + 1, pagination.pageSize)}
              >
                下一页
              </Button>
            </Button.Group>
          </div>
        )}
      </Card>

      <Drawer
        title="筛选条件"
        placement="right"
        width={400}
        open={filterDrawerVisible}
        onClose={() => setFilterDrawerVisible(false)}
        extra={
          <Space>
            <Button onClick={handleReset}>重置</Button>
            <Button type="primary" onClick={filterForm.submit}>
              确定
            </Button>
          </Space>
        }
      >
        <Form
          form={filterForm}
          layout="vertical"
          onFinish={handleFilterSubmit}
        >
          <Form.Item name="category" label="服务分类">
            <Select placeholder="请选择分类" allowClear>
              {categories.map(cat => (
                <Option key={cat.value} value={cat.value}>{cat.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="skills" label="技能标签">
            <Select
              mode="multiple"
              placeholder="请选择技能"
              allowClear
              options={skillOptions.map(s => ({ label: s, value: s }))}
              maxTagCount={5}
            />
          </Form.Item>

          <Form.Item name="level" label="等级">
            <Select placeholder="请选择等级" allowClear>
              {levels.map(l => (
                <Option key={l.value} value={l.value}>{l.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="rating" label="评分范围">
            <Range
              min={0}
              max={5}
              step={0.5}
              marks={{ 0: '0', 2.5: '2.5', 5: '5' }}
            />
          </Form.Item>

          <Form.Item name="location" label="所在地区">
            <Select placeholder="请选择地区" allowClear>
              {locations.map(loc => (
                <Option key={loc} value={loc}>{loc}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="certified" label="资质认证" valuePropName="checked">
            <Checkbox icon={<SafetyOutlined />}>仅显示已认证服务商</Checkbox>
          </Form.Item>

          <Form.Item name="quickResponse" label="快速响应" valuePropName="checked">
            <Checkbox icon={<ThunderboltOutlined />}>仅显示响应率90%以上</Checkbox>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default PlatformTalentPool;