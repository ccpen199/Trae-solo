import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Truck,
  CreditCard,
  UserCheck,
  Info,
  RefreshCw,
  MapPin,
  Building2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { mockCardProgress, mockUser } from '@/data/mock';
import { getStatusText, getStatusColor, formatIdNumber } from '@/utils/format';
import type { CardProgressNode } from '@/types';

const stageIcons: Record<string, React.ElementType> = {
  collected: UserCheck,
  manufactured: CreditCard,
  shipped: Truck,
  delivered: CheckCircle2,
};

const stageNumbers: Record<string, string> = {
  collected: '①',
  manufactured: '②',
  shipped: '③',
  delivered: '④',
};

export default function CardProgress() {
  const { card } = useAuth();
  const progress = mockCardProgress as CardProgressNode[];
  const allCompleted = progress.every((p) => p.completed);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <Link to="/" className="hover:text-gov-red">
          首页
        </Link>
        <span>/</span>
        <Link to="/card" className="hover:text-gov-red">
          社保卡服务
        </Link>
        <span>/</span>
        <span className="text-gray-700">制卡进度追踪</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="gov-card p-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gov-red" />
                  制卡进度实时追踪
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  对接河北省制卡中心 API，数据每 5 分钟自动刷新
                </p>
              </div>
              <button className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gov-red transition">
                <RefreshCw className="w-4 h-4" />
                手动刷新
              </button>
            </div>

            {allCompleted && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium text-green-800">制卡流程已全部完成</span>
                  <span className="text-xs text-green-600 ml-2">
                    社保卡已签收激活，当前状态：
                    <span className={`gov-badge ${getStatusColor(card.status)} ml-1`}>
                      {getStatusText(card.status)}
                    </span>
                  </span>
                </div>
              </div>
            )}

            <div className="mt-6">
              <div className="grid grid-cols-4 gap-2 mb-8">
                {progress.map((node, idx) => {
                  const Icon = stageIcons[node.stage];
                  return (
                    <div
                      key={node.stage}
                      className={`text-center p-3 rounded-xl border-2 transition ${
                        node.completed
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                          node.completed
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-500'
                        }`}
                      >
                        {node.completed ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <p
                        className={`text-xs font-semibold ${
                          node.completed ? 'text-green-700' : 'text-gray-400'
                        }`}
                      >
                        {node.label}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {stageNumbers[node.stage]}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative pl-4">
              {progress.map((node, idx) => {
                const Icon = stageIcons[node.stage];
                return (
                  <div key={node.stage} className="relative pb-10 last:pb-0">
                    {idx < progress.length - 1 && (
                      <div
                        className={`absolute left-[19px] top-12 w-0.5 h-[calc(100%-24px)] ${
                          node.completed && progress[idx + 1]?.completed
                            ? 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      ></div>
                    )}
                    <div className="flex gap-5 relative">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                          node.completed
                            ? 'bg-green-500 text-white shadow-md shadow-green-200'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        {node.completed ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h4
                            className={`text-base font-semibold flex items-center gap-2 ${
                              node.completed ? 'text-gray-800' : 'text-gray-400'
                            }`}
                          >
                            <span className="text-xs text-gov-red font-mono">
                              {stageNumbers[node.stage]}
                            </span>
                            {node.label}
                            {node.completed && (
                              <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                                已完成
                              </span>
                            )}
                          </h4>
                        </div>
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="font-medium text-gray-600">节点时间戳</span>
                          </div>
                          <p className={`text-sm font-mono font-semibold ${
                            node.completed ? 'text-gray-800' : 'text-gray-300'
                          }`}>
                            {node.completed ? node.timestamp : '待更新'}
                          </p>
                        </div>
                        <p
                          className={`text-sm mt-2 ${
                            node.completed ? 'text-gray-600' : 'text-gray-300'
                          }`}
                        >
                          {node.description}
                        </p>
                        {node.stage === 'shipped' && node.completed && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                            <p className="text-blue-800 flex items-center gap-2">
                              <Truck className="w-4 h-4" />
                              物流单号：<span className="font-mono">SF1234567890</span>
                              <a
                                href="#"
                                className="text-gov-red hover:underline ml-2"
                                onClick={(e) => e.preventDefault()}
                              >
                                查看物流详情
                              </a>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="gov-card p-6">
            <h3 className="font-semibold text-gray-800 mb-4">制卡服务说明</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {[
                {
                  title: '① 已采集信息',
                  desc: '网点或线上提交制卡申请，信息采集完成，进入省制卡中心待办队列。',
                  time: 'T+0 日',
                  timestamp: '2024-03-15 09:30:00',
                },
                {
                  title: '② 已制卡',
                  desc: '制卡中心完成芯片写入、卡面印刷、金融账户绑定，质量检验通过。',
                  time: 'T+2~3 日',
                  timestamp: '2024-03-18 14:20:00',
                },
                {
                  title: '③ 已邮寄',
                  desc: '通过 EMS 寄往持卡人预留地址，可通过快递单号实时追踪物流。',
                  time: 'T+3~5 日',
                  timestamp: '2024-03-20 10:15:00',
                },
                {
                  title: '④ 签收',
                  desc: '持卡人本人签收，社保卡正式生效，需到网点或线上激活金融功能。',
                  time: 'T+5~7 日',
                  timestamp: '2024-03-22 16:45:00',
                },
              ].map((s) => (
                <div key={s.title} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-800">{s.title}</p>
                    <span className="text-xs text-gov-red font-mono">{s.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-400 font-mono">时间戳：{s.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="gov-card p-6">
            <h3 className="font-semibold text-gray-800 mb-4">制卡申请信息</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">申请单号</dt>
                <dd className="text-gray-800 font-mono text-xs">{card.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">申请人</dt>
                <dd className="text-gray-800">{card.holderName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">社保卡号</dt>
                <dd className="text-gray-800 font-mono">{card.cardNumber}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">身份证号</dt>
                <dd className="text-gray-800 font-mono">{formatIdNumber(card.idNumber)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">发卡地区</dt>
                <dd className="text-gray-800">{mockUser.cityName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">合作银行</dt>
                <dd className="text-gray-800">{card.bankName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">卡片状态</dt>
                <dd>
                  <span className={`gov-badge ${getStatusColor(card.status)}`}>
                    {getStatusText(card.status)}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">收卡地址</dt>
                <dd className="text-gray-800 text-right max-w-[180px]">
                  石家庄市长安区裕华东路**号
                </dd>
              </div>
            </dl>
          </div>

          <div className="gov-card p-5 bg-blue-50 border-blue-200">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">温馨提示</p>
                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                  制卡进度由省制卡中心提供，如超过 10 个工作日未收到卡片，请拨打 12333 或到就近社保卡服务网点咨询。
                </p>
              </div>
            </div>
          </div>

          <div className="gov-card p-6">
            <h3 className="font-semibold text-gray-800 mb-4">快捷操作</h3>
            <div className="space-y-2">
              <Link
                to="/card"
                className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition text-sm flex items-center justify-between"
              >
                <span>返回社保卡服务</span>
                <span className="text-gov-red">→</span>
              </Link>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition text-sm flex items-center justify-between"
              >
                <span>修改收卡地址</span>
                <span className="text-gov-red">→</span>
              </a>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition text-sm flex items-center justify-between"
              >
                <span>联系 12333 客服</span>
                <span className="text-gov-red">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
