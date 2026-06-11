import React, { useState } from 'react';
import { Card, Tag, Button, Avatar, List, Upload, Input, Rate, Modal, message, Form } from 'antd';
import {
  FileOutlined,
  DownloadOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  EditOutlined,
  CloseCircleOutlined,
  SendOutlined,
  PaperClipOutlined
} from '@ant-design/icons';
import { Submission, SubmissionStatus, ReviewComment } from '@/types';
import dayjs from 'dayjs';
import { submissionApi, reviewApi } from '@/api';
import { useUserStore } from '@/store/userStore';

const { TextArea } = Input;

interface SubmissionCardProps {
  submission: Submission;
  onStatusChange?: () => void;
  showReview?: boolean;
}

const statusColors: Record<SubmissionStatus, string> = {
  draft: 'default',
  submitted: 'blue',
  under_review: 'gold',
  reviewing: 'geekblue',
  approved: 'success',
  revision_requested: 'orange',
  rejected: 'red'
};

const statusNames: Record<SubmissionStatus, string> = {
  draft: '草稿',
  submitted: '已提交',
  under_review: '待审核',
  reviewing: '审核中',
  approved: '已通过',
  revision_requested: '需修改',
  rejected: '已退回'
};

const SubmissionCard: React.FC<SubmissionCardProps> = ({ submission, onStatusChange, showReview = true }) => {
  const { userInfo } = useUserStore();
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [reviewForm] = Form.useForm();
  const [commentForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleReview = async (values: { status: string; content: string; rating: number }) => {
    try {
      setSubmitting(true);
      await submissionApi.review(submission.id, values);
      message.success('审核提交成功');
      setReviewModalVisible(false);
      reviewForm.resetFields();
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Review error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (values: { content: string }) => {
    try {
      setSubmitting(true);
      await reviewApi.addComment(submission.id, values);
      message.success('评论发表成功');
      setCommentModalVisible(false);
      commentForm.resetFields();
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Add comment error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const canReview = showReview && 
    userInfo?.role === 'platform' &&
    ['submitted', 'under_review', 'revising'].includes(submission.status);

  return (
    <Card className="mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar size={40} src={undefined} icon={<UserOutlined />}>
            {submission.providerName?.charAt(0)}
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800">{submission.providerName}</span>
              <Tag color={statusColors[submission.status]}>
                {statusNames[submission.status]}
              </Tag>
              <Tag color="purple">
                版本 v{submission.version}
              </Tag>
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <ClockCircleOutlined />
              {dayjs(submission.submittedAt).format('YYYY-MM-DD HH:mm:ss')}
            </div>
          </div>
        </div>
        {canReview && (
          <div className="flex gap-2">
            <Button 
              type="primary" 
              icon={<CheckCircleOutlined />}
              onClick={() => {
                reviewForm.setFieldsValue({ status: 'approved' });
                setReviewModalVisible(true);
              }}
            >
              通过
            </Button>
            <Button 
              icon={<EditOutlined />}
              onClick={() => {
                reviewForm.setFieldsValue({ status: 'revision_requested' });
                setReviewModalVisible(true);
              }}
            >
              要求修改
            </Button>
            <Button 
              danger 
              icon={<CloseCircleOutlined />}
              onClick={() => {
                reviewForm.setFieldsValue({ status: 'rejected' });
                setReviewModalVisible(true);
              }}
            >
              拒绝
            </Button>
          </div>
        )}
      </div>

      <h4 className="font-medium text-gray-800 mb-2">{submission.title}</h4>
      <p className="text-gray-600 mb-4 whitespace-pre-wrap">{submission.description}</p>

      {submission.attachments && submission.attachments.length > 0 && (
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <PaperClipOutlined />
            附件文件 ({submission.attachments.length})
          </h5>
          <div className="space-y-2">
            {submission.attachments.map((file, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <FileOutlined className="text-primary-600" />
                  <span className="text-sm text-gray-700">{file.fileName}</span>
                  <span className="text-xs text-gray-400">
                    ({(file.fileSize / 1024).toFixed(2)} KB)
                  </span>
                </div>
                <Button 
                  type="text" 
                  icon={<DownloadOutlined />}
                 
                  onClick={() => window.open(file.fileUrl, '_blank')}
                >
                  下载
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {submission.reviewComments && submission.reviewComments.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium text-gray-700">
              审核记录 ({submission.reviewComments.length})
            </h5>
            <Button 
              type="link" 
             
              icon={<SendOutlined />}
              onClick={() => setCommentModalVisible(true)}
            >
              添加评论
            </Button>
          </div>
          <List
            dataSource={submission.reviewComments}
            renderItem={(comment: ReviewComment) => (
              <List.Item className="flex-col items-start p-3 bg-gray-50 rounded-lg mb-2">
                <div className="flex items-center gap-2 mb-2 w-full">
                  <Avatar size={28} icon={<UserOutlined />}>
                    {comment.reviewerName?.charAt(0)}
                  </Avatar>
                  <span className="font-medium text-gray-800">{comment.reviewerName}</span>
                  <Tag color="blue">{comment.reviewerRole === 'employer' ? '申请人' : '承办方'}</Tag>
                  {comment.rating && (
                    <Rate disabled defaultValue={comment.rating} allowHalf style={{ fontSize: 12 }} />
                  )}
                  <span className="text-xs text-gray-400 ml-auto">
                    {dayjs(comment.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 ml-10 whitespace-pre-wrap">{comment.content}</p>
                {comment.attachments && comment.attachments.length > 0 && (
                  <div className="ml-10 mt-2 flex flex-wrap gap-2">
                    {comment.attachments.map((file, idx) => (
                      <a 
                        key={idx}
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                      >
                        <FileOutlined />
                        {file.fileName}
                      </a>
                    ))}
                  </div>
                )}
              </List.Item>
            )}
          />
        </div>
      )}

      <Modal
        title="提交审核"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
      >
        <Form
          form={reviewForm}
          layout="vertical"
          onFinish={handleReview}
        >
          <Form.Item
            name="rating"
            label="评分"
          >
            <Rate allowHalf />
          </Form.Item>
          <Form.Item
            name="content"
            label="审核意见"
            rules={[{ required: true, message: '请输入审核意见' }]}
          >
            <TextArea rows={4} placeholder="请输入详细的审核意见..." />
          </Form.Item>
          <Form.Item
            name="attachments"
            label="附件"
          >
            <Upload multiple beforeUpload={() => false}>
              <Button icon={<PaperClipOutlined />}>上传附件</Button>
            </Upload>
          </Form.Item>
          <Form.Item className="mb-0 flex justify-end gap-2">
            <Button onClick={() => setReviewModalVisible(false)}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              提交评审
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加评论"
        open={commentModalVisible}
        onCancel={() => setCommentModalVisible(false)}
        footer={null}
      >
        <Form
          form={commentForm}
          layout="vertical"
          onFinish={handleAddComment}
        >
          <Form.Item
            name="content"
            label="评论内容"
            rules={[{ required: true, message: '请输入评论内容' }]}
          >
            <TextArea rows={4} placeholder="请输入评论内容..." />
          </Form.Item>
          <Form.Item
            name="attachments"
            label="附件"
          >
            <Upload multiple beforeUpload={() => false}>
              <Button icon={<PaperClipOutlined />}>上传附件</Button>
            </Upload>
          </Form.Item>
          <Form.Item className="mb-0 flex justify-end gap-2">
            <Button onClick={() => setCommentModalVisible(false)}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              发表评论
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default SubmissionCard;
