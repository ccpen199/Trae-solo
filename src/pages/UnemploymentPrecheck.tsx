import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  FileText,
  RefreshCw,
  ArrowRight,
  User,
  Clock,
  MapPin,
  Briefcase,
} from 'lucide-react';
import { mockUnemploymentPrecheck } from '@/data/mock';
import { formatCurrency, delay } from '@/utils/format';
import type { UnemploymentPrecheck } from '@/types';

type Step = 'input' | 'checking' | 'result';

export default function UnemploymentPrecheck() {
  const [step, setStep] = useState<Step>('input');
  const [idNumber, setIdNumber] = useState('130102199001011234');
  const [name, setName] = useState('张伟');
  const [result, setResult] = useState<UnemploymentPrecheck | null>(null);

  const runPrecheck = async () => {
    if (!name || idNumber.length !== 18) {
      alert('请输入完整的姓名和 18 位身份证号');
      return;
    }
    setStep('checking');
    await delay(2500);
    setResult(mockUnemploymentPrecheck);
    setStep('result');
  };

  const reset = () => {
    setStep('input');
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <Link to="/" className="hover:text-gov-red">
          首页
        </Link>
        <span>/</span>
        <span className="text-gray-700">失业金申领智能预检</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="gov-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-gov-red" />
                  失业保险金申领智能预检
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  自动比对停保原因 / 缴费年限 / 户籍状态 · 30 秒出结果
                </p>
              </div>
              <span className="gov-badge bg-blue-100 text-blue-700">
                AI 智能预检
              </span>
            </div>

            {step === 'input' && (
              <div className="max-w-xl">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      姓名 <span className="text-gov-red">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="请输入您的姓名"
                      className="gov-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      身份证号 <span className="text-gov-red">*</span>
                    </label>
                    <input
                      type="text"
                      value={idNumber}
                      onChange={(e) =>
                        setIdNumber(e.target.value.replace(/[^0-9Xx]/g, '').slice(0, 18))
                      }
                      placeholder="请输入18位身份证号"
                      className="gov-input font-mono tracking-wider"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      系统将自动查询您在河北省内的参保及停保记录
                    </p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-xs text-amber-800 flex items-start gap-2">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>预检说明：</strong>
                        本服务仅做申领资格预检，最终以社保经办机构审核结果为准。系统将自动比对以下三项核心条件：
                        <br />① 累计缴费满 1 年以上；
                        <br />② 非因本人意愿中断就业；
                        <br />③ 已办理失业登记，有求职要求。
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={runPrecheck}
                    className="gov-btn-primary w-full inline-flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    开始智能预检
                  </button>
                </div>
              </div>
            )}

            {step === 'checking' && (
              <div className="py-16 text-center">
                <div className="w-20 h-20 border-4 border-gov-red/20 border-t-gov-red rounded-full animate-spin mx-auto mb-5"></div>
                <h3 className="text-lg font-medium text-gray-800">正在进行智能比对...</h3>
                <div className="mt-5 max-w-md mx-auto space-y-3 text-left">
                  {[
                    { label: '查询参保缴费记录...', done: true },
                    { label: '核验停保原因...', done: true },
                    { label: '比对累计缴费年限...', done: false },
                    { label: '核实户籍与失业登记状态...', done: false },
                    { label: '生成预检结论...', done: false },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm px-4 py-2 bg-gray-50 rounded-lg"
                    >
                      {item.done ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <RefreshCw className="w-4 h-4 text-gov-red animate-spin" />
                      )}
                      <span className={item.done ? 'text-gray-600' : 'text-gray-800 font-medium'}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 'result' && result && (
              <div>
                <div
                  className={`p-6 rounded-xl mb-6 ${
                    result.eligible
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center ${
                        result.eligible ? 'bg-green-500' : 'bg-red-500'
                      } text-white flex-shrink-0`}
                    >
                      {result.eligible ? (
                        <CheckCircle2 className="w-8 h-8" />
                      ) : (
                        <XCircle className="w-8 h-8" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`text-xl font-bold ${
                          result.eligible ? 'text-green-800' : 'text-red-800'
                        }`}
                      >
                        {result.eligible
                          ? '您符合失业保险金申领条件'
                          : '您暂不符合失业保险金申领条件'}
                      </h3>
                      {result.eligible && (
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg p-4">
                            <p className="text-xs text-gray-500">预计可领取</p>
                            <p className="text-2xl font-bold text-gov-red mt-1">
                              {formatCurrency(result.estimatedBenefit)}
                              <span className="text-sm font-normal text-gray-500">/ 月</span>
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-4">
                            <p className="text-xs text-gray-500">预计可领取期限</p>
                            <p className="text-2xl font-bold text-gov-red mt-1">
                              {result.estimatedMonths}
                              <span className="text-sm font-normal text-gray-500"> 个月</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-800 mb-4">一、核验项明细</h4>
                <div className="space-y-3 mb-6">
                  {[
                    {
                      icon: Clock,
                      label: '累计缴费年限',
                      value: `${result.contributionMonths} 个月（${(result.contributionMonths / 12).toFixed(1)} 年）`,
                      pass: result.contributionMonths >= 12,
                      desc: '要求：累计缴费满 1 年以上',
                    },
                    {
                      icon: Briefcase,
                      label: '停保原因',
                      value: result.stopReason,
                      pass: ['TERMINATION', 'LAYOFF', 'BANKRUPTCY'].includes(
                        result.stopReasonCode
                      ),
                      desc: '要求：非因本人意愿中断就业',
                    },
                    {
                      icon: MapPin,
                      label: '户籍 / 失业登记状态',
                      value: result.isLocalResident ? '本地户籍 · 已登记' : '未登记',
                      pass: result.isLocalResident,
                      desc: '要求：已办理失业登记，有求职要求',
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className={`p-4 rounded-lg border flex items-start gap-4 ${
                          item.pass
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center ${
                            item.pass ? 'bg-green-500' : 'bg-red-500'
                          } text-white flex-shrink-0`}
                        >
                          {item.pass ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <p className="font-medium text-gray-800 flex items-center gap-2">
                              <Icon className="w-4 h-4 text-gray-500" />
                              {item.label}
                            </p>
                            <span
                              className={`text-sm font-semibold ${
                                item.pass ? 'text-green-700' : 'text-red-700'
                              }`}
                            >
                              {item.value}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <h4 className="font-semibold text-gray-800 mb-4">二、结论与依据</h4>
                <div className="bg-gray-50 rounded-lg p-5 mb-6">
                  <ul className="space-y-2 text-sm text-gray-700">
                    {result.reasons.map((r, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-500 mt-4 pt-3 border-t border-gray-200 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    依据：《河北省失业保险条例》第十四条、第十七条
                  </p>
                </div>

                <div className="flex gap-3 flex-wrap">
                  {result.eligible && (
                    <button className="gov-btn-primary inline-flex items-center gap-2">
                      立即申领失业保险金
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={reset} className="gov-btn-secondary inline-flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    重新预检
                  </button>
                  <Link to="/admin/knowledge" className="gov-btn-secondary inline-flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    查看政策条款
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="gov-card p-6">
            <h3 className="font-semibold text-gray-800 mb-4">领取期限对照表</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="text-left py-2 font-medium">累计缴费时间</th>
                  <th className="text-right py-2 font-medium">领取期限</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {[
                  ['1 年 ≤ 缴费 < 5 年', '最长 12 个月'],
                  ['5 年 ≤ 缴费 < 10 年', '最长 18 个月'],
                  ['缴费 ≥ 10 年', '最长 24 个月'],
                ].map(([t, m]) => (
                  <tr key={t} className="border-b border-gray-50">
                    <td className="py-2.5 text-xs">{t}</td>
                    <td className="py-2.5 text-right font-medium text-gov-red">{m}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="gov-card p-5 bg-amber-50 border-amber-200">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">重要提示</p>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  "非因本人意愿中断就业"包括：劳动合同到期终止、单位解除劳动合同、经济性裁员、单位破产等。主动辞职不在申领范围内。
                </p>
              </div>
            </div>
          </div>

          <div className="gov-card p-6">
            <h3 className="font-semibold text-gray-800 mb-4">申领材料清单</h3>
            <ul className="space-y-2 text-sm">
              {[
                '本人身份证原件',
                '社会保障卡（已激活金融功能）',
                '解除（终止）劳动合同证明书',
                '近期一寸免冠照片 2 张',
                '《失业登记申请表》（现场填写）',
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4 text-gray-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
