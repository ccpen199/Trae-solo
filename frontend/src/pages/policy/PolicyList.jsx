import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Tabs,
  Tag,
  Button,
  Space,
  List,
  Input,
  Pagination,
  Skeleton,
  Empty,
  Typography,
  Menu,
  message,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  StarOutlined,
  StarFilled,
  EyeOutlined,
  FireOutlined,
  TeamOutlined,
  AppstoreOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useRequest from '../../hooks/useRequest';
import {
  getPolicies,
  getPolicy3DSearch,
  getPolicyCategories,
  getHotPolicies,
} from '../../api/policy';

const { Title, Text } = Typography;
const { Search } = Input;

const searchDimensions = [
  {
    key: 'population',
    label: '按人群检索',
    icon: <TeamOutlined />,
    options: [
      { key: 'insured', label: '参保人' },
      { key: 'jobseeker', label: '求职者' },
      { key: 'retiree', label: '退休人员' },
      { key: 'hr', label: '企业HR' },
      { key: 'grassroots', label: '基层经办' },
    ],
  },
  {
    key: 'matter',
    label: '按事项检索',
    icon: <AppstoreOutlined />,
    options: [
      { key: 'social_insurance', label: '社保参保' },
      { key: 'benefits', label: '待遇领取' },
      { key: 'employment', label: '就业创业' },
      { key: 'exam', label: '人事考试' },
      { key: 'training', label: '技能培训' },
    ],
  },
  {
    key: 'region',
    label: '按地域检索',
    icon: <EnvironmentOutlined />,
    options: [
      { key: 'provincial', label: '省本级' },
      { key: 'city', label: '各市' },
      { key: 'district', label: '区县' },
    ],
  },
];

const policyCategories = [
  { key: 'all', label: '全部政策', icon: '📋' },
  { key: 'pension', label: '养老保险', icon: '👴' },
  { key: 'medical', label: '医疗保险', icon: '🏥' },
  { key: 'unemployment', label: '失业保险', icon: '📋' },
  { key: 'injury', label: '工伤保险', icon: '⚕️' },
  { key: 'maternity', label: '生育保险', icon: '👶' },
  { key: 'employment_startup', label: '就业创业', icon: '💼' },
  { key: 'personnel', label: '人事人才', icon: '🎓' },
  { key: 'labor', label: '劳动关系', icon: '🤝' },
];

const mockPolicies = [
  {
    id: 1,
    title: '关于完善企业职工基本养老保险制度的实施意见',
    issuer: '人力资源社会保障部',
    issueDate: '2024-01-15',
    type: 'national',
    typeLabel: '国家级',
    typeColor: '#F5222D',
    category: 'pension',
    targetPopulations: ['参保人', '退休人员'],
    views: 12580,
    isFavorite: false,
  },
  {
    id: 2,
    title: '关于优化营商环境进一步促进就业创业的通知',
    issuer: '省人力资源社会保障厅',
    issueDate: '2024-01-10',
    type: 'provincial',
    typeLabel: '省级',
    typeColor: '#1E6FDB',
    category: 'employment_startup',
    targetPopulations: ['求职者', '企业HR'],
    views: 8956,
    isFavorite: true,
  },
  {
    id: 3,
    title: '关于调整2024年度社会保险缴费基数的通知',
    issuer: '市人力资源社会保障局',
    issueDate: '2024-01-05',
    type: 'municipal',
    typeLabel: '市级',
    typeColor: '#52C41A',
    category: 'medical',
    targetPopulations: ['参保人', '企业HR'],
    views: 15620,
    isFavorite: false,
  },
  {
    id: 4,
    title: '关于做好2024年度人事考试工作的通知',
    issuer: '省人力资源社会保障厅',
    issueDate: '2023-12-28',
    type: 'provincial',
    typeLabel: '省级',
    typeColor: '#1E6FDB',
    category: 'personnel',
    targetPopulations: ['求职者', '基层经办'],
    views: 6780,
    isFavorite: false,
  },
  {
    id: 5,
    title: '关于加强技能人才队伍建设的实施办法',
    issuer: '人力资源社会保障部',
    issueDate: '2023-12-20',
    type: 'national',
    typeLabel: '国家级',
    typeColor: '#F5222D',
    category: 'employment_startup',
    targetPopulations: ['参保人', '求职者'],
    views: 9870,
    isFavorite: false,
  },
  {
    id: 6,
    title: '关于完善工伤保险待遇调整机制的意见',
    issuer: '人力资源社会保障部',
    issueDate: '2023-12-15',
    type: 'national',
    typeLabel: '国家级',
    typeColor: '#F5222D',
    category: 'injury',
    targetPopulations: ['参保人', '企业HR'],
    views: 5430,
    isFavorite: true,
  },
];

