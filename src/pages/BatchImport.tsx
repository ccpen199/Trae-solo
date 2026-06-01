import { useState } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function BatchImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.batchImport(file);
      setResult(data);
    } catch (err: any) {
      setError(err.message || '导入失败');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/api/batch/template';
    link.download = 'tax_calculation_template.xlsx';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">批量导入</h1>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold">上传文件</h2>
            <p className="text-sm text-gray-500 mt-1">支持 Excel 格式 (.xlsx)</p>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download size={18} />
            下载模板
          </button>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600 mb-2">点击或拖拽文件到此处上传</p>
            <p className="text-sm text-gray-400">支持 .xlsx, .xls 格式</p>
          </label>
        </div>

        {file && (
          <div className="mt-4 flex items-center justify-between bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FileText className="text-blue-500" size={24} />
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
              className="text-red-500 hover:text-red-700"
            >
              移除
            </button>
          </div>
        )}

        {file && (
          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            <Upload size={20} />
            {loading ? '导入中...' : '开始导入'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">导入结果</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{result.totalRows}</div>
              <div className="text-sm text-gray-500">总行数</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{result.successRows}</div>
              <div className="text-sm text-gray-500">成功</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{result.errorRows}</div>
              <div className="text-sm text-gray-500">失败</div>
            </div>
          </div>

          {result.errorDetails && result.errorDetails.length > 0 && (
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2 text-red-600">
                <AlertCircle size={18} />
                错误详情
              </h3>
              <div className="bg-red-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                {result.errorDetails.map((err: any, idx: number) => (
                  <div key={idx} className="text-sm text-red-700 mb-1 last:mb-0">
                    第 {err.row} 行: {err.error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.results && result.results.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-3 flex items-center gap-2 text-green-600">
                <CheckCircle size={18} />
                成功导入记录
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-2 px-3">行号</th>
                      <th className="text-left py-2 px-3">订单号</th>
                      <th className="text-left py-2 px-3">目的国</th>
                      <th className="text-right py-2 px-3">完税价格</th>
                      <th className="text-right py-2 px-3">关税</th>
                      <th className="text-right py-2 px-3">增值税</th>
                      <th className="text-right py-2 px-3">总税费</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-2 px-3">{item.row}</td>
                        <td className="py-2 px-3">{item.orderId}</td>
                        <td className="py-2 px-3">{item.countryCode}</td>
                        <td className="py-2 px-3 text-right">{item.totalCustomsValue?.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right">{item.dutyAmount?.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right">{item.vatAmount?.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-medium">{item.totalTax?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
