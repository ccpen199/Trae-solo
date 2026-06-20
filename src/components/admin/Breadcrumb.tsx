import { motion } from "framer-motion";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-ink-300">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-1.5 text-ink-400 transition-colors hover:text-gold-500"
      >
        <Home className="h-4 w-4" />
        <span>首页</span>
      </motion.button>
      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.08 }}
          className="flex items-center gap-2"
        >
          <ChevronRight className="h-4 w-4 text-ink-500" />
          {item.href ? (
            <a href={item.href} className="text-ink-400 transition-colors hover:text-gold-500">
              {item.label}
            </a>
          ) : (
            <span className="font-medium text-gold-400">{item.label}</span>
          )}
        </motion.div>
      ))}
    </nav>
  );
}
