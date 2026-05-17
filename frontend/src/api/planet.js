import request from '@/utils/request'

export const createPlanet = (data) => {
  return request({
    url: '/planets',
    method: 'post',
    data
  })
}

export const getPlanets = (params) => {
  return request({
    url: '/planets',
    method: 'get',
    params
  })
}

export const getPlanetById = (id) => {
  return request({
    url: `/planets/${id}`,
    method: 'get'
  })
}

export const joinPlanet = (data) => {
  return request({
    url: '/planets/join',
    method: 'post',
    data
  })
}

export const createInviteCode = (data) => {
  return request({
    url: '/planets/invite',
    method: 'post',
    data
  })
}

export const searchPlanets = (params) => {
  return request({
    url: '/planets/search',
    method: 'get',
    params
  })
}
