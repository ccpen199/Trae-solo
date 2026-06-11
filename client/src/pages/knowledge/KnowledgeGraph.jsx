import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Spin, message, Button, 
  Space, Tree, Collapse, Row, Col, Tag,
  Empty, Divider, Steps
} from 'antd';
import { 
  BookOutlined, UnorderedListOutlined, 
  HeartOutlined, DollarOutlined, 
  SafetyCertificateOutlined, BulbOutlined,
  FolderOutlined, FileOutlined, CheckCircleOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { adminAPI } from '../../api/index.js';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { Step } = Steps;

const KnowledgeGraph = () => {
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState([]);
  const [flatData, setFlatData] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeTab, setActiveTab] = useState('process');

  const CATEGORIES = [
    { value: 'process', label: '筹备流程', icon: <UnorderedListOutlined />, color: '#1890ff', desc: '从确定婚期到婚礼当天的完整流程' },
    { value: 'etiquette', label: '婚礼礼仪', icon: <BookOutlined />, color: '#722ed1', desc: '传统与现代婚礼礼仪规范' },
    { value: 'budget', label: '预算规划', icon: <DollarOutlined />, color: '#52c41a', desc: '合理分配婚礼各项开支' },
    { value: 'checklist', label: '物品清单', icon: <SafetyCertificateOutlined />, color: '#fa8c16', desc: '婚礼必备物品清单' },
    { value: 'tips', label: '经验分享', icon: <BulbOutlined />, color: '#f5222d', desc: '过来人的实用经验' }
  ];

  const buildTree = (nodes, parentId = 0) => {
    return nodes
      .filter(node => node.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(node => ({
        key: node.id,
        title: (
          <Space>
            {nodes.some(n => n.parent_id === node.id) ? (
              <FolderOutlined style={{ color: '#faad14' }} />
            ) : (
              <FileOutlined style={{ color: '#69c0ff' }} />
            )}
            <span>{node.title}</span>
          </Space>
        ),
        children: buildTree(nodes, node.id),
        data: node
      }));
  };

  const fetchKnowledge = async (category = activeTab) => {
    setLoading(true);
    try {
      const response = await adminAPI.getKnowledge({ category });
      const nodes = response.data;
      setFlatData(nodes);
      setTreeData(buildTree(nodes));
      
      const firstNode = nodes
        .filter(n => n.parent_id === 0)
        .sort((a, b) => a.sort_order - b.sort_order)[0];
      if (firstNode && !selectedNode) {
        setSelectedNode(firstNode);
      }
    } catch (error) {
      message.error('获取知识图谱失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, [activeTab]);

  const handleSelect = (keys) => {
    if (keys.length > 0) {
      const node = flatData.find(n => n.id === keys[0]);
      if (node) {
        setSelectedNode(node);
      }
    }
  };

  const getChildNodes = (parentId) => {
    return flatData
      .filter(n => n.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order);
  };

  const getSiblingNodes = (node) => {
    return flatData
      .filter(n => n.parent_id === node.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order);
  };

  const renderContent = () => {
    if (!selectedNode) {
      return (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <BookOutlined style={{ fontSize: 64, color: '#ddd' }} />
          <Title level={4} style={{ marginTop: 16, color: '#999' }}>
            请选择左侧目录
          </Title>
        </div>
      );
    }

    const siblings = getSiblingNodes(selectedNode);
    const currentIndex = siblings.findIndex(s => s.id === selectedNode.id);
    const children = getChildNodes(selectedNode.id);

    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Tag 
              color={CATEGORIES.find(c => c.value === selectedNode.category)?.color || 'blue'}
              style={{ fontSize: 14, padding: '4px 12px', margin: 0 }}
            >
              {CATEGORIES.find(c => c.value === selectedNode.category)?.label}
            </Tag>
            <Text type="secondary">
              第 {currentIndex + 1} / {siblings.length} 项
            </Text>
          </div>
          <Title level={2} style={{ margin: '8px 0', color: '#333' }}>
            {selectedNode.title}
          </Title>
        </div>

        {children.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <Steps 
              direction="vertical" 
              size="small"
              current={children.length}
              style={{ background: '#fafafa', padding: 20, borderRadius: 12 }}
            >
              {children.map((child, index) => (
                <Step
                  key={child.id}
                  title={
                    <Text strong style={{ cursor: 'pointer' }} onClick={() => setSelectedNode(child)}>
                      {child.title}
                    </Text>
                  }
                  description={
                    child.content ? (
                      <Paragraph style={{ margin: '8px 0 0 0' }} ellipsis={{ rows: 2 }}>
                        {child.content}
                      </Paragraph>
                    ) : null
                  }
                  icon={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />}
                />
              ))}
            </Steps>
          </div>
        )}

        {selectedNode.content && (
          <Card 
            style={{ borderRadius: 12, marginBottom: 24 }}
            bodyStyle={{ padding: 32 }}
          >
            <Title level={4} style={{ color: '#ff4d6d', marginBottom: 16 }}>
              <HeartOutlined style={{ marginRight: 8 }} />
              详细说明
            </Title>
            <Paragraph style={{ fontSize: 15, lineHeight: 2, color: '#555' }}>
              {selectedNode.content}
            </Paragraph>
          </Card>
        )}

        {children.length > 0 && (
          <div>
            <Title level={4} style={{ marginBottom: 16 }}>
              <BookOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              子项详情
            </Title>
            <Collapse 
              defaultActiveKey={children.map(c => c.id)} 
              ghost
            >
              {children.map((child, index) => (
                <Panel
                  key={child.id}
                  header={
                    <Space>
                      <span style={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: '50%', 
                        background: children.length <= 3 
                          ? ['#ff4d6d', '#fa8c16', '#faad14'][index] 
                          : '#1890ff',
                        color: '#fff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 'bold'
                      }}>
                        {index + 1}
                      </span>
                      <Text strong>{child.title}</Text>
                    </Space>
                  }
                >
                  <Paragraph style={{ margin: 0, padding: '0 0 0 32px', color: '#666', lineHeight: 2 }}>
                    {child.content || '暂无详细说明'}
                  </Paragraph>
                  {getChildNodes(child.id).length > 0 && (
                    <div style={{ marginTop: 12, padding: '0 0 0 32px' }}>
                      {getChildNodes(child.id).map((grandChild, idx) => (
                        <div 
                          key={grandChild.id}
                          style={{ 
                            padding: 12, 
                            background: '#f6ffed', 
                            borderRadius: 8, 
                            marginBottom: 8,
                            borderLeft: '3px solid #52c41a'
                          }}
                        >
                          <Text strong style={{ color: '#389e0d' }}>
                            <ArrowRightOutlined style={{ marginRight: 6 }} />
                            {grandChild.title}
                          </Text>
                          {grandChild.content && (
                            <Paragraph style={{ margin: '8px 0 0 0', color: '#666' }}>
                              {grandChild.content}
                            </Paragraph>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              ))}
            </Collapse>
          </div>
        )}

        <Divider style={{ margin: '32px 0 24px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            disabled={currentIndex === 0}
            onClick={() => setSelectedNode(siblings[currentIndex - 1])}
          >
            ← 上一项
          </Button>
          <Button 
            type="primary"
            disabled={currentIndex === siblings.length - 1}
            onClick={() => setSelectedNode(siblings[currentIndex + 1])}
            style={{
              background: 'linear-gradient(135deg, #ff4d6d 0%, #ff7875 100%)',
              border: 'none'
            }}
          >
            下一项 →
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 24, maxWidth: 1600, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={1} style={{ 
          marginBottom: 12, 
          color: '#ff4d6d',
          fontWeight: 700
        }}>
          <HeartOutlined style={{ marginRight: 12 }} />
          婚礼筹备知识库
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          从备婚到婚礼当天，全方位指南助你打造完美婚礼
        </Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {CATEGORIES.map(cat => (
          <Col xs={24} sm={12} md={8} lg={24/5} key={cat.value}>
            <Card
              hoverable
              onClick={() => {
                setActiveTab(cat.value);
                setSelectedNode(null);
              }}
              style={{
                borderRadius: 12,
                border: activeTab === cat.value ? `2px solid ${cat.color}` : '1px solid #f0f0f0',
                background: activeTab === cat.value ? `${cat.color}10` : '#fff',
                height: '100%'
              }}
              bodyStyle={{ padding: 20 }}
            >
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 12, 
                background: `${cat.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                fontSize: 24,
                color: cat.color
              }}>
                {cat.icon}
              </div>
              <Title level={5} style={{ margin: '0 0 8px 0', color: cat.color }}>
                {cat.label}
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {cat.desc}
              </Text>
              <div style={{ marginTop: 12 }}>
                <Tag color={cat.color} style={{ margin: 0 }}>
                  {flatData.filter(n => n.category === cat.value).length} 条知识
                </Tag>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8} lg={6}>
          <Card 
            title={<Space><BookOutlined />知识目录</Space>}
            style={{ borderRadius: 12 }}
            bodyStyle={{ padding: 12 }}
          >
            <Spin spinning={loading}>
              {treeData.length > 0 ? (
                <Tree
                  showLine
                  blockNode
                  defaultExpandAll
                  treeData={treeData}
                  selectedKeys={selectedNode ? [selectedNode.id] : []}
                  onSelect={handleSelect}
                />
              ) : (
                <Empty description="暂无知识数据" style={{ padding: '40px 0' }} />
              )}
            </Spin>
          </Card>
        </Col>

        <Col xs={24} md={16} lg={18}>
          <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 32 }}>
            <Spin spinning={loading}>
              {renderContent()}
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default KnowledgeGraph;
