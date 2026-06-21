import { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  DatePicker,
  Select,
  Input,
  Row,
  Col,
  Tooltip,
  Modal,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  DownloadOutlined,
  SafetyOutlined,
  SafetyCertificateOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { formatDateTime } from '@/utils/format';
import dayjs from 'dayjs';

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface AuditLogRow {
  id: string;
  timestamp: string;
  operator: string;
  operatorRole: string;
  actionType: string;
  module: string;
  riskLevel: RiskLevel;
  ipAddress: string;
  secondVerification: boolean;
  userAgent?: string;
  requestId?: string;
  details?: string;
}

const { RangePicker } = DatePicker;

const riskLevelConfig: Record<RiskLevel, { color: string; text: string; icon: any; badge: string }> = {
  LOW: { color: 'success', text: '低风险', icon: CheckCircleOutlined, badge: '#059669' },
  MEDIUM: { color: 'warning', text: '中风险', icon: InfoCircleOutlined, badge: '#D97706' },
  HIGH: { color: 'orange', text: '高风险', icon: WarningOutlined, badge: '#EA580C' },
  CRITICAL: { color: 'error', text: '严重', icon: ExclamationCircleOutlined, badge: '#DC2626' },
};

const modules = ['用户认证', '社保办理', '薪资管理', '财务管理', '政策管理', '系统配置', '数据导出', '权限管理'];
const actionTypes = ['登录', '登出', '查询', '新增', '修改', '删除', '审批', '导出', '批量操作', '配置修改'];
const roles = ['超级管理员', '运营管理员', '财务人员', '客服坐席', '审核专员'];
const operators = ['张伟', '李娜', '王强', '赵敏', '陈刚', '刘洋', '孙丽'];

const mockAuditLogs: AuditLogRow[] = Array.from({ length: 28 }, (_, i) => {
  const levels: RiskLevel[] = ['LOW', 'LOW', 'MEDIUM', 'MEDIUM', 'HIGH', 'CRITICAL', 'LOW', 'MEDIUM'];
  const riskLevel = levels[i % levels.length];
  const moduleIdx = i % modules.length;
  const actionIdx = i % actionTypes.length;
  const roleIdx = i % roles.length;
  const opIdx = i % operators.length;

  return {
    id: `AUD${String(i + 1).padStart(6, '0')}`,
    timestamp: dayjs().subtract(i * 37, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    operator: operators[opIdx],
    operatorRole: roles[roleIdx],
    actionType: actionTypes[actionIdx],
    module: modules[moduleIdx],
    riskLevel,
    ipAddress: `10.${(i + 1) % 255}.${(i * 7) % 255}.${(i * 13) % 255}`,
    secondVerification: riskLevel === 'HIGH' || riskLevel === 'CRITICAL' || i % 3 === 0,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    requestId: `req_${Date.now() - i * 60000}_${Math.random().toString(36).substr(2, 9)}`,
    details: riskLevel === 'CRITICAL'
      ? '连续 5 次尝试访问受限接口 /api/admin/system/backup，触发风控规则'
      : riskLevel === 'HIGH'
        ? '修改了系统关键配置：社保缴费计算规则'
        : riskLevel === 'MEDIUM'
          ? '批量导出了 500 条员工薪资数据'
          : `执行了${actionTypes[actionIdx]}操作`,
  };
});

function AdminAudit() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [filterModule, setFilterModule] = useState<string | undefined>();
  const [filterRisk, setFilterRisk] = useState<RiskLevel | undefined>();
  const [filterOperator, setFilterOperator] = useState<string | undefined>();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState<AuditLogRow | null>(null);
  const [keyword, setKeyword] = useState('');

  const filteredData = useMemo(() => {
    return mockAuditLogs.filter(log => {
      if (filterModule && log.module !== filterModule) return false;
      if (filterRisk && log.riskLevel !== filterRisk) return false;
      if (filterOperator && log.operator !== filterOperator) return false;
      if (keyword && !(
        log.operator.includes(keyword) ||
        log.actionType.includes(keyword) ||
        log.module.includes(keyword) ||
        log.ipAddress.includes(keyword)
      )) return false;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const t = dayjs(log.timestamp);
        if (t.isBefore(dateRange[0]) || t.isAfter(dateRange[1].endOf('day'))) return false;
      }
      return true;
    });
  }, [dateRange, filterModule, filterRisk, filterOperator, keyword]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    const critical = filteredData.filter(l => l.riskLevel === 'CRITICAL').length;
    const high = filteredData.filter(l => l.riskLevel === 'HIGH').length;
    const medium = filteredData.filter(l => l.riskLevel === 'MEDIUM').length;
    const noVerify = filteredData.filter(l => !l.secondVerification && (l.riskLevel === 'HIGH' || l.riskLevel === 'CRITICAL')).length;
    return { total, critical, high, medium, noVerify };
  }, [filteredData]);

  const handleViewDetail = (record: AuditLogRow) => {
    setCurrentLog(record);
    setDetailModalVisible(true);
  };

  const handleReset = () => {
    setDateRange(null);
    setFilterModule(undefined);
    setFilterRisk(undefined);
    setFilterOperator(undefined);
    setKeyword('');
  };

  const columns: ColumnsType<AuditLogRow> = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 170,
      fixed: 'left',
      render: (v) => formatDateTime(v),
      sorter: (a, b) => dayjs(a.timestamp).valueOf() - dayjs(b.timestamp).valueOf(),
      defaultSortOrder: 'descend',
    },
    { title: '操作人', dataIndex: 'operator', key: 'operator', width: 100 },
    {
      title: '角色',
      dataIndex: 'operatorRole',
      key: 'operatorRole',
      width: 110,
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    { title: '操作类型', dataIndex: 'actionType', key: 'actionType', width: 100 },
    { title: '模块', dataIndex: 'module', key: 'module', width: 110 },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 110,
      align: 'center',
      render: (level: RiskLevel) => {
        const cfg = riskLevelConfig[level];
        const RiskIcon = cfg.icon;
        return (
          <Tag color={cfg.color} icon={<RiskIcon />} style={{ margin: 0 }}>
            {cfg.text}
          </Tag>
        );
      },
      filters: [
        { text: '低风险', value: 'LOW' },
        { text: '中风险', value: 'MEDIUM' },
        { text: '高风险', value: 'HIGH' },
        { text: '严重', value: 'CRITICAL' },
      ],
      onFilter: (value, record) => record.riskLevel === value,
    },
    { title: 'IP 地址', dataIndex: 'ipAddress', key: 'ipAddress', width: 140 },
    {
      title: '二次验签',
      dataIndex: 'secondVerification',
      key: 'secondVerification',
      width: 100,
      align: 'center',
      render: (v: boolean) => v
        ? <Tooltip title="已通过短信/人脸二次验证">
            <Tag color="success" icon={<SafetyCertificateOutlined />}>已验证</Tag>
          </Tooltip>
        : <Tooltip title="未执行二次验证">
            <Tag color="default" icon={<SafetyOutlined />}>未验证</Tag>
          </Tooltip>,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">审计日志</h2>
          <p className="text-gray-500 mt-1">系统所有操作行为的完整审计追踪记录</p>
        </div>
        <Space>
          <Button icon={<DownloadOutlined />}>导出日志</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="!border-[#E2E8F0]">
            <p className="text-sm text-gray-500 mb-1">日志总数</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="!border-[#E2E8F0]">
            <p className="text-sm text-gray-500 mb-1">严重风险</p>
            <p className="text-2xl font-bold text-[#DC2626]">
              {stats.critical}
              <span className="text-sm font-normal text-gray-400 ml-1">条</span>
            </p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="!border-[#E2E8F0]">
            <p className="text-sm text-gray-500 mb-1">高风险</p>
            <p className="text-2xl font-bold text-[#EA580C]">
              {stats.high}
              <span className="text-sm font-normal text-gray-400 ml-1">条</span>
            </p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="!border-[#E2E8F0]">
            <p className="text-sm text-gray-500 mb-1">高风险未二次验签</p>
            <p className="text-2xl font-bold text-[#D97706]">
              {stats.noVerify}
              <span className="text-sm font-normal text-gray-400 ml-1">条</span>
            </p>
          </Card>
        </Col>
      </Row>

      <Card className="!border-[#E2E8F0]">
        <div className="mb-4 p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
          <Row gutter={[12, 12]} align="bottom">
            <Col xs={24} sm={12} md={6}>
              <label className="block text-sm text-gray-600 mb-1">时间范围</label>
              <RangePicker
                style={{ width: '100%' }}
                value={dateRange as any}
                onChange={(v) => setDateRange(v as any)}
              />
            </Col>
            <Col xs={24} sm={12} md={5}>
              <label className="block text-sm text-gray-600 mb-1">模块</label>
              <Select
                style={{ width: '100%' }}
                placeholder="全部模块"
                allowClear
                value={filterModule}
                onChange={setFilterModule}
                options={modules.map(m => ({ label: m, value: m }))}
              />
            </Col>
            <Col xs={24} sm={12} md={5}>
              <label className="block text-sm text-gray-600 mb-1">风险等级</label>
              <Select
                style={{ width: '100%' }}
                placeholder="全部等级"
                allowClear
                value={filterRisk}
                onChange={setFilterRisk}
                options={Object.entries(riskLevelConfig).map(([k, v]) => ({
                  label: v.text,
                  value: k,
                }))}
              />
            </Col>
            <Col xs={24} sm={12} md={5}>
              <label className="block text-sm text-gray-600 mb-1">操作人</label>
              <Select
                style={{ width: '100%' }}
                placeholder="全部操作人"
                allowClear
                showSearch
                value={filterOperator}
                onChange={setFilterOperator}
                options={operators.map(o => ({ label: o, value: o }))}
              />
            </Col>
            <Col xs={24} sm={24} md={3}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={() => {}}>
                  查询
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col xs={24}>
              <Input
                placeholder="搜索操作人 / 操作类型 / 模块 / IP 地址"
                prefix={<SearchOutlined className="text-gray-400" />}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                allowClear
                style={{ maxWidth: 480 }}
              />
            </Col>
          </Row>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <Tag color="success">低风险 {filteredData.filter(l => l.riskLevel === 'LOW').length}</Tag>
          <Tag color="warning">中风险 {filteredData.filter(l => l.riskLevel === 'MEDIUM').length}</Tag>
          <Tag color="orange">高风险 {filteredData.filter(l => l.riskLevel === 'HIGH').length}</Tag>
          <Tag color="error">严重 {filteredData.filter(l => l.riskLevel === 'CRITICAL').length}</Tag>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          scroll={{ x: 1100 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条日志`,
          }}
        />
      </Card>

      <Modal
        title="审计日志详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
        ]}
        width={640}
      >
        {currentLog && (
          <div className="space-y-4">
            <div
              className="p-4 rounded-lg flex items-center justify-between"
              style={{
                background: `${riskLevelConfig[currentLog.riskLevel].badge}10`,
                borderLeft: `4px solid ${riskLevelConfig[currentLog.riskLevel].badge}`,
              }}
            >
              <div>
                <p className="text-sm text-gray-500 mb-1">操作摘要</p>
                <p className="text-base font-medium text-gray-900">
                  [{currentLog.module}] {currentLog.operator} 执行 {currentLog.actionType} 操作
                </p>
              </div>
              {(() => {
                const cfg = riskLevelConfig[currentLog.riskLevel];
                const Icon = cfg.icon;
                return (
                  <Tag color={cfg.color} icon={<Icon />} style={{ margin: 0, padding: '4px 12px', fontSize: 14 }}>
                    {cfg.text}
                  </Tag>
                );
              })()}
            </div>

            <Row gutter={[16, 12]}>
              <Col span={12}>
                <p className="text-sm text-gray-500">日志编号</p>
                <p className="text-sm font-mono">{currentLog.id}</p>
              </Col>
              <Col span={12}>
                <p className="text-sm text-gray-500">请求 ID</p>
                <p className="text-sm font-mono">{currentLog.requestId}</p>
              </Col>
              <Col span={12}>
                <p className="text-sm text-gray-500">操作时间</p>
                <p className="text-sm">{formatDateTime(currentLog.timestamp)}</p>
              </Col>
              <Col span={12}>
                <p className="text-sm text-gray-500">IP 地址</p>
                <p className="text-sm font-mono">{currentLog.ipAddress}</p>
              </Col>
              <Col span={12}>
                <p className="text-sm text-gray-500">操作人</p>
                <p className="text-sm">{currentLog.operator} <Tag color="blue" style={{ marginLeft: 4 }}>{currentLog.operatorRole}</Tag></p>
              </Col>
              <Col span={12}>
                <p className="text-sm text-gray-500">二次验签</p>
                <p className="text-sm">
                  {currentLog.secondVerification
                    ? <Tag color="success" icon={<SafetyCertificateOutlined />}>已验证</Tag>
                    : <Tag color="default" icon={<SafetyOutlined />}>未验证</Tag>}
                </p>
              </Col>
              <Col span={24}>
                <p className="text-sm text-gray-500">User-Agent</p>
                <p className="text-sm font-mono text-gray-600">{currentLog.userAgent}</p>
              </Col>
              <Col span={24}>
                <p className="text-sm text-gray-500 mb-1">操作详情</p>
                <div className="p-3 bg-gray-50 rounded text-sm text-gray-700 leading-relaxed">
                  {currentLog.details}
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AdminAudit;
