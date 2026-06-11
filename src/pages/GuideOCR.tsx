import { useState } from 'react'
import { Upload, RefreshCw, CheckCircle } from 'lucide-react'
import type { OcrResponse } from '@/types'

export default function GuideOCR() {
  const [image, setImage] = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState<OcrResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [formFields, setFormFields] = useState<Record<string, string>>({})

  const handleUpload = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/guide/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: 'simulated' }),
      })
      if (!res.ok) throw new Error('OCR识别失败')
      const data: OcrResponse = await res.json()
      setOcrResult(data)
      setFormFields(data.recognizedFields)
      setImage('uploaded')
    } catch {
      const mock: OcrResponse = {
        recognizedFields: {
          姓名: '张三',
          身份证号: '320102199001011234',
          住址: '南京市玄武区某某路123号',
          有效期: '2020.01.01-2040.01.01',
        },
        confidence: 0.92,
      }
      setOcrResult(mock)
      setFormFields(mock.recognizedFields)
      setImage('uploaded')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setImage(null)
    setOcrResult(null)
    setFormFields({})
  }

  const confidencePct = ocrResult ? Math.round(ocrResult.confidence * 100) : 0
  const confidenceColor =
    confidencePct >= 90 ? 'bg-green-500' : confidencePct >= 70 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-medium text-gray-800 mb-4">证件上传</h3>
          <div
            onClick={handleUpload}
            className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
              image ? 'border-convenience bg-convenience/5' : 'border-gray-200 hover:border-gov-blue-300'
            }`}
          >
            {image ? (
              <>
                <CheckCircle className="w-10 h-10 text-convenience mb-2" />
                <p className="text-sm text-convenience font-medium">证件已上传</p>
                <p className="text-xs text-gray-400 mt-1">点击重新上传</p>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">点击上传证件照片</p>
                <p className="text-xs text-gray-400 mt-1">支持身份证、户口本、营业执照等</p>
              </>
            )}
          </div>
          {loading && (
            <p className="mt-3 text-sm text-gray-400 text-center">正在识别中...</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-gray-800">识别结果</h3>
            {ocrResult && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">置信度</span>
                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${confidenceColor}`}
                    style={{ width: `${confidencePct}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700">{confidencePct}%</span>
              </div>
            )}
          </div>

          {ocrResult ? (
            <div className="space-y-3">
              {Object.entries(formFields).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-1">{key}</label>
                  <input
                    value={value}
                    onChange={(e) => setFormFields({ ...formFields, [key]: e.target.value })}
                    className="w-full px-3 py-2 border border-convenience/30 bg-convenience/5 rounded-md text-sm focus:outline-none focus:border-convenience"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-300 text-sm">
              请先上传证件
            </div>
          )}

          {ocrResult && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => alert('提交成功')}
                className="flex-1 py-2 bg-gov-blue-500 text-white rounded-md hover:bg-gov-blue-600 text-sm font-medium transition-colors"
              >
                确认提交
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 text-sm transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                重新识别
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
