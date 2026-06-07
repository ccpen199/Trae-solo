import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LockClosedIcon,
  ArrowLeftIcon,
  HomeIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import useAuthStore from '../store/authStore'

const ForbiddenPage = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogoutAndRedirect = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const getRedirectUrl = () => {
    if (!user) return '/login'
    const roleRedirectMap = {
      user: '/',
      enterprise: '/enterprise',
      admin: '/admin',
    }
    return roleRedirectMap[user.role] || '/'
  }

  const getRoleName = () => {
    const roleNameMap = {
      user: '职场人',
      enterprise: '企业HR',
      admin: '福利商城运营',
    }
    return roleNameMap[user?.role] || '用户'
  }

  const getRoleHomeName = () => {
    const roleHomeMap = {
      user: '个人工作台',
      enterprise: '企业HR工作台',
      admin: '运营管理后台',
    }
    return roleHomeMap[user?.role] || '首页'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <LockClosedIcon className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">403</h1>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">访问被拒绝</h2>
            <p className="text-gray-500 mb-8">
              您当前的身份权限不足以访问此页面
            </p>
          </div>

          {user && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <InformationCircleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">权限说明</p>
                  <p className="text-sm text-amber-700 mt-1">
                    当前登录身份：<span className="font-semibold">{user.name}</span>
                    （<span className="font-semibold">{getRoleName()}</span>）
                  </p>
                  <p className="text-sm text-amber-700">
                    您的权限范围仅限「{getRoleHomeName()}」及相关业务功能
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Link
              to={getRedirectUrl()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
            >
              <HomeIcon className="w-5 h-5" />
              返回我的工作台
            </Link>

            <button
              onClick={() => navigate(-1)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              返回上一页
            </button>

            <button
              onClick={handleLogoutAndRedirect}
              className="w-full py-3 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
            >
              切换账号，重新登录
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-indigo-200 text-sm">
          <p>
            如果您认为这是错误，请联系系统管理员核实您的账号权限配置
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForbiddenPage
