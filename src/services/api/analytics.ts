import { get, post, put } from '../request';
import type { ApiResponse } from '../request';

export interface PlaceDailyData {
  date: string;
  placeId: string;
  placeName: string;
  visitorCount: number;
  revenue: number;
  reservationCount: number;
  verificationCount: number;
}

export interface OverviewData {
  totalPlaces: number;
  totalVisitors: number;
  totalRevenue: number;
  totalReservations: number;
  totalVerifications: number;
  totalAlarms: number;
  totalInspections: number;
  todayVisitors: number;
  todayRevenue: number;
  todayReservations: number;
  pendingAlarms: number;
  pendingInspections: number;
}

export interface VisitorTrendData {
  date: string;
  visitorCount: number;
  reservationCount: number;
}

export interface PlaceRankingData {
  placeId: string;
  placeName: string;
  visitorCount: number;
  revenue: number;
  growthRate: number;
}

export interface RevenueData {
  date: string;
  ticketRevenue: number;
  merchandiseRevenue: number;
  cateringRevenue: number;
  otherRevenue: number;
}

export interface RegionalDistributionData {
  city: string;
  placeCount: number;
  visitorCount: number;
  revenue: number;
}

export interface ReportParams {
  startDate: string;
  endDate: string;
  placeId?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  format: 'excel' | 'pdf';
}

export const getOverview = (): Promise<ApiResponse<OverviewData>> => {
  return get<OverviewData>('/analytics/overview');
};

export const getVisitorTrend = (
  params?: { startDate?: string; endDate?: string; placeId?: string }
): Promise<ApiResponse<VisitorTrendData[]>> => {
  return get<VisitorTrendData[]>('/analytics/visitor-trend', params);
};

export const getPlaceRanking = (
  params?: { startDate?: string; endDate?: string; limit?: number }
): Promise<ApiResponse<PlaceRankingData[]>> => {
  return get<PlaceRankingData[]>('/analytics/place-ranking', params);
};

export const getRevenueData = (
  params?: { startDate?: string; endDate?: string; placeId?: string }
): Promise<ApiResponse<RevenueData[]>> => {
  return get<RevenueData[]>('/analytics/revenue', params);
};

export const getRegionalDistribution = (
  params?: { startDate?: string; endDate?: string }
): Promise<ApiResponse<RegionalDistributionData[]>> => {
  return get<RegionalDistributionData[]>('/analytics/regional-distribution', params);
};

export const getPlaceDailyData = (
  params: { startDate: string; endDate: string; placeId: string }
): Promise<ApiResponse<PlaceDailyData[]>> => {
  return get<PlaceDailyData[]>('/analytics/place-daily', params);
};

export const generateReport = (params: ReportParams): Promise<ApiResponse<string>> => {
  return get<string>('/analytics/report', params);
};

export interface DashboardOverview {
  totalPlaces: number;
  onlinePlaces: number;
  todayVisitors: number;
  pendingAlarms: number;
  inspectionCompletionRate: number;
  placeCountTrend: number;
  onlineRateTrend: number;
  visitorTrend: number;
  alarmTrend: number;
  inspectionTrend: number;
}

export interface MapHeatData {
  name: string;
  code: string;
  value: number;
  placeCount: number;
  onlineCount: number;
  visitorCount: number;
  alarmCount: number;
  level: 'province' | 'city' | 'district';
  children?: MapHeatData[];
}

export interface RealtimeAlarm {
  id: string;
  placeName: string;
  alarmType: string;
  level: 'critical' | 'major' | 'minor' | 'warning' | 'info';
  levelName: string;
  content: string;
  time: string;
  status: 'pending' | 'processing' | 'resolved';
}

export interface TrendData {
  date: string;
  visitorCount: number;
  alarmCount: number;
  placeActivity: number;
}

export interface RegionRankingItem {
  regionName: string;
  regionCode: string;
  placeCount: number;
  alarmCount: number;
  onlineRate: number;
}

