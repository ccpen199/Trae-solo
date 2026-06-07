import React, { useState } from 'react';
import { Card, Row, Col, Button, message, Input, Modal, Tag } from 'antd';
import { TrophyOutlined, PlusOutlined } from '@ant-design/icons';
import api from '../utils/api';

const { TextArea } = Input;

function DigitalStamp() {
  const [stampModalVisible, setStampModalVisible] = useState(false);
  const [nftModalVisible, setNftModalVisible] = useState(false);
  const [stampDesign, setStampDesign] = useState('');
  const [nftForm, setNftForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleIssueStamp = async () => {
    setLoading(true);
    try {
      const response = await api.post('/admin/stamps/issue', { design: stampDesign });
      message.success(`电子邮戳签发成功！邮戳编号：${response.data.stamp_code}`);
      setStampModalVisible(false);
      setStampDesign('');
    } catch (error) {
      message.error(error.response?.data?.error || '签发失败');
    }
    setLoading(false);
  };

  const handleMintNFT = async () => {
    if (!nftForm.name) {
      message.warning('请输入藏品名称');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/admin/nft/mint', nftForm);
      message.success(`数字藏品铸造成功！Token ID：${response.data.token_id}`);
      setNftModalVisible(false);
      setNftForm({ name: '', description: '' });
    } catch (error) {
      message.error(error.response?.data?.error || '铸造失败');
    }
    setLoading(false);
  };

  const features = [
    {
      icon: <TrophyOutlined style={{ fontSize: 48, color: '#006633' }} />,
      title: '电子邮戳',
      desc: '区块链存证的电子签章，具有法律效力',
      action: () => setStampModalVisible(true)
    },
    {
      icon: <TrophyOutlined style={{ fontSize: 48, color: '#722ed1' }} />,
      title: '数字藏品',
      desc: '限量版邮品NFT，唯一编号，永久保存',
      action: () => setNftModalVisible(true)
    }
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>数字邮戳与藏品</h1>

      <Row gutter={[24, 24]}>
        {features.map((item, index) => (
          <Col span={12} key={index}>
            <Card hoverable onClick={item.action} style={{ height: 200, cursor: 'pointer' }}>
              <div style={{ textAlign: 'center', paddingTop: 24 }}>
                {item.icon}
                <h3 style={{ marginTop: 16, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ color: '#666' }}>{item.desc}</p>
                <Button type="primary" style={{ marginTop: 16 }}>
                  <PlusOutlined /> 立即体验
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="关于数字藏品" style={{ marginTop: 24 }}>
        <p>中国邮政数字藏品平台利用区块链技术，将传统邮品文化与现代数字技术相结合。每一件数字藏品都拥有唯一的链上标识，确保其稀缺性和可追溯性。</p>
        <div style={{ marginTop: 16 }}>
          <Tag color="green">区块链存证</Tag>
          <Tag color="blue">唯一编号</Tag>
          <Tag color="purple">限量发行</Tag>
          <Tag color="orange">永久保存</Tag>
        </div>
      </Card>

      <Modal
        title="签发电子邮戳"
        open={stampModalVisible}
        onCancel={() => setStampModalVisible(false)}
        footer={null}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ height: 150, background: 'linear-gradient(135deg, #006633 0%, #00994d 100%)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: 'white' }}>
              <TrophyOutlined style={{ fontSize: 48 }} />
              <div style={{ marginTop: 8 }}>中国邮政电子邮戳</div>
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>邮戳寄语（选填）</label>
          <TextArea
            rows={3}
            value={stampDesign}
            onChange={(e) => setStampDesign(e.target.value)}
            placeholder="请输入邮戳寄语..."
          />
        </div>
        <Button
          type="primary"
          block
          onClick={handleIssueStamp}
          loading={loading}
        >
          立即签发
        </Button>
      </Modal>

      <Modal
        title="铸造数字藏品"
        open={nftModalVisible}
        onCancel={() => setNftModalVisible(false)}
        footer={null}
      >
        <div style={{ marginBottom: 16 }}>
          <label>藏品名称 *</label>
          <Input
            value={nftForm.name}
            onChange={(e) => setNftForm({ ...nftForm, name: e.target.value })}
            placeholder="请输入藏品名称"
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>藏品描述</label>
          <TextArea
            rows={3}
            value={nftForm.description}
            onChange={(e) => setNftForm({ ...nftForm, description: e.target.value })}
            placeholder="请输入藏品描述..."
          />
        </div>
        <Button
          type="primary"
          block
          onClick={handleMintNFT}
          loading={loading}
        >
          立即铸造
        </Button>
      </Modal>
    </div>
  );
}

export default DigitalStamp;
