import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  CheckCircle,
} from "lucide-react";
import { useAppStore } from "@/stores";
import { Breadcrumb } from "./Breadcrumb";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, getRoleLabel } from "@/utils";

export function Topbar() {
  const { currentUser, todos } = useAppStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const pendingTodos = todos.filter(
    (t) => t.priority === "high" || t.priority === "medium"
  );

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-6">
        <Breadcrumb />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索议案、工单、业主..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {pendingTodos.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingTodos.length}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-modal border border-slate-200 overflow-hidden"
              >
                <div className="p-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800">待办事项</h3>
                  <p className="text-sm text-slate-500">
                    您有 {pendingTodos.length} 条待处理事项
                  </p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {pendingTodos.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
                      <p>暂无待办事项</p>
                    </div>
                  ) : (
                    pendingTodos.slice(0, 5).map((todo) => (
                      <div
                        key={todo.id}
                        className="p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full mt-2",
                              todo.priority === "high"
                                ? "bg-rose-500"
                                : todo.priority === "medium"
                                ? "bg-amber-500"
                                : "bg-slate-400"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 text-sm truncate">
                              {todo.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {todo.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant={
                                  todo.type === "approval"
                                    ? "warning"
                                    : todo.type === "vote"
                                    ? "primary"
                                    : todo.type === "ticket"
                                    ? "info"
                                    : "default"
                                }
                                size="sm"
                              >
                                {todo.type}
                              </Badge>
                              <span className="text-xs text-slate-400">
                                {todo.createdAt}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-slate-100">
                  <Button variant="ghost" size="sm" className="w-full">
                    查看全部
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-3 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-trust-500 rounded-full flex items-center justify-center">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-slate-800">
                {currentUser.name}
              </p>
              <p className="text-xs text-slate-500">
                {getRoleLabel(currentUser.role)}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-modal border border-slate-200 overflow-hidden"
              >
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-trust-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {currentUser.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {getRoleLabel(currentUser.role)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    个人中心
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    系统设置
                  </Link>
                </div>
                <div className="border-t border-slate-100 py-2">
                  <button className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors">
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