export interface PlaceTypeItem {
  type: string;
  typeName: string;
  count: number;
  percentage: number;
}

export interface DrillDownData {
  level: 'province' | 'city' | 'district' | 'place';
  parentCode?: string;
  currentCode: string;
  currentName: string;
  data: MapHeatData[];
}

export const getDashboardOverview = (): Promise<ApiResponse<DashboardOverview>> => {
  return get<DashboardOverview>('/analytics/dashboard/overview');
};

export const getMapHeatData = (params?: { regionCode?: string; level?: string }): Promise<ApiResponse<MapHeatData[]>> => {
  return get<MapHeatData[]>('/analytics/dashboard/map-heat', params);
};

export const getRealtimeAlarms = (params?: { limit?: number }): Promise<ApiResponse<RealtimeAlarm[]>> => {
  return get<RealtimeAlarm[]>('/analytics/dashboard/realtime-alarms', params);
};

export const getTrendData = (params?: { days?: number; regionCode?: string }): Promise<ApiResponse<TrendData[]>> => {
  return get<TrendData[]>('/analytics/dashboard/trend', params);
};

export const getRegionRanking = (params?: { regionCode?: string; limit?: number }): Promise<ApiResponse<RegionRankingItem[]>> => {
  return get<RegionRankingItem[]>('/analytics/dashboard/region-ranking', params);
};

export const getPlaceTypeDistribution = (params?: { regionCode?: string }): Promise<ApiResponse<PlaceTypeItem[]>> => {
  return get<PlaceTypeItem[]>('/analytics/dashboard/place-type', params);
};

export interface BusinessOverviewData {
  totalVisitors: number;
  totalDuration: number;
  avgDuration: number;
  peakHour: string;
  activePlaces: number;
  visitorTrend: number;
  durationTrend: number;
  avgDurationTrend: number;
  activePlaceTrend: number;
}

export interface HourlyHeatmapData {
  hour: number;
  count: number;
}

export interface AgeDistributionData {
  range: string;
  count: number;
  percentage: number;
}

export interface GenderDistributionData {
  gender: string;
  count: number;
  percentage: number;
}

export interface PlaceRankingRow {
  placeId: string;
  placeName: string;
  todayVisitors: number;
  totalDuration: number;
  activeRate: number;
  regionName: string;
}

export interface ReportListItem {
  id: string;
  placeId: string;
  placeName: string;
  date: string;
  totalVisitors: number;
  totalDuration: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  statusName: string;
  createdAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewComment?: string;
}

