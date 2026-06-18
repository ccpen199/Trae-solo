import { motion } from 'framer-motion'
import { Lightbulb, TrendingUp } from 'lucide-react'

interface OptimizationTipsProps {
  tips: string[]
}

export default function OptimizationTips({ tips }: OptimizationTipsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-gradient-to-r from-warning/5 to-primary/5 rounded-xl p-4 border border-warning/20"
    >
      <h3 className="font-medium text-gray-900 text-sm mb-3 flex items-center gap-2">
        <Lightbulb size={16} className="text-warning" />
        优化建议
      </h3>
      <div className="space-y-2">
        {tips.map((tip, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
            className="flex items-start gap-2 text-sm"
          >
            <TrendingUp size={14} className="text-success mt-0.5 shrink-0" />
            <span className="text-gray-600">{tip}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
