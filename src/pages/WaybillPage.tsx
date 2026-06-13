import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, QrCode, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';
import type { Waybill, Outlet } from '../../shared/types';

export default function WaybillPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<{ waybill: Waybill; outlet?: Outlet } | null>(null);

  useEffect(() => {
    if (id) api.orders.getWaybill(id).then((d) => setData(d as any));
  }, [id]);

  if (!data) return <div className="p-10 text-center text-neutral-400">加载中...</div>;
  const { waybill, outlet } = data;

  const serviceName = { standard: '标准快递', nextday: '次日达', secondDay: '隔日达' }[waybill.serviceLevel];
  const barcodeLines = waybill.trackingNo.split('').map((c, i) => (i % 2 === 0 ? 'h-6' : 'h-8')).join(' ');

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6 no-print">
        <button onClick={() => navigate('/')} className="btn-ghost">
          <ArrowLeft className="w-4 h-4" /> 返回首页
        </button>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="btn-primary">
            <Printer className="w-4 h-4" /> 打印电子运单
          </button>
        </div>
      </div>

      <div className="bg-white border-2 border-neutral-800 rounded-lg p-6 print:border-0 print:p-0" id="waybill-print">
        <div className="border-b-2 border-dashed border-neutral-300 pb-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-brand-600 tracking-wider">中通快递</div>
              <div className="text-xs text-neutral-500 tracking-widest">ZTO EXPRESS</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-neutral-500 mb-1">运单号</div>
              <div className="text-xl font-mono font-bold tracking-widest">{waybill.trackingNo}</div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 justify-center h-10 bg-neutral-100 overflow-hidden rounded">
            {waybill.trackingNo.split('').map((c, i) => (
              <div
                key={i}
                className={`inline-block bg-neutral-800 ${i % 3 === 0 ? 'w-1 h-full' : 'w-0.5 h-full'} mx-px`}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-4">
          <div className="p-3 bg-brand-50 rounded-lg">
            <div className="text-xs font-semibold text-brand-600 mb-1 flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] flex items-center justify-center font-bold">寄</div>
              寄件人信息
            </div>
            <div className="font-semibold text-neutral-700">{waybill.senderName} <span className="text-neutral-500 font-normal">{waybill.senderPhone}</span></div>
            <div className="text-sm text-neutral-600 mt-1">{waybill.senderAddress}</div>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="text-xs font-semibold text-accent-500 mb-1 flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-accent-500 text-white text-[10px] flex items-center justify-center font-bold">收</div>
              收件人信息
            </div>
            <div className="font-semibold text-neutral-700">{waybill.receiverName} <span className="text-neutral-500 font-normal">{waybill.receiverPhone}</span></div>
            <div className="text-sm text-neutral-600 mt-1">{waybill.receiverAddress}</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
          <div>
            <div className="text-xs text-neutral-400">物品类型</div>
            <div className="font-semibold text-neutral-700">{waybill.itemType}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-400">重量</div>
            <div className="font-semibold text-neutral-700">{waybill.weight} kg</div>
          </div>
          <div>
            <div className="text-xs text-neutral-400">服务类型</div>
            <div className="font-semibold text-neutral-700">{serviceName}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-400">运费</div>
            <div className="font-bold text-accent-500">¥{waybill.freight}</div>
          </div>
        </div>

        {waybill.isSpecial && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <span className="tag-red">特殊物品</span>
            <span className="text-sm text-neutral-600">{waybill.specialDesc}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 pt-4 border-t-2 border-dashed border-neutral-300">
          <div>
            <div className="text-xs text-neutral-400 mb-2">取件时间</div>
            <div className="text-sm font-semibold text-neutral-700">{waybill.pickupTime}</div>
            <div className="text-xs text-neutral-400 mb-2 mt-3">服务网点</div>
            <div className="text-sm font-semibold text-neutral-700">{outlet?.name || '-'}</div>
            {outlet && <div className="text-xs text-neutral-500">{outlet.phone}</div>}
          </div>
          <div className="flex flex-col items-center justify-center border-2 border-neutral-200 rounded-lg p-3">
            <QrCode className="w-20 h-20 text-neutral-800" strokeWidth={1.5} />
            <div className="text-[10px] text-neutral-400 mt-2">扫码查看物流</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-400">
          <div>下单时间：{waybill.createdAt}</div>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-success-500" />
            本电子运单已生成，请妥善保管
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-neutral-500 no-print">
        提示：请将打印后的运单贴在包裹外侧，快递员取件时核验
      </div>
    </div>
  );
}
