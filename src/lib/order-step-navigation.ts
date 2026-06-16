import type { OrderStepId } from "@/lib/order-draft";

export type InvalidOrderStep = {
  error: string;
  index: number;
  stepId: OrderStepId;
};

export function findFirstInvalidStepBeforeTarget(
  targetStepIndex: number,
  stepIds: readonly OrderStepId[],
  getStepError: (stepId: OrderStepId, index: number) => string | null | undefined
): InvalidOrderStep | null {
  const lastIndexBeforeTarget = Math.min(Math.max(targetStepIndex, 0), stepIds.length);

  for (let index = 0; index < lastIndexBeforeTarget; index += 1) {
    const stepId = stepIds[index];
    const error = getStepError(stepId, index);

    if (error) {
      return { error, index, stepId };
    }
  }

  return null;
}
