import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Table, Button, Space, Tag, Upload, Modal, Form, Input, Select, message, Tabs, Descriptions, Statistic, UploadFile, Breadcrumb, Divider } from 'antd';
import { ArrowLeftOutlined, UploadOutlined, FileTextOutlined, TeamOutlined, SendOutlined, CheckCircleOutlined, ClockCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { apiEndpoints, ApiResponse } from '../api';
import { formatSalary, formatDate, getIndustryZoneClass, getIndustryZoneLabel } from '../utils';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const CompanyRPO: React.FC = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importForm] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [batchesRes, jobsRes, schoolsRes] = await Promise.all([
        apiEndpoints.rpo.getBatches({ pageSize: 20 }) as Promise<ApiResponse>,
        apiEndpoints.jobs.getList({ pageSize: 20 }) as Promise<ApiResponse>,
        apiEndpoints.schools.getList({ pageSize: 20 }) as Promise<ApiResponse>,
      ]);

      setBatches(batchesRes.data || batchesRes.batches || []);
      setJobs(jobsRes.data || []);
      setSchools(schoolsRes.data || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportJobs = async (values: any) => {
    try {
      const importData = previewData.length > 0
        ? previewData
        : [{
            title: values.title,
            industry_zone: values.industry_zone,
            salary_min: values.salary_min,
            salary_max: values.salary_max,
            salary_negotiable: values.salary_negotiable || false,
            education_requirement: values.education_requirement,
            experience_requirement: values.experience_requirement,
            major_requirements: values.major_requirements,
            skill_requirements: values.skill_requirements,
            headcount: values.headcount,
            location_name: values.location_name,
            responsibilities: values.responsibilities,
            requirements: values.requirements,
          }];

      const res = await apiEndpoints.rpo.importJobs({
        company_id: 'comp_001',
        target_school_ids: values.target_schools || [],
        auto_push: values.auto_push || false,
        jobs: importData,
      }) as ApiResponse;

      if (res.success) {
        message.success(`成功导入 ${res.data?.imported_count || importData.length} 个岗位`);
        setImportModalVisible(false);
        importForm.resetFields();
        setFileList([]);
        setPreviewData([]);
        loadData();
      } else {
        message.error(res.message || '导入失败');
      }
    } catch (error) {
      message.error('导入失败');
    }
  };

  const handleFileUpload = (options: any) => {
    const { file } = options;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').slice(1).filter((line: string) => line.trim());
        const parsed = lines.map((line: string, index: number) => {
          const columns = line.split(',');
          return {
            title: columns[0]?.trim(),
            industry_zone: columns[1]?.trim(),
            salary_min: parseInt(columns[2]) || 0,
            salary_max: parseInt(columns[3]) || 0,
            education_requirement: columns[4]?.trim(),
            major_requirements: columns[5]?.trim(),
            skill_requirements: columns[6]?.trim(),
            headcount: parseInt(columns[7]) || 1,
            location_name: columns[8]?.trim(),
            responsibilities: columns[9]?.trim(),
            requirements: columns[10]?.trim(),
          };
        });
        setPreviewData(parsed);
        message.success(`解析成功，共 ${parsed.length} 条数据`);
      } catch (error) {
        message.error('文件解析失败');
      }
    };
    reader.readAsText(file);
  };

  const batchColumns = [
    {
      title: '批次号',
      dataIndex: 'batch_no',
      key: 'batch_no',
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>,
    },
    {
      title: '岗位数量',
      dataIndex: 'job_count',
      key: 'job_count',
      render: (count: number) => `${count} 个`,
    },
    {
      title: '推送院校',
      dataIndex: 'target_school_count',
      key: 'target_school_count',
      render: (count: number) => `${count} 所`,
    },
    {
      title: '自动推送',
      dataIndex: 'auto_push',
      key: 'auto_push',
      render: (auto: boolean) => auto ? <Tag color="green">已开启</Tag> : <Tag color="orange">手动</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          completed: 'green',
          processing: 'blue',
          pending: 'orange',
          failed: 'red',
        };
        const labels: Record<string, string> = {
          completed: '已完成',
          processing: '处理中',
          pending: '待处理',
          failed: '失败',
        };
        return (
          <Space>
            {status === 'processing' ? <ClockCircleOutlined spin style={{ color: '#1890ff' }} /> : <CheckCircleOutlined style={{ color: '#52c41a' }} />}
            <Tag color={colors[status]}>{labels[status]}</Tag>
          </Space>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDate(date),
    },
  ];

  const jobColumns = [
    {
      title: '岗位名称',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <a onClick={() => navigate(`/job/${record.id}`)} style={{ fontWeight: 500 }}>{text}</a>
      ),
    },
    {
      title: '薪资',
      dataIndex: 'salary_min',
      key: 'salary',
      render: (_: any, record: any) => (
        <span className="salary-text">{formatSalary(record.salary_min, record.salary_max, record.salary_negotiable)}</span>
      ),
    },
    {
      title: '产业带',
      dataIndex: 'industry_zone',
      key: 'industry_zone',
      render: (zone: string) => (
        <span className={`industry-tag ${getIndustryZoneClass(zone)}`}>{getIndustryZoneLabel(zone)}</span>
      ),
    },
    {
      title: '招聘人数',
      dataIndex: 'headcount',
      key: 'headcount',
      render: (count: number) => `${count} 人`,
    },
    {
      title: '已投递',
      dataIndex: 'apply_count',
      key: 'apply_count',
      render: (count: number) => count || 0,
    },
    {
      title: '推送状态',
      dataIndex: 'push_status',
      key: 'push_status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          pushed: 'green',
          pending: 'orange',
          draft: 'default',
        };
        const labels: Record<string, string> = {
          pushed: '已推送',
          pending: '待推送',
          draft: '草稿',
        };
        return <Tag color={colors[status] || 'default'}>{labels[status] || status}</Tag>;
      },
    },
    {
      title: '发布时间',
      dataIndex: 'publish_date',
      key: 'publish_date',
      render: (date: string) => formatDate(date),
    },
  ];

  const pushedCount = jobs.filter((j: any) => j.push_status === 'pushed').length;
  const totalApplications = jobs.reduce((sum: number, j: any) => sum + (j.apply_count || 0), 0);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
        <Breadcrumb style={{ marginTop: 8 }}>
          <Breadcrumb.Item>云南省</Breadcrumb.Item>
          <Breadcrumb.Item>企业RPO服务</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={6}>
            <Statistic
              title="已发布岗位"
              value={jobs.length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="已推送院校"
              value={pushedCount}
              prefix={<SendOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="收到简历"
              value={totalApplications}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="RPO批次"
              value={batches.length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>

        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setImportModalVisible(true)}>
            批量导入岗位
          </Button>
        </div>
      </Card>

      <Tabs defaultActiveKey="1">
        <TabPane tab="RPO批次管理" key="1">
          <Card loading={loading}>
            <Table
              columns={batchColumns}
              dataSource={batches}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
              expandable={{
                expandedRowRender: (record: any) => (
                  <Descriptions column={3} size="small" title="批次详情">
                    <Descriptions.Item label="批次号">{record.batch_no}</Descriptions.Item>
                    <Descriptions.Item label="企业">{record.company_name}</Descriptions.Item>
                    <Descriptions.Item label="岗位总数">{record.job_count} 个</Descriptions.Item>
                    <Descriptions.Item label="目标院校">{record.target_school_count} 所</Descriptions.Item>
                    <Descriptions.Item label="推送人数">{record.pushed_count || 0} 人</Descriptions.Item>
                    <Descriptions.Item label="成功匹配">{record.matched_count || 0} 人</Descriptions.Item>
                    <Descriptions.Item label="自动推送" span={3}>
                      {record.auto_push ? '已开启，岗位将自动推送至目标院校' : '未开启，需手动确认推送'}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              }}
            />
          </Card>
        </TabPane>
        <TabPane tab="岗位管理" key="2">
          <Card loading={loading}>
            <Table
              columns={jobColumns}
              dataSource={jobs}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Card>
        </TabPane>
        <TabPane tab="合作院校" key="3">
          <Card loading={loading}>
            <Row gutter={[16, 16]}>
              {schools.map((school: any) => (
                <Col xs={24} sm={12} lg={8} key={school.id}>
                  <Card size="small" hoverable className="job-card">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 8,
                          background: 'linear-gradient(135deg, #13c2c2 0%, #1890ff 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 600,
                          marginRight: 12,
                        }}
                      >
                        {school.name?.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {school.name}
                        </div>
                        <Space size={4} style={{ marginTop: 4 }}>
                          <Tag size="small" color="blue">{school.school_type}</Tag>
                          <Tag size="small" color="green">{school.location_name}</Tag>
                        </Space>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                          重点专业: {school.key_majors?.split(',').slice(0, 2).join('、')}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title="批量导入岗位"
        open={importModalVisible}
        onCancel={() => {
          setImportModalVisible(false);
          importForm.resetFields();
          setFileList([]);
          setPreviewData([]);
        }}
        footer={null}
        width={800}
      >
        <Form form={importForm} layout="vertical" onFinish={handleImportJobs}>
          <Tabs defaultActiveKey="1">
            <TabPane tab="单条录入" key="1">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item name="title" label="岗位名称" rules={[{ required: true, message: '请输入岗位名称' }]}>
                    <Input placeholder="如：Java开发工程师" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="industry_zone" label="所属产业带" rules={[{ required: true, message: '请选择产业带' }]}>
                    <Select placeholder="选择产业带">
                      <Option value="dianzhong_manufacturing">滇中制造</Option>
                      <Option value="puer_tea">普洱茶业</Option>
                      <Option value="xishuangbanna_tourism">西双版纳旅游</Option>
                      <Option value="yuxi_tobacco">玉溪烟草</Option>
                      <Option value="kunming_it">昆明信息技术</Option>
                      <Option value="qujing_energy">曲靖能源</Option>
                      <Option value="honghe_metallurgy">红河冶金</Option>
                      <Option value="dali_culture">大理文化旅游</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="salary_min" label="最低薪资" rules={[{ required: true }]}>
                    <Input type="number" placeholder="元/月" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="salary_max" label="最高薪资" rules={[{ required: true }]}>
                    <Input type="number" placeholder="元/月" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="education_requirement" label="学历要求" rules={[{ required: true }]}>
                    <Select placeholder="选择学历">
                      <Option value="大专">大专</Option>
                      <Option value="本科">本科</Option>
                      <Option value="硕士">硕士</Option>
                      <Option value="博士">博士</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="major_requirements" label="专业要求">
                    <Input placeholder="如：计算机、软件工程" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="skill_requirements" label="技能要求">
                    <Input placeholder="如：Java,SpringBoot,MySQL" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="headcount" label="招聘人数" initialValue={1}>
                    <Input type="number" min={1} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={16}>
                  <Form.Item name="location_name" label="工作地点">
                    <Input placeholder="如：云南省昆明市呈贡区" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item name="responsibilities" label="岗位职责">
                    <TextArea rows={3} placeholder="请描述岗位职责" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item name="requirements" label="任职要求">
                    <TextArea rows={3} placeholder="请描述任职要求" />
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>
            <TabPane tab="CSV批量导入" key="2">
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <div style={{ marginBottom: 8, color: '#888', fontSize: 13 }}>
                    上传CSV文件，列顺序：岗位名称,产业带,最低薪资,最高薪资,学历要求,专业要求,技能要求,招聘人数,工作地点,岗位职责,任职要求
                  </div>
                  <Upload
                    fileList={fileList}
                    customRequest={handleFileUpload}
                    onChange={({ fileList }) => setFileList(fileList)}
                    maxCount={1}
                    accept=".csv"
                  >
                    <Button icon={<UploadOutlined />}>选择CSV文件</Button>
                  </Upload>
                </div>

                {previewData.length > 0 && (
                  <div>
                    <div style={{ marginBottom: 8, fontWeight: 500 }}>
                      数据预览（共 {previewData.length} 条）
                    </div>
                    <Table
                      columns={[
                        { title: '岗位名称', dataIndex: 'title', key: 'title' },
                        { title: '产业带', dataIndex: 'industry_zone', key: 'industry_zone' },
                        { title: '薪资范围', key: 'salary', render: (_: any, r: any) => `${r.salary_min}-${r.salary_max}` },
                        { title: '学历', dataIndex: 'education_requirement', key: 'education' },
                        { title: '招聘人数', dataIndex: 'headcount', key: 'headcount' },
                      ]}
                      dataSource={previewData.slice(0, 5)}
                      rowKey={(record, index) => index?.toString() || ''}
                      pagination={false}
                      size="small"
                    />
                  </div>
                )}
              </Space>
            </TabPane>
          </Tabs>

          <Divider style={{ margin: '16px 0' }} />

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={16}>
              <Form.Item name="target_schools" label="目标推送院校">
                <Select mode="multiple" placeholder="选择目标院校（可选）">
                  {schools.map(school => (
                    <Option key={school.id} value={school.id}>{school.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="auto_push" label="自动推送" valuePropName="checked" initialValue={false}>
                <Select>
                  <Option value={true}>开启自动推送</Option>
                  <Option value={false}>手动确认推送</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => {
                setImportModalVisible(false);
                importForm.resetFields();
                setFileList([]);
                setPreviewData([]);
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" icon={<UploadOutlined />}>
                确认导入
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CompanyRPO;
