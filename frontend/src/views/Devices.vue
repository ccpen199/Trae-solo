<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">设备管理</h1>
        <p class="text-gray-500">管理和监控所有能源设备</p>
      </div>
      <button 
        @click="showCreateModal = true"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>
        <span>添加设备</span>
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600">状态筛选:</span>
          <select 
            v-model="filters.status" 
            @change="fetchDevices"
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部</option>
            <option value="online">在线</option>
            <option value="offline">离线</option>
          </select>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600">设备类型:</span>
          <select 
            v-model="filters.device_type" 
            @change="fetchDevices"
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部</option>
            <option value="智能电表">智能电表</option>
            <option value="变压器">变压器</option>
            <option value="配电柜">配电柜</option>
            <option value="UPS">UPS电源</option>
          </select>
        </div>
        <div class="flex items-center space-x-2 ml-auto">
          <input 
            v-model="filters.search" 
            placeholder="搜索设备名称或编号..."
            @keyup.enter="fetchDevices"
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:ring-2 focus:ring-blue-500"
          />
          <button 
            @click="fetchDevices"
            class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            搜索
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设备信息</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">位置</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">额定功率</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最后在线</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="device in devices" :key="device.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div 
                  class="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                  :class="device.status === 'online' ? 'bg-green-100' : 'bg-gray-100'"
                >
                  <svg 
                    class="w-5 h-5" 
                    :class="device.status === 'online' ? 'text-green-600' : 'text-gray-400'"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
                  </svg>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-900">{{ device.device_name }}</div>
                  <div class="text-sm text-gray-500">{{ device.device_code }}</div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm text-gray-900">{{ device.device_type }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm text-gray-500">{{ device.location || '-' }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm text-gray-900">{{ device.rated_power ? device.rated_power + ' kW' : '-' }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span 
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="device.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
              >
                <span 
                  class="w-1.5 h-1.5 rounded-full mr-1.5"
                  :class="device.status === 'online' ? 'bg-green-500' : 'bg-gray-400'"
                ></span>
                {{ device.status === 'online' ? '在线' : '离线' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ device.last_online_at ? formatDateTime(device.last_online_at) : '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button 
                @click="goToDetail(device.id)"
                class="text-blue-600 hover:text-blue-900 mr-3"
              >
                详情
              </button>
              <button 
                @click="collectData(device.id)"
                class="text-green-600 hover:text-green-900 mr-3"
              >
                采集
              </button>
              <button 
                @click="toggleStatus(device)"
                class="text-indigo-600 hover:text-indigo-900"
              >
                {{ device.status === 'online' ? '下线' : '上线' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="devices.length === 0" class="py-12 text-center text-gray-500">
        <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
        </svg>
        <p class="text-lg font-medium">暂无设备数据</p>
        <p class="text-sm mt-1">点击上方按钮添加新设备</p>
      </div>
    </div>

    <div v-if="showCreateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg m-4">
        <div class="p-6 border-b border-gray-100">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-800">添加设备</h3>
            <button @click="showCreateModal = false" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
        
        <form @submit.prevent="createDevice" class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">设备编号 *</label>
              <input 
                v-model="newDevice.device_code"
                type="text"
                required
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">设备名称 *</label>
              <input 
                v-model="newDevice.device_name"
                type="text"
                required
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">设备类型 *</label>
              <select 
                v-model="newDevice.device_type"
                required
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="智能电表">智能电表</option>
                <option value="变压器">变压器</option>
                <option value="配电柜">配电柜</option>
                <option value="UPS">UPS电源</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">额定功率 (kW)</label>
              <input 
                v-model.number="newDevice.rated_power"
                type="number"
                step="0.01"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">安装位置</label>
            <input 
              v-model="newDevice.location"
              type="text"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">通信协议</label>
              <select 
                v-model="newDevice.protocol"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="Modbus-TCP">Modbus-TCP</option>
                <option value="Modbus-RTU">Modbus-RTU</option>
                <option value="DL/T645">DL/T645</option>
                <option value="MQTT">MQTT</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">IP地址</label>
              <input 
                v-model="newDevice.ip_address"
                type="text"
                placeholder="192.168.1.100"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div class="flex justify-end space-x-3 pt-4">
            <button 
              type="button"
              @click="showCreateModal = false"
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button 
              type="submit"
              :disabled="creating"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {{ creating ? '创建中...' : '创建' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../utils/api'
import dayjs from 'dayjs'

const router = useRouter()

const devices = ref([])
const filters = ref({
  status: '',
  device_type: '',
  search: ''
})

const showCreateModal = ref(false)
const creating = ref(false)
const newDevice = ref({
  device_code: '',
  device_name: '',
  device_type: '智能电表',
  rated_power: null,
  location: '',
  protocol: 'Modbus-TCP',
  ip_address: ''
})

const fetchDevices = async () => {
  try {
    const params = {}
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.device_type) params.device_type = filters.value.device_type
    
    const response = await api.get('/api/devices', { params })
    devices.value = response.data
  } catch (err) {
    console.error('获取设备列表失败:', err)
  }
}

const goToDetail = (id) => {
  router.push(`/devices/${id}`)
}

const formatDateTime = (datetime) => {
  if (!datetime) return '-'
  return dayjs(datetime).format('YYYY-MM-DD HH:mm')
}

const collectData = async (deviceId) => {
  try {
    const response = await api.post(`/api/devices/${deviceId}/collect`)
    if (response.data.success) {
      alert('数据采集成功！')
      fetchDevices()
    } else {
      alert('数据采集失败')
    }
  } catch (err) {
    console.error('采集数据失败:', err)
    alert('采集数据失败')
  }
}

const toggleStatus = async (device) => {
  const newStatus = device.status === 'online' ? 'offline' : 'online'
  const reason = device.status === 'online' ? '手动下线' : '手动上线'
  
  try {
    await api.put(`/api/devices/${device.id}/status`, null, {
      params: { new_status: newStatus, reason }
    })
    fetchDevices()
  } catch (err) {
    console.error('更新设备状态失败:', err)
  }
}

const createDevice = async () => {
  if (!newDevice.value.device_code || !newDevice.value.device_name) {
    alert('请填写设备编号和名称')
    return
  }
  
  creating.value = true
  try {
    await api.post('/api/devices', newDevice.value)
    showCreateModal.value = false
    newDevice.value = {
      device_code: '',
      device_name: '',
      device_type: '智能电表',
      rated_power: null,
      location: '',
      protocol: 'Modbus-TCP',
      ip_address: ''
    }
    fetchDevices()
  } catch (err) {
    console.error('创建设备失败:', err)
    alert(err.response?.data?.detail || '创建设备失败')
  } finally {
    creating.value = false
  }
}

onMounted(() => {
  fetchDevices()
})
</script>
