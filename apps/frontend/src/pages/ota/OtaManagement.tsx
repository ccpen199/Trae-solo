import React, { useState, useEffect } from 'react';
import {
  Table, Card, Input, Select, Button, Space, Tag, Modal,
  Form, Upload, App, Progress, Badge, Row, Col, Statistic, Tooltip, Empty,
} from 'antd';
import {
  SearchOutlined, PlusOutlined, CloudUploadOutlined,
  ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ThunderboltOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import { otaAPI, deviceAPI } from '../../services/api';

const { Search } = Input;
const { Option } = Select;

const OtaManagementPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const [tab, setTab] = useState<'firmware' | 'jobs'>('firmware');
  const [firmwareLoading, setFirmwareLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [firmwareList, setFirmwareList] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [uploadModal, setUploadModal] = useState(false);
  const [batchUpgradeModal, setBatchUpgradeModal] = useState(false);
  const [uploadForm] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [devices, setDevices] = useState<any[]>([]);
  const [fTotal, setFTotal] = useState(0);
  const [jTotal, setJTotal] = useState(0);
  const [fPage, setFPage] = useState(1);
  const [jPage, setJPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    loadFirmware();
    loadJobs();
    loadDevices();
  }, [fPage, jPage, pageSize, tab]);

  const loadFirmware = async () => {
    try {
      setFirmwareLoading(true);
      const res: any = await otaAPI.getFirmwareList();
      const items = Array.isArray(res) ? res : (res.items || []);
      setFirmwareList(items);
      setFTotal(items.length);
    } catch {
      setFirmwareList([]);
    } finally {
      setFirmwareLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      setJobsLoading(true);
      const res: any = await otaAPI.getOtaJobs();
      const items = Array.isArray(res) ? res : (res.items || []);
      setJobs(items);
      setJTotal(items.length);
    } catch {
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  const loadDevices = async () => {
    try {
      const res: any = await deviceAPI.getList({ pageSize: 200 });
      setDevices(res.items || []);
    } catch {}
  };

  const handleUpload = async (values: any) => {
    try {
      await otaAPI.uploadFirmware(values);
      message.success('固件上传成功');
      setUploadModal(false);
      uploadForm.resetFields();
      loadFirmware();
    } catch (err: any) {
      message.error(err.message || '上传失败');
    }
  };

  const handleBatchUpgrade = async (values: any) => {
    try {
      await otaAPI.batchOta(values);
      message.success('批量升级任务已创建');
      setBatchUpgradeModal(false);
      batchForm.resetFields();
      loadJobs();
    } catch (err: any) {
      message.error(err.message || '创建失败');
    }
  };

  const handleStartSingle = (fw: any) => {
    batchForm.setFieldsValue({ firmwareId: fw.id, deviceIds: [] });
    setBatchUpgradeModal(true);
  };

  const handleCancelJob = (job: any) => {
    modal.confirm({
      title: '确认取消升级任务？',
      content: '正在升级的设备可能会中断',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await otaAPI.cancelOta(job.id);
          message.success('已取消');
          loadJobs();
        } catch (err: any) {
          message.error(err.message || '取消失败');
        }
      },
    });
  };

  const fwColumns = [
    { title: '固件名称', dataIndex: 'name' },
    {
      title: '适用厂商',
      dataIndex: 'vendorName',
      render: (v: string) => <Tag color="blue">{v || '-'}</Tag>,
    },
    { title: '型号', dataIndex: 'model' },
    { title: '版本', dataIndex: 'version' },
    { title: '文件大小', dataIndex: 'size', render: (s: number) => s ? `${(s / 1024 / 1024).toFixed(2)} MB` : '-' },
    { title: '上传时间', dataIndex: 'createdAt', render: (t: string) => t ? new Date(t).toLocaleDateString() : '-' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="检查可用设备">
            <Button type="link" size="small" icon={<InfoCircleOutlined />} />
          </Tooltip>
          <Button type="link" size="small" icon={<CloudUploadOutlined />} onClick={() => handleStartSingle(record)}>
            升级
          </Button>
        </Space>
      ),
    },
  ];

  const jobStatusConfig: Record<string, { color: string; label: string }> = {
    pending: { color: 'default', label: '等待中' },
    in_progress: { color: 'processing', label: '升级中' },
    completed: { color: 'success', label: '完成' },
    failed: { color: 'error', label: '失败' },
    cancelled: { color: 'default', label: '已取消' },
  };

  const jobColumns = [
    {
      title: '设备',
      dataIndex: 'deviceName',
      render: (n: string, r: any) => n || r.deviceId || '-',
    },
    { title: '固件版本', dataIndex: 'targetVersion' },
    {
      title: '进度',
      dataIndex: 'progress',
      render: (p: number) => {
        const percent = p || 0;
        return <Progress percent={percent} size="small" />;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: string) => {
        const cfg = jobStatusConfig[s] || jobStatusConfig.pending;
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    { title: '开始时间', dataIndex: 'startedAt', render: (t: string) => t ? new Date(t).toLocaleString() : '-' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          {(record.status === 'pending' || record.status === 'in_progress') && (
            <Button type="link" size="small" danger onClick={() => handleCancelJob(record)}>
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const successCount = jobs.filter((j) => j.status === 'completed').length;
  const inProgressCount = jobs.filter((j) => j.status === 'in_progress').length;
  const failedCount = jobs.filter((j) => j.status === 'failed').length;

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={8}>
          <Card size="small">
            <Statistic
              title="固件总数"
              value={firmwareList.length}
              prefix={<CloudUploadOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic
              title="升级中"
              value={inProgressCount}
              prefix={<ThunderboltOutlined spin />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic
              title="成功/失败"
              value={successCount}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
              suffix={
                <span style={{ fontSize: 14, color: '#8c8c8c' }}>
                  {failedCount > 0 && <><CloseCircleOutlined style={{ color: '#ff4d4f' }} /> {failedCount}</>}
                </span>
              }
            />
          </Card>
        </Col>
      </Row>

      <Card
        tabList={[
          { key: 'firmware', tab: '固件管理' },
          { key: 'jobs', tab: '升级任务' },
        ]}
        activeTabKey={tab}
        onTabChange={(k) => setTab(k as any)}
        extra={
          <Space>
            {tab === 'firmware' && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadModal(true)}>
                上传固件
              </Button>
            )}
            {tab === 'jobs' && (
              <Button type="primary" icon={<CloudUploadOutlined />} onClick={() => setBatchUpgradeModal(true)}>
                批量升级
              </Button>
            )}
            <Button icon={<ReloadOutlined />} onClick={() => { loadFirmware(); loadJobs(); }}>刷新</Button>
          </Space>
        }
      >
        {tab === 'firmware' ? (
          <Table
            rowKey="id"
            columns={fwColumns}
            dataSource={firmwareList}
            loading={firmwareLoading}
            pagination={{
              current: fPage, pageSize, total: fTotal,
              onChange: (p) => setFPage(p),
            }}
            locale={{ emptyText: <Empty description="暂无固件，点击右上角上传" /> }}
          />
        ) : (
          <Table
            rowKey="id"
            columns={jobColumns}
            dataSource={jobs}
            loading={jobsLoading}
            pagination={{
              current: jPage, pageSize, total: jTotal,
              onChange: (p) => setJPage(p),
            }}
            locale={{ emptyText: <Empty description="暂无升级任务" /> }}
          />
        )}
      </Card>

      <Modal title="上传固件" open={uploadModal} onCancel={() => setUploadModal(false)} footer={null} width={520}>
        <Form form={uploadForm} layout="vertical" onFinish={handleUpload}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="name" label="固件名称" rules={[{ required: true }]}>
                <Input placeholder="如：智能灯固件v2.1" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="version" label="版本号" rules={[{ required: true }]}>
                <Input placeholder="如：2.1.0" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="vendorId" label="厂商ID" rules={[{ required: true }]}>
                <Input placeholder="如：philips-hue" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="model" label="适用型号" rules={[{ required: true }]}>
                <Input placeholder="如：E27-Bulb" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="fileUrl" label="固件文件URL" rules={[{ required: true }]}>
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="description" label="更新说明">
            <Input.TextArea rows={3} placeholder="修复问题、新增功能..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>确认上传</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="批量升级" open={batchUpgradeModal} onCancel={() => setBatchUpgradeModal(false)} footer={null}>
        <Form form={batchForm} layout="vertical" onFinish={handleBatchUpgrade}>
          <Form.Item name="firmwareId" label="选择固件" rules={[{ required: true }]}>
            <Select placeholder="选择要升级的固件">
              {firmwareList.map((fw) => (
                <Option key={fw.id} value={fw.id}>{fw.name} - v{fw.version}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="deviceIds" label="选择设备" rules={[{ required: true }]}>
            <Select mode="multiple" placeholder="选择要升级的设备" showSearch optionFilterProp="children">
              {devices.map((d) => (
                <Option key={d.id} value={d.id} disabled={d.status !== 'online'}>
                  {d.name} ({d.status === 'online' ? '在线' : '离线'})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>开始升级</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OtaManagementPage;
