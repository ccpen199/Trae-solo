import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Select, Button, Spin, message, Row, Col, Tag, Descriptions, 
  List, Alert, Statistic, Divider, Empty, Result, Dropdown, Menu, MenuProps
} from 'antd';
import { 
  ArrowLeftOutlined, FileTextOutlined, DownloadOutlined,
  CheckCircleOutlined, WarningOutlined, CloseCircleOutlined,
  DownOutlined, FilePdfOutlined, FileTextOutlined as FileTextIcon,
  FileOutlined, CodeOutlined
} from '@ant-design/icons';
import { HealthReport, Patient } from '../types';
import { reportApi, patientApi } from '../services/api';

const { Option } = Select;

const ReportView: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>(patientId || '');
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [report, setReport] = useState<HealthReport | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      generateReport();
    }
  }, [selectedPatient, reportType]);

  const fetchPatients = async () => {
    try {
      const data = await patientApi.getAll();
      setPatients(data);
      if (!selectedPatient && data.length > 0) {
        setSelectedPatient(data[0].id);
      }
    } catch (error) {
      message.error('获取患者列表失败');
    }
  };

  const generateReport = async () => {
    if (!selectedPatient) return;
    
    setGenerating(true);
    try {
      const data = reportType === 'weekly' 
        ? await reportApi.generateWeekly(selectedPatient)
        : await reportApi.generateMonthly(selectedPatient);
      setReport(data);
    } catch (error) {
      message.error('生成报告失败');
    } finally {
      setGenerating(false);
    }
  };

  const getCurrentPatientName = (): string => {
    const patient = patients.find(p => p.id === selectedPatient);
    return patient?.name || '患者';
  };

  const generateTXTContent = (): string => {
    if (!report) return '';
    
    const patientName = getCurrentPatientName();
    let content = '';
    
    content += '========================================\n';
    content += `          ${report.title}\n`;
    content += '========================================\n\n';
    
    content += `报告类型：${report.type === 'weekly' ? '周健康报告' : '月健康报告'}\n`;
    content += `患者姓名：${patientName}\n`;
    content += `生成时间：${new Date(report.generatedAt).toLocaleString()}\n`;
    content += `报告周期：${report.periodStart} 至 ${report.periodEnd}\n\n`;
    
    content += '----------------------------------------\n';
    content += '一、报告摘要\n';
    content += '----------------------------------------\n';
    content += `${report.summary}\n\n`;
    
    content += '----------------------------------------\n';
    content += '二、健康指标分析\n';
    content += '----------------------------------------\n';
    report.metricsAnalysis.forEach((metric, index) => {
      content += `\n【${index + 1}. ${metric.category}】\n`;
      content += `  状态：${metric.status === 'normal' ? '正常' : metric.status === 'warning' ? '预警' : '异常'}\n`;
      content += `  趋势：${metric.trend === 'improving' ? '改善' : metric.trend === 'worsening' ? '恶化' : '稳定'}\n`;
      content += `  ${metric.description}\n`;
    });
    content += '\n';
    
    content += '----------------------------------------\n';
    content += '三、风险评估\n';
    content += '----------------------------------------\n';
    content += `\n整体风险等级：${report.riskAssessment.overallLevel === 'low' ? '低风险' : report.riskAssessment.overallLevel === 'medium' ? '中风险' : '高风险'}\n`;
    
    if (report.riskAssessment.riskFactors.length > 0) {
      content += `\n风险因素详情：\n`;
      report.riskAssessment.riskFactors.forEach((factor, index) => {
        content += `\n【${index + 1}. ${factor.category}】\n`;
        content += `  风险等级：${factor.level === 'low' ? '低' : factor.level === 'medium' ? '中' : '高'}\n`;
        content += `  描述：${factor.description}\n`;
        content += `  建议：${factor.suggestion}\n`;
      });
    }
    
    if (report.riskAssessment.immediateActions.length > 0) {
      content += `\n立即处理措施：\n`;
      report.riskAssessment.immediateActions.forEach((action, index) => {
        content += `  ${index + 1}. ${action}\n`;
      });
    }
    content += '\n';
    
    content += '----------------------------------------\n';
    content += '四、康复建议\n';
    content += '----------------------------------------\n';
    report.recommendations.forEach((rec, index) => {
      content += `\n建议 ${index + 1}：${rec}\n`;
    });
    
    content += '\n';
    content += '========================================\n';
    content += '        报告结束\n';
    content += '========================================\n';
    
    return content;
  };

  const generateHTMLContent = (): string => {
    if (!report) return '';
    
    const patientName = getCurrentPatientName();
    const generatedAt = new Date(report.generatedAt).toLocaleString();
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.8;
      color: #333;
      background: #fff;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
    }
    .report-header {
      text-align: center;
      padding: 20px 0 30px;
      border-bottom: 3px solid #1890ff;
      margin-bottom: 30px;
    }
    .report-title {
      font-size: 28px;
      font-weight: bold;
      color: #1890ff;
      margin-bottom: 10px;
    }
    .report-meta {
      color: #666;
      font-size: 14px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #1890ff;
      padding-bottom: 10px;
      border-bottom: 2px solid #e8e8e8;
      margin-bottom: 20px;
    }
    .summary-box {
      background: #e6f7ff;
      border-left: 4px solid #1890ff;
      padding: 15px 20px;
      border-radius: 4px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
    .metric-card {
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .metric-card.normal { border-left: 4px solid #52c41a; }
    .metric-card.warning { border-left: 4px solid #faad14; }
    .metric-card.critical { border-left: 4px solid #ff4d4f; }
    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .metric-name { font-weight: bold; font-size: 16px; }
    .metric-status {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    .metric-status.normal { background: #f6ffed; color: #52c41a; }
    .metric-status.warning { background: #fffbe6; color: #faad14; }
    .metric-status.critical { background: #fff2f0; color: #ff4d4f; }
    .metric-value { font-size: 18px; color: #333; }
    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 20px;
    }
    .stat-card {
      text-align: center;
      padding: 20px;
      background: #fafafa;
      border-radius: 8px;
    }
    .stat-title {
      color: #666;
      font-size: 14px;
      margin-bottom: 8px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
    }
    .stat-value.low { color: #52c41a; }
    .stat-value.medium { color: #faad14; }
    .stat-value.high { color: #ff4d4f; }
    .risk-list {
      list-style: none;
    }
    .risk-item {
      padding: 15px;
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    .risk-level {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-right: 10px;
    }
    .risk-level.low { background: #f6ffed; color: #52c41a; }
    .risk-level.medium { background: #fffbe6; color: #faad14; }
    .risk-level.high { background: #fff2f0; color: #ff4d4f; }
    .risk-category { font-weight: bold; }
    .risk-desc { color: #666; margin: 5px 0; }
    .risk-suggestion { color: #1890ff; font-size: 14px; }
    .immediate-actions {
      background: #fffbe6;
      border: 1px solid #faad14;
      border-radius: 8px;
      padding: 15px 20px;
    }
    .immediate-actions h4 { color: #faad14; margin-bottom: 10px; }
    .recommendation-list {
      list-style: none;
    }
    .recommendation-item {
      padding: 12px 15px;
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      margin-bottom: 10px;
      display: flex;
      align-items: flex-start;
    }
    .rec-tag {
      background: #1890ff;
      color: #fff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-right: 12px;
      flex-shrink: 0;
    }
    .report-footer {
      text-align: center;
      padding-top: 30px;
      border-top: 2px solid #e8e8e8;
      margin-top: 40px;
      color: #999;
      font-size: 14px;
    }
    @media print {
      body { padding: 20px; }
      .metric-card { break-inside: avoid; }
      .section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="report-header">
    <div class="report-title">${report.title}</div>
    <div class="report-meta">
      患者：${patientName} | 
      报告类型：${report.type === 'weekly' ? '周健康报告' : '月健康报告'} | 
      生成时间：${generatedAt}
    </div>
    <div class="report-meta">
      报告周期：${report.periodStart} 至 ${report.periodEnd}
    </div>
  </div>

  <div class="section">
    <div class="section-title">一、报告摘要</div>
    <div class="summary-box">
      ${report.summary}
    </div>
  </div>

  <div class="section">
    <div class="section-title">二、健康指标分析</div>
    <div class="metrics-grid">
      ${report.metricsAnalysis.map(metric => `
        <div class="metric-card ${metric.status}">
          <div class="metric-header">
            <span class="metric-name">${metric.category}</span>
            <span class="metric-status ${metric.status}">
              ${metric.status === 'normal' ? '正常' : metric.status === 'warning' ? '预警' : '异常'}
            </span>
          </div>
          <div class="metric-value">${metric.description}</div>
          <div style="margin-top:8px;color:#666;font-size:12px;">
            趋势：${metric.trend === 'improving' ? '改善' : metric.trend === 'worsening' ? '恶化' : '稳定'}
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="section">
    <div class="section-title">三、风险评估</div>
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-title">整体风险等级</div>
        <div class="stat-value ${report.riskAssessment.overallLevel}">
          ${report.riskAssessment.overallLevel === 'low' ? '低风险' : report.riskAssessment.overallLevel === 'medium' ? '中风险' : '高风险'}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-title">风险因素数</div>
        <div class="stat-value" style="color:${report.riskAssessment.riskFactors.length > 0 ? '#faad14' : '#52c41a'}">
          ${report.riskAssessment.riskFactors.length}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-title">建议项数</div>
        <div class="stat-value" style="color:#1890ff">${report.recommendations.length}</div>
      </div>
    </div>
    
    ${report.riskAssessment.riskFactors.length > 0 ? `
      <h4 style="margin-bottom:15px;">风险因素详情：</h4>
      <ul class="risk-list">
        ${report.riskAssessment.riskFactors.map(factor => `
          <li class="risk-item">
            <div>
              <span class="risk-level ${factor.level}">
                ${factor.level === 'low' ? '低' : factor.level === 'medium' ? '中' : '高'}风险
              </span>
              <span class="risk-category">${factor.category}</span>
            </div>
            <div class="risk-desc">${factor.description}</div>
            <div class="risk-suggestion">建议：${factor.suggestion}</div>
          </li>
        `).join('')}
      </ul>
    ` : ''}
    
    ${report.riskAssessment.immediateActions.length > 0 ? `
      <div class="immediate-actions" style="margin-top:20px;">
        <h4>立即处理措施：</h4>
        <ul style="margin:0;padding-left:20px;">
          ${report.riskAssessment.immediateActions.map(action => `<li>${action}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
  </div>

  <div class="section">
    <div class="section-title">四、康复建议</div>
    <ul class="recommendation-list">
      ${report.recommendations.map((rec, index) => `
        <li class="recommendation-item">
          <span class="rec-tag">建议 ${index + 1}</span>
          <span>${rec}</span>
        </li>
      `).join('')}
    </ul>
  </div>

  <div class="report-footer">
    本报告由系统自动生成，仅供参考。如有疑问，请咨询专业医生。
  </div>
</body>
</html>`;
  };

  const exportAsTXT = () => {
    if (!report) return;
    
    setExporting(true);
    try {
      const content = generateTXTContent();
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.title}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      message.success('TXT 报告导出成功');
    } catch (error) {
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  const exportAsHTML = () => {
    if (!report) return;
    
    setExporting(true);
    try {
      const content = generateHTMLContent();
      const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.title}_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      message.success('HTML 报告导出成功');
    } catch (error) {
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  const exportAsJSON = () => {
    if (!report) return;
    
    setExporting(true);
    try {
      const content = JSON.stringify(report, null, 2);
      const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.title}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      message.success('JSON 报告导出成功');
    } catch (error) {
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  const exportAsPDF = () => {
    if (!report) return;
    
    setExporting(true);
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(generateHTMLContent());
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
        message.success('请在新窗口中选择 "保存为 PDF"');
      } else {
        message.warning('请允许浏览器打开新窗口');
      }
    } catch (error) {
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'pdf':
        exportAsPDF();
        break;
      case 'txt':
        exportAsTXT();
        break;
      case 'html':
        exportAsHTML();
        break;
      case 'json':
        exportAsJSON();
        break;
    }
  };

  const exportMenu: MenuProps = {
    onClick: handleMenuClick,
    items: [
      {
        key: 'pdf',
        label: (
          <span>
            <FilePdfOutlined style={{ marginRight: 8 }} />
            导出为 PDF
          </span>
        ),
      },
      {
        key: 'html',
        label: (
          <span>
            <FileOutlined style={{ marginRight: 8 }} />
            导出为 HTML
          </span>
        ),
      },
      {
        key: 'txt',
        label: (
          <span>
            <FileTextIcon style={{ marginRight: 8 }} />
            导出为 TXT
          </span>
        ),
      },
      {
        key: 'json',
        label: (
          <span>
            <CodeOutlined style={{ marginRight: 8 }} />
            导出为 JSON
          </span>
        ),
      },
    ],
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return '#52c41a';
      case 'warning': return '#faad14';
      case 'critical': return '#ff4d4f';
      default: return '#52c41a';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'normal': return '正常';
      case 'warning': return '预警';
      case 'critical': return '异常';
      default: return '正常';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'worsening': return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default: return <CheckCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return '#ff4d4f';
      case 'medium': return '#faad14';
      case 'low': return '#52c41a';
      default: return '#52c41a';
    }
  };

  const getRiskLevelText = (level: string) => {
    switch (level) {
      case 'high': return '高风险';
      case 'medium': return '中风险';
      case 'low': return '低风险';
      default: return '低风险';
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/patients')}
          style={{ marginBottom: 16 }}
        >
          返回
        </Button>
        <h1 className="page-title" style={{ margin: 0 }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          健康报告生成
        </h1>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>选择患者</div>
            <Select
              style={{ width: '100%' }}
              placeholder="请选择患者"
              value={selectedPatient || undefined}
              onChange={setSelectedPatient}
              showSearch
              optionFilterProp="children"
            >
              {patients.map(patient => (
                <Option key={patient.id} value={patient.id}>
                  {patient.name} - {patient.condition}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>报告类型</div>
            <Select
              style={{ width: '100%' }}
              value={reportType}
              onChange={(value: 'weekly' | 'monthly') => setReportType(value)}
            >
              <Option value="weekly">周报告</Option>
              <Option value="monthly">月报告</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>操作</div>
            <Button type="primary" onClick={generateReport} loading={generating}>
              生成报告
            </Button>
            {report && (
              <Dropdown menu={exportMenu} placement="bottomRight">
                <Button 
                  icon={<DownloadOutlined />} 
                  style={{ marginLeft: 8 }}
                  loading={exporting}
                >
                  导出报告 <DownOutlined />
                </Button>
              </Dropdown>
            )}
          </Col>
        </Row>
      </Card>

      {generating ? (
        <div className="loading-container">
          <Spin size="large" tip="正在生成报告..." />
        </div>
      ) : report ? (
        <div ref={reportRef}>
          <Card title={<span className="card-title">{report.title}</span>}>
            <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="报告类型">
                {report.type === 'weekly' ? '周健康报告' : '月健康报告'}
              </Descriptions.Item>
              <Descriptions.Item label="生成时间">
                {new Date(report.generatedAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="报告周期" span={2}>
                {report.periodStart} 至 {report.periodEnd}
              </Descriptions.Item>
            </Descriptions>

            <div className="report-section">
              <h3 className="report-section-title">报告摘要</h3>
              <Alert
                message="摘要"
                description={report.summary}
                type="info"
                showIcon
              />
            </div>

            <Divider />

            <div className="report-section">
              <h3 className="report-section-title">健康指标分析</h3>
              <Row gutter={[16, 16]}>
                {report.metricsAnalysis.map((metric, index) => (
                  <Col xs={24} sm={12} lg={8} key={index}>
                    <Card 
                      bordered
                      className="metric-card"
                      style={{
                        borderLeft: `4px solid ${getStatusColor(metric.status)}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span className="metric-label">{metric.category}</span>
                        <Tag color={getStatusColor(metric.status)}>
                          {getStatusText(metric.status)}
                        </Tag>
                      </div>
                      <div className="metric-value" style={{ color: getStatusColor(metric.status) }}>
                        {getTrendIcon(metric.trend)} {metric.description}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>

            <Divider />

            <div className="report-section">
              <h3 className="report-section-title">风险评估</h3>
              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={8}>
                  <Card bordered={false} style={{ textAlign: 'center' }}>
                    <Statistic
                      title="整体风险等级"
                      value={getRiskLevelText(report.riskAssessment.overallLevel)}
                      valueStyle={{ color: getRiskLevelColor(report.riskAssessment.overallLevel) }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card bordered={false} style={{ textAlign: 'center' }}>
                    <Statistic
                      title="风险因素"
                      value={report.riskAssessment.riskFactors.length}
                      valueStyle={{ 
                        color: report.riskAssessment.riskFactors.length > 0 ? '#faad14' : '#52c41a' 
                      }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card bordered={false} style={{ textAlign: 'center' }}>
                    <Statistic
                      title="建议项"
                      value={report.recommendations.length}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
              </Row>

              {report.riskAssessment.riskFactors.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ marginBottom: 12 }}>风险因素详情：</h4>
                  <List
                    bordered
                    dataSource={report.riskAssessment.riskFactors}
                    renderItem={(factor) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <Tag color={getRiskLevelColor(factor.level)}>
                              {getRiskLevelText(factor.level)}
                            </Tag>
                          }
                          title={factor.category}
                          description={
                            <div>
                              <div>{factor.description}</div>
                              <div style={{ color: '#1890ff', marginTop: 4 }}>
                                <strong>建议：</strong>{factor.suggestion}
                              </div>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </div>
              )}

              {report.riskAssessment.immediateActions.length > 0 && (
                <Alert
                  message="立即处理措施"
                  description={
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {report.riskAssessment.immediateActions.map((action, index) => (
                        <li key={index} style={{ marginBottom: 4 }}>{action}</li>
                      ))}
                    </ul>
                  }
                  type="warning"
                  showIcon
                />
              )}
            </div>

            <Divider />

            <div className="report-section">
              <h3 className="report-section-title">康复建议</h3>
              <List
                bordered
                dataSource={report.recommendations}
                renderItem={(item, index) => (
                  <List.Item>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Tag color="blue" style={{ marginRight: 12, marginTop: 2 }}>
                        建议 {index + 1}
                      </Tag>
                      <span>{item}</span>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          </Card>
        </div>
      ) : (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="请选择患者并生成报告"
          >
            <Button type="primary" onClick={generateReport} disabled={!selectedPatient}>
              生成报告
            </Button>
          </Empty>
        </Card>
      )}
    </div>
  );
};

export default ReportView;
