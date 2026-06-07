import { useState, useEffect } from 'react';
import {
  Card,
  Input,
  Tag,
  Button,
  List,
  Empty,
  Breadcrumb,
  Row,
  Col,
  Statistic,
  Divider,
  Alert,
  Space,
  Avatar,
} from 'antd';
import {
  HomeOutlined,
  SoundOutlined,
  SearchOutlined,
  FireOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  TranslationOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { dialectAPI, gridAPI } from '../services/api';

const { Search } = Input;

const DialectSearch = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [popularWords, setPopularWords] = useState<any[]>([]);
  const [grids, setGrids] = useState<any[]>([]);
  const [selectedGrid, setSelectedGrid] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedGrid]);

  const loadData = async () => {
    try {
      const [wordsRes, gridRes] = await Promise.all([
        dialectAPI.getPopular(selectedGrid || undefined, 20),
        gridAPI.getList(),
      ]);
      setPopularWords(wordsRes.data || []);
      setGrids(gridRes.data || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      setSearchResults([]);
      setSearched(false);
      return;
    }

    try {
      setLoading(true);
      setSearched(true);
      const res = await dialectAPI.search(value, selectedGrid || undefined);
      setSearchResults(res.data || []);
      
      if (res.data?.length > 0) {
        await dialectAPI.increment(res.data[0].id);
      }
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePopularClick = async (item: any) => {
    setSearchText(item.keyword);
    try {
      await dialectAPI.increment(item.id);
      loadData();
    } catch (error) {
      console.error('更新计数失败:', error);
    }
  };

  const typeConfig: Record<string, { label: string; color: string }> = {
    social: { label: '社交', color: 'blue' },
    query: { label: '疑问', color: 'orange' },
    pronoun: { label: '代词', color: 'green' },
    modal: { label: '语气', color: 'purple' },
    action: { label: '动作', color: 'cyan' },
    emotion: { label: '情感', color: 'red' },
    title: { label: '称呼', color: 'magenta' },
    verb: { label: '动词', color: 'geekblue' },
    noun: { label: '名词', color: 'lime' },
    adverb: { label: '副词', color: 'gold' },
    feeling: { label: '感觉', color: 'volcano' },
  };

  const stats = {
    total: popularWords.reduce((sum, w) => sum + w.search_count, 0),
    dialects: [...new Set(popularWords.map((w) => w.dialect))].length,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fadeInUp">
      <Breadcrumb className="mb-6">
        <Breadcrumb.Item onClick={() => navigate('/')} className="cursor-pointer">
          <HomeOutlined /> 首页
        </Breadcrumb.Item>
        <Breadcrumb.Item>方言搜索</Breadcrumb.Item>
      </Breadcrumb>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 mb-4">
          <SoundOutlined className="text-3xl text-orange-500" />
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Noto Serif SC, serif' }}>
          <span className="gradient-text">方言语音搜索</span>
        </h1>
        <p className="text-gray-500">
          支持山东话、河南话、河北话、湖北话、江苏话等五大方言区，输入方言即可转换为标准语
        </p>
      </div>

      <Alert
        message="方言索引已覆盖32个地市"
        description="系统已建立方言与标准语对照索引，支持拼音、方言、关键词多维度检索"
        type="success"
        showIcon
        className="mb-6"
      />

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={8}>
          <Card className="text-center">
            <Statistic
              title="索引词条"
              value={popularWords.length}
              prefix={<BookOutlined className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card className="text-center">
            <Statistic
              title="覆盖方言"
              value={stats.dialects}
              prefix={<GlobalOutlined className="text-green-500" />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card className="text-center">
            <Statistic
              title="总搜索量"
              value={stats.total}
              prefix={<SearchOutlined className="text-orange-500" />}
            />
          </Card>
        </Col>
      </Row>

      <Card className="mb-6 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <Search
              placeholder="输入方言词，例如：拉呱、弄啥嘞、俺、中、唠嗑..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={handleSearch}
              loading={loading}
            />
          </div>
        </div>
      </Card>

      <Divider orientation="left">
        <span className="flex items-center gap-2">
          <FireOutlined className="text-orange-500" />
          热门方言词
        </span>
      </Divider>

      <Card className="mb-6">
        <div className="flex flex-wrap gap-2">
          {popularWords.slice(0, 20).map((word, idx) => (
            <Tag
              key={word.id}
              color={idx < 3 ? 'red' : idx < 8 ? 'orange' : 'default'}
              className="cursor-pointer hover:scale-105 transition-transform px-3 py-1 text-sm"
              onClick={() => handlePopularClick(word)}
            >
              <span className="mr-1">
                {idx < 3 && <FireOutlined />}
              </span>
              {word.keyword}
              <span className="text-gray-400 ml-1 text-xs">({word.search_count})</span>
            </Tag>
          ))}
        </div>
      </Card>

      {searched && (
        <>
          <Divider orientation="left">
            <span className="flex items-center gap-2">
              <TranslationOutlined />
              搜索结果
              {searchResults.length > 0 && `（${searchResults.length}条）`}
            </span>
          </Divider>

          {searchResults.length === 0 ? (
            <Empty description="未找到相关方言释义" className="py-12" />
          ) : (
            <List
              dataSource={searchResults}
              renderItem={(item) => {
                const typeInfo = typeConfig[item.type] || { label: item.type, color: 'default' };
                return (
                  <List.Item className="card-hover rounded-xl mb-3 px-4 py-4">
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{
                            background: 'linear-gradient(135deg, #FF7A45, #EA580C)',
                          }}
                          className="text-xl"
                        >
                          {item.keyword?.[0]}
                        </Avatar>
                      }
                      title={
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-2xl font-bold text-gray-800">
                            {item.keyword}
                          </span>
                          <Tag color="blue">
                            <GlobalOutlined /> {item.dialect}
                          </Tag>
                          <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
                          <Tag color="purple">{item.grid_code}</Tag>
                        </div>
                      }
                      description={
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500">拼音：</span>
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                              {item.pinyin}
                            </span>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="text-gray-500 whitespace-nowrap">标准释义：</span>
                            <span className="text-lg font-semibold text-orange-600">
                              {item.standard_text}
                            </span>
                          </div>
                          <div className="text-sm text-gray-400 flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <FireOutlined className="text-orange-400" />
                              搜索 {item.search_count} 次
                            </span>
                            <span className="flex items-center gap-1">
                              <EnvironmentOutlined />
                              {item.grid_code}
                            </span>
                          </div>
                        </div>
                      }
                    />
                    <div className="flex flex-col gap-2 items-end">
                      <Button
                        type="primary"
                        size="small"
                        icon={<SoundOutlined />}
                        ghost
                      >
                        听发音
                      </Button>
                      <Button
                        type="link"
                        size="small"
                        onClick={() => handleSearch(item.keyword)}
                      >
                        搜索例句
                      </Button>
                    </div>
                  </List.Item>
                );
              }}
            />
          )}
        </>
      )}

      <Divider />

      <Card title="方言区分布" className="mt-6">
        <Row gutter={[16, 16]}>
          {['山东话', '河南话', '河北话', '湖北话', '江苏话', '北方方言'].map(
            (dialect, idx) => {
              const count = popularWords.filter((w) => w.dialect === dialect).length;
              const colors = [
                'from-red-100 to-red-200',
                'from-orange-100 to-orange-200',
                'from-yellow-100 to-yellow-200',
                'from-green-100 to-green-200',
                'from-blue-100 to-blue-200',
                'from-purple-100 to-purple-200',
              ];
              return (
                <Col xs={12} sm={8} lg={4} key={dialect}>
                  <div
                    className={`rounded-xl p-4 text-center bg-gradient-to-br ${colors[idx]}`}
                  >
                    <div className="text-2xl font-bold text-gray-700">{count}</div>
                    <div className="text-sm text-gray-600">{dialect}</div>
                  </div>
                </Col>
              );
            }
          )}
        </Row>
      </Card>
    </div>
  );
};

export default DialectSearch;
