import request from '@/utils/request';

export function getMySchedules(params) {
  return request({
    url: '/schedules/my',
    method: 'get',
    params
  });
}

export function getDepartmentSchedules(params) {
  return request({
    url: '/schedules/department',
    method: 'get',
    params
  });
}

export function getScheduleById(id) {
  return request({
    url: `/schedules/${id}`,
    method: 'get'
  });
}

export function createSchedule(data) {
  return request({
    url: '/schedules',
    method: 'post',
    data
  });
}

export function updateSchedule(id, data) {
  return request({
    url: `/schedules/${id}`,
    method: 'put',
    data
  });
}

export function deleteSchedule(id) {
  return request({
    url: `/schedules/${id}`,
    method: 'delete'
  });
}

export function searchSchedules(params) {
  return request({
    url: '/schedules/search',
    method: 'get',
    params
  });
}
