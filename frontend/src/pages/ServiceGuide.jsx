import React, { useState, useEffect } from 'react';
import { 
  Card, Input, Button, List, Steps, Tag, message, Spin, 
  Row, Col, Alert, Timeline, Space, Divider, Empty
} from 'antd';
import { 
  SearchOutlined, 
  FileTextOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  FireOutlined,
  HistoryOutlined,
  BulbOutlined,
  ArrowRightOutlined,
  IdcardOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const { Step } = Steps;
const { Search } = Input;

function ServiceGuide() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [searchHistory, setSearchHistory] = useState([]);
  const [hotServices, setHotServices] = useState([]);
  const [quickQuestions] = useState([
    '我要办理身份证',
    '社保怎么转移',
    '医保报销流程',
    '公积金怎么提取',
    '营业执照办理'
  ]);

  useEffect(() => {
    loadHotServices();
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history).slice(0, 5));
    }
  }, []);

  const loadHotServices = async () => {
    try {
      const data = await api.get('/services/items?hot=1');
      setHotServices(data.slice(0, 6));
    } catch (err) {
      console.error(err);
    }
  };

  const handleGuide = async (searchQuery = query) => {
    if (!searchQuery.trim()) {
      message.warning('请输入您要办理的事项');
      return;
    }

    setLoading(true);
    setCurrentStep(1);
    setQuery(searchQuery);

    try {
      const data = await api.post('/services/guide', { query: searchQuery });
      setResult(data);
      setCurrentStep(3);

      const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    } catch (err) {
      message.error('智能导办失败');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    handleGuide(question);
  };

  const handleApplyNow = (serviceId) => {
    navigate(`/apply/${serviceId}`);
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>
          <SearchOutlined style={{ marginRight: 8 }} />
          智能导办
        </h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: 24 }}>
          AI智能分析您的需求，匹配最佳服务事项，提供一站式办理指引
        </p>

        <Steps current={currentStep} style={{ maxWidth: 600, margin: '0 auto 32px' }}>
          <Step 
            title="语义识别" 
            description="分析您的需求"
            icon={<SearchOutlined />}
          />
          <Step 
            title="事项匹配" 
            description="匹配服务事项"
            icon={<FileTextOutlined />}
          />
          <Step 
            title="材料预检" 
            description="检查所需材料"
            icon={<CheckCircleOutlined />}
          />
          <Step 
            title="一键办理" 
            description="直达办理页面"
            icon={<ArrowRightOutlined />}
          />
        </Steps>

        <div style={{ maxWidth: 600, margin: '0 auto 32px' }}>
          <Search
            size="large"
            placeholder="请输入您要办理的事项，例如：我要办理身份证、社保怎么转..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onSearch={handleGuide}
            enterButton={
              <Button type="primary" size="large" loading={loading}>
                智能导办
              </Button>
            }
          />
        </div>

        {searchHistory.length > 0 && (
          <div style={{ maxWidth: 600, margin: '0 auto 16px' }}>
            <Space>
              <HistoryOutlined style={{ color: '#999' }} />
              <span style={{ color: '#999' }}>搜索历史：</span>
              {searchHistory.map((item, idx) => (
                <Tag 
                  key={idx} 
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleGuide(item)}
                >
                  {item}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        <div style={{ maxWidth: 600, margin: '0 auto 24px' }}>
          <Space wrap>
            <BulbOutlined style={{ color: '#faad14' }} />
            <span style={{ color: '#999' }}>大家都在问：</span>
            {quickQuestions.map((q, idx) => (
              <Tag 
                key={idx} 
                color="blue"
                style={{ cursor: 'pointer' }}
                onClick={() => handleQuickQuestion(q)}
              >
                {q}
              </Tag>
            ))}
          </Space>
        </div>
      </Card>

      {loading && (
        <Card>
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>正在分析您的需求...</p>
            <Timeline style={{ maxWidth: 400, margin: '32px auto 0', textAlign: 'left' }}>
              <Timeline.Item color="blue">正在进行语义分析...</Timeline.Item>
              <Timeline.Item color="gray">匹配服务事项</Timeline.Item>
              <Timeline.Item color="gray">生成材料清单</Timeline.Item>
            </Timeline>
          </div>
        </Card>
      )}

      {result && !loading && (
        <Card
          title={
            <Space>
              <BulbOutlined style={{ color: '#faad14' }} />
              <span>为您找到 {result.matchedServices.length} 个相关服务</span>
            </Space>
          }
          style={{ maxWidth: 900, margin: '0 auto' }}
          extra={
            <Button type="link" onClick={() => {
              setResult(null);
              setCurrentStep(0);
            }}>
              重新搜索
            </Button>
          }
        >
          <Alert
            message={`根据"${result.query}"，为您推荐以下服务`}
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <List
            dataSource={result.matchedServices}
            renderItem={(item, index) => (
              <Card 
                key={item.id}
                style={{ marginBottom: 16 }}
                size="small"
                title={
                  <Space>
                    <Tag color="red">{index === 0 ? '最匹配' : `匹配度 ${100 - index * 15}%`}</Tag>
                    <span style={{ fontSize: 16, fontWeight: 'bold' }}>{item.name}</span>
                    <Tag color="blue">{item.department}</Tag>
                  </Space>
                }
                extra={
                  <Space>
                    <Button onClick={() => navigate(`/services/${item.id}`)}>
                      查看详情
                    </Button>
                    <Button 
                      type="primary" 
                      onClick={() => handleApplyNow(item.id)}
                      icon={<ArrowRightOutlined />}
                    >
                      立即办理
                    </Button>
                  </Space>
                }
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <p style={{ margin: 0 }}>
                      <ClockCircleOutlined style={{ marginRight: 8, color: '#faad14' }} />
                      办理时限：{item.handling_time}
                    </p>
                  </Col>
                  <Col xs={24} md={12}>
                    <p style={{ margin: 0 }}>
                      <IdcardOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                      预计需 {3 + index} 份材料
                    </p>
                  </Col>
                </Row>

                <Divider style={{ margin: '12px 0' }} />

                <div>
                  <p style={{ marginBottom: 8 }}>
                    <FileTextOutlined style={{ marginRight: 8 }} />
                    <strong>所需材料（系统可自动核验电子证照）：</strong>
                  </p>
                  <Space wrap>
                    {['身份证明', '申请表', '相关证明材料'].map((mat, idx) => (
                      <Tag key={idx} color="success">
                        <CheckCircleOutlined /> {mat}
                      </Tag>
                    ))}
                  </Space>
                </div>
              </Card>
            )}
          />

          <Alert
            message="办理流程指引"
            description={
              <ol style={{ margin: 0, paddingLeft: 20 }}>
                <li>点击"立即办理"进入办理页面</li>
                <li>选择个人/法人办理方式</li>
                <li>系统自动调用电子证照进行核验</li>
                <li>上传所需材料（电子证照可复用）</li>
                <li>填写申请信息并提交</li>
                <li>在"我的办件"中跟踪办理进度</li>
              </ol>
            }
            type="info"
            showIcon
          />
        </Card>
      )}

      {!result && !loading && (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card 
              title={
                <Space>
                  <FireOutlined style={{ color: '#fa541c' }} />
                  热门服务
                </Space>
              }
              extra={
                <Button type="link" onClick={() => navigate('/services')}>
                  查看全部
                </Button>
              }
            >
              <List
                dataSource={hotServices}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={() => handleApplyNow(item.id)}
                      >
                        办理
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={item.name}
                      description={
                        <Space>
                          <Tag color="blue">{item.department?.slice(0, 6)}</Tag>
                          <span style={{ color: '#999' }}>{item.handling_time}</span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card 
              title={
                <Space>
                  <BulbOutlined style={{ color: '#faad14' }} />
                  办理指南
                </Space>
              }
            >
              <Timeline>
                <Timeline.Item color="blue">
                  <strong>智能导办</strong>
                  <p style={{ color: '#666', margin: 0 }}>输入您的需求，AI自动匹配服务</p>
                </Timeline.Item>
                <Timeline.Item color="green">
                  <strong>材料预检</strong>
                  <p style={{ color: '#666', margin: 0 }}>系统检查所需材料，支持电子证照</p>
                </Timeline.Item>
                <Timeline.Item color="orange">
                  <strong>在线办理</strong>
                  <p style={{ color: '#666', margin: 0 }}>填写信息，提交申请</p>
                </Timeline.Item>
                <Timeline.Item>
                  <strong>进度跟踪</strong>
                  <p style={{ color: '#666', margin: 0 }}>实时查看办理进度，接收通知</p>
                </Timeline.Item>
                <Timeline.Item color="gray">
                  <strong>结果送达</strong>
                  <p style={{ color: '#666', margin: 0 }}>在线查看结果，电子证照自动入库</p>
                </Timeline.Item>
              </Timeline>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}

export default ServiceGuide;
