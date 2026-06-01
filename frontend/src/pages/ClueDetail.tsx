import React, { useEffect, useState } from 'react';
import {
  Button, Card, Descriptions, Tag, Space, Divider, Form, Input, Select,
  DatePicker, Upload, Checkbox, message, Row, Col, Timeline, Modal
} from 'antd';
import {
  ArrowLeftOutlined, AuditOutlined, SendOutlined, FileDoneOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { clueApi } from '../api';
import { STATUS_MAP, DEPARTMENTS, RISK_TAGS, SECURITY_LEVELS } from '../utils/constants';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const ClueDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [detail, setDetail] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewForm] = Form.useForm();
  const [dispatchForm] = Form.useForm();
  const [feedbackForm] = Form.useForm();
  const [reviewModal, setReviewModal] = useState(false);
  const [dispatchModal, setDispatchModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadData(parseInt(id));
    }
  }, [id]);

  const loadData = async (clueId: number) => {
    try {
      const [detailRes, historyRes] = await Promise.all([
        clueApi.getDetail(clueId),
        clueApi.getHistory(clueId)
      ]);
      setDetail(detailRes.data);
      setHistory(historyRes.data);
    } catch (error: any) {
      message.error(error.response?.data?.error || '加载详情失败');
    }
  };

  const handleReview = async (values: any) => {
    if (!id) return;
    setLoading(true);
    try {
      await clueApi.review(parseInt(id), {
        ...values,
        historical_clues: values.historical_clues?.split(',').map((s: string) => s.trim()).filter(Boolean)
      });
      message.success('研判完成');
      setReviewModal(false);
      loadData(parseInt(id));
    } catch (error: any) {
      message.error(error.response?.data?.error || '研判失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async (values: any) => {
    if (!id) return;
    setLoading(true);
    try {
      await clueApi.dispatch(parseInt(id), {
        ...values,
        deadline: values.deadline.format('YYYY-MM-DD HH:mm:ss'),
        co_units: values.co_units || []
      });
      message.success('派发成功');
      setDispatchModal(false);
      loadData(parseInt(id));
    } catch (error: any) {
      message.error(error.response?.data?.error || '派发失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (values: any) => {
    if (!id) return;
    setLoading(true);
    try {
      await clueApi.feedback(parseInt(id), values);
      message.success(values.is_returned ? '已退回补充' : '反馈完成');
      setFeedbackModal(false);
      loadData(parseInt(id));
    } catch (error: any) {
      message.error(error.response?.data?.error || '反馈失败');
    } finally {
      setLoading(false);
    }
  };

  if (!detail) return null;

  const { clue, review, dispatch, feedback } = detail;
  const statusInfo = STATUS_MAP[clue.status] || { label: clue.status, color: 'default' };

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/clues')}>
            返回列表
          </Button>
          <h2>线索详情 - {clue.clue_no}</h2>
          <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
        </Space>
        <Space>
          {clue.status === 'pending' && (
            <Button type="primary" icon={<AuditOutlined />} onClick={() => setReviewModal(true)}>
              研判
            </Button>
          )}
          {(clue.status === 'reviewed' || clue.status === 'returned') && (
            <Button type="primary" icon={<SendOutlined />} onClick={() => setDispatchModal(true)}>
              派发
            </Button>
          )}
          {clue.status === 'dispatched' && (
            <Button type="primary" icon={<FileDoneOutlined />} onClick={() => setFeedbackModal(true)}>
              处置反馈
            </Button>
          )}
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="基本信息" className="detail-card">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="线索编号">{clue.clue_no}</Descriptions.Item>
              <Descriptions.Item label="来源渠道">{clue.source_channel}</Descriptions.Item>
              <Descriptions.Item label="标题" span={2}>{clue.title}</Descriptions.Item>
              <Descriptions.Item label="详细描述" span={2}>
                {clue.description || '无'}
              </Descriptions.Item>
              <Descriptions.Item label="涉及人员">{clue.involved_persons || '无'}</Descriptions.Item>
              <Descriptions.Item label="发生地点">{clue.location || '无'}</Descriptions.Item>
              <Descriptions.Item label="发生时间">
                {clue.occur_time ? dayjs(clue.occur_time).format('YYYY-MM-DD HH:mm') : '无'}
              </Descriptions.Item>
              <Descriptions.Item label="分类">{clue.category || '未分类'}</Descriptions.Item>
              <Descriptions.Item label="保密等级">
                {SECURITY_LEVELS.find(l => l.value === clue.security_level)?.label}
              </Descriptions.Item>
              <Descriptions.Item label="创建人">{clue.creator_name}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(clue.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {review && (
            <Card title="研判信息" className="detail-card">
              <Descriptions column={2} bordered>
                <Descriptions.Item label="关联案件">{review.related_case || '无'}</Descriptions.Item>
                <Descriptions.Item label="研判人">{review.reviewer_name}</Descriptions.Item>
                <Descriptions.Item label="风险标签">
                  {review.risk_tags ? JSON.parse(review.risk_tags).map((tag: string) => (
                    <Tag key={tag} color="orange">{tag}</Tag>
                  )) : '无'}
                </Descriptions.Item>
                <Descriptions.Item label="是否重复">
                  {review.is_duplicate ? '是' : '否'}
                </Descriptions.Item>
                <Descriptions.Item label="研判意见" span={2}>
                  {review.review_opinion || '无'}
                </Descriptions.Item>
                <Descriptions.Item label="研判时间" span={2}>
                  {dayjs(review.reviewed_at).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {dispatch && (
            <Card title="派发信息" className="detail-card">
              <Descriptions column={2} bordered>
                <Descriptions.Item label="责任单位">{dispatch.responsible_unit}</Descriptions.Item>
                <Descriptions.Item label="派发人">{dispatch.dispatcher_name}</Descriptions.Item>
                <Descriptions.Item label="协办单位">
                  {dispatch.co_units ? JSON.parse(dispatch.co_units).join(', ') : '无'}
                </Descriptions.Item>
                <Descriptions.Item label="办理时限">
                  {dayjs(dispatch.deadline).format('YYYY-MM-DD HH:mm')}
                  {dayjs(dispatch.deadline).isBefore(dayjs()) && (
                    <Tag color="red" style={{ marginLeft: 8 }}>已逾期</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="反馈要求" span={2}>
                  {dispatch.feedback_requirements || '无'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {feedback && (
            <Card title="反馈信息" className="detail-card">
              <Descriptions column={2} bordered>
                <Descriptions.Item label="核查结果" span={2}>{feedback.check_result || '无'}</Descriptions.Item>
                <Descriptions.Item label="采取措施" span={2}>{feedback.measures_taken || '无'}</Descriptions.Item>
                <Descriptions.Item label="结案意见" span={2}>{feedback.closing_opinion || '无'}</Descriptions.Item>
                <Descriptions.Item label="处理结果">
                  {feedback.is_returned ? (
                    <Tag color="red">退回补充</Tag>
                  ) : (
                    <Tag color="green">结案</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="反馈人">{feedback.feedbacker_name}</Descriptions.Item>
                {feedback.is_returned && (
                  <Descriptions.Item label="退回原因" span={2}>{feedback.return_reason}</Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          )}
        </Col>

        <Col span={8}>
          <Card title="流转记录">
            <Timeline>
              {history.map((item: any, idx: number) => (
                <Timeline.Item key={idx}>
                  <div>
                    <strong>{item.action}</strong> - {item.operator}
                  </div>
                  <div style={{ color: '#999', fontSize: 12 }}>
                    {dayjs(item.time).format('YYYY-MM-DD HH:mm')}
                  </div>
                  <div style={{ marginTop: 4 }}>{item.content}</div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>

      <Modal
        title="线索研判"
        open={reviewModal}
        onCancel={() => setReviewModal(false)}
        footer={null}
        width={700}
      >
        <Form form={reviewForm} layout="vertical" onFinish={handleReview}>
          <Form.Item name="related_case" label="关联案件">
            <Input placeholder="关联的案件编号或名称" />
          </Form.Item>
          <Form.Item name="historical_clues" label="历史线索">
            <Input placeholder="相关历史线索编号，多个用逗号分隔" />
          </Form.Item>
          <Form.Item name="risk_tags" label="风险标签">
            <Select mode="multiple" placeholder="选择风险标签">
              {RISK_TAGS.map(tag => (
                <Option key={tag} value={tag}>{tag}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="review_opinion" label="研判意见">
            <TextArea rows={4} placeholder="请输入研判意见" />
          </Form.Item>
          <Form.Item name="is_duplicate" valuePropName="checked">
            <Checkbox>标记为重复线索</Checkbox>
          </Form.Item>
          <div className="form-actions">
            <Space>
              <Button onClick={() => setReviewModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>提交研判</Button>
            </Space>
          </div>
        </Form>
      </Modal>

      <Modal
        title="线索派发"
        open={dispatchModal}
        onCancel={() => setDispatchModal(false)}
        footer={null}
        width={700}
      >
        <Form form={dispatchForm} layout="vertical" onFinish={handleDispatch}>
          <Form.Item
            name="responsible_unit"
            label="责任单位"
            rules={[{ required: true, message: '请选择责任单位' }]}
          >
            <Select placeholder="请选择责任单位">
              {DEPARTMENTS.map(d => (
                <Option key={d} value={d}>{d}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="deadline"
            label="办理时限"
            rules={[{ required: true, message: '请选择办理时限' }]}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
          <Form.Item name="co_units" label="协办单位">
            <Select mode="multiple" placeholder="请选择协办单位">
              {DEPARTMENTS.map(d => (
                <Option key={d} value={d}>{d}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="feedback_requirements" label="反馈要求">
            <TextArea rows={3} placeholder="请输入反馈要求" />
          </Form.Item>
          <div className="form-actions">
            <Space>
              <Button onClick={() => setDispatchModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>确认派发</Button>
            </Space>
          </div>
        </Form>
      </Modal>

      <Modal
        title="处置反馈"
        open={feedbackModal}
        onCancel={() => setFeedbackModal(false)}
        footer={null}
        width={700}
      >
        <Form form={feedbackForm} layout="vertical" onFinish={handleFeedback}>
          <Form.Item name="check_result" label="核查结果">
            <TextArea rows={3} placeholder="请输入核查结果" />
          </Form.Item>
          <Form.Item name="measures_taken" label="采取措施">
            <TextArea rows={3} placeholder="请输入已采取的措施" />
          </Form.Item>
          <Form.Item name="evidence_attachments" label="证据附件">
            <Upload multiple beforeUpload={() => false}>
              <Button icon={<UploadOutlined />}>上传证据</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="closing_opinion" label="结案意见">
            <TextArea rows={3} placeholder="请输入结案意见" />
          </Form.Item>
          <Form.Item name="is_returned" valuePropName="checked">
            <Checkbox>退回补充（需填写退回原因）</Checkbox>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.is_returned !== curr.is_returned}>
            {({ getFieldValue }) =>
              getFieldValue('is_returned') ? (
                <Form.Item
                  name="return_reason"
                  label="退回原因"
                  rules={[{ required: true, message: '请填写退回原因' }]}
                >
                  <TextArea rows={2} placeholder="请填写退回原因" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <div className="form-actions">
            <Space>
              <Button onClick={() => setFeedbackModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>提交反馈</Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ClueDetail;
