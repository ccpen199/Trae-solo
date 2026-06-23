import { X, Download, Share2, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

interface QRCodeModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  url: string;
  subtitle?: string;
}

const QRCodeModal = ({ open, onClose, title, url, subtitle }: QRCodeModalProps) => {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}-二维码.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-gradient-to-r from-primary-50 to-white">
          <h3 className="text-lg font-semibold text-zinc-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 text-center">
          <div className="inline-block p-4 bg-white rounded-2xl shadow-lg border border-zinc-100 mb-4">
            <QRCodeSVG
              id="qr-code-svg"
              value={url}
              size={200}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#1e3a8a"
            />
          </div>

          {subtitle && (
            <p className="text-sm text-zinc-600 mb-2">{subtitle}</p>
          )}

          <div className="flex items-center justify-center gap-2 p-3 bg-zinc-50 rounded-lg mb-6">
            <p className="text-sm text-zinc-500 truncate flex-1 text-left">{url}</p>
            <button
              onClick={handleCopy}
              className="p-1.5 text-zinc-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
              title="复制链接"
            >
              {copied ? <Check className="w-4 h-4 text-success-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 btn-secondary flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>下载二维码</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>复制链接</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