export interface ReportListParams {
  page: number;
  pageSize: number;
  placeId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface ReportListData {
  list: ReportListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReportFormData {
  placeId: string;
  date: string;
  totalVisitors: number;
  totalDuration: number;
  remarks?: string;
}

export const getBusinessOverview = (params?: { regionCode?: string; period?: string }): Promise<ApiResponse<BusinessOverviewData>> => {
  return get<BusinessOverviewData>('/analytics/business/overview', params);
};

export const getHourlyHeatmap = (params?: { regionCode?: string; date?: string }): Promise<ApiResponse<HourlyHeatmapData[]>> => {
  return get<HourlyHeatmapData[]>('/analytics/business/hourly-heatmap', params);
};

export const getAgeDistribution = (params?: { regionCode?: string }): Promise<ApiResponse<AgeDistributionData[]>> => {
  return get<AgeDistributionData[]>('/analytics/business/age-distribution', params);
};

export const getGenderDistribution = (params?: { regionCode?: string }): Promise<ApiResponse<GenderDistributionData[]>> => {
  return get<GenderDistributionData[]>('/analytics/business/gender-distribution', params);
};

export const getPlaceRankingTable = (params?: { regionCode?: string; limit?: number }): Promise<ApiResponse<PlaceRankingRow[]>> => {
  return get<PlaceRankingRow[]>('/analytics/business/place-ranking', params);
};

export const getReportList = (params: ReportListParams): Promise<ApiResponse<ReportListData>> => {
  return get<ReportListData>('/analytics/report/list', params);
};

export const getReportDetail = (id: string): Promise<ApiResponse<ReportListItem>> => {
  return get<ReportListItem>(`/analytics/report/${id}`);
};

export const createReport = (params: ReportFormData): Promise<ApiResponse<ReportListItem>> => {
  return post<ReportListItem>('/analytics/report', params);
};

export const submitReport = (id: string): Promise<ApiResponse<null>> => {
  return put<null>(`/analytics/report/${id}/submit`);
};

export const reviewReport = (id: string, params: { status: 'approved' | 'rejected'; comment?: string }): Promise<ApiResponse<null>> => {
  return put<null>(`/analytics/report/${id}/review`, params);
};

export interface HourlyDistributionItem {
  hour: number;
  count: number;
}

export interface DurationSegmentItem {
  segment: string;
  label: string;
  count: number;
  percentage: number;
}

export interface DurationByHourItem {
  hour: number;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
}

export interface PersonnelDetailItem {
  name: string;
  idCard: string;
  duration: number;
  placeName: string;
  entryTime: string;
}

export interface CityDrillDownItem {
  districtName: string;
  districtCode: string;
  placeCount: number;
  visitorCount: number;
  avgDuration: number;
}

export interface DistrictPlaceItem {
  placeId: string;
  placeName: string;
  visitorCount: number;
  avgDuration: number;
  type: string;
}

export interface PersonnelProfileData {
  ageDistribution: { range: string; count: number; percentage: number }[];
  genderDistribution: { gender: string; count: number; percentage: number }[];
  identityTypes: { type: string; typeName: string; count: number; percentage: number }[];
  minorTrend: { date: string; ratio: number }[];
}

export interface ReportStatusItem {
  placeId: string;
  placeName: string;
  regionName: string;
  status: 'submitted' | 'not_submitted' | 'overdue';
  reportTime: string | null;
  reporter: string | null;
  integrity: 'complete' | 'incomplete' | 'failed';
  integrityDetail: string;
}

export const getHourlyDistribution = (params?: { date?: string; regionCode?: string }): Promise<ApiResponse<HourlyDistributionItem[]>> => {
  return get<HourlyDistributionItem[]>('/analytics/business/hourly-distribution', params);
};

export const getDurationSegments = (params?: { regionCode?: string }): Promise<ApiResponse<DurationSegmentItem[]>> => {
  return get<DurationSegmentItem[]>('/analytics/business/duration-segments', params);
};

export const getDurationByHour = (params?: { regionCode?: string }): Promise<ApiResponse<DurationByHourItem[]>> => {
  return get<DurationByHourItem[]>('/analytics/business/duration-by-hour', params);
};

export const getPersonnelDetail = (params: { hour: number; regionCode?: string }): Promise<ApiResponse<PersonnelDetailItem[]>> => {
  return get<PersonnelDetailItem[]>('/analytics/business/personnel-detail', params);
};

export const getCityDrillDown = (params: { cityCode: string }): Promise<ApiResponse<CityDrillDownItem[]>> => {
  return get<CityDrillDownItem[]>('/analytics/business/city-drilldown', params);
};

export const getDistrictPlaces = (params: { districtCode: string; districtName: string }): Promise<ApiResponse<DistrictPlaceItem[]>> => {
  return get<DistrictPlaceItem[]>('/analytics/business/district-places', params);
};

export const getPersonnelProfile = (params?: { regionCode?: string }): Promise<ApiResponse<PersonnelProfileData>> => {
  return get<PersonnelProfileData>('/analytics/business/personnel-profile', params);
};

export const getReportStatusList = (params?: { regionCode?: string }): Promise<ApiResponse<ReportStatusItem[]>> => {
  return get<ReportStatusItem[]>('/analytics/business/report-status', params);
};
