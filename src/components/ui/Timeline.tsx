
import { motion } from 'framer-motion';
import type { TimelineItem } from '@/types';

interface TimelineProps {
  items: TimelineItem[];
}

function Timeline({ items }: TimelineProps) {
  return (
    <div className="timeline">
      {items.map((item, index) => (
        <TimelineItemComponent key={item.id} item={item} index={index} />
      ))}
    </div>
  );
}

function TimelineItemComponent({ item, index }: { item: TimelineItem; index: number }) {
  return (
    <motion.article
      className="timeline-item"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
    >
      <div className="timeline-dot" />
      <div>
        <span>{item.eventTime}</span>
        <h3>{item.stage} · {item.operator}</h3>
        <p>{item.description}</p>
        <small>
          {item.location}
          {item.temperature ? ` · ${item.temperature}°C` : ''}
          {item.humidity ? ` · 湿度 ${item.humidity}%` : ''}
        </small>
      </div>
    </motion.article>
  );
}

export default Timeline;
