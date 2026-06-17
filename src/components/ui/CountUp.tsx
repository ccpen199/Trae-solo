import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn, formatCurrency } from "@/utils";

interface CountUpProps {
  end: number;
  start?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  format?: "number" | "currency" | "percent";
  separator?: boolean;
  className?: string;
}

export function CountUp({
  end,
  start = 0,
  duration = 1.5,
  decimals = 0,
  prefix = "",
  suffix = "",
  format = "number",
  separator = true,
  className,
}: CountUpProps) {
  const [value, setValue] = useState(start);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;
    setValue(start);

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const progress = Math.min(
        (timestamp - startTimeRef.current) / (duration * 1000),
        1
      );
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = start + (end - start) * easeProgress;

      setValue(currentValue);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [end, start, duration]);

  const formatValue = (val: number) => {
    if (format === "currency") {
      return formatCurrency(val);
    }
    if (format === "percent") {
      return val.toFixed(decimals) + "%";
    }

    const fixed = val.toFixed(decimals);
    if (separator) {
      const parts = fixed.split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
    }
    return fixed;
  };

  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("font-bold tabular-nums", className)}
    >
      {prefix}
      {formatValue(value)}
      {suffix}
    </motion.span>
  );
}
