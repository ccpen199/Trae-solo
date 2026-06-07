import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Tag,
  Avatar,
  Descriptions,
  Spin,
  message,
  Breadcrumb,
  Space,
  Divider,
  Timeline,
  List,
  Modal,
  Rate,
  Input,
  Row,
  Col,
  Statistic,
  Alert,
  Steps,
  Tabs,
  Empty,
} from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  MessageOutlined,
  FlagOutlined,
  ExclamationCircleOutlined,
  ShareAltOutlined,
  HistoryOutlined,
  ApartmentOutlined,
  WechatOutlined,
  QqOutlined,
  LinkOutlined,
  DatabaseOutlined,
  EyeOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { demandAPI, recommendAPI } from '../services/api';

const { TextArea } = Input;
const { Step } = Steps;

const DemandDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [demand, setDemand] = useState<any>(null);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [operations, setOperations] = useState<any[]>([]);
  const [recommendChains, setRecommendChains] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('detail');

  useEffect(() => {
    if (id) {
      loadDemand();
    }
  }, [id]);

  const loadDemand = async () => {
    try {
      setLoading(true);
      const [demandRes, opsRes, chainsRes] = await Promise.all([
        demandAPI.getDetail(Number(id)),
        demandAPI.getOperations(Number(id)),
        recommendAPI.getByDemand(Number(id)),
      ]);
      setDemand(demandRes.data);
      setOperations(opsRes.data || []);
      setRecommendChains(chainsRes.data || []);
    } catch (error) {
      message.error('加载需求详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setAcceptLoading(true);
      await demandAPI.accept(Number(id), 2);
      message.success('接单成功！请尽快联系需求发布者');
      loadDemand();
    } catch (error) {
      message.error('接单失败，请重试');
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleComplete = () => {
    setShowReviewModal(true);
  };

  const submitComplete = async () => {
    try {
      setCompleteLoading(true);
      await demandAPI.complete(Number(id));
      message.success('需求已完成！感谢您的服务');
      setShowReviewModal(false);
      loadDemand();
    } catch (error) {
      message.error('操作失败');
    } finally {
      setCompleteLoading(false);
    }
  };

  const handleDispute = () => {
    setShowDisputeModal(true);
  };

  const submitDispute = async () => {
    if (!disputeReason) {
      message.error('请填写申诉理由');
      return;
    }
    try {
      await demandAPI.dispute(Number(id), disputeReason, 1, '社区居民');
      message.success('申诉已提交，社区管理员将在24小时内处理');
      setShowDisputeModal(false);
      setDisputeReason('');
      loadDemand();
    } catch (error) {
      message.error('提交申诉失败，请重试');
    }
  };

  const handleShare = async (type: string) => {
    const shareData = {
      demandId: Number(id),
      fromUserId: 1,
      toUserId: 2,
      chainType: 'friend',
      chainDetail: `通过${type}分享`,
    };
    try {
      await recommendAPI.share(shareData);
      if (type === 'link') {
        const url = window.location.href;
        await navigator.clipboard.writeText(url);
        message.success('链接已复制到剪贴板');
      } else {
        message.success(`已通过${type === 'wechat' ? '微信' : 'QQ'}分享`);
      }
      setShowShareModal(false);
      loadDemand();
    } catch (error) {
      message.error('分享失败');
    }
  };

  const getOperationText = (operation: string) => {
    const map: Record<string, string> = {
      create: '发布需求',
      accept: '服务商接单',
      complete: '服务完成',
      dispute: '提交纠纷申诉',
      review: '服务评价',
      share: '分享需求',
      view: '浏览需求',
    };
    return map[operation] || operation;
  };

  const getOperationColor = (operation: string) => {
    const map: Record<string, string> = {
      create: 'green',
      accept: 'blue',
      complete: 'purple',
      dispute: 'red',
      review: 'orange',
      share: 'cyan',
      view: 'gray',
    };
    return map[operation] || 'default';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'orange';
      case 'accepted': return 'blue';
      case 'completed': return 'green';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return '待接单';
      case 'accepted': return '进行中';
      case 'completed': return '已完成';
      default: return '已取消';
    }
  };

  const getSceneText = (scene: string) => {
    const map: Record<string, string> = {
      neighbor: '邻里互助',
      recommend: '熟人推荐',
      notice: '社区公告',
      urgent: '紧急求助',
    };
    return map[scene] || scene;
  };

  const getChainText = (chain: string) => {
    const map: Record<string, { label: string; icon: string }> = {
      same_community: { label: '同小区', icon: '🏘️' },
      same_work: { label: '同单位', icon: '🏢' },
      same_school: { label: '同学校', icon: '🏫' },
      friend: { label: '朋友介绍', icon: '🤝' },
      none: { label: '无推荐链', icon: '📋' },
    };
    return map[chain] || { label: chain, icon: '🔗' };
  };

  const getStepStatus = (index: number) => {
    if (!demand) return 'wait';
    if (index === 0) return 'finish';
    if (index === 1) return demand.status !== 'open' ? 'finish' : 'process';
    if (index === 2) return demand.status === 'completed' ? 'finish' : demand.status === 'accepted' ? 'process' : 'wait';
    return demand.status === 'completed' ? 'finish' : 'wait';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }

  if (!demand) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert message="需求不存在" type="error" />
        <Button onClick={() => navigate('/demands')} className="mt-4">
          <ArrowLeftOutlined /> 返回需求列表
        </Button>
      </div>
    );
  }

  const chainInfo = getChainText(demand.recommend_chain);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fadeInUp">
      <Breadcrumb className="mb-6">
        <Breadcrumb.Item onClick={() => navigate('/')} className="cursor-pointer">
          <HomeOutlined /> 首页
        </Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate('/demands')} className="cursor-pointer">
          邻里互助
        </Breadcrumb.Item>
        <Breadcrumb.Item>需求详情</Breadcrumb.Item>
      </Breadcrumb>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <div className="flex items-center gap-3">
                <Tag color={getStatusColor(demand.status)}>
                  {getStatusText(demand.status)}
                </Tag>
                <span className="text-lg font-semibold">{demand.title}</span>
              </div>
            }
            className="mb-4 shadow-sm"
            extra={
              <Button type="link" onClick={() => navigate('/demands')}>
                <ArrowLeftOutlined /> 返回列表
              </Button>
            }
          >
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: 'detail',
                  label: (
                    <span>
                      <ApartmentOutlined /> 需求详情
                    </span>
                  ),
                  children: (
                    <>
                      <div className="mb-6">
                        <Steps size="small">
                          <Step title="发布需求" status={getStepStatus(0)} />
                          <Step title="服务商接单" status={getStepStatus(1)} />
                          <Step title="服务进行" status={getStepStatus(2)} />
                          <Step title="完成结算" status={getStepStatus(3)} />
                        </Steps>
                      </div>

                      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 mb-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar size={48} icon={<UserOutlined />} className="bg-orange-500" />
                            <div>
                              <div className="font-semibold">{demand.publisher_name || '社区居民'}</div>
                              <div className="text-sm text-gray-500">需求发布者</div>
                            </div>
                          </div>
                          <Statistic
                            title="酬金"
                            value={demand.reward}
                            prefix="¥"
                            valueStyle={{ color: '#fa8c16', fontSize: '24px' }}
                          />
                        </div>
                      </div>

                      <Descriptions column={1} bordered size="small" className="mb-6">
                        <Descriptions.Item label="需求类型">
                          <Tag color="orange">{demand.type}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="服务网格">
                          <Tag color="blue" icon={<EnvironmentOutlined />}>
                            {demand.grid_code}
                          </Tag>
                          <span className="text-gray-400 ml-2 text-sm">
                            （仅本网格服务商可见）
                          </span>
                        </Descriptions.Item>
                        <Descriptions.Item label="上门地址">
                          <EnvironmentOutlined className="mr-1 text-gray-400" />
                          {demand.address || '未填写'}
                        </Descriptions.Item>
                        <Descriptions.Item label="服务时段">
                          <ClockCircleOutlined className="mr-1 text-gray-400" />
                          {demand.service_time || '时间不限'}
                        </Descriptions.Item>
                        <Descriptions.Item label="互助场景">
                          <Tag color="purple" icon={<TeamOutlined />}>
                            {getSceneText(demand.scene)}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="熟人推荐链">
                          <span className="text-lg mr-2">{chainInfo.icon}</span>
                          <Tag color="green" icon={<SafetyCertificateOutlined />}>
                            {chainInfo.label}
                          </Tag>
                          <span className="text-gray-400 ml-2 text-sm">
                            （可追踪溯源）
                          </span>
                        </Descriptions.Item>
                      </Descriptions>

                      <Divider orientation="left">需求描述</Divider>
                      <p className="text-gray-700 leading-relaxed mb-6">
                        {demand.description}
                      </p>

                      <Divider orientation="left">服务追踪记录</Divider>
                      <Timeline className="mb-6">
                        <Timeline.Item color="green">
                          <p className="font-medium">需求发布</p>
                          <p className="text-sm text-gray-500">{demand.created_at}</p>
                        </Timeline.Item>
                        {demand.status !== 'open' && (
                          <Timeline.Item color="blue">
                            <p className="font-medium">服务商接单</p>
                            <p className="text-sm text-gray-500">
                              {demand.acceptor_name || '匿名服务商'} 已接单
                            </p>
                          </Timeline.Item>
                        )}
                        {demand.status === 'completed' && (
                          <Timeline.Item color="green">
                            <p className="font-medium">服务完成</p>
                            <p className="text-sm text-gray-500">需求已完成，双方确认</p>
                          </Timeline.Item>
                        )}
                      </Timeline>

                      {demand.status === 'open' && (
                        <Alert
                          message="温馨提示"
                          description={
                            <div>
                              <p>• 该需求仅对 <strong>{demand.grid_code}</strong> 网格内的认证服务商可见</p>
                              <p>• 接单后请尽快通过电话联系需求发布者确认服务细节</p>
                              <p>• 服务完成后请及时确认，保障双方权益</p>
                            </div>
                          }
                          type="info"
                          showIcon
                        />
                      )}
                    </>
                  ),
                },
                {
                  key: 'operations',
                  label: (
                    <span>
                      <HistoryOutlined /> 操作日志 {operations.length > 0 && <Tag color="blue" style={{ fontSize: '12px' }}>{operations.length}</Tag>}
                    </span>
                  ),
                  children: (
                    <div>
                      <Alert
                        message="数据留痕说明"
                        description="所有操作均记录IP地址、用户代理和时间戳，用于纠纷调解和安全审计"
                        type="info"
                        showIcon
                        icon={<DatabaseOutlined />}
                        className="mb-4"
                      />
                      {operations.length === 0 ? (
                        <Empty description="暂无操作记录" />
                      ) : (
                        <Timeline>
                          {operations.map((op, index) => (
                            <Timeline.Item key={op.id || index} color={getOperationColor(op.operation)}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{getOperationText(op.operation)}</span>
                                <Tag color={getOperationColor(op.operation)} style={{ fontSize: '12px' }}>
                                  {op.operator_name || '系统'}
                                </Tag>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{op.detail}</p>
                              <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                                <span><ClockCircleOutlined /> {op.created_at}</span>
                                {op.ip && <span><EnvironmentOutlined /> IP: {op.ip}</span>}
                              </div>
                            </Timeline.Item>
                          ))}
                        </Timeline>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'chains',
                  label: (
                    <span>
                      <ApartmentOutlined /> 推荐链追踪 {recommendChains.length > 0 && <Tag color="green" style={{ fontSize: '12px' }}>{recommendChains.length}</Tag>}
                    </span>
                  ),
                  children: (
                    <div>
                      <Alert
                        message="熟人推荐链"
                        description="追踪需求在社区熟人网络中的传播路径，保障服务可信度"
                        type="success"
                        showIcon
                        icon={<SafetyCertificateOutlined />}
                        className="mb-4"
                      />
                      {recommendChains.length === 0 ? (
                        <Empty description="暂无推荐记录，点击右下角分享按钮开始传播" />
                      ) : (
                        <List
                          dataSource={recommendChains}
                          renderItem={(chain) => (
                            <List.Item key={chain.id}>
                              <List.Item.Meta
                                avatar={<Avatar icon={<UserOutlined />} className="bg-green-500" />}
                                title={
                                  <div className="flex items-center gap-2">
                                    <span>{chain.from_user_name || '匿名用户'}</span>
                                    <span className="text-gray-400">→</span>
                                    <span>{chain.to_user_name || '匿名用户'}</span>
                                    <Tag color="green" style={{ fontSize: '12px' }}>{getChainText(chain.chain_type).label}</Tag>
                                  </div>
                                }
                                description={
                                  <div className="text-sm text-gray-500">
                                    <span className="mr-4"><ShareAltOutlined /> 分享 {chain.share_count || 0} 次</span>
                                    <span className="mr-4"><EyeOutlined /> 浏览 {chain.view_count || 0} 次</span>
                                    <span><ClockCircleOutlined /> {chain.created_at}</span>
                                  </div>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card className="shadow-sm sticky top-4">
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-orange-500 mb-1">
                ¥{demand.reward}
              </div>
              <div className="text-gray-500 text-sm">服务酬金</div>
            </div>

            <Space direction="vertical" className="w-full">
              {demand.status === 'open' && (
                <Button
                  type="primary"
                  size="large"
                  block
                  loading={acceptLoading}
                  onClick={handleAccept}
                  className="h-12"
                >
                  <CheckCircleOutlined /> 立即接单
                </Button>
              )}

              {demand.status === 'accepted' && (
                <>
                  <Button
                    type="primary"
                    size="large"
                    block
                    onClick={handleComplete}
                    className="h-12"
                  >
                    <CheckCircleOutlined /> 确认完成
                  </Button>
                  <Button
                    size="large"
                    block
                    danger
                    onClick={handleDispute}
                  >
                    <FlagOutlined /> 申请社区复查
                  </Button>
                </>
              )}

              <Button
                size="large"
                block
                icon={<PhoneOutlined />}
              >
                联系发布者
              </Button>

              <Button
                size="large"
                block
                icon={<MessageOutlined />}
              >
                发送消息
              </Button>

              <Button
                size="large"
                block
                icon={<SyncOutlined />}
                onClick={() => setShowShareModal(true)}
              >
                分享给熟人
              </Button>
            </Space>

            <Divider />

            <Row gutter={[8, 8]} className="mb-4">
              <Col span={12}>
                <Card size="small" className="text-center">
                  <EyeOutlined className="text-blue-500 text-xl" />
                  <div className="text-lg font-bold">{recommendChains.reduce((sum, c) => sum + (c.view_count || 0), 0)}</div>
                  <div className="text-xs text-gray-500">浏览次数</div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" className="text-center">
                  <ShareAltOutlined className="text-green-500 text-xl" />
                  <div className="text-lg font-bold">{recommendChains.reduce((sum, c) => sum + (c.share_count || 0), 0)}</div>
                  <div className="text-xs text-gray-500">分享次数</div>
                </Card>
              </Col>
            </Row>

            <Divider />

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <SafetyCertificateOutlined className="text-green-500" />
                社区保障
              </h4>
              <List
                size="small"
                dataSource={[
                  '服务商已通过街道备案认证',
                  '熟人推荐链可追踪溯源',
                  '社区管理员24小时纠纷调解',
                  '服务完成后酬金结算',
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <CheckCircleOutlined className="text-green-500 mr-2" />
                    {item}
                  </List.Item>
                )}
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title="确认服务完成"
        open={showReviewModal}
        onCancel={() => setShowReviewModal(false)}
        onOk={submitComplete}
        confirmLoading={completeLoading}
        okText="确认完成"
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">服务评分</label>
            <Rate value={reviewRating} onChange={setReviewRating} />
          </div>
          <div>
            <label className="block mb-2 font-medium">服务评价（选填）</label>
            <TextArea
              rows={4}
              placeholder="请评价本次服务..."
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      <Modal
        title="申请社区复查"
        open={showDisputeModal}
        onCancel={() => setShowDisputeModal(false)}
        onOk={submitDispute}
        okText="提交申诉"
        okButtonProps={{ danger: true }}
      >
        <Alert
          message="申诉说明"
          description="社区管理员将在24小时内介入调解，请如实填写申诉理由"
          type="warning"
          showIcon
          className="mb-4"
        />
        <div>
          <label className="block mb-2 font-medium">
            <ExclamationCircleOutlined className="mr-1 text-orange-500" />
            申诉理由
          </label>
          <TextArea
            rows={4}
            placeholder="请详细描述纠纷情况..."
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        title="分享给熟人"
        open={showShareModal}
        onCancel={() => setShowShareModal(false)}
        footer={null}
      >
        <Alert
          message="熟人推荐"
          description="通过熟人网络分享需求，服务可信度更高，纠纷调解更便捷"
          type="success"
          showIcon
          className="mb-4"
        />
        <div className="grid grid-cols-3 gap-4 text-center">
          <div
            className="cursor-pointer p-4 rounded-xl hover:bg-green-50 transition-colors"
            onClick={() => handleShare('wechat')}
          >
            <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-green-500 flex items-center justify-center">
              <WechatOutlined className="text-white text-2xl" />
            </div>
            <div className="font-medium">微信好友</div>
            <div className="text-xs text-gray-400">同小区/同单位</div>
          </div>
          <div
            className="cursor-pointer p-4 rounded-xl hover:bg-blue-50 transition-colors"
            onClick={() => handleShare('qq')}
          >
            <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-blue-500 flex items-center justify-center">
              <QqOutlined className="text-white text-2xl" />
            </div>
            <div className="font-medium">QQ好友</div>
            <div className="text-xs text-gray-400">同学校/同兴趣</div>
          </div>
          <div
            className="cursor-pointer p-4 rounded-xl hover:bg-orange-50 transition-colors"
            onClick={() => handleShare('link')}
          >
            <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-orange-500 flex items-center justify-center">
              <LinkOutlined className="text-white text-2xl" />
            </div>
            <div className="font-medium">复制链接</div>
            <div className="text-xs text-gray-400">其他社交渠道</div>
          </div>
        </div>
        <Divider />
        <div className="text-sm text-gray-500">
          <p className="mb-2"><SafetyCertificateOutlined className="text-green-500 mr-1" /> 推荐链优势：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>可追踪溯源，保障服务安全</li>
            <li>熟人背书，提升接单成功率</li>
            <li>社区调解，纠纷处理更便捷</li>
          </ul>
        </div>
      </Modal>
    </div>
  );
};

export default DemandDetail;
