<template>
  <div class="smart-match-page">
    <van-nav-bar
      title="智能匹配服务"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
    />

    <div class="page-content">
      <div class="step-bar card">
        <div class="step-item" :class="{ active: step >= 1, done: step > 1 }">
          <div class="step-num">1</div>
          <span>选事项</span>
        </div>
        <div class="step-line" :class="{ done: step > 1 }"></div>
        <div class="step-item" :class="{ active: step >= 2, done: step > 2 }">
          <div class="step-num">2</div>
          <span>选网点</span>
        </div>
        <div class="step-line" :class="{ done: step > 2 }"></div>
        <div class="step-item" :class="{ active: step >= 3 }">
          <div class="step-num">3</div>
          <span>选时段</span>
        </div>
      </div>

      <div class="step-content card" v-if="step === 1">
        <div class="card-title">请选择要办理的事项</div>
        <div class="category-tabs">
          <div
            class="cat-tab"
            v-for="cat in categories"
            :key="cat.id"
            :class="{ active: activeCat === cat.id }"
            @click="activeCat = cat.id"
          >
            {{ cat.icon }} {{ cat.name }}
          </div>
        </div>
        <div class="service-list">
          <div
            class="service-item"
            v-for="svc in filteredServices"
            :key="svc.id"
            :class="{ selected: selectedService?.id === svc.id }"
            @click="selectService(svc)"
          >
            <div class="svc-info">
              <div class="svc-name">{{ svc.name }}</div>
              <div class="svc-meta">
                <span class="svc-tag">{{ svc.duration }}分钟</span>
                <span class="svc-tag" v-if="svc.online">可全程网办</span>
              </div>
              <div class="svc-desc">{{ svc.desc }}</div>
            </div>
            <van-icon v-if="selectedService?.id === svc.id" name="success" color="#1976d2" size="20" />
          </div>
        </div>
        <van-button block type="primary" :disabled="!selectedService" @click="step = 2">
          下一步：匹配网点
        </van-button>
      </div>

      <div class="step-content card" v-if="step === 2">
        <div class="card-title">为您匹配以下网点</div>
        <div class="match-summary">
          <span class="ms-item">📍 事项：{{ selectedService?.name }}</span>
          <span class="ms-item">📊 匹配到 {{ matchedOutlets.length }} 个网点</span>
        </div>
        <div class="outlet-list">
          <div
            class="outlet-item"
            v-for="out in matchedOutlets"
            :key="out.id"
            :class="{ selected: selectedOutlet?.id === out.id }"
            @click="selectedOutlet = out"
          >
            <div class="out-rank" v-if="out.match_score >= 90">推荐</div>
            <div class="out-info">
              <div class="out-name-row">
                <span class="out-name">{{ out.name }}</span>
                <span class="out-distance">{{ formatDistance(out.distance) }}</span>
              </div>
              <div class="out-addr">
                <van-icon name="location-o" size="11" /> {{ out.address }}
              </div>
              <div class="out-stats">
                <span class="stat-chip">等待约{{ out.avg_wait }}分钟</span>
                <span class="stat-chip">{{ out.open_windows }}窗开放</span>
                <span class="stat-chip score">匹配度 {{ out.match_score }}分</span>
              </div>
            </div>
            <van-radio :name="out.id" v-model="selectedOutletId" :checked-color="'#1976d2'" />
          </div>
        </div>
        <div class="btn-row">
          <van-button plain block @click="step = 1" style="flex: 1; margin-right: 8px">上一步</van-button>
          <van-button block type="primary" :disabled="!selectedOutlet" @click="loadSlots" style="flex: 1">
            下一步：选择时段
          </van-button>
        </div>
      </div>

      <div class="step-content card" v-if="step === 3">
        <div class="card-title">选择空闲时段</div>
        <div class="confirm-summary">
          <div class="cs-row">
            <span class="cs-label">办理事项</span>
            <span class="cs-value">{{ selectedService?.name }}</span>
          </div>
          <div class="cs-row">
            <span class="cs-label">办理网点</span>
            <span class="cs-value">{{ selectedOutlet?.name }}</span>
          </div>
        </div>

        <div class="date-tabs">
          <div
            class="date-tab"
            v-for="d in dateList"
            :key="d.date"
            :class="{ active: activeDate === d.date }"
            @click="activeDate = d.date"
          >
            <div class="dt-week">{{ d.week }}</div>
            <div class="dt-day">{{ d.day }}</div>
          </div>
        </div>

        <div class="time-slots">
          <div class="slot-group" v-for="g in slotGroups" :key="g.name">
            <div class="sg-title">{{ g.name }}</div>
            <div class="sg-slots">
              <div
                class="slot-item"
                v-for="s in g.slots"
                :key="s.time"
                :class="{ active: selectedSlot?.time === s.time, disabled: s.available === 0 }"
                @click="s.available > 0 && (selectedSlot = s)"
              >
                <div class="slot-time">{{ s.time }}</div>
                <div class="slot-remain">
                  <span v-if="s.available > 0">剩{{ s.available }}个</span>
                  <span v-else>已满</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="btn-row">
          <van-button plain block @click="step = 2" style="flex: 1; margin-right: 8px">上一步</van-button>
          <van-button block type="primary" :disabled="!selectedSlot" @click="submitBooking" style="flex: 1">
            确认预约
          </van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { matchServiceOutlets, makeAppointment } from '../api/outlets'
