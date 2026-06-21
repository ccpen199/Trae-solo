<template>
  <div class="window-page">
    <van-nav-bar
      title="窗口资源调度"
      left-text="返回"
      left-arrow
      @click-left="onBack"
    />

    <div class="page-content">
      <van-empty v-if="!windowData.length" description="暂无调度数据" />

      <div
        v-for="item in windowData"
        :key="item.outlet_id"
        class="outlet-card card"
      >
        <div class="outlet-header" @click="toggleCollapse(item.outlet_id)">
          <div class="outlet-left">
            <div class="outlet-name">{{ item.outlet_name }}</div>
            <div class="outlet-district">{{ item.district }}</div>
          </div>
          <div class="outlet-right">
            <van-tag
              :type="loadTagType(item.load_level)"
              size="medium"
              round
            >
              {{ loadText(item.load_level) }}
            </van-tag>
            <van-icon
              :name="collapsedMap[item.outlet_id] ? 'arrow-down' : 'arrow-up'"
              class="collapse-icon"
            />
          </div>
        </div>

        <div v-show="!collapsedMap[item.outlet_id]" class="outlet-body">
          <div class="outlet-stats">
            <div class="stat">
              <span class="label">开放窗口</span>
              <span class="value">{{ item.open_windows }}/{{ item.total_windows }}</span>
            </div>
            <div class="stat">
              <span class="label">排队人数</span>
              <span class="value">{{ item.current_queue }}人</span>
            </div>
            <div class="stat">
              <span class="label">平均等待</span>
              <span class="value">{{ item.avg_wait_time }}分钟</span>
            </div>
          </div>

          <div class="section-title">窗口状态</div>
          <div class="window-grid">
            <div
              v-for="win in item.windows"
              :key="win.id"
              class="window-item"
              :class="windowClass(win)"
            >
              <div class="win-no">{{ win.window_no }}</div>
              <div class="win-type">{{ win.service_type }}</div>
              <div class="win-queue">{{ win.current_queue }}人</div>
              <div class="win-status">{{ win.is_open ? '营业中' : '已关闭' }}</div>
            </div>
          </div>

          <div class="section-title">调度操作</div>
          <div class="dispatch-section">
            <div class="suggestion">
              <van-icon name="info-o" color="#ff9800" />
              <span>建议开放 {{ item.suggested_windows }} 个窗口</span>
            </div>
            <div class="slider-row">
              <span class="slider-label">窗口数</span>
              <van-slider
                v-model="sliderMap[item.outlet_id]"
                :min="1"
                :max="item.total_windows"
                :step="1"
                bar-height="4px"
                active-color="#1976d2"
              />
              <span class="slider-value">{{ sliderMap[item.outlet_id] }}</span>
            </div>

            <div class="switch-grid">
              <div
                v-for="win in item.windows"
                :key="win.id"
                class="switch-item"
              >
                <span class="switch-label">{{ win.window_no }}</span>
                <van-switch
                  :model-value="switchMap[win.id]"
                  size="18px"
                  active-color="#43a047"
                  inactive-color="#ddd"
                  @update:model-value="val => onSwitchChange(win.id, val)"
                />
              </div>
            </div>

            <div v-if="dispatchResultMap[item.outlet_id]" class="result-panel">
              <div class="result-title">调度结果</div>
              <div class="result-msg">{{ dispatchResultMap[item.outlet_id] }}</div>
            </div>

            <van-button
              type="primary"
              size="small"
              block
              round
              :loading="dispatchingMap[item.outlet_id]"
              loading-text="调度中..."
              @click="dispatchWindows(item)"
            >
              确认调度
            </van-button>
          </div>
        </div>
      </div>

      <div class="bottom-space"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getWindowScheduling, dispatchWindow } from '../api/admin'

const router = useRouter()

const windowData = ref([])
const collapsedMap = reactive({})
const sliderMap = reactive({})
const switchMap = reactive({})
const dispatchResultMap = reactive({})
const dispatchingMap = reactive({})

