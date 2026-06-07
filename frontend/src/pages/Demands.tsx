import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Tag,
  Input,
  Select,
  Button,
  Avatar,
  Modal,
  message,
  Spin,
  Empty,
} from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { demandAPI } from '../services/api';

const { Search } = Input;
const { Option } = Select;

const Demands = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [demands, setDemands] = useState<any[]>([]);
  const [filteredDemands, setFilteredDemands] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [demandType, setDemandType] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState<any>(null);

  useEffect(() => {
    loadDemands();
  }, []);

  useEffect(() => {
    filterDemands();
  }, [searchText, demandType, statusFilter, demands]);

  const loadDemands = async () => {
    try {
      setLoading(true);
      const res = await demandAPI.getList();
      setDemands(res.data || []);
      setFilteredDemands(res.data || []);
    } catch (error) {
      console.error('加载需求失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDemands = () => {
    let filtered = [...demands];

    if (searchText) {
      filtered = filtered.filter((d) =>
        d.title.includes(searchText) || d.description.includes(searchText) || d.type.includes(searchText)
      );
    }

    if (demandType) {
      filtered = filtered.filter((d) => d.type === demandType);
    }

    if (statusFilter) {
      filtered = filtered.filter((d) => d.status === statusFilter);
    }

    setFilteredDemands(filtered);
  };

  const demandTypes = ['代取快递', '照看老人', '家政清洁', '家电维修', '拼车出行', '二手转让', '其他'];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'open': return { color: 'success', text: '待接单', icon: <ClockCircleOutlined /> };
      case 'accepted': return { color: 'processing', text: '进行中', icon: <ClockCircleOutlined /> };
      case 'completed': return { color: 'default', text: '已完成', icon: <CheckCircleOutlined /> };
      case 'cancelled': return { color: 'error', text: '已取消', icon: <CheckCircleOutlined /> };
      default: return { color: 'default', text: '未知', icon: null };
    }
  };

  const handleAccept = (demand: any) => {
    setSelectedDemand(demand);
    setAcceptModalVisible(true);
  };

  const confirmAccept = async () => {
    if (!selectedDemand) return;
    
    try {
      await demandAPI.accept(selectedDemand.id, 1);
      message.success('接单成功！');
      setAcceptModalVisible(false);
      loadDemands();
    } catch (error) {
      message.error('接单失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeInUp">
      <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Noto Serif SC, serif' }}>
            <span className="gradient-text">邻里互助需求池</span>
          </h1>
          <p className="text-gray-500">互帮互助，共建和谐社区</p>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => navigate('/demands/publish')}>
          发布需求
        </Button>
      </div>

      <Card className="mb-6 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <Search
            placeholder="搜索需求标题或内容"
            allowClear
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
          
          <Select
            placeholder="需求类型"
            style={{ width: 150 }}
            allowClear
            value={demandType || undefined}
            onChange={setDemandType}
          >
            {demandTypes.map((type) => (
              <Option key={type} value={type}>{type}</Option>
            ))}
          </Select>

          <Select
            placeholder="状态筛选"
            style={{ width: 150 }}
            allowClear
            value={statusFilter || undefined}
            onChange={setStatusFilter}
          >
            <Option value="open">待接单</Option>
            <Option value="accepted">进行中</Option>
            <Option value="completed">已完成</Option>
          </Select>

          <div className="ml-auto text-gray-500">
            共 {filteredDemands.length} 条需求
          </div>
        </div>
      </Card>

      {filteredDemands.length === 0 ? (
        <Empty description="暂无符合条件的需求" />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredDemands.map((demand) => {
            const statusConfig = getStatusConfig(demand.status);
            return (
              <Col xs={24} md={12} lg={8} key={demand.id}>
                <Card className="card-hover h-full">
                  <div className="flex items-start justify-between mb-3">
                    <Tag color="orange">{demand.type}</Tag>
                    <Tag color={statusConfig.color as any}>
                      {statusConfig.icon} {statusConfig.text}
                    </Tag>
                  </div>
                  
                  <h3 className="font-bold text-lg mb-2 line-clamp-1">{demand.title}</h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{demand.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Avatar size="small" icon={<UserOutlined />} className="mr-2" />
                      <span className="text-sm text-gray-600">{demand.publisher_name || '匿名用户'}</span>
                    </div>
                    <span className="text-orange-500 font-bold text-lg">¥{demand.reward}</span>
                  </div>

                  <div className="text-xs text-gray-400 mb-4">
                    发布时间：{demand.created_at?.slice(0, 10)}
                  </div>

                  {demand.status === 'open' && (
                    <Button type="primary" block onClick={() => handleAccept(demand)}>
                      立即接单
                    </Button>
                  )}
                  {demand.status === 'accepted' && (
                    <div className="text-center text-blue-500">
                      接单者：{demand.acceptor_name || '已有人接单'}
                    </div>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <Modal
        title="确认接单"
        open={acceptModalVisible}
        onOk={confirmAccept}
        onCancel={() => setAcceptModalVisible(false)}
        okText="确认接单"
        cancelText="取消"
      >
        <p>您确定要接下这个需求吗？</p>
        <p className="text-gray-500 mt-2">需求：{selectedDemand?.title}</p>
        <p className="text-orange-500 font-semibold mt-2">酬金：¥{selectedDemand?.reward}</p>
      </Modal>
    </div>
  );
};

export default Demands;
