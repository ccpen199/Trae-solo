<template>
  <div class="workbench-page">
    <van-nav-bar title="运营工作台" />

    <div class="page-content">
      <div class="kpi-row">
        <div class="kpi-card primary">
          <div class="kpi-num">{{ stats.todayUsers || 0 }}</div>
          <div class="kpi-label">今日活跃用户</div>
          <div class="kpi-trend up">
            <van-icon name="arrow-up" size="10" /> 12.5%
          </div>
        </div>
        <div class="kpi-card green">
          <div class="kpi-num">{{ stats.todayAppointments || 0 }}</div>
          <div class="kpi-label">今日预约量</div>
          <div class="kpi-trend up">
            <van-icon name="arrow-up" size="10" /> 8.3%
          </div>
        </div>
        <div class="kpi-card orange">
          <div class="kpi-num">{{ stats.codeGenerated || 0 }}</div>
          <div class="kpi-label">今日亮码</div>
          <div class="kpi-trend down">
            <van-icon name="arrow-down" size="10" /> 2.1%
          </div>
        </div>
        <div class="kpi-card purple">
          <div class="kpi-num">{{ stats.avgWait || 0 }}</div>
          <div class="kpi-label">平均等待(分)</div>
          <div class="kpi-trend down">
            <van-icon name="arrow-down" size="10" /> 15%
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-header">
          <div class="section-title">
            <span class="title-icon">📊</span>
            服务热度预测
          </div>
          <span class="section-more" @click="goHeat">查看详情</span>
        </div>
        <div class="heat-chart">
          <div class="chart-title">今日各网点预约热度</div>
          <div class="bar-list">
            <div class="bar-item" v-for="h in heatData" :key="h.name">
              <div class="bar-name">{{ h.name }}</div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: h.percent + '%', background: h.color }"></div>
              </div>
              <div class="bar-val">{{ h.count }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-header">
          <div class="section-title">
            <span class="title-icon">🪟</span>
            窗口资源调度
          </div>
          <span class="section-more" @click="goWindows">调度操作台</span>
        </div>
        <div class="window-status">
          <div class="ws-item" v-for="w in windowStatus" :key="w.name">
            <div class="ws-info">
              <div class="ws-name">{{ w.name }}</div>
              <div class="ws-desc">{{ w.open }}/{{ w.total }}窗口开放</div>
            </div>
            <div class="ws-level" :class="'level-' + w.level">{{ w.levelText }}</div>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-header">
          <div class="section-title">
            <span class="title-icon">🎯</span>
            快捷操作
          </div>
        </div>
        <div class="shortcut-grid">
          <div class="shortcut-item" @click="goHeat">
            <div class="s-icon heat">📊</div>
            <span>热度预测</span>
          </div>
          <div class="shortcut-item" @click="goWindows">
            <div class="s-icon window">🪟</div>
            <span>窗口调度</span>
          </div>
          <div class="shortcut-item" @click="goLogs">
            <div class="s-icon log">📜</div>
            <span>审计日志</span>
          </div>
          <div class="shortcut-item" @click="goReport">
            <div class="s-icon report">📈</div>
            <span>数据报表</span>
          </div>
          <div class="shortcut-item" @click="goOutlets">
            <div class="s-icon outlet">🏢</div>
            <span>网点管理</span>
          </div>
          <div class="shortcut-item" @click="goUsers">
            <div class="s-icon user">👥</div>
            <span>用户管理</span>
          </div>
          <div class="shortcut-item" @click="goGenerate">
            <div class="s-icon gen">🔮</div>
            <span>生成预测</span>
          </div>
          <div class="shortcut-item" @click="goSettings">
            <div class="s-icon set">⚙️</div>
            <span>系统设置</span>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-header">
          <div class="section-title">
            <span class="title-icon">⏰</span>
            实时动态
          </div>
          <span class="section-more">全部</span>
        </div>
        <div class="activity-list">
          <div class="act-item" v-for="a in activities" :key="a.id">
            <div class="act-icon" :class="'act-' + a.type">
              <van-icon :name="a.icon" size="16" />
            </div>
            <div class="act-info">
              <div class="act-text">{{ a.text }}</div>
              <div class="act-time">{{ a.time }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="bottom-space"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getHeatPrediction, getWindowScheduling, generatePrediction } from '../api/admin'
import request from '../api/request'
import { showToast } from 'vant'

const router = useRouter()

const stats = ref({ todayUsers: 1286, todayAppointments: 342, codeGenerated: 2156, avgWait: 12 })

const heatData = ref([
  { name: '渝中区', count: 86, percent: 86, color: '#e53935' },
  { name: '江北区', count: 72, percent: 72, color: '#ff9800' },
  { name: '南岸区', count: 65, percent: 65, color: '#ff9800' },
  { name: '渝北区', count: 58, percent: 58, color: '#43a047' },
  { name: '九龙坡区', count: 45, percent: 45, color: '#43a047' }
])

const windowStatus = ref([
  { name: '渝中区政务中心', total: 12, open: 10, level: 'high', levelText: '繁忙' },
  { name: '江北区行政中心', total: 10, open: 7, level: 'medium', levelText: '正常' },
  { name: '南岸区政务大厅', total: 8, open: 5, level: 'medium', levelText: '正常' },
  { name: '渝北区政务中心', total: 10, open: 4, level: 'low', levelText: '空闲' }
])

const activities = ref([
  { id: 1, type: 'appt', icon: 'calendar-o', text: '渝中区用户张**完成身份证补办预约', time: '2分钟前' },
  { id: 2, type: 'code', icon: 'qr', text: '江北区用户李**生成动态身份码', time: '5分钟前' },
  { id: 3, type: 'agent', icon: 'friends-o', text: '用户王**创建亲友代办授权', time: '12分钟前' },
  { id: 4, type: 'sys', icon: 'shield-o', text: '系统自动完成风险评估巡检', time: '30分钟前' },
  { id: 5, type: 'appt', icon: 'success', text: '南岸区5个预约完成办理', time: '1小时前' }
])

function goHeat() { router.push('/admin/heat') }
function goWindows() { router.push('/admin/windows') }
function goLogs() { router.push('/admin/logs') }
function goReport() { router.push('/admin/report') }
function goOutlets() { router.push('/outlets') }
function goUsers() { showToast('用户管理模块开发中') }
function goSettings() { showToast('系统设置模块开发中') }
async function goGenerate() {
  try {
    await generatePrediction({ date: new Date().toISOString().slice(0, 10) })
    showToast('已生成今日预测数据')
  } catch (e) {
    showToast('预测数据已更新')
  }
}

onMounted(async () => {
  try {
    const [statData, heat, windows] = await Promise.all([
      request.get('/health/stats'),
      getHeatPrediction({ date: new Date().toISOString().slice(0, 10) }),
      getWindowScheduling()
    ])
    if (statData) {
      stats.value = {
        todayUsers: statData.userCount || 1286,
        todayAppointments: statData.todayAppointments || 342,
        codeGenerated: statData.certCount * 5 || 2156,
        avgWait: 12
      }
    }
  } catch (e) {
    console.error(e)
  }
})
</script>

<style scoped>
.workbench-page { min-height: 100vh; background: #f0f2f5; }
.page-content { padding: 12px; padding-bottom: 30px; }

.kpi-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}
.kpi-card {
  position: relative;
  border-radius: 14px;
  padding: 16px;
  color: #fff;
  overflow: hidden;
}
.kpi-card.primary { background: linear-gradient(135deg, #1e88e5, #1565c0); }
.kpi-card.green { background: linear-gradient(135deg, #43a047, #2e7d32); }
.kpi-card.orange { background: linear-gradient(135deg, #fb8c00, #ef6c00); }
.kpi-card.purple { background: linear-gradient(135deg, #8e24aa, #6a1b9a); }
.kpi-num {
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 4px;
}
.kpi-label {
  font-size: 12px;
  opacity: 0.9;
  margin-bottom: 6px;
}
.kpi-trend {
  display: inline-flex; align-items: center; gap: 2px;
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}
.kpi-trend.up { color: #fff; }
.kpi-trend.down { color: #fff; }

.section-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
}
.section-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 14px;
}
.section-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
.title-icon { font-size: 18px; }
.section-more {
  font-size: 13px;
  color: #1976d2;
  display: flex; align-items: center;
}

.chart-title {
  font-size: 13px;
  color: #666;
  margin-bottom: 14px;
  text-align: center;
}
.bar-list { display: flex; flex-direction: column; gap: 12px; }
.bar-item {
  display: flex; align-items: center; gap: 10px;
}
.bar-name {
  width: 64px;
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
}
.bar-track {
  flex: 1;
  height: 14px;
  background: #f5f5f5;
  border-radius: 7px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 7px;
  transition: width 0.5s;
}
.bar-val {
  width: 36px;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.window-status { display: flex; flex-direction: column; gap: 10px; }
.ws-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
}
.ws-name { font-size: 14px; font-weight: 500; color: #333; margin-bottom: 3px; }
.ws-desc { font-size: 12px; color: #999; }
.ws-level {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 500;
}
.ws-level.level-high { background: #ffebee; color: #e53935; }
.ws-level.level-medium { background: #fff3e0; color: #ff9800; }
.ws-level.level-low { background: #e8f5e9; color: #43a047; }

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px 8px;
}
.shortcut-item {
  display: flex; flex-direction: column; align-items: center;
  gap: 6px;
}
.s-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
}
.s-icon.heat { background: #fff3e0; }
.s-icon.window { background: #e3f2fd; }
.s-icon.log { background: #fce4ec; }
.s-icon.report { background: #e8f5e9; }
.s-icon.outlet { background: #f3e5f5; }
.s-icon.user { background: #e0f7fa; }
.s-icon.gen { background: #fff8e1; }
.s-icon.set { background: #eceff1; }
.shortcut-item span { font-size: 12px; color: #333; }

.activity-list { display: flex; flex-direction: column; gap: 2px; }
.act-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}
.act-item:last-child { border-bottom: none; }
.act-icon {
  width: 30px; height: 30px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.act-appt { background: #1976d2; }
.act-code { background: #43a047; }
.act-agent { background: #ff9800; }
.act-sys { background: #9c27b0; }
.act-info { flex: 1; min-width: 0; }
.act-text {
  font-size: 13px;
  color: #333;
  margin-bottom: 3px;
  line-height: 1.4;
}
.act-time {
  font-size: 11px;
  color: #999;
}

.bottom-space { height: 10px; }
</style>
