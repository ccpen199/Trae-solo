import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Spin, message, Tag, Form, Modal, Input, Select, Typography, Alert, Descriptions, Divider, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined, DeleteOutlined, EyeOutlined, SafetyOutlined, CopyOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { api } from '../../api';
import type { ColumnsType } from 'antd/es/table';

interface BiometricLog {
  id: number;
  workerId: number;
  deletionReason: string;
  dataTypes: string;
  operatorId: number;
  auditTrail: string;
  deletionTime: string;
  deletionCertificateNo?: string;
  deletionMethod?: string;
  deletionResult?: string;
  reviewOpinion?: string;
  executionTime?: string;
  destructionHash?: string;
  workerName?: string;
  workerUsername?: string;
  operatorName?: string;
  operatorUsername?: string;
}

interface WorkerOption {
  id: number;
  realName?: string;
  username: string;
  hasBiometricData: number;
  biometricDeleted: number;
}

const { Option } = Select;
const { TextArea } = Input;
const { Text, Title } = Typography;

const dataTypeMap: Record<string, string> = {
  face_recognition: '人脸识别数据',
  face: '人脸识别数据',
  fingerprint: '指纹数据',
  voice_recognition: '声纹数据',
  voice: '声纹数据',
  iris: '虹膜数据',
  face_template_backup: '人脸模板备份'
};

const deletionMethodMap: Record<string, { text: string; color: string }> = {
  physical: { text: '物理删除', color: 'red' },
  logical: { text: '逻辑删除', color: 'orange' },
  crypto_destroy: { text: '加密销毁', color: 'purple' }
};

const deletionResultMap: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
  success: { text: '成功', color: 'green', icon: <CheckCircleOutlined /> },
  failed: { text: '失败', color: 'red', icon: <CloseCircleOutlined /> }
};

const getDataTypeText = (type: string) => dataTypeMap[type] || type;

const getDeletionMethodText = (method: string) => deletionMethodMap[method]?.text || method;
const getDeletionMethodColor = (method: string) => deletionMethodMap[method]?.color || 'default';

const getDeletionResultText = (result: string) => deletionResultMap[result]?.text || result;
const getDeletionResultColor = (result: string) => deletionResultMap[result]?.color || 'default';
const getDeletionResultIcon = (result: string) => deletionResultMap[result]?.icon;

const complianceArticles = {
  article11: `《建筑业用工实名制管理办法》第十一条：用工企业应当依法与招用的建筑工人签订劳动合同，对进场施工的建筑工人实行实名制管理，建立建筑工人用工档案。用工企业应当对建筑工人的身份信息、文化程度、技能等级、从业经历、培训情况、安全生产记录等进行如实记录。`,
  article28: `《建筑业用工实名制管理办法》第二十八条：县级以上地方人民政府住房和城乡建设主管部门、人力资源社会保障行政部门应当按照各自职责，加强对建筑工人实名制管理工作的监督检查，对用工企业未按照本办法规定实行建筑工人实名制管理的，依法依规予以处理。建筑工人的个人信息受法律保护，任何单位和个人不得泄露、篡改、毁损或者非法向他人提供。`
};

const handleCopy = async (text: string, successMsg: string = '已复制') => {
  try {
    await navigator.clipboard.writeText(text);
    message.success(successMsg);
  } catch {
    message.error('复制失败');
  }
};

