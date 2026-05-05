import request from '@/utils/request'

export const getCustomerCategories = () => {
  return request({
    url: '/common/customer-categories',
    method: 'GET'
  })
}

export const getProductCategories = () => {
  return request({
    url: '/common/product-categories',
    method: 'GET'
  })
}

export const getBrands = () => {
  return request({
    url: '/common/brands',
    method: 'GET'
  })
}

export const getWarehouses = (params) => {
  return request({
    url: '/common/warehouses',
    method: 'GET',
    params
  })
}

export const getPaymentMethods = () => {
  return request({
    url: '/common/payment-methods',
    method: 'GET'
  })
}

export const getLogisticsCompanies = () => {
  return request({
    url: '/common/logistics-companies',
    method: 'GET'
  })
}

export const getDepartments = () => {
  return request({
    url: '/common/departments',
    method: 'GET'
  })
}

export const getUsers = (params) => {
  return request({
    url: '/common/users',
    method: 'GET',
    params
  })
}

export const getRoles = () => {
  return request({
    url: '/common/roles',
    method: 'GET'
  })
}
