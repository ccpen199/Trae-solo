import { useState } from 'react';
import { Heart, GitCompare, Eye, MapPin, BadgeCheck, Building2, Train, Shield, Phone, Award, Clock, FileCheck, X, AlertTriangle, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import type { Property, Verification } from '@shared/types';
import { formatPrice, formatArea, formatRooms, formatUnitPrice, formatDistance } from '../../utils/format';

interface PropertyCardProps {
  property: Property;
  onFavorite?: (id: string) => void;
  onCompare?: (id: string) => void;
  onClick?: (property: Property) => void;
  isFavorite?: boolean;
  isCompared?: boolean;
  layout?: 'grid' | 'list';
}

const VerificationDetailModal = ({ property, onClose }: { property: Property; onClose: () => void }) => {
  const v = property.verification;
  const now = new Date();
  const verifyDate = new Date(now.getTime() - v.listingDays * 86400000);
  const recheckDate = new Date(verifyDate.getTime() + 30 * 86400000);

  const records = [
    {
      id: 'owner',
      icon: <Phone className="w-4 h-4" />,
      title: '业主手机号直连验证',
      status: v.ownerVerified ? 'passed' : 'failed',
      details: v.ownerVerified
        ? [
            { label: '验证方式', value: '手机号短信验证码' },
            { label: '验证手机', value: '138****' + (property.ownerId?.slice(-4) || '0000') },
            { label: '验证时间', value: verifyDate.toLocaleDateString('zh-CN') },
            { label: '下次复查', value: recheckDate.toLocaleDateString('zh-CN') },
          ]
        : [
            { label: '状态', value: '未完成业主手机号验证' },
            { label: '风险提示', value: '无法确认房源信息来源真实性' },
          ],
    },
    {
      id: 'agent',
      icon: <Award className="w-4 h-4" />,
      title: '中介身份备案',
      status: v.agentVerified ? 'passed' : 'failed',
      details: v.agentVerified
        ? [
            { label: '备案编号', value: 'BJ-AGENT-' + (property.agent?.id?.slice(0, 8) || '00000000') },
            { label: '备案机构', value: '北京市住建委' },
            { label: '执业状态', value: '正常执业中' },
            { label: '有效期至', value: new Date(now.getTime() + 180 * 86400000).toLocaleDateString('zh-CN') },
          ]
        : [
            { label: '状态', value: '中介身份未备案或备案过期' },
            { label: '风险提示', value: '该房源发布者未完成经纪人身份认证' },
          ],
    },
    {
      id: 'antifraud',
      icon: <FileCheck className="w-4 h-4" />,
      title: '防虚假房源算法检测',
      status: v.antiFraudPassed ? 'passed' : 'failed',
      details: v.antiFraudPassed
        ? [
            { label: '图片相似度检测', value: '通过（未发现盗图）' },
            { label: '挂牌频次检测', value: '正常（无异常重复挂牌）' },
            { label: '价格异常检测', value: '通过（价格处于合理区间）' },
            { label: '检测时间', value: new Date(now.getTime() - 2 * 86400000).toLocaleDateString('zh-CN') },
          ]
        : [
            { label: '图片相似度', value: '异常：检测到与其他房源图片高度相似' },
            { label: '挂牌频次', value: '异常：同一房源短期内多次重复挂牌' },
            { label: '风险等级', value: '高' },
          ],
    },
    {
      id: 'decay',
      icon: <Clock className="w-4 h-4" />,
      title: '挂牌时效衰减权重',
      status: v.decayWeight >= 0.6 ? 'passed' : 'warning',
      details: [
        { label: '已挂牌天数', value: `${v.listingDays} 天` },
        { label: '时效权重', value: v.decayWeight.toFixed(4) },
        { label: '权重等级', value: v.decayWeight >= 0.8 ? '新鲜（推荐）' : v.decayWeight >= 0.6 ? '正常' : '衰减（排序靠后）' },
        { label: '建议', value: v.decayWeight >= 0.6 ? '房源信息较新，可放心查看' : '房源挂牌时间较长，建议核实信息时效性' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BadgeCheck className="w-5 h-5" />
              房源核验详情
            </h3>
            <p className="text-sm text-blue-100 mt-0.5 truncate max-w-xs">{property.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {records.map((record) => (
            <div key={record.id} className={`rounded-xl border p-4 ${
              record.status === 'passed' ? 'border-green-200 bg-green-50/30' :
              record.status === 'warning' ? 'border-orange-200 bg-orange-50/30' :
              'border-red-200 bg-red-50/30'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={record.status === 'passed' ? 'text-green-600' : record.status === 'warning' ? 'text-orange-600' : 'text-red-600'}>
                    {record.icon}
                  </span>
                  <span className="font-medium text-gray-900 text-sm">{record.title}</span>
                </div>
                {record.status === 'passed' ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> 通过
                  </span>
                ) : record.status === 'warning' ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" /> 衰减
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                    <XCircle className="w-3 h-3" /> 未通过
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {record.details.map((detail, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-gray-500">{detail.label}</span>
                    <span className={`text-right max-w-[60%] ${
                      detail.value.includes('异常') || detail.value.includes('未完成') || detail.value.includes('高')
                        ? 'text-red-600 font-medium'
                        : 'text-gray-800'
                    }`}>{detail.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-gray-400">
            核验编号：VF-{property.id.slice(0, 8)} · 查询时间 {now.toLocaleString('zh-CN')}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export const PropertyCard = ({
  property,
  onFavorite,
  onCompare,
  onClick,
  isFavorite = false,
  isCompared = false,
  layout = 'grid',
}: PropertyCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showVerifyDetail, setShowVerifyDetail] = useState(false);

  const isList = layout === 'list';

  const hasVR = !!property.vrUrl;
  const hasMetro = !!property.metroInfo;
  const hasSchool = !!property.schoolDistrict;
  const { ownerVerified, agentVerified, antiFraudPassed, listingDays, decayWeight } = property.verification;
  const isVerified = antiFraudPassed && ownerVerified;
  const isFiveOnly = property.propertyRight.isFiveYears && property.propertyRight.isOnlyOne;
  const rightStatusMap: Record<string, { label: string; color: string }> = {
    normal: { label: '产权清晰', color: 'bg-green-100 text-green-700' },
    mortgaged: { label: '抵押中', color: 'bg-yellow-100 text-yellow-700' },
    sealed: { label: '已查封', color: 'bg-red-100 text-red-700' },
  };
  const hasVerifyIssue = !ownerVerified || !agentVerified || !antiFraudPassed;

  const handleClick = () => {
    onClick?.(property);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavorite?.(property.id);
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCompare?.(property.id);
  };

  const handleVerifyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowVerifyDetail(true);
  };

  return (
    <>
      <div
        className={`group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer transition-all duration-300 hover:shadow-xl ${isList ? 'flex flex-col md:flex-row hover:-translate-y-0' : 'hover:-translate-y-1'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        <div className={`relative overflow-hidden ${isList ? 'md:w-64 flex-shrink-0' : ''}`}>
          <img
            src={property.images[0] || 'https://picsum.photos/400/300'}
            alt={property.title}
            className={`w-full ${isList ? 'h-48 md:h-full' : 'h-48'} object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
          />

          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {hasVR && (
              <span className="px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded-md flex items-center gap-1">
                <Eye className="w-3 h-3" />
                VR实勘
              </span>
            )}
            {hasMetro && (
              <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-md flex items-center gap-1">
                <Train className="w-3 h-3" />
                {property.metroInfo?.nearestStation.slice(0, 4)}站 {formatDistance(property.metroInfo?.distance || 0)}
              </span>
            )}
            {hasSchool && (
              <span className="px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-md flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {property.schoolDistrict?.quality === 'key' ? '重点' : ''}{property.schoolDistrict?.name.slice(0, 4)}
              </span>
            )}
            {isFiveOnly && (
              <span className="px-2 py-1 bg-teal-600 text-white text-xs font-medium rounded-md flex items-center gap-1">
                <Shield className="w-3 h-3" />
                满五唯一
              </span>
            )}
            {isVerified && (
              <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-md flex items-center gap-1">
                <BadgeCheck className="w-3 h-3" />
                真房源
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={handleFavorite}
              className={`p-2 rounded-full transition-all duration-200 ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'}`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleCompare}
              className={`p-2 rounded-full transition-all duration-200 ${isCompared ? 'bg-blue-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-white hover:text-blue-500'}`}
            >
              <GitCompare className="w-4 h-4" />
            </button>
          </div>

          {hasMetro && property.metroInfo && (
            <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 text-white text-xs rounded-md flex items-center gap-1">
              <Train className="w-3 h-3" />
              {property.metroInfo.nearestStation} {formatDistance(property.metroInfo.distance)}
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {property.title}
          </h3>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-2xl font-bold text-red-600">{formatPrice(property.price)}</span>
            <span className="text-sm text-gray-500">{formatUnitPrice(property.unitPrice)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 flex-wrap">
            <span className="px-1.5 py-0.5 bg-gray-100 rounded">{formatRooms(property.rooms, property.halls, property.bathrooms)}</span>
            <span className="px-1.5 py-0.5 bg-gray-100 rounded">{formatArea(property.area)}</span>
            <span className="px-1.5 py-0.5 bg-gray-100 rounded">{property.orientation}</span>
            <span className="px-1.5 py-0.5 bg-gray-100 rounded">{property.decoration}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs ${rightStatusMap[property.propertyRight.status]?.color || 'bg-gray-100 text-gray-600'}`}>
              {rightStatusMap[property.propertyRight.status]?.label || property.propertyRight.type}
            </span>
          </div>

          <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="line-clamp-1">{property.district} · {property.address}</span>
          </div>

          <button
            onClick={handleVerifyClick}
            className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
              isVerified
                ? 'border-blue-200 bg-blue-50/50 hover:bg-blue-50'
                : hasVerifyIssue
                  ? 'border-orange-200 bg-orange-50/50 hover:bg-orange-50'
                  : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100'
            }`}
          >
            <div className="flex flex-wrap gap-1.5 items-center">
              <div className="flex items-center gap-1">
                <Phone className={`w-3 h-3 ${ownerVerified ? 'text-green-500' : 'text-gray-400'}`} />
                <span className={`text-xs ${ownerVerified ? 'text-green-700' : 'text-gray-400'}`}>业主验</span>
              </div>
              <div className="w-px h-3 bg-gray-300" />
              <div className="flex items-center gap-1">
                <Award className={`w-3 h-3 ${agentVerified ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className={`text-xs ${agentVerified ? 'text-blue-700' : 'text-gray-400'}`}>中介备</span>
              </div>
              <div className="w-px h-3 bg-gray-300" />
              <div className="flex items-center gap-1">
                <FileCheck className={`w-3 h-3 ${antiFraudPassed ? 'text-purple-500' : 'text-gray-400'}`} />
                <span className={`text-xs ${antiFraudPassed ? 'text-purple-700' : 'text-gray-400'}`}>反诈验</span>
              </div>
              <div className="w-px h-3 bg-gray-300" />
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-orange-500" />
                <span className="text-xs text-orange-700">{listingDays}天</span>
                <span className={`text-xs font-medium ${decayWeight >= 0.8 ? 'text-green-600' : decayWeight >= 0.6 ? 'text-orange-600' : 'text-red-600'}`}>
                  权重{decayWeight.toFixed(2)}
                </span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {hasVerifyIssue && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 px-2.5 py-1.5 rounded-md">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              <span>核验存在风险项，点击上方查看详情</span>
            </div>
          )}

          {property.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {property.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {showVerifyDetail && (
        <VerificationDetailModal property={property} onClose={() => setShowVerifyDetail(false)} />
      )}
    </>
  );
};
