import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Image,
  Table,
  Button,
  Form,
  Input,
  Modal,
  Space,
  Typography,
  message,
  Tag,
  Descriptions,
  Statistic,
  Alert,
  Timeline,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { reviewAPI, photoAPI, lossAPI } from '../services/api';
import { Photo, LossItem, PHOTO_CATEGORY_MAP } from '../types';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

const ReviewManagement: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const [reviewData, setReviewData] = useState<any>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [lossItems, setLossItems] = useState<LossItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [reviewResult, setReviewResult] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  useEffect(() => {
    if (taskId) {
      loadReviewData();
      loadPhotos();
      loadLossItems();
    }
  }, [taskId]);

  const loadReviewData = async () => {
    try {
      const response = await reviewAPI.getReviewData(taskId!);
      setReviewData(response.data);
    } catch (error) {
      message.error('加载审核数据失败');
    }
  };

  const loadPhotos = async () => {
    try {
      const response = await photoAPI.getPhotos(taskId!);
      setPhotos(response.data);
    } catch (error) {
      console.error('加载照片失败');
    }
  };

  const loadLossItems = async () => {
    try {
      const response = await lossAPI.getLossItems(taskId!);
      setLossItems(response.data);
    } catch (error) {
      console.error('加载损失项目失败');
    }
  };

  const handleReview = (result: string) => {
    setReviewResult(result);
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await reviewAPI.submitReview(taskId!, {
        version: 1,
        review_result: reviewResult,
        review_comments: values.review_comments,
        historical_risk: values.historical_risk,
      });
      message.success(reviewResult === 'approved' ? '审核通过' : '已驳回');
      setModalVisible(false);
      loadReviewData();
    } catch (error) {
      message.error('审核提交失败');
    } finally {
      setLoading(false);
    }
  };

  const groupedPhotos = photos.reduce((acc, photo) => {
    if (!acc[photo.category]) {
      acc[photo.category] = [];
    }
    acc[photo.category].push(photo);
    return acc;
  }, {} as Record<string, Photo[]>);

  const totalAmount = lossItems.reduce((sum, item) => sum + item.total_amount, 0);

  const lossColumns = [
    {
      title: '部位',
      dataIndex: 'part_name',
      key: 'part_name',
      width: 150,
    },
    {
      title: '配件',
      dataIndex: 'accessory_name',
      key: 'accessory_name',
      width: 120,
      render: (name: string) => name || '-',
    },
    {
      title: '工时费',
      dataIndex: 'labor_fee',
      key: 'labor_fee',
      width: 100,
      render: (fee: number) => `¥${fee}`,
    },
    {
      title: '残值',
      dataIndex: 'residual_value',
      key: 'residual_value',
      width: 100,
      render: (value: number) => value > 0 ? `-¥${value}` : '-',
    },
    {
      title: '小计',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 100,
      render: (amount: number) => <strong>¥{amount}</strong>,
    },
    {
      title: '价格来源',
      dataIndex: 'price_source',
      key: 'price_source',
      width: 100,
      render: (source: string) => (
        <Tag color={source === 'manual' ? 'orange' : 'blue'}>
          {source === 'manual' ? '人工调整' : '系统定价'}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>定损审核</Title>

      {reviewData?.task && (
        <Card style={{ marginBottom: 24 }}>
          <Descriptions bordered column={2} title="案件基本信息">
            <Descriptions.Item label="任务编号" span={1}>
              {reviewData.task.task_no}
            </Descriptions.Item>
            <Descriptions.Item label="状态" span={1}>
              <Tag color="purple">待审核</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="事故地点" span={1}>
              {reviewData.task.accident_location}
            </Descriptions.Item>
            <Descriptions.Item label="车主" span={1}>
              {reviewData.task.owner_name}
            </Descriptions.Item>
            <Descriptions.Item label="保单号" span={1}>
              {reviewData.task.policy_no}
            </Descriptions.Item>
            <Descriptions.Item label="车辆信息" span={1}>
              {reviewData.task.vehicle_info}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {reviewData?.historical_risk && (
        <Alert
          message="历史理赔风险"
          description={
            <div>
              <p>历史报案次数: {reviewData.historical_risk.claim_count || 0} 次</p>
              <p>平均理赔金额: ¥{reviewData.historical_risk.avg_amount || 0}</p>
              <p>拒赔次数: {reviewData.historical_risk.rejected_count || 0} 次</p>
            </div>
          }
          type="warning"
          showIcon
          icon={<HistoryOutlined />}
          style={{ marginBottom: 24 }}
        />
      )}

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="照片数量"
              value={photos.length}
              suffix="张"
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="损失项目"
              value={lossItems.length}
              suffix="项"
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="定损金额"
              value={totalAmount}
              prefix="¥"
              valueStyle={{ color: '#f5222d' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="审核记录"
              value={reviewData?.review_logs?.length || 0}
              suffix="次"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>
      </Card>

      <Card title="照片证据" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          {Object.entries(groupedPhotos).map(([cat, catPhotos]) => (
            <Col key={cat} span={24}>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
                {PHOTO_CATEGORY_MAP[cat] || cat} ({catPhotos.length})
              </div>
              <Row gutter={[8, 8]}>
                {catPhotos.map((photo) => (
                  <Col key={photo.id} xs={6} sm={4} md={3} lg={2}>
                    <div style={{ position: 'relative' }}>
                      <Image
                        src={photo.file_path}
                        alt={photo.file_name}
                        style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                        preview={false}
                        onClick={() => {
                          setPreviewImage(photo.file_path);
                          setPreviewVisible(true);
                        }}
                      />
                    </div>
                  </Col>
                ))}
              </Row>
            </Col>
          ))}
        </Row>
      </Card>

      <Card title="损失明细" style={{ marginBottom: 24 }}>
        <Table
          columns={lossColumns}
          dataSource={lossItems}
          rowKey="id"
          pagination={false}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={4}>
                <strong>总计</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>
                <strong style={{ color: '#f5222d' }}>¥{totalAmount}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} />
            </Table.Summary.Row>
          )}
        />
      </Card>

      {reviewData?.review_logs?.length > 0 && (
        <Card title="审核历史" style={{ marginBottom: 24 }}>
          <Timeline>
            {reviewData.review_logs.map((log: any) => (
              <Timeline.Item
                key={log.id}
                color={log.review_result === 'approved' ? 'green' : 'red'}
                dot={log.review_result === 'approved' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              >
                <p>
                  <strong>{log.reviewer_name}</strong>
                  <span style={{ marginLeft: 8, color: '#999' }}>
                    {dayjs(log.created_at).format('YYYY-MM-DD HH:mm')}
                  </span>
                </p>
                <p>
                  结果:
                  <Tag color={log.review_result === 'approved' ? 'green' : 'red'}>
                    {log.review_result === 'approved' ? '通过' : '驳回'}
                  </Tag>
                </p>
                {log.review_comments && <p>意见: {log.review_comments}</p>}
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      )}

      <Card>
        <Space>
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={() => handleReview('approved')}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            审核通过
          </Button>
          <Button
            type="primary"
            size="large"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => handleReview('rejected')}
          >
            驳回修改
          </Button>
        </Space>
      </Card>

      <Modal
        title={reviewResult === 'approved' ? '审核通过' : '驳回修改'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="review_comments"
            label="审核意见"
            rules={[{ required: true, message: '请输入审核意见' }]}
          >
            <TextArea rows={4} placeholder="请输入审核意见" />
          </Form.Item>
          <Form.Item name="historical_risk" label="历史风险说明">
            <TextArea rows={2} placeholder="请输入历史理赔风险说明（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width="80%"
        centered
      >
        <img src={previewImage} style={{ width: '100%' }} alt="预览" />
      </Modal>
    </div>
  );
};

export default ReviewManagement;
