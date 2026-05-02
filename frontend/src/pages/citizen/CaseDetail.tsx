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
  Timeline,
  List,
  Upload,
  Modal,
  Form,
  Input,
  DatePicker,
  TimePicker,
  Select,
} from 'antd';
import {
  ArrowLeftOutlined,
  UploadOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { caseApi, reservationApi, auditApi } from '../../api';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

export const CaseDetailPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [caseDetail, setCaseDetail] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [reserveModalVisible, setReserveModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const statusMap: Record<string, { color: string; text: string }> = {
    DRAFT: { color: 'default', text: '草稿' },
    MATERIAL_SUBMITTED: { color: 'blue', text: '材料已提交' },
    OCR_PROCESSING: { color: 'processing', text: 'OCR处理中' },
    MATERIAL_PRE_REVIEW: { color: 'orange', text: '审核中' },
    MATERIAL_REJECTED: { color: 'red', text: '需补正' },
    MATERIAL_APPROVED: { color: 'green', text: '审核通过' },
    RESERVATION_AVAILABLE: { color: 'blue', text: '可预约' },
    RESERVED: { color: 'cyan', text: '已预约' },
    CHECKED_IN: { color: 'purple', text: '已取号' },
    PROCESSING: { color: 'processing', text: '办理中' },
    COMPLETED: { color: 'success', text: '已办结' },
    EVALUATED: { color: 'green', text: '已评价' },
    CANCELLED: { color: 'default', text: '已取消' },
  };

  useEffect(() => {
    if (caseId) {
      loadCaseDetail();
    }
  }, [caseId]);

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

  const handleSubmitMaterial = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('material_file', file);
      formData.append('material_type', '身份证明');
      formData.append('description', '用户上传的材料');

      await caseApi.submitMaterial(caseId!, formData);
      message.success('材料提交成功，正在进行OCR核验...');
      loadCaseDetail();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '材料提交失败');
    } finally {
      setUploading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!caseDetail?.service_item_id) return;
    setLoadingSlots(true);
    try {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const response = await reservationApi.getAvailableSlots(
        caseDetail.service_item_id,
        today.toISOString().split('T')[0],
        nextWeek.toISOString().split('T')[0]
      );
      setAvailableSlots(response.data || []);
    } catch (error) {
      console.error('加载可用时间槽失败:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleReserve = async (values: any) => {
    try {
      await reservationApi.create({
        case_id: caseId!,
        time_slot_id: values.time_slot_id,
        contact_phone: values.contact_phone,
      });
      message.success('预约成功');
      setReserveModalVisible(false);
      loadCaseDetail();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '预约失败');
    }
  };

  const canSubmitMaterial = ['DRAFT', 'MATERIAL_REJECTED'].includes(
    caseDetail?.status || ''
  );
  const canReserve = caseDetail?.status === 'RESERVATION_AVAILABLE';

  const renderActionButtons = () => {
    const buttons = [];

    if (canSubmitMaterial) {
      buttons.push(
        <Upload
          key="upload"
          customRequest={({ file }) => {
            if (file instanceof File) {
              handleSubmitMaterial(file);
            }
          }}
          showUploadList={false}
          accept=".jpg,.jpeg,.png,.pdf"
        >
          <Button type="primary" icon={<UploadOutlined />} loading={uploading}>
            上传材料
          </Button>
        </Upload>
      );
    }

    if (canReserve) {
      buttons.push(
        <Button
          key="reserve"
          type="primary"
          icon={<CalendarOutlined />}
          onClick={() => {
            setReserveModalVisible(true);
            loadAvailableSlots();
          }}
        >
          预约窗口
        </Button>
      );
    }

    return buttons.length > 0 ? <Space>{buttons}</Space> : null;
  };

  return (
    <Spin spinning={loading}>
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/citizen/cases')}
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
              <Descriptions.Item label="创建时间">
                {new Date(caseDetail.created_at).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {new Date(caseDetail.updated_at).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Divider />

          <Card title="可用操作" extra={renderActionButtons()}>
            {!canSubmitMaterial && !canReserve ? (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                当前状态下无可执行操作
              </div>
            ) : (
              <div style={{ color: '#666' }}>
                {canSubmitMaterial && (
                  <p>
                    请上传所需材料（支持 jpg、jpeg、png、pdf 格式），系统将自动进行 OCR
                    核验。
                  </p>
                )}
                {canReserve && (
                  <p>材料审核已通过，点击"预约窗口"选择合适的时间进行预约。</p>
                )}
              </div>
            )}
          </Card>

          <Divider />

          {caseDetail.materials && caseDetail.materials.length > 0 && (
            <Card title="材料列表">
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
                              OCR结果: {JSON.stringify(item.ocr_result)}
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

          {caseDetail.reservation && (
            <Card title="预约信息">
              <Descriptions bordered column={2}>
                <Descriptions.Item label="预约日期">
                  {caseDetail.reservation.reservation_date}
                </Descriptions.Item>
                <Descriptions.Item label="预约时间">
                  {caseDetail.reservation.time_slot?.start_time} -{' '}
                  {caseDetail.reservation.time_slot?.end_time}
                </Descriptions.Item>
                <Descriptions.Item label="窗口">
                  {caseDetail.reservation.time_slot?.window_number}号窗口
                </Descriptions.Item>
                <Descriptions.Item label="预约状态">
                  <Tag color="blue">{caseDetail.reservation.status}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          <Divider />

          {caseDetail.status_history && caseDetail.status_history.length > 0 && (
            <Card title="状态变更历史">
              <Timeline
                items={caseDetail.status_history
                  .slice()
                  .reverse()
                  .map((item: any) => ({
                    color:
                      item.new_status === 'COMPLETED' ||
                      item.new_status === 'MATERIAL_APPROVED'
                        ? 'green'
                        : item.new_status === 'MATERIAL_REJECTED'
                        ? 'red'
                        : 'blue',
                    children: (
                      <div>
                        <p>
                          状态变更:{' '}
                          {statusMap[item.new_status]?.text || item.new_status}
                        </p>
                        <p style={{ fontSize: 12, color: '#999' }}>
                          操作人: {item.operator_name || '系统'} | 时间:{' '}
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>
                    ),
                  }))}
              />
            </Card>
          )}

          <Divider />

          {caseDetail.action_logs && caseDetail.action_logs.length > 0 && (
            <Card title="操作日志">
              <List
                dataSource={caseDetail.action_logs}
                renderItem={(item: any) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.description}
                      description={
                        <div>
                          操作人: {item.operator_name || '系统'} | 操作时间:{' '}
                          {new Date(item.created_at).toLocaleString()} | IP: {item.ip_address}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}
        </div>
      )}

      <Modal
        title="预约窗口"
        open={reserveModalVisible}
        onCancel={() => setReserveModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleReserve} layout="vertical">
          <Form.Item
            name="time_slot_id"
            label="选择时间槽"
            rules={[{ required: true, message: '请选择预约时间' }]}
          >
            <Select
              placeholder="选择可用的预约时间"
              loading={loadingSlots}
              style={{ width: '100%' }}
            >
              {availableSlots.map((slot: any) => (
                <Select.Option key={slot.id} value={slot.id}>
                  <div>
                    <span style={{ fontWeight: 'bold' }}>
                      {slot.date} {slot.start_time} - {slot.end_time}
                    </span>
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      {slot.window_number}号窗口
                    </Tag>
                    <Tag color="green" style={{ marginLeft: 8 }}>
                      剩余 {slot.remaining_capacity} 个名额
                    </Tag>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="contact_phone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setReserveModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                确认预约
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  );
};
