import axios from 'axios'
import store from '../store'
import router from '../router'

const instance = axios.create({
  baseURL: '/api',
  timeout: 10000
})

instance.interceptors.request.use(config => {
  if (store.state.user.token) {
    config.headers.Authorization = `Bearer ${store.state.user.token}`
  }
  return config
}, error => {
  return Promise.reject(error)
})

instance.interceptors.response.use(response => {
  if (response.data.code === 401) {
    store.mutations.clearUser()
    router.push('/login')
  }
  return response.data
}, error => {
  return Promise.reject(error)
})

export const userApi = {
  register(data) {
    return instance.post('/users/register', data)
  },
  login(data) {
    return instance.post('/users/login', data)
  },
  loginTaobao(data) {
    return instance.post('/users/login/taobao', data)
  },
  loginAlipay(data) {
    return instance.post('/users/login/alipay', data)
  },
  logout() {
    return instance.post('/users/logout')
  },
  resetPassword(data) {
    return instance.post('/users/password/reset', data)
  }
}

export const productApi = {
  getCategories() {
    return instance.get('/products/categories')
  },
  getProducts(params) {
    return instance.get('/products', { params })
  },
  getProduct(id) {
    return instance.get(`/products/${id}`)
  },
  searchByBarcode(barcode) {
    return instance.get(`/products/search/barcode/${barcode}`)
  },
  getHotProducts() {
    return instance.get('/products/hot')
  },
  getNewProducts() {
    return instance.get('/products/new')
  },
  getHotWords() {
    return instance.get('/products/search/hotwords')
  }
}

export const cartApi = {
  getCart() {
    return instance.get('/cart')
  },
  addToCart(data) {
    return instance.post('/cart', data)
  },
  updateCart(id, data) {
    return instance.put(`/cart/${id}`, data)
  },
  deleteCart(id) {
    return instance.delete(`/cart/${id}`)
  },
  clearCart() {
    return instance.delete('/cart')
  }
}

export const orderApi = {
  getOrders(params) {
    return instance.get('/orders', { params })
  },
  getOrder(id) {
    return instance.get(`/orders/${id}`)
  },
  createOrder(data) {
    return instance.post('/orders', data)
  },
  updateOrderStatus(id, status) {
    return instance.put(`/orders/${id}/status`, { status })
  }
}

export const addressApi = {
  getAddresses() {
    return instance.get('/addresses')
  },
  addAddress(data) {
    return instance.post('/addresses', data)
  },
  updateAddress(id, data) {
    return instance.put(`/addresses/${id}`, data)
  },
  deleteAddress(id) {
    return instance.delete(`/addresses/${id}`)
  },
  getNearbyStores(params) {
    return instance.get('/addresses/nearby', { params })
  }
}

export const adApi = {
  getAds() {
    return instance.get('/ads')
  }
}

export default instance