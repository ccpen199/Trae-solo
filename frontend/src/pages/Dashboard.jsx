import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, List, Tag, Table, Spin, message, Descriptions } from 'antd';
import {
  WalletOutlined, FileTextOutlined, SafetyCertificateOutlined,
  TeamOutlined, BankOutlined, CheckCircleOutlined,
  RiseOutlined, ThunderboltOutlined,
  DashboardOutlined, BuildOutlined, ProjectOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import ReactECharts from 'echarts-for-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [successTrend, setSuccessTrend] = useState([]);
  const [centerHeatmap, setCenterHeatmap] = useState([]);
  const [overdueList, setOverdueList] = useState([]);
  const [riskAlerts, setRiskAlerts] = useState([]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const role = user?.role;
      if (role === 'personal') {
        const [accountRes, appsRes] = await Promise.all([
          api.get('/account/balance'),
          api.get('/withdrawal/my-applications?pageSize=5')
        ]);
        setData(accountRes.data);
        setApplications(appsRes.data?.list || appsRes.data || []);
      } else if (role === 'unit_admin') {
        const res = await api.get('/unit/dashboard');
        setData(res.data);
      } else if (role === 'developer') {
        const res = await api.get('/developer/dashboard');
        setData(res.data);
      } else if (role === 'supervisor' || role === 'super_admin') {
        const [dashRes, trendRes, heatmapRes, overdueRes, riskRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/stats/success-trend?days=30'),
          api.get('/admin/stats/center-heatmap'),
          api.get('/admin/stats/overdue-monitor'),
          api.get('/admin/risk-alerts?status=open')
        ]);
        setData(dashRes.data);
        setSuccessTrend(trendRes.data || []);
        setCenterHeatmap(heatmapRes.data || []);
        setOverdueList(overdueRes.data || []);
        setRiskAlerts(riskRes.data || []);
      }
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const map = {
      pending: { color: 'orange', text: '待审批' },
      approved: { color: 'green', text: '已通过' },
      rejected: { color: 'red', text: '已驳回' },
      normal: { color: 'green', text: '正常' },
      active: { color: 'green', text: '正常' },
      synced: { color: 'green', text: '已同步' },
      conflict: { color: 'red', text: '冲突' }
    };
    const info = map[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  }

  if (user?.role === 'personal') {
    return <PersonalDashboard data={data} applications={applications} getStatusTag={getStatusTag} />;
  }
  if (user?.role === 'unit_admin') {
    return <UnitAdminDashboard data={data} />;
  }
  if (user?.role === 'developer') {
    return <DeveloperDashboard data={data} />;
  }
  if (user?.role === 'supervisor' || user?.role === 'super_admin') {
    return (
      <SupervisorDashboard
        data={data}
        successTrend={successTrend}
        centerHeatmap={centerHeatmap}
        overdueList={overdueList}
        riskAlerts={riskAlerts}
        isSuperAdmin={user?.role === 'super_admin'}
      />
    );
  }

  return (
    <div>
      <h2>欢迎使用全国住房公积金统一服务中台</h2>
      <Card style={{ marginTop: 24 }}><p>请通过左侧菜单选择您需要办理的业务。</p></Card>
    </div>
  );
}

function PersonalDashboard({ data, applications, getStatusTag }) {
  const pendingItems = [
    { id: 1, title: '提取申请待审批', type: '审批' },
    { id: 2, title: '年度对账确认', type: '确认' }
  ];

  return (
    <div>
      <h2>个人中心</h2>
      <Row gutter={16} style={{ marginTop: 20 }}>
        <Col span={6}>
          <Card><Statistic title="账户余额" value={data?.balance || 0} prefix={<WalletOutlined />} suffix="元" precision={2} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="月缴存额" value={data?.monthly_pay || 0} prefix={<BankOutlined />} suffix="元" precision={2} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="缴存基数" value={data?.base_salary || 0} prefix={<FileTextOutlined />} suffix="元" precision={2} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="账户状态" value={data?.status === 'normal' ? '正常' : '异常'} prefix={<SafetyCertificateOutlined />} /></Card>
        </Col>
      </Row>

      <Card title="最近提取申请" style={{ marginTop: 24 }}>
        <List
          dataSource={applications}
          locale={{ emptyText: '暂无提取申请' }}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <List.Item.Meta
                title={item.type}
                description={`申请金额: ¥${item.amount} - 申请时间: ${item.created_at}`}
              />
              {getStatusTag(item.status)}
            </List.Item>
          )}
        />
      </Card>

      <Card title="待办事项" style={{ marginTop: 24 }}>
        <List
          dataSource={pendingItems}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <List.Item.Meta title={item.title} />
              <Tag color="orange">{item.type}</Tag>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

