import React, { useState } from 'react';
import {
  Card,
  Table,
  Input,
  Select,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Tabs,
  List,
  Switch,
  Popconfirm,
  message,
  Typography,
  Drawer,
  Divider,
  Badge,
  Descriptions,
  DatePicker,
  Checkbox
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SmileOutlined,
  MehOutlined,
  FrownOutlined,
  BellOutlined,
  BookOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import type { NewsItem, Keyword, Region, SubscriptionTopic } from '../types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const sentimentColors = {
  positive: '#52c41a',
  neutral: '#1890ff',
  negative: '#ff4d4f'
};

const riskLevelColors = {
  low: '#52c41a',
  medium: '#faad14',
  high: '#ff4d4f',
  critical: '#722ed1'
};

const riskLevelText = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  critical: '紧急'
};

const sentimentText = {
  positive: '正面',
  neutral: '中性',
  negative: '负面'
};

const Monitoring: React.FC = () => {
  const {
    newsItems,
    keywords,
    regions,
    subscriptionTopics,
    selectedNewsItem,
    setSelectedNewsItem,
    markNewsAsRead,
    toggleKeywordMonitor,
    addKeyword,
    updateKeyword,
    deleteKeyword,
    toggleRegionMonitor,
    addRegion,
    updateRegion,
    deleteRegion,
    addSubscriptionTopic,
    updateSubscriptionTopic,
    deleteSubscriptionTopic
  } = useAppStore();
  
  const [activeTab, setActiveTab] = useState('news');
  const [searchText, setSearchText] = useState('');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  
  const [keywordModalVisible, setKeywordModalVisible] = useState(false);
  const [regionModalVisible, setRegionModalVisible] = useState(false);
  const [topicModalVisible, setTopicModalVisible] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [editingTopic, setEditingTopic] = useState<SubscriptionTopic | null>(null);
  const [newsDetailVisible, setNewsDetailVisible] = useState(false);
  
  const [keywordForm] = Form.useForm();
  const [regionForm] = Form.useForm();
  const [topicForm] = Form.useForm();
  
  const filteredNews = newsItems.filter(item => {
    let match = true;
    
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      match = match && (
        item.title.toLowerCase().includes(searchLower) ||
        item.summary.toLowerCase().includes(searchLower) ||
        item.keywords.some(k => k.toLowerCase().includes(searchLower))
      );
    }
    
    if (selectedRiskLevel !== 'all') {
      match = match && item.riskLevel === selectedRiskLevel;
    }
    
    if (selectedSentiment !== 'all') {
      match = match && item.sentiment === selectedSentiment;
    }
    
    if (selectedRegion !== 'all') {
      match = match && item.region === selectedRegion;
    }
    
    if (dateRange) {
      const publishDate = dayjs(item.publishTime);
      match = match && publishDate.isAfter(dateRange[0]) && publishDate.isBefore(dateRange[1].add(1, 'day'));
    }
    
    return match;
  });
  
  const handleViewNews = (news: NewsItem) => {
    setSelectedNewsItem(news);
    setNewsDetailVisible(true);
    if (!news.read) {
      markNewsAsRead(news.id);
    }
  };
  
  const handleAddKeyword = () => {
    setEditingKeyword(null);
    keywordForm.resetFields();
    setKeywordModalVisible(true);
  };
  
  const handleEditKeyword = (keyword: Keyword) => {
    setEditingKeyword(keyword);
    keywordForm.setFieldsValue({
      word: keyword.word,
      category: keyword.category,
      priority: keyword.priority,
      monitorStatus: keyword.monitorStatus === 'active'
    });
    setKeywordModalVisible(true);
  };
  
  const handleSubmitKeyword = () => {
    keywordForm.validateFields().then(values => {
      const monitorStatus: 'active' | 'paused' = values.monitorStatus ? 'active' : 'paused';
      const keywordData = {
        word: values.word,
        category: values.category,
        priority: values.priority,
        monitorStatus,
        matchCount: editingKeyword?.matchCount || 0
      };
      
      if (editingKeyword) {
        updateKeyword(editingKeyword.id, keywordData);
        message.success('更新成功');
      } else {
        addKeyword(keywordData);
        message.success('添加成功');
      }
      
      setKeywordModalVisible(false);
    });
  };
  
  const handleAddRegion = () => {
    setEditingRegion(null);
    regionForm.resetFields();
    setRegionModalVisible(true);
  };
  
  const handleEditRegion = (region: Region) => {
    setEditingRegion(region);
    regionForm.setFieldsValue({
      name: region.name,
      code: region.code,
      level: region.level,
      monitorStatus: region.monitorStatus === 'active'
    });
    setRegionModalVisible(true);
  };
  
  const handleSubmitRegion = () => {
    regionForm.validateFields().then(values => {
      const monitorStatus: 'active' | 'paused' = values.monitorStatus ? 'active' : 'paused';
      const regionData = {
        name: values.name,
        code: values.code,
        level: values.level,
        monitorStatus,
        newsCount: editingRegion?.newsCount || 0,
        lat: editingRegion?.lat || 0,
        lng: editingRegion?.lng || 0
      };
      
      if (editingRegion) {
        updateRegion(editingRegion.id, regionData);
        message.success('更新成功');
      } else {
        addRegion(regionData);
        message.success('添加成功');
      }
      
      setRegionModalVisible(false);
    });
  };
  
  const handleAddTopic = () => {
    setEditingTopic(null);
    topicForm.resetFields();
    setTopicModalVisible(true);
  };
  
  const handleEditTopic = (topic: SubscriptionTopic) => {
    setEditingTopic(topic);
    topicForm.setFieldsValue({
      name: topic.name,
      description: topic.description,
      keywords: topic.keywords,
      regions: topic.regions,
      notifyMethods: topic.notifyMethods
    });
    setTopicModalVisible(true);
  };
  
  const handleSubmitTopic = () => {
    topicForm.validateFields().then(values => {
      const topicData = {
        name: values.name,
        description: values.description,
        keywords: values.keywords || [],
        regions: values.regions || [],
        sources: [],
        notifyMethods: values.notifyMethods || []
      };
      
      if (editingTopic) {
        updateSubscriptionTopic(editingTopic.id, topicData);
        message.success('更新成功');
      } else {
        addSubscriptionTopic(topicData);
        message.success('添加成功');
      }
      
      setTopicModalVisible(false);
    });
  };
  
  const newsColumns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 300,
      render: (text: string, record: NewsItem) => (
        <Text strong={!record.read} style={{ color: record.read ? '#666' : '#333' }}>
          {text}
        </Text>
      )
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100
    },
    {
      title: '关键词',
      dataIndex: 'keywords',
      key: 'keywords',
      width: 200,
      render: (keywords: string[]) => (
        <Space size={[0, 4]} wrap>
          {keywords.slice(0, 3).map((k, i) => (
            <Tag key={i} color="blue">{k}</Tag>
          ))}
          {keywords.length > 3 && <Tag>+{keywords.length - 3}</Tag>}
        </Space>
      )
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (level: NewsItem['riskLevel']) => (
        <Tag color={riskLevelColors[level]}>{riskLevelText[level]}</Tag>
      )
    },
    {
      title: '情感倾向',
      dataIndex: 'sentiment',
      key: 'sentiment',
      width: 80,
      render: (sentiment: NewsItem['sentiment']) => {
        const icons = {
          positive: <SmileOutlined style={{ color: sentimentColors.positive }} />,
          neutral: <MehOutlined style={{ color: sentimentColors.neutral }} />,
          negative: <FrownOutlined style={{ color: sentimentColors.negative }} />
        };
        return (
          <Space>
            {icons[sentiment]}
            <Text style={{ color: sentimentColors[sentiment] }}>{sentimentText[sentiment]}</Text>
          </Space>
        );
      }
    },
    {
      title: '地区',
      dataIndex: 'region',
      key: 'region',
      width: 80
    },
    {
      title: '发布时间',
      dataIndex: 'publishTime',
      key: 'publishTime',
      width: 160
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: NewsItem) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewNews(record)}
        >
          查看
        </Button>
      )
    }
  ];
  
  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane
          tab={
            <span>
              <BookOutlined />
              舆情列表
            </span>
          }
          key="news"
        >
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Space wrap>
                <Input
                  placeholder="搜索标题、摘要、关键词"
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 300 }}
                  allowClear
                />
                
                <Select
                  placeholder="风险等级"
                  value={selectedRiskLevel}
                  onChange={setSelectedRiskLevel}
                  style={{ width: 120 }}
                  allowClear
                >
                  <Option value="all">全部</Option>
                  <Option value="low">低风险</Option>
                  <Option value="medium">中风险</Option>
                  <Option value="high">高风险</Option>
                  <Option value="critical">紧急</Option>
                </Select>
                
                <Select
                  placeholder="情感倾向"
                  value={selectedSentiment}
                  onChange={setSelectedSentiment}
                  style={{ width: 120 }}
                  allowClear
                >
                  <Option value="all">全部</Option>
                  <Option value="positive">正面</Option>
                  <Option value="neutral">中性</Option>
                  <Option value="negative">负面</Option>
                </Select>
                
                <Select
                  placeholder="地区"
                  value={selectedRegion}
                  onChange={setSelectedRegion}
                  style={{ width: 150 }}
                  allowClear
                >
                  <Option value="all">全部</Option>
                  {regions.map(r => (
                    <Option key={r.id} value={r.name}>{r.name}</Option>
                  ))}
                </Select>
                
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                />
                
                <Button
                  type="primary"
                  icon={<FilterOutlined />}
                  onClick={() => {
                    setSearchText('');
                    setSelectedRiskLevel('all');
                    setSelectedSentiment('all');
                    setSelectedRegion('all');
                    setDateRange(null);
                  }}
                >
                  重置筛选
                </Button>
              </Space>
            </div>
            
            <Table
              columns={newsColumns}
              dataSource={filteredNews}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`
              }}
            />
          </Card>
        </TabPane>
        
        <TabPane
          tab={
            <span>
              <SearchOutlined />
              关键词管理
            </span>
          }
          key="keywords"
        >
          <Card>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddKeyword}
              >
                添加关键词
              </Button>
            </div>
            
            <List
              dataSource={keywords}
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4 }}
              renderItem={(item) => (
                <List.Item>
                  <Card
                    title={
                      <Space>
                        <Text strong>{item.word}</Text>
                        <Tag color={
                          item.priority === 'high' ? 'red' :
                          item.priority === 'medium' ? 'orange' : 'blue'
                        }>
                          {item.priority === 'high' ? '高优先级' :
                           item.priority === 'medium' ? '中优先级' : '低优先级'}
                        </Tag>
                      </Space>
                    }
                    extra={
                      <Switch
                        checked={item.monitorStatus === 'active'}
                        onChange={() => toggleKeywordMonitor(item.id)}
                        checkedChildren="监控中"
                        unCheckedChildren="已暂停"
                      />
                    }
                  >
                    <Text type="secondary">分类：{item.category}</Text>
                    <br />
                    <Badge count={item.matchCount} showZero color="#1890ff">
                      <Text type="secondary">匹配次数</Text>
                    </Badge>
                    
                    <Divider style={{ margin: '12px 0' }} />
                    
                    <Space>
                      <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleEditKeyword(item)}
                      >
                        编辑
                      </Button>
                      <Popconfirm
                        title="确定要删除这个关键词吗？"
                        onConfirm={() => {
                          deleteKeyword(item.id);
                          message.success('删除成功');
                        }}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                        >
                          删除
                        </Button>
                      </Popconfirm>
                    </Space>
                  </Card>
                </List.Item>
              )}
            />
          </Card>
        </TabPane>
        
        <TabPane
          tab={
            <span>
              <GlobalOutlined />
              地区管理
            </span>
          }
          key="regions"
        >
          <Card>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddRegion}
              >
                添加地区
              </Button>
            </div>
            
            <Table
              dataSource={regions}
              rowKey="id"
              columns={[
                {
                  title: '地区名称',
                  dataIndex: 'name',
                  key: 'name'
                },
                {
                  title: '行政代码',
                  dataIndex: 'code',
                  key: 'code'
                },
                {
                  title: '级别',
                  dataIndex: 'level',
                  key: 'level',
                  render: (level: Region['level']) => (
                    <Tag>
                      {level === 'province' ? '省级' :
                       level === 'city' ? '市级' : '区级'}
                    </Tag>
                  )
                },
                {
                  title: '监控状态',
                  dataIndex: 'monitorStatus',
                  key: 'monitorStatus',
                  render: (status: Region['monitorStatus'], record: Region) => (
                    <Space>
                      <Tag color={status === 'active' ? 'green' : 'red'}>
                        {status === 'active' ? '监控中' : '已暂停'}
                      </Tag>
                      <Switch
                        checked={status === 'active'}
                        onChange={() => toggleRegionMonitor(record.id)}
                        size="small"
                      />
                    </Space>
                  )
                },
                {
                  title: '操作',
                  key: 'action',
                  render: (_: any, record: Region) => (
                    <Space>
                      <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleEditRegion(record)}
                      >
                        编辑
                      </Button>
                      <Popconfirm
                        title="确定要删除这个地区吗？"
                        onConfirm={() => {
                          deleteRegion(record.id);
                          message.success('删除成功');
                        }}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                        >
                          删除
                        </Button>
                      </Popconfirm>
                    </Space>
                  )
                }
              ]}
              pagination={false}
            />
          </Card>
        </TabPane>
        
        <TabPane
          tab={
            <span>
              <BellOutlined />
              订阅主题
            </span>
          }
          key="topics"
        >
          <Card>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddTopic}
              >
                添加订阅
              </Button>
            </div>
            
            <List
              dataSource={subscriptionTopics}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => handleEditTopic(item)}
                    >
                      编辑
                    </Button>,
                    <Popconfirm
                      title="确定要删除这个订阅吗？"
                      onConfirm={() => {
                        deleteSubscriptionTopic(item.id);
                        message.success('删除成功');
                      }}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                      >
                        删除
                      </Button>
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{item.name}</Text>
                        <Text type="secondary">创建于：{item.createdAt}</Text>
                      </Space>
                    }
                    description={
                      <div>
                        <Paragraph type="secondary" style={{ marginBottom: 8 }}>
                          {item.description}
                        </Paragraph>
                        <Space wrap>
                          <Text type="secondary">关键词：</Text>
                          {item.keywords.map((k, i) => (
                            <Tag key={i} color="blue">{k}</Tag>
                          ))}
                          {item.keywords.length === 0 && <Tag>无</Tag>}
                        </Space>
                        <br />
                        <Space wrap style={{ marginTop: 8 }}>
                          <Text type="secondary">地区：</Text>
                          {item.regions.map((r, i) => {
                            const region = regions.find(reg => reg.id === r);
                            return <Tag key={i} color="green">{region?.name || r}</Tag>;
                          })}
                          {item.regions.length === 0 && <Tag>无</Tag>}
                        </Space>
                        <br />
                        <Space wrap style={{ marginTop: 8 }}>
                          <Text type="secondary">通知方式：</Text>
                          {item.notifyMethods.includes('email') && <Tag>邮件</Tag>}
                          {item.notifyMethods.includes('sms') && <Tag color="orange">短信</Tag>}
                          {item.notifyMethods.includes('app') && <Tag color="purple">APP</Tag>}
                          {item.notifyMethods.length === 0 && <Tag>无</Tag>}
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </TabPane>
      </Tabs>
      
      <Drawer
        title="舆情详情"
        width={720}
        open={newsDetailVisible}
        onClose={() => setNewsDetailVisible(false)}
        footer={null}
      >
        {selectedNewsItem && (
          <div>
            <Title level={4}>{selectedNewsItem.title}</Title>
            
            <Space wrap style={{ marginBottom: 24 }}>
              <Tag color="blue">{selectedNewsItem.source}</Tag>
              <Tag color={riskLevelColors[selectedNewsItem.riskLevel]}>
                {riskLevelText[selectedNewsItem.riskLevel]}
              </Tag>
              <Tag color={sentimentColors[selectedNewsItem.sentiment]}>
                {sentimentText[selectedNewsItem.sentiment]}
              </Tag>
              <Text type="secondary">发布时间：{selectedNewsItem.publishTime}</Text>
            </Space>
            
            <Divider />
            
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="地区">{selectedNewsItem.region}</Descriptions.Item>
              <Descriptions.Item label="来源类型">
                {selectedNewsItem.sourceType === 'news' ? '新闻源' :
                 selectedNewsItem.sourceType === 'rss' ? 'RSS源' : '天气源'}
              </Descriptions.Item>
              <Descriptions.Item label="关键词">
                <Space wrap>
                  {selectedNewsItem.keywords.map((k, i) => (
                    <Tag key={i}>{k}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="原文链接">
                <a href={selectedNewsItem.url} target="_blank" rel="noopener noreferrer">
                  {selectedNewsItem.url}
                </a>
              </Descriptions.Item>
            </Descriptions>
            
            <Divider />
            
            <Title level={5}>摘要</Title>
            <Paragraph>{selectedNewsItem.summary}</Paragraph>
            
            <Divider />
            
            <Title level={5}>正文</Title>
            <Paragraph>{selectedNewsItem.content}</Paragraph>
          </div>
        )}
      </Drawer>
      
      <Modal
        title={editingKeyword ? '编辑关键词' : '添加关键词'}
        open={keywordModalVisible}
        onOk={handleSubmitKeyword}
        onCancel={() => setKeywordModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form
          form={keywordForm}
          layout="vertical"
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="word"
            label="关键词"
            rules={[{ required: true, message: '请输入关键词' }]}
          >
            <Input placeholder="请输入关键词" />
          </Form.Item>
          
          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="请选择分类">
              <Option value="政策">政策</Option>
              <Option value="质量">质量</Option>
              <Option value="安全">安全</Option>
              <Option value="消费">消费</Option>
              <Option value="天气">天气</Option>
              <Option value="经济">经济</Option>
              <Option value="环境">环境</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="priority"
            label="优先级"
            rules={[{ required: true, message: '请选择优先级' }]}
          >
            <Select placeholder="请选择优先级">
              <Option value="high">高</Option>
              <Option value="medium">中</Option>
              <Option value="low">低</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="monitorStatus"
            label="监控状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="监控中" unCheckedChildren="已暂停" />
          </Form.Item>
        </Form>
      </Modal>
      
      <Modal
        title={editingRegion ? '编辑地区' : '添加地区'}
        open={regionModalVisible}
        onOk={handleSubmitRegion}
        onCancel={() => setRegionModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form
          form={regionForm}
          layout="vertical"
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="name"
            label="地区名称"
            rules={[{ required: true, message: '请输入地区名称' }]}
          >
            <Input placeholder="请输入地区名称" />
          </Form.Item>
          
          <Form.Item
            name="code"
            label="行政代码"
            rules={[{ required: true, message: '请输入行政代码' }]}
          >
            <Input placeholder="请输入行政代码" />
          </Form.Item>
          
          <Form.Item
            name="level"
            label="级别"
            rules={[{ required: true, message: '请选择级别' }]}
          >
            <Select placeholder="请选择级别">
              <Option value="province">省级</Option>
              <Option value="city">市级</Option>
              <Option value="district">区级</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="monitorStatus"
            label="监控状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="监控中" unCheckedChildren="已暂停" />
          </Form.Item>
        </Form>
      </Modal>
      
      <Modal
        title={editingTopic ? '编辑订阅' : '添加订阅'}
        open={topicModalVisible}
        onOk={handleSubmitTopic}
        onCancel={() => setTopicModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form
          form={topicForm}
          layout="vertical"
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="name"
            label="订阅名称"
            rules={[{ required: true, message: '请输入订阅名称' }]}
          >
            <Input placeholder="请输入订阅名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          
          <Form.Item
            name="keywords"
            label="关键词"
          >
            <Select
              mode="multiple"
              placeholder="请选择关键词"
              style={{ width: '100%' }}
            >
              {keywords.map(k => (
                <Option key={k.id} value={k.word}>{k.word}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="regions"
            label="地区"
          >
            <Select
              mode="multiple"
              placeholder="请选择地区"
              style={{ width: '100%' }}
            >
              {regions.map(r => (
                <Option key={r.id} value={r.id}>{r.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="notifyMethods"
            label="通知方式"
          >
            <Checkbox.Group>
              <Space>
                <Checkbox value="email">邮件</Checkbox>
                <Checkbox value="sms">短信</Checkbox>
                <Checkbox value="app">APP推送</Checkbox>
              </Space>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Monitoring;
