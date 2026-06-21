<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { EChartsOption } from 'echarts'
import {
  Calculator,
  Building2,
  CreditCard,
  TrendingDown,
  Coins,
  Calendar,
  ArrowLeft,
  SlidersHorizontal,
  Printer,
  Download,
  Wallet,
  User,
  Building,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sparkles,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const activeTab = ref<'loan' | 'payment'>('loan')
const showAdvanced = ref(false)
const schedulePage = ref(1)
const pageSize = ref(12)

const loanForm = reactive({
  amount: 500000,
  years: 20,
  rate: 3.1,
  repaymentType: 'equal_installment' as 'equal_installment' | 'equal_principal',
  fundBalance: 0,
  hasSupplementary: false,
  supplementaryBalance: 0,
})

const paymentForm = reactive({
  base: 6000,
  personalRatio: 12,
  companyRatio: 12,
  hasSupplementary: false,
  supplementaryPersonalRatio: 5,
  supplementaryCompanyRatio: 5,
})

interface RepaymentItem {
  month: number
  principal: number
  interest: number
  totalPayment: number
  remainingPrincipal: number
}

const yearOptions = Array.from({ length: 30 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}年`,
}))

const equalInstallment = computed(() => {
  const { amount, years, rate } = loanForm
  const monthlyRate = rate / 100 / 12
  const totalMonths = years * 12
  if (monthlyRate === 0) {
    const monthlyPayment = amount / totalMonths
    return {
      monthlyPayment,
      totalPayment: amount,
      totalInterest: 0,
      schedule: Array.from({ length: totalMonths }, (_, i) => ({
        month: i + 1,
        principal: monthlyPayment,
        interest: 0,
        totalPayment: monthlyPayment,
        remainingPrincipal: amount - monthlyPayment * (i + 1),
      })),
    }
  }
  const monthlyPayment =
    (amount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1)
  const totalPayment = monthlyPayment * totalMonths
  const totalInterest = totalPayment - amount

  const schedule: RepaymentItem[] = []
  let remaining = amount
  for (let i = 0; i < totalMonths; i++) {
    const interest = remaining * monthlyRate
    const principal = monthlyPayment - interest
    remaining -= principal
    schedule.push({
      month: i + 1,
      principal,
      interest,
      totalPayment: monthlyPayment,
      remainingPrincipal: Math.max(0, remaining),
    })
  }
  return { monthlyPayment, totalPayment, totalInterest, schedule }
})

const equalPrincipal = computed(() => {
  const { amount, years, rate } = loanForm
  const monthlyRate = rate / 100 / 12
  const totalMonths = years * 12
  const monthlyPrincipal = amount / totalMonths
  const schedule: RepaymentItem[] = []
  let totalPayment = 0
  let remaining = amount
  for (let i = 0; i < totalMonths; i++) {
    const interest = remaining * monthlyRate
    const payment = monthlyPrincipal + interest
    totalPayment += payment
    remaining -= monthlyPrincipal
    schedule.push({
      month: i + 1,
      principal: monthlyPrincipal,
      interest,
      totalPayment: payment,
      remainingPrincipal: Math.max(0, remaining),
    })
  }
  return {
    firstMonthPayment: schedule[0]?.totalPayment || 0,
    lastMonthPayment: schedule[totalMonths - 1]?.totalPayment || 0,
    totalPayment,
    totalInterest: totalPayment - amount,
    schedule,
  }
})

const maxLoanAmount = computed(() => {
  if (!showAdvanced.value || loanForm.fundBalance <= 0) return null
  const baseLoan = loanForm.fundBalance * 15
  const maxLoan = Math.min(baseLoan, 600000)
  return Math.round(maxLoan / 10000) * 10000
})

const currentSchedule = computed(() => {
  const schedule = loanForm.repaymentType === 'equal_installment'
    ? equalInstallment.value.schedule
    : equalPrincipal.value.schedule
  const start = (schedulePage.value - 1) * pageSize.value
  return schedule.slice(start, start + pageSize.value)
})

const totalPages = computed(() => {
  const total = loanForm.years * 12
  return Math.ceil(total / pageSize.value)
})

const paymentResult = computed(() => {
  const {
    base,
    personalRatio,
    companyRatio,
    hasSupplementary,
    supplementaryPersonalRatio,
    supplementaryCompanyRatio,
  } = paymentForm

  const personalBasic = base * (personalRatio / 100)
  const companyBasic = base * (companyRatio / 100)
  let personalSupplementary = 0
  let companySupplementary = 0

  if (hasSupplementary) {
    personalSupplementary = base * (supplementaryPersonalRatio / 100)
    companySupplementary = base * (supplementaryCompanyRatio / 100)
  }

  const personalMonthly = personalBasic + personalSupplementary
  const companyMonthly = companyBasic + companySupplementary
  const totalMonthly = personalMonthly + companyMonthly

  return {
    personalBasic,
    companyBasic,
    personalSupplementary,
    companySupplementary,
    personalMonthly,
    companyMonthly,
    totalMonthly,
    totalYearly: totalMonthly * 12,
  }
})

const monthlyCompareChartOption = computed<EChartsOption>(() => {
  const months = 6
  const installmentData = equalInstallment.value.schedule
    .slice(0, months)
    .map((s) => Math.round(s.totalPayment))
  const principalData = equalPrincipal.value.schedule
    .slice(0, months)
    .map((s) => Math.round(s.totalPayment))
  const monthLabels = Array.from({ length: months }, (_, i) => `第${i + 1}月`)

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#E5E7EB',
      textStyle: { color: '#374151' },
      formatter: (params: any) => {
        let result = `<strong>${params[0].name}</strong><br/>`
        params.forEach((p: any) => {
          result += `${p.marker} ${p.seriesName}: ¥${p.value.toLocaleString()}<br/>`
        })
        return result
      },
    },
    legend: {
      data: ['等额本息', '等额本金'],
      top: 0,
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: monthLabels,
      axisLine: { lineStyle: { color: '#E5E7EB' } },
      axisLabel: { color: '#6B7280' },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F3F4F6' } },
      axisLabel: { color: '#6B7280', formatter: '¥{value}' },
    },
    series: [
      {
        name: '等额本息',
        type: 'bar',
        data: installmentData,
        itemStyle: { color: '#1E5AA8', borderRadius: [4, 4, 0, 0] },
        barWidth: 24,
      },
      {
        name: '等额本金',
        type: 'bar',
        data: principalData,
        itemStyle: { color: '#2ECC71', borderRadius: [4, 4, 0, 0] },
        barWidth: 24,
      },
    ],
  }
})

const principalInterestPieOption = computed<EChartsOption>(() => {
  const current = loanForm.repaymentType === 'equal_installment'
    ? equalInstallment.value
    : equalPrincipal.value

  return {
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      itemGap: 12,
    },
    series: [
      {
        type: 'pie',
        radius: ['55%', '80%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 },
        label: { show: false },
        labelLine: { show: false },
        data: [
          {
            value: Math.round(loanForm.amount),
            name: '本金',
            itemStyle: { color: '#1E5AA8' },
          },
          {
            value: Math.round(current.totalInterest),
            name: '利息',
            itemStyle: { color: '#F39C12' },
          },
        ],
      },
    ],
  }
})

const paymentChartOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
  series: [
    {
      type: 'pie',
      radius: ['55%', '80%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 },
      label: { show: false },
      labelLine: { show: false },
      data: [
        {
          value: Math.round(paymentResult.value.personalMonthly),
          name: '个人缴纳',
          itemStyle: { color: '#1E5AA8' },
        },
        {
          value: Math.round(paymentResult.value.companyMonthly),
          name: '单位缴纳',
          itemStyle: { color: '#2ECC71' },
        },
      ],
    },
  ],
}))

function formatMoney(v: number) {
  return v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function printSchedule() {
  const schedule = loanForm.repaymentType === 'equal_installment'
    ? equalInstallment.value.schedule
    : equalPrincipal.value.schedule

  let printContent = `
    <html>
      <head>
        <title>公积金还款计划表</title>
        <style>
          body { font-family: "Microsoft YaHei", sans-serif; padding: 20px; }
          h2 { text-align: center; color: #1E5AA8; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: right; font-size: 12px; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .left { text-align: left; }
          .summary { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
          .summary p { margin: 5px 0; }
        </style>
      </head>
      <body>
        <h2>公积金贷款还款计划表</h2>
        <div class="summary">
          <p><strong>贷款金额：</strong>¥${formatMoney(loanForm.amount)}</p>
          <p><strong>贷款年限：</strong>${loanForm.years}年</p>
          <p><strong>年利率：</strong>${loanForm.rate}%</p>
          <p><strong>还款方式：</strong>${loanForm.repaymentType === 'equal_installment' ? '等额本息' : '等额本金'}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th class="left">期数</th>
              <th>月供(元)</th>
              <th>本金(元)</th>
              <th>利息(元)</th>
              <th>剩余本金(元)</th>
            </tr>
          </thead>
          <tbody>
  `
  schedule.forEach((item) => {
    printContent += `
      <tr>
        <td class="left">第${item.month}期</td>
        <td>${formatMoney(item.totalPayment)}</td>
        <td>${formatMoney(item.principal)}</td>
        <td>${formatMoney(item.interest)}</td>
        <td>${formatMoney(item.remainingPrincipal)}</td>
      </tr>
    `
  })
  printContent += `
          </tbody>
        </table>
      </body>
    </html>
  `
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }
}

function exportExcel() {
  const schedule = loanForm.repaymentType === 'equal_installment'
    ? equalInstallment.value.schedule
    : equalPrincipal.value.schedule

  let csv = '期数,月供(元),本金(元),利息(元),剩余本金(元)\n'
  schedule.forEach((item) => {
    csv += `${item.month},${item.totalPayment.toFixed(2)},${item.principal.toFixed(2)},${item.interest.toFixed(2)},${item.remainingPrincipal.toFixed(2)}\n`
  })

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `公积金还款计划_${loanForm.amount}元_${loanForm.years}年.csv`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

function goToMyFund() {
  ElMessage.info('请先登录后查看我的公积金')
}

function goBack() {
  router.push('/tools')
}
</script>

<template>
  <div class="container py-8">
    <button @click="goBack" class="flex items-center gap-2 text-neutral-500 hover:text-gov-blue mb-4 transition-colors">
      <ArrowLeft class="w-4 h-4" />
      <span>返回工具列表</span>
    </button>

    <div class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-xl bg-gov-gradient flex items-center justify-center">
          <Calculator class="w-5 h-5 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-neutral-800">公积金计算器</h1>
      </div>
      <p class="text-neutral-500 ml-13">快速计算公积金贷款还款明细和缴费金额</p>
    </div>

    <div class="card mb-6">
      <div class="flex gap-2">
        <button
          @click="activeTab = 'loan'"
          :class="[
            'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all',
            activeTab === 'loan'
              ? 'bg-gov-gradient text-white shadow-md'
              : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100',
          ]"
        >
          <Building2 class="w-4 h-4" />
          贷款计算器
        </button>
        <button
          @click="activeTab = 'payment'"
          :class="[
            'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all',
            activeTab === 'payment'
              ? 'bg-gov-gradient text-white shadow-md'
              : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100',
          ]"
        >
          <CreditCard class="w-4 h-4" />
          缴费计算器
        </button>
      </div>
    </div>

    <div v-if="activeTab === 'loan'" class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="card">
          <h3 class="section-title">贷款参数</h3>
          <div class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">
                贷款金额：<span class="text-gov-blue font-semibold">¥{{ formatMoney(loanForm.amount) }}</span>
              </label>
              <div class="flex items-center gap-3">
                <el-slider
                  v-model="loanForm.amount"
                  :min="10000"
                  :max="2000000"
                  :step="10000"
                  class="flex-1"
                />
              </div>
              <el-input-number
                v-model="loanForm.amount"
                :min="10000"
                :max="2000000"
                :step="10000"
                class="w-full mt-2"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">贷款年限</label>
              <el-select v-model="loanForm.years" class="w-full">
                <el-option v-for="opt in yearOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">
                年利率：<span class="text-gov-blue font-semibold">{{ loanForm.rate }}%</span>
                <span class="text-xs text-neutral-400 ml-2">（公积金基准利率3.1%）</span>
              </label>
              <el-slider v-model="loanForm.rate" :min="1" :max="6" :step="0.01" />
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">还款方式</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="loanForm.repaymentType = 'equal_installment'"
                  :class="[
                    'py-2.5 rounded-lg text-sm font-medium transition-all',
                    loanForm.repaymentType === 'equal_installment'
                      ? 'bg-gov-blue text-white'
                      : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100',
                  ]"
                >
                  等额本息
                </button>
                <button
                  @click="loanForm.repaymentType = 'equal_principal'"
                  :class="[
                    'py-2.5 rounded-lg text-sm font-medium transition-all',
                    loanForm.repaymentType === 'equal_principal'
                      ? 'bg-gov-blue text-white'
                      : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100',
                  ]"
                >
                  等额本金
                </button>
              </div>
            </div>
            <div class="pt-2 border-t border-neutral-100">
              <button
                @click="showAdvanced = !showAdvanced"
                class="flex items-center gap-2 text-sm text-gov-blue hover:underline"
              >
                <SlidersHorizontal class="w-4 h-4" />
                {{ showAdvanced ? '收起' : '展开' }}高级选项
                <ChevronRight :class="['w-4 h-4 transition-transform', showAdvanced ? 'rotate-90' : '']" />
              </button>
            </div>
            <div v-if="showAdvanced" class="space-y-4 pt-2">
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-2">
                  <Wallet class="w-4 h-4 inline mr-1" />
                  公积金账户余额（元）
                </label>
                <el-input-number v-model="loanForm.fundBalance" :min="0" :max="1000000" :step="1000" class="w-full" />
                <p v-if="maxLoanAmount" class="text-xs text-accent-green mt-2 flex items-center gap-1">
                  <Sparkles class="w-3.5 h-3.5" />
                  根据您的余额，预计可贷额度约 ¥{{ formatMoney(maxLoanAmount) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2 space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="card border-l-4 border-gov-blue">
              <div class="flex items-center gap-2 text-sm text-neutral-500 mb-1">
                <TrendingDown class="w-4 h-4" />
                {{ loanForm.repaymentType === 'equal_installment' ? '等额本息月供' : '等额本金首月' }}
              </div>
              <p class="text-2xl font-bold text-gov-blue">
                ¥ {{ formatMoney(
                  loanForm.repaymentType === 'equal_installment'
                    ? equalInstallment.monthlyPayment
                    : equalPrincipal.firstMonthPayment
                ) }}
              </p>
              <p class="text-xs text-neutral-400 mt-1">
                {{
                  loanForm.repaymentType === 'equal_installment'
                    ? '每月还款金额固定'
                    : `末月：¥${formatMoney(equalPrincipal.lastMonthPayment)}`
                }}
              </p>
            </div>
            <div class="card border-l-4 border-accent-orange">
              <div class="flex items-center gap-2 text-sm text-neutral-500 mb-1">
                <Coins class="w-4 h-4" />
                支付利息
              </div>
              <p class="text-2xl font-bold text-accent-orange">
                ¥ {{ formatMoney(
                  loanForm.repaymentType === 'equal_installment'
                    ? equalInstallment.totalInterest
                    : equalPrincipal.totalInterest
                ) }}
              </p>
              <p class="text-xs text-neutral-400 mt-1">
                还款总额：¥{{
                  formatMoney(
                    loanForm.repaymentType === 'equal_installment'
                      ? equalInstallment.totalPayment
                      : equalPrincipal.totalPayment
                  )
                }}
              </p>
            </div>
          </div>

          <div class="card">
            <h3 class="section-title">还款方式对比</h3>
            <table class="w-full text-sm">
              <thead>
                <tr class="text-neutral-500 border-b border-neutral-100">
                  <th class="text-left py-3 font-medium">还款方式</th>
                  <th class="text-right py-3 font-medium">月供</th>
                  <th class="text-right py-3 font-medium">还款总额</th>
                  <th class="text-right py-3 font-medium">支付利息</th>
                  <th class="text-right py-3 font-medium">利息差额</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  :class="[
                    'border-b border-neutral-50 transition-colors',
                    loanForm.repaymentType === 'equal_installment' ? 'bg-gov-blue/5' : '',
                  ]"
                >
                  <td class="py-3 text-neutral-700 font-medium">
                    <span v-if="loanForm.repaymentType === 'equal_installment'" class="text-gov-blue">● </span>
                    等额本息
                  </td>
                  <td class="py-3 text-right font-medium">¥ {{ formatMoney(equalInstallment.monthlyPayment) }}</td>
                  <td class="py-3 text-right">¥ {{ formatMoney(equalInstallment.totalPayment) }}</td>
                  <td class="py-3 text-right text-accent-orange">¥ {{ formatMoney(equalInstallment.totalInterest) }}</td>
                  <td class="py-3 text-right text-neutral-500">-</td>
                </tr>
                <tr
                  :class="[
                    'transition-colors',
                    loanForm.repaymentType === 'equal_principal' ? 'bg-accent-green/5' : '',
                  ]"
                >
                  <td class="py-3 text-neutral-700 font-medium">
                    <span v-if="loanForm.repaymentType === 'equal_principal'" class="text-accent-green">● </span>
                    等额本金
                  </td>
                  <td class="py-3 text-right font-medium">¥ {{ formatMoney(equalPrincipal.firstMonthPayment) }}</td>
                  <td class="py-3 text-right">¥ {{ formatMoney(equalPrincipal.totalPayment) }}</td>
                  <td class="py-3 text-right text-accent-orange">¥ {{ formatMoney(equalPrincipal.totalInterest) }}</td>
                  <td class="py-3 text-right text-accent-green font-medium">
                    节省 ¥ {{ formatMoney(equalInstallment.totalInterest - equalPrincipal.totalInterest) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="card">
              <h3 class="section-title">前6个月月供对比</h3>
              <v-chart class="h-60" :option="monthlyCompareChartOption" autoresize />
            </div>
            <div class="card">
              <h3 class="section-title">本金利息占比</h3>
              <v-chart class="h-60" :option="principalInterestPieOption" autoresize />
            </div>
          </div>

          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h3 class="section-title mb-0">还款明细</h3>
              <div class="flex items-center gap-2">
                <span class="text-sm text-neutral-500">共 {{ equalInstallment.schedule.length }} 期</span>
                <button @click="printSchedule" class="text-sm text-gov-blue hover:underline flex items-center gap-1">
                  <Printer class="w-4 h-4" />
                  打印
                </button>
                <button @click="exportExcel" class="text-sm text-gov-blue hover:underline flex items-center gap-1">
                  <Download class="w-4 h-4" />
                  导出CSV
                </button>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-neutral-50">
                  <tr class="text-neutral-500">
                    <th class="text-left py-3 px-3 font-medium rounded-l-lg">期数</th>
                    <th class="text-right py-3 px-3 font-medium">月供</th>
                    <th class="text-right py-3 px-3 font-medium">本金</th>
                    <th class="text-right py-3 px-3 font-medium">利息</th>
                    <th class="text-right py-3 px-3 font-medium rounded-r-lg">剩余本金</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in currentSchedule" :key="item.month" class="border-b border-neutral-50 hover:bg-neutral-50">
                    <td class="py-2.5 px-3 text-neutral-600">第 {{ item.month }} 期</td>
                    <td class="py-2.5 px-3 text-right font-medium">¥ {{ formatMoney(item.totalPayment) }}</td>
                    <td class="py-2.5 px-3 text-right text-gov-blue">¥ {{ formatMoney(item.principal) }}</td>
                    <td class="py-2.5 px-3 text-right text-accent-orange">¥ {{ formatMoney(item.interest) }}</td>
                    <td class="py-2.5 px-3 text-right text-neutral-500">¥ {{ formatMoney(item.remainingPrincipal) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
              <span class="text-sm text-neutral-500">第 {{ schedulePage }} / {{ totalPages }} 页</span>
              <div class="flex items-center gap-2">
                <button
                  @click="schedulePage = Math.max(1, schedulePage - 1)"
                  :disabled="schedulePage <= 1"
                  class="p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft class="w-4 h-4" />
                </button>
                <button
                  v-for="p in Math.min(5, totalPages)"
                  :key="p"
                  @click="schedulePage = p"
                  :class="[
                    'w-8 h-8 rounded-lg text-sm transition-all',
                    schedulePage === p ? 'bg-gov-blue text-white' : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100',
                  ]"
                >
                  {{ p }}
                </button>
                <span v-if="totalPages > 5" class="text-neutral-400">...</span>
                <button
                  @click="schedulePage = totalPages"
                  v-if="totalPages > 5"
                  :class="[
                    'w-8 h-8 rounded-lg text-sm transition-all',
                    schedulePage === totalPages ? 'bg-gov-blue text-white' : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100',
                  ]"
                >
                  {{ totalPages }}
                </button>
                <button
                  @click="schedulePage = Math.min(totalPages, schedulePage + 1)"
                  :disabled="schedulePage >= totalPages"
                  class="p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="card">
        <h3 class="section-title">缴费参数</h3>
        <div class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">
              缴存基数：<span class="text-gov-blue font-semibold">¥{{ paymentForm.base }}</span>
            </label>
            <el-slider v-model="paymentForm.base" :min="1000" :max="30000" :step="100" />
            <el-input-number v-model="paymentForm.base" :min="1000" :max="100000" :step="100" class="w-full mt-2" />
          </div>
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">
              个人缴存比例：<span class="text-gov-blue font-semibold">{{ paymentForm.personalRatio }}%</span>
            </label>
            <el-slider v-model="paymentForm.personalRatio" :min="5" :max="20" :step="1" />
          </div>
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">
              单位缴存比例：<span class="text-accent-green font-semibold">{{ paymentForm.companyRatio }}%</span>
            </label>
            <el-slider v-model="paymentForm.companyRatio" :min="5" :max="20" :step="1" />
          </div>
          <div class="pt-2 border-t border-neutral-100">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="paymentForm.hasSupplementary"
                class="w-4 h-4 rounded border-neutral-300 text-gov-blue focus:ring-gov-blue"
              />
              <span class="text-sm text-neutral-700">有补充公积金</span>
            </label>
          </div>
          <div v-if="paymentForm.hasSupplementary" class="space-y-4 p-3 bg-neutral-50 rounded-xl">
            <p class="text-sm text-neutral-500 font-medium">补充公积金</p>
            <div>
              <label class="block text-xs text-neutral-600 mb-1">
                个人比例：{{ paymentForm.supplementaryPersonalRatio }}%
              </label>
              <el-slider v-model="paymentForm.supplementaryPersonalRatio" :min="1" :max="10" :step="1" />
            </div>
            <div>
              <label class="block text-xs text-neutral-600 mb-1">
                单位比例：{{ paymentForm.supplementaryCompanyRatio }}%
              </label>
              <el-slider v-model="paymentForm.supplementaryCompanyRatio" :min="1" :max="10" :step="1" />
            </div>
          </div>
        </div>
        <div class="mt-6 pt-4 border-t border-neutral-100">
          <button
            @click="goToMyFund"
            class="w-full py-2.5 rounded-lg border border-gov-blue text-gov-blue text-sm font-medium hover:bg-gov-blue/5 transition-colors flex items-center justify-center gap-2"
          >
            <Eye class="w-4 h-4" />
            查看我的公积金
          </button>
        </div>
      </div>

      <div class="lg:col-span-2 space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="card border-l-4 border-gov-blue">
            <div class="flex items-center gap-2 text-sm text-neutral-500 mb-1">
              <User class="w-4 h-4" />
              个人月缴
            </div>
            <p class="text-2xl font-bold text-gov-blue">¥ {{ formatMoney(paymentResult.personalMonthly) }}</p>
            <p v-if="paymentForm.hasSupplementary" class="text-xs text-neutral-400 mt-1">
              基本 ¥{{ formatMoney(paymentResult.personalBasic) }} + 补充 ¥{{ formatMoney(paymentResult.personalSupplementary) }}
            </p>
          </div>
          <div class="card border-l-4 border-accent-green">
            <div class="flex items-center gap-2 text-sm text-neutral-500 mb-1">
              <Building class="w-4 h-4" />
              单位月缴
            </div>
            <p class="text-2xl font-bold text-accent-green">¥ {{ formatMoney(paymentResult.companyMonthly) }}</p>
            <p v-if="paymentForm.hasSupplementary" class="text-xs text-neutral-400 mt-1">
              基本 ¥{{ formatMoney(paymentResult.companyBasic) }} + 补充 ¥{{ formatMoney(paymentResult.companySupplementary) }}
            </p>
          </div>
          <div class="card border-l-4 border-accent-orange">
            <div class="flex items-center gap-2 text-sm text-neutral-500 mb-1">
              <Coins class="w-4 h-4" />
              月缴总额
            </div>
            <p class="text-2xl font-bold text-accent-orange">¥ {{ formatMoney(paymentResult.totalMonthly) }}</p>
            <p class="text-xs text-neutral-400 mt-1">进入个人账户</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div class="card">
            <h3 class="section-title">年度汇总</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between py-2 border-b border-neutral-100">
                <span class="text-neutral-600 flex items-center gap-2">
                  <User class="w-4 h-4 text-gov-blue" />
                  个人年度缴存
                </span>
                <span class="font-semibold text-gov-blue">¥ {{ formatMoney(paymentResult.personalMonthly * 12) }}</span>
              </div>
              <div class="flex items-center justify-between py-2 border-b border-neutral-100">
                <span class="text-neutral-600 flex items-center gap-2">
                  <Building class="w-4 h-4 text-accent-green" />
                  单位年度缴存
                </span>
                <span class="font-semibold text-accent-green">¥ {{ formatMoney(paymentResult.companyMonthly * 12) }}</span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-neutral-700 font-medium flex items-center gap-2">
                  <Wallet class="w-4 h-4 text-accent-orange" />
                  年度账户总额
                </span>
                <span class="font-bold text-lg text-accent-orange">¥ {{ formatMoney(paymentResult.totalYearly) }}</span>
              </div>
            </div>
          </div>

          <div class="card">
            <h3 class="section-title">缴纳构成</h3>
            <div class="flex items-center">
              <v-chart class="w-40 h-40 flex-shrink-0" :option="paymentChartOption" autoresize />
              <div class="flex-1 space-y-3 ml-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full bg-gov-blue"></span>
                    <span class="text-sm text-neutral-600">个人缴纳</span>
                  </div>
                  <span class="font-medium">{{ paymentForm.personalRatio }}%</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full bg-accent-green"></span>
                    <span class="text-sm text-neutral-600">单位缴纳</span>
                  </div>
                  <span class="font-medium">{{ paymentForm.companyRatio }}%</span>
                </div>
                <div v-if="paymentForm.hasSupplementary" class="pt-3 mt-3 border-t border-neutral-100">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs text-neutral-500">补充公积金个人</span>
                    <span class="text-xs font-medium">{{ paymentForm.supplementaryPersonalRatio }}%</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-neutral-500">补充公积金单位</span>
                    <span class="text-xs font-medium">{{ paymentForm.supplementaryCompanyRatio }}%</span>
                  </div>
                </div>
                <div class="pt-3 mt-3 border-t border-neutral-100">
                  <div class="flex items-center gap-2 text-sm text-neutral-500">
                    <Calendar class="w-4 h-4" />
                    <span>每月入账：</span>
                    <span class="font-semibold text-neutral-800">¥ {{ formatMoney(paymentResult.totalMonthly) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
