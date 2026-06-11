import React, { useState } from 'react';
import {
  Card,
  Select,
  Radio,
  Tag,
  Button,
  Row,
  Col,
  Statistic,
  Badge,
  Typography,
  Space,
  message,
  theme,
  Drawer,
  Table,
  Descriptions,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  FolderAddOutlined,
  CloseCircleOutlined,
  RadarChartOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  SafetyCertificateOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const depositedWorks = [
  { value: '1', label: '品牌视觉设计稿V3' },
  { value: '2', label: '产品宣传视频-夏季版' },
  { value: '4', label: 'APP界面交互设计' },
  { value: '5', label: '原创音乐-晨光序曲' },
  { value: '7', label: '产品3D渲染图' },
  { value: '8', label: '企业宣传片-国际版' },
];

interface InfringementItem {
  id: string;
  originalWork: string;
  originalThumb: string;
  infringeThumb: string;
  similarity: number;
  platform: string;
  platformColor: string;
  detectionTime: string;
  infringementType: string;
  infringementColor: string;
  status: 'confirmed' | 'pending' | 'ignored';
  sourceUrl: string;
}

const mockInfringements: InfringementItem[] = [
  {
    id: '1',
    originalWork: '品牌视觉设计稿V3',
    originalThumb: '#667eea',
    infringeThumb: '#ff6b6b',
    similarity: 96.8,
    platform: '淘宝',
    platformColor: '#ff5000',
    detectionTime: '2026-06-09 08:32:15',
    infringementType: '图文抄袭',
    infringementColor: 'volcano',
    status: 'confirmed',
    sourceUrl: 'https://item.taobao.com/mock',
  },
  {
    id: '2',
    originalWork: '产品宣传视频-夏季版',
    originalThumb: '#764ba2',
    infringeThumb: '#ffa940',
    similarity: 89.2,
    platform: '抖音',
    platformColor: '#111',
    detectionTime: '2026-06-08 22:18:44',
    infringementType: '视频搬运',
    infringementColor: 'purple',
    status: 'pending',
    sourceUrl: 'https://douyin.com/video/mock',
  },
  {
    id: '3',
    originalWork: '品牌视觉设计稿V3',
    originalThumb: '#667eea',
    infringeThumb: '#ff85c0',
    similarity: 82.5,
    platform: '微信公众号',
    platformColor: '#07c160',
    detectionTime: '2026-06-08 14:05:33',
    infringementType: '图文抄袭',
    infringementColor: 'volcano',
    status: 'confirmed',
    sourceUrl: 'https://mp.weixin.qq.com/mock',
  },
  {
    id: '4',
    originalWork: 'APP界面交互设计',
    originalThumb: '#36cfc9',
    infringeThumb: '#ffc53d',
    similarity: 91.3,
    platform: '小红书',
    platformColor: '#fe2c55',
    detectionTime: '2026-06-07 19:47:12',
    infringementType: '图文抄袭',
    infringementColor: 'volcano',
    status: 'pending',
    sourceUrl: 'https://xiaohongshu.com/mock',
  },
  {
    id: '5',
    originalWork: '原创音乐-晨光序曲',
    originalThumb: '#b37feb',
    infringeThumb: '#95de64',
    similarity: 78.6,
    platform: '网易云音乐',
    platformColor: '#c10d0c',
    detectionTime: '2026-06-06 11:22:58',
    infringementType: '商标侵权',
    infringementColor: 'magenta',
    status: 'ignored',
    sourceUrl: 'https://music.163.com/mock',
  },
  {
    id: '6',
    originalWork: '企业宣传片-国际版',
    originalThumb: '#597ef7',
    infringeThumb: '#ff7a45',
    similarity: 94.1,
    platform: 'B站',
    platformColor: '#00a1d6',
    detectionTime: '2026-06-05 16:33:41',
    infringementType: '视频搬运',
    infringementColor: 'purple',
    status: 'confirmed',
    sourceUrl: 'https://bilibili.com/video/mock',
  },
  {
    id: '7',
    originalWork: '产品3D渲染图',
    originalThumb: '#9254de',
    infringeThumb: '#73d13d',
    similarity: 87.4,
    platform: '拼多多',
    platformColor: '#e02e24',
    detectionTime: '2026-06-04 09:14:07',
    infringementType: '图文抄袭',
    infringementColor: 'volcano',
    status: 'pending',
    sourceUrl: 'https://pinduoduo.com/mock',
  },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  confirmed: { label: '确认侵权', color: '#f5222d', icon: <CheckCircleOutlined /> },
  pending: { label: '待确认', color: '#faad14', icon: <ClockCircleOutlined /> },
  ignored: { label: '已忽略', color: '#d9d9d9', icon: <StopOutlined /> },
};

const mockProcessingRecords = [
  { key: '1', originalWork: '品牌视觉设计稿V3', source: '淘宝', similarity: 96.8, confirmer: '张伟', confirmTime: '2026-06-09 09:15:00', result: '确认侵权' as const },
  { key: '2', originalWork: '产品宣传视频-夏季版', source: '抖音', similarity: 89.2, confirmer: '-', confirmTime: '-', result: '待确认' as const },
  { key: '3', originalWork: '品牌视觉设计稿V3', source: '微信公众号', similarity: 82.5, confirmer: '李明', confirmTime: '2026-06-08 15:20:00', result: '确认侵权' as const },
  { key: '4', originalWork: 'APP界面交互设计', source: '小红书', similarity: 91.3, confirmer: '-', confirmTime: '-', result: '待确认' as const },
  { key: '5', originalWork: '原创音乐-晨光序曲', source: '网易云音乐', similarity: 78.6, confirmer: '王芳', confirmTime: '2026-06-06 14:30:00', result: '误报' as const },
  { key: '6', originalWork: '企业宣传片-国际版', source: 'B站', similarity: 94.1, confirmer: '张伟', confirmTime: '2026-06-05 18:00:00', result: '确认侵权' as const },
  { key: '7', originalWork: '产品3D渲染图', source: '拼多多', similarity: 87.4, confirmer: '-', confirmTime: '-', result: '待确认' as const },
  { key: '8', originalWork: '品牌视觉设计稿V3', source: '微博', similarity: 65.3, confirmer: '李明', confirmTime: '2026-06-03 11:00:00', result: '误报' as const },
];

const Infringement: React.FC = () => {
  const [selectedWork, setSelectedWork] = useState<string | undefined>(undefined);
  const [monitorScope, setMonitorScope] = useState('全网');
  const [frequency, setFrequency] = useState('daily');
  const [data, setData] = useState(mockInfringements);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<InfringementItem | null>(null);
  const { token } = theme.useToken();
  const navigate = useNavigate();

  const confirmedCount = data.filter((d) => d.status === 'confirmed').length;
  const pendingCount = data.filter((d) => d.status === 'pending').length;
  const ignoredCount = data.filter((d) => d.status === 'ignored').length;

  const handleAction = (id: string, action: 'confirm' | 'evidence' | 'ignore') => {
    setData((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (action === 'confirm') return { ...item, status: 'confirmed' as const };
          if (action === 'ignore') return { ...item, status: 'ignored' as const };
        }
        return item;
      })
    );
    const msgs: Record<string, string> = {
      confirm: '已确认侵权',
      evidence: '已加入证据包',
      ignore: '已忽略该线索',
    };
    message.success(msgs[action]);
    if (action === 'evidence') {
      navigate('/copyright/evidence');
    }
  };

  const showDetail = (item: InfringementItem) => {
    setDetailRecord(item);
    setDetailOpen(true);
  };

  const handleConfirmInDrawer = () => {
    if (!detailRecord) return;
    handleAction(detailRecord.id, 'confirm');
    setDetailRecord({ ...detailRecord, status: 'confirmed' });
  };

  const handleMarkFalsePositive = () => {
    if (!detailRecord) return;
    setData((prev) =>
      prev.map((item) =>
        item.id === detailRecord.id ? { ...item, status: 'ignored' as const } : item
      )
    );
    setDetailRecord({ ...detailRecord, status: 'ignored' });
    message.success('已标记为误报');
  };

  const filteredData = selectedWork
    ? data.filter((d) => d.originalWork === depositedWorks.find((w) => w.value === selectedWork)?.label)
    : data;

  const processingColumns = [
    { title: '原作品', dataIndex: 'originalWork', key: 'originalWork', render: (t: string) => <Text strong>{t}</Text> },
    { title: '侵权来源', dataIndex: 'source', key: 'source' },
    {
      title: '相似度',
      dataIndex: 'similarity',
      key: 'similarity',
      render: (v: number) => (
        <Text strong style={{ color: v >= 90 ? '#f5222d' : v >= 80 ? '#faad14' : '#52c41a' }}>
          {v}%
        </Text>
      ),
    },
    { title: '确认人', dataIndex: 'confirmer', key: 'confirmer' },
    { title: '确认时间', dataIndex: 'confirmTime', key: 'confirmTime' },
    {
      title: '处理结果',
      dataIndex: 'result',
      key: 'result',
      render: (result: '确认侵权' | '误报' | '待确认') => {
        const cfg: Record<string, { color: string; icon: React.ReactNode }> = {
          '确认侵权': { color: 'error', icon: <WarningOutlined /> },
          '误报': { color: 'default', icon: <StopOutlined /> },
          '待确认': { color: 'warning', icon: <ClockCircleOutlined /> },
        };
        const c = cfg[result];
        return <Tag color={c.color} icon={c.icon}>{result}</Tag>;
      },
    },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card
            style={{ borderRadius: 12, overflow: 'hidden' }}
            styles={{
              header: {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderBottom: 'none',
                padding: '16px 24px',
              },
            }}
            title={
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>
                <RadarChartOutlined style={{ marginRight: 8 }} />
                监控配置
              </span>
            }
          >
            <Row gutter={[24, 16]} align="middle">
              <Col xs={24} sm={8}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  监控作品
                </Text>
                <Select
                  placeholder="选择已存证的作品"
                  style={{ width: '100%' }}
                  options={depositedWorks}
                  allowClear
                  value={selectedWork}
                  onChange={setSelectedWork}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  监控范围
                </Text>
                <Radio.Group
                  value={monitorScope}
                  onChange={(e) => setMonitorScope(e.target.value)}
                  optionType="button"
                  buttonStyle="solid"
                >
                  <Radio.Button value="全网">全网</Radio.Button>
                  <Radio.Button value="指定平台">指定平台</Radio.Button>
                </Radio.Group>
              </Col>
              <Col xs={24} sm={8}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  监控频率
                </Text>
                <Radio.Group
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  optionType="button"
                  buttonStyle="solid"
                >
                  <Radio.Button value="realtime">实时</Radio.Button>
                  <Radio.Button value="daily">每日</Radio.Button>
                  <Radio.Button value="weekly">每周</Radio.Button>
                </Radio.Group>
              </Col>
            </Row>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button type="primary" icon={<SearchOutlined />} style={{ borderRadius: 8 }}>
                启动监控
              </Button>
            </div>
          </Card>
        </Col>

        <Col span={24}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 12, textAlign: 'center' }} styles={{ body: { padding: '20px 16px' } }}>
                <Statistic
                  title="检测总数"
                  value={data.length}
                  valueStyle={{ color: token.colorPrimary, fontWeight: 700 }}
                  prefix={<RadarChartOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 12, textAlign: 'center' }} styles={{ body: { padding: '20px 16px' } }}>
                <Statistic
                  title="确认侵权"
                  value={confirmedCount}
                  valueStyle={{ color: '#f5222d', fontWeight: 700 }}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 12, textAlign: 'center' }} styles={{ body: { padding: '20px 16px' } }}>
                <Statistic
                  title="待确认"
                  value={pendingCount}
                  valueStyle={{ color: '#faad14', fontWeight: 700 }}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 12, textAlign: 'center' }} styles={{ body: { padding: '20px 16px' } }}>
                <Statistic
                  title="已忽略"
                  value={ignoredCount}
                  valueStyle={{ color: '#999', fontWeight: 700 }}
                  prefix={<StopOutlined />}
                />
              </Card>
            </Col>
          </Row>
        </Col>

        <Col span={24}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>
              <WarningOutlined style={{ color: '#f5222d', marginRight: 8 }} />
              侵权线索
            </Title>
            <Space>
              <Badge status="error" text={`确认侵权 ${confirmedCount}`} />
              <Badge status="warning" text={`待确认 ${pendingCount}`} />
              <Badge status="default" text={`已忽略 ${ignoredCount}`} />
            </Space>
          </div>
          <Row gutter={[16, 16]}>
            {filteredData.map((item) => {
              const sCfg = statusConfig[item.status];
              return (
                <Col xs={24} sm={12} lg={8} key={item.id}>
                  <Card
                    hoverable
                    style={{
                      borderRadius: 12,
                      border: item.status === 'confirmed' ? '1px solid #ffccc7' : undefined,
                    }}
                    styles={{ body: { padding: 20 } }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 8,
                          background: item.originalThumb,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        原作
                      </div>
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 8,
                          background: item.infringeThumb,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        侵权
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text strong ellipsis style={{ display: 'block', fontSize: 14 }}>
                          {item.originalWork}
                        </Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag color={item.infringementColor}>{item.infringementType}</Tag>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        background: 'linear-gradient(135deg, #f6f0ff 0%, #fff5f5 100%)',
                        borderRadius: 8,
                        padding: '10px 14px',
                        marginBottom: 14,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 13 }}>相似度</Text>
                      <Text
                        strong
                        style={{
                          fontSize: 22,
                          color: item.similarity >= 90 ? '#f5222d' : item.similarity >= 80 ? '#faad14' : '#52c41a',
                        }}
                      >
                        {item.similarity}%
                      </Text>
                    </div>

                    <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>来源平台</Text>
                        <Tag
                          style={{
                            color: item.platformColor,
                            borderColor: item.platformColor,
                            fontSize: 12,
                          }}
                        >
                          {item.platform}
                        </Tag>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>检测时间</Text>
                        <Text style={{ fontSize: 12 }}>{item.detectionTime}</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>状态</Text>
                        {item.status === 'confirmed' ? (
                          <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize: 12 }}>
                            已确认
                          </Tag>
                        ) : (
                          <Tag color={sCfg.color} icon={sCfg.icon} style={{ fontSize: 12 }}>
                            {sCfg.label}
                          </Tag>
                        )}
                      </div>
                    </div>

                    <Space style={{ width: '100%', justifyContent: 'center' }}>
                      <Button size="small" icon={<EyeOutlined />} style={{ borderRadius: 6 }} onClick={() => showDetail(item)}>
                        查看详情
                      </Button>
                      {item.status === 'confirmed' && (
                        <Button
                          size="small"
                          type="primary"
                          icon={<FolderAddOutlined />}
                          style={{ borderRadius: 6 }}
                          onClick={() => handleAction(item.id, 'evidence')}
                        >
                          加入证据包
                        </Button>
                      )}
                      {item.status !== 'confirmed' && (
                        <Button
                          size="small"
                          icon={<CloseCircleOutlined />}
                          style={{ borderRadius: 6 }}
                          onClick={() => handleAction(item.id, 'ignore')}
                        >
                          忽略
                        </Button>
                      )}
                    </Space>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Col>

        <Col span={24}>
          <Card
            style={{ borderRadius: 12 }}
            title={
              <span style={{ fontWeight: 600 }}>
                <SafetyCertificateOutlined style={{ marginRight: 8, color: '#667eea' }} />
                人工确认处理记录
              </span>
            }
          >
            <Table
              dataSource={mockProcessingRecords}
              columns={processingColumns}
              rowKey="key"
              pagination={{ pageSize: 5, showTotal: (t) => `共 ${t} 条记录` }}
              size="middle"
            />
          </Card>
        </Col>
      </Row>

      <Drawer
        title={
          <span>
            <EyeOutlined style={{ marginRight: 8, color: '#667eea' }} />
            侵权详情
          </span>
        }
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={580}
      >
        {detailRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card size="small" style={{ borderRadius: 8, borderLeft: '3px solid #667eea' }} title={<Text strong style={{ fontSize: 13 }}>原作品信息</Text>}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="作品名称">{detailRecord.originalWork}</Descriptions.Item>
                <Descriptions.Item label="存证时间">2026-06-09 14:23:15</Descriptions.Item>
                <Descriptions.Item label="哈希值">
                  <Text code style={{ fontSize: 11 }}>a3f7b2c9d4e8...d8e1f4</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" style={{ borderRadius: 8, borderLeft: '3px solid #f5222d' }} title={<Text strong style={{ fontSize: 13 }}>侵权内容截图</Text>}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div
                  style={{
                    width: 120,
                    height: 80,
                    borderRadius: 8,
                    background: detailRecord.originalThumb,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  原作品
                </div>
                <SwapOutlined style={{ color: '#999', fontSize: 18 }} />
                <div
                  style={{
                    width: 120,
                    height: 80,
                    borderRadius: 8,
                    background: detailRecord.infringeThumb,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  侵权内容
                </div>
              </div>
            </Card>

            <Card size="small" style={{ borderRadius: 8, borderLeft: '3px solid #faad14' }} title={<Text strong style={{ fontSize: 13 }}>相似度分析</Text>}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="综合相似度">
                  <Text strong style={{ color: detailRecord.similarity >= 90 ? '#f5222d' : '#faad14', fontSize: 20 }}>
                    {detailRecord.similarity}%
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="侵权类型">
                  <Tag color={detailRecord.infringementColor}>{detailRecord.infringementType}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="来源平台">{detailRecord.platform}</Descriptions.Item>
                <Descriptions.Item label="检测时间">{detailRecord.detectionTime}</Descriptions.Item>
                <Descriptions.Item label="来源链接" span={2}>
                  <Text style={{ fontSize: 12, color: token.colorPrimary }}>{detailRecord.sourceUrl}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" style={{ borderRadius: 8, borderLeft: '3px solid #52c41a' }} title={<Text strong style={{ fontSize: 13 }}>操作</Text>}>
              <Space>
                <Button
                  type="primary"
                  danger
                  icon={<WarningOutlined />}
                  onClick={handleConfirmInDrawer}
                  disabled={detailRecord.status === 'confirmed'}
                >
                  确认侵权
                </Button>
                <Button
                  icon={<StopOutlined />}
                  onClick={handleMarkFalsePositive}
                  disabled={detailRecord.status === 'ignored'}
                >
                  标记误报
                </Button>
                {detailRecord.status === 'confirmed' && (
                  <Button
                    type="primary"
                    icon={<FolderAddOutlined />}
                    onClick={() => {
                      handleAction(detailRecord.id, 'evidence');
                      setDetailOpen(false);
                    }}
                  >
                    加入证据包
                  </Button>
                )}
              </Space>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Infringement;
