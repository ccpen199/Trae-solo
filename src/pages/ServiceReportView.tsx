import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { getCategoryById, getCategoryPath } from '../data/mockData'
import { formatDateTime, formatDate } from '../utils/geo'
import { formatMoney } from '../utils/matching'
import {
  ArrowLeft,
  FileText,
  ClipboardList,
  Wrench,
  ShieldCheck,
  StickyNote,
  Printer,
  Download,
} from 'lucide-react'

export const ServiceReportView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { reports, tasks, technicians } = useAppStore()

  const report = reports.find(r => r.id === id)
  const task = report ? tasks.find(t => t.id === report.taskId) : null
  const tech = task?.technicianId ? technicians.find(t => t.id === task.technicianId) : null
  const cat = task ? getCategoryById(task.categoryId) : null

  if (!report) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-600">
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>
        <div className="card text-center text-gray-500 py-12">
          未找到对应的服务报告
        </div>
      </div>
    )
  }

  const totalPartsCost = report.parts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0)
  const warrantyEndDate = new Date(report.createdAt)
  warrantyEndDate.setMonth(warrantyEndDate.getMonth() + report.warrantyMonths)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-600">
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>
        <div className="flex gap-2">
          <button className="btn-secondary text-sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 inline mr-1" /> 打印
          </button>
          <button className="btn-secondary text-sm">
            <Download className="w-4 h-4 inline mr-1" /> 导出
          </button>
        </div>
      </div>

      <div className="card" id="service-report">
        <div className="text-center border-b pb-4 mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FileText className="w-8 h-8 text-primary-600" />
            <h1 className="text-2xl font-bold">维修服务报告</h1>
          </div>
          <p className="text-sm text-gray-500">报告编号：{report.id}</p>
          <p className="text-sm text-gray-500">生成时间：{formatDateTime(report.createdAt)}</p>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-medium flex items-center gap-2 mb-3">
              <ClipboardList className="w-5 h-5 text-gray-600" />
              订单信息
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">服务类型：</span>
                <span>{cat ? getCategoryPath(cat.id).map(c => c.name).join(' / ') : '未分类'}</span>
              </div>
              <div>
                <span className="text-gray-500">故障标题：</span>
                <span>{task?.title}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">服务地址：</span>
                <span>{task?.address}</span>
              </div>
              <div>
                <span className="text-gray-500">服务师傅：</span>
                <span>{tech?.name || '未指派'}</span>
              </div>
              <div>
                <span className="text-gray-500">联系电话：</span>
                <span>{tech?.phone || '-'}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium flex items-center gap-2 mb-3">
              <Wrench className="w-5 h-5 text-gray-600" />
              故障诊断
            </h3>
            <div className="p-4 bg-gray-50 rounded-lg text-sm">
              {report.diagnosis}
            </div>
          </div>

          <div>
            <h3 className="font-medium flex items-center gap-2 mb-3">
              <ClipboardList className="w-5 h-5 text-gray-600" />
              更换配件清单
            </h3>
            {report.parts.length === 0 ? (
              <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                本次维修未更换配件
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">配件名称</th>
                      <th className="px-4 py-2 text-center font-medium">数量</th>
                      <th className="px-4 py-2 text-right font-medium">单价</th>
                      <th className="px-4 py-2 text-right font-medium">小计</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {report.parts.map((part, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2">{part.name}</td>
                        <td className="px-4 py-2 text-center">{part.quantity}</td>
                        <td className="px-4 py-2 text-right">{formatMoney(part.unitPrice)}</td>
                        <td className="px-4 py-2 text-right">{formatMoney(part.quantity * part.unitPrice)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td colSpan={3} className="px-4 py-2 text-right">配件合计</td>
                      <td className="px-4 py-2 text-right text-primary-600">{formatMoney(totalPartsCost)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-medium flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-gray-600" />
              质保信息
            </h3>
            <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">质保期限：</span>
                  <span className="font-medium text-success-700">{report.warrantyMonths}个月</span>
                </div>
                <div>
                  <span className="text-gray-500">质保到期：</span>
                  <span className="font-medium text-success-700">{formatDate(warrantyEndDate.toISOString())}</span>
                </div>
              </div>
              <p className="text-xs text-success-700 mt-2">
                在质保期内，如因维修质量或配件原因导致同一故障复发，可免费返修。
              </p>
            </div>
          </div>

          {report.notes && (
            <div>
              <h3 className="font-medium flex items-center gap-2 mb-3">
                <StickyNote className="w-5 h-5 text-gray-600" />
                备注说明
              </h3>
              <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg text-sm text-warning-800">
                {report.notes}
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div>
                <p className="text-gray-500 mb-8">客户签字确认：</p>
                <div className="border-b w-32"></div>
                <p className="text-xs text-gray-400 mt-1">日期：________________</p>
              </div>
              <div>
                <p className="text-gray-500 mb-8">服务师傅签字：</p>
                <div className="border-b w-32"></div>
                <p className="text-xs text-gray-400 mt-1">日期：{formatDate(report.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 py-4">
        本报告由去中心化维修服务平台生成，数据本地加密存储，平台不收取任何佣金
      </div>
    </div>
  )
}
