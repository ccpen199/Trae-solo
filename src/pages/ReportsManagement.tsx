import React, { useState } from 'react';
import {
  Card,
  Button,
  Space,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Tabs,
  List,
  Row,
  Col,
  Popconfirm,
  message,
  Typography,
  Drawer,
  Divider,
  Descriptions,
  DatePicker,
  Radio,
  Checkbox,
  Tag,
  Transfer,
  Empty,
  Statistic
} from 'antd';
import {
  FileTextOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import type { ReportTemplate, NewsItem, AlertRecord } from '../types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const ReportsManagement: React.FC = () => {
  const {
    reportTemplates,
    newsItems,
    alerts,
    dashboardData,
    addReportTemplate,
    updateReportTemplate,
    deleteReportTemplate
  } = useAppStore();
  
  const [activeTab, setActiveTab] = useState('generate');
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const [generating, setGenerating] = useState(false);
  
  const [templateForm] = Form.useForm();
  
  const [generateConfig, setGenerateConfig] = useState({
    templateId: reportTemplates[0]?.id || '',
    dateRange: [dayjs().subtract(7, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs],
    format: 'pdf' as 'pdf' | 'excel',
    keywords: [] as string[],
    regions: [] as string[],
    riskLevels: [] as string[]
  });
  
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  
  const sectionTypes = [
    { key: 'summary', title: '报告概览', type: 'summary' as const },
    { key: 'statistics', title: '统计数据', type: 'statistics' as const },
    { key: 'news_list', title: '热点新闻', type: 'news_list' as const },
    { key: 'alerts', title: '风险预警', type: 'alerts' as const },
    { key: 'charts', title: '趋势图表', type: 'charts' as const }
  ];
  
  const handleAddTemplate = () => {
    setEditingTemplate(null);
    templateForm.resetFields();
    setSelectedSections([]);
    setTemplateModalVisible(true);
  };
  
  const handleEditTemplate = (template: ReportTemplate) => {
    setEditingTemplate(template);
    templateForm.setFieldsValue({
      name: template.name,
      description: template.description
    });
    setSelectedSections(
      template.sections.filter(s => s.enabled).map(s => s.id)
    );
    setTemplateModalVisible(true);
  };
  
  const handleSubmitTemplate = () => {
    templateForm.validateFields().then(values => {
      const sections = sectionTypes.map(st => ({
        id: st.key,
        title: st.title,
        type: st.type,
        enabled: selectedSections.includes(st.key)
      }));
      
      const templateData = {
        name: values.name,
        description: values.description,
        sections
      };
      
      if (editingTemplate) {
        updateReportTemplate(editingTemplate.id, templateData);
        message.success('更新成功');
      } else {
        addReportTemplate(templateData);
        message.success('添加成功');
      }
      
      setTemplateModalVisible(false);
    });
  };
  
  const handleGenerateReport = () => {
    if (!generateConfig.templateId) {
      message.warning('请选择报告模板');
      return;
    }
    
    setGenerating(true);
    message.loading({ content: '正在生成报告...', key: 'generate' });
    
    setTimeout(() => {
      setGenerating(false);
      message.success({ content: '报告生成成功！', key: 'generate' });
      
      const template = reportTemplates.find(t => t.id === generateConfig.templateId);
      if (template) {
        setPreviewVisible(true);
      }
    }, 2000);
  };
  
  const handleDownloadReport = (format: 'pdf' | 'excel') => {
    message.loading({ content: `正在下载${format.toUpperCase()}文件...`, key: 'download' });
    
    setTimeout(() => {
      message.success({ content: `下载成功！`, key: 'download' });
    }, 1500);
  };
  
  const templateColumns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 300
    },
    {
      title: '包含章节',
      key: 'sections',
      render: (_: any, record: ReportTemplate) => (
        <Space size={[0, 4]} wrap>
          {record.sections.filter(s => s.enabled).map(s => (
            <Tag key={s.id}>{s.title}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ReportTemplate) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditTemplate(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个模板吗？"
            onConfirm={() => {
              deleteReportTemplate(record.id);
              message.success('删除成功');
            }}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];
  
  const mockReportData = {
    title: '舆情监测日报',
    dateRange: `${generateConfig.dateRange[0].format('YYYY-MM-DD')} 至 ${generateConfig.dateRange[1].format('YYYY-MM-DD')}`,
    generateTime: new Date().toLocaleString('zh-CN'),
    ...dashboardData,
    topNews: newsItems.slice(0, 5),
    recentAlerts: alerts.slice(0, 5)
  };
  
  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane
          tab={
            <span>
              <FileTextOutlined />
              生成报告
            </span>
          }
          key="generate"
        >
          <Card title="报告配置">
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <Form layout="vertical">
                  <Form.Item label="选择模板" required>
                    <Select
                      placeholder="请选择报告模板"
                      value={generateConfig.templateId}
                      onChange={(value) => setGenerateConfig({ ...generateConfig, templateId: value })}
                      style={{ width: '100%' }}
                    >
                      {reportTemplates.map(t => (
                        <Option key={t.id} value={t.id}>{t.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                  
                  <Form.Item label="时间范围" required>
                    <RangePicker
                      value={generateConfig.dateRange}
                      onChange={(dates) => {
                        if (dates) {
                          setGenerateConfig({
                            ...generateConfig,
                            dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs]
                          });
                        }
                      }}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  
                  <Form.Item label="导出格式" required>
                    <Radio.Group
                      value={generateConfig.format}
                      onChange={(e) => setGenerateConfig({ ...generateConfig, format: e.target.value })}
                    >
                      <Radio.Button value="pdf">
                        <FilePdfOutlined /> PDF
                      </Radio.Button>
                      <Radio.Button value="excel">
                        <FileExcelOutlined /> Excel
                      </Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                  
                  <Form.Item label="筛选条件（可选）">
                    <Card size="small" title="关键词">
                      <Checkbox.Group
                        value={generateConfig.keywords}
                        onChange={(checkedValues) => setGenerateConfig({ ...generateConfig, keywords: checkedValues as string[] })}
                      >
                        <Space wrap>
                          <Checkbox value="政策">政策</Checkbox>
                          <Checkbox value="产品质量">产品质量</Checkbox>
                          <Checkbox value="安全事故">安全事故</Checkbox>
                          <Checkbox value="消费者投诉">消费者投诉</Checkbox>
                          <Checkbox value="天气预警">天气预警</Checkbox>
                        </Space>
                      </Checkbox.Group>
                    </Card>
                    
                    <Card size="small" title="风险等级" style={{ marginTop: 8 }}>
                      <Checkbox.Group
                        value={generateConfig.riskLevels}
                        onChange={(checkedValues) => setGenerateConfig({ ...generateConfig, riskLevels: checkedValues as string[] })}
                      >
                        <Space wrap>
                          <Checkbox value="low">低风险</Checkbox>
                          <Checkbox value="medium">中风险</Checkbox>
                          <Checkbox value="high">高风险</Checkbox>
                          <Checkbox value="critical">紧急</Checkbox>
                        </Space>
                      </Checkbox.Group>
                    </Card>
                  </Form.Item>
                  
                  <Form.Item>
                    <Space>
                      <Button
                        type="primary"
                        icon={<FileTextOutlined />}
                        onClick={handleGenerateReport}
                        loading={generating}
                        size="large"
                      >
                        生成报告
                      </Button>
                      <Button
                        icon={<EyeOutlined />}
                        onClick={() => setPreviewVisible(true)}
                        size="large"
                      >
                        预览
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Col>
              
              <Col xs={24} lg={12}>
                <Card title="报告预览（示例）">
                  <div style={{ border: '1px solid #f0f0f0', padding: 24, background: '#fff', borderRadius: 4 }}>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                      <Title level={3}>{mockReportData.title}</Title>
                      <Text type="secondary">{mockReportData.dateRange}</Text>
                    </div>
                    
                    <Divider />
                    
                    <Title level={5}>一、今日概览</Title>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Card size="small">
                          <Statistic title="舆情总量" value={mockReportData.todayStats.totalNews} />
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card size="small">
                          <Statistic title="紧急预警" value={mockReportData.todayStats.criticalAlerts} />
                        </Card>
                      </Col>
                    </Row>
                    
                    <Divider />
                    
                    <Title level={5}>二、热点新闻</Title>
                    <List
                      size="small"
                      dataSource={mockReportData.topNews.slice(0, 3)}
                      renderItem={(item) => (
                        <List.Item>
                          <Text ellipsis style={{ maxWidth: 400 }}>
                            • {item.title}
                          </Text>
                        </List.Item>
                      )}
                    />
                    
                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        报告生成时间：{mockReportData.generateTime}
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </TabPane>
        
        <TabPane
          tab={
            <span>
              <SaveOutlined />
              模板管理
            </span>
          }
          key="templates"
        >
          <Card>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddTemplate}
              >
                新建模板
              </Button>
            </div>
            
            <Table
              columns={templateColumns}
              dataSource={reportTemplates}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </TabPane>
      </Tabs>
      
      <Modal
        title={editingTemplate ? '编辑报告模板' : '新建报告模板'}
        open={templateModalVisible}
        onOk={handleSubmitTemplate}
        onCancel={() => setTemplateModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={700}
      >
        <Form
          form={templateForm}
          layout="vertical"
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="name"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="请输入模板名称，如：日报模板、周报模板" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="模板描述"
          >
            <Input.TextArea rows={2} placeholder="请输入模板描述" />
          </Form.Item>
          
          <Form.Item label="报告章节">
            <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>
              选择要包含在报告中的章节：
            </Text>
            <Checkbox.Group
              value={selectedSections}
              onChange={(checkedValues) => setSelectedSections(checkedValues as string[])}
            >
              <Row gutter={[16, 16]}>
                {sectionTypes.map(st => (
                  <Col span={12} key={st.key}>
                    <Card size="small">
                      <Checkbox value={st.key}>
                        <Text strong>{st.title}</Text>
                      </Checkbox>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {st.type === 'summary' && '包含报告摘要、关键数据概览'}
                        {st.type === 'statistics' && '包含舆情数量统计、情感分布'}
                        {st.type === 'news_list' && '包含热点新闻列表和详情'}
                        {st.type === 'alerts' && '包含风险预警信息和处理情况'}
                        {st.type === 'charts' && '包含趋势图表和数据可视化'}
                      </Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
      
      <Drawer
        title="报告预览"
        width={800}
        open={previewVisible}
        onClose={() => setPreviewVisible(false)}
        extra={
          <Space>
            <Button
              icon={<FilePdfOutlined />}
              onClick={() => handleDownloadReport('pdf')}
            >
              下载PDF
            </Button>
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={() => handleDownloadReport('excel')}
            >
              下载Excel
            </Button>
          </Space>
        }
      >
        <div style={{ border: '1px solid #f0f0f0', padding: 40, background: '#fff', minHeight: 'calc(100vh - 120px)' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <Title level={2}>{mockReportData.title}</Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              {mockReportData.dateRange}
            </Text>
          </div>
          
          <Divider />
          
          <Title level={4}>一、报告概览</Title>
          <Paragraph>
            本报告汇总了{mockReportData.dateRange}期间的舆情监测数据，包括新闻采集、情感分析、风险预警等关键信息。
            本期共采集舆情数据{mockReportData.todayStats.totalNews}条，其中正面{mockReportData.todayStats.positiveNews}条，
            中性{mockReportData.todayStats.neutralNews}条，负面{mockReportData.todayStats.negativeNews}条，
            触发紧急预警{mockReportData.todayStats.criticalAlerts}次。
          </Paragraph>
          
          <Divider />
          
          <Title level={4}>二、统计数据</Title>
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card>
                <Statistic title="舆情总量" value={mockReportData.todayStats.totalNews} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="正面舆情" value={mockReportData.todayStats.positiveNews} valueStyle={{ color: '#52c41a' }} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="负面舆情" value={mockReportData.todayStats.negativeNews} valueStyle={{ color: '#ff4d4f' }} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="紧急预警" value={mockReportData.todayStats.criticalAlerts} valueStyle={{ color: '#722ed1' }} />
              </Card>
            </Col>
          </Row>
          
          <Divider />
          
          <Title level={4}>三、热点新闻</Title>
          <List
            dataSource={mockReportData.topNews}
            renderItem={(item, index) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Text strong>
                      {index + 1}. {item.title}
                    </Text>
                  }
                  description={
                    <Space>
                      <Tag color={item.riskLevel === 'low' ? 'green' : item.riskLevel === 'medium' ? 'orange' : item.riskLevel === 'high' ? 'red' : 'purple'}>
                        {item.riskLevel === 'low' ? '低风险' : item.riskLevel === 'medium' ? '中风险' : item.riskLevel === 'high' ? '高风险' : '紧急'}
                      </Tag>
                      <Text type="secondary">来源：{item.source}</Text>
                      <Text type="secondary">发布时间：{item.publishTime}</Text>
                    </Space>
                  }
                />
                <Paragraph type="secondary" style={{ marginTop: 8 }}>
                  {item.summary}
                </Paragraph>
              </List.Item>
            )}
          />
          
          <Divider />
          
          <Title level={4}>四、风险预警</Title>
          <List
            dataSource={mockReportData.recentAlerts}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color={item.riskLevel === 'low' ? 'green' : item.riskLevel === 'medium' ? 'orange' : item.riskLevel === 'high' ? 'red' : 'purple'}>
                        {item.riskLevel === 'low' ? '低风险' : item.riskLevel === 'medium' ? '中风险' : item.riskLevel === 'high' ? '高风险' : '紧急'}
                      </Tag>
                      <Text strong>{item.newsTitle}</Text>
                    </Space>
                  }
                  description={
                    <Space>
                      <Text type="secondary">触发规则：{item.ruleName}</Text>
                      <Text type="secondary">预警时间：{item.alertTime}</Text>
                      <Tag color={item.status === 'unread' ? 'red' : item.status === 'read' ? 'orange' : 'green'}>
                        {item.status === 'unread' ? '未读' : item.status === 'read' ? '已读' : '已处理'}
                      </Tag>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
          
          <Divider />
          
          <div style={{ textAlign: 'right', marginTop: 40 }}>
            <Text type="secondary">报告生成时间：{mockReportData.generateTime}</Text>
            <br />
            <Text type="secondary">舆情监控系统</Text>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default ReportsManagement;