const mockHotPolicies = [
  { id: 1, title: '2024年养老金调整方案解读', views: 25680 },
  { id: 2, title: '社保缴费基数上下限公布', views: 19850 },
  { id: 3, title: '失业保险金申领指南', views: 15620 },
  { id: 4, title: '灵活就业人员参保政策', views: 12340 },
  { id: 5, title: '技能提升补贴申请流程', views: 10560 },
];

const PolicyList = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('population');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedOptions, setSelectedOptions] = useState({
    population: null,
    matter: null,
    region: null,
  });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState({});

  const { loading: policiesLoading, data: policiesData } = useRequest(getPolicies, {
    onError: () => {
      message.error('获取政策列表失败');
    },
  });

  const { loading: categoriesLoading } = useRequest(getPolicyCategories, {
    onError: () => {
      message.error('获取政策分类失败');
    },
  });

  const { loading: hotLoading, data: hotPoliciesData } = useRequest(getHotPolicies, {
    onError: () => {
      message.error('获取热门政策失败');
    },
  });

  const { run: search3D } = useRequest(getPolicy3DSearch, {
    manual: true,
    onError: () => {
      message.error('检索失败');
    },
  });

  const displayPolicies = policiesData?.list || mockPolicies;
  const displayHotPolicies = hotPoliciesData || mockHotPolicies;

  const handleOptionClick = (dimensionKey, optionKey) => {
    const newSelected = {
      ...selectedOptions,
      [dimensionKey]: selectedOptions[dimensionKey] === optionKey ? null : optionKey,
    };
    setSelectedOptions(newSelected);
    search3D(newSelected);
  };

  const handleCategoryClick = (categoryKey) => {
    setSelectedCategory(categoryKey);
    setCurrentPage(1);
  };

  const handleSearch = (value) => {
    setSearchKeyword(value);
    setCurrentPage(1);
  };

  const handleViewDetail = (id) => {
    navigate(`/policy/list/${id}`);
  };

  const handleToggleFavorite = (id) => {
    const newFavorites = {
      ...favorites,
      [id]: !favorites[id],
    };
    setFavorites(newFavorites);
    message.success(newFavorites[id] ? '已添加收藏' : '已取消收藏');
  };

  const filteredPolicies = displayPolicies.filter((policy) => {
    if (selectedCategory !== 'all' && policy.category !== selectedCategory) {
      return false;
    }
    if (searchKeyword && !policy.title.includes(searchKeyword)) {
      return false;
    }
    return true;
  });

  const pageSize = 5;
  const paginatedPolicies = filteredPolicies.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (policiesLoading || categoriesLoading || hotLoading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 15 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>政策法规</Title>
        <Search
          placeholder="搜索政策标题..."
          allowClear
          enterButton={<SearchOutlined />}
          size="middle"
          onSearch={handleSearch}
          style={{ width: 320 }}
        />
      </div>

      <Card
        style={{ marginBottom: 24 }}
        title={
          <Space>
            <SearchOutlined style={{ color: '#1E6FDB' }} />
            三维检索
          </Space>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={searchDimensions.map((dim) => ({
            key: dim.key,
            label: (
              <Space>
                {dim.icon}
                {dim.label}
              </Space>
            ),
            children: (
              <Space wrap>
                {dim.options.map((opt) => (
                  <Tag.CheckableTag
                    key={opt.key}
                    checked={selectedOptions[dim.key] === opt.key}
                    onChange={() => handleOptionClick(dim.key, opt.key)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 6,
                      fontSize: 14,
                      borderColor: selectedOptions[dim.key] === opt.key ? '#1E6FDB' : '#d9d9d9',
                      background: selectedOptions[dim.key] === opt.key ? '#E6F4FF' : '#fff',
                      color: selectedOptions[dim.key] === opt.key ? '#1E6FDB' : '#666',
                    }}
                  >
                    {opt.label}
                  </Tag.CheckableTag>
                ))}
              </Space>
            ),
          }))}
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={5}>
          <Card
            title={
              <Space>
                <AppstoreOutlined style={{ color: '#1E6FDB' }} />
                政策分类
              </Space>
            }
          >
            <Menu
              mode="inline"
              selectedKeys={[selectedCategory]}
              onClick={({ key }) => handleCategoryClick(key)}
              style={{ border: 'none' }}
              items={policyCategories.map((cat) => ({
                key: cat.key,
                label: (
                  <Space>
                    <span>{cat.icon}</span>
                    {cat.label}
                  </Space>
                ),
              }))}
            />
          </Card>

          <Card
            style={{ marginTop: 16 }}
            title={
              <Space>
                <FireOutlined style={{ color: '#FAAD14' }} />
                热门政策排行
              </Space>
            }
          >
            <List
              dataSource={displayHotPolicies}
              locale={{ emptyText: <Empty description="暂无热门政策" /> }}
              renderItem={(item, index) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    padding: '12px 0',
                    borderBottom: index < displayHotPolicies.length - 1 ? '1px solid #f0f0f0' : 'none',
                  }}
                  onClick={() => handleViewDetail(item.id)}
                >
                  <Space style={{ width: '100%' }}>
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: index < 3 ? '#FAAD14' : '#d9d9d9',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 'bold',
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </span>
                    <Text
                      ellipsis
                      style={{
                        flex: 1,
                        color: index < 3 ? '#1E6FDB' : '#666',
                        fontWeight: index < 3 ? 500 : 400,
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.views?.toLocaleString()}
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} sm={24} md={19}>
          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: '#1E6FDB' }} />
                政策列表
                <Tag color="blue">{filteredPolicies.length} 条</Tag>
              </Space>
            }
            extra={
              <Text type="secondary">
                共 {filteredPolicies.length} 条政策
              </Text>
            }
          >
            {paginatedPolicies.length === 0 ? (
              <Empty description="暂无相关政策" />
            ) : (
              <>
                {paginatedPolicies.map((policy) => (
                  <Card
                    key={policy.id}
                    size="small"
                    style={{
                      marginBottom: 16,
                      borderRadius: 8,
                      border: '1px solid #f0f0f0',
                    }}
                    bodyStyle={{ padding: 20 }}
                    hoverable
                    onClick={() => handleViewDetail(policy.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, marginRight: 16 }}>
                        <Space wrap style={{ marginBottom: 8 }}>
                          <Tag color={policy.typeColor}>{policy.typeLabel}</Tag>
                          {policy.targetPopulations?.map((pop) => (
                            <Tag key={pop} color="blue" style={{ background: '#E6F4FF', color: '#1E6FDB' }}>
                              {pop}
                            </Tag>
                          ))}
                        </Space>
                        <Title
                          level={5}
                          style={{
                            margin: '8px 0',
                            color: '#333',
                            cursor: 'pointer',
                          }}
                        >
                          {policy.title}
                        </Title>
                        <Space wrap style={{ color: '#999', fontSize: 13 }}>
                          <span>发布机构：{policy.issuer}</span>
                          <span>|</span>
                          <span>发布日期：{policy.issueDate}</span>
                          <span>|</span>
                          <Space>
                            <EyeOutlined />
                            {policy.views?.toLocaleString()} 次浏览
                          </Space>
                        </Space>
                      </div>
                      <Space style={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                        <Tooltip title={favorites[policy.id] || policy.isFavorite ? '取消收藏' : '收藏'}>
                          <Button
                            type="text"
                            icon={favorites[policy.id] || policy.isFavorite ? <StarFilled style={{ color: '#FAAD14' }} /> : <StarOutlined />}
                            onClick={() => handleToggleFavorite(policy.id)}
                          />
                        </Tooltip>
                        <Button
                          type="primary"
                          onClick={() => handleViewDetail(policy.id)}
                          style={{ background: '#1E6FDB' }}
                        >
                          查看详情
                        </Button>
                      </Space>
                    </div>
                  </Card>
                ))}
                <div style={{ marginTop: 24, textAlign: 'center' }}>
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={filteredPolicies.length}
                    onChange={setCurrentPage}
                    showSizeChanger={false}
                    showQuickJumper
                    showTotal={(total) => `共 ${total} 条`}
                  />
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const FileTextOutlined = (props) => (
  <span {...props} role="img" aria-label="file-text" style={{ fontSize: 16 }}>
    📄
  </span>
);

export default PolicyList;
