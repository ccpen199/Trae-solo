import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Spin, message, Button, Tag, Space, Divider, Row, Col } from 'antd';
import { ArrowLeftOutlined, FileTextOutlined, SafetyOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { LaborContract } from '../types';

const ContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<LaborContract | null>(null);

  const fetchContractDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.contracts.getDetail(parseInt(id));
      setContract(res.data);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取合同详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractDetail();
  }, [id]);

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      draft: '草稿',
      signed: '已签署',
      terminated: '已终止',
      expired: '已过期'
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      draft: 'orange',
      signed: 'green',
      terminated: 'red',
      expired: 'default'
    };
    return map[status] || 'default';
  };

  const getSalaryTypeText = (type: string) => {
    const map: Record<string, string> = {
      daily: '日薪',
      piece: '计件',
      monthly: '月薪'
    };
    return map[type] || type;
  };

  if (!contract) return null;

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/contracts')}
        style={{ marginBottom: '16px' }}
      >
        返回合同列表
      </Button>

      <Spin spinning={loading}>
        <Card
          title={
            <Space>
              <FileTextOutlined />
              劳动合同详情
              <Tag color={getStatusColor(contract.status)}>
                {getStatusText(contract.status)}
              </Tag>
            </Space>
          }
        >
          <Row gutter={24}>
            <Col xs={24} lg={12}>
              <Card title="合同基本信息" type="inner" style={{ marginBottom: '16px' }}>
                <Descriptions column={1} size="middle">
                  <Descriptions.Item label="合同编号">
                    {contract.contractNo}
                  </Descriptions.Item>
                  <Descriptions.Item label="合同类型">
                    {contract.contractType || '劳动合同'}
                  </Descriptions.Item>
                  <Descriptions.Item label="岗位名称">
                    {contract.jobTitle || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="工作地点">
                    {contract.workLocation || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="所属项目">
                    {contract.projectName || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card title="薪资待遇" type="inner" style={{ marginBottom: '16px' }}>
                <Descriptions column={1} size="middle">
                  <Descriptions.Item label="薪资标准">
                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#f5222d' }}>
                      ¥{contract.salaryAmount}
                    </span>
                    <Tag style={{ marginLeft: '8px' }}>
                      {getSalaryTypeText(contract.salaryType)}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="合同期限">
                    {contract.startDate} 至 {contract.endDate}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card title="签署状态" type="inner">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>工人签署：</span>
                    <Space>
                      <Tag color={contract.workerSigned ? 'green' : 'orange'}>
                        {contract.workerSigned ? '已签署' : '待签署'}
                      </Tag>
                      {contract.workerSignedAt && (
                        <span style={{ color: '#8c8c8c' }}>
                          {new Date(contract.workerSignedAt).toLocaleString('zh-CN')}
                        </span>
                      )}
                    </Space>
                  </div>
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>企业签署：</span>
                    <Space>
                      <Tag color={contract.enterpriseSigned ? 'green' : 'orange'}>
                        {contract.enterpriseSigned ? '已签署' : '待签署'}
                      </Tag>
                      {contract.enterpriseSignedAt && (
                        <span style={{ color: '#8c8c8c' }}>
                          {new Date(contract.enterpriseSignedAt).toLocaleString('zh-CN')}
                        </span>
                      )}
                    </Space>
                  </div>
                </Space>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="甲方（企业）信息" type="inner" style={{ marginBottom: '16px' }}>
                <Descriptions column={1} size="middle">
                  <Descriptions.Item label="企业名称">
                    {contract.companyName || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="统一社会信用代码">
                    {contract.unifiedCreditCode || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="联系电话">
                    {contract.enterprisePhone || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card title="乙方（工人）信息" type="inner" style={{ marginBottom: '16px' }}>
                <Descriptions column={1} size="middle">
                  <Descriptions.Item label="姓名">
                    {contract.workerName || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="身份证号">
                    {contract.workerIdCard || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="联系电话">
                    {contract.workerPhone || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {contract.jobDescription && (
                <Card title="岗位职责" type="inner" style={{ marginBottom: '16px' }}>
                  <p style={{ margin: 0, lineHeight: '1.8' }}>
                    {contract.jobDescription}
                  </p>
                </Card>
              )}

              {contract.contractContent && (
                <Card
                  title={
                    <Space>
                      <SafetyOutlined style={{ color: '#1890ff' }} />
                      合同条款
                    </Space>
                  }
                  type="inner"
                >
                  <div
                    style={{
                      maxHeight: '400px',
                      overflowY: 'auto',
                      padding: '16px',
                      background: '#fafafa',
                      borderRadius: '4px',
                      lineHeight: '2'
                    }}
                    dangerouslySetInnerHTML={{ __html: contract.contractContent }}
                  />
                </Card>
              )}
            </Col>
          </Row>
        </Card>
      </Spin>
    </div>
  );
};

export default ContractDetail;
