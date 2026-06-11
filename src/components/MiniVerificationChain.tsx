import { motion } from 'framer-motion';
import {
  UserCheck,
  FileCheck2,
  Eye,
  Blocks,
  CheckCircle2,
} from 'lucide-react';

interface MiniVerificationChainProps {
  className?: string;
}

const steps = [
  { icon: UserCheck, label: '经纪人认证' },
  { icon: FileCheck2, label: '业主授权' },
  { icon: Eye, label: 'VR水印' },
  { icon: Blocks, label: '链上存证' },
];

export default function MiniVerificationChain({ className }: MiniVerificationChainProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="flex items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                className="flex items-center gap-1"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-down/10">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent-down" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-neutral-500">{step.label}</span>
                </div>
                <Icon className="h-3 w-3 text-accent-down" />
              </motion.div>
              {i < steps.length - 1 && (
                <div className="mx-1 h-px w-4 bg-accent-down/30 sm:mx-2 sm:w-6" />
              )}
            </div>
          );
        })}
      </div>
      <button className="mt-2 text-xs text-primary-800 hover:text-primary-600 hover:underline">
        查看核验详情
      </button>
    </div>
  );
}
