import request from '@/utils/request'

export function getBanners() {
  return request({
    url: '/projects/banners',
    method: 'get'
  })
}

export function getProjects(params?: { status?: string; page?: number; pageSize?: number }) {
  return request({
    url: '/projects/list',
    method: 'get',
    params
  })
}

export function getProjectDetail(id: number) {
  return request({
    url: `/projects/${id}`,
    method: 'get'
  })
}

export function invest(data: { projectId: number; amount: number }) {
  return request({
    url: '/projects/invest',
    method: 'post',
    data
  })
}
