import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Button,
  Space,
  Typography,
  message,
  Empty,
  Skeleton,
  Tag,
  List,
  Tooltip,
  Select,
} from 'antd';
import {
  SearchOutlined,
  ShareAltOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ReloadOutlined,
  FileTextOutlined,
  TeamOutlined,
  AppstoreOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useRequest from '../../hooks/useRequest';
import { getKnowledgeGraph, getKnowledgeGraphDetail } from '../../api/policy';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const nodeTypes = [
  { key: 'policy', label: '政策', color: '#1E6FDB', icon: <FileTextOutlined /> },
  { key: 'population', label: '人群', color: '#52C41A', icon: <TeamOutlined /> },
  { key: 'matter', label: '事项', color: '#722ED1', icon: <AppstoreOutlined /> },
  { key: 'region', label: '地域', color: '#FAAD14', icon: <EnvironmentOutlined /> },
];

const relationTypes = [
  { key: 'applies_to', label: '适用于', color: '#1E6FDB' },
  { key: 'relates_to', label: '关联到', color: '#52C41A' },
  { key: 'belongs_to', label: '属于', color: '#722ED1' },
  { key: 'covers', label: '覆盖', color: '#FAAD14' },
];

const mockGraphData = {
  centerNode: {
    id: 1,
    type: 'policy',
    name: '养老保险制度',
    description: '关于完善企业职工基本养老保险制度的实施意见',
  },
  nodes: [
    { id: 1, type: 'policy', name: '养老保险制度', x: 400, y: 300, description: '关于完善企业职工基本养老保险制度的实施意见' },
    { id: 2, type: 'policy', name: '医疗保险政策', x: 650, y: 180, description: '关于调整2024年度社会保险缴费基数的通知' },
    { id: 3, type: 'policy', name: '失业保险条例', x: 650, y: 420, description: '关于优化营商环境进一步促进就业创业的通知' },
    { id: 4, type: 'population', name: '参保人', x: 150, y: 150, description: '参加社会保险的人员' },
    { id: 5, type: 'population', name: '退休人员', x: 150, y: 300, description: '已办理退休手续的人员' },
    { id: 6, type: 'population', name: '企业HR', x: 150, y: 450, description: '企业人力资源管理人员' },
    { id: 7, type: 'matter', name: '社保参保', x: 550, y: 500, description: '社会保险参保登记' },
    { id: 8, type: 'matter', name: '待遇领取', x: 250, y: 500, description: '社会保险待遇申领' },
    { id: 9, type: 'region', name: '省本级', x: 550, y: 100, description: '省本级统筹区域' },
    { id: 10, type: 'region', name: '各市', x: 250, y: 100, description: '各地级市' },
  ],
  links: [
    { source: 1, target: 2, relation: 'relates_to', label: '关联政策' },
    { source: 1, target: 3, relation: 'relates_to', label: '关联政策' },
    { source: 1, target: 4, relation: 'applies_to', label: '适用于' },
    { source: 1, target: 5, relation: 'applies_to', label: '适用于' },
    { source: 1, target: 6, relation: 'applies_to', label: '适用于' },
    { source: 1, target: 7, relation: 'belongs_to', label: '属于' },
    { source: 1, target: 8, relation: 'belongs_to', label: '属于' },
    { source: 1, target: 9, relation: 'covers', label: '覆盖' },
    { source: 1, target: 10, relation: 'covers', label: '覆盖' },
    { source: 4, target: 7, relation: 'belongs_to', label: '办理' },
    { source: 5, target: 8, relation: 'belongs_to', label: '办理' },
  ],
};

const KnowledgeGraph = () => {
  const navigate = useNavigate();
  const svgRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [centerNodeType, setCenterNodeType] = useState('policy');
  const [graphData, setGraphData] = useState(mockGraphData);

  const { loading: graphLoading, data: graphApiData } = useRequest(() => getKnowledgeGraph({ type: centerNodeType }), {
    onError: () => {
      message.error('获取知识图谱失败');
    },
  });

  const { loading: detailLoading, run: getNodeDetail } = useRequest(getKnowledgeGraphDetail, {
    manual: true,
    onError: () => {
      message.error('获取节点详情失败');
    },
  });

  const displayGraph = graphApiData || graphData;

  useEffect(() => {
    if (graphApiData) {
      setGraphData(graphApiData);
    }
  }, [graphApiData]);

  const nodeColors = useMemo(() => {
    const colors = {};
    nodeTypes.forEach((type) => {
      colors[type.key] = type.color;
    });
    return colors;
  }, []);

  const getNodeColor = (type) => nodeColors[type] || '#1E6FDB';

  const getNodeIcon = (type) => {
    const nodeType = nodeTypes.find((t) => t.key === type);
    return nodeType?.icon || <FileTextOutlined />;
  };

  const handleNodeClick = async (node) => {
    setSelectedNode(node);
    try {
      const detail = await getNodeDetail(node.id);
      if (detail) {
        setSelectedNode({ ...node, ...detail });
      }
    } catch (err) {
      console.error('Failed to get node detail:', err);
    }
  };

  const handleNodeDoubleClick = (node) => {
    if (node.type === 'policy') {
      navigate(`/policy/list/${node.id}`);
    } else {
      message.info(`正在查看 ${node.name} 的相关政策`);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (!value) {
      setSelectedNode(null);
      return;
    }

    const foundNode = displayGraph.nodes.find(
      (n) => n.name.includes(value) || (n.description && n.description.includes(value))
    );
    if (foundNode) {
      setSelectedNode(foundNode);
      message.success(`已定位到节点：${foundNode.name}`);
    } else {
      message.warning('未找到相关节点');
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setSelectedNode(null);
    setSearchText('');
  };

  const handleCenterNodeChange = (value) => {
    setCenterNodeType(value);
  };

  const handleShare = () => {
    message.success('知识图谱分享链接已复制到剪贴板');
  };

  const getLinePath = (source, target) => {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dr = Math.sqrt(dx * dx + dy * dy);
    return `M ${source.x} ${source.y} A ${dr * 0.8} ${dr * 0.8} 0 0 1 ${target.x} ${target.y}`;
  };

  const getMidPoint = (source, target) => {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    return {
      x: source.x + dx * 0.5,
      y: source.y + dy * 0.5,
    };
  };

  if (graphLoading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 20 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          <Space>
            <ShareAltOutlined style={{ color: '#1E6FDB' }} />
            知识图谱
          </Space>
        </Title>
        <Space>
          <Select
            value={centerNodeType}
            onChange={handleCenterNodeChange}
            style={{ width: 150 }}
          >
            {nodeTypes.map((type) => (
              <Option key={type.key} value={type.key}>
                <Space>
                  {type.icon}
                  {type.label}
                </Space>
              </Option>
            ))}
          </Select>
          <Search
            placeholder="搜索节点..."
            allowClear
            enterButton={<SearchOutlined />}
            size="middle"
            onSearch={handleSearch}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />
          <Button icon={<ZoomInOutlined />} onClick={handleZoomIn}>
            放大
          </Button>
          <Button icon={<ZoomOutOutlined />} onClick={handleZoomOut}>
            缩小
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
          <Button
            type="primary"
            icon={<ShareAltOutlined />}
            onClick={handleShare}
            style={{ background: '#1E6FDB' }}
          >
            分享
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={5}>
          <Card
            title={
              <Space>
                <InfoCircleOutlined style={{ color: '#1E6FDB' }} />
                图例说明
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
                节点类型
              </Text>
              {nodeTypes.map((type) => (
                <div
                  key={type.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: type.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      marginRight: 12,
                    }}
                  >
                    {type.icon}
                  </div>
                  <Text>{type.label}</Text>
                </div>
              ))}
            </div>
            <DividerCustom />
            <div>
              <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
                关系类型
              </Text>
              {relationTypes.map((rel) => (
                <div
                  key={rel.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 3,
                      background: rel.color,
                      marginRight: 12,
                      borderRadius: 2,
                    }}
                  />
                  <Text style={{ fontSize: 13 }}>{rel.label}</Text>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: '#1E6FDB' }} />
                节点详情
              </Space>
            }
          >
            {detailLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : selectedNode ? (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: getNodeColor(selectedNode.type),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 20,
                      marginRight: 12,
                    }}
                  >
                    {getNodeIcon(selectedNode.type)}
                  </div>
                  <div>
                    <Tag
                      color={getNodeColor(selectedNode.type)}
                      style={{ marginBottom: 4 }}
                    >
                      {nodeTypes.find((t) => t.key === selectedNode.type)?.label}
                    </Tag>
                    <Text strong style={{ display: 'block', fontSize: 15 }}>
                      {selectedNode.name}
                    </Text>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    描述
                  </Text>
                  <Text style={{ fontSize: 13, lineHeight: 1.6 }}>
                    {selectedNode.description}
                  </Text>
                </div>
                {selectedNode.type === 'policy' && (
                  <Button
                    type="primary"
                    block
                    onClick={() => navigate(`/policy/list/${selectedNode.id}`)}
                    style={{ background: '#1E6FDB' }}
                  >
                    查看政策详情
                  </Button>
                )}
                {selectedNode.type !== 'policy' && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                      相关政策
                    </Text>
                    <List
                      size="small"
                      dataSource={displayGraph.nodes.filter(
                        (n) => n.type === 'policy' && n.id !== displayGraph.centerNode.id
                      )}
                      renderItem={(item) => (
                        <List.Item
                          style={{
                            cursor: 'pointer',
                            padding: '8px 0',
                            borderBottom: '1px solid #f0f0f0',
                          }}
                          onClick={() => navigate(`/policy/list/${item.id}`)}
                        >
                          <Text ellipsis style={{ color: '#1E6FDB', fontSize: 13 }}>
                            {item.name}
                          </Text>
                        </List.Item>
                      )}
                    />
                  </div>
                )}
              </div>
            ) : (
              <Empty description="点击节点查看详情" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>

        <Col xs={24} sm={24} md={19}>
          <Card
            style={{
              height: 'calc(100vh - 180px)',
              overflow: 'hidden',
            }}
            bodyStyle={{ padding: 0, height: '100%' }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                overflow: 'auto',
                background: 'linear-gradient(135deg, #F9FAFB 0%, #F0F5FF 100%)',
                position: 'relative',
              }}
            >
              <svg
                ref={svgRef}
                width={800}
                height={600}
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.3s ease',
                }}
              >
                <defs>
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15" />
                  </filter>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#999" />
                  </marker>
                </defs>

                {displayGraph.links.map((link, index) => {
                  const sourceNode = displayGraph.nodes.find((n) => n.id === link.source);
                  const targetNode = displayGraph.nodes.find((n) => n.id === link.target);
                  if (!sourceNode || !targetNode) return null;

                  const midPoint = getMidPoint(sourceNode, targetNode);
                  const relation = relationTypes.find((r) => r.key === link.relation);
                  const lineColor = relation?.color || '#999';

                  const isHighlighted =
                    selectedNode &&
                    (sourceNode.id === selectedNode.id || targetNode.id === selectedNode.id);

                  return (
                    <g key={`link-${index}`}>
                      <path
                        d={getLinePath(sourceNode, targetNode)}
                        fill="none"
                        stroke={isHighlighted ? lineColor : '#d9d9d9'}
                        strokeWidth={isHighlighted ? 3 : 2}
                        opacity={selectedNode ? (isHighlighted ? 1 : 0.3) : 0.8}
                        markerEnd="url(#arrowhead)"
                        style={{ transition: 'all 0.3s ease' }}
                      />
                      <rect
                        x={midPoint.x - 25}
                        y={midPoint.y - 10}
                        width={50}
                        height={20}
                        fill="#fff"
                        stroke={lineColor}
                        strokeWidth={1}
                        rx={4}
                        opacity={selectedNode ? (isHighlighted ? 1 : 0.3) : 0.9}
                        style={{ transition: 'all 0.3s ease' }}
                      />
                      <text
                        x={midPoint.x}
                        y={midPoint.y + 5}
                        textAnchor="middle"
                        fontSize={11}
                        fill={lineColor}
                        opacity={selectedNode ? (isHighlighted ? 1 : 0.3) : 0.9}
                        style={{ transition: 'all 0.3s ease' }}
                      >
                        {link.label}
                      </text>
                    </g>
                  );
                })}

                {displayGraph.nodes.map((node) => {
                  const isCenter = node.id === displayGraph.centerNode.id;
                  const isSelected = selectedNode && selectedNode.id === node.id;
                  const isHighlighted =
                    selectedNode &&
                    displayGraph.links.some(
                      (l) =>
                        (l.source === selectedNode.id && l.target === node.id) ||
                        (l.target === selectedNode.id && l.source === node.id)
                    );

                  const nodeColor = getNodeColor(node.type);
                  const nodeRadius = isCenter ? 45 : 35;

                  return (
                    <g
                      key={`node-${node.id}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleNodeClick(node)}
                      onDoubleClick={() => handleNodeDoubleClick(node)}
                      opacity={
                        selectedNode
                          ? isSelected || isHighlighted || isCenter
                            ? 1
                            : 0.3
                          : 1
                      }
                      style={{
                        cursor: 'pointer',
                        transition: 'opacity 0.3s ease',
                      }}
                    >
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={nodeRadius + 8}
                        fill="transparent"
                        stroke={isSelected ? nodeColor : 'transparent'}
                        strokeWidth={3}
                        strokeDasharray={isSelected ? '5 5' : '0'}
                        style={{ transition: 'all 0.3s ease' }}
                      />
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={nodeRadius}
                        fill={nodeColor}
                        filter="url(#shadow)"
                        style={{
                          transition: 'all 0.3s ease',
                          transform: isSelected || isCenter ? 'scale(1.1)' : 'scale(1)',
                          transformOrigin: `${node.x}px ${node.y}px`,
                        }}
                      />
                      <text
                        x={node.x}
                        y={node.y - 5}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={isCenter ? 18 : 14}
                        fontWeight="bold"
                      >
                        {isCenter ? '📋' : getNodeIcon(node.type).props.type}
                      </text>
                      <text
                        x={node.x}
                        y={node.y + 8}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={isCenter ? 13 : 11}
                        fontWeight={isCenter ? 'bold' : 'normal'}
                      >
                        {node.name.length > 6 ? node.name.slice(0, 6) + '...' : node.name}
                      </text>
                      {isCenter && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={nodeRadius + 15}
                          fill="transparent"
                          stroke={nodeColor}
                          strokeWidth={2}
                          strokeDasharray="8 4"
                          opacity={0.5}
                        >
                          <animate
                            attributeName="r"
                            values={`${nodeRadius + 10};${nodeRadius + 25};${nodeRadius + 10}`}
                            dur="3s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            values="0.5;0.2;0.5"
                            dur="3s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}
                    </g>
                  );
                })}
              </svg>

              <div
                style={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                  background: 'rgba(255,255,255,0.95)',
                  padding: '12px 16px',
                  borderRadius: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <Space direction="vertical" size="small">
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    缩放比例：{Math.round(scale * 100)}%
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    节点数量：{displayGraph.nodes.length}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    关系数量：{displayGraph.links.length}
                  </Text>
                </Space>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const DividerCustom = () => (
  <div
    style={{
      height: 1,
      background: '#f0f0f0',
      margin: '16px 0',
    }}
  />
);

export default KnowledgeGraph;
