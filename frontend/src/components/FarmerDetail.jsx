import { useState, useEffect } from 'react';
import { Descriptions, Tag, Card, Table, Divider, Progress, Button, Drawer, message, Row, Col, Statistic, Alert, Space } from 'antd';
import { ScanOutlined, BankOutlined, RiseOutlined, SafetyOutlined, CalculatorOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import request from '../utils/request';

const plantTags = {
  '水稻': { color: 'green', value: 1.0 },
  '小麦': { color: 'gold', value: 0.8 },
  '玉米': { color: 'orange', value: 0.9 },
  '大豆': { color: 'cyan', value: 0.7 },
  '蔬菜': { color: 'lime', value: 1.5 },
  '水果': { color: 'pink', value: 1.8 },
  '茶叶': { color: 'green', value: 1.6 },
  '药材': { color: 'purple', value: 2.0 },
};

const breedTags = {
  '生猪': { color: 'red', value: 1.5 },
  '牛': { color: 'geekblue', value: 2.5 },
  '羊': { color: 'magenta', value: 1.0 },
  '鸡': { color: 'orange', value: 0.3 },
  '鸭': { color: 'volcano', value: 0.4 },
  '鱼': { color: 'blue', value: 0.8 },
};

export default function FarmerDetail({ farmer, open, onClose, onUpdate }) {
  const navigate = useNavigate();
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState(null);
  const [creditInfo, setCreditInfo] = useState(null);

  useEffect(() => {
    if (farmer) {
      const landArea = parseFloat(farmer.landArea) || 0;
      const plantScore = (farmer.plantTags || []).reduce((sum, t) => sum + (plantTags[t]?.value || 0.5), 0);
      const breedScore = (farmer.breedTags || []).reduce((sum, t) => sum + (breedTags[t]?.value || 0.5), 0);
      const hasOcr = farmer.ocrStatus === '已识别';
      const baseCredit = landArea * 30000;
      const tagMultiplier = 1 + (plantScore + breedScore) * 0.1;
      const ocrBonus = hasOcr ? 1.2 : 1.0;
      const maxCredit = Math.min(Math.round(baseCredit * tagMultiplier * ocrBonus / 10000), 50);
      const eligibleProducts = [];
      if (maxCredit >= 5) eligibleProducts.push({ name: '惠农信用贷', maxAmount: Math.min(maxCredit, 50), type: 'credit' });
      if (landArea >= 3) eligibleProducts.push({ name: '农机购置贷', maxAmount: 30, type: 'machine' });
      if ((farmer.plantTags || []).length > 0 || (farmer.breedTags || []).length > 0) {
        eligibleProducts.push({ name: '农业种植险', maxAmount: 20, type: 'insurance' });
      }
      const industryValue = Math.round(landArea * 8000 * (1 + (plantScore + breedScore) * 0.15));
      setCreditInfo({
        landArea,
        plantScore,
        breedScore,
        hasOcr,
        baseCredit,
        tagMultiplier,
        ocrBonus,
        maxCredit,
        eligibleProducts,
        industryValue,
        industryCategory: plantScore > breedScore ? '种植主导' : breedScore > plantScore ? '养殖主导' : '综合经营',
        riskLevel: landArea >= 10 ? '中高' : landArea >= 5 ? '中等' : '较低',
      });
    }
  }, [farmer]);

  const handleApplyFinance = (product) => {
    navigate('/finance', {
      state: {
        action: 'apply',
        farmerId: farmer.id,
        farmerName: farmer.name,
        landArea: farmer.landArea,
        product: product,
      }
    });
    onClose?.();
  };

  useEffect(() => {
    if (farmer && farmer.landCertNo) {
      setOcrResult({
        certificateNo: farmer.landCertNo,
        landArea: farmer.landArea,
        landLocation: `${farmer.village || ''}${farmer.group || ''}`,
        owner: farmer.name,
        issueDate: farmer.createTime || dayjs().format('YYYY-MM-DD'),
        valid: true,
      });
    } else {
      setOcrResult(null);
    }
  }, [farmer]);

  const simulateOCR = async () => {
    setOcrLoading(true);
    setOcrProgress(0);
    try {
      const res = await request.post(`/farmers/${farmer.id}/ocr`).catch(() => ({}));
      for (let i = 1; i <= 10; i++) {
        await new Promise((r) => setTimeout(r, 150));
        setOcrProgress(i * 10);
      }
      let result;
      if (res && res.data) {
        result = {
          certificateNo: res.data.land_cert_no || res.data.landCertNo || '农地确字第' + Math.floor(Math.random() * 100000) + '号',
          landArea: res.data.land_area !== undefined ? res.data.land_area : res.data.landArea || farmer?.landArea || 8.5,
          landLocation: `${farmer?.village || ''}${farmer?.group || ''}${Math.floor(Math.random() * 30) + 1}号地块`,
          owner: farmer?.name,
          issueDate: dayjs().format('YYYY-MM-DD'),
          valid: true,
        };
      } else {
        result = {
          certificateNo: '农地确字第' + Math.floor(Math.random() * 100000) + '号',
          landArea: farmer?.landArea || 8.5,
          landLocation: `${farmer?.village || ''}${farmer?.group || ''}${Math.floor(Math.random() * 30) + 1}号地块`,
          owner: farmer?.name,
          issueDate: dayjs().format('YYYY-MM-DD'),
          valid: true,
        };
      }
      setOcrResult(result);
      if (onUpdate) {
        onUpdate({
          ...farmer,
          landCertNo: result.certificateNo,
          landArea: result.landArea,
          ocrStatus: '已识别',
        });
      }
      message.success('OCR识别完成');
    } catch {
      message.error('识别失败，请重试');
    } finally {
      setOcrLoading(false);
    }
  };

  if (!farmer) return null;

  const appColumns = [
    { title: '申请单号', dataIndex: 'id', key: 'id' },
    { title: '产品名称', dataIndex: 'productName', key: 'productName' },
    { title: '申请金额', dataIndex: 'amount', key: 'amount', render: (v) => `${v}万元` },
    { title: '申请日期', dataIndex: 'applyDate', key: 'applyDate' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (v) => (
        <Tag color={v === '已通过' ? 'green' : v === '审核中' ? 'orange' : 'red'}>{v}</Tag>
      )
    },
  ];

  const mockApps = [
    { id: 'LOAN202501001', productName: '信用贷-农e贷', amount: 5, applyDate: '2025-01-15', status: '已通过' },
    { id: 'LOAN202503002', productName: '农机贷-购机补贴', amount: 12, applyDate: '2025-03-22', status: '审核中' },
  ];

  return (
    <Drawer
      title={`农户详情 - ${farmer.name}`}
      width={window.innerWidth < 768 ? '100%' : 720}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
        <Descriptions column={window.innerWidth < 768 ? 1 : 2} size="small">
          <Descriptions.Item label="姓名">{farmer.name}</Descriptions.Item>
          <Descriptions.Item label="身份证">{farmer.idCard}</Descriptions.Item>
          <Descriptions.Item label="村组">{farmer.village} {farmer.group}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{farmer.phone}</Descriptions.Item>
          <Descriptions.Item label="土地面积">{farmer.landArea} 亩</Descriptions.Item>
          <Descriptions.Item label="土地证号">{farmer.landCertNo || '未确权'}</Descriptions.Item>
          <Descriptions.Item label="OCR状态">
            <Tag color={farmer.ocrStatus === '已识别' ? 'green' : 'orange'}>{farmer.ocrStatus}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="家庭人口">{farmer.familyMembers || 4} 人</Descriptions.Item>
          <Descriptions.Item label="建档时间">{farmer.createTime || '2024-06-15'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title="标签信息"
        size="small"
        style={{ marginBottom: 16 }}
        extra={<Button type="primary" size="small" icon={<ScanOutlined />} onClick={simulateOCR} loading={ocrLoading}>
          土地证OCR识别
        </Button>}
      >
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontWeight: 500, marginRight: 8 }}>种植标签：</span>
          {(farmer.plantTags || []).map((t) => (
            <Tag key={t} color={plantTags[t]?.color || 'default'}>{t}</Tag>
          ))}
          {(!farmer.plantTags || farmer.plantTags.length === 0) && <span style={{ color: '#888' }}>暂无</span>}
        </div>
        <div>
          <span style={{ fontWeight: 500, marginRight: 8 }}>养殖标签：</span>
          {(farmer.breedTags || []).map((t) => (
            <Tag key={t} color={breedTags[t]?.color || 'default'}>{t}</Tag>
          ))}
          {(!farmer.breedTags || farmer.breedTags.length === 0) && <span style={{ color: '#888' }}>暂无</span>}
        </div>
      </Card>

      {(ocrLoading || ocrResult) && (
        <Card title="土地确权OCR结果" size="small" style={{ marginBottom: 16 }}>
          {ocrLoading && <Progress percent={ocrProgress} status="active" showInfo />}
          {ocrResult && !ocrLoading && (
            <Descriptions column={window.innerWidth < 768 ? 1 : 2} size="small">
              <Descriptions.Item label="权证编号">{ocrResult.certificateNo}</Descriptions.Item>
              <Descriptions.Item label="确权面积">{ocrResult.landArea} 亩</Descriptions.Item>
              <Descriptions.Item label="地块位置" span={2}>{ocrResult.landLocation}</Descriptions.Item>
              <Descriptions.Item label="权利人">{ocrResult.owner}</Descriptions.Item>
              <Descriptions.Item label="发证日期">{ocrResult.issueDate}</Descriptions.Item>
            </Descriptions>
          )}
        </Card>
      )}

      {creditInfo && (
        <>
          <Card
            title="产业画像与金融授信"
            size="small"
            style={{ marginBottom: 16 }}
            extra={
              <Tag color={creditInfo.hasOcr ? 'green' : 'orange'}>
                {creditInfo.hasOcr ? '✓ OCR已确权' : '⚠ 未确权'}
              </Tag>
            }
          >
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
              <Col xs={12} sm={8}>
                <Card size="small" style={{ textAlign: 'center', background: '#f6ffed' }}>
                  <Statistic
                    title={<span style={{ fontSize: 12 }}>预估授信额度</span>}
                    value={creditInfo.maxCredit}
                    suffix="万元"
                    prefix={<BankOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small" style={{ textAlign: 'center', background: '#e6f7ff' }}>
                  <Statistic
                    title={<span style={{ fontSize: 12 }}>产业估值</span>}
                    value={creditInfo.industryValue}
                    suffix="元"
                    prefix={<RiseOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8}>
                <Card size="small" style={{ textAlign: 'center', background: '#fffbe6' }}>
                  <Statistic
                    title={<span style={{ fontSize: 12 }}>风险等级</span>}
                    value={creditInfo.riskLevel}
                    prefix={<SafetyOutlined />}
                    valueStyle={{ color: '#faad14', fontSize: 16 }}
                  />
                </Card>
              </Col>
            </Row>

            <Alert
              message="授信计算依据"
              description={
                <div style={{ fontSize: 12 }}>
                  <div>• 基础授信：土地面积 {creditInfo.landArea} 亩 × 3万元/亩 = {Math.round(creditInfo.baseCredit / 10000)}万元</div>
                  <div>• 产业加成：种植标签系数 {creditInfo.plantScore.toFixed(1)} + 养殖标签系数 {creditInfo.breedScore.toFixed(1)} = ×{creditInfo.tagMultiplier.toFixed(2)}</div>
                  <div>• 确权加成：{creditInfo.hasOcr ? 'OCR已识别 ×1.2' : '未确权 ×1.0'}</div>
                  <div>• 产业类型：<Tag color="blue">{creditInfo.industryCategory}</Tag></div>
                </div>
              }
              type="info"
              showIcon
              icon={<CalculatorOutlined />}
              style={{ marginBottom: 16 }}
            />

            <div style={{ marginBottom: 8, fontWeight: 500 }}>可申请金融产品：</div>
            {creditInfo.eligibleProducts.length > 0 ? (
              <Space wrap>
                {creditInfo.eligibleProducts.map((p) => (
                  <Button
                    key={p.name}
                    type="primary"
                    icon={<BankOutlined />}
                    onClick={() => handleApplyFinance(p)}
                  >
                    申请{p.name}（最高{p.maxAmount}万）
                  </Button>
                ))}
              </Space>
            ) : (
              <div style={{ color: '#888', fontSize: 12 }}>请先完善土地确权OCR和种养标签，以获得授信额度</div>
            )}
          </Card>

          <Card title="产业分布统计" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>种植品类分布</div>
                {(farmer.plantTags || []).length > 0 ? (
                  <div>
                    {(farmer.plantTags || []).map((t) => (
                      <div key={t} style={{ marginBottom: 6, display: 'flex', alignItems: 'center' }}>
                        <Tag color={plantTags[t]?.color || 'default'} style={{ width: 60, textAlign: 'center' }}>{t}</Tag>
                        <Progress
                          percent={Math.round((plantTags[t]?.value || 0.5) * 50)}
                          size="small"
                          showInfo={false}
                          style={{ flex: 1, marginLeft: 8 }}
                        />
                        <span style={{ fontSize: 11, color: '#888', width: 40, textAlign: 'right' }}>
                          {(plantTags[t]?.value || 0.5).toFixed(1)}x
                        </span>
                      </div>
                    ))}
                  </div>
                ) : <div style={{ color: '#888', fontSize: 12 }}>暂无种植标签</div>}
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>养殖品类分布</div>
                {(farmer.breedTags || []).length > 0 ? (
                  <div>
                    {(farmer.breedTags || []).map((t) => (
                      <div key={t} style={{ marginBottom: 6, display: 'flex', alignItems: 'center' }}>
                        <Tag color={breedTags[t]?.color || 'default'} style={{ width: 60, textAlign: 'center' }}>{t}</Tag>
                        <Progress
                          percent={Math.round((breedTags[t]?.value || 0.5) * 40)}
                          size="small"
                          showInfo={false}
                          style={{ flex: 1, marginLeft: 8 }}
                        />
                        <span style={{ fontSize: 11, color: '#888', width: 40, textAlign: 'right' }}>
                          {(breedTags[t]?.value || 0.5).toFixed(1)}x
                        </span>
                      </div>
                    ))}
                  </div>
                ) : <div style={{ color: '#888', fontSize: 12 }}>暂无养殖标签</div>}
              </Col>
            </Row>
          </Card>
        </>
      )}

      <Divider />

      <Card title="金融申请历史" size="small">
        <Table
          size="small"
          dataSource={mockApps}
          columns={appColumns}
          pagination={false}
          scroll={{ x: 600 }}
        />
      </Card>
    </Drawer>
  );
}
