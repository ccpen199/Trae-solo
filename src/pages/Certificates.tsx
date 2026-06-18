import { useState } from "react";
import {
  CreditCard,
  QrCode,
  Download,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Shield,
  Eye,
  History,
} from "lucide-react";
import { mockCertificates } from "@/data/mockData";
import type { Certificate, CertificateStatus } from "@/types";

const statusConfig: Record<CertificateStatus, { text: string; icon: typeof CheckCircle2; className: string }> = {
  valid: { text: "有效", icon: CheckCircle2, className: "text-success-600 bg-success-50" },
  expiring: { text: "即将过期", icon: Clock, className: "text-warning-600 bg-warning-50" },
  expired: { text: "已过期", icon: XCircle, className: "text-gray-500 bg-gray-100" },
  revoked: { text: "已吊销", icon: XCircle, className: "text-danger-600 bg-danger-50" },
};

export default function Certificates() {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<CertificateStatus | "all">("all");
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const filteredCerts = mockCertificates.filter((c) => {
    const matchSearch =
      c.type.includes(searchText) ||
      c.certNo.includes(searchText) ||
      c.holderName.includes(searchText);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: mockCertificates.length,
    valid: mockCertificates.filter((c) => c.status === "valid").length,
    expiring: mockCertificates.filter((c) => c.status === "expiring").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gov-600 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">电子证照库</h1>
              <p className="text-gray-500 text-sm">集成407类电子证照，支持扫码亮证、在线核验</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gov-100 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-gov-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-500">我的证照总数</div>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-success-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.valid}</div>
              <div className="text-sm text-gray-500">有效证照</div>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-warning-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.expiring}</div>
              <div className="text-sm text-gray-500">即将过期提醒</div>
            </div>
          </div>
        </div>

        <div className="card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索证照名称、编号..."
                className="input pl-10"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                className="input w-auto"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as CertificateStatus | "all")}
              >
                <option value="all">全部状态</option>
                <option value="valid">有效</option>
                <option value="expiring">即将过期</option>
                <option value="expired">已过期</option>
                <option value="revoked">已吊销</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredCerts.map((cert) => {
            const StatusIcon = statusConfig[cert.status].icon;
            return (
              <div
                key={cert.id}
                className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => setSelectedCert(cert)}
              >
                <div className={`bg-gradient-to-r ${cert.color} p-6 text-white relative`}>
                  <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 text-xs">
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig[cert.status].text}
                  </div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-lg font-semibold opacity-90">{cert.type}</div>
                      <div className="text-xs opacity-75 mt-0.5">{cert.issueAuthority}</div>
                    </div>
                    <Shield className="w-8 h-8 opacity-30" />
                  </div>
                  <div className="font-mono text-xl tracking-wider mb-4">{cert.certNo}</div>
                  <div className="flex justify-between text-sm opacity-80">
                    <span>持有人：{cert.holderName}</span>
                  </div>
                </div>
                <div className="bg-white p-4 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    有效期：{cert.issueDate} 至 {cert.expireDate}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn-secondary py-1.5 px-3 text-sm flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCert(cert);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                      查看
                    </button>
                    <button
                      className="btn-primary py-1.5 px-3 text-sm flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCert(cert);
                      }}
                    >
                      <QrCode className="w-4 h-4" />
                      亮证
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCerts.length === 0 && (
          <div className="card p-16 text-center">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无匹配的电子证照</p>
          </div>
        )}
      </div>

      {selectedCert && (
        <CertificateDetailModal cert={selectedCert} onClose={() => setSelectedCert(null)} />
      )}
    </div>
  );
}

function CertificateDetailModal({ cert, onClose }: { cert: Certificate; onClose: () => void }) {
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const StatusIcon = statusConfig[cert.status].icon;

  const generateQR = async () => {
    const QRCode = (await import("qrcode")).default;
    const data = JSON.stringify({
      certId: cert.id,
      typeCode: cert.typeCode,
      certNo: cert.certNo,
      holder: cert.holderName,
      timestamp: Date.now(),
    });
    const url = await QRCode.toDataURL(data, { width: 240, margin: 2 });
    setQrDataUrl(url);
    setShowQR(true);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {!showQR ? (
          <>
            <div className={`bg-gradient-to-r ${cert.color} p-8 text-white relative`}>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
              <div className="absolute top-4 left-4 flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-sm">
                <StatusIcon className="w-4 h-4" />
                {statusConfig[cert.status].text}
              </div>
              <div className="text-center mt-6">
                <Shield className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <h2 className="text-2xl font-bold">{cert.type}</h2>
                <p className="opacity-80 mt-1">{cert.issueAuthority}</p>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  证照信息
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-4">
                  {Object.entries(cert.fields).map(([key, value]) => (
                    <div key={key}>
                      <div className="text-xs text-gray-500 mb-1">{key}</div>
                      <div className="text-sm font-medium text-gray-900">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  使用记录（最近{cert.usageHistory.length}条）
                </h3>
                <div className="space-y-3">
                  {cert.usageHistory.map((record) => (
                    <div key={record.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gov-100 flex items-center justify-center flex-shrink-0">
                        <Eye className="w-4 h-4 text-gov-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-gray-900">{record.purpose}</span>
                          <span className="text-xs text-gray-400 flex-shrink-0">{record.time}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {record.verifierDept} · {record.verifier}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button className="btn-secondary flex-1 flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" />
                  下载证照
                </button>
                <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={generateQR}>
                  <QrCode className="w-5 h-5" />
                  扫码亮证
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
            >
              <XCircle className="w-5 h-5 text-gray-500" />
            </button>
            <div className="w-16 h-16 rounded-full bg-gov-100 flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-gov-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">扫码亮证</h3>
            <p className="text-sm text-gray-500 mb-6">请工作人员扫描下方二维码核验证照信息</p>
            <div className="bg-white p-4 rounded-2xl shadow-lg inline-block mb-6">
              {qrDataUrl && <img src={qrDataUrl} alt="证照二维码" className="w-60 h-60" />}
            </div>
            <div className="bg-gov-50 rounded-xl p-4 mb-6">
              <div className="text-sm text-gov-800">
                <div className="font-medium mb-1">{cert.type}</div>
                <div className="opacity-70">持有人：{cert.holderName}</div>
                <div className="opacity-70 font-mono text-xs mt-1">{cert.certNo}</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <Shield className="w-4 h-4" />
              二维码5分钟内有效，每次亮证自动刷新
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
