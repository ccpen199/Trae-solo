<template>
  <div class="date-picker">
    <input 
      type="text" 
      :value="modelValue"
      @input="handleInput"
      @focus="showCalendar = true"
      @blur="handleBlur"
      :disabled="disabled"
      placeholder="选择日期"
      class="date-input"
    />
    <div v-if="showCalendar" class="date-calendar">
      <div class="calendar-header">
        <button @click="prevMonth">‹</button>
        <span>{{ currentYear }}年{{ currentMonth + 1 }}月</span>
        <button @click="nextMonth">›</button>
      </div>
      <div class="calendar-weekdays">
        <span v-for="day in weekdays" :key="day">{{ day }}</span>
      </div>
      <div class="calendar-days">
        <div 
          v-for="(day, index) in calendarDays" 
          :key="index"
          :class="getDayClass(day)"
          @click="selectDate(day)"
        >
          {{ day.day }}
          <span v-if="isHoliday(day)" class="holiday-tag">{{ getHolidayTag(day) }}</span>
        </div>
      </div>
      <div class="calendar-footer">
        <button @click="selectToday">今天</button>
        <button @click="selectDefault">默认</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  modelValue: String,
  disabled: Boolean
})

const emit = defineEmits(['update:modelValue', 'change'])

const showCalendar = ref(false)
const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const today = new Date()

const currentDate = ref(new Date())
const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())

const holidays = {
  '2024-01-01': '元旦',
  '2024-02-10': '春节',
  '2024-04-04': '清明',
  '2024-05-01': '劳动节',
  '2024-06-08': '端午',
  '2024-09-15': '中秋',
  '2024-10-01': '国庆',
  '2024-12-25': '圣诞'
}

const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days = []

  const startPadding = firstDay.getDay()
  for (let i = 0; i < startPadding; i++) {
    days.push({ day: null, date: null })
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i)
    days.push({
      day: i,
      date: date.toISOString().split('T')[0],
      isToday: isToday(date),
      isPast: isPast(date),
      isWeekend: isWeekend(date),
      isHoliday: isHoliday(date)
    })
  }

  return days
})

const isToday = (date) => {
  return date.toDateString() === today.toDateString()
}

const isPast = (date) => {
  return date < new Date(today.toDateString())
}

const isWeekend = (date) => {
  const day = date.getDay()
  return day === 0 || day === 6
}

const isHoliday = (day) => {
  return day.date && holidays[day.date]
}

const getHolidayTag = (day) => {
  return holidays[day.date] || ''
}

const getDayClass = (day) => {
  if (!day.day) return 'empty'
  const classes = ['day']
  if (day.isToday) classes.push('today')
  if (day.isPast) classes.push('past')
  if (day.isWeekend) classes.push('weekend')
  if (day.date === props.modelValue) classes.push('selected')
  return classes.join(' ')
}

const prevMonth = () => {
  const date = new Date(currentDate.value)
  date.setMonth(date.getMonth() - 1)
  currentDate.value = date
}

const nextMonth = () => {
  const date = new Date(currentDate.value)
  date.setMonth(date.getMonth() + 1)
  currentDate.value = date
}

const selectDate = (day) => {
  if (!day.day || day.isPast) return
  emit('update:modelValue', day.date)
  emit('change', day.date)
  showCalendar.value = false
}

const selectToday = () => {
  const date = today.toISOString().split('T')[0]
  emit('update:modelValue', date)
  emit('change', date)
  showCalendar.value = false
}

const selectDefault = () => {
  const defaultDate = new Date(today)
  defaultDate.setDate(today.getDate() + 2)
  const date = defaultDate.toISOString().split('T')[0]
  emit('update:modelValue', date)
  emit('change', date)
  showCalendar.value = false
}

const handleInput = (e) => {
  const value = e.target.value
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    emit('update:modelValue', value)
    emit('change', value)
  }
}

const handleBlur = () => {
  setTimeout(() => {
    showCalendar.value = false
  }, 200)
}

onMounted(() => {
  if (!props.modelValue) {
    const defaultDate = new Date(today)
    defaultDate.setDate(today.getDate() + 2)
    emit('update:modelValue', defaultDate.toISOString().split('T')[0])
  }
})
</script>

<style scoped>
.date-picker {
  position: relative;
}

.date-input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
}

.date-input:focus {
  border-color: #ff6c00;
}

.date-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.date-calendar {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 5px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  padding: 15px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.calendar-header button {
  width: 30px;
  height: 30px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
}

.calendar-header button:hover {
  background: #eee;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 10px;
  font-size: 12px;
  color: #999;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}

.day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.3s;
  font-size: 14px;
}

.day:hover:not(.past):not(.empty) {
  background: #ff6c00;
  color: white;
}

.day.empty {
  cursor: default;
}

.day.today {
  background: #ff6c00;
  color: white;
}

.day.past {
  color: #ccc;
  cursor: not-allowed;
}

.day.weekend {
  color: #ff6c00;
}

.day.selected {
  background: #ff6c00;
  color: white;
  box-shadow: 0 0 0 2px rgba(255, 108, 0, 0.3);
}

.holiday-tag {
  font-size: 8px;
  color: #ff6c00;
}

.calendar-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.calendar-footer button {
  padding: 6px 12px;
  border: none;
  background: #f5f5f5;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
}

.calendar-footer button:hover {
  background: #eee;
}
</style>