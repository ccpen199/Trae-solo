import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Spin, message, Tag, Select, Form, Modal, Input, DatePicker, Descriptions, Divider, Alert, Timeline, Row, Col, Empty } from 'antd';
import { SearchOutlined, ReloadOutlined, WarningOutlined, EditOutlined, EyeOutlined, ExclamationCircleOutlined, SafetyOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { api } from '../../api';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

interface SocialSecurityWarning {
  id: number;
  workerId: number;
  enterpriseId: number;
  projectId?: number;
  insuranceType?: string;
  insuranceMonth: string;
  baseAmount: number;
  personalAmount: number;
  enterpriseAmount: number;
  paymentAmount: number;
  paymentStatus: string;
  paymentDueDate?: string;
  paidAt?: string;
  disposalStatus?: string;
  disposalAction?: string;
  remedialDeadline?: string;
  isReported?: number;
  reportedAt?: string;
  reviewedBy?: number;
  reviewedByName?: string;
  disposalResult?: string;
  disposalNote?: string;
  warningSent?: number;
  workerName?: string;
  phone?: string;
  companyName?: string;
  projectName?: string;
  createdAt: string;
  overdueDays?: number;
  isOverdue90?: boolean;
}

interface DisposalFormData {
  disposalAction: string;
  remedialDeadline: dayjs.Dayjs;
  disposalNote: string;
}

const { Option } = Select;
const { TextArea } = Input;

const disposalActionMap: Record<string, { text: string; status: string }> = {
  notify_enterprise: { text: '通知企业', status: 'notified' },
  set_deadline: { text: '限期补缴', status: 'deadline_set' },
  report_regulator: { text: '上报监管', status: 'reported' },
  completed: { text: '已完成补缴', status: 'completed' }
};

const disposalStatusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '待处置', color: 'orange' },
  notified: { text: '已通知企业', color: 'blue' },
  deadline_set: { text: '已设定期限', color: 'purple' },
  reported: { text: '已上报监管', color: 'red' },
  completed: { text: '已完成', color: 'green' }
};

const getDisposalStatusText = (status: string) => disposalStatusMap[status]?.text || status;
const getDisposalStatusColor = (status: string) => disposalStatusMap[status]?.color || 'default';

