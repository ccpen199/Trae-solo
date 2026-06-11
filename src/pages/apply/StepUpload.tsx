import { useState } from 'react';
import { Upload, CheckCircle, Link as LinkIcon, FileText } from 'lucide-react';
import { certificates } from '@/mock/data';
import type { ServiceItem } from '@/types';

interface StepUploadProps {
  service: ServiceItem;
  uploadedDocs: string[];
  onUpdate: (uploadedDocs: string[]) => void;
}

export default function StepUpload({ service, uploadedDocs, onUpdate }: StepUploadProps) {
  const [uploading, setUploading] = useState<string | null>(null);

  const handleUpload = (doc: string) => {
    setUploading(doc);
    setTimeout(() => {
      onUpdate([...uploadedDocs, doc]);
      setUploading(null);
    }, 1500);
  };

  const handleAutoLink = (doc: string) => {
    if (!uploadedDocs.includes(doc)) {
      onUpdate([...uploadedDocs, doc]);
    }
  };

  const matchedCerts = certificates.filter((c) =>
    service.requiredDocuments.some(
      (doc) => c.typeName.includes(doc) || doc.includes(c.typeName)
    )
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gov-text mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gov-blue" />
          所需材料
        </h3>
        <div className="space-y-3">
          {service.requiredDocuments.map((doc) => {
            const isUploaded = uploadedDocs.includes(doc);
            const isUploading = uploading === doc;
            return (
              <div key={doc} className="flex items-center justify-between p-4 bg-gov-bg rounded-lg">
                <div className="flex items-center gap-3">
                  {isUploaded ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <FileText className="w-5 h-5 text-gov-text-secondary" />
                  )}
                  <span className={`text-sm ${isUploaded ? 'text-emerald-600' : 'text-gov-text'}`}>
                    {doc}
                  </span>
                </div>
                {isUploaded ? (
                  <span className="text-xs text-emerald-600 font-medium">已上传</span>
                ) : (
                  <button
                    onClick={() => handleUpload(doc)}
                    disabled={isUploading}
                    className="gov-btn-primary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-50"
                  >
                    <Upload className="w-3 h-3" />
                    {isUploading ? '上传中...' : '上传'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {matchedCerts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gov-text mb-3 flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-gov-cyan" />
            关联电子证照
          </h3>
          <div className="space-y-2">
            {matchedCerts.map((cert) => (
              <div key={cert.id} className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gov-text">{cert.typeName}</p>
                  <p className="text-xs text-gov-text-secondary">{cert.issuingAuthority}</p>
                </div>
                <button
                  onClick={() => handleAutoLink(cert.typeName)}
                  className="text-xs text-gov-cyan font-medium hover:underline"
                >
                  自动关联
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
