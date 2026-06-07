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
  return (
    <nav aria-label="Шаги оформления заказа" className="grid gap-2 sm:grid-cols-3">
      {steps.map((step, index) => (
        <button
          aria-current={step.id === activeStepId ? "step" : undefined}
          className={`focus-ring min-h-12 border px-3 py-2 text-left text-sm transition ${
            step.id === activeStepId
              ? "border-ink bg-ink text-white"
              : index <= activeStepIndex
                ? "border-cobalt/30 bg-cobalt/10 text-cobalt"
                : "border-line bg-white text-muted"
          }`}
          key={step.id}
          onClick={() => onSelectStep(step.id, index)}
          type="button"
        >
          <span className="block text-xs font-semibold uppercase">Шаг {index + 1} из {steps.length}</span>
          <span className="mt-1 block font-semibold">{step.title}</span>
        </button>
      ))}
    </nav>
  );
}
