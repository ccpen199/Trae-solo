import { ref, computed } from 'vue'

const users = [
  { id: 1, name: '张教授', role: 'applicant', department: '计算机学院' },
  { id: 2, name: '李主任', role: 'approver', department: '科研处' },
  { id: 3, name: '王会计', role: 'finance', department: '财务处' },
  { id: 4, name: '管理员', role: 'admin', department: '系统管理' }
]

const currentUser = ref(JSON.parse(localStorage.getItem('currentUser') || 'null') || users[0])

const roleLabels = {
  applicant: '申请人',
  approver: '审批人',
  finance: '财务',
  admin: '管理员'
}

export function useUser() {
  const userName = computed(() => currentUser.value.name)
  const userRole = computed(() => currentUser.value.role)
  const userRoleLabel = computed(() => roleLabels[currentUser.value.role] || currentUser.value.role)
  
  const canApprove = computed(() => 
    ['approver', 'finance', 'admin'].includes(currentUser.value.role)
  )
  
  const canSubmit = computed(() => 
    ['applicant', 'admin'].includes(currentUser.value.role)
  )

  const switchUser = (user) => {
    currentUser.value = user
    localStorage.setItem('currentUser', JSON.stringify(user))
  }

  return {
    users,
    currentUser,
    userName,
    userRole,
    userRoleLabel,
    canApprove,
    canSubmit,
    switchUser,
    roleLabels
  }
}
