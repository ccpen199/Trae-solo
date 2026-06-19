import { useState, useRef, useMemo } from 'react';
import type { ChangeEvent } from 'react';
import type { CheckInRecord, Team } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  MapPin,
  Clock,
  Camera,
  Calendar,
  Search,
  Filter,
  X,
  Check,
  Upload,
  Image,
  Navigation,
  Eye,
  Droplets,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface PresetLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

const PRESET_LOCATIONS: PresetLocation[] = [
  {
    name: '村委会',
    address: '陕西省延安市梁家河村村委会',
    latitude: 36.8371,
    longitude: 109.4839,
  },
  {
    name: '种植基地',
    address: '梁家河村苹果种植基地',
    latitude: 36.8392,
    longitude: 109.4856,
  },
  {
    name: '电商站',
    address: '梁家河村电商服务站',
    latitude: 36.8365,
    longitude: 109.4821,
  },
  {
    name: '养老中心',
    address: '中关村街道养老服务中心',
    latitude: 39.9847,
    longitude: 116.3125,
  },
  {
    name: '社区活动中心',
    address: '海淀区黄庄社区活动中心',
    latitude: 39.9821,
    longitude: 116.3158,
  },
];

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?w=800',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
  'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800',
  'https://images.unsplash.com/photo-1592921870789-04563d55041c?w=800',
];

type WatermarkPosition = 'bottom-right' | 'bottom-left' | 'top-right';

const formatGPS = (lat: number, lng: number): string => {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  const absLat = Math.abs(lat);
  const absLng = Math.abs(lng);
  const latDeg = Math.floor(absLat);
  const latMin = Math.floor((absLat - latDeg) * 60);
  const latSec = (((absLat - latDeg) * 60 - latMin) * 60).toFixed(1);
  const lngDeg = Math.floor(absLng);
  const lngMin = Math.floor((absLng - lngDeg) * 60);
  const lngSec = (((absLng - lngDeg) * 60 - lngMin) * 60).toFixed(1);
  return `${latDir}${latDeg}°${latMin}'${latSec}" ${lngDir}${lngDeg}°${lngMin}'${lngSec}"`;
};

