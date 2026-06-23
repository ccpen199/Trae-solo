import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/appStore';
import { pdfApi, standardsApi } from '@/services/api';
import { PdfDocument, GarbageItem } from '../../../shared/types';
import { Upload, Link, FileText, Trash2, Eye, X, Save, Plus, MapPin } from 'lucide-react';

export default function PdfManagement() {
  const { currentCity, setCurrentCity, cities } = useAppStore();
  const [pdfs, setPdfs] = useState<PdfDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<PdfDocument | null>(null);
  const [contentModal, setContentModal] = useState(false);
  const [linkModal, setLinkModal] = useState(false);
  const [items, setItems] = useState<GarbageItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [version, setVersion] = useState('1.0');
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ line: string; lineNumber: number }>>([]);

  useEffect(() => {
    if (currentCity) {
      loadPdfs();
    }
  }, [currentCity]);

  const loadPdfs = async () => {
    if (!currentCity) return;
    setLoading(true);
    try {
      const res = await pdfApi.getList(currentCity.id);
      setPdfs(res.docs);
    } catch (error) {
      console.error('加载PDF列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const handleFileUpload = async (file: File) => {
    if (!currentCity || !file.type.includes('pdf')) {
      alert('请上传PDF文件');
      return;
    }
    setUploading(true);
    try {
      await pdfApi.upload(file, currentCity.id, version);
      loadPdfs();
      setVersion('1.0');
    } catch (error) {
      console.error('上传PDF失败:', error);
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [currentCity, version]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const viewContent = async (pdf: PdfDocument) => {
    try {
      const res = await pdfApi.getById(pdf.id);
      setSelectedPdf(res.doc);
      setContentModal(true);
      setKeyword('');
      setSearchResults([]);
    } catch (error) {
      console.error('获取PDF内容失败:', error);
    }
  };

  const searchContent = async () => {
    if (!selectedPdf || !keyword.trim()) return;
    try {
      const res = await pdfApi.searchInPdf(selectedPdf.id, keyword);
      setSearchResults(res.results);
    } catch (error) {
      console.error('搜索PDF内容失败:', error);
    }
  };

  const openLinkModal = async (pdf: PdfDocument) => {
    if (!currentCity) return;
    try {
      setSelectedPdf(pdf);
      setSelectedItems(pdf.linkedItemIds || []);
      const catsRes = await standardsApi.getCategories(currentCity.id);
      const allItems: GarbageItem[] = [];
      for (const cat of catsRes.categories) {
        const itemsRes = await standardsApi.getCategoryItems(cat.id);
        allItems.push(...itemsRes.items);
      }
      setItems(allItems);
      setLinkModal(true);
    } catch (error) {
      console.error('加载条目列表失败:', error);
    }
  };

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const saveLinks = async () => {
    if (!selectedPdf) return;
    try {
      await pdfApi.linkItems(selectedPdf.id, selectedItems);
      setLinkModal(false);
      loadPdfs();
    } catch (error) {
      console.error('关联条目失败:', error);
    }
  };

  const deletePdf = async (id: string) => {
    if (!confirm('确定删除该PDF文件？')) return;
    try {
      await pdfApi.delete(id);
      loadPdfs();
    } catch (error) {
      console.error('删除PDF失败:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">PDF管理</h1>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-4 py-2">
            <MapPin className="w-5 h-5 text-green-400" />
            <select
              value={currentCity?.id || ''}
              onChange={(e) => {
                const city = cities.find(c => c.id === e.target.value);
                if (city) setCurrentCity(city);
              }}
              className="bg-transparent border-none outline-none text-white min-w-32"
            >
              {cities.map(city => (
                <option key={city.id} value={city.id} className="bg-gray-800">
                  {city.province} - {city.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div
        className={`border-2 border-dashed rounded-2xl p-8 mb-6 text-center transition-all ${
          dragOver ? 'border-green-400 bg-green-500/10' : 'border-gray-700 bg-gray-800/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className={`w-12 h-12 mx-auto mb-4 ${dragOver ? 'text-green-400' : 'text-gray-500'}`} />
        <p className="text-lg mb-2">{dragOver ? '释放文件上传' : '拖拽PDF文件到此处'}</p>
        <p className="text-sm text-gray-400 mb-4">或点击下方按钮选择文件</p>
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 bg-gray-700 rounded-lg px-4 py-2">
            <span className="text-sm text-gray-400">版本:</span>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0"
              className="bg-transparent border-none outline-none text-white w-20"
            />
          </div>
          <label className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-6 py-2 rounded-lg cursor-pointer transition-colors">
            <Plus className="w-5 h-5" />
            <span>{uploading ? '上传中...' : '选择文件'}</span>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileInput}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : pdfs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>暂无PDF文件</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pdfs.map(pdf => (
            <div key={pdf.id} className="bg-gray-800 rounded-xl p-4 hover:bg-gray-750 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{pdf.fileName}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                      <span>{formatFileSize(pdf.fileSize)}</span>
                      <span>{formatDate(pdf.uploadTime)}</span>
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                        v{pdf.version}
                      </span>
                      {pdf.linkedItemIds?.length > 0 && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                          已关联 {pdf.linkedItemIds.length} 条
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => viewContent(pdf)}
                    className="flex items-center gap-1 px-3 py-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">查看解析</span>
                  </button>
                  <button
                    onClick={() => openLinkModal(pdf)}
                    className="flex items-center gap-1 px-3 py-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                  >
                    <Link className="w-4 h-4" />
                    <span className="text-sm">关联条目</span>
                  </button>
                  <button
                    onClick={() => deletePdf(pdf.id)}
                    className="flex items-center gap-1 px-3 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">删除</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {contentModal && selectedPdf && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div>
                <h2 className="text-xl font-bold">解析内容</h2>
                <p className="text-sm text-gray-400 mt-1">{selectedPdf.fileName}</p>
              </div>
              <button onClick={() => setContentModal(false)} className="p-2 hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 border-b border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchContent()}
                  placeholder="搜索关键词..."
                  className="flex-1 bg-gray-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={searchContent}
                  className="px-6 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                >
                  搜索
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  {searchResults.map((result, idx) => (
                    <div key={idx} className="bg-gray-700/50 rounded-lg p-3">
                      <span className="text-xs text-green-400 mr-2">行 {result.lineNumber}:</span>
                      <span className="text-sm">{result.line}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-auto p-6">
              <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans leading-relaxed">
                {selectedPdf.parsedContent}
              </pre>
            </div>
          </div>
        </div>
      )}

      {linkModal && selectedPdf && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div>
                <h2 className="text-xl font-bold">关联分类条目</h2>
                <p className="text-sm text-gray-400 mt-1">{selectedPdf.fileName}</p>
              </div>
              <button onClick={() => setLinkModal(false)} className="p-2 hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-2">
                {items.map(item => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedItems.includes(item.id)
                        ? 'bg-green-500/20 border border-green-500/50'
                        : 'bg-gray-700/50 hover:bg-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleItem(item.id)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500"
                    />
                    <div>
                      <span className="font-medium">{item.name}</span>
                      {item.aliases?.length > 0 && (
                        <span className="text-sm text-gray-400 ml-2">({item.aliases.join(', ')})</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
              <button
                onClick={() => setLinkModal(false)}
                className="px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveLinks}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-green-500 hover:bg-green-600 transition-colors"
              >
                <Save className="w-4 h-4" />
                保存关联
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
