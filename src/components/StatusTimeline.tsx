import { motion } from "framer-motion";
import { Check, Clock } from "lucide-react";

export interface TimelineStep {
  label: string;
  description?: string;
  time?: string;
  icon?: typeof Check;
}

interface StatusTimelineProps {
  steps: TimelineStep[];
  currentIndex: number;
  variant?: "vertical" | "horizontal";
}

export default function StatusTimeline({
  steps,
  currentIndex,
  variant = "vertical",
}: StatusTimelineProps) {
  if (variant === "horizontal") {
    return (
      <div className="flex items-start justify-between w-full">
        {steps.map((step, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          const StatusIcon = step.icon ?? (isDone ? Check : Clock);
          return (
            <div key={i} className="flex flex-1 flex-col items-center text-center">
              <div className="relative flex w-full items-center justify-center">
                {i < steps.length - 1 && (
                  <div
                    className={`absolute left-1/2 top-5 h-0.5 w-full -translate-y-1/2 ${
                      isDone ? "bg-gradient-to-r from-forest-500 to-forest-400" : "bg-ink-700"
                    }`}
                  />
                )}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1, type: "spring" }}
                  className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full ring-4 ring-ink-800 ${
                    isDone
                      ? "bg-gradient-to-br from-forest-400 to-forest-600 text-ink-950"
                      : isCurrent
                      ? "bg-gradient-to-br from-gold-400 to-gold-600 text-ink-950 shadow-gold-sm"
                      : "bg-ink-700 text-ink-400"
                  }`}
                >
                  <StatusIcon className="h-5 w-5" />
                </motion.div>
              </div>
              <div className="mt-3 px-2">
                <p
                  className={`text-sm font-semibold ${
                    isDone || isCurrent ? "text-ink-100" : "text-ink-500"
                  }`}
                >
                  {step.label}
                </p>
                {step.time && (
                  <p className="mt-0.5 text-xs text-ink-400">{step.time}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <ol className="relative space-y-4 pl-1">
      {steps.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isLast = i === steps.length - 1;
        const StatusIcon = step.icon ?? (isDone ? Check : Clock);
        return (
          <li key={i} className="relative pl-8">
            {!isLast && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "calc(100% + 0.25rem)", opacity: 1 }}
                transition={{ delay: i * 0.08 }}
                className={`absolute left-[11px] top-7 w-0.5 ${
                  isDone ? "bg-gradient-to-b from-forest-500 to-forest-400" : "bg-ink-700"
                }`}
              />
            )}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1, type: "spring" }}
              className={`absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-ink-800 ${
                isDone
                  ? "bg-gradient-to-br from-forest-400 to-forest-600 text-ink-950"
                  : isCurrent
                  ? "bg-gradient-to-br from-gold-400 to-gold-600 text-ink-950 shadow-gold-sm"
                  : "bg-ink-700 text-ink-400"
              }`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
            </motion.div>
            <div>
              <p
                className={`text-sm font-semibold ${
                  isDone || isCurrent ? "text-ink-100" : "text-ink-500"
                }`}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="mt-0.5 text-xs text-ink-400">{step.description}</p>
              )}
              {step.time && (
                <p className="mt-0.5 text-[11px] text-ink-500">{step.time}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
