import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Input,
  Upload,
  Progress,
  Slider,
  Checkbox,
  Tag,
  Typography,
  Space,
  Button,
  Spin,
  Drawer,
  Descriptions,
  Timeline,
  Table,
  message,
} from 'antd';
import {
  InboxOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  PlusOutlined,
  StopOutlined,
  RedoOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const categoryOptions = [
  { label: '第1类 化学原料', value: '1' },
  { label: '第9类 科学仪器', value: '9' },
  { label: '第25类 服装鞋帽', value: '25' },
  { label: '第35类 广告销售', value: '35' },
  { label: '第42类 科技服务', value: '42' },
  { label: '第43类 餐饮住宿', value: '43' },
];

const mockResults = [
  { id: 1, name: '星辰科技', regNo: '2024-000123', similarity: 95, category: '第9类 科学仪器', color: '#667eea', applicant: '北京星辰科技有限公司', regDate: '2023-05-12', classNo: '9' },
  { id: 2, name: '云翼信息', regNo: '2024-000456', similarity: 87, category: '第42类 科技服务', color: '#764ba2', applicant: '上海云翼信息技术有限公司', regDate: '2023-08-20', classNo: '42' },
  { id: 3, name: '蓝鲸数据', regNo: '2024-000789', similarity: 82, category: '第9类 科学仪器', color: '#f093fb', applicant: '深圳蓝鲸数据科技有限公司', regDate: '2022-11-03', classNo: '9' },
  { id: 4, name: '智链科技', regNo: '2024-000234', similarity: 76, category: '第42类 科技服务', color: '#4facfe', applicant: '杭州智链科技有限公司', regDate: '2024-01-15', classNo: '42' },
  { id: 5, name: '锐视传媒', regNo: '2024-000567', similarity: 71, category: '第35类 广告销售', color: '#43e97b', applicant: '广州锐视传媒有限公司', regDate: '2023-03-28', classNo: '35' },
  { id: 6, name: '锦程服饰', regNo: '2024-000890', similarity: 65, category: '第25类 服装鞋帽', color: '#fa709a', applicant: '杭州锦程服饰有限公司', regDate: '2022-07-10', classNo: '25' },
  { id: 7, name: '味享餐饮', regNo: '2024-000345', similarity: 58, category: '第43类 餐饮住宿', color: '#fee140', applicant: '成都味享餐饮管理有限公司', regDate: '2024-04-22', classNo: '43' },
  { id: 8, name: '华创化工', regNo: '2024-000678', similarity: 52, category: '第1类 化学原料', color: '#a18cd1', applicant: '南京华创化工科技有限公司', regDate: '2023-12-05', classNo: '1' },
];

const monitoredTrademarks = [
  { id: 1, name: '星辰科技', regNo: '2024-000123', status: '已注册', statusColor: 'success' },
  { id: 2, name: '蓝鲸数据', regNo: '2024-000789', status: '审查中', statusColor: 'processing' },
  { id: 3, name: '锐视传媒', regNo: '2024-000567', status: '初审公告', statusColor: 'warning' },
];

const searchHistory = [
  { key: '1', time: '2026-06-09 14:30', keyword: '星辰科技', count: 8 },
  { key: '2', time: '2026-06-08 10:15', keyword: '云翼', count: 5 },
  { key: '3', time: '2026-06-07 16:42', keyword: '蓝鲸数据', count: 3 },
  { key: '4', time: '2026-06-05 09:20', keyword: '智链', count: 6 },
  { key: '5', time: '2026-06-03 11:55', keyword: '味享餐饮', count: 2 },
];

const getSimilarityColor = (val: number) => {
  if (val >= 80) return '#ff4d4f';
  if (val >= 60) return '#faad14';
  return '#52c41a';
};

const getSimilarityStatus = (val: number): 'exception' | 'active' | 'success' => {
  if (val >= 80) return 'exception';
  if (val >= 60) return 'active';
  return 'success';
};

const TrademarkAISearch: React.FC = () => {
  const location = useLocation();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [threshold, setThreshold] = useState(50);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentResult, setCurrentResult] = useState<typeof mockResults[0] | null>(null);
  const [monitoredIds, setMonitoredIds] = useState<number[]>([1, 3]);

  useEffect(() => {
    const keyword = new URLSearchParams(location.search).get('q')?.trim() || '';
    if (!keyword) return;
    setSearchKeyword(keyword);
    setSearched(true);
  }, [location.search]);

  const normalizedKeyword = searchKeyword.trim().toLowerCase();
  const filteredResults = mockResults.filter((r) => {
    const searchable = `${r.name} ${r.regNo} ${r.category} ${r.applicant}`.toLowerCase();
    const matchesKeyword = !normalizedKeyword || searchable.includes(normalizedKeyword);
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(r.category.split('类')[0]);
    return r.similarity >= threshold && matchesKeyword && matchesCategory;
  });

  const handleSearch = () => {
    setLoading(true);
    setSearched(false);
    setTimeout(() => {
      setLoading(false);
      setSearched(true);
      message.success('检索完成，共找到 ' + filteredResults.length + ' 条相似商标');
    }, 2000);
  };

  const showDetail = (item: typeof mockResults[0]) => {
    setCurrentResult(item);
    setDrawerOpen(true);
  };

  const toggleMonitor = (id: number) => {
    if (monitoredIds.includes(id)) {
      setMonitoredIds(monitoredIds.filter((i) => i !== id));
      message.success('已取消监控');
    } else {
      setMonitoredIds([...monitoredIds, id]);
      message.success('已加入监控');
    }
  };

  const removeMonitored = (id: number) => {
    setMonitoredIds(monitoredIds.filter((i) => i !== id));
    message.success('已取消监控');
  };

  const handleReSearch = (keyword: string) => {
    message.info('重新检索: ' + keyword);
    handleSearch();
  };

  const historyColumns = [
    { title: '检索时间', dataIndex: 'time', key: 'time' },
    { title: '关键词', dataIndex: 'keyword', key: 'keyword', render: (t: string) => <Text strong>{t}</Text> },
    { title: '结果数', dataIndex: 'count', key: 'count', render: (n: number) => <Tag color="blue">{n} 条</Tag> },
    {
      title: '操作', key: 'action',
      render: (_: unknown, record: typeof searchHistory[0]) => (
        <Button type="link" icon={<RedoOutlined />} onClick={() => handleReSearch(record.keyword)}>重新检索</Button>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={6}>
          <Card
            title={
              <Space>
                <FilterOutlined />
                <span>筛选条件</span>
              </Space>
            }
            style={{ borderRadius: 12 }}
          >
            <div style={{ marginBottom: 28 }}>
              <Text strong style={{ display: 'block', marginBottom: 12 }}>关键词搜索</Text>
              <Input
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                onPressEnter={handleSearch}
                placeholder="输入商标名称、申请人或分类"
                prefix={<SearchOutlined />}
                allowClear
              />
            </div>
            <div style={{ marginBottom: 28 }}>
              <Text strong style={{ display: 'block', marginBottom: 12 }}>商标分类</Text>
              <Checkbox.Group
                value={selectedCategories}
                onChange={(vals) => setSelectedCategories(vals as string[])}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                {categoryOptions.map((opt) => (
                  <Checkbox key={opt.value} value={opt.value}>{opt.label}</Checkbox>
                ))}
              </Checkbox.Group>
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 12 }}>相似度阈值: {threshold}%</Text>
              <Slider
                min={0}
                max={100}
                value={threshold}
                onChange={setThreshold}
                marks={{ 0: '0%', 50: '50%', 80: '80%', 100: '100%' }}
              />
            </div>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              block
              size="large"
              style={{ marginTop: 24, background: '#667eea', borderColor: '#667eea' }}
              loading={loading}
              onClick={handleSearch}
            >
              开始检索
            </Button>
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          <Card style={{ borderRadius: 12, marginBottom: 24 }}>
            <Dragger
              accept="image/*"
              showUploadList={false}
              multiple={false}
              beforeUpload={() => {
                handleSearch();
                return false;
              }}
              style={{ padding: '20px 0' }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: 48, color: '#667eea' }} />
              </p>
              <p className="ant-upload-text" style={{ fontSize: 16 }}>
                点击或拖拽商标图形到此区域进行AI检索
              </p>
              <p className="ant-upload-hint" style={{ color: '#999' }}>
                支持 PNG、JPG、SVG 格式，系统将自动提取图形特征进行相似度比对
              </p>
            </Dragger>
          </Card>

          {loading && (
            <Card style={{ borderRadius: 12, textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" tip="AI 正在分析图形特征，请稍候..." />
            </Card>
          )}

          {searched && !loading && (
            <>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>
                  {searchKeyword.trim() ? `搜索结果：${searchKeyword.trim()}` : '检索结果'}
                </Title>
                <Space>
                  <Tag color="red">高危 (≥80%): {filteredResults.filter((r) => r.similarity >= 80).length}</Tag>
                  <Tag color="orange">中危 (60-79%): {filteredResults.filter((r) => r.similarity >= 60 && r.similarity < 80).length}</Tag>
                  <Tag color="green">低危 (&lt;60%): {filteredResults.filter((r) => r.similarity < 60).length}</Tag>
                </Space>
              </div>
              <Row gutter={[16, 16]}>
                {filteredResults.map((item) => (
                  <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
                    <Card
                      hoverable
                      style={{ borderRadius: 12, overflow: 'hidden' }}
                      styles={{ body: { padding: 16 } }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: 120,
                          borderRadius: 8,
                          background: `linear-gradient(135deg, ${item.color} 0%, ${item.color}99 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: 28,
                          fontWeight: 700,
                          marginBottom: 12,
                        }}
                      >
                        {item.name.slice(0, 2)}
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong style={{ fontSize: 15 }}>{item.name}</Text>
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>申请号: {item.regNo}</Text>
                      </div>
                      <Tag color="blue" style={{ marginBottom: 12 }}>{item.category}</Tag>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ fontSize: 12 }}>相似度</Text>
                          <Text style={{ fontSize: 12, fontWeight: 600, color: getSimilarityColor(item.similarity) }}>
                            {item.similarity}%
                          </Text>
                        </div>
                        <Progress
                          percent={item.similarity}
                          status={getSimilarityStatus(item.similarity)}
                          strokeColor={getSimilarityColor(item.similarity)}
                          showInfo={false}
                          size="small"
                        />
                      </div>
                      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                        <Button
                          size="small"
                          icon={monitoredIds.includes(item.id) ? <StopOutlined /> : <PlusOutlined />}
                          danger={monitoredIds.includes(item.id)}
                          onClick={() => toggleMonitor(item.id)}
                        >
                          {monitoredIds.includes(item.id) ? '取消监控' : '加入监控'}
                        </Button>
                        <Button size="small" type="primary" icon={<EyeOutlined />} onClick={() => showDetail(item)}>
                          查看详情
                        </Button>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          )}

          {!searched && !loading && (
            <Card style={{ borderRadius: 12, textAlign: 'center', padding: '60px 0' }}>
              <SearchOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
              <Title level={4} type="secondary">上传商标图形开始AI检索</Title>
              <Text type="secondary">系统将基于深度学习模型分析图形特征，快速匹配相似商标</Text>
            </Card>
          )}

          <Card
            title={<Space><StopOutlined />已监控商标</Space>}
            style={{ borderRadius: 12, marginTop: 24 }}
          >
            <Row gutter={[16, 16]}>
              {monitoredTrademarks.filter((t) => monitoredIds.includes(t.id)).map((item) => (
                <Col key={item.id} xs={24} sm={12} md={8}>
                  <Card
                    size="small"
                    style={{ borderRadius: 10, border: '1px solid #f0f0f0' }}
                    styles={{ body: { padding: 16 } }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text strong style={{ fontSize: 15 }}>{item.name}</Text>
                      <Tag color={item.statusColor}>{item.status}</Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>注册号: {item.regNo}</Text>
                    <div style={{ marginTop: 12 }}>
                      <Button size="small" danger icon={<StopOutlined />} onClick={() => removeMonitored(item.id)}>
                        取消监控
                      </Button>
                    </div>
                  </Card>
                </Col>
              ))}
              {monitoredTrademarks.filter((t) => monitoredIds.includes(t.id)).length === 0 && (
                <Col span={24}>
                  <Text type="secondary">暂无监控商标，请从检索结果中添加</Text>
                </Col>
              )}
            </Row>
          </Card>

          <Card
            title={<Space><SearchOutlined />检索历史</Space>}
            style={{ borderRadius: 12, marginTop: 24 }}
          >
            <Table
              columns={historyColumns}
              dataSource={searchHistory}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Drawer
        title={
          <Space>
            <EyeOutlined />
            <span>商标详情 - {currentResult?.name}</span>
          </Space>
        }
        placement="right"
        width={600}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {currentResult && (
          <>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="商标名称">{currentResult.name}</Descriptions.Item>
              <Descriptions.Item label="注册号"><Text code>{currentResult.regNo}</Text></Descriptions.Item>
              <Descriptions.Item label="国际分类">{currentResult.category}</Descriptions.Item>
              <Descriptions.Item label="申请人">{currentResult.applicant}</Descriptions.Item>
              <Descriptions.Item label="注册日期">{currentResult.regDate}</Descriptions.Item>
            </Descriptions>

            <Title level={5}>相似度分析</Title>
            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div
                  style={{
                    height: 120,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #667eea 0%, #667eea99 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 24,
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  原图
                </div>
                <Text type="secondary">原始商标</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: 24, color: '#999' }}>→</div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div
                  style={{
                    height: 120,
                    borderRadius: 8,
                    background: `linear-gradient(135deg, ${currentResult.color} 0%, ${currentResult.color}99 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 24,
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  {currentResult.name.slice(0, 2)}
                </div>
                <Text type="secondary">匹配商标</Text>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Progress
                type="circle"
                percent={currentResult.similarity}
                strokeColor={getSimilarityColor(currentResult.similarity)}
                size={100}
                format={(p) => <span style={{ color: getSimilarityColor(currentResult.similarity), fontWeight: 700 }}>{p}%</span>}
              />
              <div style={{ marginTop: 8 }}>
                <Tag color={currentResult.similarity >= 80 ? 'red' : currentResult.similarity >= 60 ? 'orange' : 'green'}>
                  {currentResult.similarity >= 80 ? '高危相似' : currentResult.similarity >= 60 ? '中度相似' : '低度相似'}
                </Tag>
              </div>
            </div>

            <Title level={5}>法律状态</Title>
            <Timeline
              items={[
                { color: 'green', children: <div><Text strong>申请提交</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>2023-03-15 · 申请人: {currentResult.applicant}</Text></div> },
                { color: 'green', children: <div><Text strong>形式审查通过</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>2023-04-02 · 审查员: 李明</Text></div> },
                { color: 'green', children: <div><Text strong>实质审查通过</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>2023-06-18 · 审查员: 王芳</Text></div> },
                { color: 'green', children: <div><Text strong>初审公告</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>2023-07-20 · 公告期3个月</Text></div> },
                { color: currentResult.regDate ? 'blue' : 'gray', children: <div><Text strong>注册公告</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{currentResult.regDate} · 注册完成</Text></div> },
              ]}
            />
          </>
        )}
      </Drawer>
    </div>
  );
};

export default TrademarkAISearch;
