import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Descriptions, Tag, Upload, Tabs, Table, 
  Timeline, Modal, message, Space, Tooltip, Alert, Row, Col, Statistic, Divider, Popconfirm
} from 'antd';
import { 
  ArrowLeftOutlined, UploadOutlined, FileSearchOutlined, 
  SafetyCertificateOutlined, RobotOutlined, ExportOutlined,
  ReloadOutlined, WarningOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { bidsApi } from '../utils/api';
import dayjs from 'dayjs';

function BidDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [data, setData] = useState({
    bid: null, items: [], responses: [], qualifications: [], missingChecks: [], statusHistory: []
  });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  const hasPermission = (action) => {
    if (!currentUser) return false;
    const role = currentUser.role_name;
    
    const permissions = {
      business_owner: ['upload', 'parse', 'match', 'generate', 'review', 'export', 'create', 'update'],
      model_operator: ['parse', 'match', 'generate', 'upload', 'view'],
      reviewer: ['review', 'view'],
      user: ['create', 'view', 'export', 'upload']
    };
    
    return permissions[role]?.includes(action) || role === 'business_owner';
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await bidsApi.getDetail(id);
      setData(res.data);
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async ({ file }) => {
    setActionLoading('upload');
    try {
      await bidsApi.upload(id, file);
      message.success('上传成功');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '上传失败');
    } finally {
      setActionLoading('');
    }
  };

  const handleParse = async (simulateError = null) => {
    setActionLoading('parse');
    try {
      await bidsApi.parse(id, { simulate_error: simulateError });
      message.success('解析成功');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '解析失败');
    } finally {
      setActionLoading('');
    }
  };

  const handleMatch = async (simulateError = null) => {
    setActionLoading('match');
    try {
      await bidsApi.match(id, { simulate_error: simulateError });
      message.success('资质匹配完成');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '匹配失败');
    } finally {
      setActionLoading('');
    }
  };

  const handleGenerate = async (simulateError = null) => {
    setActionLoading('generate');
    try {
      await bidsApi.generate(id, { simulate_error: simulateError });
      message.success('响应生成完成');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '生成失败');
    } finally {
      setActionLoading('');
    }
  };

  const handleExport = async () => {
    setActionLoading('export');
    try {
      const res = await bidsApi.export(id);
      const exportData = res.data.data;
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `标书_${data.bid?.project_name || data.bid?.bid_no}_${dayjs().format('YYYYMMDD')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      Modal.success({
        title: '导出成功',
        content: (
          <div>
            <p>标书数据文件已下载</p>
            <p style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
              • 评分项: {exportData.items?.length || 0} 个<br/>
              • 响应内容: {exportData.responses?.length || 0} 条<br/>
              • 资质匹配: {exportData.qualifications?.length || 0} 项
            </p>
          </div>
        ),
      });
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '导出失败');
    } finally {
      setActionLoading('');
    }
  };

  const statusMap = {
    draft: { text: '草稿', color: 'default' },
    uploaded: { text: '已上传', color: 'blue' },
    parsed: { text: '已解析', color: 'cyan' },
    matched: { text: '已匹配', color: 'green' },
    generated: { text: '已生成', color: 'purple' },
    reviewed: { text: '已审核', color: 'orange' },
    exported: { text: '已导出', color: 'success' }
  };

  const itemColumns = [
    { title: '章节', dataIndex: 'section', width: 120 },
    { title: '序号', dataIndex: 'item_no', width: 80 },
    { title: '评分项内容', dataIndex: 'item_content' },
    { title: '权重', dataIndex: 'score_weight', width: 80 },
    { title: '要求等级', dataIndex: 'requirement_level', width: 100,
      render: (v) => <Tag color={v === 'core' ? 'red' : v === 'basic' ? 'blue' : 'green'}>{v}</Tag>
    },
    { title: '必填', dataIndex: 'is_required', width: 60,
      render: (v) => v ? <Tag color="red">是</Tag> : '否'
    }
  ];

  const qualColumns = [
    { title: '资质名称', dataIndex: 'name' },
    { title: '类型', dataIndex: 'type', width: 100 },
    { title: '匹配度', dataIndex: 'match_score', width: 100,
      render: (v) => <Tag color={v >= 80 ? 'green' : v >= 60 ? 'orange' : 'red'}>{v}%</Tag>
    },
    { title: '状态', dataIndex: 'status', width: 100,
      render: (v) => <Tag color={v === 'matched' ? 'green' : v === 'warning' ? 'orange' : 'red'}>{v}</Tag>
    },
    { title: '备注', dataIndex: 'remark' },
    { title: '有效期至', dataIndex: 'expiry_date', width: 120,
      render: (v) => {
        const isExpired = dayjs(v).isBefore(dayjs());
        return <span style={{ color: isExpired ? '#ff4d4f' : undefined }}>{dayjs(v).format('YYYY-MM-DD')}</span>;
      }
    }
  ];

  const missingColumns = [
    { title: '类型', dataIndex: 'check_type', width: 100 },
    { title: '缺漏项', dataIndex: 'item_name' },
    { title: '严重程度', dataIndex: 'severity', width: 100,
      render: (v) => <Tag color={v === 'error' ? 'red' : 'orange'}>{v}</Tag>
    },
    { title: '建议', dataIndex: 'suggestion' }
  ];

  const nextActions = [];
  if (data.bid?.status === 'draft' && hasPermission('upload')) nextActions.push({ key: 'upload', label: '上传文件', icon: <UploadOutlined />, onClick: () => {} });
  if (data.bid?.status === 'uploaded' && hasPermission('parse')) nextActions.push({ key: 'parse', label: '解析标书', icon: <FileSearchOutlined />, onClick: handleParse });
  if (data.bid?.status === 'parsed' && hasPermission('match')) nextActions.push({ key: 'match', label: '资质匹配', icon: <SafetyCertificateOutlined />, onClick: handleMatch });
  if (data.bid?.status === 'matched' && hasPermission('generate')) nextActions.push({ key: 'generate', label: '生成响应', icon: <RobotOutlined />, onClick: handleGenerate });
  if (data.bid?.status === 'generated' && hasPermission('export')) nextActions.push({ key: 'export', label: '导出标书', icon: <ExportOutlined />, onClick: handleExport });

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/bids')}>返回</Button>
          <h1 className="page-title">{data.bid?.project_name || '标书详情'}</h1>
          <Tag color={statusMap[data.bid?.status]?.color || 'default'}>
            {statusMap[data.bid?.status]?.text || data.bid?.status}
          </Tag>
        </Space>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
          {nextActions.length > 0 && (
            <Space.Compact>
              {nextActions.map(action => (
                <Tooltip key={action.key} title={`当前状态: ${statusMap[data.bid?.status]?.text}`}>
                  <Button 
                    type="primary" 
                    icon={action.icon}
                    loading={actionLoading === action.key}
                    onClick={action.onClick}
                  >
                    {action.label}
                  </Button>
                </Tooltip>
              ))}
            </Space.Compact>
          )}
          {currentUser?.role_name === 'business_owner' && (
            <Space.Compact style={{ marginLeft: 8 }}>
              <Popconfirm
                title="模拟异常场景"
                description="选择要模拟的异常场景"
                onConfirm={() => handleParse('pdf_parse_failure')}
                okText="确认"
                cancelText="取消"
              >
                <Button size="small" danger>模拟解析失败</Button>
              </Popconfirm>
              <Popconfirm
                title="模拟异常场景"
                description="选择要模拟的异常场景"
                onConfirm={() => handleMatch('version_conflict')}
                okText="确认"
                cancelText="取消"
              >
                <Button size="small" danger>模拟版本冲突</Button>
              </Popconfirm>
              <Popconfirm
                title="模拟异常场景"
                description="选择要模拟的异常场景"
                onConfirm={() => handleGenerate('missing_answers')}
                okText="确认"
                cancelText="取消"
              >
                <Button size="small" danger>模拟漏答</Button>
              </Popconfirm>
            </Space.Compact>
          )}
        </Space>
      </div>

      {data.bid?.status === 'draft' && (
        <Alert
          message="请上传招标文件"
          description="上传 PDF 或 Word 格式的招标文件，系统将自动解析评分项和资质要求"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          action={hasPermission('upload') ? (
            <Upload customRequest={handleUpload} showUploadList={false}>
              <Button type="primary" icon={<UploadOutlined />} loading={actionLoading === 'upload'}>
                上传文件
              </Button>
            </Upload>
          ) : null}
        />
      )}

      {data.missingChecks?.filter(m => m.is_missing).length > 0 && (
        <Alert
          message={`检测到 ${data.missingChecks.filter(m => m.is_missing).length} 项缺漏`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="评分项" value={data.items?.length || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="已匹配资质" value={data.qualifications?.filter(q => q.status === 'matched').length || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="响应数量" value={data.responses?.length || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="待补材料" 
              value={data.missingChecks?.filter(m => m.is_missing).length || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="detail-card" loading={loading}>
        <div className="detail-section-title">基本信息</div>
        <Descriptions column={3} size="small">
          <Descriptions.Item label="标书编号">{data.bid?.bid_no}</Descriptions.Item>
          <Descriptions.Item label="采购人">{data.bid?.purchaser || '-'}</Descriptions.Item>
          <Descriptions.Item label="预算金额">{data.bid?.budget_amount ? `¥${data.bid.budget_amount}` : '-'}</Descriptions.Item>
          <Descriptions.Item label="创建人">{data.bid?.creator_name}</Descriptions.Item>
          <Descriptions.Item label="负责人">{data.bid?.owner_name}</Descriptions.Item>
          <Descriptions.Item label="规则版本">{data.bid?.rule_version || '-'}</Descriptions.Item>
          <Descriptions.Item label="当前节点">{data.bid?.current_node || '-'}</Descriptions.Item>
          <Descriptions.Item label="上一节点">{data.bid?.previous_node || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{dayjs(data.bid?.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Tabs
        items={[
          {
            key: 'items',
            label: `评分项 (${data.items?.length || 0})`,
            children: (
              <Card className="detail-card">
                <Table
                  size="small"
                  columns={itemColumns}
                  dataSource={data.items}
                  rowKey="id"
                  pagination={false}
                />
              </Card>
            )
          },
          {
            key: 'qualifications',
            label: `资质匹配 (${data.qualifications?.length || 0})`,
            children: (
              <Card className="detail-card">
                <Table
                  size="small"
                  columns={qualColumns}
                  dataSource={data.qualifications}
                  rowKey="id"
                  pagination={false}
                />
              </Card>
            )
          },
          {
            key: 'responses',
            label: `响应清单 (${data.responses?.length || 0})`,
            children: (
              <Card className="detail-card">
                {data.responses?.length > 0 ? data.responses.map(r => (
                  <Card key={r.id} size="small" style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <strong>{data.items?.find(i => i.id === r.bid_item_id)?.item_content || `评分项 #${r.bid_item_id}`}</strong>
                      <Tag color={r.status === 'draft' ? 'default' : r.status === 'approved' ? 'green' : 'orange'}>
                        {r.status}
                      </Tag>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#666' }}>{r.content}</div>
                    {r.review_comment && (
                      <div style={{ marginTop: 8, padding: 8, background: '#f6ffed', borderRadius: 4 }}>
                        <strong>审核意见 ({r.reviewer_name}):</strong> {r.review_comment}
                      </div>
                    )}
                  </Card>
                )) : <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无响应内容</div>}
              </Card>
            )
          },
          {
            key: 'missing',
            label: `缺漏检查 (${data.missingChecks?.filter(m => m.is_missing).length || 0})`,
            children: (
              <Card className="detail-card">
                <Table
                  size="small"
                  columns={missingColumns}
                  dataSource={data.missingChecks}
                  rowKey="id"
                  pagination={false}
                />
              </Card>
            )
          },
          {
            key: 'history',
            label: '状态变更',
            children: (
              <Card className="detail-card">
                <Timeline>
                  {data.statusHistory?.map(h => (
                    <Timeline.Item key={h.id}>
                      <div className="timeline-item">
                        <div><strong>{h.transition_reason}</strong></div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {statusMap[h.from_status]?.text || h.from_status} → {statusMap[h.to_status]?.text || h.to_status}
                        </div>
                        <div style={{ fontSize: 12, color: '#999' }}>
                          {h.operator_name} · {dayjs(h.created_at).format('YYYY-MM-DD HH:mm')}
                        </div>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Card>
            )
          }
        ]}
      />
    </div>
  );
}

export default BidDetail;