const BiometricLogs: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<BiometricLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<BiometricLog | null>(null);
  const [deleteForm] = Form.useForm();
  const [workers, setWorkers] = useState<WorkerOption[]>([]);
  const [workerLoading, setWorkerLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getBiometricLogs({
        page,
        pageSize
      });
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取删除日志失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    setWorkerLoading(true);
    try {
      const res = await api.admin.getUsers({
        role: 'worker',
        pageSize: 1000
      });
      const workerList = (res.data.users || []).filter(
        (u: any) => u.hasBiometricData === 1 && u.biometricDeleted !== 1
      );
      setWorkers(workerList);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取工人列表失败');
    } finally {
      setWorkerLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, pageSize]);

  const handleDelete = () => {
    fetchWorkers();
    deleteForm.resetFields();
    setDeleteModalVisible(true);
  };

  const handleDeleteSubmit = async (values: any) => {
    try {
      await api.admin.deleteBiometric({
        workerId: values.workerId,
        deletionReason: values.deletionReason,
        dataTypes: values.dataTypes,
        deletionMethod: values.deletionMethod || 'physical'
      });
      message.success('生物特征数据已成功删除');
      setDeleteModalVisible(false);
      fetchLogs();
    } catch (error: any) {
      message.error(error.response?.data?.error || '删除失败');
    }
  };

  const handleViewDetail = (record: BiometricLog) => {
    setSelectedLog(record);
    setDetailModalVisible(true);
  };

  const handleRefresh = () => {
    setPage(1);
    fetchLogs();
  };

  const renderDataTypes = (dataTypes: string) => {
    try {
      const types = JSON.parse(dataTypes);
      return types.map((t: string, i: number) => (
        <Tag key={i} color="blue" style={{ marginBottom: '4px', marginRight: '4px' }}>
          {getDataTypeText(t)}
        </Tag>
      ));
    } catch {
      return <Tag color="blue">{dataTypes}</Tag>;
    }
  };

  const columns: ColumnsType<BiometricLog> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      fixed: 'left'
    },
    {
      title: '删除凭证编号',
      dataIndex: 'deletionCertificateNo',
      key: 'deletionCertificateNo',
      width: 160,
      render: (text) => text || '-'
    },
    {
      title: '工人姓名',
      dataIndex: 'workerName',
      key: 'workerName',
      width: 100,
      render: (text, record) => text || record.workerUsername || '-'
    },
    {
      title: '工人用户名',
      dataIndex: 'workerUsername',
      key: 'workerUsername',
      width: 120
    },
    {
      title: '删除原因',
      dataIndex: 'deletionReason',
      key: 'deletionReason',
      width: 200,
      ellipsis: true
    },
    {
      title: '删除数据类型',
      dataIndex: 'dataTypes',
      key: 'dataTypes',
      width: 200,
      render: (text) => renderDataTypes(text)
    },
    {
      title: '删除方式',
      dataIndex: 'deletionMethod',
      key: 'deletionMethod',
      width: 100,
      render: (method) => (
        <Tag color={getDeletionMethodColor(method || 'physical')}>
          {getDeletionMethodText(method || 'physical')}
        </Tag>
      )
    },
    {
      title: '删除结果',
      dataIndex: 'deletionResult',
      key: 'deletionResult',
      width: 100,
      render: (result) => (
        <Tag color={getDeletionResultColor(result || 'success')} icon={getDeletionResultIcon(result || 'success')}>
          {getDeletionResultText(result || 'success')}
        </Tag>
      )
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 100,
      render: (text, record) => text || record.operatorUsername || '-'
    },
    {
      title: '操作人用户名',
      dataIndex: 'operatorUsername',
      key: 'operatorUsername',
      width: 120
    },
    {
      title: '删除时间',
      dataIndex: 'deletionTime',
      key: 'deletionTime',
      width: 180,
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
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
    <Card
      title="生物特征管理"
      extra={
        <Space>
          <Button onClick={handleRefresh} icon={<ReloadOutlined />}>
            刷新
          </Button>
          <Button type="primary" danger icon={<DeleteOutlined />} onClick={handleDelete}>
            删除生物特征
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          scroll={{ x: 1600 }}
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
        title="删除生物特征数据"
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        footer={null}
        width={550}
        maskClosable={false}
      >
        <Alert
          message="注意"
          description="此操作将永久删除该工人的生物特征数据，删除后不可恢复。"
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        <Form
          form={deleteForm}
          layout="vertical"
          onFinish={handleDeleteSubmit}
        >
          <Form.Item
            name="workerId"
            label="选择工人"
            rules={[{ required: true, message: '请选择工人' }]}
          >
            <Select
              placeholder="请选择要删除生物特征的工人"
              loading={workerLoading}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {workers.map((worker) => (
                <Option
                  key={worker.id}
                  value={worker.id}
                  label={`${worker.realName || worker.username} (${worker.username})`}
                >
                  <Space>
                    <SafetyOutlined style={{ color: '#52c41a' }} />
                    {worker.realName || worker.username}
                    <Text type="secondary">({worker.username})</Text>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="dataTypes"
            label="删除数据类型"
            rules={[{ required: true, message: '请选择数据类型' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择要删除的数据类型"
            >
              <Option value="face">人脸识别数据</Option>
              <Option value="fingerprint">指纹数据</Option>
              <Option value="voice">声纹数据</Option>
              <Option value="iris">虹膜数据</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="deletionMethod"
            label="删除方式"
            rules={[{ required: true, message: '请选择删除方式' }]}
          >
            <Select placeholder="请选择删除方式">
              <Option value="physical">物理删除</Option>
              <Option value="logical">逻辑删除</Option>
              <Option value="crypto_destroy">加密销毁</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="deletionReason"
            label="删除原因"
            rules={[{ required: true, message: '请填写删除原因' }]}
          >
            <TextArea
              rows={4}
              placeholder="请详细说明删除生物特征数据的原因"
              maxLength={500}
              showCount
            />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setDeleteModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" danger htmlType="submit">
                确认删除
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="删除日志详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={850}
      >
        {selectedLog && (
          <div>
            <Divider orientation="left" style={{ marginTop: 0 }}>
              <Space>
                <SafetyOutlined style={{ color: '#52c41a' }} />
                基本信息
              </Space>
            </Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="删除凭证编号">
                    <Space>
                      <Text code>{selectedLog.deletionCertificateNo || '-'}</Text>
                      {selectedLog.deletionCertificateNo && (
                        <Button
                          type="text"
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={() => handleCopy(selectedLog.deletionCertificateNo!, '已复制')}
                        />
                      )}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="工人姓名">
                    {selectedLog.workerName || selectedLog.workerUsername || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="工人用户名">
                    {selectedLog.workerUsername || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="删除原因">
                    {selectedLog.deletionReason || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={12}>
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="删除方式">
                    <Tag color={getDeletionMethodColor(selectedLog.deletionMethod || 'physical')}>
                      {getDeletionMethodText(selectedLog.deletionMethod || 'physical')}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="删除结果">
                    <Tag 
                      color={getDeletionResultColor(selectedLog.deletionResult || 'success')} 
                      icon={getDeletionResultIcon(selectedLog.deletionResult || 'success')}
                    >
                      {getDeletionResultText(selectedLog.deletionResult || 'success')}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="执行时间">
                    {selectedLog.executionTime 
                      ? new Date(selectedLog.executionTime).toLocaleString('zh-CN')
                      : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="删除时间">
                    {new Date(selectedLog.deletionTime).toLocaleString('zh-CN')}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>

            <Divider orientation="left">
              <Space>
                <SafetyOutlined style={{ color: '#1890ff' }} />
                删除数据类型
              </Space>
            </Divider>
            <Card size="small" style={{ marginBottom: '16px' }}>
              <Space wrap>
                {(() => {
                  try {
                    const types = JSON.parse(selectedLog.dataTypes);
                    return types.map((t: string, i: number) => (
                      <Tag key={i} color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
                        {getDataTypeText(t)}
                      </Tag>
                    ));
                  } catch {
                    return <Tag color="blue">{selectedLog.dataTypes}</Tag>;
                  }
                })()}
              </Space>
            </Card>

            <Divider orientation="left">
              <Space>
                <SafetyOutlined style={{ color: '#722ed1' }} />
                审计追踪
              </Space>
            </Divider>
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={12}>
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="操作人ID">
                    {selectedLog.operatorId || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="操作人姓名">
                    {selectedLog.operatorName || selectedLog.operatorUsername || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="操作人用户名">
                    {selectedLog.operatorUsername || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="复核意见">
                    {selectedLog.reviewOpinion || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={12}>
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="数据销毁哈希值" span={1}>
                    <div style={{ wordBreak: 'break-all' }}>
                      <Text code style={{ fontSize: '11px' }}>
                        {selectedLog.destructionHash || '-'}
                      </Text>
                      {selectedLog.destructionHash && (
                        <div style={{ marginTop: '4px' }}>
                          <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => handleCopy(selectedLog.destructionHash!, '已复制哈希值')}
                          >
                            复制哈希值
                          </Button>
                        </div>
                      )}
                    </div>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>

            {selectedLog.auditTrail && (
              <Card size="small" title="详细审计信息" style={{ marginBottom: '16px' }}>
                <pre style={{
                  background: '#f5f5f5',
                  padding: '12px',
                  borderRadius: '4px',
                  margin: 0,
                  maxHeight: '150px',
                  overflow: 'auto',
                  fontSize: '12px'
                }}>
                  {JSON.stringify(JSON.parse(selectedLog.auditTrail), null, 2)}
                </pre>
              </Card>
            )}

            <Divider orientation="left">
              <Space>
                <SafetyOutlined style={{ color: '#52c41a' }} />
                合规说明
              </Space>
            </Divider>
            <Alert
              message="操作合规性说明"
              description={
                <div>
                  <div style={{ marginBottom: '12px' }}>
                    <Title level={5} style={{ marginBottom: '8px' }}>
                      引用法规条款
                    </Title>
                    <Alert
                      message="第十一条"
                      description={complianceArticles.article11}
                      type="info"
                      showIcon
                      style={{ marginBottom: '8px' }}
                    />
                    <Alert
                      message="第二十八条"
                      description={complianceArticles.article28}
                      type="info"
                      showIcon
                    />
                  </div>
                  <Divider style={{ margin: '12px 0' }} />
                  <div style={{ lineHeight: '1.8' }}>
                    <p style={{ margin: '4px 0' }}>
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '4px' }} />
                      <strong>数据不可恢复：</strong>本次删除操作采用{getDeletionMethodText(selectedLog.deletionMethod || 'physical')}方式，数据已彻底销毁，无法恢复。
                    </p>
                    <p style={{ margin: '4px 0' }}>
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '4px' }} />
                      <strong>告知义务履行：</strong>已按照《个人信息保护法》规定履行告知义务，工人已知晓并同意删除其生物特征数据。
                    </p>
                    <p style={{ margin: '4px 0' }}>
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '4px' }} />
                      <strong>数据最小化原则：</strong>删除操作符合数据最小化原则，仅删除必要的生物特征数据，不影响其他用工记录的完整性。
                    </p>
                    <p style={{ margin: '4px 0' }}>
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '4px' }} />
                      <strong>审计可追溯：</strong>本次操作已全程留痕，生成唯一删除凭证编号和数据销毁哈希值，审计日志完整可追溯。
                    </p>
                  </div>
                </div>
              }
              type="success"
              showIcon
              icon={<SafetyOutlined />}
            />
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default BiometricLogs;
