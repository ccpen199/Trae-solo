import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Button,
  Select,
  DatePicker,
  Input,
  Drawer,
  Tag,
  Table,
  Divider,
  Empty,
  Space,
  Row,
  Col,
  Typography,
  Dropdown,
  message,
  QRCode,
  Spin,
  Tooltip,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  FileSearch,
  Download,
  ShieldCheck,
  Link2,
  Copy,
  Calendar as CalendarIcon,
  QrCode,
  Hash,
  Globe,
  User as UserIcon,
  Clock,
  Search,
  Filter,
  FileCheck2,
  FileText,
  ChevronDown,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import { get, post } from '@/utils/api';
import { mockCertificates } from '../../shared/mockData';
import type { Certificate, CertificateType } from 'shared/types';
import { CERTIFICATE_NAMES } from 'shared/types';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const CERTIFICATE_TYPE_COLORS: Record<CertificateType, string> = {
  INSURANCE_APPLY: 'blue',
  SUPPLEMENTARY_PAY: 'orange',
  BASE_ADJUSTMENT: 'purple',
  HOSPITAL_CHANGE: 'cyan',
  TRANSFER: 'green',
  PAYMENT: 'magenta',
};

const CERTIFICATE_TYPE_ICONS: Record<CertificateType, typeof FileText> = {
  INSURANCE_APPLY: FileText,
  SUPPLEMENTARY_PAY: FileCheck2,
  BASE_ADJUSTMENT: FileText,
  HOSPITAL_CHANGE: FileCheck2,
  TRANSFER: FileText,
  PAYMENT: FileCheck2,
};

