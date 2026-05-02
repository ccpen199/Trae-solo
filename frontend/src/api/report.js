import request from '@/utils/request';

export function generateReport(type, options) {
  return request({
    url: '/reports/generate',
    method: 'post',
    data: {
      type,
      options,
    },
  });
}

export function getReports(params) {
  return request({
    url: '/reports',
    method: 'get',
    params,
  });
}

export function getReportById(id) {
  return request({
    url: `/reports/${id}`,
    method: 'get',
  });
}

export function exportReport(id) {
  return request({
    url: `/reports/${id}/export`,
    method: 'get',
    responseType: 'blob',
  });
}

export function getDailyReport(date) {
  const params = {};
  if (date) params.date = date;

  return request({
    url: '/reports/daily',
    method: 'get',
    params,
  });
}

export function getWeeklyReport(year, week) {
  const params = {};
  if (year) params.year = year;
  if (week) params.week = week;

  return request({
    url: '/reports/weekly',
    method: 'get',
    params,
  });
}

export function getMonthlyReport(year, month) {
  const params = {};
  if (year) params.year = year;
  if (month) params.month = month;

  return request({
    url: '/reports/monthly',
    method: 'get',
    params,
  });
}
