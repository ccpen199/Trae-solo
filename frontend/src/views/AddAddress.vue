<template>
  <div class="add-address-container">
    <div class="header">
      <div class="back-btn" @click="$router.back()">
        <span>←</span>
      </div>
      <h1 class="title">{{ isEdit ? '编辑地址' : '添加新地址' }}</h1>
      <div class="placeholder"></div>
    </div>

    <form class="address-form" @submit.prevent="saveAddress">
      <div class="form-item">
        <label class="form-label">收货人</label>
        <input 
          type="text" 
          v-model="form.name" 
          class="input"
          placeholder="请输入收货人姓名"
        />
      </div>

      <div class="form-item">
        <label class="form-label">手机号码</label>
        <input 
          type="tel" 
          v-model="form.phone" 
          class="input"
          placeholder="请输入手机号码"
          maxlength="11"
        />
      </div>

      <div class="form-item">
        <label class="form-label">所在地区</label>
        <div class="region-select" @click="showRegionPicker = true">
          <span>{{ form.province }} {{ form.city }} {{ form.district }}</span>
          <span class="arrow">▼</span>
        </div>
      </div>

      <div class="form-item">
        <label class="form-label">详细地址</label>
        <textarea 
          v-model="form.detail" 
          class="textarea"
          placeholder="请输入详细地址"
          rows="3"
        ></textarea>
      </div>

      <div class="form-item">
        <label class="form-label">
          <input type="checkbox" v-model="form.is_default" />
          <span>设为默认地址</span>
        </label>
      </div>

      <button type="submit" class="btn btn-primary save-btn">
        {{ isEdit ? '保存修改' : '保存地址' }}
      </button>
    </form>

    <div v-if="showRegionPicker" class="region-picker-mask" @click="showRegionPicker = false">
      <div class="region-picker" @click.stop>
        <div class="picker-header">
          <span class="picker-title">选择地区</span>
          <span class="picker-close" @click="showRegionPicker = false">✕</span>
        </div>
        <div class="picker-content">
          <div class="picker-column">
            <div 
              v-for="province in provinces" 
              :key="province.name"
              class="picker-item"
              :class="{ active: selectedProvince === province.name }"
              @click="selectProvince(province)"
            >{{ province.name }}</div>
          </div>
          <div class="picker-column">
            <div 
              v-for="city in cities" 
              :key="city"
              class="picker-item"
              :class="{ active: selectedCity === city }"
              @click="selectCity(city)"
            >{{ city }}</div>
          </div>
          <div class="picker-column">
            <div 
              v-for="district in districts" 
              :key="district"
              class="picker-item"
              :class="{ active: selectedDistrict === district }"
              @click="selectDistrict(district)"
            >{{ district }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { addressAPI } from '@/api'

const router = useRouter()
const route = useRoute()

const isEdit = ref(false)
const showRegionPicker = ref(false)

const form = reactive({
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  is_default: false
})

const selectedProvince = ref('')
const selectedCity = ref('')
const selectedDistrict = ref('')

const provinces = [
  { name: '北京市', cities: ['北京市'], districts: ['东城区', '西城区', '朝阳区', '海淀区', '丰台区', '石景山区'] },
  { name: '上海市', cities: ['上海市'], districts: ['黄浦区', '徐汇区', '静安区', '长宁区', '普陀区', '虹口区'] },
  { name: '广东省', cities: ['广州市', '深圳市', '珠海市'], districts: ['天河区', '越秀区', '白云区', '宝安区', '南山区'] }
]

const cities = ref([])
const districts = ref([])

onMounted(() => {
  const id = route.query.id
  if (id) {
    isEdit.value = true
    loadAddress(id)
  } else {
    selectProvince(provinces[0])
  }
})

async function loadAddress(id) {
  try {
    const result = await addressAPI.getAddress(id)
    if (result.success) {
      const address = result.data
      form.name = address.name
      form.phone = address.phone
      form.province = address.province || '北京市'
      form.city = address.city || '北京市'
      form.district = address.district || '朝阳区'
      form.detail = address.detail
      form.is_default = address.is_default === 1

      selectedProvince.value = form.province
      selectedCity.value = form.city
      selectedDistrict.value = form.district

      const province = provinces.find(p => p.name === form.province)
      if (province) {
        cities.value = province.cities
        districts.value = province.districts
      }
    }
  } catch (err) {
    console.error('加载地址失败:', err)
  }
}

function selectProvince(province) {
  selectedProvince.value = province.name
  selectedCity.value = ''
  selectedDistrict.value = ''
  cities.value = province.cities
  districts.value = []
  
  if (province.cities.length > 0) {
    selectCity(province.cities[0])
  }
}

function selectCity(city) {
  selectedCity.value = city
  selectedDistrict.value = ''
  
  const province = provinces.find(p => p.name === selectedProvince.value)
  if (province) {
    districts.value = province.districts
    if (province.districts.length > 0) {
      selectDistrict(province.districts[0])
    }
  }
}

function selectDistrict(district) {
  selectedDistrict.value = district
  form.province = selectedProvince.value
  form.city = selectedCity.value
  form.district = selectedDistrict.value
}

async function saveAddress() {
  if (!form.name || !form.phone || !form.detail) {
    alert('请填写完整信息')
    return
  }

  try {
    let result
    if (isEdit.value) {
      result = await addressAPI.updateAddress(route.query.id, {
        ...form,
        is_default: form.is_default ? 1 : 0
      })
    } else {
      result = await addressAPI.addAddress({
        ...form,
        is_default: form.is_default ? 1 : 0
      })
    }

    if (result.success) {
      router.back()
    }
  } catch (err) {
    console.error('保存地址失败:', err)
    alert(err.message || '保存失败')
  }
}
</script>

<style scoped>
.add-address-container {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #fff;
}

.back-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #333;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.placeholder {
  width: 44px;
}

.address-form {
  padding: 16px;
}

.form-item {
  margin-bottom: 16px;
}

.form-label {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  display: block;
}

.input, .textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.textarea {
  resize: none;
}

.region-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
}

.arrow {
  font-size: 12px;
  color: #999;
}

.save-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  border-radius: 24px;
  margin-top: 20px;
}

.region-picker-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
}

.region-picker {
  width: 100%;
  background: #fff;
  border-radius: 16px 16px 0 0;
  max-height: 70vh;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.picker-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.picker-close {
  font-size: 24px;
  color: #999;
}

.picker-content {
  display: flex;
  height: 300px;
}

.picker-column {
  flex: 1;
  overflow-y: auto;
}

.picker-item {
  padding: 16px;
  font-size: 14px;
  color: #333;
  text-align: center;
}

.picker-item.active {
  color: #ff6b35;
  background: #fff5f0;
}
</style>