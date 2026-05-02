import request from '@/utils/request'

export function getProductPage(query) {
  return request({
    url: '/product/page',
    method: 'get',
    params: query
  })
}

export function getProductById(id) {
  return request({
    url: `/product/${id}`,
    method: 'get'
  })
}

export function getProductBySkuCode(skuCode) {
  return request({
    url: `/product/sku/${skuCode}`,
    method: 'get'
  })
}

export function createProduct(data) {
  return request({
    url: '/product',
    method: 'post',
    data
  })
}

export function updateProduct(data) {
  return request({
    url: '/product',
    method: 'put',
    data
  })
}

export function deleteProduct(id) {
  return request({
    url: `/product/${id}`,
    method: 'delete'
  })
}

export function updateProductStatus(id, status) {
  return request({
    url: `/product/status/${id}`,
    method: 'post',
    params: { status }
  })
}

export function getCategoryTree() {
  return request({
    url: '/product/category/tree',
    method: 'get'
  })
}

export function getCategoryPage(query) {
  return request({
    url: '/product/category/page',
    method: 'get',
    params: query
  })
}

export function createCategory(data) {
  return request({
    url: '/product/category',
    method: 'post',
    data
  })
}

export function updateCategory(data) {
  return request({
    url: '/product/category',
    method: 'put',
    data
  })
}

export function deleteCategory(id) {
  return request({
    url: `/product/category/${id}`,
    method: 'delete'
  })
}
