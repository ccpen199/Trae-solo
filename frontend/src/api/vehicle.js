import request from '@/utils/request'

export const getVehicleList = (params) => {
  return request({
    url: '/vehicles',
    method: 'get',
    params
  })
}

export const getVehicleDetail = (id) => {
  return request({
    url: `/vehicles/${id}`,
    method: 'get'
  })
}

export const createVehicle = (data) => {
  return request({
    url: '/vehicles',
    method: 'post',
    data
  })
}

export const updateVehicle = (id, data) => {
  return request({
    url: `/vehicles/${id}`,
    method: 'put',
    data
  })
}

export const deleteVehicle = (id) => {
  return request({
    url: `/vehicles/${id}`,
    method: 'delete'
  })
}
