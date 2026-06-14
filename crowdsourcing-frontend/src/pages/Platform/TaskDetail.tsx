import React, { useState, useEffect } from 'react';
import {
  Card,
  Tag,
  Tabs,
  Button,
  Avatar,
  Descriptions,
  List,
  Table,
  Rate,
  Modal,
  Form,
  Input,
  Upload,
  Progress,
  message,
  Spin,
  Empty,
  Space
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  MoneyCollectOutlined,
  ClockCircleOutlined,
  SafetyOutlined,
  FileTextOutlined,
  MessageOutlined,
  PaperClipOutlined,
  CheckCircleOutlined,
  EditOutlined,
  TrophyOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { Task, Bid, Submission, Payment, IPCertificate, Conversation } from '@/types';
import { taskApi, bidApi, submissionApi, paymentApi, ipApi, messageApi, matchApi } from '@/api';
import StatusTimeline from '@/components/StatusTimeline';
import SubmissionCard from '@/components/SubmissionCard';
import MessageList from '@/components/MessageList';
import dayjs from 'dayjs';

const { TextArea } = Input;

const statusColors: Record<string, string> = {
  draft: 'default',
  pending: 'warning',
  published: 'blue',
  bidding: 'processing',
  selected: 'cyan',
  in_progress: 'processing',
  submitted: 'blue',
  reviewing: 'gold',
  revising: 'orange',
  completed: 'success',
  cancelled: 'error',
  disputed: 'red'
};

const statusNames: Record<string, string> = {
  draft: '草稿',
  pending: '待审核',
  published: '已发布',
  bidding: '投标中',
  selected: '已选定',
  in_progress: '进行中',
  submitted: '已提交',
  reviewing: '评审中',
  revising: '修改中',
  completed: '已完成',
  cancelled: '已取消',
  disputed: '有争议'
};

const PlatformTaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [certificates, setCertificates] = useState<IPCertificate[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('detail');
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchedProviders, setMatchedProviders] = useState<any[]>([]);

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [taskData, bidsData, submissionsData, paymentsData, certificatesData] = await Promise.all([
        taskApi.getDetail(id),
        bidApi.getList(id, { page: 1, pageSize: 100 }),
        submissionApi.getList(id, { page: 1, pageSize: 100 }),
        paymentApi.getList({ page: 1, pageSize: 100 }),
        ipApi.getList({ page: 1, pageSize: 100 })
      ]);
      setTask(taskData);
      setBids(bidsData.list || []);
      setSubmissions(submissionsData.list || []);
      setPayments(paymentsData.list?.filter((p: Payment) => p.taskId === id) || []);
      setCertificates(certificatesData.list?.filter((c: IPCertificate) => c.taskId === id) || []);
    } catch (error) {
      console.error('Fetch task detail error:', error);
      message.error('获取办件详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchMatchedProviders = async () => {
    if (!id) return;
    try {
      setMatchLoading(true);
      const result = await matchApi.getMatchedProviders(id, { limit: 5 });
      setMatchedProviders(result || []);
    } catch (error) {
      console.error('Fetch matched providers error:', error);
    } finally {
      setMatchLoading(false);
    }
  };

  const handleAcceptBid = async (bid: Bid) => {
    setSelectedBid(bid);
    setAcceptModalVisible(true);
  };

  const confirmAcceptBid = async () => {
    if (!selectedBid) return;
    try {
      await bidApi.accept(selectedBid.id);
      message.success('已选定服务商');
      setAcceptModalVisible(false);
      setSelectedBid(null);
      fetchData();
    } catch (error) {
      console.error('Accept bid error:', error);
    }
  };

  const handleRejectBid = async (bidId: string) => {
    Modal.confirm({
      title: '拒绝投标',
      content: '确定要拒绝该服务商的投标吗？',
      onOk: async () => {
        try {
          await bidApi.reject(bidId);
          message.success('已拒绝投标');
          fetchData();
        } catch (error) {
          console.error('Reject bid error:', error);
        }
      }
    });
  };

  const handleInitConversation = async (providerId: string, providerName: string) => {
    try {
      const result = await messageApi.createConversation([providerId], id);
      setConversation(result);
      setActiveTab('messages');
    } catch (error) {
      console.error('Create conversation error:', error);
    }
  };

  const handlePayMilestone = async (milestoneId: string) => {
    if (!id) return;
    Modal.confirm({
      title: '支付里程碑款项',
      content: '确定要支付该里程碑款项吗？',
      onOk: async () => {
        try {
          await paymentApi.payMilestone(id, milestoneId);
          message.success('支付成功');
          fetchData();
        } catch (error) {
          console.error('Pay milestone error:', error);
        }
      }
    });
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const bidColumns = [
    {
      title: '服务商',
      dataIndex: 'providerName',
      key: 'providerName',
      render: (text: string, record: Bid) => (
        <div className="flex items-center gap-3">
          <Avatar src={record.providerAvatar} icon={<UserOutlined />}>
            {text?.charAt(0)}
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{text}</span>
              {record.providerVerified && <Tag color="green" icon={<SafetyOutlined />}>已认证</Tag>}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Rate disabled allowHalf defaultValue={record.providerRating} style={{ fontSize: 12 }} />
              <span>({record.providerReviewCount}条评价)</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: '报价',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => <span className="text-lg font-bold text-primary-700">{formatCurrency(price)}</span>,
      sorter: (a: Bid, b: Bid) => a.price - b.price
    },
    {
      title: '交付周期',
      dataIndex: 'deliveryDays',
      key: 'deliveryDays',
      render: (days: number) => `${days}天`,
      sorter: (a: Bid, b: Bid) => a.deliveryDays - b.deliveryDays
    },
    {
      title: '匹配度',
      key: 'matchScore',
      render: (_: any, record: Bid) => record.matchScore ? (
        <div>
          <Progress percent={record.matchScore} status="active" />
          {record.matchReasons && (
            <div className="text-xs text-gray-500 mt-1">
              {record.matchReasons.slice(0, 2).map((r, i) => (
                <Tag key={i} color="blue">{r}</Tag>
              ))}
            </div>
          )}
        </div>
      ) : <span className="text-gray-400">-</span>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          pending: 'processing',
          accepted: 'success',
          rejected: 'error',
          cancelled: 'default'
        };
        const names: Record<string, string> = {
          pending: '待审核',
          accepted: '已接受',
          rejected: '已拒绝',
          cancelled: '已取消'
        };
        return <Tag color={colors[status]}>{names[status]}</Tag>;
      }
    },
    {
      title: '投标时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
      sorter: (a: Bid, b: Bid) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf()
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Bid) => (
        <Space>
          {record.status === 'pending' && task?.status === 'bidding' && (
            <>
              <Button type="primary" onClick={() => handleAcceptBid(record)}>
                选定
              </Button>
              <Button danger onClick={() => handleRejectBid(record.id)}>
                拒绝
              </Button>
            </>
          )}
          <Button onClick={() => handleInitConversation(record.providerId, record.providerName)}>
            沟通
          </Button>
        </Space>
      )
    }
  ];

  const paymentColumns = [
    {
      title: '流水号',
      dataIndex: 'paymentNo',
      key: 'paymentNo'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const names: Record<string, string> = {
          deposit: '充值',
          milestone: '里程碑支付',
          refund: '退款',
          withdraw: '提现'
        };
        return names[type] || type;
      }
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => formatCurrency(amount)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          pending: 'processing',
          paid: 'success',
          refunded: 'default',
          escrow: 'warning',
          released: 'success'
        };
        const names: Record<string, string> = {
          pending: '待支付',
          paid: '已支付',
          refunded: '已退款',
          escrow: '托管中',
          released: '已释放'
        };
        return <Tag color={colors[status]}>{names[status]}</Tag>;
      }
    },
    {
      title: '收款方',
      dataIndex: 'payeeName',
      key: 'payeeName'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    }
  ];

  const certificateColumns = [
    {
      title: '证书编号',
      dataIndex: 'certificateNo',
      key: 'certificateNo'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const names: Record<string, string> = {
          copyright: '版权',
          patent: '专利',
          trademark: '商标'
        };
        return names[type] || type;
      }
    },
    {
      title: '名称',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '存证哈希',
      dataIndex: 'hash',
      key: 'hash',
      render: (hash: string) => <span className="font-mono text-xs">{hash}</span>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          pending: 'processing',
          issued: 'success',
          revoked: 'error'
        };
        const names: Record<string, string> = {
          pending: '待发证',
          issued: '已发证',
          revoked: '已撤销'
        };
        return <Tag color={colors[status]}>{names[status]}</Tag>;
      }
    },
    {
      title: '发证时间',
      dataIndex: 'issuedAt',
      key: 'issuedAt',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-96">
        <Empty description="办件不存在" />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'detail',
      label: <span><FileTextOutlined />需求详情</span>,
      children: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title="办件描述">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{task.description}</p>
            </Card>
            <Card title="技能要求">
              <div className="flex flex-wrap gap-2">
                {task.skills?.map((skill, index) => (
                  <Tag key={index} color="blue">{skill}</Tag>
                ))}
              </div>
            </Card>
            {task.attachments?.length > 0 && (
              <Card title="参考资料">
                <List
                  dataSource={task.attachments}
                  renderItem={(file) => (
                    <List.Item className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                      <div className="flex items-center gap-2">
                        <PaperClipOutlined className="text-primary-600" />
                        <span>{file.fileName}</span>
                        <span className="text-xs text-gray-400">({(file.fileSize / 1024).toFixed(2)} KB)</span>
                      </div>
                      <Button type="link" onClick={() => window.open(file.fileUrl, '_blank')}>下载</Button>
                    </List.Item>
                  )}
                />
              </Card>
            )}
            {task.deliveryStandards?.length > 0 && (
              <Card title="交付标准">
                <List
                  dataSource={task.deliveryStandards}
                  renderItem={(item, index) => (
                    <List.Item>
                      <div className="flex items-center gap-2">
                        <CheckCircleOutlined className="text-green-500" />
                        <span>{index + 1}. {item}</span>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            )}
            {task.milestones?.length > 0 && (
              <Card title="里程碑配置">
                <List
                  dataSource={task.milestones}
                  renderItem={(milestone) => (
                    <List.Item className="flex-col items-start p-4 bg-gray-50 rounded-lg mb-3">
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className="flex items-center gap-2">
                          <TrophyOutlined className="text-yellow-500" />
                          <span className="font-medium">{milestone.name}</span>
                          <Tag color={
                            milestone.status === 'completed' ? 'success' :
                            milestone.status === 'in_progress' ? 'processing' :
                            milestone.status === 'paid' ? 'blue' : 'default'
                          }>
                            {milestone.status === 'pending' ? '待开始' :
                             milestone.status === 'in_progress' ? '进行中' :
                             milestone.status === 'completed' ? '已完成' : '已支付'}
                          </Tag>
                        </div>
                        <span className="text-lg font-bold text-primary-700">{formatCurrency(milestone.amount)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-gray-500">
                          截止日期：{dayjs(milestone.deadline).format('YYYY-MM-DD')}
                        </span>
                        {milestone.status === 'completed' && (
                          <Button type="primary" onClick={() => handlePayMilestone(milestone.id)}>
                            确认支付
                          </Button>
                        )}
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            )}
          </div>
          <div className="space-y-6">
            <Card title="办件进度">
              <StatusTimeline
                currentStatus={task.status}
                createdAt={task.createdAt}
                selectedAt={task.selectedProviderId ? task.updatedAt : undefined}
                startedAt={task.status === 'in_progress' ? task.updatedAt : undefined}
                submittedAt={submissions.length > 0 ? submissions[0].submittedAt : undefined}
                completedAt={task.status === 'completed' ? task.updatedAt : undefined}
              />
            </Card>
            {task.status === 'bidding' && (
              <Card
                title="智能匹配推荐"
                extra={
                  <Button type="link" onClick={fetchMatchedProviders} loading={matchLoading}>
                    刷新推荐
                  </Button>
                }
              >
                {matchLoading ? (
                  <div className="flex justify-center py-8"><Spin /></div>
                ) : matchedProviders.length > 0 ? (
                  <List
                    dataSource={matchedProviders}
                    renderItem={(item) => (
                      <List.Item className="flex-col items-start p-3 bg-gray-50 rounded-lg mb-2">
                        <div className="flex items-center justify-between w-full mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar src={item.provider.avatar} icon={<UserOutlined />}>
                              {item.provider.name?.charAt(0)}
                            </Avatar>
                            <span className="font-medium">{item.provider.name}</span>
                          </div>
                          <Tag color="cyan">匹配度 {item.matchScore}%</Tag>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {item.matchReasons?.map((r: string, i: number) => (
                            <Tag key={i} color="blue">{r}</Tag>
                          ))}
                        </div>
                        <div className="flex gap-2 w-full">
                          <Button type="primary" className="flex-1">查看详情</Button>
                          <Button className="flex-1">发送邀请</Button>
                        </div>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="暂无匹配推荐" />
                )}
              </Card>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'bids',
      label: <span><UserOutlined />投标人 ({bids.length})</span>,
      children: (
        <Card>
          <Table
            columns={bidColumns}
            dataSource={bids}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1000 }}
          />
        </Card>
      )
    },
    {
      key: 'submissions',
      label: <span><EditOutlined />稿件管理 ({submissions.length})</span>,
      children: (
        <div>
          {submissions.length > 0 ? (
            submissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onStatusChange={fetchData}
                showReview={true}
              />
            ))
          ) : (
            <Card>
              <Empty description="暂无稿件提交" />
            </Card>
          )}
        </div>
      )
    },
    {
      key: 'messages',
      label: <span><MessageOutlined />沟通记录</span>,
      children: (
        <Card>
          {conversation ? (
            <MessageList conversationId={conversation.id} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <MessageOutlined className="text-6xl text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">选择服务商开始沟通</p>
              {bids.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {bids.slice(0, 5).map((bid) => (
                    <Button
                      key={bid.id}
                      onClick={() => handleInitConversation(bid.providerId, bid.providerName)}
                    >
                      与 {bid.providerName} 沟通
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      )
    },
    {
      key: 'payments',
      label: <span><MoneyCollectOutlined />支付信息</span>,
      children: (
        <Card>
          <Descriptions bordered column={2} className="mb-6">
            <Descriptions.Item label="预算范围">
              {formatCurrency(task.budgetMin)} - {formatCurrency(task.budgetMax)}
            </Descriptions.Item>
            <Descriptions.Item label="已支付金额">
              {formatCurrency(payments.filter(p => p.status === 'paid' || p.status === 'released').reduce((sum, p) => sum + p.amount, 0))}
            </Descriptions.Item>
            <Descriptions.Item label="托管金额">
              {formatCurrency(payments.filter(p => p.status === 'escrow').reduce((sum, p) => sum + p.amount, 0))}
            </Descriptions.Item>
            <Descriptions.Item label="剩余金额">
              {formatCurrency(task.budgetMax - payments.filter(p => p.status === 'paid' || p.status === 'released').reduce((sum, p) => sum + p.amount, 0))}
            </Descriptions.Item>
          </Descriptions>
          <Table
            columns={paymentColumns}
            dataSource={payments}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )
    },
    {
      key: 'ip',
      label: <span><SafetyOutlined />存证记录</span>,
      children: (
        <Card
          extra={
            <Button type="primary" onClick={() => message.info('知识产权存证功能')}>
              申请存证
            </Button>
          }
        >
          {certificates.length > 0 ? (
            <Table
              columns={certificateColumns}
              dataSource={certificates}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          ) : (
            <Empty description="暂无存证记录" />
          )}
        </Card>
      )
    }
  ];

  return (
    <div>
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/platform/tasks')}
            >
              返回列表
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">{task.title}</h2>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>办件编号：{task.taskNo}</span>
                <span>分类：{task.categoryName}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Tag color={statusColors[task.status]} className="text-base px-4 py-1">
              {statusNames[task.status]}
            </Tag>
            {task.auditStatus && (
              <Tag color={task.auditStatus === 'approved' ? 'success' : task.auditStatus === 'rejected' ? 'error' : 'warning'}>
                审核：{task.auditStatus === 'approved' ? '通过' : task.auditStatus === 'rejected' ? '拒绝' : '待审核'}
              </Tag>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <MoneyCollectOutlined />
              <span>预算范围</span>
            </div>
            <div className="text-xl font-bold text-primary-700">
              {formatCurrency(task.budgetMin)} - {formatCurrency(task.budgetMax)}
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <ClockCircleOutlined />
              <span>截止日期</span>
            </div>
            <div className="text-xl font-bold text-green-600">
              {dayjs(task.deadline).format('YYYY-MM-DD')}
            </div>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <UserOutlined />
              <span>投标人数</span>
            </div>
            <div className="text-xl font-bold text-orange-600">
              {task.bidCount} 人
            </div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <BarChartOutlined />
              <span>浏览次数</span>
            </div>
            <div className="text-xl font-bold text-purple-600">
              {task.viewCount} 次
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="card"
        />
      </Card>

      <Modal
        title="确认选定服务商"
        open={acceptModalVisible}
        onCancel={() => {
          setAcceptModalVisible(false);
          setSelectedBid(null);
        }}
        onOk={confirmAcceptBid}
        okText="确认选定"
        cancelText="取消"
      >
        {selectedBid && (
          <div>
            <p className="mb-4">确定要选定以下服务商吗？</p>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Avatar size={48} src={selectedBid.providerAvatar} icon={<UserOutlined />}>
                  {selectedBid.providerName?.charAt(0)}
                </Avatar>
                <div>
                  <div className="font-medium text-lg">{selectedBid.providerName}</div>
                  <div className="flex items-center gap-1">
                    <Rate disabled allowHalf defaultValue={selectedBid.providerRating} style={{ fontSize: 14 }} />
                    <span className="text-sm text-gray-500">({selectedBid.providerReviewCount}条评价)</span>
                  </div>
                </div>
              </div>
              <Descriptions column={2}>
                <Descriptions.Item label="报价">{formatCurrency(selectedBid.price)}</Descriptions.Item>
                <Descriptions.Item label="交付周期">{selectedBid.deliveryDays}天</Descriptions.Item>
              </Descriptions>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PlatformTaskDetail;
