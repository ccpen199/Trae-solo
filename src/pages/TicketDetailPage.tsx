import { useState } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  Ticket,
  QrCode,
  Share2,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';

export default function TicketDetailPage() {
  const { currentTicketId, getTicketById, setCurrentPage } = useAppStore();
  const [qrVisible, setQrVisible] = useState(false);

  const ticket = currentTicketId ? getTicketById(currentTicketId) : undefined;

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-cinema-text-secondary">未找到该电影票</p>
      </div>
    );
  }

  const getStatusConfig = (status: typeof ticket.status) => {
    switch (status) {
      case 'valid':
        return {
          icon: CheckCircle,
          label: '有效',
          color: 'text-green-400',
          bg: 'bg-green-400/10',
          border: 'border-green-400/30',
        };
      case 'used':
        return {
          icon: CheckCircle,
          label: '已使用',
          color: 'text-cinema-text-muted',
          bg: 'bg-cinema-bg',
          border: 'border-cinema-border',
        };
      case 'expired':
        return {
          icon: XCircle,
          label: '已过期',
          color: 'text-red-400',
          bg: 'bg-red-400/10',
          border: 'border-red-400/30',
        };
    }
  };

  const statusConfig = getStatusConfig(ticket.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-cinema-bg-light border-b border-cinema-border sticky top-16 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentPage('tickets')}
                className="p-2 hover:bg-cinema-bg rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-cinema-text-secondary" />
              </button>
              <h1 className="text-xl font-bold text-cinema-text">电影票详情</h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-cinema-bg rounded-lg transition-colors">
                <Share2 className="w-5 h-5 text-cinema-text-secondary" />
              </button>
              <button className="p-2 hover:bg-cinema-bg rounded-lg transition-colors">
                <Download className="w-5 h-5 text-cinema-text-secondary" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div
          className={`relative bg-gradient-to-br from-cinema-bg-light to-cinema-bg rounded-2xl overflow-hidden border ${statusConfig.border} watermark`}
          data-watermark={ticket.watermark || ticket.movieTitle}
        >
          <div className="absolute top-6 right-6 z-10">
            <div className={`flex items-center gap-1.5 px-4 py-2 rounded-full ${statusConfig.bg} ${statusConfig.border} border`}>
              <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
              <span className={`text-sm font-medium ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>

          <div className="p-8">
            <div className="flex gap-8">
              <div className="relative w-40 h-60 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl">
                <img
                  src={ticket.poster}
                  alt={ticket.movieTitle}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-cinema-text mb-4">
                  {ticket.movieTitle}
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cinema-red/10 rounded-lg">
                      <Calendar className="w-5 h-5 text-cinema-red" />
                    </div>
                    <div>
                      <p className="text-sm text-cinema-text-muted">放映日期</p>
                      <p className="font-medium text-cinema-text">
                        {ticket.startTime.slice(0, 10)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cinema-red/10 rounded-lg">
                      <Clock className="w-5 h-5 text-cinema-red" />
                    </div>
                    <div>
                      <p className="text-sm text-cinema-text-muted">放映时间</p>
                      <p className="font-medium text-cinema-text">
                        {ticket.startTime.slice(11, 16)} - {ticket.endTime.slice(11, 16)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cinema-gold/10 rounded-lg">
                      <MapPin className="w-5 h-5 text-cinema-gold" />
                    </div>
                    <div>
                      <p className="text-sm text-cinema-text-muted">影院</p>
                      <p className="font-medium text-cinema-text">{ticket.cinemaName}</p>
                      <p className="text-sm text-cinema-text-muted">{ticket.hallName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cinema-gold/10 rounded-lg">
                      <Ticket className="w-5 h-5 text-cinema-gold" />
                    </div>
                    <div>
                      <p className="text-sm text-cinema-text-muted">座位</p>
                      <p className="font-medium text-cinema-text">{ticket.seat}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-dashed border-cinema-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-cinema-text-muted">票价</p>
                      <p className="text-3xl font-bold text-cinema-gold">¥{ticket.price}</p>
                    </div>

                    {ticket.status === 'valid' && (
                      <div className="text-center">
                        <button
                          onClick={() => setQrVisible(!qrVisible)}
                          className="p-4 bg-white rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          {qrVisible ? (
                            <QrCode className="w-24 h-24 text-cinema-bg" />
                          ) : (
                            <div className="w-24 h-24 flex flex-col items-center justify-center">
                              <QrCode className="w-10 h-10 text-cinema-bg mb-2" />
                              <span className="text-xs text-cinema-bg font-medium">点击出示</span>
                            </div>
                          )}
                        </button>
                        {qrVisible && (
                          <p className="text-xs text-cinema-text-muted mt-2">
                            请向工作人员出示二维码
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-x-0 top-0 flex justify-between px-4">
              {[...Array(30)].map((_, i) => (
                <div key={i} className="w-3 h-3 bg-cinema-bg rounded-full -mt-1.5" />
              ))}
            </div>
            <div className="border-t border-dashed border-cinema-border" />
          </div>

          <div className="p-6 flex flex-wrap items-center justify-between gap-4 text-xs text-cinema-text-muted">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>开场前 15 分钟停止检票</span>
            </div>
            <div className="flex items-center gap-6">
              <span>订单号：{ticket.orderId}</span>
              <span>票号：{ticket.id.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {ticket.status === 'valid' && (
          <div className="mt-8 grid md:grid-cols-2 gap-4">
            <button
              onClick={() => setCurrentPage('tickets')}
              className="btn-secondary py-4"
            >
              查看全部电影票
            </button>
            <button className="btn-primary py-4">
              申请退票
            </button>
          </div>
        )}

        <div className="mt-8 p-6 bg-cinema-bg-light rounded-xl border border-cinema-border">
          <h3 className="font-bold text-cinema-text mb-4">温馨提示</h3>
          <ul className="space-y-2 text-sm text-cinema-text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-cinema-red">•</span>
              <span>请在电影开场前 15 分钟到达影院，凭二维码检票入场</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cinema-red">•</span>
              <span>一张电影票对应一个座位，对号入座</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cinema-red">•</span>
              <span>如需退票，请在开场前 30 分钟申请，逾期将无法退票</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cinema-red">•</span>
              <span>电影票截图、转发无效，请使用本页面出示二维码</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
