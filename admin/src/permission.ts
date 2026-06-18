import router from './router'
import { useUserStore } from './store/user'
import { ElMessage } from 'element-plus'
import NProgress from 'nprogress'

const whiteList = ['/login', '/404']

const routePathToKey: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/citizens': 'citizens', '/citizens/list': 'citizens', '/citizens/tags': 'citizens', '/citizens/behavior': 'citizens',
  '/services': 'services', '/services/list': 'services', '/services/orchestration': 'services', '/services/departments': 'services',
  '/knowledge': 'knowledge', '/knowledge/policies': 'knowledge', '/knowledge/qa': 'knowledge', '/knowledge/graph': 'knowledge',
  '/feedback': 'feedback', '/feedback/workorders': 'feedback', '/feedback/clusters': 'feedback', '/feedback/analytics': 'feedback',
  '/offline': 'offline', '/offline/packages': 'offline', '/offline/certs': 'offline',
  '/system': 'system', '/system/logs': 'system', '/system/health': 'system'
}

function checkRoutePermission(userStore: ReturnType<typeof useUserStore>, toPath: string): boolean {
  if (userStore.userInfo?.role === 'admin') return true
  const key = routePathToKey[toPath]
  if (!key) return true
  return !!userStore.userInfo?.allowedRoutes?.includes(key)
}

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()
  const token = userStore.token

  if (token) {
    if (to.path === '/login') {
      next('/dashboard')
      NProgress.done()
    } else {
      if (!userStore.userInfo) {
        try {
          await userStore.fetchUserInfo()
        } catch (err) {
          await userStore.logout()
          ElMessage.error('登录状态失效，请重新登录')
          next(`/login?redirect=${to.path}`)
          NProgress.done()
          return
        }
      }

      if (!checkRoutePermission(userStore, to.path)) {
        ElMessage.warning(`当前角色「${userStore.userInfo?.roleName}」无权限访问该模块`)
        next('/dashboard')
        NProgress.done()
        return
      }

      next()
    }
  } else {
    if (whiteList.includes(to.path) || to.meta.noAuth) {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
      NProgress.done()
    }
  }
})
