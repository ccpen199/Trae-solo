
import { motion } from 'framer-motion';
import type { Metric } from '@/types';
import { getToneColor } from '@/utils/format';

interface MetricCardProps {
  metric: Metric;
  index?: number;
}

function MetricCard({ metric, index = 0 }: MetricCardProps) {
  const color = getToneColor(metric.tone);

  return (
    <motion.article
      className={`metric-card ${metric.tone}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.08 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <span>{metric.label}</span>
      <strong>{metric.value}</strong>
      <em style={{ color }}>{metric.delta}</em>
      <div className="metric-glow" style={{ background: color }} />
    </motion.article>
  );
}

export default MetricCard;
