import { Check } from 'lucide-react';

interface Step {
  label: string;
}

interface Props {
  steps: Step[];
  currentStep: number;    // 1-indexed
  completedSteps: number[]; // 1-indexed
}

export default function StepIndicator({ steps, currentStep, completedSteps }: Props) {
  return (
    <div className="w-full" aria-label="Booking progress">
      <ol className="flex items-start justify-center gap-0">
        {steps.map((step, idx) => {
          const stepNum   = idx + 1;
          const isCompleted = completedSteps.includes(stepNum);
          const isCurrent   = stepNum === currentStep;
          const isLast      = idx === steps.length - 1;

          return (
            <li key={stepNum} className="flex items-start flex-1 min-w-0">
              {/* Step circle + label */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0 w-full">
                {/* Circle */}
                <div
                  className={[
                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all',
                    isCompleted
                      ? 'bg-gold-500 text-navy-950 ring-0'
                      : isCurrent
                      ? 'bg-navy-950 text-white ring-2 ring-gold-500 ring-offset-2'
                      : 'bg-white text-blue-gray ring-2 ring-navy-200',
                  ].join(' ')}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    <span>{stepNum}</span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={[
                    'text-xs text-center leading-tight px-1',
                    isCompleted ? 'text-gold-500 font-medium'
                    : isCurrent  ? 'text-navy-900 font-semibold'
                    : 'text-blue-gray',
                  ].join(' ')}
                >
                  {step.label}
                  {isCompleted && (
                    <span className="sr-only"> (completed)</span>
                  )}
                </span>
              </div>

              {/* Connector line — rendered between steps, not after the last */}
              {!isLast && (
                <div className="flex items-start pt-4 flex-1 min-w-0 mx-1">
                  <div
                    className={[
                      'h-0.5 w-full transition-colors',
                      isCompleted ? 'bg-gold-500' : 'bg-navy-200',
                    ].join(' ')}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
