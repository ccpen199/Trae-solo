import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Tag,
  Button,
  message,
  Steps,
  Descriptions,
  Divider,
  Alert,
  Modal,
  Spin
} from 'antd';
import {
  EditOutlined,
  CheckCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signingApi, contractApi, sealApi, authApi } from '../utils/api';
import dayjs from 'dayjs';

const SigningList = () => {
  const navigate = useNavigate();
  const [pendingSignatures, setPendingSignatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingSignatures();
  }, []);

  const fetchPendingSignatures = async () => {
    try {
      setLoading(true);
      const response = await signingApi.getPending();
      if (response.data.success) {
        setPendingSignatures(response.data.data.pendingSignatures || []);
      }
    } catch (error) {
      message.error('获取待签署列表失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">待我签署</h1>
        <p style={{ color: '#666', margin: '8px 0 0 0' }}>
          共 {pendingSignatures.length} 份合同待签署
        </p>
      </div>

      <div className="card-container">
        {pendingSignatures.length > 0 ? (
          <List
            dataSource={pendingSignatures}
            loading={loading}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/signing/${item.contractId}?signerId=${item.signerId}`)}
                  >
                    去签署
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<FileTextOutlined style={{ fontSize: 24, color: '#667eea' }} />}
                  title={
                    <span style={{ fontSize: 16 }}>
                      {item.title}
                      <Tag color="orange" style={{ marginLeft: 12 }}>待签署</Tag>
                    </span>
                  }
                  description={
                    <span style={{ color: '#666' }}>
                      {item.initialTimestamp && 
                        `发起时间: ${dayjs(item.initialTimestamp).format('YYYY-MM-DD HH:mm')}`
                      }
                      {!item.identityVerified && (
                        <span style={{ marginLeft: 16, color: '#fa8c16' }}>
                          * 需要先完成身份核验
                        </span>
                      )}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
            <CheckCircleOutlined style={{ fontSize: 64, marginBottom: 16 }} />
            <p style={{ fontSize: 16, marginBottom: 8 }}>暂无待签署合同</p>
            <p>您已完成所有待签署的合同</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SigningDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const signerId = searchParams.get('signerId');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [contract, setContract] = useState(null);
  const [signer, setSigner] = useState(null);
  const [availableSeals, setAvailableSeals] = useState([]);
  const [selectedSeal, setSelectedSeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [signing, setSigning] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [signatureResult, setSignatureResult] = useState(null);

  useEffect(() => {
    if (id && signerId) {
      fetchData();
    }
  }, [id, signerId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const contractRes = await contractApi.get(id);
      
      if (contractRes.data.success) {
        setContract(contractRes.data.data.contract);
        const signers = contractRes.data.data.signers || [];
        const currentSigner = signers.find(s => s.id === signerId);
        
        if (currentSigner) {
          setSigner(currentSigner);
          setIdentityVerified(currentSigner.identityVerified);
          setCurrentStep(currentSigner.identityVerified ? 1 : 0);
        }
      }
    } catch (error) {
      message.error('获取合同信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyIdentity = async () => {
    try {
      setLoading(true);
      const response = await signingApi.verifyIdentity({
        contractId: id,
        signerId
      });
      
      if (response.data.success) {
        message.success('身份核验通过');
        setIdentityVerified(true);
        setCurrentStep(1);
        setAvailableSeals(response.data.data.availableSeals || []);
        setSelectedSeal(response.data.data.recommendedSeal);
      }
    } catch (error) {
      message.error(error.response?.data?.message || '身份核验失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!selectedSeal) {
      message.error('请选择印章');
      return;
    }

    try {
      setSigning(true);
      const response = await signingApi.sign({
        contractId: id,
        signerId,
        sealId: selectedSeal.sealId
      });
      
      if (response.data.success) {
        setSignatureResult(response.data.data);
        setShowSuccessModal(true);
      }
    } catch (error) {
      message.error(error.response?.data?.message || '签署失败');
    } finally {
      setSigning(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'draft': { text: '草稿', color: 'default' },
      'pending_signature': { text: '待签署', color: 'orange' },
      'signing': { text: '签署中', color: 'processing' },
      'completed': { text: '已完成', color: 'success' }
    };
    const info = statusMap[status] || { text: status, color: 'default' };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const steps = [
    {
      title: '身份核验',
      description: '验证签署人身份真实性'
    },
    {
      title: '选择印章',
      description: '选择要使用的印章'
    },
    {
      title: '确认签署',
      description: '确认并完成签署'
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!contract || !signer) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        合同或签署方信息不存在
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Button
            type="link"
            onClick={() => navigate('/signing')}
            style={{ padding: 0, marginBottom: 8 }}
          >
            ← 返回列表
          </Button>
          <h1 className="page-title" style={{ margin: 0 }}>签署合同</h1>
        </div>
        {getStatusTag(contract.status)}
      </div>

      <Card className="card-container" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 24 }}>合同信息</h3>
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="合同标题">{contract.title}</Descriptions.Item>
          <Descriptions.Item label="合同ID">{contract.id}</Descriptions.Item>
          <Descriptions.Item label="签署方">
            <UserOutlined style={{ marginRight: 8 }} />
            {signer.userName}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(contract.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="文件哈希" span={2}>
            <div className="hash-display">{contract.fileHash}</div>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card className="card-container" style={{ marginBottom: 24 }}>
        <Steps
          current={currentStep}
          items={steps}
          className="progress-steps"
        />
      </Card>

      {currentStep === 0 && (
        <Card className="card-container">
          <Alert
            message="身份核验"
            description="在签署合同之前，需要先完成身份核验，确保签署人的身份真实性。"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          
          <Descriptions bordered size="small" style={{ marginBottom: 24 }}>
            <Descriptions.Item label="用户">{user?.realName || user?.username}</Descriptions.Item>
            <Descriptions.Item label="签署方">{signer.userName}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{signer.email || '未设置'}</Descriptions.Item>
          </Descriptions>
          
          <Button
            type="primary"
            size="large"
            onClick={handleVerifyIdentity}
            loading={loading}
          >
            开始身份核验
          </Button>
        </Card>
      )}

      {currentStep === 1 && (
        <Card className="card-container">
          <h3 style={{ marginBottom: 24 }}>选择印章</h3>
          
          {availableSeals.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
              {availableSeals.map(seal => (
                <div
                  key={seal.sealId}
                  className={`seal-card ${selectedSeal?.sealId === seal.sealId ? 'selected' : ''}`}
                  onClick={() => setSelectedSeal(seal)}
                  style={{ width: 180 }}
                >
                  <div className="seal-image">
                    <SafetyCertificateOutlined style={{ fontSize: 60, color: '#C41E3A' }} />
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{seal.sealName}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {seal.sealType === 'personal' ? '个人印章' : '公章'}
                  </div>
                  {selectedSeal?.sealId === seal.sealId && (
                    <CheckCircleOutlined style={{ color: '#52c41a', marginTop: 8 }} />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Alert
              message="暂无可用印章"
              description="系统将自动为您创建一个默认印章"
              type="warning"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}
          
          <Divider />
          
          <div style={{ display: 'flex', gap: 16 }}>
            <Button onClick={() => setCurrentStep(0)}>
              上一步
            </Button>
            <Button
              type="primary"
              onClick={() => setCurrentStep(2)}
              disabled={!selectedSeal}
            >
              下一步
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 2 && (
        <Card className="card-container">
          <h3 style={{ marginBottom: 24 }}>确认签署</h3>
          
          <Alert
            message="签署确认"
            description={
              <div>
                <p>请仔细阅读并确认以下内容：</p>
                <ul style={{ margin: '8px 0 0 20px' }}>
                  <li>您确认是本人自愿签署此合同</li>
                  <li>您已阅读并理解合同内容</li>
                  <li>您同意使用所选印章进行签署</li>
                </ul>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />
          
          <Descriptions bordered size="small" style={{ marginBottom: 24 }}>
            <Descriptions.Item label="合同标题">{contract.title}</Descriptions.Item>
            <Descriptions.Item label="签署方">{signer.userName}</Descriptions.Item>
            <Descriptions.Item label="使用印章">{selectedSeal?.sealName}</Descriptions.Item>
            <Descriptions.Item label="印章类型">
              {selectedSeal?.sealType === 'personal' ? '个人印章' : '公章'}
            </Descriptions.Item>
          </Descriptions>
          
          <Divider />
          
          <div style={{ display: 'flex', gap: 16 }}>
            <Button onClick={() => setCurrentStep(1)}>
              上一步
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={handleSign}
              loading={signing}
              icon={<SafetyCertificateOutlined />}
            >
              确认签署
            </Button>
          </div>
        </Card>
      )}

      <Modal
        title="签署成功"
        open={showSuccessModal}
        footer={[
          <Button key="back" onClick={() => navigate('/signing')}>
            返回列表
          </Button>,
          <Button
            key="detail"
            type="primary"
            onClick={() => navigate(`/contracts/${id}`)}
          >
            查看合同详情
          </Button>
        ]}
        width={600}
      >
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
          <h3 style={{ marginBottom: 8 }}>签署成功！</h3>
          <p style={{ color: '#666', marginBottom: 24 }}>
            您已成功签署此合同
          </p>
        </div>
        
        <Descriptions bordered size="small">
          <Descriptions.Item label="签署时间">
            {signatureResult?.signedAt ? dayjs(signatureResult.signedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="合同状态">
            <Tag color={signatureResult?.allSigned ? 'success' : 'processing'}>
              {signatureResult?.allSigned ? '已完成' : '签署中'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="签名哈希" span={2}>
            <div className="hash-display">{signatureResult?.signature}</div>
          </Descriptions.Item>
          <Descriptions.Item label="时间戳令牌" span={2}>
            <div className="hash-display">{signatureResult?.timeToken}</div>
          </Descriptions.Item>
          {signatureResult?.certificateId && (
            <Descriptions.Item label="证书编号" span={2}>
              <SafetyCertificateOutlined style={{ marginRight: 8, color: '#52c41a' }} />
              {signatureResult.certificateId}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Modal>
    </div>
  );
};

export { SigningList, SigningDetail };
