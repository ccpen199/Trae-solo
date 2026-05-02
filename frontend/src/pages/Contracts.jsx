import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Upload,
  Card,
  Steps,
  Divider,
  Descriptions,
  List,
  Timeline,
  Statistic
} from 'antd';
import {
  UploadOutlined,
  PlusOutlined,
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { contractApi, sealApi, signingApi } from '../utils/api';
import dayjs from 'dayjs';

const ContractList = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [signerCount, setSignerCount] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await contractApi.list();
      if (response.data.success) {
        setContracts(response.data.data.contracts || []);
      }
    } catch (error) {
      message.error('获取合同列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'draft': { text: '草稿', color: 'default' },
      'pending_signature': { text: '待签署', color: 'orange' },
      'signing': { text: '签署中', color: 'processing' },
      'completed': { text: '已完成', color: 'success' },
      'rejected': { text: '已拒绝', color: 'error' }
    };
    
    const info = statusMap[status] || { text: status, color: 'default' };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    {
      title: '合同标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <a onClick={() => navigate(`/contracts/${record.id}`)}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          {text}
        </a>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: '签署进度',
      key: 'progress',
      render: (_, record) => (
        <span>
          {record.signedCount}/{record.totalSigners}
          <span style={{ marginLeft: 8, color: '#999' }}>人已签署</span>
        </span>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/contracts/${record.id}`)}
          >
            详情
          </Button>
          {record.status === 'completed' && (
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record.id, record.title)}
            >
              下载
            </Button>
          )}
        </Space>
      )
    }
  ];

  const handleDownload = async (id, title) => {
    try {
      const response = await contractApi.download(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('下载成功');
    } catch (error) {
      message.error('下载失败');
    }
  };

  const handleUpload = async (values) => {
    if (fileList.length === 0) {
      message.error('请选择要上传的文件');
      return;
    }

    const formData = new FormData();
    formData.append('file', fileList[0].originFileObj);
    formData.append('title', values.title);
    
    const signers = [];
    for (let i = 1; i <= signerCount; i++) {
      if (values[`signerName${i}`] || values[`signerEmail${i}`]) {
        signers.push({
          userName: values[`signerName${i}`],
          email: values[`signerEmail${i}`]
        });
      }
    }
    formData.append('signers', JSON.stringify(signers));

    try {
      setUploading(true);
      const response = await contractApi.upload(formData);
      
      if (response.data.success) {
        message.success('合同上传成功');
        setUploadModalVisible(false);
        form.resetFields();
        setFileList([]);
        setSignerCount(1);
        fetchContracts();
      } else {
        message.error(response.data.message || '上传失败');
      }
    } catch (error) {
      message.error(error.response?.data?.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const uploadProps = {
    fileList,
    beforeUpload: (file) => {
      setFileList([{
        uid: file.uid,
        name: file.name,
        originFileObj: file
      }]);
      return false;
    },
    onRemove: () => {
      setFileList([]);
    }
  };

  const renderSignerFields = () => {
    const fields = [];
    for (let i = 1; i <= signerCount; i++) {
      fields.push(
        <Divider key={i}>{`签署方 ${i}`}</Divider>,
        <Form.Item
          key={`name${i}`}
          name={`signerName${i}`}
          label="姓名"
          rules={[{ required: true, message: '请输入签署方姓名' }]}
        >
          <Input placeholder="签署方姓名" />
        </Form.Item>,
        <Form.Item
          key={`email${i}`}
          name={`signerEmail${i}`}
          label="邮箱"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入正确的邮箱格式' }
          ]}
        >
          <Input placeholder="签署方邮箱" />
        </Form.Item>
      );
    }
    return fields;
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">合同管理</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setUploadModalVisible(true)}
        >
          上传合同
        </Button>
      </div>

      <div className="card-container">
        <Table
          columns={columns}
          dataSource={contracts}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        title="上传新合同"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          form.resetFields();
          setFileList([]);
          setSignerCount(1);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpload}
        >
          <Form.Item
            name="title"
            label="合同标题"
            rules={[{ required: true, message: '请输入合同标题' }]}
          >
            <Input placeholder="请输入合同标题" />
          </Form.Item>

          <Form.Item
            label="上传文件"
            rules={[{ required: true, message: '请选择要上传的文件' }]}
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>选择文件 (PDF/Word/Txt)</Button>
            </Upload>
            {fileList.length > 0 && (
              <p style={{ marginTop: 8, color: '#52c41a' }}>
                已选择: {fileList[0].name}
              </p>
            )}
          </Form.Item>

          <Divider />

          <Form.Item label="签署方数量">
            <Select
              value={signerCount}
              onChange={setSignerCount}
              style={{ width: 120 }}
            >
              {[1, 2, 3, 4, 5].map(n => (
                <Select.Option key={n} value={n}>{n} 人</Select.Option>
              ))}
            </Select>
          </Form.Item>

          {renderSignerFields()}

          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={uploading}
              >
                上传并发起签署
              </Button>
              <Button onClick={() => {
                setUploadModalVisible(false);
                form.resetFields();
                setFileList([]);
                setSignerCount(1);
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const ContractDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [signers, setSigners] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchContractDetail();
    }
  }, [id]);

  const fetchContractDetail = async () => {
    try {
      setLoading(true);
      const [contractRes, logRes] = await Promise.all([
        contractApi.get(id),
        contractApi.getActivityLog(id)
      ]);
      
      if (contractRes.data.success) {
        setContract(contractRes.data.data.contract);
        setSigners(contractRes.data.data.signers);
      }
      
      if (logRes.data.success) {
        setActivityLog(logRes.data.data.logs || []);
      }
    } catch (error) {
      message.error('获取合同详情失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'draft': { text: '草稿', color: 'default' },
      'pending_signature': { text: '待签署', color: 'orange' },
      'signing': { text: '签署中', color: 'processing' },
      'completed': { text: '已完成', color: 'success' },
      'rejected': { text: '已拒绝', color: 'error' }
    };
    
    const info = statusMap[status] || { text: status, color: 'default' };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getSignStatusTag = (status) => {
    const statusMap = {
      'pending': { text: '待签署', color: 'orange' },
      'signed': { text: '已签署', color: 'success' },
      'rejected': { text: '已拒绝', color: 'error' }
    };
    
    const info = statusMap[status] || { text: status, color: 'default' };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const handleDownload = async () => {
    if (!contract) return;
    try {
      const response = await contractApi.download(contract.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${contract.title}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('下载成功');
    } catch (error) {
      message.error('下载失败');
    }
  };

  const getStepStatus = () => {
    if (!contract) return [];
    
    const steps = [
      {
        title: '合同创建',
        description: contract.createdAt ? dayjs(contract.createdAt).format('YYYY-MM-DD HH:mm') : '-',
        status: 'finish'
      },
      {
        title: '时间戳锁定',
        description: contract.initialTimestamp ? dayjs(contract.initialTimestamp).format('YYYY-MM-DD HH:mm') : '-',
        status: contract.initialTimestamp ? 'finish' : 'wait'
      },
      {
        title: '签署中',
        description: `${signers.filter(s => s.signStatus === 'signed').length}/${signers.length} 人已签署`,
        status: signers.every(s => s.signStatus === 'signed') ? 'finish' : 'process'
      },
      {
        title: '完成',
        description: contract.status === 'completed' ? '合同已生效' : '待所有签署方完成',
        status: contract.status === 'completed' ? 'finish' : 'wait'
      }
    ];
    
    return steps;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px' }}>加载中...</div>;
  }

  if (!contract) {
    return <div style={{ textAlign: 'center', padding: '100px' }}>合同不存在</div>;
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Button
            type="link"
            onClick={() => navigate('/contracts')}
            style={{ padding: 0, marginBottom: 8 }}
          >
            ← 返回列表
          </Button>
          <h1 className="page-title" style={{ margin: 0 }}>{contract.title}</h1>
        </div>
        <Space>
          {contract.status === 'completed' && (
            <Button icon={<DownloadOutlined />} onClick={handleDownload}>
              下载合同
            </Button>
          )}
        </Space>
      </div>

      <Card className="card-container" style={{ marginBottom: 24 }}>
        <Steps
          items={getStepStatus()}
          className="progress-steps"
        />
      </Card>

      <div className="card-container" style={{ marginBottom: 24 }}>
        <Descriptions title="合同信息" bordered column={2}>
          <Descriptions.Item label="合同ID">{contract.id}</Descriptions.Item>
          <Descriptions.Item label="状态">{getStatusTag(contract.status)}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(contract.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="文件哈希">
            <div className="hash-display">{contract.fileHash}</div>
          </Descriptions.Item>
          {contract.initialTimestamp && (
            <Descriptions.Item label="时间戳">
              {dayjs(contract.initialTimestamp).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          )}
          {contract.certificateId && (
            <Descriptions.Item label="证书编号">
              <SafetyCertificateOutlined style={{ marginRight: 8, color: '#52c41a' }} />
              {contract.certificateId}
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>

      <Card title="签署方信息" className="card-container" style={{ marginBottom: 24 }}>
        <List
          dataSource={signers}
          renderItem={(signer) => (
            <List.Item
              actions={[
                getSignStatusTag(signer.signStatus)
              ]}
            >
              <List.Item.Meta
                avatar={<UserOutlined />}
                title={signer.userName}
                description={
                  <span>
                    {signer.email && <span>邮箱: {signer.email} | </span>}
                    {signer.identityVerified ? (
                      <span style={{ color: '#52c41a' }}><CheckCircleOutlined /> 已实名认证</span>
                    ) : (
                      <span style={{ color: '#fa8c16' }}><ClockCircleOutlined /> 待身份核验</span>
                    )}
                    {signer.signedAt && (
                      <span style={{ marginLeft: 16, color: '#999' }}>
                        签署时间: {dayjs(signer.signedAt).format('YYYY-MM-DD HH:mm')}
                      </span>
                    )}
                  </span>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {activityLog.length > 0 && (
        <Card title="操作日志" className="card-container">
          <Timeline>
            {activityLog.map((log, index) => (
              <Timeline.Item
                key={log.id}
                color={log.action.includes('签署') ? 'green' : 'blue'}
              >
                <div className="timeline-item">
                  <div className="action">{log.action}</div>
                  <div className="operator">{log.userName}</div>
                  <div className="time">{dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}</div>
                  {log.description && (
                    <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
                      {log.description}
                    </div>
                  )}
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      )}
    </div>
  );
};

export { ContractList, ContractDetail };
