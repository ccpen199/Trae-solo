import { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, AlertTriangle, Clock, FileText, Gauge, Calendar, ChevronLeft, ChevronRight, X, Image as ImageIcon } from 'lucide-react';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import Tabs, { TabPanel } from '@/components/Tabs';
import { cn } from '@/lib/utils';

interface MeterReadingRecord {
  id: string;
  user_id: string;
  meter_id: string;
  reading: number;
  previous_reading: number;
  consumption: number;
  reading_date: string;
  method: 'ocr' | 'manual';
  ocr_confidence: number | null;
  image_url: string | null;
  meter_no?: string;
}

interface OcrResult {
  reading: number;
  confidence: number;
  mock: boolean;
  processed_at: string;
  meterNo?: string;
}

const mockMeterNo = 'MT100007';

export default function MeterReading() {
  const [activeTab, setActiveTab] = useState('ocr');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [manualReading, setManualReading] = useState('');
  const [manualMeterNo, setManualMeterNo] = useState('');
  const [previousReading, setPreviousReading] = useState(356.82);
  const [historyList, setHistoryList] = useState<MeterReadingRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const pageSize = 5;
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch('/api/meter-readings/history/user-1?limit=20');
      const result = await response.json();
      if (result.success) {
        setHistoryList(result.data);
        if (result.data.length > 0) {
          setPreviousReading(result.data[0].reading);
        }
      }
    } catch (error) {
      console.error('获取历史记录失败:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      processOcr(file);
    };
    reader.readAsDataURL(file);
  };

  const processOcr = async (file: File) => {
    setIsProcessing(true);
    setOcrResult(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch('/api/meter-readings/ocr', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        setOcrResult({
          ...result.data,
          meterNo: mockMeterNo,
        });
      }
    } catch (error) {
      console.error('OCR识别失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setOcrResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const calculateConsumption = () => {
    const current = activeTab === 'ocr' ? ocrResult?.reading || 0 : parseFloat(manualReading) || 0;
    return Math.max(0, current - previousReading);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitSuccess(false);
    try {
      const reading = activeTab === 'ocr' ? ocrResult?.reading : parseFloat(manualReading);
      const method = activeTab === 'ocr' ? 'ocr' : 'manual';
      const ocrConfidence = activeTab === 'ocr' ? ocrResult?.confidence : null;

      const response = await fetch('/api/meter-readings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'user-1',
          meter_id: 'meter-1',
          reading: reading,
          reading_date: new Date().toISOString().split('T')[0],
          method,
          ocr_confidence: ocrConfidence,
          image_url: selectedImage || null,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSubmitSuccess(true);
        fetchHistory();
        setTimeout(() => {
          setSubmitSuccess(false);
          if (activeTab === 'ocr') {
            clearImage();
          } else {
            setManualReading('');
            setManualMeterNo('');
          }
        }, 2000);
      }
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = activeTab === 'ocr' 
    ? !ocrResult || isProcessing 
    : !manualReading || !manualMeterNo;

  const paginatedHistory = historyList.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(historyList.length / pageSize);

  const getConfidenceVariant = (confidence: number | null) => {
    if (!confidence) return 'default';
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.7) return 'warning';
    return 'danger';
  };

  const getConfidenceLabel = (confidence: number | null) => {
    if (!confidence) return '-';
    if (confidence >= 0.9) return '高置信度';
    if (confidence >= 0.7) return '需确认';
    return '低置信度';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">智能抄表</h1>
          <p className="mt-1 text-sm text-gray-500">
            支持OCR拍照识别和手动录入两种方式，快速完成燃气表抄表
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <Tabs
              items={[
                { key: 'ocr', label: 'OCR拍照识别', icon: Camera },
                { key: 'manual', label: '手动录入', icon: FileText },
              ]}
              activeKey={activeTab}
              onChange={setActiveTab}
              className="mb-4"
            >
              <TabPanel tabKey="ocr">
                <div className="space-y-4">
                  {!selectedImage ? (
                    <div
                      className={cn(
                        'relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer',
                        'hover:border-primary-400 hover:bg-primary-50/50',
                        isDragging
                          ? 'border-primary-500 bg-primary-50 scale-[1.02]'
                          : 'border-gray-300 bg-gray-50/50'
                      )}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <div className="flex flex-col items-center gap-4">
                        <div className={cn(
                          'w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300',
                          isDragging ? 'bg-primary-500' : 'bg-primary-100'
                        )}>
                          <Camera className={cn(
                            'w-10 h-10 transition-colors duration-300',
                            isDragging ? 'text-white' : 'text-primary-600'
                          )} />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-800">
                            拍摄/上传表具照片
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            点击上传或拖拽图片到此处
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <ImageIcon className="w-4 h-4" />
                          <span>支持 JPG、PNG 格式，单张不超过 10MB</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative group">
                      <img
                        src={selectedImage}
                        alt="表具照片"
                        className="w-full h-64 object-cover rounded-2xl"
                      />
                      <button
                        onClick={clearImage}
                        className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {isProcessing && (
                        <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                          <div className="text-center text-white">
                            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                            <p className="mt-3 text-sm">正在识别中...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {ocrResult && (
                    <div className={cn(
                      'p-5 rounded-xl border transition-all duration-300',
                      ocrResult.confidence >= 0.9
                        ? 'bg-green-50 border-green-200'
                        : 'bg-amber-50 border-amber-200'
                    )}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">识别读数</p>
                          <p className="text-4xl font-bold text-gray-900">
                            {ocrResult.reading.toFixed(2)}
                            <span className="text-lg font-normal text-gray-500 ml-1">m³</span>
                          </p>
                        </div>
                        <StatusBadge
                          variant={getConfidenceVariant(ocrResult.confidence)}
                          icon
                        >
                          {getConfidenceLabel(ocrResult.confidence)} {(ocrResult.confidence * 100).toFixed(1)}%
                        </StatusBadge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200/50">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">表具编号</p>
                          <p className="text-sm font-medium text-gray-900">{ocrResult.meterNo}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">本期用气量</p>
                          <p className="text-sm font-medium text-primary-600">
                            {calculateConsumption().toFixed(2)} m³
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {ocrResult && (
                    <div className="space-y-3 pt-2">
                      <p className="text-sm font-medium text-gray-700">手动修正</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500">修正读数</label>
                          <input
                            type="number"
                            defaultValue={ocrResult.reading}
                            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                            placeholder="请输入读数"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">表号</label>
                          <input
                            type="text"
                            defaultValue={ocrResult.meterNo}
                            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                            placeholder="请输入表号"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabPanel>

              <TabPanel tabKey="manual">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      表具编号 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      value={manualMeterNo}
                      onChange={(e) => setManualMeterNo(e.target.value)}
                      placeholder="请输入燃气表编号"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        本期读数 <span className="text-danger">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={manualReading}
                          onChange={(e) => setManualReading(e.target.value)}
                          placeholder="请输入读数"
                          className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">m³</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        上期读数
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={previousReading.toFixed(2)}
                          readOnly
                          className="w-full px-4 py-3 pr-12 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">m³</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">本期用气量</span>
                      <span className="text-2xl font-bold text-primary-600">
                        {calculateConsumption().toFixed(2)}
                        <span className="text-sm font-normal ml-1">m³</span>
                      </span>
                    </div>
                  </div>
                </div>
              </TabPanel>
            </Tabs>

            <div className="pt-4 border-t border-gray-100">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                loading={isSubmitting}
                disabled={isSubmitDisabled}
                onClick={handleSubmit}
                icon={submitSuccess ? CheckCircle : undefined}
              >
                {submitSuccess ? '提交成功' : '提交抄表记录'}
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">历史抄表记录</h2>
              <span className="text-sm text-gray-500">共 {historyList.length} 条</span>
            </div>

            {isLoadingHistory ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto" />
                <p className="mt-3 text-sm text-gray-500">加载中...</p>
              </div>
            ) : historyList.length === 0 ? (
              <div className="py-12 text-center">
                <Gauge className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">暂无抄表记录</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-2 text-xs font-medium text-gray-500">日期</th>
                        <th className="text-right py-3 px-2 text-xs font-medium text-gray-500">读数</th>
                        <th className="text-right py-3 px-2 text-xs font-medium text-gray-500">用量</th>
                        <th className="text-center py-3 px-2 text-xs font-medium text-gray-500">方式</th>
                        <th className="text-center py-3 px-2 text-xs font-medium text-gray-500">置信度</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedHistory.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-sm text-gray-700">{item.reading_date}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <span className="text-sm font-medium text-gray-900">
                              {item.reading.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <span className="text-sm text-primary-600">
                              +{item.consumption.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <StatusBadge variant={item.method === 'ocr' ? 'info' : 'default'}>
                              {item.method === 'ocr' ? 'OCR识别' : '手动录入'}
                            </StatusBadge>
                          </td>
                          <td className="py-3 px-2 text-center">
                            {item.method === 'ocr' ? (
                              <StatusBadge
                                variant={getConfidenceVariant(item.ocr_confidence)}
                                icon
                              >
                                {(item.ocr_confidence! * 100).toFixed(0)}%
                              </StatusBadge>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      第 {currentPage}/{totalPages} 页
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                            currentPage === page
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          )}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-600" />
            抄表须知
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50/50 rounded-xl">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <Camera className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">拍照建议</h4>
              <p className="text-xs text-gray-500">请保持光线充足，表具数字清晰可见，避免反光和模糊</p>
            </div>
            <div className="p-4 bg-green-50/50 rounded-xl">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">数据准确</h4>
              <p className="text-xs text-gray-500">OCR识别结果仅供参考，如发现读数异常请手动修正后提交</p>
            </div>
            <div className="p-4 bg-amber-50/50 rounded-xl">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">安全提示</h4>
              <p className="text-xs text-gray-500">抄表时请注意安全，如发现燃气泄漏请立即拨打报修电话</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
