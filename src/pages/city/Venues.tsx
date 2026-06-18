import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Building2, Clock, Users, MapPin, Phone, Calendar, Filter, CheckCircle } from 'lucide-react';
import { useGetPaginated, usePost } from '../../hooks/useApi';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import type { Venue, Activity } from '../../../shared/types';

const venueTypes = [
  { value: 'all', label: '全部', color: 'bg-gray-100 text-gray-700' },
  { value: 'stadium', label: '体育场馆', color: 'bg-blue-100 text-blue-700' },
  { value: 'library', label: '图书馆', color: 'bg-green-100 text-green-700' },
  { value: 'museum', label: '博物馆', color: 'bg-purple-100 text-purple-700' },
  { value: 'theater', label: '剧院', color: 'bg-orange-100 text-orange-700' },
  { value: 'community', label: '社区中心', color: 'bg-pink-100 text-pink-700' },
];

const getVenueIconColor = (type: string) => {
  switch (type) {
    case 'stadium': return 'bg-blue-100 text-blue-600';
    case 'library': return 'bg-green-100 text-green-600';
    case 'museum': return 'bg-purple-100 text-purple-600';
    case 'theater': return 'bg-orange-100 text-orange-600';
    case 'community': return 'bg-pink-100 text-pink-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const getVenueTypeLabel = (type: string) => {
  switch (type) {
    case 'stadium': return '体育场馆';
    case 'library': return '图书馆';
    case 'museum': return '博物馆';
    case 'theater': return '剧院';
    case 'community': return '社区中心';
    default: return '其他';
  }
};

const getOccupancyStatus = (current: number, capacity: number) => {
  const ratio = current / capacity;
  if (ratio < 0.5) return { status: 'success', text: '充足', color: 'text-green-600', bg: 'bg-green-500' };
  if (ratio < 0.8) return { status: 'warning', text: '较拥挤', color: 'text-yellow-600', bg: 'bg-yellow-500' };
  return { status: 'error', text: '拥挤', color: 'text-red-600', bg: 'bg-red-500' };
};

export default function Venues() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const { data, isLoading } = useGetPaginated<Venue>(
    ['venues', String(page), typeFilter],
    `/city/venues?page=${page}&pageSize=10&type=${typeFilter}`
  );

  const bookingMutation = usePost();

  const handleBooking = async () => {
    if (!selectedVenue || !selectedActivity) return;

    try {
      await bookingMutation.mutateAsync({
        url: '/city/venues/booking',
        data: {
          venueId: selectedVenue.id,
          activityId: selectedActivity.id,
        },
      });
      setSelectedVenue(null);
      setSelectedActivity(null);
      alert('预订成功！请按时前往');
    } catch (error) {
      alert('预订失败，请稍后重试');
    }
  };

  const filteredVenues = data?.items?.filter((v) =>
    v.name.includes(search) || v.address.includes(search)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索场馆名称、地址..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {venueTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => { setTypeFilter(type.value); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              typeFilter === type.value
                ? 'bg-primary text-white'
                : `${type.color} hover:opacity-80`
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Filter className="w-4 h-4" />
              {type.label}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <Card.Body className="animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </Card.Body>
            </Card>
          ))}
        </div>
      ) : filteredVenues?.length ? (
        <div className="space-y-4">
          {filteredVenues.map((venue, idx) => {
            const occupancy = getOccupancyStatus(venue.currentOccupancy, venue.capacity);
            const occupancyPercent = Math.round((venue.currentOccupancy / venue.capacity) * 100);

            return (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card hover onClick={() => setSelectedVenue(venue)}>
                  <Card.Body>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${getVenueIconColor(venue.type)}`}>
                          <Building2 className="w-7 h-7" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900">{venue.name}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs ${getVenueIconColor(venue.type)}`}>
                              {getVenueTypeLabel(venue.type)}
                            </span>
                            <StatusBadge status={occupancy.status as 'success' | 'warning' | 'error'} text={occupancy.text} />
                          </div>
                          <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {venue.address}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {venue.phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {venue.openingHours}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {venue.currentOccupancy} / {venue.capacity} 人
                            </span>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-500">当前人流量</span>
                              <span className={occupancy.color}>{occupancyPercent}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${occupancy.bg}`}
                                style={{ width: `${occupancyPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card>
          <Card.Body className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">暂无场馆信息</p>
          </Card.Body>
        </Card>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            {page} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(data.totalPages, page + 1))}
            disabled={page === data.totalPages}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}

      {selectedVenue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setSelectedVenue(null); setSelectedActivity(null); }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{selectedVenue.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs ${getVenueIconColor(selectedVenue.type)}`}>
                      {getVenueTypeLabel(selectedVenue.type)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedVenue.address}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-2xl font-bold text-gray-900">{selectedVenue.currentOccupancy}</p>
                  <p className="text-xs text-gray-500">当前人数</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Building2 className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-2xl font-bold text-gray-900">{selectedVenue.capacity}</p>
                  <p className="text-xs text-gray-500">最大容量</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-lg font-bold text-gray-900 text-sm">{selectedVenue.openingHours}</p>
                  <p className="text-xs text-gray-500">开放时间</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-2xl font-bold text-gray-900">{selectedVenue.todayActivities.length}</p>
                  <p className="text-xs text-gray-500">今日活动</p>
                </div>
              </div>

              <h4 className="font-semibold text-gray-900 mb-4">今日活动预订</h4>
              <div className="space-y-3 mb-6">
                {selectedVenue.todayActivities.map((activity) => {
                  const availableCount = activity.capacity - activity.booked;
                  const availablePercent = Math.round((availableCount / activity.capacity) * 100);
                  const isAvailable = activity.available;

                  return (
                    <button
                      key={activity.id}
                      disabled={!isAvailable}
                      onClick={() => setSelectedActivity(activity)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        selectedActivity?.id === activity.id
                          ? 'border-primary bg-primary/5'
                          : isAvailable
                          ? 'border-gray-200 hover:border-gray-300'
                          : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            activity.type === 'sports' ? 'bg-blue-100 text-blue-600' :
                            activity.type === 'culture' ? 'bg-purple-100 text-purple-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{activity.name}</p>
                            <p className="text-xs text-gray-500">{activity.type} · {activity.time}</p>
                          </div>
                        </div>
                        {isAvailable ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            availablePercent > 50 ? 'bg-green-100 text-green-700' :
                            availablePercent > 20 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            余票 {availableCount}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                            已约满
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            availablePercent > 50 ? 'bg-green-500' :
                            availablePercent > 20 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${availablePercent}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <Button
                  className="flex-1"
                  disabled={!selectedActivity || bookingMutation.isPending}
                  loading={bookingMutation.isPending}
                  onClick={handleBooking}
                >
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    确认预订
                  </span>
                </Button>
                <button
                  onClick={() => { setSelectedVenue(null); setSelectedActivity(null); }}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
