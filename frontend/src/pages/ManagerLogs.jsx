import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Typography, Select, Modal, Form, Input, InputNumber, Upload, DatePicker, message, Card, Row, Col, Image, List, Avatar } from 'antd';
import { FileTextOutlined, PlusOutlined, CameraOutlined, AudioOutlined, EyeOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { getConstructionLogs, createLog, getProjects } from '../api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const ManagerLogs = () => {
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [projectFilter, setProjectFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, projectFilter]);

  const loadProjects = async () => {
    const res = await getProjects({ pageSize: 100 });
    if (res.code === 200) {
      setProjects(res.data.list);
    }
  };

  const loadData = async () => {
    setLoading(true);
    const res = await getConstructionLogs({
      page: pagination.current,
      pageSize: pagination.pageSize,
      project_id: projectFilter
    });
    if (res.code === 200) {
      setData(res.data.list);
      setPagination(prev => ({ ...prev, total: res.data.total }));
    }
    setLoading(false);
  };

  const handleSubmit = async (values) => {
    const formData = new FormData();
    formData.append('project_id', values.project_id);
    formData.append('log_date', values.log_date.format('YYYY-MM-DD'));
    formData.append('weather', values.weather);
    formData.append('temperature', values.temperature);
    formData.append('content', values.content);
    formData.append('worker_count', values.worker_count || 0);
    formData.append('work_content', values.work_content || '');
    formData.append('problem', values.problem || '');
    formData.append('solution', values.solution || '');
    
    fileList.forEach(file => {
      formData.append('photos', file.originFileObj);
    });

    const res = await createLog(formData);
    if (res.code === 200) {
      message.success('日志提交成功');
      setModalVisible(false);
      form.resetFields();
      setFileList([]);
      loadData();
    } else {
      message.error(res.message);
    }
  };

  const columns = [
    { title: '日期', dataIndex: 'log_date', key: 'log_date', width: 110 },
    { title: '项目', dataIndex: 'project_title', key: 'project_title', ellipsis: true },
    { title: '天气', dataIndex: 'weather', key: 'weather', width: 80, render: v => v && <Tag>{v}</Tag> },
    { title: '温度', dataIndex: 'temperature', key: 'temperature', width: 100 },
    { title: '工人数量', dataIndex: 'worker_count', key: 'worker_count', width: 90, render: v => v ? `${v}人` : '-' },
    { title: '今日内容', dataIndex: 'content', key: 'content', ellipsis: true },
    { title: '照片', key: 'photos', width: 80, render: (_, r) => r.photos?.length ? `${r.photos.length}张` : '-' },
    { title: '语音', key: 'voice', width: 80, render: (_, r) => r.voice_note_url ? <AudioOutlined /> : '-' },
    { title: '记录人', dataIndex: 'manager_name', key: 'manager_name', width: 100 },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setCurrentLog(record); setDetailVisible(true); }}>
          查看
        </Button>
      )
    }
  ];

  const uploadProps = {
    fileList,
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
    beforeUpload: () => false,
    listType: 'picture-card',
    accept: 'image/*',
    multiple: true
  };

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          施工日志
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setFileList([]); setModalVisible(true); }}>
          记录日志
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Select
          placeholder="选择项目"
          allowClear
          style={{ width: 300 }}
          value={projectFilter || undefined}
          onChange={v => setProjectFilter(v || '')}
          options={projects.map(p => ({ label: p.title, value: p.id }))}
        />
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: total => `共 ${total} 条`
        }}
        onChange={(p) => setPagination(prev => ({ ...prev, current: p.current, pageSize: p.pageSize }))}
      />

      <Modal
        title="记录施工日志"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="project_id" label="所属项目" rules={[{ required: true }]}>
                <Select options={projects.map(p => ({ label: p.title, value: p.id }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="log_date" label="日期" rules={[{ required: true }]} initialValue={dayjs()}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="weather" label="天气">
                <Select>
                  <Select.Option value="晴">晴</Select.Option>
                  <Select.Option value="多云">多云</Select.Option>
                  <Select.Option value="阴">阴</Select.Option>
                  <Select.Option value="小雨">小雨</Select.Option>
                  <Select.Option value="大雨">大雨</Select.Option>
                  <Select.Option value="雪">雪</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="temperature" label="温度">
                <Input placeholder="如: 22-30℃" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="worker_count" label="工人数量">
                <InputNumber style={{ width: '100%' }} min={0} addonAfter="人" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="content" label="施工内容" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="请详细描述今日施工内容" />
          </Form.Item>
          <Form.Item name="work_content" label="施工人员安排">
            <TextArea rows={2} placeholder="各工种人员安排" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="problem" label="存在问题">
                <TextArea rows={2} placeholder="今日施工中发现的问题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="solution" label="解决方案">
                <TextArea rows={2} placeholder="问题的处理方案" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="现场照片(带自动水印)">
            <Upload {...uploadProps}>
              <div>
                <CameraOutlined style={{ fontSize: 24 }} />
                <div style={{ marginTop: 8 }}>上传照片</div>
              </div>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交日志</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="施工日志详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {currentLog && (
          <div>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="日期">{currentLog.log_date}</Descriptions.Item>
              <Descriptions.Item label="项目">{currentLog.project_title}</Descriptions.Item>
              <Descriptions.Item label="天气">{currentLog.weather}</Descriptions.Item>
              <Descriptions.Item label="温度">{currentLog.temperature}</Descriptions.Item>
              <Descriptions.Item label="工人数量">{currentLog.worker_count || 0}人</Descriptions.Item>
              <Descriptions.Item label="记录人">{currentLog.manager_name}</Descriptions.Item>
            </Descriptions>

            <div className="detail-section">
              <div className="detail-section-title">施工内容</div>
              <Paragraph>{currentLog.content}</Paragraph>
            </div>

            {currentLog.work_content && (
              <div className="detail-section">
                <div className="detail-section-title">人员安排</div>
                <Paragraph>{currentLog.work_content}</Paragraph>
              </div>
            )}

            {currentLog.problem && (
              <div className="detail-section">
                <div className="detail-section-title">问题与解决方案</div>
                <Paragraph><Text strong>问题:</Text> {currentLog.problem}</Paragraph>
                <Paragraph><Text strong>方案:</Text> {currentLog.solution || '待处理'}</Paragraph>
              </div>
            )}

            {currentLog.photos?.length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">现场照片</div>
                <Row gutter={[8, 8]}>
                  {currentLog.photos.map((photo, idx) => (
                    <Col xs={12} sm={8} key={idx}>
                      <Image
                        src={photo.photo_url.startsWith('http') ? photo.photo_url : `https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop`}
                        width="100%"
                        height={120}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                      />
                      {photo.watermark && (
                        <div style={{ fontSize: 10, color: '#888', textAlign: 'center', marginTop: 2 }}>
                          {photo.watermark}
                        </div>
                      )}
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManagerLogs;
