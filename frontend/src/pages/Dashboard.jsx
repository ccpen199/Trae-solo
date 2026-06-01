import React, { useState, useEffect } from 'react';
import { Row, Col, Statistic, Card, Table, Tag, Space, Button, Progress, Tooltip, Badge, Descriptions, Timeline, Alert } from 'antd';
import {
  FileTextOutlined,
  AlertOutlined,
  SearchOutlined,
  AuditOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  EnvironmentOutlined,
  CameraOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SafetyOutlined,
  FileProtectOutlined,
  DownOutlined,
  RightOutlined,
  UserOutlined,
  CalendarOutlined,
  BarChartOutlined,
  ExclamationCircleOutlined,
  CloudOutlined,
  RadarChartOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  getStatsOverview, getPolicies, getReports, getClaims, getLogs, getRejectionReasons,
  getDisasterDistribution, getCompensationProgress, getCropDistribution, getProcessingTime
} from '../utils/api.js';

const statusColors = {
  active: 'green', expired: 'default', cancelled: 'red',
  pending: 'orange', surveying: 'blue', surveyed: 'cyan',
  approved: 'green', rejected: 'red', paid: 'purple',
  reviewing: 'orange', unpaid: 'red'
};

const statusLabels = {
  active: '有效', expired: '已过期', cancelled: '已注销',
  pending: '待查勘', surveying: '查勘中', surveyed: '已查勘',
  approved: '已通过', rejected: '已拒赔', paid: '已赔付',
  reviewing: '审核中', unpaid: '未支付'
};

const paymentLabels = { unpaid: '未支付', paid: '已支付' };
const cropLabels = { RICE: '水稻', WHEAT: '小麦', CORN: '玉米', SOYBEAN: '大豆', COTTON: '棉花', VEGETABLE: '蔬菜', FRUIT: '果树', OTHER: '其他' };
const disasterLabels = { DROUGHT: '旱灾', FLOOD: '洪涝', HAIL: '冰雹', TYPHOON: '台风', FREEZE: '冻害', PEST: '病虫害', FIRE: '火灾', OTHER: '其他' };
const roleLabels = { insurer: '保险公司', township: '乡镇', regulator: '监管方', surveyor: '查勘员', farmer: '农户', admin: '系统管理员' };
const moduleLabels = { policy: '保单', report: '报案', survey: '查勘', claim: '理赔', user: '用户', system: '系统' };
const actionLabels = { create: '创建', update: '更新', delete: '删除', approve: '审批', reject: '拒赔', pay: '支付', login: '登录' };

function formatHours(hours) {
  if (!hours) return '0.0 小时';
  if (hours < 1) return `${(hours * 60).toFixed(1)} 分钟`;
  if (hours < 24) return `${hours.toFixed(1)} 小时`;
  return `${(hours / 24).toFixed(1)} 天`;
}

function parseApprovals(approvalsStr) {
  if (!approvalsStr) return null;
  if (Array.isArray(approvalsStr)) return approvalsStr;
  try {
    return approvalsStr.split('|').map(s => {
      const [role, status, opinion, time] = s.split(':');
      return { approver_role: role, approval_status: status, approval_opinion: opinion, approval_time: time };
    });
  } catch { return null; }
}

function renderApprovalProgress(approvals, showDetails = false) {
  const list = Array.isArray(approvals) ? approvals : parseApprovals(approvals);
  if (!list || list.length === 0) return <span style={{ color: '#999' }}>待启动</span>;
  const rejected = list.some(a => a.approval_status === 'rejected');
  if (rejected && showDetails) {
    return <Tag color="red">已拒赔</Tag>;
  }
  return (
    <Space size={2}>
      {list.map((a, i) => (
        <Tooltip key={i} title={`${roleLabels[a.approver_role] || a.approver_role}: ${
          a.approval_status === 'approved' ? '已通过' :
          a.approval_status === 'pending' ? '待审批' : '已拒赔'
        }${a.approval_opinion ? ` - ${a.approval_opinion}` : ''}${a.approval_time ? ` (${a.approval_time})` : ''}`}>
          <Badge
            status={a.approval_status === 'approved' ? 'success' : a.approval_status === 'pending' ? 'processing' : 'error'}
            text={roleLabels[a.approver_role]?.slice(0, 2) || a.approver_role}
            style={{ fontSize: 11 }}
          />
        </Tooltip>
      ))}
    </Space>
  );
}

