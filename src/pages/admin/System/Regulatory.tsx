import React, { useEffect, useState } from 'react';
import {
  Card,
  Form,
  Input,
  Switch,
  Button,
  Table,
  message,
  Space,
  Tag,
  Row,
  Col,
  Statistic,
  Descriptions,
} from 'antd';
import {
  SaveOutlined,
  SyncOutlined,
  ReloadOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { adminApi } from '@/services/admin';
import { formatDateTime } from '@/utils/format';
import type { ColumnsType } from 'antd/es/table';

const syncStatusMap: Record<number, { text: string; color: string }> = {
  0: { text: '同步中', color: '#165DFF' },
  1: { text: '成功', color: '#00B42A' },
  2: { text: '失败', color: '#F53F3F' },
};

const Regulatory: React.FC = () => {
  const [form] = Form.useForm();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const loadConfig = async () => {
    try {
      const res: any = await adminApi.getRegulatoryConfig();
      if (res.code === 0) {
        setConfig(res.data);
        form.setFieldsValue(res.data);
      }
    } catch (error) {
      console.error('加载配置失败');
    }
  };

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res: any = await adminApi.getSyncRecords({
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      if (res.code === 0) {
        setData(res.data.list);
        setTotal(res.data.total);
      }
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
    loadRecords();
  }, [pagination]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const res: any = await adminApi.updateRegulatoryConfig(values);
      if (res.code === 0) {
        message.success('配置保存成功');
        loadConfig();
      }
    } catch (error) {
      console.error('保存失败');
    }
  };

  const handleSync = async (type: string) => {
    setSyncLoading(true);
    try {
      const res: any = await adminApi.syncToRegulatory(type);
      if (res.code === 0) {
        message.success(`同步任务已启动，同步ID：${res.data.syncId}`);
        loadRecords();
      }
    } catch (error) {
      message.error('同步失败');
    } finally {
      setSyncLoading(false);
    }
  };

  const columns: ColumnsType<any> = [
    { title: '同步ID', dataIndex: 'syncId', width: 180 },
    { title: '数据类型', dataIndex: 'typeName', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s) => (
        <Tag color={syncStatusMap[s]?.color}>
          {syncStatusMap[s]?.text}
        </Tag>
      ),
    },
    { title: '记录数', dataIndex: 'recordCount', width: 100 },
    { title: '成功数', dataIndex: 'successCount', width: 100 },
    { title: '失败数', dataIndex: 'failCount', width: 100 },
    { title: '操作时间', dataIndex: 'startTime', width: 160, render: (t) => formatDateTime(t) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">监管接口配置</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { loadConfig(); loadRecords(); }}>
            刷新
          </Button>
        </Space>
      </div>

      <Card title="省级能源监管平台配置" className="shadow-sm">
        <Form form={form} layout="vertical">
          <Row gutter={[24, 0]}>
            <Col xs={24} lg={12}>
              <Form.Item
                name="platformName"
                label="平台名称"
                rules={[{ required: true, message: '请输入平台名称' }]}
              >
                <Input placeholder="请输入平台名称" />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                name="apiUrl"
                label="API地址"
                rules={[{ required: true, message: '请输入API地址' }]}
              >
                <Input placeholder="请输入API地址" />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                name="appId"
                label="AppID"
                rules={[{ required: true, message: '请输入AppID' }]}
              >
                <Input placeholder="请输入AppID" />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                name="appSecret"
                label="AppSecret"
                rules={[{ required: true, message: '请输入AppSecret' }]}
              >
                <Input.Password placeholder="请输入AppSecret" />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                name="dataSyncEnabled"
                label="是否自动同步"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                name="autoSyncInterval"
                label="同步间隔(分钟)"
              >
                <Input type="number" placeholder="请输入同步间隔" min={1} />
              </Form.Item>
            </Col>
          </Row>

          {config && (
            <Descriptions column={2} size="small" className="mb-4">
              <Descriptions.Item label="上次同步时间">
                {config.lastSyncTime || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="上次同步状态">
                {config.lastSyncStatus !== undefined ? (
                  <Tag color={syncStatusMap[config.lastSyncStatus]?.color}>
                    {syncStatusMap[config.lastSyncStatus]?.text}
                  </Tag>
                ) : '-'}
              </Descriptions.Item>
            </Descriptions>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                保存配置
              </Button>
              <Button
                type="primary"
                icon={<SyncOutlined />}
                loading={syncLoading}
                onClick={() => handleSync('payment')}
              >
                手动同步(缴费数据)
              </Button>
              <Button
                icon={<SyncOutlined />}
                loading={syncLoading}
                onClick={() => handleSync('user')}
              >
                手动同步(用户数据)
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic
              title="总同步次数"
              value={total}
              valueStyle={{ color: '#165DFF' }}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic
              title="成功次数"
              value={data.filter((d) => d.status === 1).length}
              valueStyle={{ color: '#00B42A' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic
              title="失败次数"
              value={data.filter((d) => d.status === 2).length}
              valueStyle={{ color: '#F53F3F' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic
              title="同步中"
              value={data.filter((d) => d.status === 0).length}
              valueStyle={{ color: '#FF7D00' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="同步记录" className="shadow-sm">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (current, pageSize) => setPagination({ current, pageSize }),
          }}
        />
      </Card>
    </div>
  );
};

export default Regulatory;
