import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cityApi } from '../api'

export const useAppStore = defineStore('app', () => {
  const currentCity = ref(JSON.parse(localStorage.getItem('currentCity') || 'null'))
  const cities = ref([])
  const hotCities = ref([])
  const isInited = ref(false)

  async function initApp() {
    if (isInited.value) return
    
    try {
      const res = await cityApi.getCities()
      if (res.code === 0) {
        hotCities.value = res.data.hot_cities
        cities.value = res.data.all_cities
      }
      
      if (!currentCity.value) {
        const locateRes = await cityApi.locateByIp()
        if (locateRes.code === 0) {
          currentCity.value = locateRes.data
        } else {
          currentCity.value = hotCities.value[0] || cities.value[0]
        }
        saveCity()
      }
      
      isInited.value = true
    } catch (e) {
      console.error('初始化失败', e)
    }
  }

  function setCity(city) {
    currentCity.value = city
    saveCity()
  }

  function saveCity() {
    localStorage.setItem('currentCity', JSON.stringify(currentCity.value))
  }

  return {
    currentCity,
    cities,
    hotCities,
    isInited,
    initApp,
    setCity
  }
})
