import type { OrderStepId } from "@/lib/order-draft";

type OrderStep = {
  id: OrderStepId;
  title: string;
  description: string;
};

type StepNavigationProps = {
  activeStepId: OrderStepId;
  activeStepIndex: number;
  steps: OrderStep[];
  onSelectStep: (stepId: OrderStepId, stepIndex: number) => void;
};

export function StepNavigation({
  activeStepId,
  activeStepIndex,
  onSelectStep,
  steps
}: StepNavigationProps) {
  const progress = ((activeStepIndex + 1) / steps.length) * 100;

  return (
    <nav aria-label="Шаги оформления заказа">
      <div className="sm:hidden">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="font-semibold text-ink">{steps[activeStepIndex].title}</span>
          <span className="text-muted">{activeStepIndex + 1} из {steps.length}</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden bg-line">
          <div className="h-full bg-cobalt transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <ol className="relative hidden grid-cols-5 gap-3 before:absolute before:left-[10%] before:right-[10%] before:top-5 before:h-px before:bg-line sm:grid">
        {steps.map((step, index) => (
          <li className="relative min-w-0 text-center" key={step.id}>
            <button
              aria-current={step.id === activeStepId ? "step" : undefined}
              className="focus-ring group w-full text-center text-sm"
              onClick={() => onSelectStep(step.id, index)}
              type="button"
            >
              <span
                className={`relative mx-auto grid h-10 w-10 place-items-center rounded-full border font-semibold transition ${
                  step.id === activeStepId
                    ? "border-ink bg-ink text-white"
                    : index < activeStepIndex
                      ? "border-cobalt bg-cobalt text-white"
                      : "border-line bg-white text-muted"
                }`}
              >
                {index + 1}
              </span>
              <span className={`mt-2 block truncate font-semibold ${
                index <= activeStepIndex ? "text-ink" : "text-muted"
              }`}>
                {step.title}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