function renderValidationSummary(claim, showText = false) {
  const items = [];
  if (claim.policy_valid) {
    items.push(
      <Tooltip key="p" title={`保单有效: ${showText ? '保单在有效期内且保费已支付' : ''}`}>
        <Space size={3}><CheckCircleOutlined style={{ color: '#52c41a' }} /> 保单</Space>
      </Tooltip>
    );
  } else {
    items.push(
      <Tooltip key="p" title={`保单无效: ${showText ? '保单已过期或保费未支付' : ''}`}>
        <Space size={3}><CloseCircleOutlined style={{ color: '#f5222d' }} /> 保单</Space>
      </Tooltip>
    );
  }
  if (claim.duplicate_report) {
    items.push(
      <Tooltip key="d" title={`疑似重复报案: ${showText ? '同一保单24小时内同灾害类型已有报案' : ''}`}>
        <Space size={3}><ExclamationCircleOutlined style={{ color: '#faad14' }} /> 重复</Space>
      </Tooltip>
    );
  } else {
    items.push(
      <Tooltip key="d" title="无重复报案">
        <Space size={3}><CheckCircleOutlined style={{ color: '#52c41a' }} /> 重复</Space>
      </Tooltip>
    );
  }
  if (claim.materials_complete) {
    items.push(
      <Tooltip key="m" title="材料完整">
        <Space size={3}><CheckCircleOutlined style={{ color: '#52c41a' }} /> 材料</Space>
      </Tooltip>
    );
  } else {
    items.push(
      <Tooltip key="m" title={`材料缺失: ${claim.missing_materials || ''}`}>
        <Space size={3}><CloseCircleOutlined style={{ color: '#f5222d' }} /> 材料</Space>
      </Tooltip>
    );
  }
  return <Space size={8}>{items}</Space>;
}