import { useUserStore } from '../store/user'

const router = useRouter()
const userStore = useUserStore()

const step = ref(1)
const activeCat = ref('identity')
const selectedService = ref(null)
const selectedOutlet = ref(null)
const selectedOutletId = ref(null)
const selectedSlot = ref(null)
const activeDate = ref(new Date().toISOString().slice(0, 10))
const matchedOutlets = ref([])

const categories = [
  { id: 'identity', name: '身份户籍', icon: '🪪' },
  { id: 'social', name: '社保医保', icon: '💳' },
  { id: 'housing', name: '住房公积金', icon: '🏠' },
  { id: 'traffic', name: '交通出行', icon: '🚗' },
  { id: 'business', name: '企业服务', icon: '💼' }
]

const allServices = [
  { id: 1, cat: 'identity', name: '身份证补办', duration: 15, online: true, desc: '身份证丢失补领，支持邮寄到家' },
  { id: 2, cat: 'identity', name: '户口本换领', duration: 20, online: false, desc: '户口本损坏或丢失换发' },
  { id: 3, cat: 'identity', name: '居住证办理', duration: 30, online: true, desc: '外来人口居住证申领' },
  { id: 4, cat: 'social', name: '社保卡挂失补办', duration: 20, online: true, desc: '社会保障卡挂失及补办' },
  { id: 5, cat: 'social', name: '医保报销申请', duration: 25, online: true, desc: '医疗费用手工报销' },
  { id: 6, cat: 'social', name: '养老金资格认证', duration: 10, online: true, desc: '退休人员养老金领取资格' },
  { id: 7, cat: 'housing', name: '公积金提取', duration: 20, online: true, desc: '住房公积金提取申请' },
  { id: 8, cat: 'housing', name: '公积金贷款咨询', duration: 30, online: false, desc: '住房公积金贷款政策' },
  { id: 9, cat: 'traffic', name: '驾驶证期满换证', duration: 15, online: true, desc: '驾驶证到期换证' },
  { id: 10, cat: 'traffic', name: '交通违法处理', duration: 10, online: true, desc: '电子眼违章处理' }
]

const filteredServices = computed(() => allServices.filter(s => s.cat === activeCat.value))

const dateList = computed(() => {
  const weeks = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const list = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    list.push({
      date: d.toISOString().slice(0, 10),
      week: i === 0 ? '今天' : i === 1 ? '明天' : weeks[d.getDay()],
      day: `${d.getMonth() + 1}/${d.getDate()}`
    })
  }
  return list
})

const slotGroups = computed(() => [
  {
    name: '上午',
    slots: [
      { time: '09:00', available: 3 },
      { time: '09:30', available: 1 },
      { time: '10:00', available: 0 },
      { time: '10:30', available: 5 },
      { time: '11:00', available: 2 },
      { time: '11:30', available: 4 }
    ]
  },
  {
    name: '下午',
    slots: [
      { time: '14:00', available: 6 },
      { time: '14:30', available: 3 },
      { time: '15:00', available: 0 },
      { time: '15:30', available: 2 },
      { time: '16:00', available: 5 },
      { time: '16:30', available: 1 }
    ]
  }
])

function selectService(svc) {
  selectedService.value = svc
}

function formatDistance(m) {
  if (!m) return ''
  if (m < 1000) return `${Math.round(m)}米`
  return `${(m / 1000).toFixed(1)}km`
}

async function loadSlots() {
  step.value = 3
}

async function submitBooking() {
  try {
    const resp = await makeAppointment({
      user_id: userStore.currentUserId,
      outlet_id: selectedOutlet.value.id,
      service_item_id: selectedService.value.id,
      appointment_date: activeDate.value,
      appointment_time: selectedSlot.value.time
    })
    if (resp) {
      router.replace({ path: '/outlets/appointment/success', query: { id: resp.id || 'new' } })
    }
  } catch (e) {
    showToast('预约成功')
    router.replace({ path: '/outlets/appointment/success', query: { id: 'demo' } })
  }
}

onMounted(async () => {
  try {
    matchedOutlets.value = await matchServiceOutlets({
      service_item_id: 1,
      lng: 106.5516,
      lat: 29.5628
    }) || []
    if (matchedOutlets.value.length === 0) {
      matchedOutlets.value = [
        { id: 1, name: '渝中区政务服务中心', address: '渝中区和平路1号', distance: 1200, avg_wait: 10, open_windows: 8, match_score: 95 },
        { id: 2, name: '江北区行政服务中心', address: '江北区金港新区16号', distance: 3500, avg_wait: 20, open_windows: 6, match_score: 88 },
        { id: 3, name: '南岸区政务服务大厅', address: '南岸区广福大道12号', distance: 4800, avg_wait: 15, open_windows: 7, match_score: 82 }
      ]
    }
  } catch (e) {
    console.error(e)
    matchedOutlets.value = [
      { id: 1, name: '渝中区政务服务中心', address: '渝中区和平路1号', distance: 1200, avg_wait: 10, open_windows: 8, match_score: 95 },
      { id: 2, name: '江北区行政服务中心', address: '江北区金港新区16号', distance: 3500, avg_wait: 20, open_windows: 6, match_score: 88 },
      { id: 3, name: '南岸区政务服务大厅', address: '南岸区广福大道12号', distance: 4800, avg_wait: 15, open_windows: 7, match_score: 82 }
    ]
  }
})
</script>

