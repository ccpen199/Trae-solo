import { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  List,
  Tag,
  Button,
  Space,
  Modal,
  Cascader,
  Empty,
  Skeleton,
  Typography,
  message,
  Tooltip,
  Input,
  Divider,
  Avatar,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  StarOutlined,
  StarFilled,
  ShareAltOutlined,
  FireOutlined,
  CalendarOutlined,
  TeamOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import useRequest from '../../hooks/useRequest';
import {
  getPolicies,
  getPolicy3DSearch,
  getPolicy,
  getHotPolicies,
  getPolicyCategories,
} from '../../api/policy';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

const crowdOptions = [
  { value: 'insured', label: '参保人' },
  { value: 'jobseeker', label: '求职者' },
  { value: 'retiree', label: '退休人员' },
  { value: 'hr', label: '企业HR' },
  { value: 'agent', label: '基层经办' },
];

const matterOptions = [
  { value: 'registration', label: '参保登记' },
  { value: 'benefits', label: '待遇领取' },
  { value: 'employment', label: '就业创业' },
  { value: 'exam', label: '人事考试' },
  { value: 'certificate', label: '证书办理' },
  { value: 'transfer', label: '关系转移' },
];

const regionOptions = [
  {
    value: 'guangdong',
    label: '广东省',
    children: [
      {
        value: 'guangzhou',
        label: '广州市',
        children: [
          { value: 'tianhe', label: '天河区' },
          { value: 'yuexiu', label: '越秀区' },
          { value: 'haizhu', label: '海珠区' },
        ],
      },
      {
        value: 'shenzhen',
        label: '深圳市',
        children: [
          { value: 'nanshan', label: '南山区' },
          { value: 'futian', label: '福田区' },
          { value: 'luohu', label: '罗湖区' },
        ],
      },
    ],
  },
  {
    value: 'beijing',
    label: '北京市',
    children: [
      {
        value: 'beijing-city',
        label: '北京市',
        children: [
          { value: 'chaoyang', label: '朝阳区' },
          { value: 'haidian', label: '海淀区' },
          { value: 'xicheng', label: '西城区' },
        ],
      },
    ],
  },
];

const mockPolicies = [
  {
    id: 1,
    title: '关于完善企业职工基本养老保险制度的实施意见',
    issuingAgency: '广东省人力资源和社会保障厅',
    publishTime: '2024-01-15',
    category: '养老保险',
    categoryColor: '#1E6FDB',
    targetCrowd: ['参保人', '企业HR'],
    region: '广东省',
    summary: '为进一步完善企业职工基本养老保险制度，保障参保人员的基本权益，根据国家有关规定，结合我省实际，制定本实施意见。',
    content: '一、总体要求\n\n（一）指导思想。以习近平新时代中国特色社会主义思想为指导，全面贯彻党的二十大精神，坚持以人民为中心的发展思想，按照全覆盖、保基本、多层次、可持续的方针，完善企业职工基本养老保险制度。\n\n（二）主要目标。到2025年，企业职工基本养老保险制度更加完善，参保覆盖面进一步扩大，保障水平稳步提高，基金运行更加稳健，管理服务更加高效。\n\n二、完善参保缴费政策\n\n（一）扩大参保覆盖面。本省行政区域内的企业、事业单位、社会团体、民办非企业单位、基金会、律师事务所、会计师事务所等组织和有雇工的个体工商户及其职工，应当依法参加企业职工基本养老保险。\n\n（二）规范缴费基数。单位缴费基数为本单位职工工资总额，个人缴费基数为本人工资。缴费基数上下限按照全省全口径城镇单位就业人员平均工资的300%和60%确定。',
    relatedPolicies: [
      { id: 2, title: '广东省企业职工基本养老保险省级统筹实施方案' },
      { id: 3, title: '关于灵活就业人员参加企业职工基本养老保险有关问题的通知' },
    ],
    views: 12580,
    favorites: 328,
  },
  {
    id: 2,
    title: '广东省就业创业补贴政策汇编',
    issuingAgency: '广东省人力资源和社会保障厅',
    publishTime: '2024-01-10',
    category: '就业创业',
    categoryColor: '#52C41A',
    targetCrowd: ['求职者', '企业HR'],
    region: '广东省',
    summary: '为进一步做好就业创业工作，支持各类群体就业创业，现将我省就业创业补贴政策汇编发布，包括吸纳就业补贴、创业带动就业补贴、社会保险补贴等。',
    content: '一、吸纳就业补贴\n\n（一）补贴对象。招用就业困难人员、毕业2年内高校毕业生的小微企业。\n\n（二）补贴标准。按每人每月300元给予补贴，补贴期限不超过3年。\n\n二、创业带动就业补贴\n\n（一）补贴对象。初创企业吸纳就业并按规定缴纳社会保险费的。\n\n（二）补贴标准。招用3人及以下的按每人2000元给予补贴，招用4人及以上的每增加1人给予3000元补贴，总额不超过3万元。',
    relatedPolicies: [
      { id: 4, title: '关于做好2024年高校毕业生就业创业工作的通知' },
    ],
    views: 9876,
    favorites: 256,
  },
  {
    id: 3,
    title: '退休人员养老金调整方案',
    issuingAgency: '人力资源和社会保障部',
    publishTime: '2024-01-05',
    category: '养老保险',
    categoryColor: '#1E6FDB',
    targetCrowd: ['退休人员'],
    region: '全国',
    summary: '经党中央、国务院批准，从2024年1月1日起，为2023年底前已按规定办理退休手续并按月领取基本养老金的企业和机关事业单位退休人员提高基本养老金水平。',
    content: '一、调整范围\n\n2023年12月31日前已按规定办理退休手续并按月领取基本养老金的退休人员。\n\n二、调整水平\n\n全国调整比例按照2023年退休人员月人均基本养老金的3%确定。各省以全国调整比例为高限，确定本省调整比例和水平。\n\n三、调整办法\n\n采取定额调整、挂钩调整与适当倾斜相结合的办法，并实现企业和机关事业单位退休人员调整办法统一。',
    relatedPolicies: [
      { id: 1, title: '关于完善企业职工基本养老保险制度的实施意见' },
    ],
    views: 15680,
    favorites: 892,
  },
  {
    id: 4,
    title: '2024年度人事考试工作计划',
    issuingAgency: '广东省人事考试局',
    publishTime: '2024-01-01',
    category: '人事考试',
    categoryColor: '#722ED1',
    targetCrowd: ['求职者', '参保人'],
    region: '广东省',
    summary: '现将2024年度我省人事考试工作计划印发给你们，请按照计划做好各项考试组织实施工作。',
    content: '一、专业技术人员职业资格考试\n\n1. 咨询工程师（投资）：4月13日-14日\n2. 一级建造师：9月7日-8日\n3. 中级注册安全工程师：10月26日-27日\n4. 执业药师：10月19日-20日\n\n二、公务员录用考试\n\n1. 广东省公务员考试：3月16日\n2. 广州市公务员考试：另行通知\n\n三、事业单位公开招聘考试\n\n由各地市根据实际情况自行安排。',
    relatedPolicies: [],
    views: 8560,
    favorites: 198,
  },
  {
    id: 5,
    title: '基层经办服务规范指南',
    issuingAgency: '广东省人力资源和社会保障厅',
    publishTime: '2023-12-28',
    category: '经办服务',
    categoryColor: '#FAAD14',
    targetCrowd: ['基层经办'],
    region: '广东省',
    summary: '为进一步规范基层人力资源和社会保障经办服务工作，提升服务质量和效率，制定本规范指南。',
    content: '一、服务场所规范\n\n（一）环境要求。服务大厅应保持整洁、明亮、通风，配备必要的服务设施和便民措施。\n\n（二）标识设置。应在显著位置设置服务标识、办事指南、流程图、收费标准、监督电话等。\n\n二、服务行为规范\n\n（一）着装要求。工作人员应统一着装，佩戴工作牌，保持仪表整洁。\n\n（二）服务用语。应使用文明规范用语，耐心解答群众咨询。',
    relatedPolicies: [],
    views: 3256,
    favorites: 86,
  },
];

const mockHotPolicies = [
  { id: 3, title: '退休人员养老金调整方案', views: 15680 },
  { id: 1, title: '关于完善企业职工基本养老保险制度的实施意见', views: 12580 },
  { id: 2, title: '广东省就业创业补贴政策汇编', views: 9876 },
  { id: 4, title: '2024年度人事考试工作计划', views: 8560 },
  { id: 5, title: '基层经办服务规范指南', views: 3256 },
];

const ListPage = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedCrowd, setSelectedCrowd] = useState([]);
  const [selectedMatter, setSelectedMatter] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [favorites, setFavorites] = useState({});

  const { loading: policiesLoading } = useRequest(getPolicies, {
    onError: () => message.error('获取政策列表失败'),
  });

  const { loading: hotLoading } = useRequest(getHotPolicies, {
    onError: () => message.error('获取热门政策失败'),
  });

  const { loading: categoriesLoading } = useRequest(getPolicyCategories, {
    onError: () => message.error('获取政策分类失败'),
  });

  const { loading: searchLoading, run: run3DSearch } = useRequest(getPolicy3DSearch, {
    manual: true,
    onError: () => message.error('检索失败'),
  });

  const { loading: detailLoading, run: runGetPolicy } = useRequest(getPolicy, {
    manual: true,
    onError: () => message.error('获取政策详情失败'),
  });

  const filteredPolicies = useMemo(() => {
    let result = [...mockPolicies];
    
    if (searchText) {
      result = result.filter(p => 
        p.title.includes(searchText) || 
        p.summary.includes(searchText)
      );
    }
    
    if (selectedCrowd.length > 0) {
      const crowdLabels = selectedCrowd.map(v => {
        const opt = crowdOptions.find(o => o.value === v);
        return opt?.label;
      }).filter(Boolean);
      result = result.filter(p => 
        p.targetCrowd.some(c => crowdLabels.includes(c))
      );
    }
    
    if (selectedMatter.length > 0) {
      const matterLabels = selectedMatter.map(v => {
        const opt = matterOptions.find(o => o.value === v);
        return opt?.label;
      }).filter(Boolean);
      result = result.filter(p => 
        matterLabels.some(l => p.category.includes(l) || p.title.includes(l))
      );
    }
    
    if (selectedRegion.length > 0) {
      result = result.filter(p => 
        p.region.includes(selectedRegion[0])
      );
    }
    
    return result;
  }, [searchText, selectedCrowd, selectedMatter, selectedRegion]);

  const handleSearch = (value) => {
    setSearchText(value);
    run3DSearch({
      keyword: value,
      crowd: selectedCrowd,
      matter: selectedMatter,
      region: selectedRegion,
    });
  };

  const handle3DSearch = () => {
    run3DSearch({
      crowd: selectedCrowd,
      matter: selectedMatter,
      region: selectedRegion,
    });
    message.success('检索完成');
  };

  const handleReset = () => {
    setSearchText('');
    setSelectedCrowd([]);
    setSelectedMatter([]);
    setSelectedRegion([]);
  };

  const handleViewDetail = (policy) => {
    setSelectedPolicy(policy);
    setDetailModalVisible(true);
    runGetPolicy(policy.id);
  };

  const handleFavorite = (policyId) => {
    setFavorites(prev => ({
      ...prev,
      [policyId]: !prev[policyId],
    }));
    message.success(favorites[policyId] ? '已取消收藏' : '已收藏');
  };

  const handleShare = (policy) => {
    message.success(`已复制《${policy.title}》链接到剪贴板`);
  };

  const handleRelatedPolicyClick = (policyId) => {
    const policy = mockPolicies.find(p => p.id === policyId);
    if (policy) {
      setSelectedPolicy(policy);
      runGetPolicy(policyId);
    }
  };

  const loading = policiesLoading || hotLoading || categoriesLoading || searchLoading;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>政策法规</Title>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card
            title={
              <Space>
                <SearchOutlined style={{ color: '#1E6FDB' }} />
                三维检索
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                <TeamOutlined style={{ marginRight: 4 }} />人群维度
              </Text>
              <Cascader
                style={{ width: '100%' }}
                options={crowdOptions.map(o => ({ ...o, children: [] }))}
                value={selectedCrowd}
                onChange={setSelectedCrowd}
                placeholder="请选择人群"
                multiple
                maxTagCount="responsive"
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                <FileTextOutlined style={{ marginRight: 4 }} />事项维度
              </Text>
              <Cascader
                style={{ width: '100%' }}
                options={matterOptions.map(o => ({ ...o, children: [] }))}
                value={selectedMatter}
                onChange={setSelectedMatter}
                placeholder="请选择事项"
                multiple
                maxTagCount="responsive"
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                <EnvironmentOutlined style={{ marginRight: 4 }} />地域维度
              </Text>
              <Cascader
                style={{ width: '100%' }}
                options={regionOptions}
                value={selectedRegion}
                onChange={setSelectedRegion}
                placeholder="请选择地域"
                expandTrigger="hover"
              />
            </div>

            <Space>
              <Button type="primary" onClick={handle3DSearch} style={{ backgroundColor: '#1E6FDB' }}>
                检索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Card>

          <Card
            title={
              <Space>
                <FireOutlined style={{ color: '#F5222D' }} />
                热门政策排行
              </Space>
            }
            extra={<Tag color="red">TOP 5</Tag>}
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : (
              <List
                dataSource={mockHotPolicies}
                renderItem={(item, index) => (
                  <List.Item
                    style={{ 
                      padding: '12px 0', 
                      cursor: 'pointer',
                      borderBottom: index < mockHotPolicies.length - 1 ? '1px solid #f0f0f0' : 'none',
                    }}
                    onClick={() => handleViewDetail(mockPolicies.find(p => p.id === item.id))}
                  >
                    <Space style={{ width: '100%' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 24,
                          height: 24,
                          borderRadius: 4,
                          background: index < 3 ? '#F5222D' : '#bfbfbf',
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}
                      >
                        {index + 1}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Tooltip title={item.title}>
                          <Text ellipsis style={{ display: 'block' }}>{item.title}</Text>
                        </Tooltip>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.views.toLocaleString()} 次阅读
                        </Text>
                      </div>
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} md={18}>
          <Card
            title={
              <Space style={{ width: '100%' }}>
                <Search
                  placeholder="搜索政策标题、内容..."
                  allowClear
                  enterButton
                  size="large"
                  onSearch={handleSearch}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 400 }}
                />
                <Text type="secondary">共 {filteredPolicies.length} 条政策</Text>
              </Space>
            }
            headStyle={{ padding: '16px 24px' }}
            bodyStyle={{ padding: '16px 24px' }}
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 10 }} />
            ) : filteredPolicies.length === 0 ? (
              <Empty description="未找到相关政策" />
            ) : (
              <List
                dataSource={filteredPolicies}
                renderItem={(item) => (
                  <List.Item
                    style={{
                      padding: '20px 0',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                    actions={[
                      <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetail(item)}
                        key="view"
                      >
                        查看详情
                      </Button>,
                      <Button
                        type="link"
                        icon={favorites[item.id] ? <StarFilled style={{ color: '#FAAD14' }} /> : <StarOutlined />}
                        onClick={() => handleFavorite(item.id)}
                        key="favorite"
                        style={{ color: favorites[item.id] ? '#FAAD14' : undefined }}
                      >
                        {favorites[item.id] ? '已收藏' : '收藏'}
                      </Button>,
                      <Button
                        type="link"
                        icon={<ShareAltOutlined />}
                        onClick={() => handleShare(item)}
                        key="share"
                      >
                        分享
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size={48}
                          style={{ backgroundColor: item.categoryColor }}
                          icon={<FileTextOutlined />}
                        />
                      }
                      title={
                        <Space>
                          <a onClick={() => handleViewDetail(item)} style={{ fontSize: 16, color: '#262626' }}>
                            {item.title}
                          </a>
                        </Space>
                      }
                      description={
                        <div>
                          <Space wrap style={{ marginBottom: 8 }}>
                            <Tag color={item.categoryColor}>{item.category}</Tag>
                            {item.targetCrowd.map(crowd => (
                              <Tag key={crowd} color="blue">{crowd}</Tag>
                            ))}
                            <Tag color="default">
                              <EnvironmentOutlined style={{ marginRight: 4 }} />
                              {item.region}
                            </Tag>
                          </Space>
                          <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8, color: '#595959' }}>
                            {item.summary}
                          </Paragraph>
                          <Space split={<Divider type="vertical" />} size="small">
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              <CalendarOutlined style={{ marginRight: 4 }} />
                              {item.issuingAgency}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {item.publishTime}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {item.views.toLocaleString()} 阅读
                            </Text>
                          </Space>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={selectedPolicy?.title}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="favorite"
            icon={selectedPolicy && favorites[selectedPolicy.id] ? <StarFilled /> : <StarOutlined />}
            onClick={() => selectedPolicy && handleFavorite(selectedPolicy.id)}
          >
            {selectedPolicy && favorites[selectedPolicy.id] ? '已收藏' : '收藏'}
          </Button>,
          <Button
            key="share"
            icon={<ShareAltOutlined />}
            type="primary"
            style={{ backgroundColor: '#1E6FDB' }}
            onClick={() => selectedPolicy && handleShare(selectedPolicy)}
          >
            分享
          </Button>,
        ]}
      >
        {detailLoading ? (
          <Skeleton active paragraph={{ rows: 15 }} />
        ) : selectedPolicy ? (
          <div>
            <Space wrap style={{ marginBottom: 16 }}>
              <Tag color={selectedPolicy.categoryColor}>{selectedPolicy.category}</Tag>
              {selectedPolicy.targetCrowd.map(crowd => (
                <Tag key={crowd} color="blue">{crowd}</Tag>
              ))}
              <Tag color="default">
                <EnvironmentOutlined style={{ marginRight: 4 }} />
                {selectedPolicy.region}
              </Tag>
            </Space>

            <div style={{ marginBottom: 16, color: '#8c8c8c' }}>
              <Space split={<Divider type="vertical" />} size="small">
                <Text type="secondary">发布机构：{selectedPolicy.issuingAgency}</Text>
                <Text type="secondary">发布时间：{selectedPolicy.publishTime}</Text>
                <Text type="secondary">阅读量：{selectedPolicy.views.toLocaleString()}</Text>
              </Space>
            </div>

            <Card title="政策摘要" style={{ marginBottom: 16 }} size="small">
              <Paragraph>{selectedPolicy.summary}</Paragraph>
            </Card>

            <Card title="政策内容" style={{ marginBottom: 16 }} size="small">
              <div style={{ whiteSpace: 'pre-line', lineHeight: 2 }}>
                {selectedPolicy.content}
              </div>
            </Card>

            {selectedPolicy.relatedPolicies && selectedPolicy.relatedPolicies.length > 0 && (
              <Card
                title="相关政策推荐"
                size="small"
                extra={<Tag color="blue">智能推荐</Tag>}
              >
                <List
                  dataSource={selectedPolicy.relatedPolicies}
                  renderItem={(item) => (
                    <List.Item
                      style={{ cursor: 'pointer', color: '#1E6FDB' }}
                      onClick={() => handleRelatedPolicyClick(item.id)}
                    >
                      <FileTextOutlined style={{ marginRight: 8 }} />
                      {item.title}
                    </List.Item>
                  )}
                />
              </Card>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default ListPage;
