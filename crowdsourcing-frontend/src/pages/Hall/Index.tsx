import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Input, Select, Button, Tag, List, Statistic, Spin, Empty, message } from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  FileProtectOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { publicApi } from '@/api';
import dayjs from 'dayjs';

const { Option } = Select;

const statusMap: Record<string, { label: string; color: string }> = {
  published: { label: '待受理', color: 'blue' },
  bidding: { label: '待分配', color: 'orange' },
  in_progress: { label: '办理中', color: 'processing' },
  submitted: { label: '已提交', color: 'cyan' },
  reviewing: { label: '审核中', color: 'purple' },
  completed: { label: '已办结', color: 'success' },
  cancelled: { label: '已撤销', color: 'default' },
  disputed: { label: '有异议', color: 'red' },
  pending_review: { label: '待审核', color: 'gold' },
  draft: { label: '草稿', color: 'default' },
};

const HallIndex: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, svcRes, statsRes] = await Promise.all([
        publicApi.getCategories(),
        publicApi.getServices({ categoryId: selectedCategory, keyword, status: selectedStatus, page: 1, pageSize: 50 }),
        publicApi.getStatsOverview(),
      ]);
      setCategories(catRes || []);
      setServices(svcRes?.list || []);
      setStats(statsRes || {});
    } catch (error: any) {
      console.error('Fetch hall data error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleReset = () => {
    setKeyword('');
    setSelectedCategory(undefined);
    setSelectedStatus(undefined);
  };

  const handleSearch = () => { fetchData(); };

  const handleApply = async (categoryId: number) => {
    navigate(`/hall/scene?categoryId=${categoryId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">办事大厅</h1>
        <p className="text-blue-100 mb-6">公积金提取 · 户籍变更 · 公交查询 · 场馆预约 · 物业报修 · 一网通办</p>
        <div className="flex gap-3 max-w-2xl">
          <Input
            size="large"
            placeholder="搜索服务事项：公积金、户籍、医保、公交..."
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            className="flex-1"
          />
          <Button size="large" type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
          <Button size="large" icon={<ReloadOutlined />} onClick={() => { handleReset(); setTimeout(fetchData, 100); }}>重置</Button>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="text-center card-hover">
            <Statistic title="在线服务" value={stats.totalTasks || 0} suffix="项" prefix={<FileProtectOutlined className="text-blue-500" />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="text-center card-hover">
            <Statistic title="在线服务率" value={stats.onlineRate || 0} suffix="%" prefix={<TeamOutlined className="text-green-500" />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="text-center card-hover">
            <Statistic title="市民满意度" value={stats.satisfaction || 0} suffix="%" prefix={<CheckCircleOutlined className="text-orange-500" />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="text-center card-hover">
            <Statistic title="平均办理时长" value={stats.avgDays || 0} suffix="天" prefix={<ClockCircleOutlined className="text-purple-500" />} />
          </Card>
        </Col>
      </Row>

      <Card title="服务分类" className="card-hover">
        <Row gutter={[16, 16]}>
          {categories.map((cat: any) => (
            <Col xs={12} sm={8} lg={4} key={cat.id}>
              <Card
                hoverable
                className="text-center card-hover !border-0 !bg-blue-50"
                onClick={() => { setSelectedCategory(cat.id); handleApply(cat.id); }}
              >
                <div className="text-3xl mb-2">{cat.icon || '📋'}</div>
                <div className="font-medium text-gray-800">{cat.name}</div>
                <div className="text-xs text-gray-500 mt-1">{cat.taskCount || 0}个事项</div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card
        title="服务事项列表"
        className="card-hover"
        extra={
          <div className="flex gap-2">
            <Select placeholder="分类筛选" allowClear style={{ width: 140 }} value={selectedCategory} onChange={v => setSelectedCategory(v)}>
              {categories.map((c: any) => <Option key={c.id} value={c.id}>{c.name}</Option>)}
            </Select>
            <Select placeholder="状态筛选" allowClear style={{ width: 120 }} value={selectedStatus} onChange={v => setSelectedStatus(v)}>
              <Option value="published">待受理</Option>
              <Option value="in_progress">办理中</Option>
              <Option value="completed">已办结</Option>
            </Select>
            <Button type="primary" onClick={handleSearch}>筛选</Button>
          </div>
        }
      >
        <Spin spinning={loading}>
          {services.length > 0 ? (
            <List
              dataSource={services}
              renderItem={(item: any) => {
                const st = statusMap[item.status] || { label: item.status, color: 'default' };
                return (
                  <List.Item
                    className="cursor-pointer hover:bg-blue-50 px-4 rounded transition-colors"
                    onClick={() => navigate(`/hall/scene/${item.id}`)}
                  >
                    <List.Item.Meta
                      title={
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.title}</span>
                          <Tag color={st.color}>{st.label}</Tag>
                          {item.categoryName && <Tag color="blue">{item.categoryName}</Tag>}
                        </div>
                      }
                      description={
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {item.description?.substring(0, 80)}...
                        </div>
                      }
                    />
                    <div className="text-right text-xs text-gray-400">
                      <div>编号: {item.requestNo}</div>
                      <div>{dayjs(item.createdAt).format('YYYY-MM-DD')}</div>
                    </div>
                    <RightOutlined className="text-gray-300 ml-2" />
                  </List.Item>
                );
              }}
            />
          ) : (
            <Empty description="暂无服务事项" />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default HallIndex;
