import { useState, useEffect } from 'react';
import {
  Card,
  List,
  Tag,
  Button,
  Select,
  Spin,
  Breadcrumb,
  Drawer,
  Descriptions,
  Empty,
  Row,
  Col,
  Statistic,
  Divider,
  Space,
  Avatar,
  Alert,
} from 'antd';
import {
  HomeOutlined,
  BellOutlined,
  SafetyOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  FileTextOutlined,
  FlagOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { announcementAPI, gridAPI } from '../services/api';

const { Option } = Select;

const Announcements = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [grids, setGrids] = useState<any[]>([]);
  const [selectedGrid, setSelectedGrid] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedGrid, selectedType]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [annRes, gridRes] = await Promise.all([
        announcementAPI.getList({ gridCode: selectedGrid || undefined, type: selectedType || undefined }),
        gridAPI.getList(),
      ]);
      setAnnouncements(annRes.data || []);
      setGrids(gridRes.data || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeConfig = (type: string) => {
    const configs: Record<string, { label: string; color: string; icon: any }> = {
      policy: { label: '政策通知', color: 'blue', icon: <SafetyOutlined /> },
      notice: { label: '社区公告', color: 'green', icon: <BellOutlined /> },
      activity: { label: '活动预告', color: 'orange', icon: <FlagOutlined /> },
      warning: { label: '安全提醒', color: 'red', icon: <ExclamationCircleOutlined /> },
      job: { label: '招聘信息', color: 'purple', icon: <UserOutlined /> },
    };
    return configs[type] || { label: type, color: 'default', icon: <FileTextOutlined /> };
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 2: return 'red';
      case 1: return 'orange';
      default: return 'default';
    }
  };

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 2: return '重要';
      case 1: return '一般';
      default: return '普通';
    }
  };

  const handleViewDetail = async (announcement: any) => {
    try {
      const res = await announcementAPI.getDetail(announcement.id);
      setSelectedAnnouncement(res.data);
      setDrawerVisible(true);
    } catch (error) {
      setSelectedAnnouncement(announcement);
      setDrawerVisible(true);
    }
  };

  const typeStats = () => {
    const stats: Record<string, number> = {};
    announcements.forEach((a) => {
      stats[a.type] = (stats[a.type] || 0) + 1;
    });
    return stats;
  };

  const stats = typeStats();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeInUp">
      <Breadcrumb className="mb-6">
        <Breadcrumb.Item onClick={() => navigate('/')} className="cursor-pointer">
          <HomeOutlined /> 首页
        </Breadcrumb.Item>
        <Breadcrumb.Item>社区公告板</Breadcrumb.Item>
      </Breadcrumb>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Noto Serif SC, serif' }}>
            <span className="gradient-text">社区公告板</span>
          </h1>
          <p className="text-gray-500">对接街道政务系统，及时传递官方通知、活动预告和政策信息</p>
        </div>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={8} lg={4}>
          <Card className="text-center">
            <Statistic
              title="全部公告"
              value={announcements.length}
              prefix={<BellOutlined className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card className="text-center">
            <Statistic
              title="政策通知"
              value={stats.policy || 0}
              prefix={<SafetyOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card className="text-center">
            <Statistic
              title="活动预告"
              value={stats.activity || 0}
              prefix={<FlagOutlined className="text-orange-500" />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card className="text-center">
            <Statistic
              title="安全提醒"
              value={stats.warning || 0}
              prefix={<ExclamationCircleOutlined className="text-red-500" />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <Select
            placeholder="选择社区网格"
            style={{ width: 200 }}
            allowClear
            value={selectedGrid || undefined}
            onChange={setSelectedGrid}
            showSearch
          >
            {grids.map((grid: any) => (
              <Option key={grid.code} value={grid.code}>
                {grid.name}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="公告类型"
            style={{ width: 150 }}
            allowClear
            value={selectedType || undefined}
            onChange={setSelectedType}
          >
            <Option value="policy">政策通知</Option>
            <Option value="notice">社区公告</Option>
            <Option value="activity">活动预告</Option>
            <Option value="warning">安全提醒</Option>
            <Option value="job">招聘信息</Option>
          </Select>

          <Space className="ml-auto">
            {['policy', 'notice', 'activity', 'warning', 'job'].map((type) => {
              const config = getTypeConfig(type);
              return (
                <Tag
                  key={type}
                  color={selectedType === type ? config.color : 'default'}
                  className="cursor-pointer"
                  onClick={() => setSelectedType(selectedType === type ? '' : type)}
                >
                  {config.icon} {config.label}
                </Tag>
              );
            })}
          </Space>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <Spin size="large" />
        </div>
      ) : announcements.length === 0 ? (
        <Empty description="暂无公告" />
      ) : (
        <List
          dataSource={announcements}
          renderItem={(item) => {
            const typeConfig = getTypeConfig(item.type);
            return (
              <List.Item
                className="card-hover rounded-xl mb-3 px-4 py-3"
                onClick={() => handleViewDetail(item)}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      style={{ backgroundColor: `${typeConfig.color}`, color: 'white' }}
                      icon={typeConfig.icon}
                    />
                  }
                  title={
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{item.title}</span>
                      <Tag color={getPriorityColor(item.priority)}>
                        {getPriorityText(item.priority)}
                      </Tag>
                      <Tag color={typeConfig.color}>
                        {typeConfig.label}
                      </Tag>
                    </div>
                  }
                  description={
                    <div className="mt-2">
                      <p className="text-gray-600 line-clamp-2 mb-2">{item.content}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <UserOutlined /> {item.publisher}
                        </span>
                        <span className="flex items-center gap-1">
                          <EnvironmentOutlined /> {item.grid_name || item.grid_code}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarOutlined /> {item.created_at?.split('T')[0]}
                        </span>
                        {item.expire_date && (
                          <span className="text-orange-500">
                            有效期至 {item.expire_date}
                          </span>
                        )}
                      </div>
                    </div>
                  }
                />
                <Button type="link">查看详情</Button>
              </List.Item>
            );
          }}
        />
      )}

      <Drawer
        title="公告详情"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={500}
      >
        {selectedAnnouncement && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Tag color={getPriorityColor(selectedAnnouncement.priority)}>
                  {getPriorityText(selectedAnnouncement.priority)}
                </Tag>
                <Tag color={getTypeConfig(selectedAnnouncement.type).color}>
                  {getTypeConfig(selectedAnnouncement.type).label}
                </Tag>
              </div>
              <h2 className="text-xl font-bold">{selectedAnnouncement.title}</h2>
            </div>

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="发布单位">
                <div className="flex items-center gap-2">
                  <UserOutlined className="text-gray-400" />
                  {selectedAnnouncement.publisher}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="服务网格">
                <div className="flex items-center gap-2">
                  <EnvironmentOutlined className="text-gray-400" />
                  {selectedAnnouncement.grid_name || selectedAnnouncement.grid_code}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="发布时间">
                <div className="flex items-center gap-2">
                  <CalendarOutlined className="text-gray-400" />
                  {selectedAnnouncement.created_at?.replace('T', ' ')}
                </div>
              </Descriptions.Item>
              {selectedAnnouncement.expire_date && (
                <Descriptions.Item label="有效期至">
                  <span className="text-orange-500 font-medium">
                    {selectedAnnouncement.expire_date}
                  </span>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider orientation="left">公告内容</Divider>
            <div className="bg-gray-50 rounded-lg p-4 leading-relaxed text-gray-700">
              {selectedAnnouncement.content}
            </div>

            <Alert
              message="官方信息"
              description="本公告由街道政务系统同步发布，信息真实有效。如有疑问，请联系社区居委会。"
              type="info"
              showIcon
            />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Announcements;
