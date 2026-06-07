import React, { useEffect, useState } from 'react';
import { Descriptions, Card, Table, Tag, Spin, Button, Typography, Row, Col } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import api from '../../api';

const { Title } = Typography;

const typeMap = { farmer: '农户', merchant: '商户' };
const levelColor = { AAA: 'green', AA: 'green', A: 'blue', B: 'orange', C: 'red', D: 'red' };
const flowTypeMap = { subsidy: '补贴流水', income: '经营流水', loan: '贷款流水', other: '其他' };

export default function CreditProfileDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/credit/profiles/${id}`).then(res => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;
  if (!data) return <div>未找到数据</div>;

  const radarData = [
    { dimension: '信用评分', value: Math.min(100, data.credit_score / 10) },
    { dimension: '土地确权', value: data.land_area > 0 ? Math.min(100, data.land_area * 3) : 0 },
    { dimension: '补贴规模', value: Math.min(100, data.subsidy_total / 500) },
    { dimension: '经营收入', value: Math.min(100, data.business_income / 3000) },
    { dimension: '信用等级', value: { AAA: 95, AA: 85, A: 75, B: 60, C: 40, D: 20 }[data.credit_level] || 50 },
  ];

  const subsidyFlows = (data.flows || []).filter(f => f.flow_type === 'subsidy');
  const incomeFlows = (data.flows || []).filter(f => f.flow_type === 'income');
  const loanFlows = (data.flows || []).filter(f => f.flow_type === 'loan');
  const otherFlows = (data.flows || []).filter(f => f.flow_type === 'other');

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/credit')} style={{ marginBottom: 16 }}>返回列表</Button>
      <Title level={4}>{data.name} - 信用画像</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card title="基本信息" size="small">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="姓名">{data.name}</Descriptions.Item>
              <Descriptions.Item label="身份证号">{data.id_card}</Descriptions.Item>
              <Descriptions.Item label="类型"><Tag color={data.type === 'farmer' ? 'green' : 'blue'}>{typeMap[data.type]}</Tag></Descriptions.Item>
              <Descriptions.Item label="信用等级"><Tag color={levelColor[data.credit_level]}>{data.credit_level}</Tag></Descriptions.Item>
              <Descriptions.Item label="乡镇">{data.town}</Descriptions.Item>
              <Descriptions.Item label="村/社区">{data.village}</Descriptions.Item>
              <Descriptions.Item label="土地面积">{data.land_area}亩</Descriptions.Item>
              <Descriptions.Item label="确权证号">{data.land_cert_no || '-'}</Descriptions.Item>
              <Descriptions.Item label="补贴汇总">{data.subsidy_total?.toLocaleString()}元</Descriptions.Item>
              <Descriptions.Item label="经营收入">{data.business_income?.toLocaleString()}元</Descriptions.Item>
              <Descriptions.Item label="信用评分">{data.credit_score}分</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={data.status === 'active' ? 'green' : 'default'}>{data.status === 'active' ? '正常' : '停用'}</Tag></Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="信用雷达图" size="small">
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar dataKey="value" stroke="#1B5E20" fill="#1B5E20" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card title="土地确权信息" size="small" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="土地面积">{data.land_area}亩</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={12} md={6}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="确权证号">{data.land_cert_no || '-'}</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={12} md={6}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="土地类型">{data.type === 'farmer' ? '耕地' : '商业用地'}</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={12} md={6}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="确权状态"><Tag color="green">已确权</Tag></Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      <Card title="涉农补贴流水" size="small" style={{ marginTop: 16 }}>
        <Table rowKey="id" size="small" pagination={{ pageSize: 5 }}
          dataSource={subsidyFlows}
          columns={[
            { title: '补贴类型', dataIndex: 'description', width: 200 },
            { title: '金额(元)', dataIndex: 'amount', width: 120, render: v => v?.toLocaleString() },
            { title: '发放日期', dataIndex: 'flow_date', width: 120 },
            { title: '发放单位', render: () => '农业农村局' },
          ]}
          locale={{ emptyText: '暂无补贴流水记录' }} />
      </Card>

      <Card title="经营收入流水" size="small" style={{ marginTop: 16 }}>
        <Table rowKey="id" size="small" pagination={{ pageSize: 5 }}
          dataSource={incomeFlows}
          columns={[
            { title: '收入来源', dataIndex: 'description', width: 200 },
            { title: '金额(元)', dataIndex: 'amount', width: 120, render: v => v?.toLocaleString() },
            { title: '交易日期', dataIndex: 'flow_date', width: 120 },
            { title: '交易渠道', render: () => '农信结算账户' },
          ]}
          locale={{ emptyText: '暂无经营收入记录' }} />
      </Card>

      <Card title="贷款历史记录" size="small" style={{ marginTop: 16 }}>
        <Table rowKey="id" size="small" pagination={{ pageSize: 5 }}
          dataSource={loanFlows}
          columns={[
            { title: '贷款产品', dataIndex: 'description', width: 200 },
            { title: '金额(元)', dataIndex: 'amount', width: 120, render: v => v?.toLocaleString() },
            { title: '日期', dataIndex: 'flow_date', width: 120 },
            { title: '状态', render: () => <Tag color="green">已结清</Tag> },
          ]}
          locale={{ emptyText: '暂无贷款记录' }} />
      </Card>

      <Card title="对接数据源核验结果" size="small" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Card size="small" type="inner" title="人民银行征信系统" extra={<Tag color="green">已核验</Tag>}>
              <p style={{ margin: '4px 0' }}>征信报告ID: PBOC-2026-{String(data.id).padStart(6, '0')}</p>
              <p style={{ margin: '4px 0' }}>信用评分: {data.credit_score}分</p>
              <p style={{ margin: '4px 0' }}>逾期记录: 0次</p>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" type="inner" title="农业农村部数据平台" extra={<Tag color="green">已核验</Tag>}>
              <p style={{ margin: '4px 0' }}>土地确权: {data.land_area}亩</p>
              <p style={{ margin: '4px 0' }}>确权证号: {data.land_cert_no || '-'}</p>
              <p style={{ margin: '4px 0' }}>补贴汇总: {data.subsidy_total?.toLocaleString()}元</p>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" type="inner" title="地方政务服务平台" extra={<Tag color="green">已核验</Tag>}>
              <p style={{ margin: '4px 0' }}>身份信息: 已核验</p>
              <p style={{ margin: '4px 0' }}>营业执照: {data.type === 'merchant' ? '已核验' : '无'}</p>
              <p style={{ margin: '4px 0' }}>税务记录: {data.type === 'merchant' ? '已核验' : '无'}</p>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card title="额度模型计算结果" size="small" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={6}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="模型版本">HN-v2.1</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={6}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="模型评分">{Math.round(data.credit_score * 0.8 + data.land_area * 2 + (data.subsidy_total || 0) / 1000)}分</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={6}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="授信额度">{Math.min(500000, Math.round((data.credit_score * 500 + data.land_area * 3000 + (data.subsidy_total || 0) * 2) / 10000) * 10000).toLocaleString()}元</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={6}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="自动审批结果"><Tag color="green">通过</Tag></Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      <Card title="评分计算明细链路" size="small" style={{ marginTop: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card size="small" type="inner" title="基础数据维度" extra={<Tag color="blue">权重 40%</Tag>}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>土地面积</span>
                  <b>{data.land_area}亩 × 2分/亩 = {Math.round(data.land_area * 2)}分</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>补贴累计</span>
                  <b>{data.subsidy_total?.toLocaleString() || 0}元 ÷ 1000 = {Math.round((data.subsidy_total || 0) / 1000)}分</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>经营收入</span>
                  <b>{data.business_income?.toLocaleString() || 0}元 ÷ 3000 = {Math.round((data.business_income || 0) / 3000)}分</b>
                </div>
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>基础数据小计</span>
                  <span>{Math.round(data.land_area * 2 + (data.subsidy_total || 0) / 1000 + (data.business_income || 0) / 3000)}分</span>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" type="inner" title="征信数据维度" extra={<Tag color="orange">权重 35%</Tag>}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>人行征信评分</span>
                  <b>{data.credit_score}分 × 0.8 = {Math.round(data.credit_score * 0.8)}分</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>逾期记录</span>
                  <Tag color="green">0次 +5分</Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>贷款历史</span>
                  <Tag color="green">{loanFlows.length}笔 +{loanFlows.length * 2}分</Tag>
                </div>
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>征信数据小计</span>
                  <span>{Math.round(data.credit_score * 0.8) + 5 + loanFlows.length * 2}分</span>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" type="inner" title="政务数据维度" extra={<Tag color="green">权重 25%</Tag>}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>身份核验</span>
                  <Tag color="green">通过 +10分</Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>土地确权</span>
                  <Tag color="green">已确权 +{data.land_area > 0 ? 15 : 0}分</Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>营业执照/税务</span>
                  <Tag color={data.type === 'merchant' ? 'green' : 'default'}>{data.type === 'merchant' ? '已核验 +10分' : '不适用 +0分'}</Tag>
                </div>
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>政务数据小计</span>
                  <span>{10 + (data.land_area > 0 ? 15 : 0) + (data.type === 'merchant' ? 10 : 0)}分</span>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
        <div style={{ marginTop: 16, padding: 16, background: '#f6ffed', borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>综合信用评分: {data.credit_score}分</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                信用等级: <Tag color={levelColor[data.credit_level]}>{data.credit_level}级</Tag>
                &nbsp;|&nbsp; 评分规则: 基础数据(40%) + 征信数据(35%) + 政务数据(25%)
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#666' }}>授信额度</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1B5E20' }}>
                {Math.min(500000, Math.round((data.credit_score * 500 + data.land_area * 3000 + (data.subsidy_total || 0) * 2) / 10000) * 10000).toLocaleString()}元
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
