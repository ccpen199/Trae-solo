<template>
  <div class="min-h-screen bg-neutral-900 text-white p-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white mb-1">服务健康监控</h1>
        <p class="text-neutral-400 text-sm">实时监控各委办局业务系统运行状态</p>
      </div>
      <div class="flex gap-2">
        <button @click="loadData" class="btn-secondary !bg-neutral-700 !text-white !border-neutral-600 hover:!bg-neutral-600 flex items-center gap-2">
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
          刷新
        </button>
        <button @click="activeAlertTab = 'rules'; alertDrawerVisible = true" class="btn-primary flex items-center gap-2">
          <Settings class="w-4 h-4" />
          告警规则
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div class="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl p-5 border border-neutral-800">
        <div class="flex items-center justify-between mb-2">
          <span class="text-neutral-400 text-sm">健康</span>
          <div class="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
        </div>
        <div class="text-3xl font-bold text-green-400">{{ statusCounts.healthy }}</div>
        <div class="text-xs text-neutral-500 mt-1">系统运行正常 <span class="text-green-400">↑1</span></div>
      </div>
      <div class="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-xl p-5 border border-neutral-800">
        <div class="flex items-center justify-between mb-2">
          <span class="text-neutral-400 text-sm">警告</span>
          <div class="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse"></div>
        </div>
        <div class="text-3xl font-bold text-yellow-400">{{ statusCounts.warning }}</div>
        <div class="text-xs text-neutral-500 mt-1">需要关注 <span class="text-yellow-400">→0</span></div>
      </div>
      <div class="bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-xl p-5 border border-neutral-800">
        <div class="flex items-center justify-between mb-2">
          <span class="text-neutral-400 text-sm">异常</span>
          <div class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
        </div>
        <div class="text-3xl font-bold text-red-400">{{ statusCounts.critical }}</div>
        <div class="text-xs text-neutral-500 mt-1">需立即处理 <span class="text-red-400">↑1</span></div>
      </div>
      <div class="bg-gradient-to-br from-neutral-500/10 to-neutral-600/5 rounded-xl p-5 border border-neutral-800">
        <div class="flex items-center justify-between mb-2">
          <span class="text-neutral-400 text-sm">离线</span>
          <div class="w-2.5 h-2.5 rounded-full bg-neutral-500"></div>
        </div>
        <div class="text-3xl font-bold text-neutral-400">{{ statusCounts.offline }}</div>
        <div class="text-xs text-neutral-500 mt-1">服务暂停 <span class="text-neutral-400">→0</span></div>
      </div>
      <div class="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-5 border border-neutral-800 col-span-2 md:col-span-1">
        <div class="flex items-center justify-between mb-2">
          <span class="text-neutral-400 text-sm">整体可用性</span>
          <Activity class="w-4 h-4 text-blue-400" />
        </div>
        <div class="text-3xl font-bold text-blue-400">{{ overallAvailability }}%</div>
        <div ref="availabilityChartRef" class="h-10 mt-2"></div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <div class="lg:col-span-2 bg-neutral-800/50 rounded-xl p-5 border border-neutral-800">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-white font-semibold flex items-center gap-2">
            <Activity class="w-4 h-4 text-blue-400" />
            平均响应时间趋势
          </h3>
          <el-radio-group v-model="responseChartType" size="small">
            <el-radio-button label="line">折线图</el-radio-button>
            <el-radio-button label="bar">柱状图</el-radio-button>
          </el-radio-group>
        </div>
        <div ref="responseChartRef" class="h-64"></div>
      </div>
      <div class="bg-neutral-800/50 rounded-xl p-5 border border-neutral-800">
        <h3 class="text-white font-semibold flex items-center gap-2 mb-4">
          <PieChart class="w-4 h-4 text-purple-400" />
          错误率统计
        </h3>
        <div ref="errorChartRef" class="h-64"></div>
      </div>
    </div>

    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-white font-semibold flex items-center gap-2">
          <Server class="w-4 h-4 text-cyan-400" />
          委办局系统监控
        </h3>
        <div class="flex gap-2">
          <el-select v-model="statusFilter" placeholder="全部状态" clearable size="small" class="!w-28">
            <el-option label="健康" value="healthy" />
            <el-option label="警告" value="warning" />
            <el-option label="异常" value="critical" />
            <el-option label="离线" value="offline" />
          </el-select>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div v-for="monitor in filteredMonitors" :key="monitor.id"
             class="bg-neutral-800/50 rounded-xl border border-neutral-800 p-5 hover:border-neutral-600 transition-all group cursor-pointer"
             @click="showMonitorDetail(monitor)">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center"
                   :class="getStatusBgClass(monitor.status)">
                <Server class="w-5 h-5" :class="getStatusIconClass(monitor.status)" />
              </div>
              <div>
                <h4 class="text-white font-medium text-sm">{{ monitor.name }}</h4>
                <p class="text-xs text-neutral-500">{{ monitor.departmentName?.replace('抚州市', '').replace('国家税务总局', '') }}</p>
              </div>
            </div>
            <div class="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5" :class="getStatusDotClass(monitor.status)"></div>
          </div>

          <div class="grid grid-cols-3 gap-2 mb-3">
            <div>
              <div class="text-xs text-neutral-500 mb-0.5">今日请求</div>
              <div class="text-sm font-bold text-white">{{ formatNumber(monitor.totalRequests) }}</div>
            </div>
            <div>
              <div class="text-xs text-neutral-500 mb-0.5">平均响应</div>
              <div class="text-sm font-bold" :class="monitor.avgResponseTime < 300 ? 'text-green-400' : monitor.avgResponseTime < 800 ? 'text-yellow-400' : 'text-red-400'">
                {{ monitor.avgResponseTime }}<span class="text-xs font-normal text-neutral-500 ml-0.5">ms</span>
              </div>
            </div>
            <div>
              <div class="text-xs text-neutral-500 mb-0.5">错误率</div>
              <div class="text-sm font-bold" :class="monitor.errorRate < 0.5 ? 'text-green-400' : monitor.errorRate < 3 ? 'text-yellow-400' : 'text-red-400'">
                {{ monitor.errorRate }}%
              </div>
            </div>
          </div>

          <div ref="miniChartRefs" :data-id="monitor.id" class="h-12 mb-3"></div>

          <div class="flex items-center justify-between text-xs text-neutral-500">
            <span class="flex items-center gap-1">
              <Clock class="w-3 h-3" />
              {{ monitor.lastCheckTime.slice(11) }}
            </span>
            <span v-if="monitor.alerts && monitor.alerts.length > 0" class="flex items-center gap-1">
              <span class="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {{ monitor.alerts.length }}
              </span>
              <span class="text-red-400">告警</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-neutral-800/50 rounded-xl border border-neutral-800 overflow-hidden">
      <div class="p-5 border-b border-neutral-800">
        <h3 class="text-white font-semibold flex items-center gap-2 mb-4">
          <AlertTriangle class="w-4 h-4 text-red-400" />
          告警管理
        </h3>
        <el-tabs v-model="activeAlertTab" class="alert-tabs">
          <el-tab-pane label="实时告警" name="realtime">
            <div class="pt-4">
              <div class="flex gap-2 mb-4">
                <el-select v-model="alertLevelFilter" placeholder="全部级别" clearable size="small" class="!w-28">
                  <el-option label="严重" value="critical" />
                  <el-option label="警告" value="warning" />
                  <el-option label="信息" value="info" />
                </el-select>
              </div>
              <el-table :data="realtimeAlerts" class="!bg-transparent"
                :header-cell-style="{ background: 'transparent', color: '#9CA3AF', borderBottom: '1px solid #374151' }"
                :cell-style="{ background: 'transparent', color: '#D1D5DB', borderBottom: '1px solid #374151' }">
                <el-table-column label="级别" width="90">
                  <template #default="{ row }">
                    <span class="text-xs px-2 py-0.5 rounded-full"
                      :class="row.level === 'critical' ? 'bg-red-500/15 text-red-400' : row.level === 'warning' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-blue-500/15 text-blue-400'">
                      {{ row.level === 'critical' ? '严重' : row.level === 'warning' ? '警告' : '信息' }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="title" label="告警标题" min-width="200" />
                <el-table-column prop="monitorName" label="所属系统" width="150" />
                <el-table-column prop="message" label="详情" min-width="260" show-overflow-tooltip />
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <span class="text-xs px-2 py-0.5 rounded-full"
                      :class="row.status === 'resolved' ? 'bg-green-500/15 text-green-400' : row.status === 'acknowledged' ? 'bg-blue-500/15 text-blue-400' : 'bg-yellow-500/15 text-yellow-400'">
                      {{ row.status === 'resolved' ? '已解决' : row.status === 'acknowledged' ? '处理中' : '未处理' }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="createTime" label="发生时间" width="160" />
                <el-table-column label="操作" width="160" fixed="right">
                  <template #default="{ row }">
                    <div class="flex gap-1">
                      <button v-if="row.status === 'active'" class="px-2.5 py-1 text-xs text-blue-400 hover:bg-blue-500/10 rounded" @click="acknowledgeAlert(row)">
                        确认
                      </button>
                      <button v-if="row.status !== 'resolved'" class="px-2.5 py-1 text-xs text-green-400 hover:bg-green-500/10 rounded" @click="resolveAlert(row)">
                        解决
                      </button>
                      <button class="px-2.5 py-1 text-xs text-neutral-400 hover:bg-neutral-500/10 rounded">
                        详情
                      </button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>
          <el-tab-pane label="告警历史" name="history">
            <div class="pt-4">
              <el-table :data="allAlerts" class="!bg-transparent"
                :header-cell-style="{ background: 'transparent', color: '#9CA3AF', borderBottom: '1px solid #374151' }"
                :cell-style="{ background: 'transparent', color: '#D1D5DB', borderBottom: '1px solid #374151' }">
                <el-table-column label="级别" width="90">
                  <template #default="{ row }">
                    <span class="text-xs px-2 py-0.5 rounded-full"
                      :class="row.level === 'critical' ? 'bg-red-500/15 text-red-400' : row.level === 'warning' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-blue-500/15 text-blue-400'">
                      {{ row.level === 'critical' ? '严重' : row.level === 'warning' ? '警告' : '信息' }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="title" label="告警标题" min-width="200" />
                <el-table-column prop="monitorName" label="所属系统" width="150" />
                <el-table-column prop="message" label="详情" min-width="260" show-overflow-tooltip />
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <span class="text-xs px-2 py-0.5 rounded-full"
                      :class="row.status === 'resolved' ? 'bg-green-500/15 text-green-400' : row.status === 'acknowledged' ? 'bg-blue-500/15 text-blue-400' : 'bg-yellow-500/15 text-yellow-400'">
                      {{ row.status === 'resolved' ? '已解决' : row.status === 'acknowledged' ? '处理中' : '未处理' }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="createTime" label="发生时间" width="160" />
                <el-table-column prop="resolveTime" label="解决时间" width="160" />
                <el-table-column prop="resolver" label="处理人" width="100" />
              </el-table>
            </div>
          </el-tab-pane>
          <el-tab-pane label="告警规则" name="rules">
            <div class="pt-4">
              <el-table :data="alertRules" class="!bg-transparent"
                :header-cell-style="{ background: 'transparent', color: '#9CA3AF', borderBottom: '1px solid #374151' }"
                :cell-style="{ background: 'transparent', color: '#D1D5DB', borderBottom: '1px solid #374151' }">
                <el-table-column prop="monitorName" label="系统名称" min-width="200" />
                <el-table-column label="响应时间阈值" width="180">
                  <template #default="{ row }">
                    <span class="text-sm">
                      <span class="text-yellow-400">警告 {{ row.responseTimeWarning }}ms</span>
                      <span class="text-neutral-500 mx-1">/</span>
                      <span class="text-red-400">严重 {{ row.responseTimeCritical }}ms</span>
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="错误率阈值" width="160">
                  <template #default="{ row }">
                    <span class="text-sm">
                      <span class="text-yellow-400">{{ row.errorRateWarning }}%</span>
                      <span class="text-neutral-500 mx-1">/</span>
                      <span class="text-red-400">{{ row.errorRateCritical }}%</span>
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="可用性阈值" width="160">
                  <template #default="{ row }">
                    <span class="text-sm">
                      <span class="text-yellow-400">{{ row.availabilityWarning }}%</span>
                      <span class="text-neutral-500 mx-1">/</span>
                      <span class="text-red-400">{{ row.availabilityCritical }}%</span>
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="通知方式" width="140">
                  <template #default="{ row }">
                    <div class="flex gap-2">
                      <span v-if="row.notifySms" class="text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-400">短信</span>
                      <span v-if="row.notifyEmail" class="text-xs px-2 py-0.5 rounded bg-green-500/15 text-green-400">邮件</span>
                      <span v-if="row.notifySite" class="text-xs px-2 py-0.5 rounded bg-purple-500/15 text-purple-400">站内</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="120" fixed="right">
                  <template #default="{ row }">
                    <button @click="editAlertRule(row)" class="px-2.5 py-1 text-xs text-blue-400 hover:bg-blue-500/10 rounded">
                      编辑
                    </button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <el-drawer v-model="detailDrawerVisible" title="系统详情" size="720px" direction="rtl" class="!bg-neutral-900">
      <div v-if="selectedMonitor" class="text-white">
        <div class="mb-6 pb-5 border-b border-neutral-800">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-14 h-14 rounded-xl flex items-center justify-center" :class="getStatusBgClass(selectedMonitor.status)">
              <Server class="w-7 h-7" :class="getStatusIconClass(selectedMonitor.status)" />
            </div>
            <div class="flex-1">
              <h2 class="text-xl font-bold text-white">{{ selectedMonitor.name }}</h2>
              <p class="text-sm text-neutral-400">{{ selectedMonitor.departmentName }}</p>
            </div>
            <span class="text-sm px-3 py-1 rounded-full" :class="getStatusDotClass(selectedMonitor.status) + ' text-white'">
              {{ getStatusLabel(selectedMonitor.status) }}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="flex justify-between">
              <span class="text-neutral-500">负责人</span>
              <span class="text-neutral-300">{{ monitorDetail?.manager || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-500">联系电话</span>
              <span class="text-neutral-300">{{ monitorDetail?.managerPhone || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-500">上线时间</span>
              <span class="text-neutral-300">{{ monitorDetail?.launchTime || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-500">服务器地址</span>
              <span class="text-neutral-300 font-mono text-xs">{{ monitorDetail?.serverAddress || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
            <Activity class="w-4 h-4 text-cyan-400" />
            实时指标
          </h3>
          <div class="grid grid-cols-4 gap-4">
            <div class="bg-neutral-800/50 rounded-xl p-4 text-center">
              <div ref="cpuGaugeRef" class="w-24 h-24 mx-auto"></div>
              <div class="text-sm text-neutral-400 mt-2">CPU使用率</div>
            </div>
            <div class="bg-neutral-800/50 rounded-xl p-4 text-center">
              <div ref="memoryGaugeRef" class="w-24 h-24 mx-auto"></div>
              <div class="text-sm text-neutral-400 mt-2">内存使用率</div>
            </div>
            <div class="bg-neutral-800/50 rounded-xl p-4 text-center">
              <div ref="diskGaugeRef" class="w-24 h-24 mx-auto"></div>
              <div class="text-sm text-neutral-400 mt-2">磁盘使用率</div>
            </div>
            <div class="bg-neutral-800/50 rounded-xl p-4 text-center">
              <div class="w-24 h-24 mx-auto flex flex-col items-center justify-center">
                <div class="text-2xl font-bold text-blue-400">{{ monitorDetail?.metrics?.networkIn || 0 }}</div>
                <div class="text-xs text-neutral-500">KB/s 入</div>
                <div class="text-lg font-bold text-green-400 mt-1">{{ monitorDetail?.metrics?.networkOut || 0 }}</div>
                <div class="text-xs text-neutral-500">KB/s 出</div>
              </div>
              <div class="text-sm text-neutral-400 mt-2">网络IO</div>
            </div>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
            <TrendingUp class="w-4 h-4 text-purple-400" />
            性能趋势（近7天）
          </h3>
          <div ref="performanceTrendRef" class="h-56 bg-neutral-800/50 rounded-xl p-4"></div>
        </div>

        <div class="mb-6">
          <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
            <BarChart3 class="w-4 h-4 text-orange-400" />
            错误统计
          </h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-neutral-800/50 rounded-xl p-4">
              <h4 class="text-sm text-neutral-400 mb-3">错误率趋势</h4>
              <div ref="errorTrendRef" class="h-36"></div>
            </div>
            <div class="bg-neutral-800/50 rounded-xl p-4">
              <h4 class="text-sm text-neutral-400 mb-3">Top5 错误接口</h4>
              <div class="space-y-3">
                <div v-for="(err, idx) in monitorDetail?.topErrors?.slice(0, 5) || []" :key="idx">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm text-neutral-300">{{ err.endpoint }}</span>
                    <span class="text-xs text-red-400">{{ err.count }}次 / {{ err.rate.toFixed(1) }}%</span>
                  </div>
                  <div class="h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                    <div class="h-full bg-red-500 rounded-full" :style="{ width: (err.rate / 5 * 100) + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
            <List class="w-4 h-4 text-green-400" />
            接口列表
          </h3>
          <div class="bg-neutral-800/50 rounded-xl overflow-hidden">
            <el-table :data="monitorDetail?.endpoints || []" size="small" class="!bg-transparent"
              :header-cell-style="{ background: 'transparent', color: '#9CA3AF', borderBottom: '1px solid #374151' }"
              :cell-style="{ background: 'transparent', color: '#D1D5DB', borderBottom: '1px solid #374151' }">
              <el-table-column prop="name" label="接口名称" min-width="120" />
              <el-table-column prop="method" label="方法" width="70">
                <template #default="{ row }">
                  <span class="text-xs px-1.5 py-0.5 rounded" :class="row.method === 'GET' ? 'bg-green-500/15 text-green-400' : 'bg-blue-500/15 text-blue-400'">
                    {{ row.method }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="callCount" label="调用量" width="90" align="right" sortable />
              <el-table-column label="成功率" width="90" align="right" sortable :sort-by="(a: any, b: any) => a.successRate - b.successRate">
                <template #default="{ row }">
                  <span :class="row.successRate >= 99 ? 'text-green-400' : row.successRate >= 95 ? 'text-yellow-400' : 'text-red-400'">
                    {{ row.successRate }}%
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="avgResponseTime" label="平均响应" width="90" align="right" sortable>
                <template #default="{ row }">
                  {{ row.avgResponseTime }}ms
                </template>
              </el-table-column>
              <el-table-column prop="p99ResponseTime" label="P99" width="80" align="right">
                <template #default="{ row }">
                  {{ row.p99ResponseTime }}ms
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
            <Bell class="w-4 h-4 text-red-400" />
            告警历史
          </h3>
          <div class="space-y-3">
            <div v-for="alert in monitorDetail?.alertHistory?.slice(0, 5) || []" :key="alert.id"
                 class="p-3 rounded-lg bg-neutral-800/50 border-l-4"
                 :class="alert.level === 'critical' ? 'border-red-500' : alert.level === 'warning' ? 'border-yellow-500' : 'border-blue-500'">
              <div class="flex items-start justify-between mb-1">
                <span class="text-sm font-medium" :class="alert.level === 'critical' ? 'text-red-400' : alert.level === 'warning' ? 'text-yellow-400' : 'text-blue-400'">
                  {{ alert.title }}
                </span>
                <span class="text-xs px-1.5 py-0.5 rounded"
                  :class="alert.status === 'resolved' ? 'bg-green-500/15 text-green-400' : alert.status === 'acknowledged' ? 'bg-blue-500/15 text-blue-400' : 'bg-yellow-500/15 text-yellow-400'">
                  {{ alert.status === 'resolved' ? '已解决' : alert.status === 'acknowledged' ? '处理中' : '未处理' }}
                </span>
              </div>
              <p class="text-xs text-neutral-400 mb-1">{{ alert.message }}</p>
              <p class="text-xs text-neutral-500">{{ alert.createTime }}</p>
            </div>
          </div>
        </div>

        <div class="flex gap-3 pt-4 border-t border-neutral-800">
          <button class="btn-primary flex-1 flex items-center justify-center gap-2">
            <Eye class="w-4 h-4" />
            查看详情
          </button>
          <button @click="activeAlertTab = 'rules'; detailDrawerVisible = false; alertDrawerVisible = true" class="btn-secondary !bg-neutral-700 !text-white !border-neutral-600 hover:!bg-neutral-600 flex-1 flex items-center justify-center gap-2">
            <Settings class="w-4 h-4" />
            设置告警阈值
          </button>
          <button class="btn-secondary !bg-neutral-700 !text-white !border-neutral-600 hover:!bg-neutral-600 flex-1 flex items-center justify-center gap-2">
            <RefreshCw class="w-4 h-4" />
            手动检测
          </button>
        </div>
      </div>
    </el-drawer>

    <el-drawer v-model="alertDrawerVisible" title="告警规则配置" size="560px" direction="rtl" class="!bg-neutral-900">
      <div class="space-y-4 text-white">
        <div class="mb-4">
          <label class="text-sm text-neutral-400 block mb-2">选择系统</label>
          <el-select v-model="selectedRuleMonitorId" placeholder="请选择系统" class="!w-full">
            <el-option v-for="m in monitorList" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
        </div>
        <div class="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
          <div class="flex items-center justify-between mb-3">
            <span class="text-white font-medium">响应时间阈值</span>
            <el-switch v-model="currentRule.responseEnabled" size="small" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs text-neutral-400 block mb-1.5">警告阈值 (ms)</label>
              <el-input-number v-model="currentRule.responseTimeWarning" :min="100" size="small" class="!w-full" />
            </div>
            <div>
              <label class="text-xs text-neutral-400 block mb-1.5">严重阈值 (ms)</label>
              <el-input-number v-model="currentRule.responseTimeCritical" :min="200" size="small" class="!w-full" />
            </div>
          </div>
        </div>
        <div class="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
          <div class="flex items-center justify-between mb-3">
            <span class="text-white font-medium">可用性阈值</span>
            <el-switch v-model="currentRule.availabilityEnabled" size="small" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs text-neutral-400 block mb-1.5">警告阈值 (%)</label>
              <el-input-number v-model="currentRule.availabilityWarning" :min="50" :max="100" size="small" class="!w-full" />
            </div>
            <div>
              <label class="text-xs text-neutral-400 block mb-1.5">严重阈值 (%)</label>
              <el-input-number v-model="currentRule.availabilityCritical" :min="30" :max="100" size="small" class="!w-full" />
            </div>
          </div>
        </div>
        <div class="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
          <div class="flex items-center justify-between mb-3">
            <span class="text-white font-medium">错误率阈值</span>
            <el-switch v-model="currentRule.errorRateEnabled" size="small" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs text-neutral-400 block mb-1.5">警告阈值 (%)</label>
              <el-input-number v-model="currentRule.errorRateWarning" :min="0" :max="100" :step="0.1" size="small" class="!w-full" />
            </div>
            <div>
              <label class="text-xs text-neutral-400 block mb-1.5">严重阈值 (%)</label>
              <el-input-number v-model="currentRule.errorRateCritical" :min="0" :max="100" :step="0.1" size="small" class="!w-full" />
            </div>
          </div>
        </div>
        <div class="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
          <div class="text-white font-medium mb-3">通知方式</div>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <el-checkbox v-model="currentRule.notifySms" />
              <span class="text-sm text-neutral-300">短信通知</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <el-checkbox v-model="currentRule.notifyEmail" />
              <span class="text-sm text-neutral-300">邮件通知</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <el-checkbox v-model="currentRule.notifySite" />
              <span class="text-sm text-neutral-300">站内通知</span>
            </label>
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-4">
          <button @click="alertDrawerVisible = false" class="btn-secondary !bg-neutral-700 !text-white !border-neutral-600 hover:!bg-neutral-600">取消</button>
          <button @click="saveAlertRules" class="btn-primary">保存规则</button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import {
  RefreshCw, Settings, Activity, PieChart, Server, Clock, AlertTriangle,
  TrendingUp, BarChart3, List, Bell, Eye
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import { getMonitorList, getMonitorAlerts } from '@/api/admin'
import { mockMonitorDetails, mockAlertRules } from '@/mock/data/monitors'
import type { ServiceMonitor, MonitorStatus, MonitorAlert, MonitorDetail, AlertRule } from '@/types'

const loading = ref(false)
const monitorList = ref<ServiceMonitor[]>([])
const allAlerts = ref<any[]>([])
const alertRules = ref<AlertRule[]>([])
const statusFilter = ref('')
const alertLevelFilter = ref('')
const activeAlertTab = ref('realtime')
const responseChartType = ref<'line' | 'bar'>('line')
const responseChartRef = ref<HTMLElement>()
const errorChartRef = ref<HTMLElement>()
const availabilityChartRef = ref<HTMLElement>()
const miniChartRefs = ref<HTMLElement[]>([])

const detailDrawerVisible = ref(false)
const alertDrawerVisible = ref(false)
const selectedMonitor = ref<ServiceMonitor | null>(null)
const monitorDetail = ref<MonitorDetail | null>(null)

const selectedRuleMonitorId = ref('')
const currentRule = reactive({
  responseEnabled: true,
  responseTimeWarning: 500,
  responseTimeCritical: 1000,
  availabilityEnabled: true,
  availabilityWarning: 97,
  availabilityCritical: 90,
  errorRateEnabled: true,
  errorRateWarning: 1,
  errorRateCritical: 5,
  notifySms: true,
  notifyEmail: true,
  notifySite: true
})

const cpuGaugeRef = ref<HTMLElement>()
const memoryGaugeRef = ref<HTMLElement>()
const diskGaugeRef = ref<HTMLElement>()
const performanceTrendRef = ref<HTMLElement>()
const errorTrendRef = ref<HTMLElement>()

const statusCounts = computed(() => {
  const counts = { healthy: 0, warning: 0, critical: 0, offline: 0 }
  monitorList.value.forEach(m => {
    if (counts[m.status as keyof typeof counts] !== undefined) counts[m.status as keyof typeof counts]++
  })
  return counts
})

const overallAvailability = computed(() => {
  if (monitorList.value.length === 0) return 99.92
  const total = monitorList.value.reduce((sum, m) => sum + m.availability, 0)
  return (total / monitorList.value.length).toFixed(2)
})

const filteredMonitors = computed(() => {
  if (!statusFilter.value) return monitorList.value
  return monitorList.value.filter(m => m.status === statusFilter.value)
})

const realtimeAlerts = computed(() => {
  let list = allAlerts.value.filter(a => a.status !== 'resolved')
  if (alertLevelFilter.value) list = list.filter(a => a.level === alertLevelFilter.value)
  return list
})

const getStatusDotClass = (status: MonitorStatus) => {
  const map: Record<MonitorStatus, string> = {
    healthy: 'bg-green-500 animate-pulse',
    warning: 'bg-yellow-500 animate-pulse',
    critical: 'bg-red-500 animate-pulse',
    offline: 'bg-neutral-500'
  }
  return map[status] || map.offline
}

const getStatusBgClass = (status: MonitorStatus) => {
  const map: Record<MonitorStatus, string> = {
    healthy: 'bg-green-500/15',
    warning: 'bg-yellow-500/15',
    critical: 'bg-red-500/15',
    offline: 'bg-neutral-500/15'
  }
  return map[status] || map.offline
}

const getStatusIconClass = (status: MonitorStatus) => {
  const map: Record<MonitorStatus, string> = {
    healthy: 'text-green-400',
    warning: 'text-yellow-400',
    critical: 'text-red-400',
    offline: 'text-neutral-400'
  }
  return map[status] || map.offline
}

const getStatusLabel = (status: MonitorStatus) => {
  const map: Record<MonitorStatus, string> = {
    healthy: '健康',
    warning: '警告',
    critical: '异常',
    offline: '离线'
  }
  return map[status] || '未知'
}

const formatNumber = (num: number) => {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  return num.toLocaleString()
}

const baseTooltip = {
  backgroundColor: 'rgba(26, 31, 41, 0.95)',
  borderColor: '#374151',
  textStyle: { color: '#fff' }
}

const initResponseChart = () => {
  if (!responseChartRef.value) return
  const chart = echarts.init(responseChartRef.value)
  const dates = Array.from({ length: 12 }, (_, i) => `${i * 5}分钟前`).reverse()
  chart.setOption({
    tooltip: { trigger: 'axis', ...baseTooltip },
    legend: { data: ['社保系统', '医保系统', '公积金系统'], textStyle: { color: '#9CA3AF' }, right: 0, top: 0 },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: '#374151' } }, axisLabel: { color: '#6B7280', fontSize: 11 } },
    yAxis: { type: 'value', name: 'ms', nameTextStyle: { color: '#6B7280' }, axisLine: { show: false },
      splitLine: { lineStyle: { color: '#374151', type: 'dashed' } }, axisLabel: { color: '#6B7280', fontSize: 11 } },
    series: [
      { name: '社保系统', type: responseChartType.value, smooth: true, symbol: responseChartType.value === 'line' ? 'none' : 'emptyCircle',
        data: dates.map(() => Math.floor(Math.random() * 150 + 80)),
        itemStyle: { color: '#3B82F6' }, lineStyle: { width: 2 }, areaStyle: responseChartType.value === 'line' ? {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' }, { offset: 1, color: 'rgba(59, 130, 246, 0.02)' }
          ])
        } : undefined },
      { name: '医保系统', type: responseChartType.value, smooth: true, symbol: responseChartType.value === 'line' ? 'none' : 'emptyCircle',
        data: dates.map(() => Math.floor(Math.random() * 150 + 100)),
        itemStyle: { color: '#2ECC71' }, lineStyle: { width: 2 }, areaStyle: responseChartType.value === 'line' ? {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(46, 204, 113, 0.3)' }, { offset: 1, color: 'rgba(46, 204, 113, 0.02)' }
          ])
        } : undefined },
      { name: '公积金系统', type: responseChartType.value, smooth: true, symbol: responseChartType.value === 'line' ? 'none' : 'emptyCircle',
        data: dates.map(() => Math.floor(Math.random() * 150 + 130)),
        itemStyle: { color: '#F39C12' }, lineStyle: { width: 2 }, areaStyle: responseChartType.value === 'line' ? {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(243, 156, 18, 0.3)' }, { offset: 1, color: 'rgba(243, 156, 18, 0.02)' }
          ])
        } : undefined }
    ]
  })
  return chart
}

const initErrorChart = () => {
  if (!errorChartRef.value) return
  const chart = echarts.init(errorChartRef.value)
  chart.setOption({
    tooltip: { trigger: 'item', ...baseTooltip },
    legend: { orient: 'vertical', right: 0, top: 'center', textStyle: { color: '#9CA3AF', fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
    series: [{
      type: 'pie', radius: ['45%', '75%'], center: ['35%', '50%'], avoidLabelOverlap: false,
      label: { show: false }, labelLine: { show: false },
      data: [
        { value: 68.5, name: '无错误', itemStyle: { color: '#2ECC71' } },
        { value: 18.3, name: '<1%', itemStyle: { color: '#3B82F6' } },
        { value: 9.2, name: '1%-3%', itemStyle: { color: '#F39C12' } },
        { value: 4.0, name: '>3%', itemStyle: { color: '#E74C3C' } }
      ]
    }]
  })
  return chart
}

const initAvailabilityChart = () => {
  if (!availabilityChartRef.value) return
  const chart = echarts.init(availabilityChartRef.value)
  const data = Array.from({ length: 30 }, (_, i) => {
    return 99.5 + Math.random() * 0.5
  })
  chart.setOption({
    grid: { left: 0, right: 0, top: 5, bottom: 0 },
    xAxis: { type: 'category', show: false, data: data.map((_, i) => i) },
    yAxis: { type: 'value', show: false, min: 99, max: 100 },
    series: [{
      type: 'line',
      data,
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#3B82F6', width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(59, 130, 246, 0.4)' },
          { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
        ])
      }
    }]
  })
  return chart
}

const initGauge = (el: HTMLElement | undefined, value: number, color: string) => {
  if (!el) return
  const chart = echarts.init(el)
  chart.setOption({
    series: [{
      type: 'gauge',
      radius: '90%',
      startAngle: 200,
      endAngle: -20,
      min: 0,
      max: 100,
      splitNumber: 5,
      itemStyle: { color },
      progress: { show: true, width: 8 },
      pointer: { show: false },
      axisLine: { lineStyle: { width: 8, color: [[1, '#374151']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      anchor: { show: false },
      title: { show: false },
      detail: {
        valueAnimation: true,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        offsetCenter: [0, 0],
        formatter: '{value}%'
      },
      data: [{ value }]
    }]
  })
  return chart
}

const initPerformanceTrendChart = () => {
  if (!performanceTrendRef.value || !monitorDetail.value) return
  const chart = echarts.init(performanceTrendRef.value)
  const trend = monitorDetail.value.responseTrend
  chart.setOption({
    tooltip: { trigger: 'axis', ...baseTooltip },
    legend: { data: ['P50', 'P95', 'P99'], textStyle: { color: '#9CA3AF' }, right: 0, top: 0 },
    grid: { left: 50, right: 20, top: 35, bottom: 25 },
    xAxis: { type: 'category', data: trend.map(t => t.time), axisLine: { lineStyle: { color: '#374151' } }, axisLabel: { color: '#6B7280', fontSize: 11 } },
    yAxis: { type: 'value', name: 'ms', nameTextStyle: { color: '#6B7280' }, axisLine: { show: false },
      splitLine: { lineStyle: { color: '#374151', type: 'dashed' } }, axisLabel: { color: '#6B7280', fontSize: 11 } },
    series: [
      { name: 'P50', type: 'line', smooth: true, data: trend.map(t => t.p50),
        itemStyle: { color: '#22C55E' }, lineStyle: { width: 2 }, symbol: 'none' },
      { name: 'P95', type: 'line', smooth: true, data: trend.map(t => t.p95),
        itemStyle: { color: '#F59E0B' }, lineStyle: { width: 2 }, symbol: 'none' },
      { name: 'P99', type: 'line', smooth: true, data: trend.map(t => t.p99),
        itemStyle: { color: '#EF4444' }, lineStyle: { width: 2 }, symbol: 'none' }
    ]
  })
  return chart
}

const initErrorTrendChart = () => {
  if (!errorTrendRef.value || !monitorDetail.value) return
  const chart = echarts.init(errorTrendRef.value)
  const trend = monitorDetail.value.errorTrend
  chart.setOption({
    tooltip: { trigger: 'axis', ...baseTooltip },
    grid: { left: 40, right: 10, top: 10, bottom: 20 },
    xAxis: { type: 'category', data: trend.map(t => t.time), axisLine: { lineStyle: { color: '#374151' } }, axisLabel: { color: '#6B7280', fontSize: 10 } },
    yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: '#374151', type: 'dashed' } },
      axisLabel: { color: '#6B7280', fontSize: 10, formatter: '{value}%' } },
    series: [{
      type: 'line', smooth: true, data: trend.map(t => t.errorRate.toFixed(2)),
      itemStyle: { color: '#EF4444' }, lineStyle: { width: 2 }, symbol: 'none',
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
          { offset: 1, color: 'rgba(239, 68, 68, 0.02)' }
        ])
      }
    }]
  })
  return chart
}

const loadData = async () => {
  loading.value = true
  try {
    const [monitorsRes, alertsRes] = await Promise.all([
      getMonitorList({ page: 1, pageSize: 50 }),
      getMonitorAlerts()
    ])
    monitorList.value = monitorsRes.data.list
    allAlerts.value = alertsRes.data
    alertRules.value = mockAlertRules
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const showMonitorDetail = (monitor: ServiceMonitor) => {
  selectedMonitor.value = monitor
  monitorDetail.value = mockMonitorDetails[monitor.id] || null
  detailDrawerVisible.value = true
  nextTick(() => {
    initDetailCharts()
  })
}

let cpuGaugeChart: echarts.ECharts | null = null
let memoryGaugeChart: echarts.ECharts | null = null
let diskGaugeChart: echarts.ECharts | null = null
let performanceChart: echarts.ECharts | null = null
let errorTrendChart: echarts.ECharts | null = null

const initDetailCharts = () => {
  if (!monitorDetail.value) return
  const metrics = monitorDetail.value.metrics
  cpuGaugeChart = initGauge(cpuGaugeRef.value, metrics.cpuUsage, '#3B82F6')
  memoryGaugeChart = initGauge(memoryGaugeRef.value, metrics.memoryUsage, '#8B5CF6')
  diskGaugeChart = initGauge(diskGaugeRef.value, metrics.diskUsage, '#F59E0B')
  performanceChart = initPerformanceTrendChart()
  errorTrendChart = initErrorTrendChart()
}

const acknowledgeAlert = (alert: MonitorAlert) => {
  alert.status = 'acknowledged'
  ElMessage.success('已确认告警')
}

const resolveAlert = (alert: MonitorAlert) => {
  alert.status = 'resolved'
  ElMessage.success('已标记为解决')
}

const editAlertRule = (rule: AlertRule) => {
  selectedRuleMonitorId.value = rule.monitorId
  Object.assign(currentRule, {
    responseEnabled: true,
    responseTimeWarning: rule.responseTimeWarning,
    responseTimeCritical: rule.responseTimeCritical,
    availabilityEnabled: true,
    availabilityWarning: rule.availabilityWarning,
    availabilityCritical: rule.availabilityCritical,
    errorRateEnabled: true,
    errorRateWarning: rule.errorRateWarning,
    errorRateCritical: rule.errorRateCritical,
    notifySms: rule.notifySms,
    notifyEmail: rule.notifyEmail,
    notifySite: rule.notifySite
  })
  alertDrawerVisible.value = true
}

const saveAlertRules = () => {
  ElMessage.success('告警规则已保存')
  alertDrawerVisible.value = false
}

let responseChart: echarts.ECharts | null = null
let errorChart: echarts.ECharts | null = null
let availabilityChart: echarts.ECharts | null = null

const handleResize = () => {
  responseChart?.resize()
  errorChart?.resize()
  availabilityChart?.resize()
  cpuGaugeChart?.resize()
  memoryGaugeChart?.resize()
  diskGaugeChart?.resize()
  performanceChart?.resize()
  errorTrendChart?.resize()
}

onMounted(async () => {
  await nextTick()
  responseChart = initResponseChart()
  errorChart = initErrorChart()
  availabilityChart = initAvailabilityChart()
  loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  responseChart?.dispose()
  errorChart?.dispose()
  availabilityChart?.dispose()
  cpuGaugeChart?.dispose()
  memoryGaugeChart?.dispose()
  diskGaugeChart?.dispose()
  performanceChart?.dispose()
  errorTrendChart?.dispose()
})

watch(responseChartType, () => {
  nextTick(() => {
    responseChart?.dispose()
    responseChart = initResponseChart()
  })
})

watch(detailDrawerVisible, (val) => {
  if (val) {
    nextTick(() => {
      initDetailCharts()
    })
  }
})
</script>

<style scoped>
.alert-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}
.alert-tabs :deep(.el-tabs__item) {
  color: #9CA3AF;
}
.alert-tabs :deep(.el-tabs__item.is-active) {
  color: #fff;
}
.alert-tabs :deep(.el-tabs__active-bar) {
  background-color: #3B82F6;
}
.alert-tabs :deep(.el-tabs__nav-wrap::after) {
  background-color: #374151;
}
</style>