function renderPhotos(photosStr) {
  if (!photosStr || photosStr === '[]' || photosStr === 'null') return null;
  try {
    const photos = typeof photosStr === 'string' ? JSON.parse(photosStr) : photosStr;
    if (!Array.isArray(photos) || photos.length === 0) return null;
    return (
      <Space size={8}>
        {photos.slice(0, 3).map((p, i) => (
          <Tooltip key={i} title={p.caption || p.url}>
            <div style={{
              width: 60, height: 60, borderRadius: 4,
              background: `linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid #91d5ff'
            }}>
              <CameraOutlined style={{ color: '#1890ff', fontSize: 20 }} />
            </div>
          </Tooltip>
        ))}
        {photos.length > 3 && <Tag style={{ margin: 0 }}>+{photos.length - 3}</Tag>}
      </Space>
    );
  } catch { return null; }
}

function Dashboard({ currentUser }) {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [recentPolicies, setRecentPolicies] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [recentClaims, setRecentClaims] = useState([]);
  const [rejectionReasons, setRejectionReasons] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [disasterDist, setDisasterDist] = useState([]);
  const [compensationProgress, setCompensationProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [expandedReportKeys, setExpandedReportKeys] = useState([]);
  const [expandedClaimKeys, setExpandedClaimKeys] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        overviewRes, policiesRes, reportsRes, claimsRes,
        reasonsRes, logsRes, disasterRes, progressRes
      ] = await Promise.all([
        getStatsOverview(),
        getPolicies({ limit: 5 }),
        getReports({ limit: 5 }),
        getClaims({ limit: 5 }),
        getRejectionReasons().catch(() => ({ data: [] })),
        getLogs({ limit: 10 }).catch(() => ({ data: { data: [] } })),
        getDisasterDistribution().catch(() => ({ data: [] })),
        getCompensationProgress().catch(() => ({ data: [] }))
      ]);
      setOverview(overviewRes.data);
      setRecentPolicies(policiesRes.data.data || []);
      setRecentReports(reportsRes.data.data || []);
      setRecentClaims(claimsRes.data.data || []);
      setRejectionReasons(reasonsRes.data || []);
      setRecentLogs(logsRes.data.data || []);
      setDisasterDist(disasterRes.data || []);
      setCompensationProgress(progressRes.data || []);
    } catch (e) {
      console.error('Load dashboard data failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const expandPolicy = (expanded, record) => {
    setExpandedRowKeys(expanded ? [...expandedRowKeys, record.id] : expandedRowKeys.filter(k => k !== record.id));
  };

  const expandReport = (expanded, record) => {
    setExpandedReportKeys(expanded ? [...expandedReportKeys, record.id] : expandedReportKeys.filter(k => k !== record.id));
  };

  const expandClaim = (expanded, record) => {
    setExpandedClaimKeys(expanded ? [...expandedClaimKeys, record.id] : expandedClaimKeys.filter(k => k !== record.id));
  };

  const renderPolicyExpandRow = (record) => {
    const reports = record.reports || [];
    const surveys = record.surveys || [];
    const claims = record.claims || [];

    return (
      <div style={{ background: '#fafafa', padding: '16px 24px', borderRadius: 4 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card size="small" title={<Space><AlertOutlined style={{ color: '#fa8c16' }} /> 关联报案 ({reports.length})</Space>} bodyStyle={{ padding: '8px 12px' }}>
              {reports.length === 0 ? (
                <div style={{ color: '#999', textAlign: 'center', padding: '16px 0' }}>暂无报案记录</div>
              ) : (
                reports.map(r => (
                  <div key={r.id} style={{ padding: '8px 0', borderBottom: '1px dashed #eee', cursor: 'pointer' }} onClick={() => navigate(`/reports/${r.id}`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        <a>{r.report_no}</a>
                        <Tag color={statusColors[r.status]} size="small">{statusLabels[r.status]}</Tag>
                      </Space>
                      <span style={{ color: '#666', fontSize: 12 }}>{dayjs(r.created_at).format('MM-DD HH:mm')}</span>
                    </div>
                    <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                      {disasterLabels[r.disaster_type]} · {r.damaged_area}亩 · 报案人: {r.reporter_name || '-'}
                    </div>
                  </div>
                ))
              )}
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" title={<Space><SearchOutlined style={{ color: '#722ed1' }} /> 查勘定损 ({surveys.length})</Space>} bodyStyle={{ padding: '8px 12px' }}>
              {surveys.length === 0 ? (
                <div style={{ color: '#999', textAlign: 'center', padding: '16px 0' }}>暂无查勘记录</div>
              ) : (
                surveys.map(s => (
                  <div key={s.id} style={{ padding: '8px 0', borderBottom: '1px dashed #eee', cursor: 'pointer' }} onClick={() => navigate(`/surveys/${s.id}`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        <a>查勘 #{s.id}</a>
                        <Tag color={statusColors[s.status]} size="small">{statusLabels[s.status]}</Tag>
                      </Space>
                      <span style={{ color: '#666', fontSize: 12 }}>{dayjs(s.created_at).format('MM-DD HH:mm')}</span>
                    </div>
                    <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                      损失比例: {(s.loss_ratio * 100).toFixed(0)}% · 预估损失: ¥{s.estimated_loss?.toLocaleString() || 0} · 查勘员: {s.surveyor_name || '-'}
                    </div>
                  </div>
                ))
              )}
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" title={<Space><AuditOutlined style={{ color: '#13c2c2' }} /> 理赔审核 ({claims.length})</Space>} bodyStyle={{ padding: '8px 12px' }}>
              {claims.length === 0 ? (
                <div style={{ color: '#999', textAlign: 'center', padding: '16px 0' }}>暂无理赔记录</div>
              ) : (
                claims.map(c => (
                  <div key={c.id} style={{ padding: '8px 0', borderBottom: '1px dashed #eee', cursor: 'pointer' }} onClick={() => navigate(`/claims/${c.id}`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        <a>{c.claim_no}</a>
                        <Tag color={statusColors[c.status]} size="small">{statusLabels[c.status]}</Tag>
                      </Space>
                      <span style={{ color: '#666', fontSize: 12 }}>{dayjs(c.created_at).format('MM-DD HH:mm')}</span>
                    </div>
                    <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                      赔付金额: ¥{c.compensation_amount?.toLocaleString() || 0}
                      <div style={{ marginTop: 4 }}>{renderApprovalProgress(c.approvals)}</div>
                    </div>
                  </div>
                ))
              )}
            </Card>
          </Col>
        </Row>
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size={8}>
            <Tag color="blue">保险公司: {record.insurer_name || '-'}</Tag>
            {record.payment_status === 'paid' && <Tag color="green">保费已支付: {record.payment_time ? dayjs(record.payment_time).format('YYYY-MM-DD HH:mm') : '-'}</Tag>}
            {record.deductible_clause && <Tag color="orange">免赔条款: {record.deductible_clause}</Tag>}
            {record.deductible_ratio && <Tag color="gold">免赔比例: {(record.deductible_ratio * 100).toFixed(0)}%</Tag>}
          </Space>
          <Button type="link" size="small" onClick={() => navigate(`/policies/${record.id}`)}>查看完整保单 <RightOutlined style={{ fontSize: 10 }} /></Button>
        </div>
      </div>
    );
  };

  const renderReportExpandRow = (record) => {
    const photosDisplay = renderPhotos(record.photos);
    return (
      <div style={{ background: '#fafafa', padding: '16px 24px', borderRadius: 4 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label="灾害类型" span={1}>
                <Tag color="orange">{disasterLabels[record.disaster_type] || record.disaster_type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="发生时间" span={1}>
                <Space size={4}><CalendarOutlined /> {dayjs(record.disaster_time).format('YYYY-MM-DD HH:mm')}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="灾害位置" span={2}>
                <Space size={4}><EnvironmentOutlined style={{ color: '#1890ff' }} /> {record.location || record.address || '-'}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="GPS定位" span={1}>
                {(record.longitude && record.latitude) ? `${record.longitude}, ${record.latitude}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="受损面积" span={1}>{record.damaged_area} 亩</Descriptions.Item>
              <Descriptions.Item label="紧急联系人" span={1}>
                <Space size={4}><PhoneOutlined style={{ color: '#fa8c16' }} /> {record.emergency_contact || record.farmer_name || '-'}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="联系电话" span={1}>{record.emergency_phone || record.farmer_phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="自动关联依据" span={2}>
                <Tag color="blue">保单匹配: {record.policy_no || '-'}</Tag>
                <Tag color="green">作物匹配: {cropLabels[record.crop_type] || record.crop_type}</Tag>
                <Tag color="purple">受灾面积 ≤ 投保面积</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="灾害描述" span={2}>{record.description || '-'}</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={12}>
            <Card size="small" title={<Space><CameraOutlined style={{ color: '#1890ff' }} /> 现场照片证据</Space>} bodyStyle={{ padding: 12 }}>
              {photosDisplay || <div style={{ color: '#999', textAlign: 'center', padding: '20px 0' }}>暂无照片</div>}
            </Card>
            <Card size="small" title={<Space><UserOutlined style={{ color: '#722ed1' }} /> 报案与处理责任</Space>} bodyStyle={{ padding: 12 }} style={{ marginTop: 12 }}>
              <Row>
                <Col span={8} style={{ textAlign: 'center', borderRight: '1px solid #f0f0f0' }}>
                  <div style={{ color: '#666', fontSize: 12 }}>报案人</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{record.reporter_name || record.farmer_name || '农户'}</div>
                  <div style={{ color: '#999', fontSize: 11 }}>{dayjs(record.created_at).format('MM-DD HH:mm')}</div>
                </Col>
                <Col span={8} style={{ textAlign: 'center', borderRight: '1px solid #f0f0f0' }}>
                  <div style={{ color: '#666', fontSize: 12 }}>查勘员</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{record.status === 'pending' ? <Tag color="orange">待分配</Tag> : <Tag color="blue">已分配</Tag>}</div>
                  <div style={{ color: '#999', fontSize: 11 }}>{record.status === 'surveyed' ? '已完成' : record.status === 'surveying' ? '查勘中' : '待处理'}</div>
                </Col>
                <Col span={8} style={{ textAlign: 'center' }}>
                  <div style={{ color: '#666', fontSize: 12 }}>审核方</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}><Tag color="purple">保险公司</Tag></div>
                  <div style={{ color: '#999', fontSize: 11 }}>三级审批制</div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
        <div style={{ marginTop: 12, textAlign: 'right' }}>
          <Space>
            {record.status === 'pending' && <Button type="primary" size="small" icon={<SearchOutlined />} onClick={() => navigate(`/surveys/create?report_id=${record.id}`)}>前往查勘</Button>}
            <Button type="link" size="small" onClick={() => navigate(`/reports/${record.id}`)}>查看完整报案 <RightOutlined style={{ fontSize: 10 }} /></Button>
          </Space>
        </div>
      </div>
    );
  };

  const renderClaimExpandRow = (record) => {
    const approvals = Array.isArray(record.approvals) ? record.approvals : parseApprovals(record.approvals);
    return (
      <div style={{ background: '#fafafa', padding: '16px 24px', borderRadius: 4 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card size="small" title={<Space><CheckCircleOutlined style={{ color: '#52c41a' }} /> 审核校验结论</Space>} bodyStyle={{ padding: 12 }}>
              <Descriptions size="small" column={1} bordered>
                <Descriptions.Item label="保单有效性校验">
                  <Space>
                    {record.policy_valid ? (
                      <><CheckCircleOutlined style={{ color: '#52c41a' }} /> <span style={{ color: '#52c41a' }}>通过</span> - 保单有效且在保障期内</>
                    ) : (
                      <><CloseCircleOutlined style={{ color: '#f5222d' }} /> <span style={{ color: '#f5222d' }}>未通过</span> - 保单无效或已过期</>
                    )}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="免赔条款适用">
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    免赔比例 {(record.deductible_ratio * 100).toFixed(0)}%，扣除免赔额 ¥{record.deductible_applied?.toLocaleString() || 0}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="重复报案检测">
                  <Space>
                    {record.duplicate_report ? (
                      <><ExclamationCircleOutlined style={{ color: '#faad14' }} /> <span style={{ color: '#faad14' }}>疑似重复</span> - 24小时内同灾害类型报案</>
                    ) : (
                      <><CheckCircleOutlined style={{ color: '#52c41a' }} /> <span style={{ color: '#52c41a' }}>通过</span> - 无重复报案记录</>
                    )}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="材料完整性校验">
                  <Space>
                    {record.materials_complete ? (
                      <><CheckCircleOutlined style={{ color: '#52c41a' }} /> <span style={{ color: '#52c41a' }}>完整</span> - 必备材料齐全</>
                    ) : (
                      <><CloseCircleOutlined style={{ color: '#f5222d' }} /> <span style={{ color: '#f5222d' }}>缺失</span> - {record.missing_materials}</>
                    )}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="赔付金额计算">
                  保额 ¥{record.insurance_amount?.toLocaleString() || 0} × 受灾占比 × 损失比例 {(record.loss_ratio * 100).toFixed(0)}% - 免赔 = <strong>¥{record.compensation_amount?.toLocaleString() || 0}</strong>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card size="small" title={<Space><AuditOutlined style={{ color: '#722ed1' }} /> 三级审批轨迹</Space>} bodyStyle={{ padding: 12 }}>
              {approvals && approvals.length > 0 ? (
                <Timeline size="small">
                  {approvals.map((a, i) => (
                    <Timeline.Item
                      key={i}
                      color={a.approval_status === 'approved' ? 'green' : a.approval_status === 'pending' ? 'blue' : 'red'}
                      dot={a.approval_status === 'approved' ? <CheckCircleOutlined /> : a.approval_status === 'pending' ? <ClockCircleOutlined /> : <CloseCircleOutlined />}
                    >
                      <div style={{ fontWeight: 600 }}>
                        {roleLabels[a.approver_role] || a.approver_role}
                        <Tag color={a.approval_status === 'approved' ? 'green' : a.approval_status === 'pending' ? 'blue' : 'red'} style={{ marginLeft: 8 }}>
                          {a.approval_status === 'approved' ? '已通过' : a.approval_status === 'pending' ? '待审批' : '已拒赔'}
                        </Tag>
                      </div>
                      <div style={{ color: '#666', fontSize: 12, marginTop: 2 }}>
                        {a.approval_time ? dayjs(a.approval_time).format('YYYY-MM-DD HH:mm') : '待处理'}
                      </div>
                      {a.approval_opinion && (
                        <div style={{ color: '#666', fontSize: 12, marginTop: 4, background: '#f5f5f5', padding: '4px 8px', borderRadius: 4 }}>
                          "{a.approval_opinion}"
                        </div>
                      )}
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : (
                <div style={{ color: '#999', textAlign: 'center', padding: '20px 0' }}>审批未启动</div>
              )}
            </Card>
            <Card size="small" title={<Space><DollarOutlined style={{ color: '#52c41a' }} /> 支付与复查记录</Space>} bodyStyle={{ padding: 12 }} style={{ marginTop: 12 }}>
              <Descriptions size="small" column={1} bordered>
                <Descriptions.Item label="审核意见">
                  {record.review_opinion || '待审核'}
                </Descriptions.Item>
                <Descriptions.Item label="审核人">
                  {record.reviewer_name || '待分配'}
                </Descriptions.Item>
                <Descriptions.Item label="审核时间">
                  {record.review_time ? dayjs(record.review_time).format('YYYY-MM-DD HH:mm') : '待审核'}
                </Descriptions.Item>
                <Descriptions.Item label="拒赔原因">
                  {record.rejection_reason || <span style={{ color: '#999' }}>无</span>}
                </Descriptions.Item>
                <Descriptions.Item label="支付状态">
                  {record.status === 'paid' ? (
                    <Space><Tag color="purple">已支付</Tag> {record.payment_time && dayjs(record.payment_time).format('YYYY-MM-DD HH:mm')}</Space>
                  ) : record.status === 'approved' ? (
                    <Tag color="green">待支付</Tag>
                  ) : (
                    <Tag color={statusColors[record.status]}>{statusLabels[record.status]}</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="监管报送">
                  {record.status === 'paid' || record.status === 'rejected' ? (
                    <Tag color="green">已报送</Tag>
                  ) : (
                    <Tag color="orange">待报送</Tag>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
        <div style={{ marginTop: 12, textAlign: 'right' }}>
          <Button type="link" size="small" onClick={() => navigate(`/claims/${record.id}`)}>查看完整理赔 <RightOutlined style={{ fontSize: 10 }} /></Button>
        </div>
      </div>
    );
  };

  const policyColumns = [
    {
      title: '保单号',
      dataIndex: 'policy_no',
      key: 'policy_no',
      width: 130,
      render: (text, record) => (
        <Space>
          {record.reports?.length > 0 && (
            <Tooltip title={`关联 ${record.reports.length} 条报案`}>
              <AlertOutlined style={{ color: '#fa8c16', fontSize: 12 }} />
            </Tooltip>
          )}
          <a onClick={() => navigate(`/policies/${record.id}`)}>{text}</a>
        </Space>
      )
    },
    { title: '农户姓名', dataIndex: 'farmer_name', key: 'farmer_name', width: 80 },
    { title: '作物类型', dataIndex: 'crop_type', key: 'crop_type', width: 70, render: v => cropLabels[v] || v },
    { title: '投保面积', dataIndex: 'area', key: 'area', width: 70, render: v => `${v}亩` },
    { title: '保险金额', dataIndex: 'insurance_amount', key: 'insurance_amount', width: 85, render: v => `¥${v?.toLocaleString()}` },
    {
      title: '地块位置',
      dataIndex: 'plot_location',
      key: 'plot_location',
      width: 110,
      ellipsis: true,
      render: (text, record) => (
        <Tooltip title={`经度: ${record.plot_longitude || '-'}, 纬度: ${record.plot_latitude || '-'}`}>
          <Space size={4}>
            <EnvironmentOutlined style={{ color: '#1890ff', fontSize: 12 }} />
            {text || '-'}
          </Space>
        </Tooltip>
      )
    },
    { title: '保障期限', key: 'period', width: 160, render: (_, r) => `${r.start_date?.slice(0, 10)} ~ ${r.end_date?.slice(0, 10)}` },
    {
      title: '保费状态',
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 75,
      render: (status) => <Tag color={status === 'paid' ? 'green' : 'red'}>{paymentLabels[status] || status}</Tag>
    },
    {
      title: '保单状态',
      dataIndex: 'status',
      key: 'status',
      width: 70,
      render: (status) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
    },
    { title: '支付时间', dataIndex: 'payment_time', key: 'payment_time', width: 140, render: t => t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-' }
  ];

  const reportColumns = [
    {
      title: '报案号',
      dataIndex: 'report_no',
      key: 'report_no',
      width: 130,
      render: (text, record) => (
        <Space>
          {record.status === 'pending' && (
            <Tooltip title="待查勘">
              <Badge status="processing" />
            </Tooltip>
          )}
          <a onClick={() => navigate(`/reports/${record.id}`)}>{text}</a>
        </Space>
      )
    },
    { title: '灾害类型', dataIndex: 'disaster_type', key: 'disaster_type', width: 65, render: v => disasterLabels[v] || v },
    { title: '农户', dataIndex: 'farmer_name', key: 'farmer_name', width: 70 },
    {
      title: '关联保单',
      dataIndex: 'policy_no',
      key: 'policy_no',
      width: 125,
      render: (text, record) => text ? (
        <a onClick={() => navigate(`/policies/${record.policy_id}`)}>{text}</a>
      ) : '-'
    },
    { title: '受损面积', dataIndex: 'damaged_area', key: 'damaged_area', width: 70, render: v => `${v}亩` },
    {
      title: '灾害时间',
      dataIndex: 'disaster_time',
      key: 'disaster_time',
      width: 110,
      render: t => t ? dayjs(t).format('MM-DD HH:mm') : '-'
    },
    {
      title: '照片/定位',
      key: 'media',
      width: 90,
      render: (_, r) => (
        <Space>
          {r.photos && r.photos !== '[]' && r.photos !== 'null' && (
            <Tooltip title="有灾害照片证据">
              <CameraOutlined style={{ color: '#1890ff' }} />
            </Tooltip>
          )}
          {(r.longitude || r.latitude) && (
            <Tooltip title={`GPS定位: ${r.longitude || '-'}, ${r.latitude || '-'}`}>
              <EnvironmentOutlined style={{ color: '#52c41a' }} />
            </Tooltip>
          )}
          {!r.photos && !r.longitude && <span style={{ color: '#999' }}>无</span>}
        </Space>
      )
    },
    {
      title: '紧急联系',
      key: 'contact',
      width: 110,
      render: (_, r) => (
        <Space size={4}>
          <PhoneOutlined style={{ color: '#fa8c16', fontSize: 12 }} />
          {r.emergency_phone || r.farmer_phone || '-'}
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 70,
      render: (status) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
    },
    { title: '报案时间', dataIndex: 'created_at', key: 'created_at', width: 135, render: t => dayjs(t).format('MM-DD HH:mm') }
  ];

  const claimColumns = [
    {
      title: '理赔号',
      dataIndex: 'claim_no',
      key: 'claim_no',
      width: 130,
      render: (text, record) => (
        <Space>
          {record.status === 'reviewing' && (
            <Tooltip title="审核中">
              <Badge status="processing" />
            </Tooltip>
          )}
          <a onClick={() => navigate(`/claims/${record.id}`)}>{text}</a>
        </Space>
      )
    },
    { title: '灾害', dataIndex: 'disaster_type', key: 'disaster_type', width: 55, render: v => disasterLabels[v] || v },
    {
      title: '查勘定损',
      key: 'survey',
      width: 110,
      render: (_, r) => r.loss_ratio ? (
        <Tooltip title={`预估损失: ¥${r.estimated_loss?.toLocaleString() || 0}`}>
          <Space size={4}>
            <SearchOutlined style={{ color: '#722ed1', fontSize: 12 }} />
            损失 {(r.loss_ratio * 100).toFixed(0)}%
          </Space>
        </Tooltip>
      ) : <span style={{ color: '#999' }}>待查勘</span>
    },
    {
      title: '校验结果',
      key: 'validation',
      width: 110,
      render: (_, r) => renderValidationSummary(r, true)
    },
    { title: '赔付金额', dataIndex: 'compensation_amount', key: 'compensation_amount', width: 85, render: v => `¥${v?.toLocaleString()}` },
    {
      title: '审批轨迹',
      key: 'approvals',
      width: 135,
      render: (_, r) => renderApprovalProgress(r.approvals, true)
    },
    {
      title: '支付状态',
      key: 'payment',
      width: 80,
      render: (_, r) => r.status === 'paid' ? (
        <Tooltip title={r.payment_time}>
          <Tag color="purple">已支付</Tag>
        </Tooltip>
      ) : r.status === 'approved' ? (
        <Tag color="green">待支付</Tag>
      ) : (
        <Tag color={statusColors[r.status]}>{statusLabels[r.status]}</Tag>
      )
    },
    { title: '申请时间', dataIndex: 'created_at', key: 'created_at', width: 135, render: t => dayjs(t).format('MM-DD HH:mm') }
  ];

  const logColumns = [
    { title: '操作人', dataIndex: 'user_name', key: 'user_name', width: 70 },
    { title: '角色', dataIndex: 'user_role', key: 'user_role', width: 60, render: v => roleLabels[v] || v },
    { title: '模块', dataIndex: 'module', key: 'module', width: 55, render: v => moduleLabels[v] || v },
    { title: '动作', dataIndex: 'action', key: 'action', width: 55, render: v => actionLabels[v] || v },
    { title: '详情', dataIndex: 'details', key: 'details', ellipsis: true },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 135, render: t => dayjs(t).format('MM-DD HH:mm') }
  ];

  return (
    <div>
      <div className="page-title">工作台</div>
      {currentUser && (
        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          showIcon
          icon={<SafetyOutlined />}
          message={
            <Space>
              <span>当前用户:</span>
              <strong>{currentUser.name}</strong>
              <Tag color="blue">{roleLabels[currentUser.role] || currentUser.role}</Tag>
              <span style={{ color: '#666' }}>|</span>
              <span style={{ color: '#666' }}>
                权限边界:
                {currentUser.role === 'regulator' && ' 监管方 - 可查看所有数据、审批最终环节、导出监管报表'}
                {currentUser.role === 'insurer' && ' 保险公司 - 可管理保单、查勘分配、一级审批、支付'}
                {currentUser.role === 'township' && ' 乡镇 - 可协助报案、二级审批、农户信息核实'}
                {currentUser.role === 'surveyor' && ' 查勘员 - 可执行查勘定损、上传证据'}
                {currentUser.role === 'farmer' && ' 农户 - 可查看自己保单、报案、理赔进度'}
                {currentUser.role === 'admin' && ' 系统管理员 - 全功能访问、用户管理、日志审计'}
              </span>
            </Space>
          }
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="stat-card">
            <Statistic
              title={<Space><FileTextOutlined /> 保单总数</Space>}
              value={overview?.policies?.count || 0}
              suffix="份"
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
              保额: ¥{overview?.policies?.total_amount?.toLocaleString() || 0} | 保费: ¥{overview?.policies?.total_premium?.toLocaleString() || 0}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="stat-card">
            <Statistic
              title={<Space><AlertOutlined /> 报案总数</Space>}
              value={overview?.reports?.count || 0}
              suffix="件"
              valueStyle={{ color: '#fa8c16' }}
            />
            <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
              受损面积: {overview?.reports?.total_damaged_area?.toLocaleString() || 0}亩
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="stat-card">
            <Statistic
              title={<Space><AuditOutlined /> 理赔总数</Space>}
              value={overview?.claims?.count || 0}
              suffix="件"
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
              审核中: {overview?.claims?.reviewing_count || 0} | 已通过: {overview?.claims?.approved_count || 0}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="stat-card">
            <Statistic
              title={<Space><DollarOutlined /> 赔付总额</Space>}
              value={overview?.claims?.total_compensation || 0}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
              已支付: ¥{overview?.claims?.paid_compensation?.toLocaleString() || 0} ({overview?.claims?.paid_count || 0}件)
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="stat-card">
            <Statistic
              title={<Space><ClockCircleOutlined /> 平均处理时长</Space>}
              value={formatHours(overview?.avg_process_hours)}
              valueStyle={{ color: '#13c2c2', fontSize: 18 }}
            />
            <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
              报案→赔付全流程
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="stat-card">
            <Statistic
              title={<Space><SafetyOutlined /> 拒赔案件</Space>}
              value={overview?.claims?.rejected_count || 0}
              suffix="件"
              valueStyle={{ color: '#f5222d' }}
            />
            <div style={{ marginTop: 8 }}>
              <Progress
                percent={overview?.claims?.count ? Math.round((overview?.claims?.rejected_count || 0) / overview?.claims?.count * 100) : 0}
                size="small"
                status="exception"
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title={<Space><FileProtectOutlined /> 最近保单 <span style={{ color: '#999', fontSize: 12, fontWeight: 'normal' }}>（点击展开查看完整业务链路）</span></Space>}
            extra={
              <Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/policies/create')}>
                  新增保单
                </Button>
                <Button onClick={() => navigate('/policies')}>查看全部</Button>
              </Space>
            }
          >
            <Table
              columns={policyColumns}
              dataSource={recentPolicies}
              rowKey="id"
              pagination={false}
              size="small"
              loading={loading}
              scroll={{ x: 1100 }}
              expandable={{
                expandedRowKeys,
                onExpand: expandPolicy,
                expandedRowRender: renderPolicyExpandRow,
                expandIcon: ({ expanded, onExpand, record }) => (
                  expanded ?
                    <DownOutlined style={{ fontSize: 12, color: '#1890ff', cursor: 'pointer' }} onClick={e => onExpand(record, e)} /> :
                    <RightOutlined style={{ fontSize: 12, color: '#999', cursor: 'pointer' }} onClick={e => onExpand(record, e)} />
                )
              }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title={<Space><AlertOutlined /> 最近报案 <span style={{ color: '#999', fontSize: 12, fontWeight: 'normal' }}>（点击展开查看证据链）</span></Space>}
            extra={
              <Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/reports/create')}>
                  新增报案
                </Button>
                <Button onClick={() => navigate('/reports')}>查看全部</Button>
              </Space>
            }
          >
            <Table
              columns={reportColumns}
              dataSource={recentReports}
              rowKey="id"
              pagination={false}
              size="small"
              loading={loading}
              scroll={{ x: 1000 }}
              expandable={{
                expandedRowKeys: expandedReportKeys,
                onExpand: expandReport,
                expandedRowRender: renderReportExpandRow,
                expandIcon: ({ expanded, onExpand, record }) => (
                  expanded ?
                    <DownOutlined style={{ fontSize: 12, color: '#1890ff', cursor: 'pointer' }} onClick={e => onExpand(record, e)} /> :
                    <RightOutlined style={{ fontSize: 12, color: '#999', cursor: 'pointer' }} onClick={e => onExpand(record, e)} />
                )
              }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={<Space><AuditOutlined /> 最近理赔 <span style={{ color: '#999', fontSize: 12, fontWeight: 'normal' }}>（点击展开查看校验与审批）</span></Space>}
            extra={
              <Button onClick={() => navigate('/claims')}>查看全部</Button>
            }
          >
            <Table
              columns={claimColumns}
              dataSource={recentClaims}
              rowKey="id"
              pagination={false}
              size="small"
              loading={loading}
              scroll={{ x: 950 }}
              expandable={{
                expandedRowKeys: expandedClaimKeys,
                onExpand: expandClaim,
                expandedRowRender: renderClaimExpandRow,
                expandIcon: ({ expanded, onExpand, record }) => (
                  expanded ?
                    <DownOutlined style={{ fontSize: 12, color: '#1890ff', cursor: 'pointer' }} onClick={e => onExpand(record, e)} /> :
                    <RightOutlined style={{ fontSize: 12, color: '#999', cursor: 'pointer' }} onClick={e => onExpand(record, e)} />
                )
              }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={8}>
          <Card
            title={<Space><BarChartOutlined style={{ color: '#fa8c16' }} /> 灾害分布统计</Space>}
            size="small"
            extra={<Button type="link" size="small" onClick={() => navigate('/stats')}>详情</Button>}
          >
            {disasterDist && disasterDist.length > 0 ? (
              disasterDist.slice(0, 5).map((item, idx) => (
                <div key={idx} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Space size={4}>
                      {item.disaster_name === '洪涝' && <CloudOutlined style={{ color: '#1890ff' }} />}
                      {item.disaster_name === '冰雹' && <ExclamationCircleOutlined style={{ color: '#722ed1' }} />}
                      {item.disaster_name === '旱灾' && <RadarChartOutlined style={{ color: '#fa8c16' }} />}
                      {!['洪涝', '冰雹', '旱灾'].includes(item.disaster_name) && <AlertOutlined style={{ color: '#faad14' }} />}
                      <span>{item.disaster_name}</span>
                    </Space>
                    <span style={{ color: '#666' }}>{item.count}件 / ¥{item.total_compensation?.toLocaleString() || 0}</span>
                  </div>
                  <Progress percent={item.percentage || 0} size="small" />
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>暂无数据</div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            title={<Space><DollarOutlined style={{ color: '#52c41a' }} /> 赔付进度</Space>}
            size="small"
            extra={<Button type="link" size="small" onClick={() => navigate('/stats')}>详情</Button>}
          >
            {compensationProgress && compensationProgress.length > 0 ? (
              compensationProgress.slice(0, 6).map((item, idx) => (
                <div key={idx} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span>{item.period || '-'}</span>
                    <span style={{ color: '#666' }}>¥{item.amount?.toLocaleString() || 0} ({item.count}件)</span>
                  </div>
                  <Progress
                    percent={overview?.claims?.total_compensation ? Math.round((item.amount || 0) / overview?.claims?.total_compensation * 100) : 0}
                    size="small"
                    strokeColor="#52c41a"
                  />
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>暂无数据</div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            title={<Space><ExclamationCircleOutlined style={{ color: '#f5222d' }} /> 拒赔原因统计</Space>}
            size="small"
            extra={<Button type="link" size="small" onClick={() => navigate('/stats')}>详情</Button>}
          >
            {rejectionReasons && rejectionReasons.length > 0 ? (
              rejectionReasons.slice(0, 5).map((item, idx) => (
                <div key={idx} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span>{item.reason || '未说明原因'}</span>
                    <span style={{ color: '#666' }}>{item.count}件 ({item.percentage || 0}%)</span>
                  </div>
                  <Progress percent={item.percentage || 0} size="small" status="exception" />
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>暂无拒赔记录</div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            title={<Space><FileTextOutlined /> 操作日志 <span style={{ color: '#999', fontSize: 12, fontWeight: 'normal' }}>（监管报送核对维度）</span></Space>}
            extra={<Button type="link" size="small" onClick={() => navigate('/logs')}>查看全部</Button>}
          >
            <Table
              columns={logColumns}
              dataSource={recentLogs}
              rowKey="id"
              pagination={false}
              size="small"
              loading={loading}
              scroll={{ x: 900 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
