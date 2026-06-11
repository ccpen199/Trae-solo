import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  Clock,
  Truck,
  CreditCard,
  UserCheck,
  Info,
  RefreshCw,
} from 'lucide-react';
import { mockCardProgress, mockSocialCard, mockUser } from '@/data/mock';
import type { CardProgressNode } from '@/types';

const stageIcons: Record<string, React.ElementType> = {
  collected: UserCheck,
  manufactured: CreditCard,
  shipped: Truck,
  delivered: CheckCircle2,
};

export default function CardProgress() {
  const progress = mockCardProgress as CardProgressNode[];
  const currentStageIdx = progress.findIndex((p) => !p.completed);
  const activeIdx = currentStageIdx === -1 ? progress.length - 1 : currentStageIdx - 1;

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
            <div className="flex items-center justify-between mb-6">
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

            <div className="relative pl-4">
              {progress.map((node, idx) => {
                const Icon = stageIcons[node.stage];
                const isActive = idx === activeIdx;
                const isDone = node.completed;
                return (
                  <div key={node.stage} className="relative pb-8 last:pb-0">
                    {idx < progress.length - 1 && (
                      <div
                        className={`absolute left-[15px] top-10 w-0.5 h-full ${
                          isDone ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      ></div>
                    )}
                    <div className="flex gap-4 relative">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                          isDone
                            ? 'bg-green-500 text-white'
                            : isActive
                            ? 'bg-gov-red text-white ring-4 ring-gov-red/20'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h4
                            className={`font-medium ${
                              isDone || isActive ? 'text-gray-800' : 'text-gray-400'
                            }`}
                          >
                            {node.label}
                            {isActive && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gov-red/10 text-gov-red">
                                进行中
                              </span>
                            )}
                          </h4>
                          {(isDone || isActive) && (
                            <span className="text-xs text-gray-500 font-mono">
                              {node.timestamp}
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-sm mt-1 ${
                            isDone || isActive ? 'text-gray-600' : 'text-gray-300'
                          }`}
                        >
                          {node.description}
                        </p>
                        {node.stage === 'shipped' && isDone && (
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
                  title: '已采集信息',
                  desc: '网点或线上提交制卡申请，信息采集完成，进入省制卡中心待办队列。',
                  time: 'T+0 日',
                },
                {
                  title: '已制卡',
                  desc: '制卡中心完成芯片写入、卡面印刷、金融账户绑定，质量检验通过。',
                  time: 'T+2~3 日',
                },
                {
                  title: '已邮寄',
                  desc: '通过 EMS 寄往持卡人预留地址，可通过快递单号实时追踪物流。',
                  time: 'T+3~5 日',
                },
                {
                  title: '签收',
                  desc: '持卡人本人签收，社保卡正式生效，需到网点或线上激活金融功能。',
                  time: 'T+5~7 日',
                },
              ].map((s) => (
                <div key={s.title} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-800">{s.title}</p>
                    <span className="text-xs text-gov-red font-mono">{s.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
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
                <dd className="text-gray-800 font-mono text-xs">{mockSocialCard.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">申请人</dt>
                <dd className="text-gray-800">{mockUser.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">社保卡号</dt>
                <dd className="text-gray-800 font-mono">{mockSocialCard.cardNumber}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">发卡地区</dt>
                <dd className="text-gray-800">{mockUser.cityName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">合作银行</dt>
                <dd className="text-gray-800">{mockSocialCard.bankName}</dd>
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
