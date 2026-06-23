import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, QrCode, MapPin, User, Battery, CreditCard } from 'lucide-react'
import { cn } from '@shared/utils'
import { useUserStore } from '@shared/stores/userStore'
import { useAlertStore } from '@shared/stores/alertStore'

const navItems = [
  { path: '/rider/home', label: '首页', icon: Home },
  { path: '/rider/scan', label: '扫码', icon: QrCode },
  { path: '/rider/battery', label: '电池', icon: Battery },
  { path: '/rider/package', label: '套餐', icon: CreditCard },
  { path: '/rider/profile', label: '我的', icon: User },
]

export default function RiderLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentRider } = useUserStore()
  const { unreadCount } = useAlertStore()

  const isScanPage = location.pathname.includes('/scan') || location.pathname.includes('/swap')
  const isPaymentPage = location.pathname.includes('/payment')

  const showTabNav = !isScanPage && !isPaymentPage

  return (
    <div className="h-full w-full max-w-md mx-auto bg-cyber-darker flex flex-col relative overflow-hidden">
      {showTabNav && currentRider && (
        <header className="flex-shrink-0 px-4 py-3 bg-cyber-dark/80 backdrop-blur border-b border-cyber-border z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyber-accent to-cyber-success flex items-center justify-center">
                <Battery className="w-5 h-5 text-cyber-darker" />
              </div>
              <span className="font-rajdhani font-bold text-lg text-cyber-accent glow-text">
                换电侠
              </span>
            </div>
            <div className="flex items-center gap-3">
              {currentRider.current_soc !== undefined && currentRider.current_soc < 20 && (
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-cyber-danger/20 border border-cyber-danger/50"
                >
                  <span className="text-xs text-cyber-danger font-medium">
                    电量低
                  </span>
                </motion.div>
              )}
              {unreadCount > 0 && (
                <div className="relative">
                  <MapPin className="w-5 h-5 text-cyber-muted" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyber-danger text-white text-xs flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {showTabNav && (
        <nav className="flex-shrink-0 bg-cyber-dark/90 backdrop-blur border-t border-cyber-border z-20">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path ||
                (item.path === '/rider/home' && location.pathname === '/rider/')
              const isScan = item.path === '/rider/scan'

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all relative',
                    isActive
                      ? 'text-cyber-accent'
                      : 'text-cyber-muted hover:text-cyber-accent/70',
                    isScan && 'relative -mt-6'
                  )}
                >
                  {isScan ? (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyber-accent to-cyber-success flex items-center justify-center shadow-neon-cyan">
                      <QrCode className="w-7 h-7 text-cyber-darker" />
                    </div>
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                  <span
                      className={cn(
                        'text-xs font-rajdhani font-medium',
                        isScan && 'mt-1'
                      )}
                    >
                      {item.label}
                    </span>
                  {isActive && !isScan && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute bottom-0 w-1 h-1 rounded-full bg-cyber-accent"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
