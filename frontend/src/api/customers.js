import request from '@/utils/request'

export const getCustomerList = (params) => {
  return request({
    url: '/customers',
    method: 'GET',
    params
  })
}

export const getCustomerDetail = (id) => {
  return request({
    url: `/customers/${id}`,
    method: 'GET'
  })
}

export const createCustomer = (data) => {
  return request({
    url: '/customers',
    method: 'POST',
    data
  })
}

export const updateCustomer = (id, data) => {
  return request({
    url: `/customers/${id}`,
    method: 'PUT',
    data
  })
}

export const deleteCustomer = (id) => {
  return request({
    url: `/customers/${id}`,
    method: 'DELETE'
  })
}

export const followCustomer = (id, data) => {
  return request({
    url: `/customers/${id}/follow`,
    method: 'POST',
    data
  })
}
