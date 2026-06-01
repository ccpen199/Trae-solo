import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref({
    id: 1,
    username: 'admin',
    name: '管理员',
    org_id: null,
    role: 'admin',
    org_name: '系统'
  })

  const users = [
    { id: 1, username: 'admin', name: '管理员', org_id: null, role: 'admin', org_name: '系统' },
    { id: 2, username: 'owner', name: '业主代表', org_id: 1, role: 'owner', org_name: '业主单位' },
    { id: 3, username: 'designer', name: '设计师', org_id: 2, role: 'designer', org_name: '设计院' },
    { id: 4, username: 'builder', name: '施工员', org_id: 3, role: 'builder', org_name: '施工单位' },
    { id: 5, username: 'supervisor', name: '监理工程师', org_id: 4, role: 'supervisor', org_name: '监理单位' }
  ]

  const isAdmin = computed(() => currentUser.value.role === 'admin')
  const isOwner = computed(() => currentUser.value.role === 'owner')
  const isDesigner = computed(() => currentUser.value.role === 'designer')
  const isBuilder = computed(() => currentUser.value.role === 'builder')
  const isSupervisor = computed(() => currentUser.value.role === 'supervisor')
  
  const userOrgId = computed(() => currentUser.value.org_id)

  function setUser(user) {
    currentUser.value = { ...user }
  }

  function canAssign() {
    return isAdmin.value || isOwner.value
  }

  function canFix(issue) {
    if (!issue.responsible_org_id) return false
    return issue.responsible_org_id === userOrgId.value
  }

  function canVerify() {
    return isAdmin.value || isSupervisor.value || isOwner.value
  }

  function canClose() {
    return isAdmin.value || isOwner.value
  }

  return {
    currentUser,
    users,
    isAdmin,
    isOwner,
    isDesigner,
    isBuilder,
    isSupervisor,
    userOrgId,
    setUser,
    canAssign,
    canFix,
    canVerify,
    canClose
  }
})
