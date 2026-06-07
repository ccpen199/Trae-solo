import { useAppStore } from '@/stores/appStore'

export default function Profile() {
  const currentUser = useAppStore((s) => s.currentUser)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">个人中心</h1>
        <p className="text-sm text-gray-500 mt-1">账号信息、权限范围与调度工作偏好</p>
      </div>

      <div className="card p-5 grid grid-cols-3 gap-4">
        <div>
          <div className="text-xs text-gray-500">姓名</div>
          <div className="text-base font-medium text-gray-900 mt-1">{currentUser.name}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">角色</div>
          <div className="text-base font-medium text-gray-900 mt-1">{currentUser.role}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">权限</div>
          <div className="text-base font-medium text-gray-900 mt-1">后台管理、订单调度、骑手审核</div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-3">我的待办</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border border-gray-100 p-4">
            <div className="text-2xl font-bold text-primary">12</div>
            <div className="text-sm text-gray-500 mt-1">待调度订单</div>
          </div>
          <div className="rounded-md border border-gray-100 p-4">
            <div className="text-2xl font-bold text-amber-500">5</div>
            <div className="text-sm text-gray-500 mt-1">待审核骑手</div>
          </div>
          <div className="rounded-md border border-gray-100 p-4">
            <div className="text-2xl font-bold text-red-500">3</div>
            <div className="text-sm text-gray-500 mt-1">风险告警</div>
          </div>
        </div>
      </div>
    </div>
  )
}
