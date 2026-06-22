import { motion } from 'framer-motion';
import { User, Bike, Radio, Wallet } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import type { UserRole } from '../../types';
import { cn } from '../../utils';

interface RoleOption {
  role: UserRole;
  label: string;
  icon: typeof User;
}

const roleOptions: RoleOption[] = [
  { role: 'user', label: '用户端', icon: User },
  { role: 'rider', label: '骑手端', icon: Bike },
  { role: 'dispatcher', label: '调度中心', icon: Radio },
  { role: 'finance', label: '财务中心', icon: Wallet },
];

export function RoleSwitcher() {
  const currentRole = useAppStore((s) => s.currentRole);
  const setRole = useAppStore((s) => s.setRole);

  return (
    <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
      {roleOptions.map(({ role, label, icon: Icon }) => {
        const isActive = currentRole === role;
        return (
          <button
            key={role}
            onClick={() => setRole(role)}
            className={cn(
              'relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors z-10',
              isActive ? 'text-white' : 'text-white/60 hover:text-white/90',
            )}
          >
            {isActive && (
              <motion.div
                layoutId="role-switcher-bg"
                className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/30"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span className="whitespace-nowrap">{label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default RoleSwitcher;
