// Server canonical state values (English)
export const WORK_ORDER_STATES = {
  CREATED: 'created',
  ASSIGNED: 'assigned',
  STARTED: 'in_progress',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

export type WorkOrderStateValue = typeof WORK_ORDER_STATES[keyof typeof WORK_ORDER_STATES];

// Map canonical server state -> i18n key
export const STATE_TO_LOCALE_KEY: Record<WorkOrderStateValue, string> = {
  'created': 'workorder.state.created',
  'assigned': 'workorder.state.assigned',
  'in_progress': 'workorder.state.in_progress',
  'under_review': 'workorder.state.under_review',
  'approved': 'workorder.state.approved',
  'rejected': 'workorder.state.rejected'
};

export function getLocaleKeyForState(s: WorkOrderStateValue | string) {
  return (STATE_TO_LOCALE_KEY as any)[s] || s;
}
