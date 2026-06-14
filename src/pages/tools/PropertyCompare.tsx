import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitCompare,
  X,
  Plus,
  MapPin,
  DollarSign,
  Maximize2,
  Building2,
  GraduationCap,
  Train,
  Shield,
  Check,
  XCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Eye,
  Search,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { usePropertyStore } from '../../store/usePropertyStore';
import { propertyApi } from '../../utils/api';
import { formatPrice, formatUnitPrice, formatArea, formatRooms, formatDistance } from '../../utils/format';
import type { Property } from '@shared/types';

const compareDimensions = [
  { key: 'price', label: '价格', icon: DollarSign, higherIsBetter: false },
  { key: 'unitPrice', label: '单价', icon: TrendingUp, higherIsBetter: false },
  { key: 'area', label: '面积', icon: Maximize2, higherIsBetter: true },
  { key: 'rooms', label: '户型', icon: Building2, higherIsBetter: true },
  { key: 'school', label: '学区', icon: GraduationCap, higherIsBetter: true },
  { key: 'metro', label: '交通', icon: Train, higherIsBetter: true },
];

const COLORS = ['#1E40AF', '#F97316', '#10B981', '#8B5CF6'];

export default function PropertyCompare() {
  const navigate = useNavigate();
  const { compareList, removeFromCompare, clearCompare, getCompareProperties, properties } = usePropertyStore();
  const [compareProperties, setCompareProperties] = useState<Property[]>([]);
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    const props = getCompareProperties();
    setCompareProperties(props);

    const available = properties.filter((p) => !compareList.includes(p.id));
    setAvailableProperties(available);
  }, [compareList, properties, getCompareProperties]);

  useEffect(() => {
    if (properties.length === 0) {
      propertyApi.getPropertyList().then((res) => {
        if (res.success && res.data) {
          const list = (res.data as any).list || res.data;
          const propertyList = Array.isArray(list) ? list : [];
          usePropertyStore.getState().setProperties(propertyList);
        }
      });
    }
  }, [properties.length]);

  const filteredAvailable = availableProperties.filter(
    (p) =>
      p.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      p.address.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      p.district.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const handleAddProperty = (property: Property) => {
    if (compareList.length >= 4) return;
    usePropertyStore.getState().addToCompare(property.id);
    setShowAddModal(false);
  };

  const getRadarData = () => {
    if (compareProperties.length === 0) return [];

    const maxPrice = Math.max(...compareProperties.map((p) => p.price));
    const maxArea = Math.max(...compareProperties.map((p) => p.area));
    const maxRooms = Math.max(...compareProperties.map((p) => p.rooms + p.halls));

    return compareDimensions.map((dim) => {
      const data: Record<string, string | number> = { dimension: dim.label };
      compareProperties.forEach((prop, index) => {
        let value = 0;
        switch (dim.key) {
          case 'price':
            value = ((maxPrice - prop.price) / maxPrice) * 100;
            break;
          case 'unitPrice':
            value = prop.unitPrice
              ? ((maxPrice / maxArea - prop.unitPrice) / (maxPrice / maxArea)) * 100
              : 50;
            break;
          case 'area':
            value = (prop.area / maxArea) * 100;
            break;
          case 'rooms':
            value = ((prop.rooms + prop.halls) / maxRooms) * 100;
            break;
          case 'school':
            value = prop.schoolDistrict ? (prop.schoolDistrict.quality === 'key' ? 100 : 60) : 20;
            break;
          case 'metro':
            value = prop.metroInfo
              ? Math.max(0, 100 - prop.metroInfo.distance / 10)
              : 20;
            break;
        }
        data[`房源${index + 1}`] = Math.round(value);
      });
      return data;
    });
  };

  const CompareValue = ({
    values,
    higherIsBetter,
    formatter,
  }: {
    values: (string | number | undefined)[];
    higherIsBetter: boolean;
    formatter?: (v: string | number) => string;
  }) => {
    const numericValues = values
      .map((v) => (typeof v === 'number' ? v : undefined))
      .filter((v) => v !== undefined) as number[];

    if (numericValues.length === 0) {
      return values.map((v, i) => (
        <div key={i} className="text-center py-3 text-gray-500">
          {formatter ? formatter(v || '--') : v || '--'}
        </div>
      ));
    }

    const best = higherIsBetter ? Math.max(...numericValues) : Math.min(...numericValues);
    const worst = higherIsBetter ? Math.min(...numericValues) : Math.max(...numericValues);

    return values.map((v, i) => {
      const numV = typeof v === 'number' ? v : undefined;
      const isBest = numV !== undefined && numV === best;
      const isWorst = numV !== undefined && numV === worst;

      return (
        <div
          key={i}
          className={`text-center py-3 font-medium ${
            isBest ? 'text-green-600 bg-green-50 rounded-lg' : isWorst ? 'text-red-500' : 'text-gray-700'
          }`}
        >
          {formatter ? formatter(v || '--') : v || '--'}
          {isBest && <TrendingUp className="w-4 h-4 inline ml-1" />}
          {isWorst && numericValues.length > 1 && <TrendingDown className="w-4 h-4 inline ml-1" />}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-100 mb-4">
            <GitCompare className="w-8 h-8 text-success-600" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">房源对比</h1>
          <p className="text-gray-500">多维度横向对比，帮您做出最优选择</p>
        </div>

        {/* Property Cards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">已选择</span>
              <span className="badge badge-primary">{compareProperties.length}/4</span>
            </div>
            <button
              onClick={() => clearCompare()}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              清空全部
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {compareProperties.map((property, index) => (
              <div
                key={property.id}
                className="card relative overflow-hidden"
                style={{ borderTop: `4px solid ${COLORS[index]}` }}
              >
                <button
                  onClick={() => removeFromCompare(property.id)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </button>
                <div
                  className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: COLORS[index] }}
                >
                  房源{index + 1}
                </div>
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-full h-32 object-cover"
                />
                <div className="p-3">
                  <h4
                    className="font-medium text-gray-900 truncate mb-1 cursor-pointer hover:text-primary-600"
                    onClick={() => navigate(`/property/${property.id}`)}
                  >
                    {property.title}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{property.district}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-primary-600">
                      {formatPrice(property.price)}
                    </span>
                    {property.type !== 'rent' && (
                      <span className="text-xs text-gray-400">
                        {formatUnitPrice(property.unitPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {compareProperties.length < 4 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="h-full min-h-[200px] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
              >
                <Plus className="w-8 h-8" />
                <span className="font-medium">添加房源</span>
              </button>
            )}
          </div>
        </div>

        {compareProperties.length > 0 && (
          <>
            {/* Radar Chart */}
            <div className="card p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">综合评分对比</h2>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={getRadarData()}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="房源1"
                    dataKey="房源1"
                    stroke={COLORS[0]}
                    fill={COLORS[0]}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  {compareProperties.length >= 2 && (
                    <Radar
                      name="房源2"
                      dataKey="房源2"
                      stroke={COLORS[1]}
                      fill={COLORS[1]}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  )}
                  {compareProperties.length >= 3 && (
                    <Radar
                      name="房源3"
                      dataKey="房源3"
                      stroke={COLORS[2]}
                      fill={COLORS[2]}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  )}
                  {compareProperties.length >= 4 && (
                    <Radar
                      name="房源4"
                      dataKey="房源4"
                      stroke={COLORS[3]}
                      fill={COLORS[3]}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  )}
                  <Legend />
                  <Tooltip formatter={(value: number) => [`${value}分`, '']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Comparison Matrix */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-4 px-4 text-sm font-medium text-gray-500 w-32">
                        对比维度
                      </th>
                      {[0, 1, 2, 3].map((i) => (
                        <th
                          key={i}
                          className="text-center py-4 px-2"
                          style={{ minWidth: '140px' }}
                        >
                          {compareProperties[i] ? (
                            <div className="flex items-center justify-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: COLORS[i] }}
                              />
                              <span className="font-semibold text-gray-900">房源{i + 1}</span>
                            </div>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Price */}
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-medium">总价</span>
                        </div>
                      </td>
                      <CompareValue
                        values={compareProperties.map((p) => p.price)}
                        higherIsBetter={false}
                        formatter={(v) => formatPrice(Number(v))}
                      />
                      {Array(4 - compareProperties.length)
                        .fill(null)
                        .map((_, i) => (
                          <td key={i} className="text-center py-3 text-gray-300">
                            -
                          </td>
                        ))}
                    </tr>

                    {/* Unit Price */}
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <TrendingUp className="w-4 h-4" />
                          <span className="font-medium">单价</span>
                        </div>
                      </td>
                      <CompareValue
                        values={compareProperties.map((p) => p.unitPrice)}
                        higherIsBetter={false}
                        formatter={(v) => formatUnitPrice(Number(v))}
                      />
                      {Array(4 - compareProperties.length)
                        .fill(null)
                        .map((_, i) => (
                          <td key={i} className="text-center py-3 text-gray-300">
                            -
                          </td>
                        ))}
                    </tr>

                    {/* Area */}
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Maximize2 className="w-4 h-4" />
                          <span className="font-medium">建筑面积</span>
                        </div>
                      </td>
                      <CompareValue
                        values={compareProperties.map((p) => p.area)}
                        higherIsBetter={true}
                        formatter={(v) => formatArea(Number(v))}
                      />
                      {Array(4 - compareProperties.length)
                        .fill(null)
                        .map((_, i) => (
                          <td key={i} className="text-center py-3 text-gray-300">
                            -
                          </td>
                        ))}
                    </tr>

                    {/* Rooms */}
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Building2 className="w-4 h-4" />
                          <span className="font-medium">户型</span>
                        </div>
                      </td>
                      {compareProperties.map((p) => (
                        <td key={p.id} className="text-center py-3 font-medium text-gray-700">
                          {formatRooms(p.rooms, p.halls, p.bathrooms)}
                        </td>
                      ))}
                      {Array(4 - compareProperties.length)
                        .fill(null)
                        .map((_, i) => (
                          <td key={i} className="text-center py-3 text-gray-300">
                            -
                          </td>
                        ))}
                    </tr>

                    {/* Floor */}
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Eye className="w-4 h-4" />
                          <span className="font-medium">楼层</span>
                        </div>
                      </td>
                      {compareProperties.map((p) => (
                        <td key={p.id} className="text-center py-3 text-gray-700">
                          {p.floor}
                        </td>
                      ))}
                      {Array(4 - compareProperties.length)
                        .fill(null)
                        .map((_, i) => (
                          <td key={i} className="text-center py-3 text-gray-300">
                            -
                          </td>
                        ))}
                    </tr>

                    {/* Orientation */}
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <span className="w-4 h-4 text-center">🧭</span>
                          <span className="font-medium">朝向</span>
                        </div>
                      </td>
                      {compareProperties.map((p) => (
                        <td key={p.id} className="text-center py-3 text-gray-700">
                          {p.orientation}
                        </td>
                      ))}
                      {Array(4 - compareProperties.length)
                        .fill(null)
                        .map((_, i) => (
                          <td key={i} className="text-center py-3 text-gray-300">
                            -
                          </td>
                        ))}
                    </tr>

                    {/* Decoration */}
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <span className="w-4 h-4 text-center">🎨</span>
                          <span className="font-medium">装修</span>
                        </div>
                      </td>
                      {compareProperties.map((p) => (
                        <td key={p.id} className="text-center py-3 text-gray-700">
                          {p.decoration}
                        </td>
                      ))}
                      {Array(4 - compareProperties.length)
                        .fill(null)
                        .map((_, i) => (
                          <td key={i} className="text-center py-3 text-gray-300">
                            -
                          </td>
                        ))}
                    </tr>

                    {/* School District */}
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <GraduationCap className="w-4 h-4" />
                          <span className="font-medium">学区</span>
                        </div>
                      </td>
                      {compareProperties.map((p) => (
                        <td
                          key={p.id}
                          className={`text-center py-3 font-medium ${
                            p.schoolDistrict?.quality === 'key'
                              ? 'text-green-600'
                              : p.schoolDistrict
                              ? 'text-blue-600'
                              : 'text-gray-400'
                          }`}
                        >
                          {p.schoolDistrict ? (
                            <div>
                              <div>{p.schoolDistrict.name}</div>
                              <div className="text-xs">
                                {p.schoolDistrict.quality === 'key' ? '重点' : '普通'}
                              </div>
                            </div>
                          ) : (
                            '无'
                          )}
                        </td>
                      ))}
                      {Array(4 - compareProperties.length)
                        .fill(null)
                        .map((_, i) => (
                          <td key={i} className="text-center py-3 text-gray-300">
                            -
                          </td>
                        ))}
                    </tr>

                    {/* Metro */}
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Train className="w-4 h-4" />
                          <span className="font-medium">地铁</span>
                        </div>
                      </td>
                      <CompareValue
                        values={compareProperties.map((p) => p.metroInfo?.distance)}
                        higherIsBetter={false}
                        formatter={(v) =>
                          v && Number(v) > 0 ? formatDistance(Number(v)) : '无'
                        }
                      />
                      {Array(4 - compareProperties.length)
                        .fill(null)
                        .map((_, i) => (
                          <td key={i} className="text-center py-3 text-gray-300">
                            -
                          </td>
                        ))}
                    </tr>

                    {/* Property Right */}
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Shield className="w-4 h-4" />
                          <span className="font-medium">产权信息</span>
                        </div>
                      </td>
                      {compareProperties.map((p) => (
                        <td key={p.id} className="text-center py-3">
                          <div className="flex flex-col items-center gap-1">
                            <div
                              className={`px-2 py-0.5 rounded text-xs ${
                                p.propertyRight.isFiveYears && p.propertyRight.isOnlyOne
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {p.propertyRight.isFiveYears && p.propertyRight.isOnlyOne
                                ? '满五唯一'
                                : p.propertyRight.isFiveYears
                                ? '满两年'
                                : '不满两年'}
                            </div>
                            <div className="text-xs text-gray-500">{p.propertyRight.type}</div>
                          </div>
                        </td>
                      ))}
                      {Array(4 - compareProperties.length)
                        .fill(null)
                        .map((_, i) => (
                          <td key={i} className="text-center py-3 text-gray-300">
                            -
                          </td>
                        ))}
                    </tr>

                    {/* Verification */}
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Check className="w-4 h-4" />
                          <span className="font-medium">核验状态</span>
                        </div>
                      </td>
                      {compareProperties.map((p) => (
                        <td key={p.id} className="text-center py-3">
                          <div className="flex flex-col items-center gap-1">
                            {p.verification.antiFraudPassed ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <Check className="w-4 h-4" />
                                <span className="text-sm font-medium">已核验</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-red-500">
                                <XCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">未核验</span>
                              </div>
                            )}
                          </div>
                        </td>
                      ))}
                      {Array(4 - compareProperties.length)
                        .fill(null)
                        .map((_, i) => (
                          <td key={i} className="text-center py-3 text-gray-300">
                            -
                          </td>
                        ))}
                    </tr>

                    {/* Tags */}
                    <tr>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <span className="w-4 h-4 text-center">🏷️</span>
                          <span className="font-medium">房源特色</span>
                        </div>
                      </td>
                      {compareProperties.map((p) => (
                        <td key={p.id} className="py-3">
                          <div className="flex flex-wrap justify-center gap-1">
                            {p.tags.slice(0, 4).map((tag) => (
                              <span key={tag} className="badge badge-gray text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                      ))}
                      {Array(4 - compareProperties.length)
                        .fill(null)
                        .map((_, i) => (
                          <td key={i} className="text-center py-3 text-gray-300">
                            -
                          </td>
                        ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <button onClick={() => navigate('/properties')} className="btn-outline">
                返回列表
              </button>
              <button
                onClick={() => navigate(`/tools/mortgage?price=${compareProperties[0]?.price || ''}`)}
                className="btn-primary"
              >
                计算房贷
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </>
        )}

        {compareProperties.length === 0 && (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">暂未选择房源</h3>
            <p className="text-gray-500 mb-6">请先添加要对比的房源（最多4套）</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => navigate('/properties')} className="btn-outline">
                去选房
              </button>
              <button onClick={() => setShowAddModal(true)} className="btn-primary">
                从收藏中选择
              </button>
            </div>
          </div>
        )}

        {/* Add Property Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">添加房源对比</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="搜索房源名称、地址..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div className="overflow-y-auto max-h-96 p-4 space-y-3">
                {filteredAvailable.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    没有找到符合条件的房源
                  </div>
                ) : (
                  filteredAvailable.map((property) => (
                    <div
                      key={property.id}
                      className="flex gap-4 p-3 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all cursor-pointer"
                      onClick={() => handleAddProperty(property)}
                    >
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-20 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {property.title}
                        </h4>
                        <div className="text-sm text-gray-500">
                          {formatRooms(property.rooms, property.halls)} · {formatArea(property.area)}
                        </div>
                        <div className="text-primary-600 font-semibold">
                          {formatPrice(property.price)}
                        </div>
                      </div>
                      <button
                        disabled={compareList.length >= 4}
                        className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center hover:bg-primary-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
