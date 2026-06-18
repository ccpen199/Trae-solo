interface Step {
  label: string;
}

interface StatusStepsProps {
  steps: Step[];
  current: number;
  rejected?: boolean;
}

export default function StatusSteps({ steps, current, rejected }: StatusStepsProps) {
  return (
    <div className="flex items-center">
      {steps.map((step, idx) => {
        const isDone = idx < current;
        const isCurrent = idx === current;
        const isPending = idx > current;

        return (
          <div key={idx} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors ${
                  isDone
                    ? 'bg-success-500 border-success-500 text-white'
                    : isCurrent
                    ? rejected
                      ? 'bg-danger-500 border-danger-500 text-white'
                      : 'bg-primary-700 border-primary-700 text-white'
                    : 'bg-white border-neutral-300 text-neutral-400'
                }`}
              >
                {isDone ? '✓' : idx + 1}
              </div>
              <span
                className={`mt-1.5 text-xs whitespace-nowrap ${
                  isDone
                    ? 'text-success-600'
                    : isCurrent
                    ? rejected
                      ? 'text-danger-500'
                      : 'text-primary-700'
                    : 'text-neutral-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`w-16 h-0.5 mx-1 mb-5 transition-colors ${
                  isDone ? 'bg-success-500' : 'bg-neutral-300'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
