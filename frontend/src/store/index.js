import { reactive } from 'vue'

const state = reactive({
  user: {
    token: localStorage.getItem('token') || '',
    info: JSON.parse(localStorage.getItem('userInfo') || '{}')
  },
  cart: {
    count: 0
  },
  currentAddress: JSON.parse(localStorage.getItem('currentAddress') || 'null')
})

const mutations = {
  setUser(user) {
    state.user.token = user.token
    state.user.info = user.info
    localStorage.setItem('token', user.token)
    localStorage.setItem('userInfo', JSON.stringify(user.info))
  },
  clearUser() {
    state.user.token = ''
    state.user.info = {}
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  },
  setCartCount(count) {
    state.cart.count = count
  },
  setCurrentAddress(address) {
    state.currentAddress = address
    localStorage.setItem('currentAddress', JSON.stringify(address))
  }
}

export default {
  state,
  mutations
}