function maskValue(key: string, value: any): string {
  const str = String(value);
  if (/身份证|idNumber|证件|卡号|账户|银行/.test(key)) {
    if (str.length >= 10) {
      return str.slice(0, 4) + '********' + str.slice(-4);
    }
  }
  if (/手机|phone|电话/.test(key)) {
    if (str.length >= 11) {
      return str.slice(0, 3) + '****' + str.slice(-4);
    }
  }
  if (/姓名|name|操作人/.test(key)) {
    if (str.length >= 2) {
      return str[0] + '*'.repeat(Math.max(1, str.length - 1));
    }
  }
  if (/IP|ip/.test(key)) {
    const parts = str.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.*.*`;
    }
  }
  return str;
}

function getHashLast4(hash: string): string {
  if (!hash || hash.length < 4) return '0000';
  return hash.slice(-4).toUpperCase();
}

function CertificateCard({
  cert,
  onClick,
}: {
  cert: Certificate;
  onClick: () => void;
}) {
  const Icon = CERTIFICATE_TYPE_ICONS[cert.type];
  const createdAt = dayjs(cert.createdAt);
  const watermark = `©社保通 ${createdAt.format('YYYY-MM-DD')}`;
  const hash4 = getHashLast4(cert.hash);

  return (
    <Card
      hoverable
      onClick={onClick}
      className="h-full overflow-hidden group"
      styles={{
        body: { padding: 0, height: '100%' },
      }}
    >
      <div className="relative bg-gradient-to-br from-slate-50 to-blue-50 h-full">
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(30, 64, 175, 0.12) 1px, transparent 0)",
            backgroundSize: '16px 16px',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='60'%3E%3Ctext x='0' y='30' fill='%231e40af' font-family='serif' font-size='14'%3E${encodeURIComponent(
              watermark
            )}%3C/text%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            transform: 'rotate(-18deg)',
          }}
        />

        <div className="relative p-5 flex flex-col h-full">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                }}
              >
                <Icon size={18} className="text-white" />
              </div>
              <div>
                <div className="font-semibold text-slate-800 text-sm">{cert.title}</div>
                <Tag
                  color={CERTIFICATE_TYPE_COLORS[cert.type]}
                  style={{ margin: 0, fontSize: 11, marginTop: 2 }}
                >
                  {CERTIFICATE_NAMES[cert.type]}
                </Tag>
              </div>
            </div>
            <Tag color="green" icon={<ShieldCheck size={11} />} style={{ fontSize: 11 }}>
              已存证
            </Tag>
          </div>

          <div className="flex-1 space-y-1.5 mb-4 pr-2">
            {Object.entries(cert.content)
              .slice(0, 3)
              .map(([k, v]) => (
                <div key={k} className="flex items-start justify-between text-xs gap-2">
                  <span className="text-slate-500 flex-shrink-0">{k}</span>
                  <span className="text-slate-700 font-medium text-right truncate">
                    {maskValue(k, v)}
                  </span>
                </div>
              ))}
            {Object.keys(cert.content).length > 3 && (
              <div className="text-xs text-blue-600 pt-1">
                等 {Object.keys(cert.content).length} 项内容...
              </div>
            )}
          </div>

          <div className="flex items-end justify-between relative">
            <div className="space-y-0.5">
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <CalendarIcon size={10} /> 签发时间
              </div>
              <div className="text-xs text-slate-600 font-mono">
                {createdAt.format('YYYY-MM-DD HH:mm')}
              </div>
              <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                <Hash size={10} /> 哈希末4位
              </div>
              <div className="text-xs font-mono font-semibold text-blue-700">#{hash4}</div>
            </div>

            <div className="relative">
              <div
                className="absolute -bottom-2 -right-1 w-20 h-20 rounded-full flex items-center justify-center pointer-events-none group-hover:opacity-100 transition-opacity"
                style={{ opacity: 0.9 }}
              >
                <div className="absolute inset-0 rounded-full border-2 border-red-600 opacity-70" />
                <div className="absolute inset-2 rounded-full border border-red-600 opacity-50" />
                <div className="text-center relative z-10 p-2">
                  <div className="text-red-700 font-serif font-bold text-[11px] leading-tight" style={{ transform: 'rotate(-8deg)' }}>
                    社保通
                    <br />
                    电子签章
                  </div>
                </div>
              </div>

              <div className="relative bg-white p-1.5 rounded border border-slate-200 shadow-sm z-0">
                <QRCode
                  value={cert.verifyUrl || cert.certificateNo}
                  size={52}
                  errorLevel="M"
                  color="#1e40af"
                />
                <div className="text-[9px] text-center text-slate-400 mt-0.5 font-mono">
                  {cert.certificateNo.slice(-6)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative px-5 py-2.5 bg-gradient-to-r from-blue-800 via-blue-700 to-blue-800 flex items-center justify-between">
          <div className="text-white text-[10px] opacity-90 truncate flex-1 font-mono">
            NO.{cert.certificateNo}
          </div>
          <div className="text-white text-[10px] opacity-90 flex items-center gap-1 ml-2 flex-shrink-0">
            <QrCode size={10} />
            扫码验真
          </div>
        </div>
      </div>
    </Card>
  );
}

function CertificateDetailDrawer({
  cert,
  open,
  onClose,
}: {
  cert: Certificate | null;
  open: boolean;
  onClose: () => void;
}) {
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<null | {
    valid: boolean;
    reason?: string;
    blockchainVerified?: boolean;
    verifyTime?: string;
  }>(null);

  useEffect(() => {
    if (open) {
      setVerifyResult(null);
    }
  }, [open, cert]);

  if (!cert) return null;

  const createdAt = dayjs(cert.createdAt);

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await post('/certificate/verify', {
        certificateNo: cert.certificateNo,
        hash: cert.hash,
      });
      if (res?.data) {
        setVerifyResult(res.data as any);
        if (res.data.valid) {
          message.success('凭证验真通过');
        } else {
          message.error(res.data.reason || '凭证验真失败');
        }
      }
    } catch (e: any) {
      message.error(e?.message || '验真失败，请稍后重试');
    } finally {
      setVerifying(false);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/verify/${cert.certificateNo}`;
    navigator.clipboard?.writeText(link).then(
      () => message.success('验真链接已复制'),
      () => message.error('复制失败')
    );
  };

  const contentEntries = Object.entries(cert.content);

  const auditItems = [
    { key: '操作人', value: cert.operatorName, icon: UserIcon, mask: true },
    { key: '操作时间', value: dayjs(cert.timestamp).format('YYYY-MM-DD HH:mm:ss'), icon: Clock },
    { key: 'IP地址', value: cert.ipAddress, icon: Globe, mask: true },
    {
      key: 'User-Agent',
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      icon: Globe,
    },
    { key: '哈希值 (SHA-256)', value: cert.hash, icon: Hash, mono: true },
    {
      key: '区块链存证 TxID',
      value: cert.blockchainTxId || '暂无',
      icon: ShieldCheck,
      mono: true,
    },
  ];

  return (
    <Drawer
      title={
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' }}
          >
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <div className="font-semibold text-slate-800">{cert.title}</div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              {cert.certificateNo}
            </div>
          </div>
          <Tag color="green" icon={<ShieldCheck size={12} />} className="ml-2">
            已存证
          </Tag>
          <Tag color={CERTIFICATE_TYPE_COLORS[cert.type]}>
            {CERTIFICATE_NAMES[cert.type]}
          </Tag>
        </div>
      }
      open={open}
      onClose={onClose}
      width={620}
      extra={
        <Space>
          <Button icon={<Copy size={14} />} size="small" onClick={handleCopyLink}>
            复制链接
          </Button>
        </Space>
      }
    >
      <div className="fade-in">
        <div className="mb-5 bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-xl p-6 border border-slate-200 relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(30, 64, 175, 0.1) 1px, transparent 0)",
              backgroundSize: '20px 20px',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.05]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='80'%3E%3Ctext x='0' y='40' fill='%231e40af' font-family='serif' font-size='20'%3E${encodeURIComponent(
                `©社保通 ${createdAt.format('YYYY-MM-DD')} 电子凭证`
              )}%3C/text%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
              transform: 'rotate(-12deg)',
            }}
          />

          <div className="relative flex gap-6">
            <div className="flex-1">
              <div className="text-xs text-slate-400 mb-1">凭证编号</div>
              <div className="text-lg font-mono font-bold text-blue-800 tracking-wide mb-4">
                {cert.certificateNo}
              </div>
              <div className="text-xs text-slate-400 mb-1">凭证名称</div>
              <div className="text-base font-semibold text-slate-800 mb-4 font-serif">
                {cert.title}
              </div>
              <div className="text-xs text-slate-400 mb-1">签发机构</div>
              <div className="text-sm font-medium text-slate-700 mb-4">
                政务社保公积金代缴服务平台
              </div>
              <div className="text-xs text-slate-400 mb-1">签发时间</div>
              <div className="text-sm font-mono text-slate-600">
                {createdAt.format('YYYY年MM月DD日 HH:mm:ss')}
              </div>
            </div>

            <div className="flex-shrink-0 text-center">
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm inline-block">
                <QRCode
                  value={cert.verifyUrl || cert.certificateNo}
                  size={110}
                  errorLevel="H"
                  color="#1e40af"
                />
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  扫码在线验真
                </div>
              </div>

              <div className="relative w-24 h-24 mx-auto -mt-4 opacity-85">
                <div className="absolute inset-0 rounded-full border-2 border-red-600" />
                <div className="absolute inset-2 rounded-full border border-red-600 opacity-70" />
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ transform: 'rotate(-10deg)' }}
                >
                  <div className="text-center">
                    <div className="text-red-700 font-serif font-bold text-sm leading-tight">
                      社保通
                    </div>
                    <div className="text-red-700 font-serif text-[10px] leading-tight">
                      电子签章
                    </div>
                    <div className="text-red-700 font-serif text-[9px] mt-0.5">
                      {createdAt.format('YYYY.MM.DD')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {verifyResult && (
          <div
            className={`mb-5 p-4 rounded-xl border ${
              verifyResult.valid
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {verifyResult.valid ? (
                <ShieldCheck size={22} className="text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck size={22} className="text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div
                  className={`font-semibold ${
                    verifyResult.valid ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {verifyResult.valid ? '凭证验真通过 ✓' : '凭证验真失败 ✗'}
                </div>
                <div className="text-xs mt-1 text-slate-600">
                  验真时间：{verifyResult.verifyTime && dayjs(verifyResult.verifyTime).format('YYYY-MM-DD HH:mm:ss')}
                  {verifyResult.blockchainVerified && (
                    <Tag color="blue" className="ml-2" style={{ margin: 0 }}>
                      区块链已核验
                    </Tag>
                  )}
                </div>
                {verifyResult.reason && (
                  <div className="text-xs mt-1 text-red-600">{verifyResult.reason}</div>
                )}
              </div>
            </div>
          </div>
        )}

        <Card
          size="small"
          title={
            <div className="font-semibold text-slate-700 flex items-center gap-2">
              <FileText size={15} className="text-blue-700" /> 凭证内容
              <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>
                脱敏展示
              </Tag>
            </div>
          }
          className="mb-4"
        >
          <Table
            size="small"
            pagination={false}
            showHeader={false}
            dataSource={contentEntries.map(([k, v], idx) => ({
              key: idx,
              k,
              v,
            }))}
            columns={[
              {
                dataIndex: 'k',
                width: '35%',
                render: (v: string) => (
                  <span className="text-slate-500 text-sm">{v}</span>
                ),
              },
              {
                dataIndex: 'v',
                render: (v: any, record: any) => (
                  <span className="text-slate-800 text-sm font-medium font-mono">
                    {maskValue(record.k, v)}
                  </span>
                ),
              },
            ]}
          />
        </Card>

        <Card
          size="small"
          title={
            <div className="font-semibold text-slate-700 flex items-center gap-2">
              <ShieldCheck size={15} className="text-blue-700" /> 操作痕迹与存证信息
            </div>
          }
          className="mb-4"
        >
          <div className="space-y-2.5">
            {auditItems.map((item) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={item.key}
                  className="flex items-start justify-between gap-4 py-1.5 border-b border-slate-100 last:border-b-0"
                >
                  <div className="flex items-center gap-2 text-slate-500 text-xs flex-shrink-0">
                    <ItemIcon size={12} />
                    {item.key}
                  </div>
                  <div
                    className={`text-xs text-slate-700 text-right break-all ${
                      item.mono ? 'font-mono' : ''
                    }`}
                  >
                    {item.mask ? maskValue(item.key, item.value) : item.value}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Divider className="!my-4" />

        <div className="grid grid-cols-3 gap-3">
          <Button
            icon={<Download size={15} />}
            size="large"
            className="h-11"
            onClick={() => message.info('PDF下载功能（占位）')}
          >
            下载PDF
          </Button>
          <Button
            type="primary"
            icon={<ShieldCheck size={15} />}
            size="large"
            className="h-11"
            loading={verifying}
            onClick={handleVerify}
          >
            {verifyResult ? '重新验真' : '在线验真'}
          </Button>
          <Button
            icon={<Link2 size={15} />}
            size="large"
            className="h-11"
            onClick={handleCopyLink}
          >
            复制验真链接
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

function Certificates() {
  const [list, setList] = useState<Certificate[]>(mockCertificates);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<CertificateType | 'ALL'>('ALL');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<Certificate | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { userId: 'U001', pageSize: 50 };
      if (typeFilter !== 'ALL') params.type = typeFilter;
      const res = await get('/certificate', { params });
      if (res?.data?.list) {
        setList(res.data.list);
      }
    } catch {
      setList(mockCertificates);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter]);

  const filtered = useMemo(() => {
    let arr = list;
    if (dateRange && dateRange[0] && dateRange[1]) {
      arr = arr.filter((c) => {
        const t = dayjs(c.createdAt);
        return t.isAfter(dateRange[0]!.startOf('day')) && t.isBefore(dateRange[1]!.endOf('day'));
      });
    }
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      arr = arr.filter(
        (c) =>
          c.certificateNo.toLowerCase().includes(kw) ||
          c.title.toLowerCase().includes(kw)
      );
    }
    return arr;
  }, [list, dateRange, keyword]);

  const menuItems: MenuProps['items'] = [
    {
      key: 'ALL',
      label: '全部类型',
      onClick: () => setTypeFilter('ALL'),
    },
    ...Object.entries(CERTIFICATE_NAMES).map(([k, v]) => ({
      key: k,
      label: v,
      onClick: () => setTypeFilter(k as CertificateType),
    })),
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Title level={3} className="!mb-1 gov-text-gradient">
            电子凭证库
          </Title>
          <Text type="secondary">
            所有业务办理电子凭证，区块链存证，可在线验真与下载
          </Text>
        </div>
        <Button icon={<RefreshCw size={14} />} onClick={loadData}>
          刷新
        </Button>
      </div>

      <Card className="mb-6 shadow-sm" styles={{ body: { padding: 16 } }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <Text className="text-sm text-slate-500">筛选：</Text>
          </div>

          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button>
              <Space>
                {typeFilter === 'ALL'
                  ? '全部类型'
                  : CERTIFICATE_NAMES[typeFilter as CertificateType]}
                <ChevronDown size={14} />
              </Space>
            </Button>
          </Dropdown>

          <Select
            value={typeFilter}
            onChange={(v) => setTypeFilter(v)}
            style={{ width: 180 }}
            options={[
              { value: 'ALL', label: '全部类型' },
              ...Object.entries(CERTIFICATE_NAMES).map(([k, v]) => ({
                value: k,
                label: v,
              })),
            ]}
          />

          <RangePicker
            value={dateRange as any}
            onChange={(v) => setDateRange(v as any)}
            placeholder={['开始日期', '结束日期']}
          />

          <Input
            prefix={<Search size={14} className="text-slate-400" />}
            placeholder="搜索凭证号 / 凭证名称"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 260 }}
            allowClear
          />

          <div className="ml-auto text-sm text-slate-500">
            共 <Text strong className="text-blue-700">{filtered.length}</Text> 张凭证
          </div>
        </div>
      </Card>

      <Spin spinning={loading}>
        {filtered.length === 0 ? (
          <Empty
            description="暂无符合条件的电子凭证"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className="py-20"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((cert) => (
              <CertificateCard
                key={cert.id}
                cert={cert}
                onClick={() => {
                  setSelected(cert);
                  setDrawerOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </Spin>

      <CertificateDetailDrawer
        cert={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}

export default Certificates;
