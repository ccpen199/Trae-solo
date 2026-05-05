import request from '@/utils/request'

export function getDictTypes() {
  return request({
    url: '/dictionary/types',
    method: 'get'
  })
}

export function getDictItems(dictType) {
  return request({
    url: `/dictionary/${dictType}`,
    method: 'get'
  })
}

export function getBatchDict(types) {
  return request({
    url: '/dictionary/batch/list',
    method: 'get',
    params: { types: types.join(',') }
  })
}
