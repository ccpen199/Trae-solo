import { http, HttpResponse } from 'msw';
import {
  mockOverview,
  mockVisitorTrend,
  mockPlaceRanking,
  mockRevenueData,
  mockRegionalDistribution,
  successResponse,
  mockPlaces,
  mockDashboardOverview,
  mockMapHeatData,
  generateMockMapHeatData,
  generateMockRealtimeAlarms,
  generateMockTrendData,
  generateMockRegionRanking,
  mockPlaceTypeDistribution,
  generateMockHourlyDistribution,
  generateMockDurationSegments,
  generateMockDurationByHour,
  generateMockPersonnelDetail,
  generateMockCityDrillDown,
  generateMockDistrictPlaces,
  generateMockPersonnelProfile,
  generateMockReportStatus,
} from '../data/mockData';
import type { PlaceDailyData } from '../../api/analytics';

export const analyticsHandlers = [
  http.get('/api/analytics/overview', () => {
    return HttpResponse.json(successResponse(mockOverview));
  }),

  http.get('/api/analytics/visitor-trend', ({ request }) => {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') || '';
    const endDate = url.searchParams.get('endDate') || '';

    return HttpResponse.json(successResponse(mockVisitorTrend));
  }),

  http.get('/api/analytics/place-ranking', ({ request }) => {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') || '';
    const endDate = url.searchParams.get('endDate') || '';
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const data = mockPlaceRanking.slice(0, limit);

    return HttpResponse.json(successResponse(data));
  }),

  http.get('/api/analytics/revenue', ({ request }) => {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') || '';
    const endDate = url.searchParams.get('endDate') || '';
    const placeId = url.searchParams.get('placeId') || '';

    return HttpResponse.json(successResponse(mockRevenueData));
  }),

  http.get('/api/analytics/regional-distribution', ({ request }) => {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') || '';
    const endDate = url.searchParams.get('endDate') || '';

    return HttpResponse.json(successResponse(mockRegionalDistribution));
  }),

  http.get('/api/analytics/place-daily', ({ request }) => {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') || '';
    const endDate = url.searchParams.get('endDate') || '';
    const placeId = url.searchParams.get('placeId') || '';

    const place = mockPlaces.find((p) => p.id === placeId);

    const data: PlaceDailyData[] = [];
    const start = new Date(startDate || '2024-01-01');
    const end = new Date(endDate || '2024-01-31');

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      data.push({
        date: d.toISOString().split('T')[0],
        placeId,
        placeName: place?.name || '未知场所',
        visitorCount: Math.floor(Math.random() * 2000) + 100,
        revenue: Math.floor(Math.random() * 50000) + 10000,
        reservationCount: Math.floor(Math.random() * 100) + 10,
        verificationCount: Math.floor(Math.random() * 500) + 50,
      });
    }

    return HttpResponse.json(successResponse(data));
  }),

  http.get('/api/analytics/report', ({ request }) => {
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'excel';
    const type = url.searchParams.get('type') || 'daily';

    return HttpResponse.json(
      successResponse(
        `https://example.com/report/${type}-report.${format === 'excel' ? 'xlsx' : 'pdf'}?t=${Date.now()}`,
        '报表生成成功'
      )
    );
  }),

  http.get('/api/analytics/dashboard/overview', () => {
    return HttpResponse.json(successResponse(mockDashboardOverview));
  }),

  http.get('/api/analytics/dashboard/map-heat', ({ request }) => {
    const url = new URL(request.url);
    const regionCode = url.searchParams.get('regionCode') || '';
    const level = url.searchParams.get('level') || '';

    const data = generateMockMapHeatData(regionCode || undefined, level || undefined);
    return HttpResponse.json(successResponse(data));
  }),

  http.get('/api/analytics/dashboard/realtime-alarms', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const data = generateMockRealtimeAlarms(limit);
    return HttpResponse.json(successResponse(data));
  }),

  http.get('/api/analytics/dashboard/trend', ({ request }) => {
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '7');
    const regionCode = url.searchParams.get('regionCode') || '';

    const data = generateMockTrendData(days);
    return HttpResponse.json(successResponse(data));
  }),

  http.get('/api/analytics/dashboard/region-ranking', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const regionCode = url.searchParams.get('regionCode') || '';

    const data = generateMockRegionRanking(limit);
    return HttpResponse.json(successResponse(data));
  }),

  http.get('/api/analytics/dashboard/place-type', ({ request }) => {
    const url = new URL(request.url);
    const regionCode = url.searchParams.get('regionCode') || '';

    return HttpResponse.json(successResponse(mockPlaceTypeDistribution));
  }),

  http.get('/api/analytics/business/hourly-distribution', ({ request }) => {
    const url = new URL(request.url);
    const date = url.searchParams.get('date') || '';
    return HttpResponse.json(successResponse(generateMockHourlyDistribution(date || undefined)));
  }),

  http.get('/api/analytics/business/duration-segments', () => {
    return HttpResponse.json(successResponse(generateMockDurationSegments()));
  }),

  http.get('/api/analytics/business/duration-by-hour', () => {
    return HttpResponse.json(successResponse(generateMockDurationByHour()));
  }),

  http.get('/api/analytics/business/personnel-detail', ({ request }) => {
    const url = new URL(request.url);
    const hour = parseInt(url.searchParams.get('hour') || '12');
    return HttpResponse.json(successResponse(generateMockPersonnelDetail(hour)));
  }),

  http.get('/api/analytics/business/city-drilldown', ({ request }) => {
    const url = new URL(request.url);
    const cityCode = url.searchParams.get('cityCode') || '370100';
    return HttpResponse.json(successResponse(generateMockCityDrillDown(cityCode)));
  }),

  http.get('/api/analytics/business/district-places', ({ request }) => {
    const url = new URL(request.url);
    const districtCode = url.searchParams.get('districtCode') || '370102';
    const districtName = url.searchParams.get('districtName') || '历下区';
    return HttpResponse.json(successResponse(generateMockDistrictPlaces(districtCode, districtName)));
  }),

  http.get('/api/analytics/business/personnel-profile', () => {
    return HttpResponse.json(successResponse(generateMockPersonnelProfile()));
  }),

  http.get('/api/analytics/business/report-status', () => {
    return HttpResponse.json(successResponse(generateMockReportStatus()));
  }),
];