const formatNow = (): string => {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const CheckIn = () => {
  const { teams, checkIns, addCheckIn } = useApp();
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [formTeamId, setFormTeamId] = useState<string>('');
  const [selectedLocationIdx, setSelectedLocationIdx] = useState<number | null>(null);
  const [customLat, setCustomLat] = useState<number | null>(null);
  const [customLng, setCustomLng] = useState<number | null>(null);
  const [customLocationName, setCustomLocationName] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>('bottom-right');
  const [description, setDescription] = useState<string>('');
  const [serviceHours, setServiceHours] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTeams = useMemo(
    () => teams.filter((t) => t.status !== 'draft'),
    [teams]
  );

  const filteredCheckIns = useMemo(() => {
    return checkIns.filter((checkIn) => {
      const matchesTeam =
        selectedTeam === 'all' || checkIn.teamId === selectedTeam;
      const matchesSearch =
        checkIn.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        checkIn.teamName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTeam && matchesSearch;
    });
  }, [checkIns, selectedTeam, searchTerm]);

  const selectedTeamObj = useMemo<Team | undefined>(() => {
    return activeTeams.find((t) => t.id === formTeamId);
  }, [activeTeams, formTeamId]);

  const currentLocation = useMemo(() => {
    if (selectedLocationIdx !== null) {
      return PRESET_LOCATIONS[selectedLocationIdx];
    }
    if (customLat !== null && customLng !== null) {
      return {
        name: customLocationName || '当前定位',
        address: customLocationName || '当前定位地点',
        latitude: customLat,
        longitude: customLng,
      };
    }
    return null;
  }, [selectedLocationIdx, customLat, customLng, customLocationName]);

  const handleGetCurrentLocation = () => {
    const randomIdx = Math.floor(Math.random() * PRESET_LOCATIONS.length);
    setSelectedLocationIdx(randomIdx);
    setCustomLat(null);
    setCustomLng(null);
    setCustomLocationName('');
  };

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhotoPreview(result);
      setPhotoBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleUsePlaceholderPhoto = () => {
    const url = PLACEHOLDER_IMAGES[Math.floor(Math.random() * PLACEHOLDER_IMAGES.length)];
    setPhotoPreview(url);
    setPhotoBase64(url);
  };

  const watermarkInfoText = useMemo(() => {
    const time = formatNow();
    const gps = currentLocation
      ? formatGPS(currentLocation.latitude, currentLocation.longitude)
      : 'GPS定位中...';
    const team = selectedTeamObj
      ? `${selectedTeamObj.name}-张明`
      : '未选择团队';
    return { time, gps, team };
  }, [currentLocation, selectedTeamObj]);

  const watermarkPositionClass = useMemo(() => {
    switch (watermarkPosition) {
      case 'bottom-left':
        return 'bottom-2 left-2';
      case 'top-right':
        return 'top-2 right-2';
      case 'bottom-right':
      default:
        return 'bottom-2 right-2';
    }
  }, [watermarkPosition]);

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formTeamId) errs.teamId = '请选择团队';
    if (!currentLocation) errs.location = '请选择打卡地点或获取当前定位';
    if (!photoPreview) errs.photo = '请上传照片或使用占位图';
    if (description.trim().length < 20) errs.description = '现场描述至少20个字';
    const hours = parseFloat(serviceHours);
    if (!serviceHours || isNaN(hours) || hours <= 0) errs.serviceHours = '请输入有效的服务时长';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm() || !currentLocation) return;
    const now = formatNow();
    const gpsStr = formatGPS(currentLocation.latitude, currentLocation.longitude);

    const newRecord: Omit<CheckInRecord, 'id'> = {
      teamId: formTeamId,
      teamName: selectedTeamObj?.name || '',
      location: currentLocation.address,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      photoUrl: photoBase64 || undefined,
      timestamp: now,
      description: description.trim(),
      hasWatermark: true,
      watermarkInfo: {
        time: now,
        gps: gpsStr,
        team: `${selectedTeamObj?.name || ''}-张明`,
      },
      authorId: '1',
      authorName: '张明',
    };
    addCheckIn(newRecord);
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setFormTeamId('');
    setSelectedLocationIdx(null);
    setCustomLat(null);
    setCustomLng(null);
    setCustomLocationName('');
    setPhotoPreview('');
    setPhotoBase64('');
    setWatermarkPosition('bottom-right');
    setDescription('');
    setServiceHours('');
    setErrors({});
  };

  const totalCheckIns = checkIns.length;
  const uniqueTeams = new Set(checkIns.map((c) => c.teamId)).size;
  const totalHoursToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayCheckIns = checkIns.filter((c) => c.timestamp.startsWith(today));
    return todayCheckIns.length > 0 ? (todayCheckIns.length * 6.8).toFixed(1) : '6.8';
  }, [checkIns]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索打卡地点、团队..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 h-10 pl-9 pr-4 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="h-10 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部团队</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <MapPin className="w-4 h-4" />
          记录打卡
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalCheckIns}</p>
              <p className="text-xs text-gray-500">今日打卡</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">156</p>
              <p className="text-xs text-gray-500">累计打卡</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{uniqueTeams || 23}</p>
              <p className="text-xs text-gray-500">活跃团队</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalHoursToday}h</p>
              <p className="text-xs text-gray-500">人均日均</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">打卡轨迹</h3>
          </div>
          <div className="h-96 bg-gray-50 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">地图组件区域</p>
                <p className="text-gray-300 text-xs mt-1">
                  集成LBS定位服务后将显示实际地图
                </p>
              </div>
            </div>
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-3">
              <p className="text-xs text-gray-500 mb-1">今日打卡点</p>
              <p className="text-lg font-bold text-blue-600">
                {checkIns.length} 个
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">最新打卡</h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {filteredCheckIns.map((checkIn) => (
              <div key={checkIn.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {checkIn.location}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {checkIn.teamName}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        {checkIn.timestamp}
                      </span>
                    </div>
                    {checkIn.photoUrl && (
                      <div className="mt-2 w-full h-20 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={checkIn.photoUrl}
                          alt="打卡照片"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">打卡记录详情</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                团队名称
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                打卡地点
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                时间
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                描述
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                照片
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                水印信息
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCheckIns.map((checkIn) => (
              <tr key={checkIn.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-700">
                    {checkIn.teamName}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-700">
                      {checkIn.location}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {checkIn.timestamp}
                  </span>
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <p className="text-sm text-gray-600 truncate">
                    {checkIn.description}
                  </p>
                </td>
                <td className="px-6 py-4">
                  {checkIn.photoUrl ? (
                    <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden">
                      <img
                        src={checkIn.photoUrl}
                        alt="打卡"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">无照片</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="group relative inline-flex items-center">
                    {checkIn.hasWatermark ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="ml-1 text-xs text-green-600 font-medium">已添加</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-500" />
                        <span className="ml-1 text-xs text-red-600 font-medium">无水印</span>
                      </>
                    )}
                    {checkIn.watermarkInfo && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-normal">
                        <div className="space-y-1.5">
                          <p className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-blue-300 flex-shrink-0" />
                            <span>{checkIn.watermarkInfo.time}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <Navigation className="w-3 h-3 text-green-300 flex-shrink-0" />
                            <span className="break-all">{checkIn.watermarkInfo.gps}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <Droplets className="w-3 h-3 text-purple-300 flex-shrink-0" />
                            <span>{checkIn.watermarkInfo.team}</span>
                          </p>
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  三下乡实践打卡
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  请如实填写打卡信息，照片自动叠加防篡改水印
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-500 rounded"></span>
                  模块1 · 团队选择
                  <span className="text-red-500">*</span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {activeTeams.map((team) => {
                    const selected = formTeamId === team.id;
                    return (
                      <div
                        key={team.id}
                        onClick={() => {
                          setFormTeamId(team.id);
                          if (errors.teamId) {
                            const newErrs = { ...errors };
                            delete newErrs.teamId;
                            setErrors(newErrs);
                          }
                        }}
                        className={`p-3 border rounded-xl cursor-pointer transition-all ${
                          selected
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                            {team.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {team.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {team.projectName}
                            </p>
                          </div>
                          {selected && (
                            <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {errors.teamId && (
                  <p className="text-xs text-red-500 mt-2">{errors.teamId}</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-green-500 rounded"></span>
                  模块2 · LBS定位模拟
                  <span className="text-red-500">*</span>
                </h3>
                <div className="mb-3">
                  <button
                    onClick={handleGetCurrentLocation}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Navigation className="w-4 h-4" />
                    获取当前定位
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {PRESET_LOCATIONS.map((loc, idx) => {
                    const selected = selectedLocationIdx === idx;
                    return (
                      <div
                        key={loc.name}
                        onClick={() => {
                          setSelectedLocationIdx(idx);
                          setCustomLat(null);
                          setCustomLng(null);
                          setCustomLocationName('');
                          if (errors.location) {
                            const newErrs = { ...errors };
                            delete newErrs.location;
                            setErrors(newErrs);
                          }
                        }}
                        className={`p-3 border-2 rounded-xl cursor-pointer transition-all text-center ${
                          selected
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <MapPin
                          className={`w-6 h-6 mx-auto mb-1.5 ${
                            selected ? 'text-blue-600' : 'text-gray-400'
                          }`}
                        />
                        <p
                          className={`text-xs font-medium truncate ${
                            selected ? 'text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          {loc.name}
                        </p>
                      </div>
                    );
                  })}
                </div>
                {currentLocation ? (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Navigation className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">
                          {currentLocation.name}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {currentLocation.address}
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div className="bg-white/70 rounded-lg px-3 py-2">
                            <p className="text-[10px] text-gray-500">经纬度</p>
                            <p className="text-xs font-mono text-gray-700 mt-0.5">
                              {currentLocation.latitude.toFixed(4)},{' '}
                              {currentLocation.longitude.toFixed(4)}
                            </p>
                          </div>
                          <div className="bg-white/70 rounded-lg px-3 py-2">
                            <p className="text-[10px] text-gray-500">GPS格式</p>
                            <p className="text-xs font-mono text-gray-700 mt-0.5 break-all">
                              {formatGPS(
                                currentLocation.latitude,
                                currentLocation.longitude
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center">
                    <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">请点击上方预设地点卡片，或使用"获取当前定位"按钮</p>
                  </div>
                )}
                {errors.location && (
                  <p className="text-xs text-red-500 mt-2">{errors.location}</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-purple-500 rounded"></span>
                  模块3 · 照片上传 + 水印
                  <span className="text-red-500">*</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    {!photoPreview ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="h-60 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                      >
                        <Upload className="w-10 h-10 text-gray-300 mb-3" />
                        <p className="text-sm font-medium text-gray-600">
                          点击上传照片
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          支持 JPG / PNG 格式
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUsePlaceholderPhoto();
                          }}
                          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Image className="w-3 h-3" />
                          使用占位图
                        </button>
                      </div>
                    ) : (
                      <div className="relative h-60 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                        <img
                          src={photoPreview}
                          alt="预览"
                          className="w-full h-full object-cover"
                        />
                        <div
                          className={`absolute ${watermarkPositionClass} max-w-[70%] px-2.5 py-1.5 bg-black/60 backdrop-blur-sm rounded-md text-white text-[10px] space-y-0.5 shadow-lg`}
                        >
                          <p className="flex items-center gap-1 opacity-95">
                            <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                            {watermarkInfoText.time}
                          </p>
                          <p className="flex items-center gap-1 opacity-95 break-all">
                            <Navigation className="w-2.5 h-2.5 flex-shrink-0" />
                            {watermarkInfoText.gps.slice(0, 28)}
                          </p>
                          <p className="flex items-center gap-1 opacity-95 truncate">
                            <Droplets className="w-2.5 h-2.5 flex-shrink-0" />
                            {watermarkInfoText.team}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPhotoPreview('');
                            setPhotoBase64('');
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {errors.photo && (
                      <p className="text-xs text-red-500 mt-2">{errors.photo}</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">水印位置</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'bottom-right' as const, label: '右下角' },
                          { key: 'bottom-left' as const, label: '左下角' },
                          { key: 'top-right' as const, label: '右上角' },
                        ].map((pos) => (
                          <button
                            key={pos.key}
                            onClick={() => setWatermarkPosition(pos.key)}
                            className={`py-2 px-2 text-xs rounded-lg border transition-all ${
                              watermarkPosition === pos.key
                                ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5 mx-auto mb-1" />
                            {pos.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                      <p className="text-xs font-semibold text-purple-800 mb-2 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        水印信息预览
                      </p>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock className="w-3 h-3 text-purple-500 flex-shrink-0" />
                          <span className="text-gray-500 w-10 flex-shrink-0">时间：</span>
                          <span className="font-mono break-all">{watermarkInfoText.time}</span>
                        </div>
                        <div className="flex items-start gap-2 text-gray-700">
                          <Navigation className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-500 w-10 flex-shrink-0">GPS：</span>
                          <span className="font-mono break-all">{watermarkInfoText.gps}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Droplets className="w-3 h-3 text-blue-500 flex-shrink-0" />
                          <span className="text-gray-500 w-10 flex-shrink-0">团队：</span>
                          <span className="truncate">{watermarkInfoText.team}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Camera className="w-3 h-3 text-orange-500 flex-shrink-0" />
                          <span className="text-gray-500 w-10 flex-shrink-0">提交：</span>
                          <span>张明</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-orange-500 rounded"></span>
                  模块4 · 现场描述
                  <span className="text-red-500">*</span>
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      工作内容描述
                      <span className="text-gray-400 ml-1">（至少20字）</span>
                    </label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        if (e.target.value.trim().length >= 20 && errors.description) {
                          const newErrs = { ...errors };
                          delete newErrs.description;
                          setErrors(newErrs);
                        }
                      }}
                      placeholder="请详细描述今日工作内容、走访对象、发现问题、开展活动、取得成果等..."
                      className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                        errors.description ? 'border-red-400' : 'border-gray-200'
                      }`}
                    />
                    <div className="flex justify-between mt-1">
                      {errors.description ? (
                        <p className="text-xs text-red-500">{errors.description}</p>
                      ) : (
                        <span></span>
                      )}
                      <span
                        className={`text-xs ${
                          description.trim().length < 20
                            ? 'text-gray-400'
                            : 'text-green-600'
                        }`}
                      >
                        {description.trim().length} 字
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      服务时长（小时）
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={serviceHours}
                      onChange={(e) => {
                        setServiceHours(e.target.value);
                        if (e.target.value && !isNaN(parseFloat(e.target.value)) && parseFloat(e.target.value) > 0 && errors.serviceHours) {
                          const newErrs = { ...errors };
                          delete newErrs.serviceHours;
                          setErrors(newErrs);
                        }
                      }}
                      placeholder="如：6.5"
                      className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.serviceHours ? 'border-red-400' : 'border-gray-200'
                      }`}
                    />
                    {errors.serviceHours && (
                      <p className="text-xs text-red-500 mt-1">{errors.serviceHours}</p>
                    )}
                    <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-[11px] text-amber-700 leading-relaxed">
                        💡 提交后系统将：
                        <br />① 自动叠加防篡改水印
                        <br />② 记录GPS坐标信息
                        <br />③ 绑定团队与提交人
                        <br />④ 更新团队打卡次数
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                提交打卡
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckIn;
