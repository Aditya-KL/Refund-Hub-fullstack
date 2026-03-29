import { Check } from 'lucide-react';

export type ClaimStage = 'applied' | 'verified' | 'approved' | 'refunded';

interface ProgressStepperProps {
  currentStage: ClaimStage;
  isRejected?: boolean;
}

export function ProgressStepper({ currentStage, isRejected }: ProgressStepperProps) {
  const stages = [
    { id: 'applied', label: 'Applied', description: 'Student ID submitted' },
    { id: 'verified', label: 'Verified', description: 'Secretary/Lead review' },
    { id: 'approved', label: 'Approved', description: 'Finance sign-off' },
    { id: 'refunded', label: 'Refunded', description: 'Funds released' },
  ];

  const stageOrder = ['applied', 'verified', 'approved', 'refunded'];
  const currentStageIndex = stageOrder.indexOf(currentStage);

  const getStageStatus = (index: number) => {
    if (isRejected && index > 0) {
      return 'rejected';
    }
    if (index < currentStageIndex) {
      return 'completed';
    }
    if (index === currentStageIndex) {
      return 'current';
    }
    return 'pending';
  };

  return (
    <div className="w-full">
      {/* Desktop/Tablet - Horizontal Stepper */}
      <div className="hidden sm:block">
        <div className="flex items-start justify-between gap-3">
          {stages.map((stage, index) => {
            const status = getStageStatus(index);
            const isLast = index === stages.length - 1;

            return (
              <div key={stage.id} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center flex-shrink-0 w-full">
                  {/* Circle */}
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                      ${
                        status === 'completed'
                          ? 'bg-green-600 border-green-600'
                          : status === 'current'
                          ? 'bg-green-600 border-green-600 ring-4 ring-green-100'
                          : status === 'rejected'
                          ? 'bg-red-600 border-red-600'
                          : 'bg-white border-gray-300'
                      }
                    `}
                  >
                    {status === 'completed' || status === 'current' ? (
                      <Check className="text-white" size={20} strokeWidth={3} />
                    ) : status === 'rejected' ? (
                      <span className="text-white text-lg font-bold">✕</span>
                    ) : (
                      <span className="text-gray-400 font-semibold text-sm">{index + 1}</span>
                    )}
                  </div>

                  {/* Label */}
                  <div className="mt-3 text-center w-full px-1">
                    <p
                      className={`text-sm font-semibold leading-tight ${
                        status === 'completed' || status === 'current'
                          ? 'text-green-700'
                          : status === 'rejected'
                          ? 'text-red-700'
                          : 'text-gray-500'
                      }`}
                    >
                      {stage.label}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1.5 leading-snug hidden md:block break-words">
                      {stage.description}
                    </p>
                  </div>
                </div>

                {/* Connector Line */}
                {!isLast && (
                  <div
                    className={`
                      h-0.5 flex-1 mx-3 transition-all mt-[-45px]
                      ${
                        status === 'completed'
                          ? 'bg-green-600'
                          : status === 'rejected'
                          ? 'bg-red-600'
                          : 'bg-gray-300'
                      }
                    `}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile - Vertical Stepper */}
      <div className="sm:hidden space-y-4">
        {stages.map((stage, index) => {
          const status = getStageStatus(index);

          return (
            <div key={stage.id} className="flex items-start gap-3">
              {/* Left side - Circle and line */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all flex-shrink-0
                    ${
                      status === 'completed'
                        ? 'bg-green-600 border-green-600'
                        : status === 'current'
                        ? 'bg-green-600 border-green-600 ring-4 ring-green-100'
                        : status === 'rejected'
                        ? 'bg-red-600 border-red-600'
                        : 'bg-white border-gray-300'
                    }
                  `}
                >
                  {status === 'completed' || status === 'current' ? (
                    <Check className="text-white" size={16} strokeWidth={3} />
                  ) : status === 'rejected' ? (
                    <span className="text-white text-sm font-bold">✕</span>
                  ) : (
                    <span className="text-gray-400 font-semibold text-xs">{index + 1}</span>
                  )}
                </div>
                {index < stages.length - 1 && (
                  <div
                    className={`
                      w-0.5 h-12 transition-all
                      ${
                        status === 'completed'
                          ? 'bg-green-600'
                          : status === 'rejected'
                          ? 'bg-red-600'
                          : 'bg-gray-300'
                      }
                    `}
                  />
                )}
              </div>

              {/* Right side - Content */}
              <div className="flex-1 pb-4">
                <p
                  className={`font-semibold ${
                    status === 'completed' || status === 'current'
                      ? 'text-green-700'
                      : status === 'rejected'
                      ? 'text-red-700'
                      : 'text-gray-500'
                  }`}
                >
                  {stage.label}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{stage.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}