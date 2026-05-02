import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  message,
  Modal,
  Descriptions,
  Timeline,
  Space,
  Alert,
  Statistic,
  Row,
  Col,
  Divider,
  List,
  Tabs,
  Input,
  Select,
  DatePicker
} from 'antd';
import {
  EyeOutlined,
  AuditOutlined,
  DownloadOutlined,
  FileTextOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { legalApi, contractApi } from '../utils/api';
import dayjs from 'dayjs';

const LegalDashboard = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: undefined,
    search: undefined,
    fromDate: undefined,
    toDate: undefined
  });
  const [trajectoryModalVisible, setTrajectoryModalVisible] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [trajectoryData, setTrajectoryData] = useState(null);
  const [evidenceModalVisible, setEvidenceModalVisible] = useState(false);
  const [evidenceData, setEvidenceData] = useState(null);
  const [auditModalVisible, setAuditModalVisible] = useState(false);
  const [auditData, setAuditData] = useState(null);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;

      const [contractsRes, statsRes] = await Promise.all([
        legalApi.listContracts(params),
        legalApi.getStatistics()
      ]);

      if (contractsRes.data.success) {
        setContracts(contractsRes.data.data.contracts || []);
      }
      if (statsRes.data.success) {
        setStatistics(statsRes.data.data);
      }
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'draft': { text: '草稿', color: 'default' },
      'pending_signature': { text: '待签署', color: 'orange' },
      'signing': { text: '签署中', color: 'processing' },
      'completed': { text: '已完成', color: 'success' },
      'rejected': { text: '已拒绝', color: 'error' }
    };

    const info = statusMap[status] || { text: status, color: 'default' };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    {
      title: '合同标题',
      dataIndex: 'title',
      key: 'title',
      render: (text) => (
        <span>
          <FileTextOutlined style={{ marginRight: 8 }} />
          {text}
        </span>
      )
    },
    {
      title: '发起人',
      dataIndex: 'initiatorName',
      key: 'initiatorName',
      render: (name) => (
        <span>
          <UserOutlined style={{ marginRight: 8 }} />
          {name || '-'}
        </span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: '签署进度',
      key: 'progress',
      render: (_, record) => (
        <span>
          {record.signedCount}/{record.totalSigners} 人
        </span>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => viewTrajectory(record)}
          >
            轨迹
          </Button>
          <Button
            type="link"
            size="small"
            icon={<AuditOutlined />}
            onClick={() => auditContract(record.id)}
          >
            审计
          </Button>
          {record.status === 'completed' && (
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => exportEvidence(record)}
            >
              导出证据
            </Button>
          )}
        </Space>
      )
    }
  ];

  const viewTrajectory = async (contract) => {
    try {
      setSelectedContract(contract);
      setTrajectoryModalVisible(true);
      setTrajectoryData(null);

      const response = await legalApi.getTrajectory(contract.id);
      if (response.data.success) {
        setTrajectoryData(response.data.data);
      }
    } catch (error) {
      message.error('获取流程轨迹失败');
    }
  };

  const exportEvidence = async (contract) => {
    try {
      setSelectedContract(contract);
      setEvidenceModalVisible(true);
      setEvidenceData(null);

      const response = await legalApi.exportEvidence(contract.id, {});
      if (response.data.success) {
        setEvidenceData(response.data.data);
      }
    } catch (error) {
      message.error('导出证据链失败');
    }
  };

  const auditContract = async (contractId) => {
    try {
      setAuditModalVisible(true);
      setAuditData(null);

      const response = await legalApi.audit(contractId);
      if (response.data.success) {
        setAuditData(response.data.data);
      }
    } catch (error) {
      message.error('审计合同失败');
    }
  };

  const renderStatistics = () => {
    if (!statistics) return null;

    return (
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="合同总数"
              value={statistics.overview?.totalContracts || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="签署总数"
              value={statistics.overview?.totalSignatures || 0}
              prefix={<SafetyCertificateOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="今日新增"
              value={statistics.overview?.todayNewContracts || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="已完成"
              value={
                statistics.byStatus?.find(s => s.status === 'completed')?.count || 0
              }
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const tabItems = [
    {
      key: 'contracts',
      label: '合同管理',
      children: (
        <div>
          <Card
            style={{ marginBottom: 16 }}
            bodyStyle={{ padding: '12px 24px' }}
          >
            <Space wrap>
              <Input
                placeholder="搜索合同标题或发起人"
                prefix={<SearchOutlined />}
                style={{ width: 250 }}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
                allowClear
              />
              <Select
                placeholder="状态筛选"
                style={{ width: 150 }}
                allowClear
                value={filters.status}
                onChange={(value) => setFilters({ ...filters, status: value })}
              >
                <Select.Option value="draft">草稿</Select.Option>
                <Select.Option value="pending_signature">待签署</Select.Option>
                <Select.Option value="signing">签署中</Select.Option>
                <Select.Option value="completed">已完成</Select.Option>
              </Select>
              <DatePicker
                placeholder="开始日期"
                value={filters.fromDate ? dayjs(filters.fromDate) : null}
                onChange={(date) => setFilters({
                  ...filters,
                  fromDate: date ? date.format('YYYY-MM-DD') : undefined
                })}
              />
              <DatePicker
                placeholder="结束日期"
                value={filters.toDate ? dayjs(filters.toDate) : null}
                onChange={(date) => setFilters({
                  ...filters,
                  toDate: date ? date.format('YYYY-MM-DD') : undefined
                })}
              />
              <Button type="primary" onClick={fetchData}>
                查询
              </Button>
              <Button
                onClick={() => setFilters({
                  status: undefined,
                  search: undefined,
                  fromDate: undefined,
                  toDate: undefined
                })}
              >
                重置
              </Button>
            </Space>
          </Card>

          <Table
            columns={columns}
            dataSource={contracts}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </div>
      )
    },
    {
      key: 'stats',
      label: '数据统计',
      children: (
        <div>
          {renderStatistics()}

          {statistics?.byStatus && (
            <Card title="按状态统计">
              <List
                grid={{ gutter: 16, column: 4 }}
                dataSource={statistics.byStatus}
                renderItem={(item) => (
                  <List.Item>
                    <Card>
                      <Statistic
                        title={
                          getStatusTag(item.status)
                        }
                        value={item.count}
                      />
                    </Card>
                  </List.Item>
                )}
              />
            </Card>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">法务管理</h1>
        <p style={{ color: '#666', margin: '8px 0 0 0' }}>
          合同全流程轨迹查看、证据链管理与审计追溯
        </p>
      </div>

      <Tabs items={tabItems} />

      <Modal
        title="合同流程轨迹"
        open={trajectoryModalVisible}
        onCancel={() => {
          setTrajectoryModalVisible(false);
          setTrajectoryData(null);
          setSelectedContract(null);
        }}
        footer={null}
        width={800}
        styles={{ body: { maxHeight: '70vh', overflow: 'auto' } }}
      >
        {trajectoryData && (
          <div>
            <Alert
              message={`合同: ${trajectoryData.contract?.title}`}
              description={
                <Space>
                  <span>ID: {trajectoryData.contract?.id}</span>
                  {getStatusTag(trajectoryData.contract?.status)}
                </Space>
              }
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Divider>签署方信息</Divider>
            <List
              dataSource={trajectoryData.signers}
              renderItem={(signer) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<UserOutlined />}
                    title={
                      <Space>
                        {signer.name}
                        {signer.identityVerified ? (
                          <Tag color="success">已认证</Tag>
                        ) : (
                          <Tag color="orange">待认证</Tag>
                        )}
                        {signer.signStatus === 'signed' ? (
                          <Tag color="success">已签署</Tag>
                        ) : (
                          <Tag color="orange">待签署</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <span>
                        {signer.email && `邮箱: ${signer.email}`}
                        {signer.signedAt && ` | 签署时间: ${dayjs(signer.signedAt).format('YYYY-MM-DD HH:mm')}`}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />

            <Divider>证据链</Divider>
            <Alert
              message={
                <Space>
                  证据链完整性验证:
                  {trajectoryData.evidenceChain?.isValid ? (
                    <Tag color="success"><CheckCircleOutlined /> 验证通过</Tag>
                  ) : (
                    <Tag color="error">验证失败</Tag>
                  )}
                  <span>共 {trajectoryData.evidenceChain?.blockCount || 0} 个区块</span>
                </Space>
              }
              type={trajectoryData.evidenceChain?.isValid ? 'success' : 'error'}
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Timeline>
              {trajectoryData.evidenceChain?.blocks?.map((block, index) => (
                <Timeline.Item
                  key={block.id}
                  color={
                    block.operation.includes('sign') ? 'green' :
                    block.operation.includes('complete') ? 'blue' : 'gray'
                  }
                >
                  <div className="evidence-block">
                    <div className="operation">
                      <strong>{index + 1}. {block.operation}</strong>
                      {block.operatorName && (
                        <span style={{ marginLeft: 12, color: '#666' }}>
                          操作人: {block.operatorName}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      时间: {dayjs(block.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                    </div>
                    <div className="hash">
                      区块哈希: {block.blockHash?.substring(0, 32)}...
                    </div>
                    <div className="hash">
                      前一区块哈希: {block.previousHash?.substring(0, 32)}...
                    </div>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>

            {trajectoryData.activityLogs?.length > 0 && (
              <>
                <Divider>操作日志</Divider>
                <List
                  dataSource={trajectoryData.activityLogs}
                  renderItem={(log) => (
                    <List.Item>
                      <List.Item.Meta
                        title={log.action}
                        description={
                          <span>
                            {log.userName && `操作人: ${log.userName} | `}
                            {dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                            {log.description && (
                              <div style={{ marginTop: 4, color: '#666' }}>
                                {log.description}
                              </div>
                            )}
                          </span>
                        }
                      />
                    </List.Item>
                  )}
                />
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="证据链报告导出"
        open={evidenceModalVisible}
        onCancel={() => {
          setEvidenceModalVisible(false);
          setEvidenceData(null);
          setSelectedContract(null);
        }}
        footer={[
          <Button
            key="copy"
            onClick={() => {
              if (evidenceData?.exportPackage) {
                navigator.clipboard.writeText(
                  JSON.stringify(evidenceData.exportPackage, null, 2)
                );
                message.success('已复制到剪贴板');
              }
            }}
          >
            复制报告
          </Button>,
          <Button
            key="download"
            type="primary"
            onClick={() => {
              if (evidenceData?.exportPackage) {
                const blob = new Blob(
                  [JSON.stringify(evidenceData.exportPackage, null, 2)],
                  { type: 'application/json' }
                );
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `证据链报告_${selectedContract?.title}_${dayjs().format('YYYYMMDD')}.json`;
                a.click();
                window.URL.revokeObjectURL(url);
                message.success('下载成功');
              }
            }}
          >
            下载报告
          </Button>
        ]}
        width={700}
        styles={{ body: { maxHeight: '70vh', overflow: 'auto' } }}
      >
        {evidenceData && (
          <div>
            <Alert
              message="司法可用证据链包已生成"
              description={
                <Space>
                  <Tag color="success">
                    管辖权就绪: {evidenceData.exportPackage?.jurisdictionReady ? '是' : '否'}
                  </Tag>
                  <Tag color={evidenceData.exportPackage?.chainIntegrityVerified ? 'success' : 'error'}>
                    证据链完整性: {evidenceData.exportPackage?.chainIntegrityVerified ? '已验证' : '验证失败'}
                  </Tag>
                </Space>
              }
              type="success"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="报告ID">
                {evidenceData.exportPackage?.reportId}
              </Descriptions.Item>
              <Descriptions.Item label="生成时间">
                {dayjs(evidenceData.exportPackage?.generatedAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="报告哈希">
                <div className="hash-display">{evidenceData.exportHash}</div>
              </Descriptions.Item>
              {evidenceData.exportPackage?.contractInfo && (
                <>
                  <Descriptions.Item label="合同标题">
                    {evidenceData.exportPackage.contractInfo.title}
                  </Descriptions.Item>
                  <Descriptions.Item label="合同状态">
                    {getStatusTag(evidenceData.exportPackage.contractInfo.status)}
                  </Descriptions.Item>
                  <Descriptions.Item label="文件哈希">
                    <div className="hash-display">
                      {evidenceData.exportPackage.contractInfo.fileHash}
                    </div>
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>

            {evidenceData.exportPackage?.certificate && (
              <>
                <Divider>证书信息</Divider>
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="证书编号">
                    {evidenceData.exportPackage.certificate.certificateNumber}
                  </Descriptions.Item>
                  <Descriptions.Item label="签发机构">
                    {evidenceData.exportPackage.certificate.issuer}
                  </Descriptions.Item>
                  <Descriptions.Item label="签发时间">
                    {dayjs(evidenceData.exportPackage.certificate.issuedAt).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                  <Descriptions.Item label="有效期至">
                    {dayjs(evidenceData.exportPackage.certificate.validUntil).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}

            {evidenceData.exportPackage?.signers?.length > 0 && (
              <>
                <Divider>签署方信息</Divider>
                <List
                  dataSource={evidenceData.exportPackage.signers}
                  renderItem={(signer) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <Space>
                            {signer.name}
                            {signer.identityVerified && <Tag color="success">已认证</Tag>}
                            {signer.signStatus === 'signed' && <Tag color="success">已签署</Tag>}
                          </Space>
                        }
                        description={
                          <span>
                            {signer.email && `邮箱: ${signer.email} | `}
                            {signer.signedAt && `签署时间: ${dayjs(signer.signedAt).format('YYYY-MM-DD HH:mm:ss')}`}
                          </span>
                        }
                      />
                    </List.Item>
                  )}
                />
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="合同审计报告"
        open={auditModalVisible}
        onCancel={() => {
          setAuditModalVisible(false);
          setAuditData(null);
        }}
        footer={[
          <Button
            key="download"
            type="primary"
            onClick={() => {
              if (auditData) {
                const blob = new Blob(
                  [JSON.stringify(auditData, null, 2)],
                  { type: 'application/json' }
                );
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `审计报告_${auditData.contractId}_${dayjs().format('YYYYMMDD')}.json`;
                a.click();
                window.URL.revokeObjectURL(url);
                message.success('下载成功');
              }
            }}
          >
            下载审计报告
          </Button>
        ]}
        width={700}
        styles={{ body: { maxHeight: '70vh', overflow: 'auto' } }}
      >
        {auditData && (
          <div>
            <Alert
              message={
                <Space>
                  审计结果:
                  {auditData.auditPassed ? (
                    <Tag color="success"><CheckCircleOutlined /> 通过</Tag>
                  ) : (
                    <Tag color="error">不通过</Tag>
                  )}
                </Space>
              }
              description={`审计时间: ${dayjs(auditData.auditTimestamp).format('YYYY-MM-DD HH:mm:ss')}`}
              type={auditData.auditPassed ? 'success' : 'error'}
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Descriptions bordered column={1}>
              <Descriptions.Item label="合同ID">
                {auditData.contractId}
              </Descriptions.Item>
              <Descriptions.Item label="合同标题">
                {auditData.contractTitle}
              </Descriptions.Item>
            </Descriptions>

            <Divider>审计摘要</Divider>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="证据链验证">
                {auditData.summary?.evidenceChain?.valid ? (
                  <Tag color="success">通过</Tag>
                ) : (
                  <Tag color="error">失败</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="证据链完整性">
                <Tag color={auditData.summary?.evidenceChain?.integrity === 'COMPLETE' ? 'success' : 'error'}>
                  {auditData.summary?.evidenceChain?.integrity}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="区块数量">
                {auditData.summary?.evidenceChain?.totalBlocks || 0}
              </Descriptions.Item>
              <Descriptions.Item label="已签署人数">
                {auditData.summary?.signerVerification?.totalSigners || 0}
              </Descriptions.Item>
              <Descriptions.Item label="全部签署完成">
                {auditData.summary?.signerVerification?.allSigned ? (
                  <Tag color="success">是</Tag>
                ) : (
                  <Tag color="orange">否</Tag>
                )}
              </Descriptions.Item>
              {auditData.summary?.certificate && (
                <>
                  <Descriptions.Item label="证书存在">
                    {auditData.summary.certificate.exists ? (
                      <Tag color="success">是</Tag>
                    ) : (
                      <Tag color="default">否</Tag>
                    )}
                  </Descriptions.Item>
                  {auditData.summary.certificate.exists && (
                    <>
                      <Descriptions.Item label="证书有效">
                        {auditData.summary.certificate.valid ? (
                          <Tag color="success">是</Tag>
                        ) : (
                          <Tag color="error">否</Tag>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="证书未过期">
                        {auditData.summary.certificate.notExpired ? (
                          <Tag color="success">是</Tag>
                        ) : (
                          <Tag color="error">否</Tag>
                        )}
                      </Descriptions.Item>
                    </>
                  )}
                </>
              )}
            </Descriptions>

            {auditData.detailedAuditTrail?.length > 0 && (
              <>
                <Divider>详细审计轨迹</Divider>
                <List
                  dataSource={auditData.detailedAuditTrail}
                  renderItem={(item, index) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <Space>
                            <Tag>#{item.sequence}</Tag>
                            <strong>{item.operation}</strong>
                          </Space>
                        }
                        description={
                          <span>
                            {item.operator && `操作人: ${item.operator} | `}
                            {dayjs(item.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                            <Tag color="success" style={{ marginLeft: 8 }}>
                              {item.integrity}
                            </Tag>
                          </span>
                        }
                      />
                    </List.Item>
                  )}
                />
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LegalDashboard;
