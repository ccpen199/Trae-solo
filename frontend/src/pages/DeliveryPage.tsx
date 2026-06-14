import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, message, Modal, Input, Form, Select, QRCode, Empty } from 'antd';
import { QrcodeOutlined, EyeOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import { useAppStore } from '../store';
import { deliveryApi, resumeApi, exportApi } from '../api';
import { DeliveryRecord } from '../types';
import dayjs from 'dayjs';

const { Option } = Select;

const DeliveryPage: React.FC = () => {
  const { deliveries, setDeliveries, resumes, setResumes } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRecord | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [deliveriesRes, resumesRes] = await Promise.all([
        deliveryApi.list(),
        resumeApi.list()
      ]);
      setDeliveries(deliveriesRes.records);
      setResumes(resumesRes.resumes);
    } catch (err: any) {
      message.error(err.error || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFailed = () => {
    message.warning('请完整填写简历、公司和职位信息');
  };

  const handleCreate = async (values: any) => {
    setCreateLoading(true);
    try {
      const res: any = await deliveryApi.create(values);
      message.success('投递码生成成功，请用微信扫码测试');
      setModalVisible(false);
      form.resetFields();
      loadData();
      
      Modal.success({
        title: '投递码已生成',
        width: 480,
        content: (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#f0f5ff', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <p style={{ margin: 0, fontWeight: 500 }}>{values.company} - {values.position}</p>
            </div>
            <QRCode value={res.delivery_url} size={200} level="H" />
            <p style={{ marginTop: 16, fontFamily: 'monospace', fontSize: 12, background: '#fafafa', padding: '8px 12px', borderRadius: 4 }}>
              追踪码：{res.tracking_code}
            </p>
            <p style={{ color: '#718096', fontSize: 13 }}>微信扫码即可查看简历，系统将自动记录查看时间</p>
            <Space style={{ marginTop: 16 }}>
              <Button
                onClick={() => {
                  Modal.destroyAll();
                }}
              >
                关闭
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  window.open(res.delivery_url, '_blank');
                }}
              >
                打开投递页面
              </Button>
            </Space>
          </div>
        )
      });
    } catch (err: any) {
      message.error(err.error || '生成失败，请稍后重试');
    } finally {
      setCreateLoading(false);
    }
  };

  const showQRCode = (record: DeliveryRecord) => {
    setSelectedDelivery(record);
    setQrModalVisible(true);
  };

  const columns = [
    {
      title: '公司',
      dataIndex: 'company',
      key: 'company',
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: '职位',
      dataIndex: 'position',
      key: 'position'
    },
    {
      title: '简历',
      dataIndex: 'resume_title',
      key: 'resume_title',
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '追踪码',
      dataIndex: 'tracking_code',
      key: 'tracking_code',
      render: (code: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{code}</span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          pending: { color: 'default', text: '待查看' },
          viewed: { color: 'success', text: '已查看' }
        };
        const info = statusMap[status] || { color: 'default', text: status };
        return <Tag color={info.color}>{info.text}</Tag>;
      }
    },
    {
      title: '投递时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '查看时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string, record: any) => {
        if (record.status === 'viewed') {
          return dayjs(date).format('YYYY-MM-DD HH:mm');
        }
        return <span style={{ color: '#aaa' }}>-</span>;
      }
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: DeliveryRecord) => (
        <Space>
          <Button
            type="text"
            icon={<QrcodeOutlined />}
            onClick={() => showQRCode(record)}
          >
            二维码
          </Button>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => window.open(`${import.meta.env.VITE_APP_URL || 'http://127.0.0.1:49067'}/delivery/${record.tracking_code}`, '_blank')}
          >
            预览
          </Button>
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={() => exportApi.downloadHTML(record.resume_id)}
          >
            下载简历
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>投递记录</h3>
          <p style={{ margin: '4px 0 0 0', color: '#718096' }}>
            共 {deliveries.length} 条投递记录 · 已查看 {deliveries.filter(d => d.status === 'viewed').length} 份
          </p>
        </div>
        <Button type="primary" icon={<QrcodeOutlined />} onClick={() => {
          if (resumes.length === 0) {
            message.warning('请先创建一份简历');
            return;
          }
          setModalVisible(true);
        }}>
          生成投递码
        </Button>
      </div>

      <Card>
        {deliveries.length === 0 ? (
          <Empty
            description="还没有投递记录"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <p style={{ color: '#718096', marginBottom: 16 }}>生成投递码后，可通过微信扫码将简历发送给HR</p>
            <Button type="primary" onClick={() => {
              if (resumes.length === 0) {
                message.warning('请先创建一份简历');
                return;
              }
              setModalVisible(true);
            }}>
              生成第一个投递码
            </Button>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={deliveries}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
          />
        )}
      </Card>

      <Modal
        title="生成投递码"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} onFinish={handleCreate} onFinishFailed={handleCreateFailed} layout="vertical">
          <Form.Item
            label="选择简历"
            name="resume_id"
            rules={[{ required: true, message: '请选择简历' }]}
          >
            <Select placeholder="请选择要投递的简历" disabled={createLoading}>
              {resumes.map((resume) => (
                <Option key={resume.id} value={resume.id}>
                  {resume.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="投递公司"
            name="company"
            rules={[
              { required: true, message: '请输入公司名称' },
              { min: 2, message: '公司名称至少2个字符' }
            ]}
          >
            <Input placeholder="例如：字节跳动" disabled={createLoading} />
          </Form.Item>
          <Form.Item
            label="投递职位"
            name="position"
            rules={[
              { required: true, message: '请输入职位名称' },
              { min: 2, message: '职位名称至少2个字符' }
            ]}
          >
            <Input placeholder="例如：前端开发工程师" disabled={createLoading} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={createLoading}>
              生成微信投递码
            </Button>
          </Form.Item>
        </Form>
        <div style={{ background: '#f0f5ff', padding: 12, borderRadius: 8, color: '#1677ff', fontSize: 13 }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          生成的投递码可使用微信扫码查看，系统会自动记录简历被查看的时间
        </div>
      </Modal>

      <Modal
        title="投递二维码"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={null}
        width={420}
      >
        {selectedDelivery && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#f0f5ff', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{selectedDelivery.company}</p>
              <p style={{ margin: '4px 0 0 0', color: '#718096' }}>{selectedDelivery.position}</p>
            </div>
            <QRCode 
              value={`${import.meta.env.VITE_APP_URL || 'http://127.0.0.1:49067'}/delivery/${selectedDelivery.tracking_code}`} 
              size={200} 
              level="H" 
            />
            <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#718096', marginTop: 16, background: '#fafafa', padding: '8px 12px', borderRadius: 4 }}>
              追踪码：{selectedDelivery.tracking_code}
            </p>
            <div style={{ marginTop: 8, fontSize: 13, color: '#718096' }}>
              状态：<Tag color={selectedDelivery.status === 'viewed' ? 'success' : 'default'}>
                {selectedDelivery.status === 'viewed' ? '已查看' : '待查看'}
              </Tag>
              {selectedDelivery.status === 'viewed' && selectedDelivery.updated_at && (
                <span style={{ marginLeft: 8 }}>
                  查看时间：{dayjs(selectedDelivery.updated_at).format('YYYY-MM-DD HH:mm')}
                </span>
              )}
            </div>
            <Space style={{ marginTop: 16 }}>
              <Button onClick={() => exportApi.preview(selectedDelivery.resume_id)}>
                预览简历
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  const url = `${import.meta.env.VITE_APP_URL || 'http://127.0.0.1:49067'}/delivery/${selectedDelivery.tracking_code}`;
                  window.open(url, '_blank');
                }}
              >
                打开投递页面
              </Button>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DeliveryPage;
