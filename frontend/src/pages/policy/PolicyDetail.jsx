import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Space,
  List,
  Descriptions,
  Skeleton,
  Empty,
  Typography,
  message,
  Tooltip,
  Divider,
  Modal,
  Rate,
  Input,
} from 'antd';
import {
  ArrowLeftOutlined,
  StarOutlined,
  StarFilled,
  ShareAltOutlined,
  MessageOutlined,
  DownloadOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  LikeOutlined,
  DislikeOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import useRequest from '../../hooks/useRequest';
import { getPolicy } from '../../api/policy';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const mockPolicy = {
  id: 1,
  title: '关于完善企业职工基本养老保险制度的实施意见',
  issuer: '人力资源社会保障部',
  issueDate: '2024-01-15',
  documentNumber: '人社部发〔2024〕1号',
  type: 'national',
  typeLabel: '国家级',
  typeColor: '#F5222D',
  category: 'pension',
  targetPopulations: ['参保人', '退休人员'],
  matterTypes: ['社保参保', '待遇领取'],
  regions: ['省本级', '各市'],
  views: 12580,
  isFavorite: false,
  content: `
    <h2 style="color: #1E6FDB; margin-bottom: 16px;">一、总体要求</h2>
    <p style="text-indent: 2em; line-height: 1.8; margin-bottom: 16px;">
      为深入贯彻落实党的二十大精神，完善企业职工基本养老保险制度，促进养老保险制度可持续发展，根据《中华人民共和国社会保险法》等法律法规，结合我省实际，制定本实施意见。
    </p>
    
    <h2 style="color: #1E6FDB; margin-bottom: 16px;">二、主要内容</h2>
    <h3 style="color: #333; margin-bottom: 12px;">（一）扩大养老保险覆盖范围</h3>
    <p style="text-indent: 2em; line-height: 1.8; margin-bottom: 16px;">
      各类企业、民办非企业单位、社会团体、基金会、律师事务所、会计师事务所等组织和有雇工的个体工商户（以下称用人单位）及其职工（以下称职工），应当依法参加企业职工基本养老保险。
    </p>
    
    <h3 style="color: #333; margin-bottom: 12px;">（二）完善缴费基数政策</h3>
    <p style="text-indent: 2em; line-height: 1.8; margin-bottom: 16px;">
      1. 职工个人缴费基数原则上以上一年度本人月平均工资为基础，在全省全口径城镇单位就业人员平均工资的60%至300%之间核定。
    </p>
    <p style="text-indent: 2em; line-height: 1.8; margin-bottom: 16px;">
      2. 用人单位缴费基数为本单位职工个人缴费工资基数之和。
    </p>
    
    <h3 style="color: #333; margin-bottom: 12px;">（三）调整缴费比例</h3>
    <p style="text-indent: 2em; line-height: 1.8; margin-bottom: 16px;">
      从2024年1月1日起，企业职工基本养老保险单位缴费比例调整为16%，个人缴费比例为8%。
    </p>
    
    <h2 style="color: #1E6FDB; margin-bottom: 16px;">三、工作要求</h2>
    <p style="text-indent: 2em; line-height: 1.8; margin-bottom: 16px;">
      各级人力资源社会保障部门要加强组织领导，精心组织实施，确保各项政策措施落到实处。要加强政策宣传解读，及时回应社会关切，营造良好的舆论氛围。
    </p>
  `,
  attachments: [
    { id: 1, name: '附件1：养老保险缴费基数对照表.xlsx', size: '1.2MB' },
    { id: 2, name: '附件2：政策解读.pdf', size: '3.5MB' },
  ],
  relatedPolicies: [
    { id: 2, title: '关于调整2024年度社会保险缴费基数的通知', issueDate: '2024-01-05' },
    { id: 3, title: '关于做好灵活就业人员养老保险参保工作的通知', issueDate: '2023-12-28' },
    { id: 4, title: '关于完善养老保险待遇计发办法的通知', issueDate: '2023-12-20' },
  ],
};

const PolicyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [satisfaction, setSatisfaction] = useState(5);

  const { loading, data: policyData } = useRequest(() => getPolicy(id), {
    onError: () => {
      message.error('获取政策详情失败');
    },
  });

  const policy = policyData || mockPolicy;

  const handleBack = () => {
    navigate('/policy/list');
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    message.success(isFavorite ? '已取消收藏' : '已添加收藏');
  };

  const handleShare = () => {
    message.success('分享链接已复制到剪贴板');
  };

  const handleFeedback = () => {
    setFeedbackModalVisible(true);
  };

  const handleSubmitFeedback = () => {
    if (!feedbackContent.trim()) {
      message.warning('请输入反馈内容');
      return;
    }
    message.success('反馈提交成功，感谢您的宝贵意见！');
    setFeedbackModalVisible(false);
    setFeedbackContent('');
    setSatisfaction(5);
  };

  const handleDownload = (attachment) => {
    message.success(`正在下载 ${attachment.name}...`);
  };

  const handleViewRelated = (policyId) => {
    navigate(`/policy/list/${policyId}`);
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 20 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            返回列表
          </Button>
          <Title level={3} style={{ margin: 0 }}>政策详情</Title>
        </Space>
        <Space>
          <Tooltip title={isFavorite ? '取消收藏' : '收藏'}>
            <Button
              icon={isFavorite ? <StarFilled style={{ color: '#FAAD14' }} /> : <StarOutlined />}
              onClick={handleToggleFavorite}
            >
              {isFavorite ? '已收藏' : '收藏'}
            </Button>
          </Tooltip>
          <Tooltip title="分享">
            <Button icon={<ShareAltOutlined />} onClick={handleShare}>
              分享
            </Button>
          </Tooltip>
          <Tooltip title="反馈">
            <Button
              type="primary"
              icon={<MessageOutlined />}
              onClick={handleFeedback}
              style={{ background: '#1E6FDB' }}
            >
              意见反馈
            </Button>
          </Tooltip>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={17}>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 24 }}>
              <Space wrap style={{ marginBottom: 12 }}>
                <Tag color={policy.typeColor}>{policy.typeLabel}</Tag>
                {policy.targetPopulations?.map((pop) => (
                  <Tag key={pop} color="blue" style={{ background: '#E6F4FF', color: '#1E6FDB' }}>
                    {pop}
                  </Tag>
                ))}
                {policy.matterTypes?.map((matter) => (
                  <Tag key={matter} color="green" style={{ background: '#F6FFED', color: '#52C41A' }}>
                    {matter}
                  </Tag>
                ))}
                {policy.regions?.map((region) => (
                  <Tag key={region} color="orange" style={{ background: '#FFF7E6', color: '#FAAD14' }}>
                    {region}
                  </Tag>
                ))}
              </Space>
              <Title level={2} style={{ margin: '16px 0', color: '#333' }}>
                {policy.title}
              </Title>
              <Descriptions bordered column={2} size="middle" style={{ marginTop: 16 }}>
                <Descriptions.Item label="发布机构">{policy.issuer}</Descriptions.Item>
                <Descriptions.Item label="发布日期">{policy.issueDate}</Descriptions.Item>
                <Descriptions.Item label="文号">{policy.documentNumber}</Descriptions.Item>
                <Descriptions.Item label="浏览次数">
                  <Space>
                    <EyeOutlined />
                    {policy.views?.toLocaleString()}
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </div>

            <Divider />

            <div
              className="policy-content"
              style={{ fontSize: 16, lineHeight: 1.8, color: '#333' }}
              dangerouslySetInnerHTML={{ __html: policy.content }}
            />

            {policy.attachments && policy.attachments.length > 0 && (
              <>
                <Divider />
                <div>
                  <Title level={4} style={{ marginBottom: 16 }}>
                    <Space>
                      <PaperClipOutlined style={{ color: '#1E6FDB' }} />
                      附件下载
                    </Space>
                  </Title>
                  <List
                    dataSource={policy.attachments}
                    locale={{ emptyText: <Empty description="暂无附件" /> }}
                    renderItem={(item) => (
                      <List.Item
                        style={{
                          padding: '12px 16px',
                          background: '#F9FAFB',
                          borderRadius: 8,
                          marginBottom: 8,
                        }}
                      >
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <Space>
                            <FileTextOutlined style={{ color: '#1E6FDB', fontSize: 20 }} />
                            <div>
                              <Text strong>{item.name}</Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {item.size}
                              </Text>
                            </div>
                          </Space>
                          <Button
                            type="primary"
                            icon={<DownloadOutlined />}
                            onClick={() => handleDownload(item)}
                            style={{ background: '#1E6FDB' }}
                          >
                            下载
                          </Button>
                        </Space>
                      </List.Item>
                    )}
                  />
                </div>
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} sm={24} md={7}>
          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: '#1E6FDB' }} />
                相关政策推荐
              </Space>
            }
          >
            {policy.relatedPolicies && policy.relatedPolicies.length > 0 ? (
              <List
                dataSource={policy.relatedPolicies}
                locale={{ emptyText: <Empty description="暂无相关政策" /> }}
                renderItem={(item, index) => (
                  <List.Item
                    style={{
                      cursor: 'pointer',
                      padding: '12px 0',
                      borderBottom: index < policy.relatedPolicies.length - 1 ? '1px solid #f0f0f0' : 'none',
                    }}
                    onClick={() => handleViewRelated(item.id)}
                  >
                    <div>
                      <Text
                        ellipsis
                        style={{
                          display: 'block',
                          color: '#333',
                          marginBottom: 4,
                          lineHeight: 1.5,
                        }}
                      >
                        {item.title}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.issueDate}
                      </Text>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无相关政策" />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="意见反馈"
        open={feedbackModalVisible}
        onCancel={() => setFeedbackModalVisible(false)}
        onOk={handleSubmitFeedback}
        okText="提交反馈"
        cancelText="取消"
        okButtonProps={{ style: { background: '#1E6FDB' } }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            您对该政策的满意度：
          </Text>
          <Rate
            value={satisfaction}
            onChange={setSatisfaction}
            style={{ fontSize: 24 }}
          />
        </div>
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            请输入您的意见或建议：
          </Text>
          <TextArea
            rows={4}
            placeholder="请输入您的意见或建议..."
            value={feedbackContent}
            onChange={(e) => setFeedbackContent(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};

export default PolicyDetail;
