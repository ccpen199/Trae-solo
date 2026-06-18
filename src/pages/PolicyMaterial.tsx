import { useState } from 'react';
import { Upload, CheckCircle, RefreshCw } from 'lucide-react';

interface Material {
  id: number;
  name: string;
  uploadDate: string;
  reusableFor: string[];
  ocrResult?: string;
}

const mockMaterials: Material[] = [
  { id: 1, name: '身份证正面.jpg', uploadDate: '2026-05-10', reusableFor: ['失业金申领', '职称申报', '劳动合同'], ocrResult: '姓名：张三，身份证号：110101199001011234' },
  { id: 2, name: '离职证明.pdf', uploadDate: '2026-05-12', reusableFor: ['失业金申领'], ocrResult: '离职原因：合同到期，离职日期：2026-04-30' },
  { id: 3, name: '学历证书.jpg', uploadDate: '2026-03-20', reusableFor: ['职称申报'], ocrResult: '学历：本科，专业：计算机科学与技术' },
];

export default function PolicyMaterial() {
  const [materials, setMaterials] = useState<Material[]>(mockMaterials);
  const [showOcr, setShowOcr] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ocrResult, setOcrResult] = useState('');

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setOcrResult('识别结果：文件类型 - 证明材料，关键信息已提取');
      setUploading(false);
    }, 1500);
  };

  const handleSaveMaterial = () => {
    const newMaterial: Material = {
      id: materials.length + 1,
      name: `新材料_${materials.length + 1}.pdf`,
      uploadDate: new Date().toISOString().split('T')[0],
      reusableFor: ['通用材料'],
      ocrResult,
    };
    setMaterials([newMaterial, ...materials]);
    setOcrResult('');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-800">材料识别与复用</h1>

      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <h2 className="text-base font-semibold text-neutral-700 mb-4">材料识别</h2>
        <div
          onClick={uploading ? undefined : handleUpload}
          className={`border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors ${uploading ? 'opacity-50 cursor-wait' : ''}`}
        >
          <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <p className="text-sm text-neutral-500">
            {uploading ? '识别中...' : '点击上传材料进行智能识别'}
          </p>
          <p className="text-xs text-neutral-400 mt-1">支持 PDF、JPG、PNG 格式</p>
        </div>
        {ocrResult && (
          <div className="mt-4 bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-700">识别结果</span>
            </div>
            <p className="text-sm text-primary-800">{ocrResult}</p>
            <button
              onClick={handleSaveMaterial}
              className="mt-3 px-4 py-1.5 bg-primary-700 text-white rounded-lg text-sm hover:bg-primary-800"
            >
              保存到材料库
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <h2 className="text-base font-semibold text-neutral-700 mb-4">材料库</h2>
        <div className="space-y-3">
          {materials.map((m) => (
            <div
              key={m.id}
              className="border border-neutral-100 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  <div>
                    <span className="text-sm font-medium text-neutral-700">{m.name}</span>
                    <span className="text-xs text-neutral-400 ml-2">{m.uploadDate}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.ocrResult && (
                    <button
                      onClick={() => setShowOcr(showOcr === m.id ? null : m.id)}
                      className="text-xs px-2 py-1 bg-primary-100 text-primary-600 rounded hover:bg-primary-200"
                    >
                      {showOcr === m.id ? '收起' : '查看识别结果'}
                    </button>
                  )}
                  <button className="flex items-center gap-1 text-xs px-2 py-1 bg-success-100 text-success-600 rounded hover:bg-success-200">
                    <RefreshCw className="w-3 h-3" />
                    复用
                  </button>
                </div>
              </div>
              <div className="flex gap-1.5 mt-2">
                {m.reusableFor.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
              {showOcr === m.id && m.ocrResult && (
                <div className="mt-3 p-3 bg-neutral-50 rounded-lg text-sm text-neutral-600">
                  {m.ocrResult}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
