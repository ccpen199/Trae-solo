import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Tag, Input, Modal, message, Space, Timeline, Alert, Steps } from 'antd';
import { SearchOutlined, SafetyOutlined, WarningOutlined, FireOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { safetyAPI } from '../api';
import { useNavigate } from 'react-router-dom';

const SafetyKnowledge = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentArticle, setCurrentArticle] = useState(null);
  const [arVisible, setArVisible] = useState(false);

  useEffect(() => {
    loadArticles();
  }, [category, keyword]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const res = await safetyAPI.getSafetyKnowledge({ category, keyword });
      setArticles(res.data || []);
    } catch (err) {
      message.error('加载安全知识失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await safetyAPI.getSafetyKnowledgeDetail(id);
      setCurrentArticle(res.data);
      setDetailVisible(true);
    } catch (err) {
      message.error('加载文章详情失败');
    }
  };

  const categories = [
    { key: 'all', label: '全部', icon: <SafetyOutlined /> },
    { key: 'leak', label: '泄漏处置', icon: <WarningOutlined />, color: '#f5222d' },
    { key: 'usage', label: '安全用气', icon: <FireOutlined />, color: '#fa8c16' },
    { key: 'appliance', label: '燃具使用', icon: <SafetyOutlined />, color: '#1890ff' },
    { key: 'emergency', label: '应急预案', icon: <WarningOutlined />, color: '#eb2f96' },
  ];

  const arSteps = [
    { title: '关闭阀门', description: '立即关闭燃气表前阀门' },
    { title: '开窗通风', description: '打开门窗，保持空气流通' },
    { title: '杜绝火源', description: '禁止开关电器、使用明火' },
    { title: '撤离现场', description: '迅速撤离到安全区域' },
    { title: '报警求助', description: '拨打96777燃气抢修热线' },
  ];

  const getCategoryColor = (cat) => {
    const item = categories.find(c => c.key === cat);
    return item?.color || '#1890ff';
  };

  const getCategoryLabel = (cat) => {
    const item = categories.find(c => c.key === cat);
    return item?.label || cat;
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>燃气安全知识库</h2>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          学习安全用气知识，掌握应急处置技能，守护您和家人的安全
        </p>
      </Card>

      <Alert
        message="如遇燃气泄漏，请保持冷静，按照AR指引正确处置"
        type="warning"
        showIcon
        action={
          <Button size="small" type="primary" danger icon={<PlayCircleOutlined />} onClick={() => setArVisible(true)}>
            启动AR指引
          </Button>
        }
        style={{ marginBottom: 16 }}
      />

      <Card style={{ marginBottom: 16 }}>
        <Space wrap size={[8, 8]}>
          {categories.map(cat => (
            <Button
              key={cat.key}
              type={category === cat.key ? 'primary' : 'default'}
              icon={cat.icon}
              onClick={() => setCategory(cat.key)}
            >
              {cat.label}
            </Button>
          ))}
        </Space>
        <div style={{ marginTop: 16 }}>
          <Input.Search
            placeholder="搜索安全知识..."
            size="large"
            enterButton={<SearchOutlined />}
            onSearch={setKeyword}
          />
        </div>
      </Card>

      <Card bordered={false} loading={loading}>
        <Row gutter={[16, 16]}>
          {articles.map(article => (
            <Col span={12} key={article.id}>
              <Card
                hoverable
                onClick={() => handleViewDetail(article.id)}
                actions={[
                  <span style={{ color: '#999' }}>阅读 {article.views || 0}</span>,
                  <Button type="text">查看详情</Button>,
                ]}
              >
                <Card.Meta
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 16 }}>{article.title}</span>
                      <Tag color={getCategoryColor(article.category)}>{getCategoryLabel(article.category)}</Tag>
                    </div>
                  }
                  description={
                    <div>
                      <p style={{ color: '#666', margin: '8px 0' }}>
                        {article.summary || article.content.substring(0, 80)}...
                      </p>
                      {article.has_ar && (
                        <Tag color="red" icon={<PlayCircleOutlined />}>含AR指引</Tag>
                      )}
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Modal
        title={currentArticle?.title}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {currentArticle && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Tag color={getCategoryColor(currentArticle.category)}>
                {getCategoryLabel(currentArticle.category)}
              </Tag>
              <span style={{ color: '#999' }}>阅读 {currentArticle.views || 0}</span>
              {currentArticle.has_ar && (
                <Button size="small" type="primary" danger icon={<PlayCircleOutlined />} onClick={() => { setDetailVisible(false); setArVisible(true); }}>
                  AR模拟演练
                </Button>
              )}
            </Space>
            <div
              style={{ lineHeight: 1.8, fontSize: 15, color: '#333' }}
              dangerouslySetInnerHTML={{ __html: currentArticle.content }}
            />
            {currentArticle.steps && currentArticle.steps.length > 0 && (
              <Card title="操作步骤" size="small" style={{ marginTop: 16, background: '#fafafa' }}>
                <Steps
                  direction="vertical"
                  items={currentArticle.steps.map(step => ({
                    title: step.title,
                    description: step.description,
                  }))}
                />
              </Card>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="燃气泄漏应急处置AR指引"
        open={arVisible}
        onCancel={() => setArVisible(false)}
        footer={[
          <Button key="close" onClick={() => setArVisible(false)}>
            关闭
          </Button>,
        ]}
        width={900}
      >
        <Alert
          message="这是模拟AR指引，实际使用时请配合手机摄像头识别真实场景"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <div style={{
          height: 300,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          marginBottom: 16,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ textAlign: 'center', zIndex: 1 }}>
            <PlayCircleOutlined style={{ fontSize: 64, marginBottom: 16 }} />
            <h3 style={{ color: 'white', margin: 0 }}>AR场景模拟中...</h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '8px 0 0 0' }}>
              扫描室内环境，识别燃气阀门位置
            </p>
          </div>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 200,
            height: 200,
            border: '4px solid rgba(255,255,255,0.3)',
            borderRadius: '50%',
            animation: 'pulse 2s infinite',
          }} />
        </div>
        <Steps
          direction="vertical"
          current={2}
          items={arSteps.map(step => ({
            title: step.title,
            description: step.description,
            status: arSteps.indexOf(step) < 2 ? 'finish' : arSteps.indexOf(step) === 2 ? 'process' : 'wait',
          }))}
        />
        <Card size="small" style={{ marginTop: 16, background: '#fff7e6' }}>
          <Space>
            <WarningOutlined style={{ color: '#fa8c16', fontSize: 24 }} />
            <div>
              <p style={{ margin: 0, fontWeight: 'bold' }}>重要提示</p>
              <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: 12 }}>
                发生燃气泄漏时，严禁开关任何电器（包括电灯、排风扇、冰箱等），严禁使用明火，
                严禁在现场拨打电话，应迅速撤离到安全区域后再报警。
              </p>
            </div>
          </Space>
        </Card>
      </Modal>
    </div>
  );
};

export default SafetyKnowledge;
