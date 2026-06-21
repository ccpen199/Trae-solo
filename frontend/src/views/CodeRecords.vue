<template>
  <div class="records-page">
    <van-nav-bar
      title="亮码记录"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
    />
    <div class="filter-bar">
      <van-tabs v-model:active="activeTab" sticky offset-top="46" line-width="20px">
        <van-tab title="全部" name="all" />
        <van-tab title="今日" name="today" />
        <van-tab title="本周" name="week" />
        <van-tab title="本月" name="month" />
      </van-tabs>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-num">{{ stats.total || 0 }}</div>
        <div class="stat-label">总亮码次数</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">{{ stats.today || 0 }}</div>
        <div class="stat-label">今日亮码</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">{{ stats.locations || 0 }}</div>
        <div class="stat-label">使用网点</div>
      </div>
    </div>

    <van-empty v-if="list.length === 0" description="暂无亮码记录" />

    <div class="record-list" v-else>
      <div class="record-item" v-for="item in list" :key="item.id">
        <div class="record-icon" :class="'type-' + item.code_type">
          <van-icon :name="item.code_type === 'offline' ? 'download' : 'qr'" size="20" />
        </div>
        <div class="record-info">
          <div class="record-title">
            {{ item.code_type === 'dynamic' ? '动态身份码' : '离线身份码' }}
            <span class="type-tag" :class="'tag-' + item.code_type">
              {{ item.code_type === 'dynamic' ? '动态' : '离线' }}
            </span>
          </div>
          <div class="record-meta">
            <span>{{ formatTime(item.created_at) }}</span>
            <span v-if="item.scene_name">· {{ item.scene_name }}</span>
          </div>
          <div class="record-location" v-if="item.location">
            <van-icon name="location-o" size="11" /> {{ item.location }}
          </div>
        </div>
        <div class="record-status" :class="'status-' + item.status">
          {{ statusMap[item.status] }}
        </div>
      </div>
    </div>

    <div class="bottom-space"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeTab = ref('all')
const list = ref([])
const stats = ref({ total: 0, today: 0, locations: 0 })

const statusMap = { valid: '有效中', expired: '已过期', revoked: '已撤销', used: '已使用' }

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function loadData() {
  const mockAll = [
    { id: 1, code_type: 'dynamic', created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), scene_name: '政务服务大厅', location: '渝中区解放碑街道', status: 'used' },
    { id: 2, code_type: 'dynamic', created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), scene_name: '社保中心', location: '江北区观音桥', status: 'expired' },
    { id: 3, code_type: 'offline', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), scene_name: '医院就诊', location: '渝中区人民医院', status: 'valid' },
    { id: 4, code_type: 'dynamic', created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), scene_name: '公积金中心', location: '渝北区新牌坊', status: 'expired' },
    { id: 5, code_type: 'dynamic', created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), scene_name: '交通违法处理', location: '九龙坡区交巡警支队', status: 'used' },
    { id: 6, code_type: 'offline', created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), scene_name: '社区服务中心', location: '南岸区南坪街道', status: 'expired' }
  ]
  let data = mockAll
  const now = Date.now()
  if (activeTab.value === 'today') {
    data = mockAll.filter(i => now - new Date(i.created_at).getTime() < 24 * 3600 * 1000)
  } else if (activeTab.value === 'week') {
    data = mockAll.filter(i => now - new Date(i.created_at).getTime() < 7 * 24 * 3600 * 1000)
  } else if (activeTab.value === 'month') {
    data = mockAll.filter(i => now - new Date(i.created_at).getTime() < 30 * 24 * 3600 * 1000)
  }
  list.value = data
  stats.value = {
    total: mockAll.length,
    today: mockAll.filter(i => now - new Date(i.created_at).getTime() < 24 * 3600 * 1000).length,
    locations: new Set(mockAll.map(i => i.location)).size
  }
}

watch(activeTab, loadData)
onMounted(loadData)
</script>

<style scoped>
.records-page { min-height: 100vh; background: #f5f7fa; }
.filter-bar { background: #fff; }

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 12px;
}
.stat-card {
  background: #fff;
  padding: 14px 10px;
  border-radius: 12px;
  text-align: center;
}
.stat-num {
  font-size: 22px;
  font-weight: 700;
  color: #1976d2;
  margin-bottom: 4px;
}
.stat-label {
  font-size: 12px;
  color: #999;
}

.record-list {
  padding: 0 12px;
}
.record-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  padding: 14px;
  border-radius: 12px;
  margin-bottom: 10px;
}
.record-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.record-icon.type-dynamic { background: linear-gradient(135deg, #1e88e5, #1565c0); }
.record-icon.type-offline { background: linear-gradient(135deg, #43a047, #2e7d32); }

.record-info { flex: 1; min-width: 0; }
.record-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}
.type-tag {
  font-size: 10px;
  padding: 1px 8px;
  border-radius: 8px;
}
.tag-dynamic { background: #e3f2fd; color: #1976d2; }
.tag-offline { background: #e8f5e9; color: #43a047; }

.record-meta {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}
.record-location {
  font-size: 12px;
  color: #666;
  display: flex; align-items: center; gap: 4px;
}

.record-status {
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
}
.record-status.status-valid { color: #43a047; }
.record-status.status-expired { color: #999; }
.record-status.status-revoked { color: #e53935; }
.record-status.status-used { color: #1976d2; }

.bottom-space { height: 20px; }
</style>
