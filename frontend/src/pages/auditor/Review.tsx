import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Spin,
  message,
  Divider,
  List,
  Modal,
  Form,
  Input,
  Table,
  Empty,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { auditApi, caseApi } from '../../api';

export const AuditReviewPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pendingCases, setPendingCases] = useState<any[]>([]);
  const [caseDetail, setCaseDetail] = useState<any>(null);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const statusMap: Record<string, { color: string; text: string }> = {
    MATERIAL_PRE_REVIEW: { color: 'orange', text: '审核中' },
    MATERIAL_REJECTED: { color: 'red', text: '需补正' },
    MATERIAL_APPROVED: { color: 'green', text: '审核通过' },
  };

  useEffect(() => {
    if (caseId) {
      loadCaseDetail();
    } else {
      loadPendingCases();
    }
  }, [caseId]);

  const loadPendingCases = async () => {
    setLoading(true);
    try {
      const response = await auditApi.getPending();
      setPendingCases(response.data || []);
    } catch (error) {
      console.error('加载待审核办件失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCaseDetail = async () => {
    setLoading(true);
    try {
      const response = await caseApi.getById(caseId!);
      setCaseDetail(response.data);
    } catch (error) {
      message.error('加载办件详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await auditApi.approve(caseId!, { comment: '材料审核通过' });
      message.success('审核通过');
      setApproveModalVisible(false);
      navigate('/auditor/review');
    } catch (error: any) {
      message.error(error.response?.data?.detail || '审核失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (values: any) => {
    setSubmitting(true);
    try {
      await auditApi.reject(caseId!, {
        reject_reason: values.reject_reason,
        supplement_suggestion: values.supplement_suggestion,
      });
      message.success('审核结果已提交');
      setRejectModalVisible(false);
      form.resetFields();
      navigate('/auditor/review');
    } catch (error: any) {
      message.error(error.response?.data?.detail || '审核失败');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: '办件编号',
      dataIndex: 'case_number',
      key: 'case_number',
      width: 180,
    },
    {
      title: '服务事项',
      dataIndex: 'service_item_name',
      key: 'service_item_name',
    },
    {
      title: '申请人',
      dataIndex: 'applicant_name',
      key: 'applicant_name',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const cfg = statusMap[status] || { color: 'default', text: status };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/auditor/review/${record.id}`)}
        >
          审核
        </Button>
      ),
    },
  ];

  if (!caseId) {
    return (
      <Spin spinning={loading}>
        <Card title="待审核办件列表">
          {pendingCases.length === 0 && !loading ? (
            <Empty description="暂无待审核办件" />
          ) : (
            <Table
              columns={columns}
              dataSource={pendingCases}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          )}
        </Card>
      </Spin>
    );
  }

  return (
    <Spin spinning={loading}>
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/auditor/review')}
        >
          返回列表
        </Button>
      </div>

      {caseDetail && (
        <div>
          <Card
            title="办件基本信息"
            extra={
              <Space>
                {(() => {
                  const cfg = statusMap[caseDetail.status] || {
                    color: 'default',
                    text: caseDetail.status,
                  };
                  return <Tag color={cfg.color}>{cfg.text}</Tag>;
                })()}
              </Space>
            }
          >
            <Descriptions bordered column={2}>
              <Descriptions.Item label="办件编号">
                {caseDetail.case_number}
              </Descriptions.Item>
              <Descriptions.Item label="服务事项">
                {caseDetail.service_item_name}
              </Descriptions.Item>
              <Descriptions.Item label="申请人">
                {caseDetail.applicant_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="申请人ID">
                {caseDetail.applicant_id}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(caseDetail.created_at).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {new Date(caseDetail.updated_at).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Divider />

          {caseDetail.materials && caseDetail.materials.length > 0 && (
            <Card title="提交的材料">
              <List
                dataSource={caseDetail.materials}
                renderItem={(item: any) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <span>
                          {item.material_type}
                          <Tag
                            color={
                              item.ocr_confidence >= 0.8
                                ? 'green'
                                : item.ocr_confidence >= 0.5
                                ? 'orange'
                                : 'red'
                            }
                            style={{ marginLeft: 8 }}
                          >
                            OCR置信度: {(item.ocr_confidence * 100).toFixed(0)}%
                          </Tag>
                        </span>
                      }
                      description={
                        <div>
                          <div>
                            文件名: {item.file_name} | 上传时间:{' '}
                            {new Date(item.uploaded_at).toLocaleString()}
                          </div>
                          {item.ocr_result && (
                            <div style={{ marginTop: 4, color: '#666' }}>
                              OCR识别结果: {JSON.stringify(item.ocr_result)}
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}

          <Divider />

          {caseDetail.status === 'MATERIAL_PRE_REVIEW' && (
            <Card title="审核操作">
              <Space>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => setApproveModalVisible(true)}
                >
                  审核通过
                </Button>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => setRejectModalVisible(true)}
                >
                  驳回补正
                </Button>
              </Space>
            </Card>
          )}
        </div>
      )}

      <Modal
        title="确认审核通过"
        open={approveModalVisible}
        onOk={handleApprove}
        onCancel={() => setApproveModalVisible(false)}
        confirmLoading={submitting}
        okText="确认通过"
        cancelText="取消"
      >
        <p>确认该办件材料审核通过吗？通过后将开启预约通道。</p>
      </Modal>

      <Modal
        title="驳回补正"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} onFinish={handleReject} layout="vertical">
          <Form.Item
            name="reject_reason"
            label="驳回原因"
            rules={[{ required: true, message: '请输入驳回原因' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="请详细说明驳回原因"
            />
          </Form.Item>

          <Form.Item
            name="supplement_suggestion"
            label="补正建议"
            rules={[{ required: true, message: '请输入补正建议' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="请给出具体的补正建议"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setRejectModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                提交
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  );
};
