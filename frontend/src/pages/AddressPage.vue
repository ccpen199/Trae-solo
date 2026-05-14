<template>
  <div class="address-container">
    <van-nav-bar title="选择地址" left-text="返回" @click-left="goBack" />
    
    <div class="nearby-stores" v-if="nearbyStores.length > 0">
      <h3 class="section-title">📍 附近门店</h3>
      <div 
        v-for="store in nearbyStores" 
        :key="store.id" 
        class="store-item"
        @click="selectStore(store)"
      >
        <div class="store-info">
          <span class="store-name">{{ store.name }}</span>
          <span class="store-address">{{ store.address }}</span>
        </div>
        <span class="store-distance">{{ store.distance ? (store.distance / 1000).toFixed(1) + 'km' : '距离未知' }}</span>
      </div>
    </div>
    
    <div class="my-addresses" v-if="addresses.length > 0">
      <h3 class="section-title">🏠 我的收货地址</h3>
      <div 
        v-for="address in addresses" 
        :key="address.id" 
        class="address-item"
        @click="selectAddress(address)"
      >
        <div class="address-header">
          <span class="address-name">{{ address.name }}</span>
          <span class="address-phone">{{ address.phone }}</span>
          <span class="address-tag" v-if="address.is_default">默认</span>
        </div>
        <p class="address-detail">{{ address.province }}{{ address.city }}{{ address.district }}{{ address.detail }}</p>
      </div>
    </div>
    
    <van-button type="primary" block @click="goAddAddress">新增收货地址</van-button>
    
    <van-empty v-if="nearbyStores.length === 0 && addresses.length === 0" description="暂无地址" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, Button, Empty, showToast } from 'vant'
import { addressApi } from '../services/api'
import store from '../store'

const router = useRouter()
const addresses = ref([])
const nearbyStores = ref([])

const goBack = () => {
  router.back()
}

const goAddAddress = () => {
  router.push('/address-add')
}

const selectAddress = (address) => {
  store.mutations.setCurrentAddress({ type: 'address', ...address })
  showToast('地址已选择')
  router.back()
}

const selectStore = (store) => {
  store.mutations.setCurrentAddress({ type: 'store', ...store })
  showToast('门店已选择')
  router.back()
}

onMounted(() => {
  addressApi.getAddresses().then(res => {
    if (res.code === 200) {
      addresses.value = res.data
    }
  })
  
  addressApi.getNearbyStores().then(res => {
    if (res.code === 200) {
      nearbyStores.value = res.data
    }
  })
})
</script>

<style scoped>
.address-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 10px;
  padding-bottom: 80px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin: 20px 0 15px;
}

.store-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
}

.store-info {
  flex: 1;
}

.store-name {
  display: block;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 5px;
}

.store-address {
  font-size: 14px;
  color: #666;
}

.store-distance {
  font-size: 14px;
  color: #ff6b6b;
}

.address-item {
  background: white;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
}

.address-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.address-name {
  font-size: 16px;
  font-weight: bold;
}

.address-phone {
  font-size: 14px;
  color: #666;
}

.address-tag {
  background: #ff6b6b;
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.address-detail {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}
</style>