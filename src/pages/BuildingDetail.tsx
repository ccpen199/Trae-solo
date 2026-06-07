import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Users, Home, ChevronRight, ChevronDown, Phone, X, User as UserIcon } from 'lucide-react';
import { apiRequest } from '@/utils/api';

interface ApiBuilding {
  id: number;
  name: string;
  address: string;
  total_floors: number;
  total_units: number;
  description?: string;
  unit_stats?: {
    total_units: number;
    occupied_units: number;
    vacant_units: number;
    rented_units: number;
  };
  resident_count: number;
}

interface ApiUnit {
  id: number;
  building_id: number;
  unit_number: string;
  floor: number;
  area: number;
  owner_name?: string;
  owner_phone?: string;
  status: 'occupied' | 'vacant' | 'rented';
}

interface ApiResident {
  id: number;
  unit_id: number;
  user_id?: number;
  name: string;
  phone: string;
  id_card?: string;
  relation: 'owner' | 'tenant' | 'family';
  move_in_date?: string;
  unit_number?: string;
  floor?: number;
  building_name?: string;
}

interface EntranceGroup {
  label: string;
  index: number;
  floors: Map<number, ApiUnit[]>;
}

const STATUS_LABELS: Record<string, string> = {
  occupied: '已入住',
  vacant: '空置',
  rented: '出租',
};

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  occupied: { bg: 'bg-accent-green-50', border: 'border-accent-green-300', text: 'text-accent-green-700', dot: 'bg-accent-green-500' },
  vacant: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-400', dot: 'bg-gray-400' },
  rented: { bg: 'bg-accent-yellow-50', border: 'border-accent-yellow-300', text: 'text-accent-yellow-700', dot: 'bg-accent-yellow-500' },
};

const RELATION_LABELS: Record<string, string> = {
  owner: '业主',
  tenant: '租户',
  family: '家属',
};

function deriveEntrance(unitNumber: string, positionOnFloor: number, totalOnFloor: number): number {
  if (unitNumber.includes('-')) {
    const prefix = parseInt(unitNumber.split('-')[0], 10);
    if (!isNaN(prefix)) return prefix;
  }
  if (totalOnFloor <= 2) return 1;
  const roomsPerEntrance = Math.max(2, Math.ceil(totalOnFloor / Math.ceil(totalOnFloor / 2)));
  return Math.floor(positionOnFloor / roomsPerEntrance) + 1;
}

function groupByEntrance(units: ApiUnit[]): { entrances: EntranceGroup[]; unitEntranceMap: Map<number, number> } {
  const floorsMap = new Map<number, ApiUnit[]>();
  for (const unit of units) {
    const list = floorsMap.get(unit.floor) || [];
    list.push(unit);
    floorsMap.set(unit.floor, list);
  }
  for (const [, floorUnits] of floorsMap) {
    floorUnits.sort((a, b) => a.unit_number.localeCompare(b.unit_number));
  }

  const unitEntranceMap = new Map<number, number>();
  const entranceMap = new Map<number, Map<number, ApiUnit[]>>();

  for (const [floor, floorUnits] of floorsMap) {
    floorUnits.forEach((unit, idx) => {
      const entrance = deriveEntrance(unit.unit_number, idx, floorUnits.length);
      unitEntranceMap.set(unit.id, entrance);
      if (!entranceMap.has(entrance)) entranceMap.set(entrance, new Map());
      const eFloors = entranceMap.get(entrance)!;
      if (!eFloors.has(floor)) eFloors.set(floor, []);
      eFloors.get(floor)!.push(unit);
    });
  }

  const entrances: EntranceGroup[] = Array.from(entranceMap.keys())
    .sort((a, b) => a - b)
    .map(key => ({
      label: `${key}单元`,
      index: key,
      floors: entranceMap.get(key)!,
    }));

  return { entrances, unitEntranceMap };
}

const BuildingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<{ building: ApiBuilding; units: ApiUnit[]; residents: ApiResident[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEntrances, setExpandedEntrances] = useState<Set<number>>(new Set());
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set());
  const [selectedRoom, setSelectedRoom] = useState<{ unit: ApiUnit; residents: ApiResident[] } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiRequest.get<{ building: ApiBuilding; units: ApiUnit[]; residents: ApiResident[] }>(`/buildings/${id}`);
        if (response.success) {
          setData(response.data);
          const { entrances } = groupByEntrance(response.data.units);
          setExpandedEntrances(new Set(entrances.map(e => e.index)));
        } else {
          setError(response.error || 'Failed to load building data');
        }
      } catch {
        setError('Failed to load building data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const toggleEntrance = (idx: number) => {
    setExpandedEntrances(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const toggleFloor = (key: string) => {
    setExpandedFloors(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-500">{error || 'Building not found'}</p>
        <button onClick={() => navigate('/buildings')} className="btn-primary">返回楼栋列表</button>
      </div>
    );
  }

  const { building, units, residents } = data;
  const { entrances, unitEntranceMap } = groupByEntrance(units);
  const residentsByUnit = new Map<number, ApiResident[]>();
  for (const r of residents) {
    const list = residentsByUnit.get(r.unit_id) || [];
    list.push(r);
    residentsByUnit.set(r.unit_id, list);
  }

  const stats = building.unit_stats;
  const totalUnits = stats?.total_units || units.length;
  const occupiedCount = stats?.occupied_units || units.filter(u => u.status === 'occupied').length;
  const vacantCount = stats?.vacant_units || units.filter(u => u.status === 'vacant').length;
  const rentedCount = stats?.rented_units || units.filter(u => u.status === 'rented').length;
  const occupancyRate = totalUnits > 0 ? Math.round(((occupiedCount + rentedCount) / totalUnits) * 100) : 0;

  const allFloors = Array.from({ length: building.total_floors }, (_, i) => i + 1).reverse();

  const handleRoomClick = (unit: ApiUnit) => {
    const roomResidents = residentsByUnit.get(unit.id) || [];
    setSelectedRoom(prev => prev?.unit.id === unit.id ? null : { unit, residents: roomResidents });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/buildings')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">{building.name}详情</h1>
          <p className="text-gray-500 mt-1">{building.address}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card text-center">
          <Building2 className="w-7 h-7 text-primary-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{entrances.length}</p>
          <p className="text-sm text-gray-500">单元数</p>
        </div>
        <div className="card text-center">
          <Home className="w-7 h-7 text-secondary-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{totalUnits}</p>
          <p className="text-sm text-gray-500">总户数</p>
        </div>
        <div className="card text-center">
          <Users className="w-7 h-7 text-accent-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-accent-green-600">{occupiedCount}</p>
          <p className="text-sm text-gray-500">已入住</p>
        </div>
        <div className="card text-center">
          <div className="w-7 h-7 rounded-full bg-accent-yellow-100 flex items-center justify-center mx-auto mb-2">
            <div className="w-3 h-3 rounded-full bg-accent-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-accent-yellow-600">{rentedCount}</p>
          <p className="text-sm text-gray-500">出租</p>
        </div>
        <div className="card text-center">
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-500">{vacantCount}</p>
          <p className="text-sm text-gray-500">空置</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">入住率</span>
          <span className="text-sm font-bold text-primary-600">{occupancyRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-accent-green-400 to-accent-green-600 transition-all"
            style={{ width: `${occupancyRate}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>已入住 {occupiedCount} + 出租 {rentedCount}</span>
          <span>空置 {vacantCount}</span>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 font-serif">单元-房间层级</h2>
        <div className="space-y-2">
          {entrances.map(entrance => {
            const isExpanded = expandedEntrances.has(entrance.index);
            const allEntranceUnits: ApiUnit[] = [];
            for (const [, fUnits] of entrance.floors) allEntranceUnits.push(...fUnits);
            const eOccupied = allEntranceUnits.filter(u => u.status === 'occupied').length;
            const eRented = allEntranceUnits.filter(u => u.status === 'rented').length;
            const eVacant = allEntranceUnits.filter(u => u.status === 'vacant').length;

            return (
              <div key={entrance.index} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleEntrance(entrance.index)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                    <Building2 className="w-5 h-5 text-primary-500" />
                    <span className="font-semibold text-gray-900">{entrance.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-accent-green-600">{eOccupied} 已入住</span>
                    <span className="text-accent-yellow-600">{eRented} 出租</span>
                    <span className="text-gray-400">{eVacant} 空置</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="divide-y divide-gray-100">
                    {Array.from(entrance.floors.entries())
                      .sort(([a], [b]) => b - a)
                      .map(([floor, floorUnits]) => {
                        const floorKey = `${entrance.index}-${floor}`;
                        const isFloorExpanded = expandedFloors.has(floorKey);
                        return (
                          <div key={floor}>
                            <button
                              onClick={() => toggleFloor(floorKey)}
                              className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                {isFloorExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                                <span className="text-sm font-medium text-gray-700">{floor}层</span>
                                <span className="text-xs text-gray-400">({floorUnits.length}户)</span>
                              </div>
                              <div className="flex gap-1">
                                {floorUnits.map(u => (
                                  <div key={u.id} className={`w-2 h-2 rounded-full ${STATUS_STYLES[u.status].dot}`} />
                                ))}
                              </div>
                            </button>

                            {isFloorExpanded && (
                              <div className="px-10 pb-3 space-y-2">
                                {floorUnits.map(unit => {
                                  const unitResidents = residentsByUnit.get(unit.id) || [];
                                  const styles = STATUS_STYLES[unit.status];
                                  return (
                                    <div key={unit.id} className={`rounded-lg border ${styles.border} ${styles.bg} p-3`}>
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Home className="w-4 h-4" />
                                          <span className={`font-medium ${styles.text}`}>{unit.unit_number}</span>
                                          <span className={`text-xs px-2 py-0.5 rounded-full ${styles.bg} ${styles.text} border ${styles.border}`}>
                                            {STATUS_LABELS[unit.status]}
                                          </span>
                                        </div>
                                        <span className="text-xs text-gray-400">{unit.area}㎡</span>
                                      </div>
                                      {unitResidents.length > 0 && (
                                        <div className="mt-2 pl-6 space-y-1">
                                          {unitResidents.map(r => (
                                            <div key={r.id} className="flex items-center gap-2 text-sm text-gray-600">
                                              <UserIcon className="w-3 h-3" />
                                              <span>{r.name}</span>
                                              <span className="text-xs text-gray-400">({RELATION_LABELS[r.relation] || r.relation})</span>
                                              {r.phone && <span className="text-xs text-gray-400">{r.phone}</span>}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 font-serif">楼栋图谱</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-sm font-medium text-gray-500 text-center border border-gray-200 bg-gray-50 sticky left-0">楼层</th>
                {entrances.map(e => (
                  <th key={e.index} className="p-2 text-sm font-medium text-gray-700 text-center border border-gray-200 bg-primary-50 min-w-[140px]">
                    {e.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allFloors.map(floor => (
                <tr key={floor}>
                  <td className="p-2 text-sm font-medium text-gray-600 text-center border border-gray-200 bg-gray-50 sticky left-0">
                    {floor}F
                  </td>
                  {entrances.map(entrance => {
                    const floorUnits = entrance.floors.get(floor) || [];
                    return (
                      <td key={entrance.index} className="p-1.5 border border-gray-200">
                        <div className="flex gap-1 justify-center flex-wrap">
                          {floorUnits.length > 0 ? floorUnits.map(unit => {
                            const styles = STATUS_STYLES[unit.status];
                            const isSelected = selectedRoom?.unit.id === unit.id;
                            return (
                              <button
                                key={unit.id}
                                onClick={() => handleRoomClick(unit)}
                                className={`px-2 py-1.5 rounded text-xs font-medium border-2 transition-all hover:scale-105 ${styles.bg} ${styles.border} ${styles.text} ${isSelected ? 'ring-2 ring-primary-400 ring-offset-1' : ''}`}
                              >
                                {unit.unit_number}
                              </button>
                            );
                          }) : (
                            <span className="text-xs text-gray-300 py-1.5">—</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-accent-green-100 border border-accent-green-300" />
              <span className="text-sm text-gray-600">已入住 ({occupiedCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-accent-yellow-50 border border-accent-yellow-300" />
              <span className="text-sm text-gray-600">出租 ({rentedCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300" />
              <span className="text-sm text-gray-600">空置 ({vacantCount})</span>
            </div>
          </div>
          <span className="text-sm text-gray-400">点击房号查看详情</span>
        </div>
      </div>

      {selectedRoom && (
        <div className="card border-primary-200 bg-primary-50/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">{selectedRoom.unit.unit_number} 房间详情</h3>
            <button onClick={() => setSelectedRoom(null)} className="p-1 hover:bg-gray-200 rounded">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">房号:</span> <span className="font-medium">{selectedRoom.unit.unit_number}</span></div>
            <div><span className="text-gray-500">楼层:</span> <span className="font-medium">{selectedRoom.unit.floor}层</span></div>
            <div><span className="text-gray-500">面积:</span> <span className="font-medium">{selectedRoom.unit.area}㎡</span></div>
            <div>
              <span className="text-gray-500">状态:</span>{' '}
              <span className={`font-medium ${STATUS_STYLES[selectedRoom.unit.status].text}`}>
                {STATUS_LABELS[selectedRoom.unit.status]}
              </span>
            </div>
          </div>
          {selectedRoom.unit.owner_name && (
            <div className="mt-2 text-sm">
              <span className="text-gray-500">业主:</span>{' '}
              <span className="font-medium">{selectedRoom.unit.owner_name}</span>
              {selectedRoom.unit.owner_phone && <span className="text-gray-400 ml-2">{selectedRoom.unit.owner_phone}</span>}
            </div>
          )}
          {selectedRoom.residents.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">住户信息</p>
              <div className="space-y-2">
                {selectedRoom.residents.map(r => (
                  <div key={r.id} className="flex items-center gap-3 bg-white rounded-lg p-2">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">{r.name}</span>
                      <span className="text-xs text-gray-400 ml-2">({RELATION_LABELS[r.relation] || r.relation})</span>
                    </div>
                    {r.phone && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Phone className="w-3 h-3" />{r.phone}
                      </div>
                    )}
                    {r.move_in_date && <span className="text-xs text-gray-400">入住: {r.move_in_date}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 font-serif">住户列表</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">住户</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">房号</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">单元</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">楼层</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">关系</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">联系电话</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">入住时间</th>
              </tr>
            </thead>
            <tbody>
              {residents.map(r => {
                const unit = units.find(u => u.id === r.unit_id);
                const entranceIdx = unit ? unitEntranceMap.get(unit.id) || 1 : 1;
                return (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-primary-500" />
                        </div>
                        <span className="font-medium text-gray-900">{r.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{r.unit_number || unit?.unit_number || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{entranceIdx}单元</td>
                    <td className="py-3 px-4 text-gray-600">{r.floor || unit?.floor || '-'}层</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        r.relation === 'owner' ? 'bg-primary-50 text-primary-600' :
                        r.relation === 'tenant' ? 'bg-accent-yellow-50 text-accent-yellow-600' :
                        'bg-secondary-50 text-secondary-600'
                      }`}>
                        {RELATION_LABELS[r.relation] || r.relation}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{r.phone}</td>
                    <td className="py-3 px-4 text-gray-600">{r.move_in_date || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BuildingDetail;