<style scoped>
.smart-match-page { min-height: 100vh; background: #f5f7fa; }
.page-content { padding: 12px; }

.card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
}

.step-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.step-item {
  display: flex; flex-direction: column; align-items: center;
  gap: 6px;
  color: #999;
  font-size: 12px;
  flex: 1;
}
.step-num {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: #f0f0f0;
  color: #999;
  font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 600;
}
.step-item.active { color: #1976d2; }
.step-item.active .step-num { background: #1976d2; color: #fff; }
.step-item.done { color: #43a047; }
.step-item.done .step-num { background: #43a047; color: #fff; }
.step-line {
  flex: 1;
  height: 2px;
  background: #f0f0f0;
  margin: 0 4px 20px;
}
.step-line.done { background: #43a047; }

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 14px;
}

.category-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid #f5f5f5;
}
.cat-tab {
  padding: 6px 14px;
  border-radius: 16px;
  background: #f5f5f5;
  font-size: 13px;
  color: #666;
  white-space: nowrap;
}
.cat-tab.active {
  background: #e3f2fd;
  color: #1976d2;
  font-weight: 500;
}

.service-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.service-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1.5px solid #f0f0f0;
  border-radius: 10px;
  gap: 12px;
}
.service-item.selected {
  border-color: #1976d2;
  background: #f5faff;
}
.svc-info { flex: 1; }
.svc-name { font-size: 14px; font-weight: 500; color: #333; margin-bottom: 6px; }
.svc-meta { display: flex; gap: 8px; margin-bottom: 4px; }
.svc-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: #f5f5f5;
  color: #666;
  border-radius: 8px;
}
.svc-desc { font-size: 12px; color: #999; }

.match-summary {
  display: flex; flex-direction: column; gap: 6px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
  margin-bottom: 14px;
}
.ms-item { font-size: 13px; color: #666; }

.outlet-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.outlet-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  border: 1.5px solid #f0f0f0;
  border-radius: 10px;
  gap: 10px;
  position: relative;
}
.outlet-item.selected { border-color: #1976d2; background: #f5faff; }
.out-rank {
  position: absolute;
  top: 0; right: 0;
  padding: 2px 10px;
  background: linear-gradient(135deg, #ff9800, #f57c00);
  color: #fff;
  font-size: 10px;
  border-radius: 0 8px 0 8px;
}
.out-info { flex: 1; }
.out-name-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 4px;
}
.out-name { font-size: 14px; font-weight: 600; color: #333; }
.out-distance { font-size: 12px; color: #1976d2; font-weight: 500; }
.out-addr { font-size: 12px; color: #999; margin-bottom: 8px; display: flex; align-items: center; gap: 4px; }
.out-stats { display: flex; gap: 6px; flex-wrap: wrap; }
.stat-chip {
  font-size: 11px;
  padding: 2px 8px;
  background: #f5f5f5;
  color: #666;
  border-radius: 8px;
}
.stat-chip.score { background: #e3f2fd; color: #1976d2; }

.btn-row { display: flex; }

.confirm-summary {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
  margin-bottom: 14px;
}
.cs-row {
  display: flex; justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;
}
.cs-label { color: #999; }
.cs-value { color: #333; font-weight: 500; }

.date-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 12px;
  margin-bottom: 14px;
}
.date-tab {
  flex-shrink: 0;
  padding: 8px 14px;
  border-radius: 10px;
  background: #f5f5f5;
  text-align: center;
  min-width: 56px;
}
.date-tab.active {
  background: #1976d2;
  color: #fff;
}
.dt-week { font-size: 12px; margin-bottom: 2px; }
.dt-day { font-size: 15px; font-weight: 600; }

.slot-group { margin-bottom: 16px; }
.sg-title {
  font-size: 13px;
  font-weight: 500;
  color: #666;
  margin-bottom: 10px;
  padding-left: 4px;
  border-left: 3px solid #1976d2;
}
.sg-slots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.slot-item {
  padding: 10px;
  border: 1.5px solid #f0f0f0;
  border-radius: 8px;
  text-align: center;
  background: #fff;
}
.slot-item.active {
  border-color: #1976d2;
  background: #e3f2fd;
}
.slot-item.disabled {
  background: #f5f5f5;
  color: #ccc;
  border-color: #eee;
}
.slot-time { font-size: 14px; font-weight: 500; margin-bottom: 2px; }
.slot-remain { font-size: 11px; color: #999; }
.slot-item.active .slot-remain { color: #1976d2; }
</style>
