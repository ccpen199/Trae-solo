import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  User,
  Building2,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { mockBenefitStatement, mockUser } from '@/data/mock';
import { formatCurrency, formatIdNumber, getStatusText, getStatusColor, delay } from '@/utils/format';

export default function BenefitStatement() {
  const [generating, setGenerating] = useState(false);
  const [statement] = useState(mockBenefitStatement);

  const handleGenerate = async () => {
    setGenerating(true);
    await delay(1500);
    setGenerating(false);
    alert('权益单已生成，可下载或打印');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <Link to="/" className="hover:text-gov-red">
          首页
        </Link>
        <span>/</span>
        <span className="text-gray-700">个人社保权益单</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="gov-card p-6">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gov-red" />
                  个人社保权益单
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  养老 / 医疗 / 工伤 · 三险合一权益凭证
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="gov-btn-primary inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {generating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {generating ? '生成中...' : '重新生成'}
                </button>
                <button className="gov-btn-secondary inline-flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  下载 PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="gov-btn-secondary inline-flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  打印
                </button>
              </div>
            </div>

            <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
              <div className="bg-gradient-to-r from-gov-red to-red-700 text-white px-8 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-10 h-10" />
                    <div>
                      <h3 className="text-xl font-bold tracking-wide">
                        河北省个人社会保险权益单
                      </h3>
                      <p className="text-xs text-red-100 mt-0.5">
                        Hebei Personal Social Insurance Benefit Statement
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <p>单据编号</p>
                    <p className="font-mono mt-0.5">{statement.id}</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-dashed border-gray-200 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">姓名：</span>
                    <span className="text-gray-800 font-medium">{statement.holderName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">身份证号：</span>
                    <span className="text-gray-800 font-mono">
                      {formatIdNumber(statement.idNumber)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">权益周期：</span>
                    <span className="text-gray-800 font-medium">{statement.period}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">生成时间：</span>
                    <span className="text-gray-800 font-mono text-xs">{statement.generatedAt}</span>
                  </div>
                </div>

                <h4 className="text-base font-semibold text-gray-800 mb-4">
                  一、各险种参保及账户情况
                </h4>
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden mb-6">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs">
                      <th className="px-4 py-3 text-left font-medium">险种</th>
                      <th className="px-4 py-3 text-right font-medium">累计缴费月数</th>
                      <th className="px-4 py-3 text-right font-medium">个人账户余额</th>
                      <th className="px-4 py-3 text-right font-medium">最近缴费日期</th>
                      <th className="px-4 py-3 text-center font-medium">参保状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statement.records.map((r) => (
                      <tr key={r.type} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-800 font-medium">
                          <span className="mr-2">
                            {r.type === 'pension'
                              ? '👴'
                              : r.type === 'medical'
                              ? '🏥'
                              : '🛡️'}
                          </span>
                          {r.typeName}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-800 font-mono">
                          {r.totalMonths} 个月
                        </td>
                        <td className="px-4 py-3 text-right text-gov-red font-mono font-medium">
                          {formatCurrency(r.accountBalance)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600 font-mono text-xs">
                          {r.lastPaymentDate}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`gov-badge ${getStatusColor(r.status)}`}>
                            {getStatusText(r.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td className="px-4 py-3 text-gray-700 font-medium">合计</td>
                      <td className="px-4 py-3 text-right text-gray-800 font-mono font-semibold">
                        {statement.totalContributionMonths} 个月
                      </td>
                      <td className="px-4 py-3 text-right text-gov-red font-mono font-bold">
                        {formatCurrency(statement.totalBalance)}
                      </td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  </tfoot>
                </table>

                <h4 className="text-base font-semibold text-gray-800 mb-4">
                  二、权益说明
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-2">
                  <p>1. 本权益单由河北省人力资源和社会保障厅统一出具，为个人参保缴费及权益享受的法定凭证。</p>
                  <p>2. 数据来源于河北省社保集中数据库，统计截止时间以单据顶部"生成时间"为准。</p>
                  <p>
                    3. 如对数据有异议，请在收到本单之日起 60 日内携带本人身份证至参保地社保经办机构核实。
                  </p>
                  <p>4. 本单据加盖电子公章有效，可作为办理购房、贷款、子女入学等事项的社保证明材料。</p>
                </div>

                <div className="mt-8 pt-6 border-t border-dashed border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>
                      本单据已加盖
                      <span className="font-semibold mx-1">河北省社会保险业务专用章（电子）</span>
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    技术支持：河北省人社信息中心 · 校验码：HB-{statement.id}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="gov-card p-6">
            <h3 className="font-semibold text-gray-800 mb-4">数据概览</h3>
            <div className="space-y-4">
              {statement.records.map((r) => (
                <div key={r.type} className="p-4 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{r.typeName}</span>
                    <span className={`gov-badge ${getStatusColor(r.status)}`}>
                      {getStatusText(r.status)}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gov-red">
                      {formatCurrency(r.accountBalance)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    累计缴费 <span className="font-mono text-gray-700">{r.totalMonths}</span> 个月
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="gov-card p-6">
            <h3 className="font-semibold text-gray-800 mb-4">常见问题</h3>
            <ul className="space-y-3 text-sm">
              <li className="text-gray-600">
                <p className="font-medium text-gray-800">Q：权益单多久更新一次？</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  A：系统每月 25 日完成上月缴费数据结算，可于次月 1 日起查询最新权益。
                </p>
              </li>
              <li className="text-gray-600">
                <p className="font-medium text-gray-800">Q：账户余额有疑问怎么办？</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  A：可携带身份证至社保经办窗口查询详细缴费明细，或拨打 12333 咨询。
                </p>
              </li>
              <li className="text-gray-600">
                <p className="font-medium text-gray-800">Q：权益单 PDF 是否具有法律效力？</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  A：下载的 PDF 已附加电子签章，与纸质单据具有同等法律效力。
                </p>
              </li>
            </ul>
          </div>

          <div className="gov-card p-5 bg-green-50 border-green-200">
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-medium">参保状态良好</p>
                <p className="text-xs text-green-700 mt-1">
                  您的养老、医疗、工伤保险均处于正常参保状态，累计缴费已达 {Math.floor(statement.totalContributionMonths / 12)} 年以上。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
