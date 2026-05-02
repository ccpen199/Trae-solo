import request from '@/utils/request';

export function getMonitorPoints(params) {
  return request({
    url: '/monitor/points',
    method: 'get',
    params,
  });
}

export function getMonitorPointById(id) {
  return request({
    url: `/monitor/points/${id}`,
    method: 'get',
  });
}

export function createMonitorPoint(data) {
  return request({
    url: '/monitor/points',
    method: 'post',
    data,
  });
}

export function updateMonitorPoint(id, data) {
  return request({
    url: `/monitor/points/${id}`,
    method: 'put',
    data,
  });
}

export function getMonitorData(params) {
  return request({
    url: '/monitor/data',
    method: 'get',
    params,
  });
}

export function getHeatMapData(type, timeRange) {
  const params = {};
  if (type) params.type = type;
  if (timeRange) params.timeRange = timeRange;

  return request({
    url: '/monitor/heatmap',
    method: 'get',
    params,
  });
}

export function getRealTimeStatus() {
  return request({
    url: '/monitor/status/realtime',
    method: 'get',
  });
}

export function getFences() {
  return request({
    url: '/monitor/fences',
    method: 'get',
  });
}

export function createFence(data) {
  return request({
    url: '/monitor/fences',
    method: 'post',
    data,
  });
}

export function ingestMonitorData(monitorPointId, rawData, dataTime) {
  return request({
    url: '/monitor/data/ingest',
    method: 'post',
    data: {
      monitorPointId,
      rawData,
      dataTime,
    },
  });
}
