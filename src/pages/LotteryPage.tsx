import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { activityApi, lotteryApi, prizeApi } from '../lib/api';
import type { Activity, DrawResponse, Winner } from '../../shared/types.js';
import { Gift, User, Clock, Gift as GiftIcon, Star } from 'lucide-react';

export default function LotteryPage() {
  const { id } = useParams();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [drawResult, setDrawResult] = useState<DrawResponse | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [userId, setUserId] = useState(() => {
    const saved = localStorage.getItem('lottery_user_id');
    return saved || `user_${Date.now()}`;
  });
  const [remainingDraws, setRemainingDraws] = useState(0);
  const [myWinners, setMyWinners] = useState<Winner[]>([]);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    localStorage.setItem('lottery_user_id', userId);
  }, [userId]);

  useEffect(() => {
    if (id) {
      loadActivity();
      loadUserInfo();
      loadMyWinners();
    }
  }, [id]);

  const loadActivity = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await activityApi.getPublic(parseInt(id));
      if (res.data.code === 200) {
        setActivity(res.data.data);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || '活动不存在或已结束');
    } finally {
      setLoading(false);
    }
  };

  const loadUserInfo = async () => {
    if (!id) return;
    try {
      const res = await lotteryApi.checkQualification(parseInt(id), userId);
      if (res.data.code === 200) {
        setRemainingDraws(res.data.data.remainingDraws);
      }
    } catch (error) {
      console.error('Check qualification failed:', error);
    }
  };

  const loadMyWinners = async () => {
    try {
      const res = await prizeApi.getUserWinners(userId, 1, 10);
      if (res.data.code === 200) {
        setMyWinners(res.data.data.items);
      }
    } catch (error) {
      console.error('Load my winners failed:', error);
    }
  };

  const handleDraw = async () => {
    if (!id || drawing || remainingDraws <= 0) return;

    setDrawing(true);
    try {
      const res = await lotteryApi.draw({
        activityId: parseInt(id),
        userId,
        channel: 'web',
      });

      if (res.data.code === 200) {
        const result = res.data.data;
        setDrawResult(result);

        const prizeIndex = activity?.prizeConfigs?.findIndex(
          (pc) => pc.prizeId === result.prize?.id
        ) ?? 0;
        const targetRotation = 360 * 5 + (360 - (prizeIndex * 45));
        setRotation((prev) => prev + targetRotation);

        setTimeout(() => {
          setShowResult(true);
          setRemainingDraws((prev) => Math.max(0, prev - 1));
          loadMyWinners();
        }, 3000);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || '抽奖失败');
    } finally {
      setTimeout(() => setDrawing(false), 3000);
    }
  };

  const closeResult = () => {
    setShowResult(false);
    setDrawResult(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  const prizes = activity?.prizeConfigs?.map((pc) => pc.prize) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-xl text-gray-600">活动不存在或已结束</p>
        </div>
      </div>
    );
  }

  const primaryColor = activity.pageConfig?.primaryColor || '#3B82F6';
  const bgColor = activity.pageConfig?.backgroundColor || '#F3F4F6';

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      <div className="max-w-lg mx-auto p-4 pb-20">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div
            className="h-40 flex items-center justify-center"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="text-center text-white">
              <h1 className="text-2xl font-bold">{activity.name}</h1>
              <p className="text-white/80 mt-1">{activity.description}</p>
            </div>
          </div>

          <div className="p-4 border-b">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>活动时间: {formatDate(activity.startTime)} - {formatDate(activity.endTime)}</span>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <User size={18} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">我的ID</p>
                  <p className="text-sm font-mono text-gray-700">{userId}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">剩余次数</p>
                <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {remainingDraws}
                </p>
              </div>
            </div>

            {prizes.length > 0 && (
              <div className="relative w-64 h-64 mx-auto mb-6">
                <div
                  className="absolute inset-0 rounded-full border-4 border-gray-200 shadow-inner overflow-hidden"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: drawing ? 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                  }}
                >
                  {prizes.slice(0, 8).map((prize, index) => {
                    const angle = index * 45;
                    return (
                      <div
                        key={index}
                        className="absolute w-full h-1/2 origin-bottom"
                        style={{
                          transform: `rotate(${angle}deg)`,
                          clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)',
                          backgroundColor: index % 2 === 0 ? '#FEF3C7' : '#E8F5E9',
                        }}
                      >
                        <div
                          className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center"
                          style={{ transform: `translateX(-50%) rotate(${180 + angle}deg)` }}
                        >
                          <Gift size={16} className="mx-auto text-gray-600" />
                          <p className="text-xs font-medium text-gray-700 mt-1 w-12 truncate">
                            {prize?.name || '谢谢参与'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                  <div
                    className="w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-white font-bold text-lg cursor-pointer"
                    style={{ backgroundColor: primaryColor }}
                    onClick={handleDraw}
                  >
                    {drawing ? '抽奖中' : '开始'}
                  </div>
                </div>

                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 z-10">
                  <div
                    className="w-0 h-0 border-l-8 border-r-8 border-t-12 border-l-transparent border-r-transparent"
                    style={{ borderTopColor: primaryColor }}
                  ></div>
                </div>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={handleDraw}
                disabled={drawing || remainingDraws <= 0}
                className="px-8 py-3 text-white font-bold rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ backgroundColor: primaryColor }}
              >
                {drawing ? '抽奖中...' : remainingDraws > 0 ? '立即抽奖' : '次数已用完'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <GiftIcon size={20} style={{ color: primaryColor }} />
            奖品列表
          </h2>
          <div className="space-y-3">
            {prizes.map((prize, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <Gift size={18} style={{ color: primaryColor }} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{prize?.name || '谢谢参与'}</p>
                  <p className="text-xs text-gray-500">
                    价值: ¥{prize?.value?.toFixed(2) || 0}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium" style={{ color: primaryColor }}>
                    {activity.prizeConfigs?.[index]?.probability || 0}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Star size={20} className="text-yellow-500" />
            我的中奖记录
          </h2>
          {myWinners.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无中奖记录，快来抽奖吧！
            </div>
          ) : (
            <div className="space-y-3">
              {myWinners.map((winner) => (
                <div key={winner.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Gift size={18} className="text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{winner.prize?.name}</p>
                    <p className="text-xs text-gray-500">{formatDate(winner.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-600">
                      {winner.status === 'pending' ? '待发放' :
                       winner.status === 'distributed' ? '已发放' :
                       winner.status === 'shipped' ? '已发货' :
                       winner.status === 'redeemed' ? '已核销' : winner.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showResult && drawResult && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center">
            {drawResult.isWin ? (
              <>
                <div className="w-20 h-20 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Gift size={40} className="text-yellow-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">恭喜中奖！</h2>
                <p className="text-xl font-bold" style={{ color: primaryColor }}>
                  {drawResult.prize?.name}
                </p>
                <p className="text-gray-500 mt-2">
                  价值: ¥{drawResult.prize?.value?.toFixed(2)}
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Gift size={40} className="text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">谢谢参与</h2>
                <p className="text-gray-500">下次再来试试运气吧！</p>
              </>
            )}
            {drawResult.riskStatus && drawResult.riskStatus !== 'normal' && (
              <p className="text-sm text-orange-500 mt-4 bg-orange-50 p-2 rounded-lg">
                您的抽奖存在异常，正在风控审核中
              </p>
            )}
            <button
              onClick={closeResult}
              className="mt-6 px-8 py-2.5 text-white font-medium rounded-full"
              style={{ backgroundColor: primaryColor }}
            >
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