function onBack() {
  router.back()
}

function loadText(level) {
  return level === 'high' ? '繁忙' : level === 'medium' ? '适中' : '空闲'
}

function loadTagType(level) {
  return level === 'high' ? 'danger' : level === 'medium' ? 'warning' : 'success'
}

function windowClass(win) {
  if (!win.is_open) return 'closed'
  if (win.current_queue > 5) return 'busy'
  return 'open'
}

function toggleCollapse(outletId) {
  collapsedMap[outletId] = !collapsedMap[outletId]
}

function onSwitchChange(winId, val) {
  switchMap[winId] = val
}

async function loadData() {
  try {
    const data = await getWindowScheduling()
    windowData.value = data || []
    windowData.value.forEach(item => {
      collapsedMap[item.outlet_id] = false
      sliderMap[item.outlet_id] = item.open_windows
      item.windows.forEach(win => {
        switchMap[win.id] = win.is_open
      })
    })
  } catch (e) {
    console.error(e)
  }
}

async function dispatchWindows(item) {
  dispatchingMap[item.outlet_id] = true
  try {
    const res = await dispatchWindow({
      outletId: item.outlet_id,
      windowCount: sliderMap[item.outlet_id]
    })
    dispatchResultMap[item.outlet_id] = res?.message || '调度成功'
    showToast('调度成功')
    await loadData()
  } catch (e) {
    dispatchResultMap[item.outlet_id] = '调度失败：' + (e.message || '未知错误')
    console.error(e)
  } finally {
    dispatchingMap[item.outlet_id] = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.window-page {
  min-height: 100vh;
  background: #f5f7fa;
}

:deep(.van-nav-bar) {
  position: sticky;
  top: 0;
  z-index: 10;
}

.page-content {
  padding: 12px;
  padding-bottom: 30px;
}

.card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
}

.outlet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.outlet-left {
  flex: 1;
  min-width: 0;
}

.outlet-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.outlet-district {
  font-size: 12px;
  color: #999;
}

.outlet-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.collapse-icon {
  color: #999;
  font-size: 16px;
  transition: transform 0.3s;
}

.outlet-body {
  margin-top: 14px;
}

.outlet-stats {
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
  margin-bottom: 14px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat {
  text-align: center;
}

.stat .label {
  font-size: 12px;
  color: #999;
  display: block;
  margin-bottom: 4px;
}

.stat .value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.window-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.window-item {
  padding: 10px 4px;
  border-radius: 8px;
  text-align: center;
  transition: all 0.2s;
}

.window-item.open {
  background: #e8f5e9;
}

.window-item.closed {
  background: #f5f5f5;
  opacity: 0.6;
}

.window-item.busy {
  background: #fff3e0;
}

.win-no {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.win-type {
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
}

.win-queue {
  font-size: 11px;
  color: #ff9800;
  margin-bottom: 2px;
}

.window-item.closed .win-queue {
  color: #999;
}

.win-status {
  font-size: 10px;
  color: #999;
}

.window-item.open .win-status {
  color: #43a047;
}

.dispatch-section {
  padding-top: 14px;
  border-top: 1px solid #f0f0f0;
}

.suggestion {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #ff9800;
  margin-bottom: 14px;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.slider-label {
  font-size: 13px;
  color: #666;
  flex-shrink: 0;
}

.slider-row :deep(.van-slider) {
  flex: 1;
}

.slider-value {
  font-size: 16px;
  font-weight: 600;
  color: #1976d2;
  min-width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.switch-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.switch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.switch-label {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.result-panel {
  background: #e3f2fd;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 14px;
}

.result-title {
  font-size: 13px;
  font-weight: 600;
  color: #1976d2;
  margin-bottom: 6px;
}

.result-msg {
  font-size: 13px;
  color: #333;
  line-height: 1.5;
}

.bottom-space {
  height: 10px;
}
</style>
