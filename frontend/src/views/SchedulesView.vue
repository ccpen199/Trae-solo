<template>
  <div>
    <div class="layout">
      <div class="panel">
        <div class="panel-head">
          <h2>排课列表</h2>
          <span>{{ data?.length || 0 }} 节</span>
        </div>
        <div class="table-wrap">
          <table v-if="data && data.length">
            <thead>
              <tr>
                <th style="width: 30px;"></th>
                <th>日期</th>
                <th>时间</th>
                <th>班级</th>
                <th>科目</th>
                <th>教师</th>
                <th>教室</th>
                <th>容量</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="s in data" :key="s.id">
                <tr class="schedule-row" :class="{ expanded: expandedScheduleId === s.id }" @click="toggleScheduleExpand(s.id)">
                  <td>
                    <span class="expand-icon">{{ expandedScheduleId === s.id ? '−' : '+' }}</span>
                  </td>
                  <td>{{ s.course_date }}</td>
                  <td>{{ s.start_time }}-{{ s.end_time }}</td>
                  <td><strong>{{ s.class_name }}</strong></td>
                  <td>{{ s.subject }}</td>
                  <td>{{ s.teacher_name }}</td>
                  <td>{{ s.classroom_name }}</td>
                  <td>{{ s.enrolled_count || 0 }}/{{ s.capacity }}</td>
                  <td><span :class="['badge', s.status]">{{ statusText(s.status) }}</span></td>
                </tr>
                <tr v-if="expandedScheduleId === s.id" class="attendance-detail-row">
                  <td colspan="9">
                    <div class="attendance-detail">
                      <div class="detail-title">学员签到名单</div>
                      <div v-if="scheduleAttendances[s.id] && scheduleAttendances[s.id].length">
                        <table class="inner-table">
                          <thead>
                            <tr>
                              <th>学员姓名</th>
                              <th>家长电话</th>
                              <th>剩余课时</th>
                              <th>签到状态</th>
                              <th>签到时间</th>
                              <th>消耗课时</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="a in scheduleAttendances[s.id]" :key="a.id">
                              <td><strong>{{ a.student_name }}</strong></td>
                              <td>{{ a.parent_phone || '-' }}</td>
                              <td>{{ a.remaining_hours?.toFixed(1) || 0 }}</td>
                              <td><span :class="['badge', attendanceStatusClass(a.status)]">{{ attendanceStatusText(a.status) }}</span></td>
                              <td>{{ a.checkin_time || '-' }}</td>
                              <td>{{ a.consume_hours?.toFixed(1) || 0 }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div v-else-if="loadingAttendance === s.id" class="empty">加载中...</div>
                      <div v-else class="empty">暂无签到记录</div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
          <div v-else class="empty">暂无排课</div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2>新增排课</h2>
        </div>
        <div class="form-stack">
          <div v-if="formErrors.length" class="error-box">
            <div v-for="(err, idx) in formErrors" :key="idx" class="error-item">
              <span class="error-dot">!</span> {{ err }}
            </div>
          </div>
          <div class="form-group">
            <label>选择班级 *</label>
            <select v-model="form.class_id" @change="onClassChange">
              <option :value="null">请选择班级</option>
              <option v-for="c in classes" :key="c.id" :value="c.id">
                {{ c.name }} ({{ c.subject }})
              </option>
            </select>
          </div>

          <div v-if="selectedClassStudents.length" class="enrolled-students">
            <div class="section-title">
              <strong>已报名学员</strong>
              <span class="muted">{{ selectedClassStudents.length }} 人</span>
            </div>
            <div class="student-list">
              <div v-for="sc in selectedClassStudents" :key="sc.id" class="student-item">
                <span class="student-name">{{ sc.student_name }}</span>
                <span class="student-phone">{{ sc.parent_phone || '-' }}</span>
              </div>
            </div>
          </div>

          <div class="capacity-check">
            <div class="section-title"><strong>容量校验</strong></div>
            <div class="capacity-grid">
              <div class="capacity-item">
                <span class="capacity-label">班级容量</span>
                <span class="capacity-value">{{ selectedClass?.capacity || 0 }} 人</span>
              </div>
              <div class="capacity-item">
                <span class="capacity-label">已报名人数</span>
                <span class="capacity-value">{{ enrolledCount }} 人</span>
              </div>
              <div class="capacity-item">
                <span class="capacity-label">设置容量</span>
                <span class="capacity-value">{{ effectiveCapacity }} 人</span>
              </div>
            </div>
            <div v-if="capacityWarning" class="capacity-warning">
              <span class="warning-icon">!</span> {{ capacityWarning }}
            </div>
          </div>

          <div class="conflict-check" v-if="form.course_date && form.start_time && form.end_time">
            <div class="section-title"><strong>时间冲突检查</strong></div>
            <div class="conflict-grid">
              <div class="conflict-item" :class="{ conflict: teacherConflict }">
                <span class="conflict-label">教师占用</span>
                <span v-if="loadingConflict">检查中...</span>
                <span v-else-if="teacherConflict" class="conflict-value bad">
                  <span class="conflict-icon">!</span> 冲突
                </span>
                <span v-else class="conflict-value good">
                  <span class="ok-icon">✓</span> 空闲
                </span>
              </div>
              <div class="conflict-item" :class="{ conflict: classroomConflict }">
                <span class="conflict-label">教室占用</span>
                <span v-if="loadingConflict">检查中...</span>
                <span v-else-if="classroomConflict" class="conflict-value bad">
                  <span class="conflict-icon">!</span> 冲突
                </span>
                <span v-else class="conflict-value good">
                  <span class="ok-icon">✓</span> 空闲
                </span>
              </div>
            </div>
            <div v-if="teacherConflictInfo" class="conflict-detail">
              <div class="conflict-title">教师冲突详情</div>
              <div class="conflict-item-detail">{{ teacherConflictInfo }}</div>
            </div>
            <div v-if="classroomConflictInfo" class="conflict-detail">
              <div class="conflict-title">教室冲突详情</div>
              <div class="conflict-item-detail">{{ classroomConflictInfo }}</div>
            </div>
          </div>

          <div class="form-group">
            <label>上课日期 *</label>
            <input v-model="form.course_date" type="date" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>开始时间 *</label>
              <input v-model="form.start_time" type="time" />
            </div>
            <div class="form-group">
              <label>结束时间 *</label>
              <input v-model="form.end_time" type="time" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>授课教师</label>
              <select v-model="form.teacher_id">
                <option :value="null">使用班级默认</option>
                <option v-for="t in teachers" :key="t.id" :value="t.id">
                  {{ t.name }} ({{ t.subject }})
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>教室</label>
              <select v-model="form.classroom_id">
                <option :value="null">使用班级默认</option>
                <option v-for="r in classrooms" :key="r.id" :value="r.id">
                  {{ r.name }} ({{ r.capacity }}人)
                </option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>容量</label>
            <input v-model.number="form.capacity" type="number" min="1" placeholder="留空使用班级容量" />
          </div>
          <div class="form-group">
            <label>教案</label>
            <textarea v-model="form.lesson_plan" placeholder="课程内容与教案备注" rows="2"></textarea>
          </div>
          <button class="btn-primary" @click="handleSubmit">
            安排课程
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue';

const props = defineProps({
  data: { type: Array, default: () => [] },
  classes: { type: Array, default: () => [] },
  teachers: { type: Array, default: () => [] },
  classrooms: { type: Array, default: () => [] },
  studentClasses: { type: Array, default: () => [] }
});

const emit = defineEmits(['add-schedule']);

const form = reactive({
  class_id: null,
  course_date: '',
  start_time: '',
  end_time: '',
  teacher_id: null,
  classroom_id: null,
  capacity: null,
  lesson_plan: ''
});

const formErrors = ref([]);
const expandedScheduleId = ref(null);
const scheduleAttendances = reactive({});
const loadingAttendance = ref(null);
const loadingConflict = ref(false);
const teacherConflict = ref(false);
const classroomConflict = ref(false);
const teacherConflictInfo = ref('');
const classroomConflictInfo = ref('');

watch(
  () => [form.class_id, form.course_date, form.start_time, form.end_time, form.teacher_id, form.classroom_id],
  () => {
    checkConflicts();
  },
  { deep: true }
);

const selectedClass = computed(() => {
  if (!form.class_id) return null;
  return props.classes.find(c => c.id === form.class_id);
});

const selectedClassStudents = computed(() => {
  if (!form.class_id) return [];
  return props.studentClasses.filter(sc => sc.class_id === form.class_id && sc.status === 'enrolled');
});

const enrolledCount = computed(() => selectedClassStudents.value.length);

const effectiveCapacity = computed(() => {
  if (form.capacity && form.capacity > 0) return form.capacity;
  return selectedClass.value?.capacity || 0;
});

const capacityWarning = computed(() => {
  if (effectiveCapacity.value > 0 && effectiveCapacity.value < enrolledCount.value) {
    return '容量不能小于已报名人数';
  }
  return '';
});

function statusText(status) {
  const map = { scheduled: '待上课', completed: '已完成', cancelled: '已取消' };
  return map[status] || status;
}

function attendanceStatusText(status) {
  const map = {
    reserved: '待签到',
    normal: '已出勤',
    leave: '已请假',
    absent: '已旷课',
    makeup: '已补课',
    trial: '已试听'
  };
  return map[status] || status;
}

function attendanceStatusClass(status) {
  const map = {
    reserved: 'pending',
    normal: 'active',
    leave: 'pending',
    absent: 'pending',
    makeup: 'active',
    trial: 'active'
  };
  return map[status] || '';
}

function onClassChange() {
  formErrors.value = [];
}

function calcDurationMinutes(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

async function checkConflicts() {
  if (!form.course_date || !form.start_time || !form.end_time || !form.class_id) {
    return;
  }
  
  const teacherId = form.teacher_id || selectedClass.value?.teacher_id;
  const classroomId = form.classroom_id || selectedClass.value?.classroom_id;
  
  if (!teacherId && !classroomId) {
    return;
  }
  
  loadingConflict.value = true;
  teacherConflict.value = false;
  classroomConflict.value = false;
  teacherConflictInfo.value = '';
  classroomConflictInfo.value = '';
  
  try {
    const params = new URLSearchParams({
      course_date: form.course_date,
      start_time: form.start_time,
      end_time: form.end_time
    });
    if (teacherId) params.append('teacher_id', teacherId);
    if (classroomId) params.append('classroom_id', classroomId);
    
    const res = await fetch(`/api/schedules/check-conflict?${params}`);
    const data = await res.json();
    
    if (data.teacher_conflict) {
      teacherConflict.value = true;
      teacherConflictInfo.value = `${data.teacher_name} 在 ${form.course_date} ${data.conflict_schedule.start_time}-${data.conflict_schedule.end_time} 已有 ${data.conflict_schedule.class_name} 课程`;
    }
    
    if (data.classroom_conflict) {
      classroomConflict.value = true;
      classroomConflictInfo.value = `${data.classroom_name} 在 ${form.course_date} ${data.conflict_schedule.start_time}-${data.conflict_schedule.end_time} 已有 ${data.conflict_schedule.class_name} 课程`;
    }
  } catch (e) {
    console.error('Conflict check failed:', e);
  } finally {
    loadingConflict.value = false;
  }
}

function validateForm() {
  const errors = [];
  
  if (!form.class_id || !form.course_date || !form.start_time || !form.end_time) {
    errors.push('请填写必填项');
  }
  
  const duration = calcDurationMinutes(form.start_time, form.end_time);
  if (form.start_time && form.end_time) {
    if (duration <= 0) {
      errors.push('结束时间必须晚于开始时间');
    } else if (duration < 30) {
      errors.push('课程时长至少30分钟');
    }
  }
  
  if (effectiveCapacity.value > 0 && effectiveCapacity.value < enrolledCount.value) {
    errors.push('容量不能小于已报名人数');
  }
  
  if (teacherConflict.value) {
    errors.push('所选教师在此时间段已有课程安排冲突');
  }
  
  if (classroomConflict.value) {
    errors.push('所选教室在此时间段已有课程安排冲突');
  }
  
  formErrors.value = errors;
  return errors.length === 0;
}

async function toggleScheduleExpand(scheduleId) {
  if (expandedScheduleId.value === scheduleId) {
    expandedScheduleId.value = null;
    return;
  }
  
  expandedScheduleId.value = scheduleId;
  
  if (!scheduleAttendances[scheduleId]) {
    loadingAttendance.value = scheduleId;
    try {
      const res = await fetch(`/api/schedules/${scheduleId}`);
      const data = await res.json();
      scheduleAttendances[scheduleId] = data.attendances || [];
    } catch (e) {
      scheduleAttendances[scheduleId] = [];
    } finally {
      loadingAttendance.value = null;
    }
  }
}

async function handleSubmit() {
  if (!validateForm()) {
    return;
  }
  try {
    await emit('add-schedule', { ...form });
    Object.assign(form, {
      class_id: null,
      course_date: '',
      start_time: '',
      end_time: '',
      teacher_id: null,
      classroom_id: null,
      capacity: null,
      lesson_plan: ''
    });
    formErrors.value = [];
  } catch (e) {
    formErrors.value = [e.message || '排课失败'];
  }
}
</script>

<style scoped>
.form-stack { display: grid; gap: 12px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-group { display: grid; gap: 6px; }
.form-group label { font-size: 13px; color: #657789; font-weight: 600; }
.form-group input, .form-group select, .form-group textarea {
  padding: 9px 12px; border: 1px solid #dce3ea; border-radius: 6px; font-size: 14px; background: white;
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
  outline: none; border-color: #1677ff;
}
.btn-primary {
  margin-top: 8px; padding: 11px 16px; background: #1677ff; color: white;
  border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 14px;
}
.btn-primary:hover { background: #0958d9; }

.schedule-row {
  cursor: pointer;
  transition: background-color 0.2s;
}
.schedule-row:hover {
  background-color: #f5f7fa;
}
.schedule-row.expanded {
  background-color: #e6f4ff;
}
.expand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: #e6f4ff;
  color: #1677ff;
  border-radius: 4px;
  font-weight: 700;
  font-size: 14px;
}

.attendance-detail-row {
  background: #fafbfc;
}
.attendance-detail {
  padding: 16px 20px;
}
.detail-title {
  font-weight: 700;
  color: #17212b;
  margin-bottom: 12px;
  font-size: 14px;
}
.inner-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.inner-table th {
  text-align: left;
  padding: 10px 12px;
  background: #f0f2f5;
  color: #657789;
  font-weight: 600;
  border-bottom: 1px solid #dce3ea;
}
.inner-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #edf1f5;
}

.enrolled-students {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px 16px;
}
.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
}
.section-title .muted {
  color: #a9b6c3;
  font-weight: 500;
}
.student-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.student-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  border: 1px solid #dce3ea;
}
.student-name {
  font-weight: 600;
  color: #17212b;
}
.student-phone {
  color: #657789;
  font-size: 12px;
}

.capacity-check {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px 16px;
}
.capacity-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 8px;
}
.capacity-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: white;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #dce3ea;
}
.capacity-label {
  font-size: 12px;
  color: #657789;
}
.capacity-value {
  font-size: 18px;
  font-weight: 700;
  color: #17212b;
}
.capacity-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 12px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  color: #c53030;
  font-size: 13px;
  font-weight: 600;
}
.warning-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: #c53030;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
}

.conflict-check {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px 16px;
}
.conflict-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 8px;
}
.conflict-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: white;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #dce3ea;
}
.conflict-item.conflict {
  border-color: #ffccc7;
  background: #fff2f0;
}
.conflict-label {
  font-size: 12px;
  color: #657789;
}
.conflict-value {
  font-size: 14px;
  font-weight: 700;
}
.conflict-value.good {
  color: #52c41a;
}
.conflict-value.bad {
  color: #ff4d4f;
}
.conflict-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: #ff4d4f;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  margin-right: 4px;
}
.ok-icon {
  margin-right: 4px;
}
.conflict-detail {
  margin-top: 12px;
  padding: 10px 12px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
}
.conflict-title {
  font-size: 12px;
  font-weight: 700;
  color: #c53030;
  margin-bottom: 4px;
}
.conflict-item-detail {
  font-size: 13px;
  color: #c53030;
}

.error-box {
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  padding: 12px 16px;
}
.error-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #c53030;
  font-size: 13px;
  font-weight: 500;
  padding: 4px 0;
}
.error-item + .error-item {
  border-top: 1px solid #ffccc7;
  padding-top: 8px;
  margin-top: 4px;
}
.error-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: #c53030;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
}

.muted { color: #a9b6c3; }
</style>
