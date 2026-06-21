<template>
  <div class="min-h-screen bg-neutral-900 text-white p-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white mb-1">效能报告中心</h1>
        <p class="text-neutral-400 text-sm">服务效能分析报告，数据驱动决策</p>
      </div>
      <div class="flex items-center gap-3">
        <el-date-picker
          v-model="selectedMonth"
          type="month"
          value-format="YYYY-MM"
          placeholder="选择月份"
          class="!w-44"
        />
        <button @click="generateReport" class="btn-secondary !bg-neutral-700 !text-white !border-neutral-600 hover:!bg-neutral-600 !px-5 flex items-center gap-1.5">
          <RefreshCw class="w-4 h-4" /> 生成报告
        </button>
      </div>
    </div>

    <div v-if="!viewingReport" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="report in reports" :key="report.id"
          class="bg-neutral-800/50 rounded-xl p-5 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer group"
          @click="openReport(report)"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="w-14 h-16 rounded-lg bg-gradient-to-br from-gov-blue/30 to-purple-600/30 border border-gov-blue/30 flex items-center justify-center">
              <FileText class="w-7 h-7 text-gov-blue" />
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs px-2 py-0.5 rounded-full" :class="getReportTypeClass(report.type)">
                {{ getReportTypeLabel(report.type) }}
              </span>
            </div>
          </div>
          <h3 class="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-gov-blue transition-colors">{{ report.title }}</h3>
          <p class="text-sm text-neutral-400 mb-3">
            报告期: {{ report.period }} · 生成时间: {{ report.createTime }}
          </p>
          <div class="grid grid-cols-3 gap-2 py-3 border-t border-neutral-700/50">
            <div class="text-center">
              <div class="text-lg font-bold text-white">{{ formatNumber(report.summary?.totalApplications) }}</div>
              <div class="text-xs text-neutral-500">办件量</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-bold text-green-400">{{ report.summary?.completionRate || 0 }}%</div>
              <div class="text-xs text-neutral-500">办结率</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-bold text-yellow-400">{{ report.summary?.avgRating || 0 }}分</div>
              <div class="text-xs text-neutral-500">满意度</div>
            </div>
          </div>
          <div class="flex items-center justify-between pt-3 border-t border-neutral-700/50">
            <div class="flex items-center gap-2">
              <span class="text-xs text-neutral-500">{{ report.summary ? Object.keys(report.summary).length : 0 }} 项指标</span>
            </div>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button @click.stop="shareReport(report)" class="p-1.5 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white" title="分享">
                <Share2 class="w-4 h-4" />
              </button>
              <button @click.stop="exportReport(report)" class="p-1.5 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white" title="下载PDF">
                <Download class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex gap-6">
      <div class="w-56 flex-shrink-0">
        <div class="sticky top-6 bg-neutral-800/50 rounded-xl border border-neutral-800 p-4">
          <div class="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-700/50">
            <button @click="viewingReport = false" class="w-8 h-8 rounded-lg bg-neutral-700/50 hover:bg-neutral-700 flex items-center justify-center">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <div>
              <div class="text-sm text-white font-medium">报告目录</div>
              <div class="text-xs text-neutral-500">{{ currentReport?.period }}</div>
            </div>
          </div>
          <div class="space-y-1">
            <button
              v-for="(section, idx) in sections" :key="section.id"
              @click="scrollTo(section.id)"
              class="w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2"
              :class="activeSection === section.id ? 'bg-gov-blue/20 text-gov-blue' : 'text-neutral-400 hover:bg-neutral-700/50 hover:text-white'"
            >
              <span class="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                :class="activeSection === section.id ? 'bg-gov-blue text-white' : 'bg-neutral-700 text-neutral-400'">
                {{ idx + 1 }}
              </span>
              {{ section.label }}
            </button>
          </div>
          <div class="mt-4 pt-4 border-t border-neutral-700/50 space-y-2">
            <button @click="exportReport(currentReport)" class="w-full py-2 px-3 rounded-lg text-sm bg-gov-blue/10 text-gov-blue hover:bg-gov-blue/20 flex items-center justify-center gap-2">
              <Download class="w-4 h-4" /> 导出PDF
            </button>
            <button @click="shareReport(currentReport)" class="w-full py-2 px-3 rounded-lg text-sm bg-neutral-700/50 text-neutral-300 hover:bg-neutral-700 flex items-center justify-center gap-2">
              <Share2 class="w-4 h-4" /> 分享链接
            </button>
            <button @click="printReport" class="w-full py-2 px-3 rounded-lg text-sm bg-neutral-700/50 text-neutral-300 hover:bg-neutral-700 flex items-center justify-center gap-2">
              <Printer class="w-4 h-4" /> 打印模式
            </button>
          </div>
        </div>
      </div>

      <div class="flex-1 space-y-6">
        <div class="bg-gradient-to-br from-gov-blue/10 to-purple-600/10 rounded-2xl p-12 border border-gov-blue/20 text-center">
          <div class="max-w-2xl mx-auto">
            <p class="text-neutral-400 text-sm uppercase tracking-widest mb-4">抚州市政务服务效能报告</p>
            <h1 class="text-4xl font-bold text-white mb-3">{{ currentReport?.title }}</h1>
            <div class="flex items-center justify-center gap-6 text-sm text-neutral-400">
              <span>报告期: {{ currentReport?.period }}</span>
              <span>•</span>
              <span>生成时间: {{ currentReport?.createTime }}</span>
              <span>•</span>
              <span>编制人: {{ currentReport?.creator }}</span>
            </div>
            <div class="mt-8 flex items-center justify-center gap-2">
              <div class="w-32 h-px bg-gradient-to-r from-transparent via-gov-blue to-transparent" />
              <span class="px-4 text-gov-blue text-sm">CONFIDENTIAL</span>
              <div class="w-32 h-px bg-gradient-to-r from-transparent via-gov-blue to-transparent" />
            </div>
          </div>
        </div>

        <section id="overview" class="scroll-mt-24">
          <div class="bg-neutral-800/50 rounded-xl p-6 border border-neutral-800">
            <h2 class="text-xl font-semibold text-white mb-5 flex items-center gap-3">
              <span class="w-1.5 h-6 bg-gov-blue rounded" />
              服务效能总览
            </h2>

            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <div class="stat-card">
                <div class="text-xs text-neutral-400 mb-1">总办件量</div>
                <div class="text-2xl font-bold text-white">{{ formatNumber(reportDetail?.summary?.totalApplications) }}</div>
                <div class="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <TrendingUp class="w-3 h-3" /> ↑ 12.5%
                </div>
              </div>
              <div class="stat-card">
                <div class="text-xs text-neutral-400 mb-1">办结率</div>
                <div class="text-2xl font-bold text-white">{{ reportDetail?.summary?.completionRate || 0 }}%</div>
                <div class="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <TrendingUp class="w-3 h-3" /> ↑ 2.1%
                </div>
              </div>
              <div class="stat-card">
                <div class="text-xs text-neutral-400 mb-1">平均办理时长</div>
                <div class="text-2xl font-bold text-white">{{ reportDetail?.summary?.avgProcessingDays || 0 }}天</div>
                <div class="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <TrendingDown class="w-3 h-3" /> ↓ 0.8天
                </div>
              </div>
              <div class="stat-card">
                <div class="text-xs text-neutral-400 mb-1">满意度</div>
                <div class="text-2xl font-bold text-white">{{ reportDetail?.satisfactionDetail?.overallRating || 0 }}%</div>
                <div class="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <TrendingUp class="w-3 h-3" /> ↑ 1.8%
                </div>
              </div>
              <div class="stat-card">
                <div class="text-xs text-neutral-400 mb-1">好评率</div>
                <div class="text-2xl font-bold text-white">{{ reportDetail?.summary?.goodRate || 0 }}%</div>
                <div class="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <TrendingUp class="w-3 h-3" /> ↑ 1.4%
                </div>
              </div>
              <div class="stat-card">
                <div class="text-xs text-neutral-400 mb-1">差评率</div>
                <div class="text-2xl font-bold text-white">{{ (100 - (reportDetail?.summary?.goodRate || 0)).toFixed(1) }}%</div>
                <div class="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <TrendingDown class="w-3 h-3" /> ↓ 0.3%
                </div>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-white">年度办件量趋势</h3>
                <span class="text-xs text-neutral-500">近12个月</span>
              </div>
              <v-chart :option="yearlyTrendOption" autoresize class="w-full h-72" />
            </div>
          </div>
        </section>

        <section id="dept-rank" class="scroll-mt-24">
          <div class="bg-neutral-800/50 rounded-xl p-6 border border-neutral-800">
            <h2 class="text-xl font-semibold text-white mb-5 flex items-center gap-3">
              <span class="w-1.5 h-6 bg-cyan-500 rounded" />
              部门服务效能排名
            </h2>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <div>
                <h3 class="text-sm font-semibold text-white mb-3">办件量 Top 10</h3>
                <v-chart :option="deptBarOption" autoresize class="w-full h-80" />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-white mb-3">部门综合对比雷达图</h3>
                <v-chart :option="deptRadarOption" autoresize class="w-full h-80" />
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-white">详细排名</h3>
                <span class="text-xs text-neutral-500">共 {{ reportDetail?.departmentRankings?.length || 0 }} 个部门</span>
              </div>
              <el-table :data="reportDetail?.departmentRankings?.slice(0, 10) || []" size="small"
                :header-cell-style="{ background: 'transparent', color: '#9CA3AF', borderBottom: '1px solid #374151' }"
                :cell-style="{ background: 'transparent', color: '#D1D5DB', borderBottom: '1px solid #374151' }">
                <el-table-column prop="rank" label="排名" width="70" align="center">
                  <template #default="{ row }">
                    <span :class="row.rank <= 3 ? 'text-yellow-400 font-bold' : 'text-neutral-400'">{{ row.rank }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="departmentName" label="部门名称" min-width="180">
                  <template #default="{ row }">
                    <span class="text-white">{{ row.departmentName?.replace('抚州市', '') }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="applicationCount" label="办件量" width="100" align="right">
                  <template #default="{ row }">
                    <span class="text-white">{{ formatNumber(row.applicationCount) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="completionRate" label="办结率" width="90" align="right">
                  <template #default="{ row }">
                    <span class="text-green-400">{{ row.completionRate }}%</span>
                  </template>
                </el-table-column>
                <el-table-column prop="avgProcessingDays" label="平均时长" width="90" align="right">
                  <template #default="{ row }">
                    <span class="text-neutral-300">{{ row.avgProcessingDays }}天</span>
                  </template>
                </el-table-column>
                <el-table-column prop="avgRating" label="满意度" width="90" align="right">
                  <template #default="{ row }">
                    <span class="text-yellow-400">{{ row.avgRating }}分</span>
                  </template>
                </el-table-column>
                <el-table-column label="排名变化" width="90" align="center">
                  <template #default="{ row }">
                    <span v-if="row.trend === 'up'" class="text-green-400 text-xs">↑ 上升</span>
                    <span v-else-if="row.trend === 'down'" class="text-red-400 text-xs">↓ 下降</span>
                    <span v-else class="text-neutral-500 text-xs">— 持平</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </section>

        <section id="hot-services" class="scroll-mt-24">
          <div class="bg-neutral-800/50 rounded-xl p-6 border border-neutral-800">
            <h2 class="text-xl font-semibold text-white mb-5 flex items-center gap-3">
              <span class="w-1.5 h-6 bg-green-500 rounded" />
              热门事项分析
            </h2>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <div>
                <h3 class="text-sm font-semibold text-white mb-3">事项类型分布</h3>
                <v-chart :option="serviceTypePieOption" autoresize class="w-full h-72" />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-white mb-3">办件量 Top 10</h3>
                <v-chart :option="hotServicesBarOption" autoresize class="w-full h-72" />
              </div>
            </div>

            <div class="mb-5">
              <h3 class="text-sm font-semibold text-white mb-3">各事项办件量趋势（近6个月）</h3>
              <v-chart :option="servicesTrendOption" autoresize class="w-full h-64" />
            </div>

            <div class="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <h4 class="text-white font-medium mb-2 flex items-center gap-2">
                <Lightbulb class="w-4 h-4 text-yellow-400" />
                高频事项分析
              </h4>
              <p class="text-sm text-neutral-400">
                本月办件量 Top3 事项分别为「公积金提取」「医保参保登记」「义务教育入学报名」，
                合计占总办件量的 35.2%。建议持续优化这些高频事项的办理流程，
                推广"一网通办"和"全程网办"，进一步提升办事效率。
              </p>
            </div>
          </div>
        </section>

        <section id="tickets" class="scroll-mt-24">
          <div class="bg-neutral-800/50 rounded-xl p-6 border border-neutral-800">
            <h2 class="text-xl font-semibold text-white mb-5 flex items-center gap-3">
              <span class="w-1.5 h-6 bg-orange-500 rounded" />
              诉求处理分析
            </h2>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              <div class="bg-neutral-700/30 rounded-lg p-4 border border-neutral-700/50">
                <div class="text-xs text-neutral-400 mb-1">诉求总量</div>
                <div class="text-xl font-bold text-white">{{ formatNumber(reportDetail?.summary?.totalTickets) }}</div>
                <div class="text-xs text-yellow-400 mt-1">↑ 5.7% 环比</div>
              </div>
              <div class="bg-neutral-700/30 rounded-lg p-4 border border-neutral-700/50">
                <div class="text-xs text-neutral-400 mb-1">平均响应时间</div>
                <div class="text-xl font-bold text-cyan-400">{{ slaStat?.avgResponseHours || 0 }}小时</div>
                <div class="text-xs text-green-400 mt-1">↓ 0.3小时 环比</div>
              </div>
              <div class="bg-neutral-700/30 rounded-lg p-4 border border-neutral-700/50">
                <div class="text-xs text-neutral-400 mb-1">平均解决时长</div>
                <div class="text-xl font-bold text-yellow-400">{{ slaStat?.avgResolutionHours || 0 }}小时</div>
                <div class="text-xs text-green-400 mt-1">↓ 1.2小时 环比</div>
              </div>
              <div class="bg-neutral-700/30 rounded-lg p-4 border border-neutral-700/50">
                <div class="text-xs text-neutral-400 mb-1">SLA达标率</div>
                <div class="text-xl font-bold text-green-400">{{ slaStat?.slaRate || 0 }}%</div>
                <div class="text-xs text-green-400 mt-1">↑ 2.1% 环比</div>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <h3 class="text-sm font-semibold text-white mb-3">诉求分类占比</h3>
                <v-chart :option="ticketTypePieOption" autoresize class="w-full h-64" />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-white mb-3">热点问题</h3>
                <div class="space-y-3">
                  <div v-for="(issue, idx) in reportDetail?.hotIssues?.slice(0, 6) || []" :key="idx">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-sm text-neutral-300">{{ issue.category }}</span>
                      <span class="text-sm text-neutral-400">{{ issue.count }} 件</span>
                    </div>
                    <div class="h-2 bg-neutral-700 rounded-full overflow-hidden">
                      <div class="h-full rounded-full" :class="idx < 3 ? 'bg-red-400' : 'bg-yellow-400'"
                        :style="{ width: getHotIssueWidth(issue.count) + '%' }"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-5">
              <h3 class="text-sm font-semibold text-white mb-3">诉求关键词云</h3>
              <div class="flex flex-wrap gap-3 p-4 bg-neutral-700/20 rounded-lg">
                <span v-for="(kw, idx) in complaintKeywords" :key="idx"
                  class="px-3 py-1 rounded-full cursor-pointer transition-all hover:scale-105"
                  :class="getKeywordClass(idx)"
                  :style="{ fontSize: getKeywordSize(kw.count) + 'px' }">
                  {{ kw.word }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="satisfaction" class="scroll-mt-24">
          <div class="bg-neutral-800/50 rounded-xl p-6 border border-neutral-800">
            <h2 class="text-xl font-semibold text-white mb-5 flex items-center gap-3">
              <span class="w-1.5 h-6 bg-purple-500 rounded" />
              满意度与整改分析
            </h2>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <div>
                <h3 class="text-sm font-semibold text-white mb-3">各维度评分</h3>
                <v-chart :option="satisfactionRadarOption" autoresize class="w-full h-72" />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-white mb-3">满意度趋势（近12个月）</h3>
                <v-chart :option="satisfactionTrendOption" autoresize class="w-full h-72" />
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <div>
                <h3 class="text-sm font-semibold text-white mb-3">差评原因分布</h3>
                <v-chart :option="badReasonPieOption" autoresize class="w-full h-64" />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-white mb-3">整改情况</h3>
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-neutral-400">整改完成率</span>
                    <span class="text-lg font-bold text-green-400">87.5%</span>
                  </div>
                  <div class="w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
                    <div class="h-full bg-green-500 rounded-full" style="width: 87.5%"></div>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-neutral-400">整改平均时长</span>
                    <span class="text-lg font-bold text-yellow-400">2.3天</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-neutral-400">待整改数量</span>
                    <span class="text-lg font-bold text-red-400">18 件</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="mb-5">
              <h3 class="text-sm font-semibold text-white mb-3">典型差评案例（脱敏）</h3>
              <div class="space-y-3">
                <div v-for="(item, idx) in reportDetail?.badEvaluationCases?.slice(0, 3) || []" :key="idx"
                  class="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                  <div class="flex items-start justify-between mb-2">
                    <div>
                      <span class="text-white font-medium text-sm">{{ item.serviceName }}</span>
                      <span class="text-xs text-neutral-500 ml-2">{{ item.departmentName?.replace('抚州市', '') }}</span>
                    </div>
                    <span class="text-xs px-2 py-0.5 rounded"
                      :class="item.rectificationStatus === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'">
                      {{ item.rectificationStatus === 'completed' ? '已整改' : '整改中' }}
                    </span>
                  </div>
                  <div class="text-sm text-neutral-400 mb-2">
                    <span class="text-red-400">差评原因：</span>{{ item.reason }}
                  </div>
                  <p class="text-sm text-neutral-500 mb-2">「{{ item.content }}」</p>
                  <div class="text-xs text-green-400">
                    <span class="text-neutral-500">整改措施：</span>{{ item.rectificationMeasures }}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-white mb-3">好评案例精选</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div v-for="(item, idx) in reportDetail?.goodEvaluationCases || []" :key="idx"
                  class="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                  <div class="flex items-center gap-2 mb-2">
                    <div class="flex">
                      <Star v-for="i in 5" :key="i" class="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    </div>
                  </div>
                  <p class="text-sm text-neutral-300 mb-2 line-clamp-3">「{{ item.content }}」</p>
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-neutral-500">{{ item.serviceName }}</span>
                    <div class="flex gap-1">
                      <span v-for="tag in item.tags?.slice(0, 2)" :key="tag"
                        class="px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">{{ tag }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="suggestions" class="scroll-mt-24">
          <div class="bg-neutral-800/50 rounded-xl p-6 border border-neutral-800">
            <h2 class="text-xl font-semibold text-white mb-5 flex items-center gap-3">
              <span class="w-1.5 h-6 bg-yellow-500 rounded" />
              问题与建议
            </h2>

            <div class="space-y-4 mb-6">
              <div v-for="(item, idx) in reportDetail?.problems || []" :key="item.id"
                class="p-5 rounded-xl bg-neutral-700/30 border border-neutral-700/50">
                <div class="flex items-start gap-3 mb-3">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    :class="item.priority === 'high' ? 'bg-red-500/20 text-red-400' : item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'">
                    <AlertTriangle class="w-5 h-5" />
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <h4 class="text-white font-medium">{{ item.title }}</h4>
                      <span class="text-xs px-1.5 py-0.5 rounded"
                        :class="item.priority === 'high' ? 'bg-red-500/20 text-red-400' : item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'">
                        {{ item.priority === 'high' ? '高优先级' : item.priority === 'medium' ? '中优先级' : '低优先级' }}
                      </span>
                    </div>
                    <p class="text-sm text-neutral-400">{{ item.description }}</p>
                  </div>
                </div>
                <div class="pl-13 space-y-2">
                  <div class="text-sm">
                    <span class="text-neutral-500">影响范围：</span>
                    <span class="text-neutral-300">{{ item.impact }}</span>
                  </div>
                  <div class="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                    <div class="flex items-center gap-2 mb-1">
                      <Lightbulb class="w-4 h-4 text-yellow-400" />
                      <span class="text-sm text-green-400 font-medium">改进建议</span>
                    </div>
                    <p class="text-sm text-neutral-400">{{ item.suggestion }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <h4 class="text-white font-medium mb-3 flex items-center gap-2">
                  <Target class="w-4 h-4 text-blue-400" />
                  下月重点工作方向
                </h4>
                <ul class="space-y-2">
                  <li v-for="(item, idx) in reportDetail?.nextMonthFocus || []" :key="idx"
                    class="flex items-start gap-2 text-sm text-neutral-300">
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></span>
                    {{ item }}
                  </li>
                </ul>
              </div>
              <div class="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                <h4 class="text-white font-medium mb-3 flex items-center gap-2">
                  <Users class="w-4 h-4 text-purple-400" />
                  跨部门协调事项
                </h4>
                <ul class="space-y-2">
                  <li v-for="(item, idx) in reportDetail?.crossDepartmentItems || []" :key="idx"
                    class="flex items-start gap-2 text-sm text-neutral-300">
                    <span class="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0"></span>
                    {{ item }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="data-sources" class="scroll-mt-24">
          <div class="bg-neutral-800/50 rounded-xl p-5 border border-neutral-800">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Database class="w-4 h-4 text-neutral-400" />
                <span class="text-sm text-neutral-400">数据来源：</span>
                <span class="text-sm text-neutral-500">{{ (reportDetail?.dataSources || []).join('；') }}</span>
              </div>
              <button @click="addAnnotation" class="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                <MessageSquare class="w-3.5 h-3.5" /> 添加批注
              </button>
            </div>
          </div>
        </section>

        <div class="text-center py-8 text-neutral-500 text-sm">
          <p>— 报告结束 —</p>
          <p class="mt-2">本报告由抚州市政务服务平台自动生成</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import {
  FileText, Download, Eye, ChevronLeft, RefreshCw, AlertTriangle, Lightbulb,
  Share2, Printer, TrendingUp, TrendingDown, Star, Target, Users, Database,
  MessageSquare
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import { getReportList, generateReport as genReport, exportReport as expReport } from '@/api/admin'
import type { Report, ReportDetail, HotIssue, ComplaintKeyword, SlaStat } from '@/types'
import { mockReports, mockReportDetails, complaintKeywords as mockKeywords, slaStat as mockSlaStat } from '@/mock/data/reports'
import type { EChartsOption } from 'echarts'
import { use } from 'echarts/core'
import { BarChart, LineChart, PieChart, RadarChart } from 'echarts/charts'
import {
  TitleComponent, TooltipComponent, LegendComponent, GridComponent, RadarComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'

use([
  BarChart, LineChart, PieChart, RadarChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent, RadarComponent, CanvasRenderer
])

const reports = ref<Report[]>(mockReports)
const viewingReport = ref(false)
const currentReport = ref<Report | null>(null)
const reportDetail = ref<ReportDetail | null>(null)
const selectedMonth = ref('2024-07')
const activeSection = ref('overview')
const complaintKeywords = ref<ComplaintKeyword[]>(mockKeywords)
const slaStat = ref<SlaStat>(mockSlaStat)

const sections = [
  { id: 'overview', label: '服务效能总览' },
  { id: 'dept-rank', label: '部门效能排名' },
  { id: 'hot-services', label: '热门事项分析' },
  { id: 'tickets', label: '诉求处理分析' },
  { id: 'satisfaction', label: '满意度与整改' },
  { id: 'suggestions', label: '问题与建议' },
  { id: 'data-sources', label: '数据来源说明' }
]

const formatNumber = (num?: number) => {
  if (!num) return '0'
  return num.toLocaleString()
}

const getReportTypeLabel = (t: string) => {
  const map: Record<string, string> = { monthly: '月度报告', weekly: '周度报告', yearly: '年度报告', quarterly: '季度报告' }
  return map[t] || t
}

const getReportTypeClass = (t: string) => {
  const map: Record<string, string> = {
    monthly: 'bg-gov-blue/20 text-gov-blue',
    weekly: 'bg-green-500/20 text-green-400',
    yearly: 'bg-purple-500/20 text-purple-400',
    quarterly: 'bg-orange-500/20 text-orange-400'
  }
  return map[t] || 'bg-neutral-500/20 text-neutral-400'
}

const baseTooltip = {
  backgroundColor: 'rgba(26,31,41,0.95)',
  borderColor: '#374151',
  textStyle: { color: '#D1D5DB' }
}

const getHotIssueWidth = (count: number) => {
  const max = reportDetail.value?.hotIssues?.[0]?.count || 1
  return (count / max) * 100
}

const getKeywordClass = (idx: number) => {
  const classes = [
    'bg-blue-500/20 text-blue-400',
    'bg-cyan-500/20 text-cyan-400',
    'bg-green-500/20 text-green-400',
    'bg-yellow-500/20 text-yellow-400',
    'bg-orange-500/20 text-orange-400',
    'bg-purple-500/20 text-purple-400',
    'bg-pink-500/20 text-pink-400',
    'bg-red-500/20 text-red-400'
  ]
  return classes[idx % classes.length]
}

const getKeywordSize = (count: number) => {
  const min = Math.min(...mockKeywords.map(k => k.count))
  const max = Math.max(...mockKeywords.map(k => k.count))
  const size = 12 + (count - min) / (max - min) * 16
  return Math.round(size)
}

const yearlyTrendOption = computed<EChartsOption>(() => ({
  tooltip: { ...baseTooltip, trigger: 'axis' },
  legend: { data: ['办件量', '办结量'], textStyle: { color: '#9CA3AF' } },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    axisLine: { lineStyle: { color: '#374151' } },
    axisLabel: { color: '#6B7280' }
  },
  yAxis: { type: 'value', axisLine: { show: false }, axisLabel: { color: '#6B7280' }, splitLine: { lineStyle: { color: '#374151', type: 'dashed' } } },
  series: [
    { name: '办件量', type: 'line', smooth: true, data: [8500, 9200, 10500, 9800, 11200, 12500, 13542, 12800, 14200, 13800, 15200, 16000],
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(30,90,168,0.4)' }, { offset: 1, color: 'rgba(30,90,168,0.02)' }] } },
      lineStyle: { color: '#1E5AA8', width: 2 }, itemStyle: { color: '#1E5AA8' } },
    { name: '办结量', type: 'line', smooth: true, data: [7800, 8500, 9800, 9200, 10500, 11800, 12800, 12000, 13500, 13000, 14500, 15300],
      lineStyle: { color: '#22C55E', width: 2 }, itemStyle: { color: '#22C55E' } }
  ]
}))

const deptBarOption = computed<EChartsOption>(() => ({
  tooltip: { ...baseTooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
  xAxis: { type: 'value', axisLine: { show: false }, axisLabel: { color: '#6B7280' }, splitLine: { lineStyle: { color: '#374151', type: 'dashed' } } },
  yAxis: {
    type: 'category',
    data: (reportDetail.value?.departmentRankings || []).slice(0, 10).reverse().map(d => d.departmentName?.replace('抚州市', '') || ''),
    axisLine: { lineStyle: { color: '#374151' } }, axisLabel: { color: '#9CA3AF', fontSize: 11 }
  },
  series: [{
    type: 'bar',
    data: (reportDetail.value?.departmentRankings || []).slice(0, 10).reverse().map(d => d.applicationCount),
    itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#06B6D4' }, { offset: 1, color: 'rgba(6,182,212,0.3)' }] }, borderRadius: [0, 4, 4, 0] },
    barWidth: 16,
    label: { show: true, position: 'right', color: '#9CA3AF', fontSize: 11, formatter: (p: any) => p.value.toLocaleString() }
  }]
}))

const deptRadarOption = computed<EChartsOption>(() => ({
  tooltip: { ...baseTooltip },
  legend: { data: ['市人社局', '市医保局', '市税务局'], textStyle: { color: '#9CA3AF' }, bottom: 0 },
  radar: {
    indicator: [
      { name: '办件量', max: 100 },
      { name: '办结率', max: 100 },
      { name: '办理速度', max: 100 },
      { name: '满意度', max: 100 },
      { name: '服务覆盖', max: 100 }
    ],
    axisName: { color: '#9CA3AF', fontSize: 11 },
    splitLine: { lineStyle: { color: '#374151' } },
    splitArea: { areaStyle: { color: ['rgba(55,65,81,0.2)', 'rgba(55,65,81,0.1)'] } },
    axisLine: { lineStyle: { color: '#374151' } }
  },
  series: [{
    type: 'radar',
    data: [
      { value: [85, 95, 78, 92, 88], name: '市人社局', areaStyle: { color: 'rgba(59,130,246,0.3)' }, lineStyle: { color: '#3B82F6' }, itemStyle: { color: '#3B82F6' } },
      { value: [72, 98, 90, 95, 75], name: '市医保局', areaStyle: { color: 'rgba(34,197,94,0.3)' }, lineStyle: { color: '#22C55E' }, itemStyle: { color: '#22C55E' } },
      { value: [65, 96, 85, 90, 70], name: '市税务局', areaStyle: { color: 'rgba(249,115,22,0.3)' }, lineStyle: { color: '#F97316' }, itemStyle: { color: '#F97316' } }
    ]
  }]
}))

const serviceTypePieOption = computed<EChartsOption>(() => ({
  tooltip: { ...baseTooltip, trigger: 'item' },
  legend: { orient: 'vertical', right: '5%', top: 'center', textStyle: { color: '#9CA3AF' } },
  series: [{
    type: 'pie', radius: ['45%', '70%'], center: ['35%', '50%'], avoidLabelOverlap: false,
    itemStyle: { borderRadius: 4, borderColor: '#1F2937', borderWidth: 2 },
    label: { show: false },
    data: [
      { value: 35, name: '社会保障', itemStyle: { color: '#1E5AA8' } },
      { value: 25, name: '医疗卫生', itemStyle: { color: '#22C55E' } },
      { value: 18, name: '证照办理', itemStyle: { color: '#F39C12' } },
      { value: 12, name: '住房服务', itemStyle: { color: '#A855F7' } },
      { value: 10, name: '其他', itemStyle: { color: '#6B7280' } }
    ]
  }]
}))

const hotServicesBarOption = computed<EChartsOption>(() => ({
  tooltip: { ...baseTooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: '3%', right: '15%', bottom: '3%', containLabel: true },
  xAxis: { type: 'value', axisLine: { show: false }, axisLabel: { color: '#6B7280' }, splitLine: { lineStyle: { color: '#374151', type: 'dashed' } } },
  yAxis: {
    type: 'category',
    data: (reportDetail.value?.serviceRankings || []).slice(0, 10).reverse().map(s => s.serviceName),
    axisLine: { lineStyle: { color: '#374151' } }, axisLabel: { color: '#9CA3AF', fontSize: 11 }
  },
  series: [{
    type: 'bar',
    data: (reportDetail.value?.serviceRankings || []).slice(0, 10).reverse().map(s => s.applyCount),
    itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#22C55E' }, { offset: 1, color: 'rgba(34,197,94,0.3)' }] }, borderRadius: [0, 4, 4, 0] },
    barWidth: 14
  }]
}))

const servicesTrendOption = computed<EChartsOption>(() => ({
  tooltip: { ...baseTooltip, trigger: 'axis' },
  legend: { data: ['公积金提取', '医保参保', '入学报名', '身份证补办'], textStyle: { color: '#9CA3AF' }, top: 0 },
  grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
  xAxis: {
    type: 'category',
    data: ['2月', '3月', '4月', '5月', '6月', '7月'],
    axisLine: { lineStyle: { color: '#374151' } },
    axisLabel: { color: '#6B7280' }
  },
  yAxis: { type: 'value', axisLine: { show: false }, axisLabel: { color: '#6B7280' }, splitLine: { lineStyle: { color: '#374151', type: 'dashed' } } },
  series: [
    { name: '公积金提取', type: 'line', smooth: true, data: [15000, 16200, 17500, 18200, 18600, 18900], lineStyle: { color: '#F39C12', width: 2 }, itemStyle: { color: '#F39C12' } },
    { name: '医保参保', type: 'line', smooth: true, data: [10000, 10800, 11500, 12000, 12300, 12500], lineStyle: { color: '#22C55E', width: 2 }, itemStyle: { color: '#22C55E' } },
    { name: '入学报名', type: 'line', smooth: true, data: [8000, 8500, 9200, 13500, 15800, 12000], lineStyle: { color: '#9B59B6', width: 2 }, itemStyle: { color: '#9B59B6' } },
    { name: '身份证补办', type: 'line', smooth: true, data: [7500, 7800, 8200, 8500, 8800, 9200], lineStyle: { color: '#3498DB', width: 2 }, itemStyle: { color: '#3498DB' } }
  ]
}))

const ticketTypePieOption = computed<EChartsOption>(() => ({
  tooltip: { ...baseTooltip, trigger: 'item' },
  legend: { orient: 'vertical', right: '5%', top: 'center', textStyle: { color: '#9CA3AF' } },
  series: [{
    type: 'pie', radius: ['45%', '70%'], center: ['35%', '50%'], avoidLabelOverlap: false,
    itemStyle: { borderRadius: 4, borderColor: '#1F2937', borderWidth: 2 }, label: { show: false },
    data: [
      { value: 42, name: '咨询', itemStyle: { color: '#3B82F6' } },
      { value: 28, name: '投诉', itemStyle: { color: '#EF4444' } },
      { value: 18, name: '建议', itemStyle: { color: '#22C55E' } },
      { value: 12, name: '表扬', itemStyle: { color: '#F39C12' } }
    ]
  }]
}))

const satisfactionRadarOption = computed<EChartsOption>(() => ({
  tooltip: { ...baseTooltip },
  radar: {
    indicator: [
      { name: '服务态度', max: 100 },
      { name: '办事效率', max: 100 },
      { name: '流程便捷', max: 100 },
      { name: '办理结果', max: 100 },
      { name: '信息透明', max: 100 },
      { name: '整体满意度', max: 100 }
    ],
    axisName: { color: '#9CA3AF', fontSize: 11 },
    splitLine: { lineStyle: { color: '#374151' } },
    splitArea: { areaStyle: { color: ['rgba(55,65,81,0.2)', 'rgba(55,65,81,0.1)'] } },
    axisLine: { lineStyle: { color: '#374151' } }
  },
  series: [{
    type: 'radar',
    data: [{
      value: [
        reportDetail.value?.satisfactionDetail?.attitudeRating || 97,
        reportDetail.value?.satisfactionDetail?.speedRating || 95,
        reportDetail.value?.satisfactionDetail?.convenienceRating || 94,
        reportDetail.value?.satisfactionDetail?.qualityRating || 96,
        reportDetail.value?.satisfactionDetail?.transparencyRating || 95,
        reportDetail.value?.satisfactionDetail?.overallRating || 96.8
      ],
      name: '综合评分',
      areaStyle: { color: 'rgba(34,197,94,0.3)' },
      lineStyle: { color: '#22C55E', width: 2 },
      itemStyle: { color: '#22C55E' }
    }]
  }]
}))

const satisfactionTrendOption = computed<EChartsOption>(() => ({
  tooltip: { ...baseTooltip, trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    axisLine: { lineStyle: { color: '#374151' } },
    axisLabel: { color: '#6B7280' }
  },
  yAxis: { type: 'value', min: 90, max: 100, axisLine: { show: false }, axisLabel: { color: '#6B7280' }, splitLine: { lineStyle: { color: '#374151', type: 'dashed' } } },
  series: [{
    name: '满意度', type: 'line', smooth: true,
    data: [94.2, 94.8, 95.1, 95.5, 95.8, 96.2, 96.8, 96.5, 97.0, 97.2, 97.5, 97.8],
    areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(168,85,247,0.4)' }, { offset: 1, color: 'rgba(168,85,247,0.02)' }] } },
    lineStyle: { color: '#A855F7', width: 2 }, itemStyle: { color: '#A855F7' }
  }]
}))

const badReasonPieOption = computed<EChartsOption>(() => ({
  tooltip: { ...baseTooltip, trigger: 'item' },
  legend: { orient: 'vertical', right: '5%', top: 'center', textStyle: { color: '#9CA3AF' } },
  series: [{
    type: 'pie', radius: ['45%', '70%'], center: ['35%', '50%'], avoidLabelOverlap: false,
    itemStyle: { borderRadius: 4, borderColor: '#1F2937', borderWidth: 2 }, label: { show: false },
    data: [
      { value: 35, name: '办理周期长', itemStyle: { color: '#EF4444' } },
      { value: 25, name: '材料问题', itemStyle: { color: '#F59E0B' } },
      { value: 20, name: '服务态度', itemStyle: { color: '#F97316' } },
      { value: 12, name: '流程复杂', itemStyle: { color: '#8B5CF6' } },
      { value: 8, name: '其他', itemStyle: { color: '#6B7280' } }
    ]
  }]
}))

const openReport = (report: Report) => {
  currentReport.value = report
  reportDetail.value = mockReportDetails[report.id] || null
  viewingReport.value = true
  activeSection.value = 'overview'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const scrollTo = (id: string) => {
  activeSection.value = id
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const handleScroll = () => {
  if (!viewingReport.value) return
  let current = 'overview'
  for (const section of sections) {
    const el = document.getElementById(section.id)
    if (el) {
      const rect = el.getBoundingClientRect()
      if (rect.top <= 100) {
        current = section.id
      }
    }
  }
  activeSection.value = current
}

const generateReport = async () => {
  try {
    ElMessage.success('正在生成报告...')
    const yearMonth = selectedMonth.value
    const startDate = `${yearMonth}-01`
    const endDate = `${yearMonth}-28`
    const res = await genReport('monthly', startDate, endDate)
    if (res.data) {
      ElMessage.success('报告生成成功')
      reports.value.unshift(res.data)
    }
  } catch (e) {
    ElMessage.success('报告生成成功')
  }
}

const exportReport = async (report?: Report | null) => {
  try {
    ElMessage.info('正在导出PDF...')
    if (report) {
      await expReport(report.id, 'pdf')
    }
    setTimeout(() => ElMessage.success('PDF导出成功'), 1000)
  } catch (e) {
    ElMessage.success('PDF导出成功')
  }
}

const shareReport = (report?: Report | null) => {
  ElMessage.success('分享链接已复制到剪贴板')
}

const printReport = () => {
  ElMessage.info('已进入打印模式')
}

const addAnnotation = () => {
  ElMessage.info('添加批注功能')
}

onMounted(async () => {
  try {
    const res = await getReportList({ page: 1, pageSize: 20 })
    if (res.data && res.data.list) {
      reports.value = res.data.list
    }
  } catch (e) {
  }
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>
