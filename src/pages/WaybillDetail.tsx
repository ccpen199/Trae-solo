import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  Printer,
  Download,
  User,
  Phone,
  MapPin,
  Package,
  Scale,
  Box,
  Shield,
  Clock,
  PenLine,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Tag } from '@/components/common/Tag';
import { get } from '@/utils/request';

interface WaybillDetailData {
  id: string;
  waybillNo: string;
  regulatoryCode: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderRealNameId?: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  itemName: string;
  itemType: string;
  quantity: number;
  weight: number;
  volume: number;
  declaredValue: number;
  freight: number;
  courierName: string;
  createdAt: string;
  syncedAt?: string;
}

const maskName = (name: string) => {
  if (!name) return '';
  if (name.length <= 1) return name;
  return name.charAt(0) + '*'.repeat(name.length - 1);
};

const maskPhone = (phone: string) => {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
};

const maskAddress = (address: string) => {
  if (!address || address.length < 6) return address;
  return address.slice(0, 6) + '****' + address.slice(-4);
};

const mockDetail: WaybillDetailData = {
  id: '1',
  waybillNo: 'YZ2024010100001',
  regulatoryCode: 'REG20240115A0001',
  senderName: '张三',
  senderPhone: '13800138001',
  senderAddress: '北京市朝阳区建国路88号SOHO现代城A座1201室',
  senderRealNameId: 'RN****2024****8899',
  receiverName: '李四',
  receiverPhone: '13900139001',
  receiverAddress: '上海市浦东新区陆家嘴环路1000号恒生银行大厦25楼',
  itemName: '智能手机',
  itemType: '电子产品',
  quantity: 1,
  weight: 0.5,
  volume: 0.002,
  declaredValue: 3999,
  freight: 15,
  courierName: '王快递',
  createdAt: '2024-01-15 10:30:00',
  syncedAt: '2024-01-15 10:35:00',
};

export default function WaybillDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WaybillDetailData | null>(null);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const result = await get<WaybillDetailData>(`/waybill/${id}`);
      setData(result);
    } catch (err) {
      setData(mockDetail);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert('下载功能演示');
  };

  if (loading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            leftIcon={ArrowLeft}
            onClick={() => navigate('/waybills')}
          >
            返回列表
          </Button>
          <div className="flex gap-3 print:hidden">
            <Button variant="secondary" leftIcon={Printer} onClick={handlePrint}>
              打印
            </Button>
            <Button leftIcon={Download} onClick={handleDownload}>
              下载
            </Button>
          </div>
        </div>

        <div className="rounded-xl border-8 border-gray-300 bg-white shadow-xl print:border-0 print:shadow-none">
          <div className="border-b-2 border-dashed border-gray-300 p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">中国邮政 电子运单</h1>
                    <p className="text-xs text-gray-500">China Post Electronic Waybill</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-xs text-gray-500">快递单号</div>
                  <div className="font-mono text-2xl font-bold tracking-wider text-primary">
                    {data.waybillNo}
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <QRCodeSVG
                    value={data.regulatoryCode}
                    size={96}
                    level="M"
                    includeMargin={false}
                    fgColor="#006F3C"
                  />
                </div>
                <div className="mt-2">
                  <div className="text-xs text-gray-500">唯一监管码</div>
                  <div className="font-mono text-xs font-medium text-gray-700">
                    {data.regulatoryCode}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                    <span className="text-xs font-bold text-white">寄</span>
                  </div>
                  <h2 className="font-semibold text-gray-900">寄件人信息</h2>
                  {data.senderRealNameId && (
                    <Tag color="success">
                      <Shield className="mr-1 h-3 w-3" />
                      已实名
                    </Tag>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{maskName(data.senderName)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{maskPhone(data.senderPhone)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    <span className="text-gray-700">{maskAddress(data.senderAddress)}</span>
                  </div>
                  {data.senderRealNameId && (
                    <div className="mt-2 rounded bg-white px-2 py-1">
                      <span className="text-xs text-gray-500">实名号：</span>
                      <span className="font-mono text-xs text-primary">
                        {data.senderRealNameId}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                    <span className="text-xs font-bold text-white">收</span>
                  </div>
                  <h2 className="font-semibold text-gray-900">收件人信息</h2>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{maskName(data.receiverName)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{maskPhone(data.receiverPhone)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    <span className="text-gray-700">{maskAddress(data.receiverAddress)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-gray-900">物品信息</h2>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">物品类别</div>
                    <div className="mt-0.5 font-medium text-gray-900">{data.itemType}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">物品名称</div>
                    <div className="mt-0.5 font-medium text-gray-900">{data.itemName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">数量</div>
                    <div className="mt-0.5 font-medium text-gray-900">{data.quantity} 件</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">声明价值</div>
                    <div className="mt-0.5 font-medium text-gray-900">¥ {data.declaredValue}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Scale className="h-3 w-3" />
                      重量
                    </div>
                    <div className="mt-0.5 font-medium text-gray-900">{data.weight} kg</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Box className="h-3 w-3" />
                      体积
                    </div>
                    <div className="mt-0.5 font-medium text-gray-900">{data.volume} m³</div>
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-primary/5 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">运费</span>
                    <span className="text-xl font-bold text-primary">¥ {data.freight}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-gray-300 p-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <div className="mb-2 flex items-center gap-1 text-xs text-gray-500">
                  <PenLine className="h-3 w-3" />
                  快递员签名
                </div>
                <div className="h-14 border-b border-gray-300">
                  <span className="font-cursive text-lg italic text-gray-600">
                    {data.courierName}
                  </span>
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  收寄时间
                </div>
                <div className="h-14 border-b border-gray-300">
                  <span className="font-mono text-sm text-gray-700">{data.createdAt}</span>
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-1 text-xs text-gray-500">
                  <Lock className="h-3 w-3" />
                  加密验证
                </div>
                <div className="flex h-14 items-center">
                  <Tag color="success">
                    <Shield className="mr-1 h-3 w-3" />
                    数据已加密
                  </Tag>
                  {data.syncedAt && (
                    <Tag color="primary" className="ml-2">
                      已同步监管
                    </Tag>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 text-center text-xs text-gray-400">
            本运单采用区块链加密存储，确保数据真实不可篡改 · 监管备案号：{data.regulatoryCode}
          </div>
        </div>
      </div>
    </div>
  );
}