const SocialSecurity: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState<SocialSecurityWarning[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [form] = Form.useForm();
  const [disposalModalVisible, setDisposalModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedWarning, setSelectedWarning] = useState<SocialSecurityWarning | null>(null);
  const [disposalForm] = Form.useForm<DisposalFormData>();
  const [disposalLoading, setDisposalLoading] = useState(false);

  const fetchWarnings = async (params?: any) => {
    setLoading(true);
    try {
      const res = await api.admin.getSocialSecurityWarnings({
        page,
        pageSize,
        ...params
      });
      setWarnings(res.data.warnings || []);
      setTotal(res.data.total || 0);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取社保预警失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarnings();
  }, [page, pageSize]);

  const handleSearch = (values: any) => {
    setPage(1);
    fetchWarnings(values);
  };

  const handleReset = () => {
    form.resetFields();
    setPage(1);
    fetchWarnings();
  };

  const handleDisposal = (record: SocialSecurityWarning) => {
    setSelectedWarning(record);
    disposalForm.resetFields();
    setDisposalModalVisible(true);
  };

  const handleDisposalSubmit = async (values: DisposalFormData) => {
    if (!selectedWarning) return;
    setDisposalLoading(true);
    try {
      const actionConfig = disposalActionMap[values.disposalAction];
      const disposalStatus = actionConfig?.status || 'pending';
      
      await api.admin.updateSocialSecurityDisposal(selectedWarning.id, {
        disposalStatus,
        disposalAction: values.disposalAction,
        remedialDeadline: values.remedialDeadline?.format('YYYY-MM-DD'),
        disposalNote: values.disposalNote
      });
      
      message.success('处置信息已更新');
      setDisposalModalVisible(false);
      fetchWarnings(form.getFieldsValue());
    } catch (error: any) {
      message.error(error.response?.data?.error || '处置失败');
    } finally {
      setDisposalLoading(false);
    }
  };

  const handleViewDetail = (record: SocialSecurityWarning) => {
    setSelectedWarning(record);
    setDetailModalVisible(true);
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      unpaid: '未缴纳',
      overdue: '已逾期',
      paid: '已缴纳'
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      unpaid: 'orange',
      overdue: 'red',
      paid: 'green'
    };
    return map[status] || 'default';
  };

  const getReportedTag = (isReported: number) => {
    return isReported === 1 
      ? <Tag color="red" icon={<ExclamationCircleOutlined />}>已上报</Tag>
      : <Tag color="default">未上报</Tag>;
  };

  const renderOverdueDays = (record: SocialSecurityWarning) => {
    if (!record.paymentDueDate || record.paymentStatus === 'paid') return '-';
    
    const overdueDays = record.overdueDays || 0;
    
    if (overdueDays <= 0) {
      return <Tag color="green">即将到期</Tag>;
    }
    
    if (record.isOverdue90) {
      return (
        <Tag color="red" icon={<ExclamationCircleOutlined />}>
          逾期{overdueDays}天（超过3个月，需上报）
        </Tag>
      );
    }
    
    return <Tag color="orange">逾期{overdueDays}天</Tag>;
  };

  const renderResponsibilityChain = (record: SocialSecurityWarning) => {
    return (
      <div style={{ fontSize: '12px', color: '#666' }}>
        <Space direction="vertical" size={2}>
          <div>
            <SafetyOutlined style={{ color: '#1890ff', marginRight: '4px' }} />
            企业：{record.companyName || '-'}
          </div>
          <div style={{ paddingLeft: '20px' }}>
            <SafetyOutlined style={{ color: '#1890ff', marginRight: '4px' }} />
            项目：{record.projectName || '-'}
          </div>
          <div style={{ paddingLeft: '40px' }}>
            <SafetyOutlined style={{ color: '#1890ff', marginRight: '4px' }} />
            工人：{record.workerName || '-'}
          </div>
        </Space>
      </div>
    );
  };

  const columns: ColumnsType<SocialSecurityWarning> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      fixed: 'left'
    },
    {
      title: '工人姓名',
      dataIndex: 'workerName',
      key: 'workerName',
      width: 100,
      render: (text) => text || '-'
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 120
    },
    {
      title: '企业名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 180,
      render: (text) => text || '-'
    },
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 180,
      render: (text) => text || '-'
    },
    {
      title: '社保月份',
      dataIndex: 'insuranceMonth',
      key: 'insuranceMonth',
      width: 100
    },
    {
      title: '缴费基数',
      dataIndex: 'baseAmount',
      key: 'baseAmount',
      width: 100,
      render: (value) => `¥${value?.toLocaleString() || 0}`
    },
    {
      title: '个人缴纳',
      dataIndex: 'personalAmount',
      key: 'personalAmount',
      width: 100,
      render: (value) => `¥${value?.toLocaleString() || 0}`
    },
    {
      title: '企业缴纳',
      dataIndex: 'enterpriseAmount',
      key: 'enterpriseAmount',
      width: 100,
      render: (value) => `¥${value?.toLocaleString() || 0}`
    },
    {
      title: '状态',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          <WarningOutlined style={{ marginRight: '4px' }} />
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '缴费截止日期',
      dataIndex: 'paymentDueDate',
      key: 'paymentDueDate',
      width: 120,
      render: (text) => text || '-'
    },
    {
      title: '处置状态',
      dataIndex: 'disposalStatus',
      key: 'disposalStatus',
      width: 120,
      render: (status) => (
        <Tag color={getDisposalStatusColor(status || 'pending')}>
          {getDisposalStatusText(status || 'pending')}
        </Tag>
      )
    },
    {
      title: '补缴期限',
      dataIndex: 'remedialDeadline',
      key: 'remedialDeadline',
      width: 120,
      render: (text) => text || '-'
    },
    {
      title: '逾期天数',
      key: 'overdueDays',
      width: 200,
      render: (_, record) => renderOverdueDays(record)
    },
    {
      title: '是否已上报',
      dataIndex: 'isReported',
      key: 'isReported',
      width: 100,
      render: (value) => getReportedTag(value || 0)
    },
    {
      title: '复核人',
      dataIndex: 'reviewedByName',
      key: 'reviewedByName',
      width: 100,
      render: (text) => text || '-'
    },
    {
      title: '责任链',
      key: 'responsibilityChain',
      width: 200,
      render: (_, record) => renderResponsibilityChain(record)
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleDisposal(record)}
          >
            处置
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Card title="社保预警">
      <Form
        form={form}
        layout="inline"
        onFinish={handleSearch}
        style={{ marginBottom: '16px' }}
      >
        <Form.Item name="status" label="状态">
          <Select placeholder="全部" allowClear style={{ width: 120 }}>
            <Option value="unpaid">未缴纳</Option>
            <Option value="overdue">已逾期</Option>
          </Select>
        </Form.Item>
        <Form.Item name="disposalStatus" label="处置状态">
          <Select placeholder="全部" allowClear style={{ width: 140 }}>
            <Option value="pending">待处置</Option>
            <Option value="notified">已通知企业</Option>
            <Option value="deadline_set">已设定期限</Option>
            <Option value="reported">已上报监管</Option>
            <Option value="completed">已完成</Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              搜索
            </Button>
            <Button onClick={handleReset} icon={<ReloadOutlined />}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={warnings}
          rowKey="id"
          scroll={{ x: 2400 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            }
          }}
        />
      </Spin>

      <Modal
        title="社保预警处置"
        open={disposalModalVisible}
        onCancel={() => setDisposalModalVisible(false)}
        footer={null}
        width={550}
        maskClosable={false}
      >
        <Spin spinning={disposalLoading}>
          {selectedWarning && (
            <div>
              <Alert
                message="处置信息"
                description={
                  <div>
                    <p style={{ margin: '4px 0' }}><strong>工人：</strong>{selectedWarning.workerName} ({selectedWarning.phone})</p>
                    <p style={{ margin: '4px 0' }}><strong>企业：</strong>{selectedWarning.companyName}</p>
                    <p style={{ margin: '4px 0' }}><strong>社保月份：</strong>{selectedWarning.insuranceMonth}</p>
                    <p style={{ margin: '4px 0' }}><strong>应缴金额：</strong>¥{selectedWarning.paymentAmount?.toLocaleString() || 0}</p>
                    {selectedWarning.paymentDueDate && (
                      <p style={{ margin: '4px 0' }}>
                        <strong>逾期天数：</strong>
                        {renderOverdueDays(selectedWarning)}
                      </p>
                    )}
                  </div>
                }
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                style={{ marginBottom: '16px' }}
              />

              <Form
                form={disposalForm}
                layout="vertical"
                onFinish={handleDisposalSubmit}
              >
                <Form.Item
                  name="disposalAction"
                  label="处置动作"
                  rules={[{ required: true, message: '请选择处置动作' }]}
                >
                  <Select placeholder="请选择处置动作">
                    <Option value="notify_enterprise">通知企业</Option>
                    <Option value="set_deadline">限期补缴</Option>
                    <Option value="report_regulator">上报监管</Option>
                    <Option value="completed">已完成补缴</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="remedialDeadline"
                  label="补缴期限"
                  rules={[{ required: true, message: '请选择补缴期限' }]}
                >
                  <DatePicker 
                    style={{ width: '100%' }} 
                    placeholder="请选择补缴期限"
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                  />
                </Form.Item>

                <Form.Item
                  name="disposalNote"
                  label="处置备注"
                  rules={[{ required: true, message: '请填写处置备注' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder="请详细说明处置情况"
                    maxLength={500}
                    showCount
                  />
                </Form.Item>

                <Form.Item>
                  <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Button onClick={() => setDisposalModalVisible(false)}>
                      取消
                    </Button>
                    <Button type="primary" htmlType="submit">
                      确认处置
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </div>
          )}
        </Spin>
      </Modal>

      <Modal
        title="社保预警详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={900}
      >
        {selectedWarning && (
          <div>
            {selectedWarning.isOverdue90 && (
              <Alert
                message="红色预警"
                description="逾期超过3个月，需立即上报监管部门！"
                type="error"
                showIcon
                icon={<ExclamationCircleOutlined />}
                style={{ marginBottom: '16px' }}
              />
            )}

            <Divider orientation="left">基本信息</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="工人姓名">
                    {selectedWarning.workerName || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="手机号">
                    {selectedWarning.phone || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="社保类型">
                    {selectedWarning.insuranceType || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="社保月份">
                    {selectedWarning.insuranceMonth}
                  </Descriptions.Item>
                  <Descriptions.Item label="缴费基数">
                    ¥{selectedWarning.baseAmount?.toLocaleString() || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="个人缴纳">
                    ¥{selectedWarning.personalAmount?.toLocaleString() || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="企业缴纳">
                    ¥{selectedWarning.enterpriseAmount?.toLocaleString() || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="总金额">
                    ¥{selectedWarning.paymentAmount?.toLocaleString() || 0}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={12}>
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="缴费状态">
                    <Tag color={getStatusColor(selectedWarning.paymentStatus)}>
                      {getStatusText(selectedWarning.paymentStatus)}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="缴费截止日期">
                    {selectedWarning.paymentDueDate || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="逾期天数">
                    {renderOverdueDays(selectedWarning)}
                  </Descriptions.Item>
                  <Descriptions.Item label="是否超过3个月">
                    {selectedWarning.isOverdue90 ? (
                      <Tag color="red">是（需上报）</Tag>
                    ) : (
                      <Tag color="green">否</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="处置状态">
                    <Tag color={getDisposalStatusColor(selectedWarning.disposalStatus || 'pending')}>
                      {getDisposalStatusText(selectedWarning.disposalStatus || 'pending')}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="补缴期限">
                    {selectedWarning.remedialDeadline || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="是否已上报">
                    {getReportedTag(selectedWarning.isReported || 0)}
                  </Descriptions.Item>
                  <Descriptions.Item label="上报时间">
                    {selectedWarning.reportedAt 
                      ? new Date(selectedWarning.reportedAt).toLocaleString('zh-CN')
                      : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="复核人">
                    {selectedWarning.reviewedByName || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>

            <Divider orientation="left">责任链</Divider>
            <Card size="small" style={{ marginBottom: '16px' }}>
              <Timeline>
                <Timeline.Item color="blue">
                  <p style={{ margin: 0 }}><strong>企业：</strong>{selectedWarning.companyName || '-'}</p>
                </Timeline.Item>
                <Timeline.Item color="blue">
                  <p style={{ margin: 0 }}><strong>项目：</strong>{selectedWarning.projectName || '-'}</p>
                </Timeline.Item>
                <Timeline.Item color="blue">
                  <p style={{ margin: 0 }}><strong>工人：</strong>{selectedWarning.workerName || '-'} ({selectedWarning.phone || '-'})</p>
                </Timeline.Item>
                <Timeline.Item color="red">
                  <p style={{ margin: 0 }}><strong>待处置责任人：</strong>企业社保经办人员</p>
                </Timeline.Item>
              </Timeline>
            </Card>

            <Divider orientation="left">处置历史记录</Divider>
            <Card size="small" style={{ marginBottom: '16px' }}>
              {selectedWarning.disposalAction ? (
                <Timeline>
                  <Timeline.Item color="green">
                    <p style={{ margin: 0 }}>
                      <ClockCircleOutlined style={{ marginRight: '4px' }} />
                      <strong>处置动作：</strong>{disposalActionMap[selectedWarning.disposalAction]?.text || selectedWarning.disposalAction}
                    </p>
                    <p style={{ margin: '4px 0 0 20px', fontSize: '12px', color: '#666' }}>
                      {selectedWarning.disposalNote}
                    </p>
                    {selectedWarning.remedialDeadline && (
                      <p style={{ margin: '4px 0 0 20px', fontSize: '12px', color: '#666' }}>
                        <strong>补缴期限：</strong>{selectedWarning.remedialDeadline}
                      </p>
                    )}
                    {selectedWarning.disposalResult && (
                      <p style={{ margin: '4px 0 0 20px', fontSize: '12px', color: '#666' }}>
                        <strong>处置结果：</strong>{selectedWarning.disposalResult}
                      </p>
                    )}
                    {selectedWarning.reviewedByName && (
                      <p style={{ margin: '4px 0 0 20px', fontSize: '12px', color: '#666' }}>
                        <strong>复核人：</strong>{selectedWarning.reviewedByName}
                      </p>
                    )}
                  </Timeline.Item>
                </Timeline>
              ) : (
                <Empty description="暂无处置记录" />
              )}
            </Card>

            {selectedWarning.isReported === 1 && (
              <>
                <Divider orientation="left">上报记录</Divider>
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="上报时间">
                    {selectedWarning.reportedAt 
                      ? new Date(selectedWarning.reportedAt).toLocaleString('zh-CN')
                      : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="上报人">
                    {selectedWarning.reviewedByName || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default SocialSecurity;
