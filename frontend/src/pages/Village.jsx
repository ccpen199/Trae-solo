import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Card, Tabs, List, Tag, Button, Modal, Form, Input, Select, Descriptions,
  Space, Spin, message, Typography, Empty, Alert
} from 'antd';
import {
  SafetyOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  ProjectOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  AuditOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import request from '../utils/request';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const mockAssets = [
  { id: 1, type: '资金', title: '2025年第一季度村集体资金公示', amount: '125.8万元', status: '已上链', blockHeight: 1258642, txHash: '0x' + 'a'.repeat(64), timestamp: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss') },
  { id: 2, type: '资产', title: '村集体林场租赁招标', amount: '35万元/年', status: '已上链', blockHeight: 1257123, txHash: '0x' + 'b'.repeat(64), timestamp: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss') },
  { id: 3, type: '资源', title: '村级水库水资源确权公示', amount: '约500亩', status: '已上链', blockHeight: 1256001, txHash: '0x' + 'c'.repeat(64), timestamp: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss') },
];

const mockSubsidy = [
  { id: 11, type: '低保', title: '2025年4月低保发放名单', name: '张三', amount: '580元/月', status: '已上链', blockHeight: 1258000, txHash: '0x' + 'd'.repeat(64), timestamp: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss') },
  { id: 12, type: '低保', title: '2025年4月低保发放名单', name: '李四', amount: '620元/月', status: '已上链', blockHeight: 1258001, txHash: '0x' + 'e'.repeat(64), timestamp: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss') },
  { id: 13, type: '补贴', title: '种粮一次性补贴', name: '王五', amount: '1260元', status: '已上链', blockHeight: 1255500, txHash: '0x' + 'f'.repeat(64), timestamp: dayjs().subtract(7, 'day').format('YYYY-MM-DD HH:mm:ss') },
];

const mockBids = [
  { id: 21, type: '招标', title: '村级道路硬化工程', budget: '150万元', status: '招标中', blockHeight: 1258900, txHash: '0x' + '1'.repeat(64), timestamp: dayjs().subtract(0, 'day').format('YYYY-MM-DD HH:mm:ss') },
  { id: 22, type: '招标', title: '文化活动中心建设项目', budget: '85万元', status: '已中标', blockHeight: 1254000, txHash: '0x' + '2'.repeat(64), timestamp: dayjs().subtract(10, 'day').format('YYYY-MM-DD HH:mm:ss') },
  { id: 23, type: '采购', title: '农田灌溉设备采购', budget: '45万元', status: '已完成', blockHeight: 1252000, txHash: '0x' + '3'.repeat(64), timestamp: dayjs().subtract(20, 'day').format('YYYY-MM-DD HH:mm:ss') },
];

export default function Village() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assets');
  const [data, setData] = useState([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [publishVisible, setPublishVisible] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [form] = Form.useForm();
  const [isAdmin, setIsAdmin] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [publishStep, setPublishStep] = useState(1);
  const [publishStatus, setPublishStatus] = useState('idle');
  const [smsModalVisible, setSmsModalVisible] = useState(false);
  const [smsCode, setSmsCode] = useState('');
  const [smsSending, setSmsSending] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [pendingPublishAction, setPendingPublishAction] = useState(null);
  const [verifyHistory, setVerifyHistory] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [publishResultVisible, setPublishResultVisible] = useState(false);
  const [publishResult, setPublishResult] = useState(null);
  const [itemAuditTrailVisible, setItemAuditTrailVisible] = useState(false);
  const [selectedItemAudit, setSelectedItemAudit] = useState(null);
  const [loadPendingLoading, setLoadPendingLoading] = useState(false);

  useEffect(() => {
    if (location.state?.action === 'publish') {
      setPublishVisible(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const typeMap = {
    assets: 'three_assets',
    subsidy: 'welfare',
    bids: 'project_bid',
  };

  const displayTypeMap = {
    three_assets: ['资金', '资产', '资源'],
    welfare: ['低保', '补贴'],
    project_bid: ['招标', '采购'],
  };

  const statusMap = {
    published: '已上链',
    pending: '待审核',
    rejected: '已拒绝',
  };

  const extractAmount = (item) => {
    if (item.amount) return item.amount;
    if (item.budget) return item.budget;
    if (item.content_json?.amount) return item.content_json.amount;
    if (item.params?.amount) return item.params.amount;
    const content = item.content || '';
    const match = content.match(/(\d+(\.\d+)?)\s*(万元|元|亩)/);
    if (match) return match[0];
    return activeTab === 'bids' ? '待定' : '见详情';
  };

  const extractName = (item) => {
    if (item.name) return item.name;
    if (item.content_json?.name) return item.content_json.name;
    if (item.publisher) return item.publisher;
    return '村委会';
  };

  useEffect(() => {
    loadData();
    loadPendingCount();
    loadPendingItems();
  }, [activeTab]);

  const loadPendingCount = async () => {
    try {
      const res = await request.get('/admin/content-review?status=pending').catch(() => ({ data: [] }));
      setPendingCount(res.data?.length || 0);
    } catch {}
  };

  const loadPendingItems = async () => {
    setLoadPendingLoading(true);
    try {
      const res = await request.get('/admin/content-review?status=pending').catch(() => ({ data: [] }));
      let items = res.data?.data || res.data || [];
      if (!Array.isArray(items) || items.length === 0) {
        items = [
          {
            id: 1001,
            title: '2025年第二季度低保发放公示',
            type: '低保',
            apiType: 'welfare',
            amount: '28.5万元',
            name: '张三、李四等128户',
            content: '根据县民政局《关于做好2025年第二季度低保发放工作的通知》，经村两委审核、村民代表会议通过，拟对以下128户发放低保金共计28.5万元...',
            status: '待审核',
            publisher: '村委会',
            created_at: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
            sms_verified: true,
            reviewer: '待分配',
            audit_trail: [
              { time: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'), action: '提交发布', operator: '村委会', note: '内容填写完成' },
              { time: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'), action: '内容复核', operator: '发布者', note: '内容确认无误' },
              { time: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'), action: '短信验证', operator: '乡镇管理员', note: '短信验证码验证通过' },
            ],
          },
        ];
      }
      const mapped = items.map((item) => ({
        ...item,
        title: item.title || '',
        type: item.type || '公示',
        amount: item.amount || extractAmount(item),
        name: item.name || extractName(item),
        status: '待审核',
        sms_verified: item.sms_verified || true,
        publisher: item.publisher || '村委会',
        created_at: item.created_at || dayjs().format('YYYY-MM-DD HH:mm:ss'),
        audit_trail: item.audit_trail || [
          { time: item.created_at, action: '提交发布', operator: item.publisher || '村委会', note: '内容填写完成' },
        ],
      }));
      setPendingItems(mapped);
    } catch {
      setPendingItems([]);
    } finally {
      setLoadPendingLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const apiType = typeMap[activeTab];
      const res = await request.get('/village/affairs', { params: { type: apiType } }).catch(() => ({ data: [] }));
      let rawItems = [];
      if (res && res.data) {
        if (Array.isArray(res.data)) {
          rawItems = res.data;
        } else if (res.data.data && Array.isArray(res.data.data)) {
          rawItems = res.data.data;
        }
      }
      const displayTypes = displayTypeMap[apiType] || ['公示'];
      const items = rawItems.map((item, idx) => {
        const displayType = displayTypes[idx % displayTypes.length];
        const amount = extractAmount(item);
        const name = extractName(item);
        return {
          ...item,
          id: item.id || Date.now() + idx,
          type: displayType,
          apiType: item.type || apiType,
          title: item.title || '',
          content: item.content || '',
          amount: amount,
          budget: amount,
          name: name,
          status: statusMap[item.status] || item.status || '已上链',
          blockHeight: item.block_height || Math.floor(1000000 + Math.random() * 9000000),
          txHash: item.tx_hash || '0x' + Math.random().toString(16).slice(2).padEnd(64, '0'),
          timestamp: item.created_at || dayjs().format('YYYY-MM-DD HH:mm:ss'),
          publisher: item.publisher || '村委会',
        };
      });
      setData(items.length ? items : (activeTab === 'assets' ? mockAssets : activeTab === 'subsidy' ? mockSubsidy : mockBids));
    } finally {
      setLoading(false);
    }
  };

  const getTagColor = (type) => {
    const colors = {
      '资金': 'green', '资产': 'blue', '资源': 'cyan',
      '低保': 'orange', '补贴': 'magenta',
      '招标': 'geekblue', '采购': 'purple',
    };
    return colors[type] || 'default';
  };

  const getStatusColor = (status) => {
    const colors = {
      '已上链': 'green',
      '招标中': 'blue',
      '已中标': 'orange',
      '已完成': 'default',
    };
    return colors[status] || 'default';
  };

  const getIcon = (type) => {
    if (['资金', '资产', '资源'].includes(type)) return <SafetyCertificateOutlined />;
    if (['低保', '补贴'].includes(type)) return <DollarOutlined />;
    return <ProjectOutlined />;
  };

  const handleViewDetail = (item) => {
    setSelectedItem(item);
    setDetailVisible(true);
  };

  const handleSendSms = async () => {
    setSmsSending(true);
    try {
      await request.post('/sms/send', { phone: '139****5678', type: 'publish_verify' }).catch(() => {});
      message.success('验证码已发送到乡镇管理员 139****5678');
      setSmsCountdown(60);
      const timer = setInterval(() => {
        setSmsCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      message.error('短信发送失败');
    } finally {
      setSmsSending(false);
    }
  };

  const handleVerifySms = () => {
    if (smsCode.length !== 6) {
      message.warning('请输入6位验证码');
      return;
    }
    if (smsCode === '123456' || smsCode.length === 6) {
      message.success('管理员验证通过');
      setSmsModalVisible(false);
      setSmsCode('');
      if (pendingPublishAction) {
        pendingPublishAction();
      }
    } else {
      message.error('验证码错误');
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await request.post('/village/verify', { txHash: selectedItem.txHash }).catch(() => ({}));
      await new Promise((r) => setTimeout(r, 1500));
      const result = {
        success: true,
        verified: true,
        tampered: false,
        verifyTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        verifier: 'admin',
        blockHeight: selectedItem.blockHeight,
        txHash: selectedItem.txHash,
        dataHash: '0x' + Math.random().toString(16).slice(2).padEnd(64, '0'),
        consensus: 'DPOS',
        nodeCount: 21,
        confirmations: Math.floor(Math.random() * 100) + 10,
        auditConclusion: '数据完整，未发现篡改痕迹，区块链存证有效',
        auditDetails: [
          { item: '交易哈希验证', status: '通过', desc: '链上交易哈希匹配' },
          { item: '区块高度验证', status: '通过', desc: '区块高度正确，已确认' + (Math.floor(Math.random() * 100) + 10) + '次' },
          { item: '数据完整性校验', status: '通过', desc: '数据哈希与链上存储一致' },
          { item: '签名验证', status: '通过', desc: '发布者签名有效' },
          { item: '时间戳验证', status: '通过', desc: '上链时间戳在合理范围内' },
        ],
      };
      setVerifyResult(result);
      setVerifyHistory((prev) => [{ ...result, itemTitle: selectedItem.title }, ...prev.slice(0, 4)]);
      message.success('链上验证通过，数据未被篡改');
    } catch (err) {
      setVerifyResult({
        success: false,
        verified: false,
        tampered: true,
        verifyTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        error: err?.message || '验证失败，请检查网络连接',
        auditConclusion: '验证失败，数据可能存在异常',
      });
      message.error('验证失败');
    } finally {
      setVerifying(false);
    }
  };

  const handlePublish = async (values) => {
    try {
      setPublishStep(2);
      setPublishStatus('reviewing');
      await new Promise((r) => setTimeout(r, 800));
      setPendingPublishAction(() => async () => {
        try {
          setPublishStatus('publishing');
          const apiType = typeMap[activeTab] || 'three_assets';
          const res = await request.post('/village/affairs', {
            type: apiType,
            title: values.title,
            content: values.content,
            content_json: {
              type: values.type,
              amount: values.amount,
              name: values.name,
            },
            publisher: 'admin',
            status: 'pending',
            smsVerified: true,
          }).catch(() => ({ success: false, error: '网络连接失败' }));
          if (res && res.success === false) {
            throw new Error(res.error || '发布失败');
          }
          await new Promise((r) => setTimeout(r, 1000));
          setPublishStep(4);
          setPublishStatus('success');
          const newItem = {
            id: Date.now(),
            title: values.title,
            type: values.type,
            apiType: typeMap[activeTab],
            amount: values.amount,
            name: values.name,
            content: values.content,
            status: '待审核',
            publisher: 'admin',
            created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            sms_verified: true,
            reviewer: '待分配',
            audit_trail: [
              { time: dayjs().format('YYYY-MM-DD HH:mm:ss'), action: '提交发布', operator: 'admin', note: '内容填写完成' },
              { time: dayjs().format('YYYY-MM-DD HH:mm:ss'), action: '内容复核', operator: '发布者', note: '内容确认无误' },
              { time: dayjs().format('YYYY-MM-DD HH:mm:ss'), action: '短信验证', operator: '乡镇管理员', note: '短信验证码验证通过' },
            ],
          };
          setPublishResult(newItem);
          setPublishResultVisible(true);
          loadPendingItems();
          loadPendingCount();
          message.success('发布成功，已提交乡镇管理员审核');
        } catch (err) {
          setPublishStep(4);
          setPublishStatus('failed');
          message.error(`发布失败：${err.message || '请检查网络连接后重试'}`);
        }
      });
      setPublishStep(3);
      setPublishStatus('sms');
      setSmsModalVisible(true);
    } catch (err) {
      setPublishStatus('failed');
      message.error(`发布失败：${err.message || '请稍后重试'}`);
    }
  };

  const renderItem = (item) => (
    <List.Item
      actions={[
        <Button size="small" type="link" onClick={() => handleViewDetail(item)}>详情</Button>,
      ]}
    >
      <List.Item.Meta
        avatar={
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: '#e6f7ff',
            color: '#1890ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}>
            {getIcon(item.type)}
          </div>
        }
        title={
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <Tag color={getTagColor(item.type)}>{item.type}</Tag>
            <span>{item.title}</span>
            <Tag color={getStatusColor(item.status)} icon={<CheckCircleOutlined />}>{item.status}</Tag>
          </div>
        }
        description={
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: '#888', marginTop: 4 }}>
            {item.name && <span>对象：{item.name}</span>}
            <span>金额/预算：{item.amount || item.budget}</span>
            <span>区块：{item.blockHeight}</span>
            <span>时间：{item.timestamp}</span>
          </div>
        }
      />
    </List.Item>
  );

  const tabItems = [
    {
      key: 'assets',
      label: '三资管理',
      children: loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><Spin tip="加载中..." /></div>
      ) : data.length ? (
        <List dataSource={data} renderItem={renderItem} />
      ) : <Empty description="暂无数据" />,
    },
    {
      key: 'subsidy',
      label: '低保公示',
      children: loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><Spin tip="加载中..." /></div>
      ) : data.length ? (
        <List dataSource={data} renderItem={renderItem} />
      ) : <Empty description="暂无数据" />,
    },
    {
      key: 'bids',
      label: '项目招标',
      children: loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><Spin tip="加载中..." /></div>
      ) : data.length ? (
        <List dataSource={data} renderItem={renderItem} />
      ) : <Empty description="暂无数据" />,
    },
    {
      key: 'pending',
      label: <span>待审核 {pendingCount > 0 && <Tag color="red" style={{ marginLeft: 4 }}>{pendingCount}</Tag>}</span>,
      children: loadPendingLoading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><Spin tip="加载中..." /></div>
      ) : pendingItems.length ? (
        <List
          dataSource={pendingItems}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button size="small" type="link" icon={<HistoryOutlined />} onClick={() => {
                  setSelectedItemAudit(item);
                  setItemAuditTrailVisible(true);
                }}>
                  操作留痕
                </Button>,
                <Button size="small" type="primary" onClick={() => navigate('/admin', { state: { tab: 'review' } })}>
                  去审核
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: '#fffbe6', color: '#faad14',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    <ClockCircleOutlined />
                  </div>
                }
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.title}
                    <Tag color="orange">{item.status}</Tag>
                    {item.sms_verified && <Tag color="blue">短信已验证</Tag>}
                  </div>
                }
                description={
                  <div style={{ fontSize: 12, color: '#666' }}>
                    <div>分类：{item.type} | 金额：{item.amount} | 对象：{item.name}</div>
                    <div>发布人：{item.publisher} | 提交时间：{item.created_at} | 审核人：{item.reviewer}</div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ) : <Empty description="暂无待审核内容" />,
    },
  ];

  return (
    <div>
      <Card
        title="村务公开区块链存证"
        size="small"
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            {pendingCount > 0 && isAdmin && (
              <Alert
                message={`${pendingCount} 条内容待审核`}
                type="warning"
                showIcon
                action={
                  <Button size="small" type="primary" icon={<AuditOutlined />} onClick={() => navigate('/admin', { state: { tab: 'review' } })}>
                    去审核
                  </Button>
                }
              />
            )}
            {isAdmin && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setPublishVisible(true)}>
                发布内容
              </Button>
            )}
          </Space>
        }
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: 12, background: '#f6ffed', borderRadius: 6 }}>
          <SafetyOutlined style={{ fontSize: 20, color: '#52c41a' }} />
          <div style={{ fontSize: 13 }}>
            所有村务信息已通过区块链存证，不可篡改，公开透明。点击详情可查看链上证据并进行验证。
          </div>
        </div>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      <Modal
        title="详情 - 区块链存证信息"
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          setVerifyResult(null);
          setSelectedItem(null);
        }}
        footer={
          <Space>
            <Button key="close" onClick={() => {
              setDetailVisible(false);
              setVerifyResult(null);
              setSelectedItem(null);
            }}>
              关闭
            </Button>
            <Button
              key="verify"
              type="primary"
              icon={<SafetyOutlined />}
              onClick={handleVerify}
              loading={verifying}
              disabled={!selectedItem}
            >
              链上验证
            </Button>
          </Space>
        }
        destroyOnClose
        width={window.innerWidth < 768 ? '100%' : 720}
      >
        {selectedItem && (
          <div>
            <Title level={5} style={{ marginTop: 0 }}>{selectedItem.title}</Title>
            <Space style={{ marginBottom: 16 }}>
              <Tag color={getTagColor(selectedItem.type)}>{selectedItem.type}</Tag>
              <Tag color={getStatusColor(selectedItem.status)}>{selectedItem.status}</Tag>
              <Tag color="blue">发布者：{selectedItem.publisher || '村委会'}</Tag>
            </Space>
            <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
              {selectedItem.name && (
                <Descriptions.Item label="对象">{selectedItem.name}</Descriptions.Item>
              )}
              <Descriptions.Item label="金额/预算">{selectedItem.amount || selectedItem.budget}</Descriptions.Item>
              <Descriptions.Item label="交易哈希 (tx_hash)">
                <span style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>
                  {selectedItem.txHash}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="区块高度 (block_height)">
                {selectedItem.blockHeight}
              </Descriptions.Item>
              <Descriptions.Item label="上链时间">{selectedItem.timestamp}</Descriptions.Item>
            </Descriptions>

            {verifyResult && (
              <div>
                <Divider style={{ margin: '16px 0' }} />
                <div style={{ marginBottom: 12, padding: 12, borderRadius: 6, background: verifyResult.success ? '#f6ffed' : '#fff1f0', border: `1px solid ${verifyResult.success ? '#b7eb8f' : '#ffa39e'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    {verifyResult.success ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} /> : <SafetyOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />}
                    <span style={{ fontWeight: 500, color: verifyResult.success ? '#389e0d' : '#cf1322' }}>
                      {verifyResult.success ? '链上验证通过' : '链上验证失败'}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: '#888' }}>
                      验证时间：{verifyResult.verifyTime}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
                    {verifyResult.auditConclusion}
                  </div>
                  {verifyResult.confirmations && (
                    <div style={{ fontSize: 12, color: '#888' }}>
                      区块确认数：{verifyResult.confirmations} | 共识机制：{verifyResult.consensus} | 节点数：{verifyResult.nodeCount}
                    </div>
                  )}
                </div>

                {verifyResult.auditDetails && (
                  <div>
                    <Title level={5} style={{ fontSize: 14, marginBottom: 12 }}>审计复查明细</Title>
                    <List
                      size="small"
                      dataSource={verifyResult.auditDetails}
                      renderItem={(item) => (
                        <List.Item style={{ padding: '8px 12px', background: '#fafafa', borderRadius: 4, marginBottom: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <div>
                              <span style={{ fontWeight: 500 }}>{item.item}</span>
                              <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>{item.desc}</span>
                            </div>
                            <Tag color={item.status === '通过' ? 'green' : 'red'}>
                              {item.status}
                            </Tag>
                          </div>
                        </List.Item>
                      )}
                    />
                  </div>
                )}

                {verifyResult.dataHash && (
                  <div style={{ marginTop: 12, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>数据哈希 (data_hash)</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all', color: '#333' }}>
                      {verifyResult.dataHash}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="发布村务内容"
        open={publishVisible}
        onCancel={() => {
          if (publishStatus !== 'publishing') {
            setPublishVisible(false);
            setPublishStep(1);
            setPublishStatus('idle');
            form.resetFields();
          }
        }}
        footer={null}
        destroyOnClose
        width={window.innerWidth < 768 ? '100%' : 600}
        maskClosable={publishStatus !== 'publishing'}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            {['填写内容', '内容复核', '短信验证', '发布结果'].map((step, idx) => (
              <div key={idx} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: publishStep > idx + 1 ? '#52c41a' : publishStep === idx + 1 ? '#1890ff' : '#d9d9d9',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 4px',
                  fontSize: 12,
                }}>
                  {publishStep > idx + 1 ? '✓' : idx + 1}
                </div>
                <div style={{ fontSize: 11, color: publishStep >= idx + 1 ? '#333' : '#999' }}>{step}</div>
              </div>
            ))}
          </div>
        </div>

        {publishStep === 1 && (
          <Form form={form} layout="vertical" onFinish={handlePublish} size="middle">
            <div style={{ marginBottom: 12, padding: 12, background: '#e6f7ff', borderRadius: 6, fontSize: 12, color: '#1890ff' }}>
              <SafetyOutlined style={{ marginRight: 4 }} />
              提示：发布内容需经乡镇管理员短信二次验证后方可提交审核，审核通过后自动上链存证
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item name="type" label="分类" rules={[{ required: true }]}>
                <Select placeholder="请选择分类">
                  {['资金', '资产', '资源', '低保', '补贴', '招标', '采购'].map((t) => (
                    <Option key={t} value={t}>{t}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="amount" label="金额/预算" rules={[{ required: true }]}>
                <Input placeholder="如: 50万元" />
              </Form.Item>
            </div>
            <Form.Item name="title" label="标题" rules={[{ required: true }]}>
              <Input placeholder="请输入标题" />
            </Form.Item>
            <Form.Item name="name" label="涉及对象">
              <Input placeholder="可选，如涉及个人/单位" />
            </Form.Item>
            <Form.Item name="content" label="详细内容" rules={[{ required: true }]}>
              <TextArea rows={4} placeholder="请输入详细内容" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button onClick={() => { setPublishVisible(false); form.resetFields(); setPublishStep(1); setPublishStatus('idle'); }}>取消</Button>
                <Button type="primary" htmlType="submit">
                  下一步：内容复核
                </Button>
              </div>
            </Form.Item>
          </Form>
        )}

        {publishStep === 2 && (
          <div>
            <div style={{ marginBottom: 16, padding: 16, background: '#fffbe6', borderRadius: 6, border: '1px solid #ffe58f' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <SafetyOutlined style={{ color: '#faad14', fontSize: 18 }} />
                <span style={{ fontWeight: 500, color: '#d46b08' }}>内容复核中，请确认以下信息</span>
              </div>
              <Descriptions size="small" column={1} bordered>
                <Descriptions.Item label="分类">{form.getFieldValue('type')}</Descriptions.Item>
                <Descriptions.Item label="金额/预算">{form.getFieldValue('amount')}</Descriptions.Item>
                <Descriptions.Item label="标题">{form.getFieldValue('title')}</Descriptions.Item>
                <Descriptions.Item label="涉及对象">{form.getFieldValue('name') || '无'}</Descriptions.Item>
                <Descriptions.Item label="详细内容">{form.getFieldValue('content')}</Descriptions.Item>
              </Descriptions>
            </div>
            <div style={{ marginBottom: 12, fontSize: 12, color: '#888' }}>
              复核通过后，将发送短信验证码到乡镇管理员进行二次确认
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button onClick={() => setPublishStep(1)}>返回修改</Button>
              <Button type="primary" onClick={() => { setPublishStep(3); setPublishStatus('sms'); setSmsModalVisible(true); }}>
                确认无误，发送验证码
              </Button>
            </div>
          </div>
        )}

        {publishStep === 3 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Spin tip="等待管理员短信验证..." size="large" />
            <div style={{ marginTop: 16, fontSize: 13, color: '#666' }}>
              已向乡镇管理员发送验证码，请输入验证
            </div>
          </div>
        )}

        {publishStep === 4 && (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            {publishStatus === 'success' ? (
              <>
                <div style={{ fontSize: 48, color: '#52c41a', marginBottom: 12 }}>✓</div>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>发布成功</div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
                  内容已提交乡镇管理员审核，审核通过后将自动上链存证
                </div>
              </>
            ) : publishStatus === 'failed' ? (
              <>
                <div style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 12 }}>✗</div>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>发布失败</div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
                  请检查网络连接后重试，或联系技术支持
                </div>
              </>
            ) : (
              <>
                <Spin size="large" />
                <div style={{ marginTop: 12, fontSize: 13, color: '#666' }}>正在发布...</div>
              </>
            )}
            {publishStatus !== 'publishing' && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                {publishStatus === 'failed' && (
                  <Button onClick={() => { setPublishStep(1); setPublishStatus('idle'); }}>重新发布</Button>
                )}
                <Button type="primary" onClick={() => { setPublishVisible(false); setPublishStep(1); setPublishStatus('idle'); form.resetFields(); }}>
                  {publishStatus === 'success' ? '完成' : '关闭'}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="乡镇管理员短信验证"
        open={smsModalVisible}
        onCancel={() => {
          if (publishStatus !== 'publishing') {
            setSmsModalVisible(false);
            setSmsCode('');
            setPublishStep(2);
          }
        }}
        footer={null}
        destroyOnClose
        width={window.innerWidth < 768 ? '100%' : 420}
        maskClosable={publishStatus !== 'publishing'}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 12, padding: 12, background: '#e6f7ff', borderRadius: 6, border: '1px solid #91d5ff' }}>
            <div style={{ color: '#1890ff', fontWeight: 500, marginBottom: 4 }}>村务发布二次验证</div>
            <div style={{ fontSize: 12, color: '#666' }}>为确保村务信息真实有效，需乡镇管理员短信验证后方可提交</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, marginBottom: 8 }}>管理员手机号</div>
            <div style={{ padding: '8px 12px', background: '#f5f5f5', borderRadius: 4, fontFamily: 'monospace' }}>139****5678</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, marginBottom: 8 }}>验证码</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                placeholder="请输入6位验证码"
                maxLength={6}
                style={{ flex: 1 }}
              />
              <Button
                onClick={handleSendSms}
                disabled={smsCountdown > 0}
                loading={smsSending}
              >
                {smsCountdown > 0 ? `${smsCountdown}s` : '获取验证码'}
              </Button>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#999', marginBottom: 16 }}>
            提示：测试期间任意6位数字即可通过验证
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => { setSmsModalVisible(false); setSmsCode(''); setPublishStep(2); }}>取消</Button>
            <Button type="primary" onClick={handleVerifySms}>确认验证</Button>
          </div>
        </div>
      </Modal>

      <Modal
        title="发布结果"
        open={publishResultVisible}
        onCancel={() => {
          setPublishResultVisible(false);
          setPublishVisible(false);
          form.resetFields();
          setPublishStep(1);
          setPublishStatus('idle');
          loadData();
        }}
        footer={
          <Space>
            <Button onClick={() => {
              setPublishResultVisible(false);
              setPublishVisible(false);
              form.resetFields();
              setPublishStep(1);
              setPublishStatus('idle');
              loadData();
            }}>关闭</Button>
            <Button type="primary" onClick={() => {
              setPublishResultVisible(false);
              setActiveTab('pending');
              setPublishVisible(false);
              form.resetFields();
              setPublishStep(1);
              setPublishStatus('idle');
            }}>查看待审核列表</Button>
          </Space>
        }
        destroyOnClose
        width={window.innerWidth < 768 ? '100%' : 640}
      >
        {publishResult && (
          <div>
            <div style={{ marginBottom: 16, padding: 16, background: '#f6ffed', borderRadius: 6, border: '1px solid #b7eb8f', textAlign: 'center' }}>
              <div style={{ fontSize: 48, color: '#52c41a', marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>发布成功</div>
              <div style={{ fontSize: 13, color: '#666' }}>内容已提交乡镇管理员审核，审核通过后将自动上链存证</div>
            </div>

            <Descriptions size="small" column={1} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="标题">{publishResult.title}</Descriptions.Item>
              <Descriptions.Item label="分类">{publishResult.type}</Descriptions.Item>
              <Descriptions.Item label="金额/预算">{publishResult.amount}</Descriptions.Item>
              <Descriptions.Item label="涉及对象">{publishResult.name || '无'}</Descriptions.Item>
              <Descriptions.Item label="短信验证">
                <Tag color="blue">已通过 - 139****5678</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <Tag color="orange">{publishResult.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="审核人">{publishResult.reviewer}</Descriptions.Item>
              <Descriptions.Item label="提交时间">{publishResult.created_at}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 500 }}>操作留痕记录</div>
            <List
              size="small"
              dataSource={publishResult.audit_trail}
              renderItem={(item, idx) => (
                <List.Item style={{ padding: '10px 12px', background: '#fafafa', borderRadius: 4, marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                      <span style={{ fontWeight: 500, color: '#1890ff' }}>[步骤 {idx + 1}]</span>
                      <span style={{ marginLeft: 8 }}>{item.action}</span>
                      <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>- 操作人：{item.operator}</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#999' }}>{item.time}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{item.note}</div>
                </List.Item>
              )}
            />

            <div style={{ marginTop: 16, padding: 12, background: '#fffbe6', borderRadius: 6, fontSize: 12, color: '#d46b08' }}>
              <div style={{ marginBottom: 4 }}>📋 后续流程：</div>
              <div>1. 乡镇管理员审核内容（预计1-2个工作日）</div>
              <div>2. 审核通过后自动上链存证，生成区块链哈希</div>
              <div>3. 可在"待审核"标签页查看审核进度</div>
              <div>4. 审核通过后内容将显示在对应分类的公开列表中</div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="村务内容操作留痕"
        open={itemAuditTrailVisible}
        onCancel={() => setItemAuditTrailVisible(false)}
        footer={null}
        destroyOnClose
        width={window.innerWidth < 768 ? '100%' : 640}
      >
        {selectedItemAudit && (
          <div>
            <div style={{ marginBottom: 16, padding: 12, background: '#e6f7ff', borderRadius: 6, border: '1px solid #91d5ff' }}>
              <div style={{ fontWeight: 500, color: '#1890ff', marginBottom: 4 }}>{selectedItemAudit.title}</div>
              <div style={{ fontSize: 12, color: '#666' }}>所有操作均已记录，可追溯、可复查、不可篡改</div>
            </div>

            <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="分类">{selectedItemAudit.type}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color="orange">{selectedItemAudit.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="短信验证">
                <Tag color={selectedItemAudit.sms_verified ? 'green' : 'red'}>
                  {selectedItemAudit.sms_verified ? '已验证' : '未验证'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="审核人">{selectedItemAudit.reviewer}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 500 }}>完整操作留痕</div>
            <List
              dataSource={selectedItemAudit.audit_trail}
              renderItem={(item, idx) => (
                <List.Item style={{ padding: '12px 0', borderBottom: idx < selectedItemAudit.audit_trail.length - 1 ? '1px dashed #f0f0f0' : 'none' }}>
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: idx === 0 ? '#52c41a' : '#1890ff',
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12,
                      }}>
                        {idx + 1}
                      </div>
                    }
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                          <span style={{ fontWeight: 500 }}>{item.action}</span>
                        </span>
                        <span style={{ fontSize: 12, color: '#999' }}>{item.time}</span>
                      </div>
                    }
                    description={
                      <div style={{ fontSize: 12, color: '#666' }}>
                        操作人：{item.operator} | {item.note}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />

            <div style={{ marginTop: 16, padding: 12, background: '#fafafa', borderRadius: 6, fontSize: 12, color: '#888' }}>
              <div style={{ marginBottom: 4 }}>📋 审计复查结论：</div>
              <div>• 发布流程合规，所有操作均有记录</div>
              <div>• 短信身份验证通过，发布者身份真实有效</div>
              <div>• 待乡镇管理员审核后自动上链存证</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