function UnitAdminDashboard({ data }) {
  const paymentColumns = [
    { title: '汇缴月份', dataIndex: 'month', key: 'month' },
    { title: '汇缴人数', dataIndex: 'employee_count', key: 'employee_count' },
    { title: '汇缴金额', dataIndex: 'amount', key: 'amount', render: (v) => `¥${v?.toFixed(2)}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => {
      const map = { paid: { color: 'green', text: '已缴纳' }, pending: { color: 'orange', text: '待缴纳' } };
      const info = map[s] || { color: 'default', text: s };
      return <Tag color={info.color}>{info.text}</Tag>;
    }}
  ];

  return (
    <div>
      <h2>单位管理中心</h2>
      <Row gutter={16} style={{ marginTop: 20 }}>
        <Col span={6}>
          <Card><Statistic title="在缴人数" value={data?.employee_count || 0} prefix={<TeamOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="本月汇缴额" value={data?.monthly_total || 0} prefix={<WalletOutlined />} suffix="元" precision={2} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="待办汇缴" value={data?.pending_payments || 0} prefix={<FileTextOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="单位状态" value={data?.unit_status === 'active' ? '正常' : '异常'} prefix={<SafetyCertificateOutlined />} /></Card>
        </Col>
      </Row>

      <Card title="单位信息" style={{ marginTop: 24 }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="单位名称">{data?.unit_name}</Descriptions.Item>
          <Descriptions.Item label="统一信用代码">{data?.credit_code}</Descriptions.Item>
          <Descriptions.Item label="所属中心">{data?.center_name}</Descriptions.Item>
          <Descriptions.Item label="单位状态">
            <Tag color={data?.unit_status === 'active' ? 'green' : 'red'}>
              {data?.unit_status === 'active' ? '正常' : '异常'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="汇缴记录" style={{ marginTop: 24 }}>
        <Table
          columns={paymentColumns}
          dataSource={data?.recent_payments || []}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: '暂无汇缴记录' }}
        />
      </Card>
    </div>
  );
}

function DeveloperDashboard({ data }) {
  const projectColumns = [
    { title: '项目名称', dataIndex: 'project_name', key: 'project_name' },
    { title: '项目地址', dataIndex: 'project_address', key: 'project_address' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => {
      const map = { on_sale: { color: 'green', text: '在售' }, filed: { color: 'blue', text: '已备案' }, completed: { color: 'default', text: '已完工' } };
      const info = map[s] || { color: 'default', text: s };
      return <Tag color={info.color}>{info.text}</Tag>;
    }}
  ];

  return (
    <div>
      <h2>开发商管理中心</h2>
      <Row gutter={16} style={{ marginTop: 20 }}>
        <Col span={8}>
          <Card><Statistic title="项目总数" value={data?.total_projects || 0} prefix={<ProjectOutlined />} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="在售项目" value={data?.on_sale_projects || 0} prefix={<BuildOutlined />} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="已备案项目" value={data?.filed_projects || 0} prefix={<CheckCircleOutlined />} /></Card>
        </Col>
      </Row>

      <Card title="项目列表" style={{ marginTop: 24 }}>
        <Table
          columns={projectColumns}
          dataSource={data?.projects || []}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: '暂无项目' }}
        />
      </Card>

      <Card title="备案信息" style={{ marginTop: 24 }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="开发商名称">{data?.developer_name}</Descriptions.Item>
          <Descriptions.Item label="统一信用代码">{data?.developer_credit_code}</Descriptions.Item>
          <Descriptions.Item label="联系人">{data?.contact_name}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{data?.contact_phone}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}

function SupervisorDashboard({ data, successTrend, centerHeatmap, overdueList, riskAlerts, isSuperAdmin }) {
  const trendOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: successTrend.map(d => d.date) },
    yAxis: { type: 'value', axisLabel: { formatter: '{value}%' }, min: 80, max: 100 },
    series: [{
      name: '提取成功率',
      type: 'line',
      data: successTrend.map(d => d.rate),
      smooth: true,
      itemStyle: { color: '#1890ff' },
      areaStyle: { color: 'rgba(24,144,255,0.1)' }
    }]
  };

  const heatmapOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: centerHeatmap.map(d => d.center_name) },
    yAxis: { type: 'value' },
    series: [{
      name: '业务量',
      type: 'bar',
      data: centerHeatmap.map(d => d.count),
      itemStyle: { color: '#1890ff' }
    }]
  };

  const overdueColumns = [
    { title: '申请编号', dataIndex: 'application_id', key: 'application_id' },
    { title: '申请人', dataIndex: 'applicant_name', key: 'applicant_name' },
    { title: '业务类型', dataIndex: 'business_type', key: 'business_type' },
    { title: '超时时长', dataIndex: 'hours_pending', key: 'hours_pending', render: (v) => <Tag color="red">{v}小时</Tag> },
    { title: '升级状态', dataIndex: 'escalation', key: 'escalation', render: (v) => {
      const map = { escalated: { color: 'red', text: '已升级' }, pending: { color: 'orange', text: '待处理' } };
      const info = map[v] || { color: 'default', text: v };
      return <Tag color={info.color}>{info.text}</Tag>;
    }}
  ];

  const riskColumns = [
    { title: '预警类型', dataIndex: 'alert_type', key: 'alert_type' },
    { title: '预警等级', dataIndex: 'level', key: 'level', render: (v) => {
      const map = { high: { color: 'red', text: '高' }, medium: { color: 'orange', text: '中' }, low: { color: 'blue', text: '低' } };
      const info = map[v] || { color: 'default', text: v };
      return <Tag color={info.color}>{info.text}</Tag>;
    }},
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '数量', dataIndex: 'count', key: 'count' }
  ];

  return (
    <div>
      <h2>{isSuperAdmin ? '超级管理员' : '监管'}数据中心</h2>

      <Row gutter={16} style={{ marginTop: 20 }}>
        <Col span={isSuperAdmin ? 4 : 5}>
          <Card><Statistic title="缴存用户数" value={data?.total_users || 0} prefix={<TeamOutlined />} /></Card>
        </Col>
        <Col span={isSuperAdmin ? 4 : 5}>
          <Card><Statistic title="资金总余额" value={data?.total_balance || 0} prefix={<WalletOutlined />} suffix="元" precision={2} /></Card>
        </Col>
        <Col span={isSuperAdmin ? 4 : 5}>
          <Card><Statistic title="待审批申请" value={data?.pending_approvals || 0} prefix={<FileTextOutlined />} /></Card>
        </Col>
        <Col span={isSuperAdmin ? 4 : 5}>
          <Card><Statistic title="今日提取笔数" value={data?.today_withdrawals || 0} prefix={<ThunderboltOutlined />} /></Card>
        </Col>
        <Col span={isSuperAdmin ? 4 : 4}>
          <Card><Statistic title="提取成功率" value={data?.success_rate || 0} prefix={<RiseOutlined />} suffix="%" precision={1} /></Card>
        </Col>
        {isSuperAdmin && (
          <Col span={4}>
            <Card><Statistic title="管理中心数" value={data?.center_count || 0} prefix={<DashboardOutlined />} /></Card>
          </Col>
        )}
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="提取成功率趋势（近30天）">
            <ReactECharts option={trendOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="业务量热力图（按中心）">
            <ReactECharts option={heatmapOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card title="逾期未办结督办" style={{ marginTop: 24 }}>
        <Table
          columns={overdueColumns}
          dataSource={overdueList}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: '暂无逾期任务' }}
        />
      </Card>

      <Card title="风险预警汇总" style={{ marginTop: 24 }}>
        <Table
          columns={riskColumns}
          dataSource={riskAlerts}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: '暂无风险预警' }}
        />
      </Card>

      {isSuperAdmin && data?.centers && (
        <Card title="中心管理概览" style={{ marginTop: 24 }}>
          <Table
            columns={[
              { title: '中心名称', dataIndex: 'name', key: 'name' },
              { title: '状态', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? '正常' : '停用'}</Tag> },
              { title: '用户数', dataIndex: 'user_count', key: 'user_count' },
              { title: '资金余额', dataIndex: 'balance', key: 'balance', render: (v) => `¥${v?.toFixed(2)}` }
            ]}
            dataSource={data.centers}
            rowKey="id"
            pagination={{ pageSize: 5 }}
          />
        </Card>
      )}
    </div>
  );
}
