export const WORK_ORDER_STATES_ARRAY = ['created', 'assigned', 'in_progress', 'under_review', 'approved', 'rejected'] as const;

export const WORK_ORDER_STATES = {
  CREATED: 'created',
  ASSIGNED: 'assigned',
  STARTED: 'in_progress',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

export type WorkOrderStateValue = typeof WORK_ORDER_STATES_ARRAY[number];

// Mapping from server state (English) to locale key for frontend translation (here identical)
export const STATE_TO_LOCALE_KEY: Record<WorkOrderStateValue, string> = {
  'created': 'created',
  'assigned': 'assigned',
  'in_progress': 'in_progress',
  'under_review': 'under_review',
  'approved': 'approved',
  'rejected': 'rejected'
};

export function getLocaleKeyForState(state: WorkOrderStateValue) {
  return STATE_TO_LOCALE_KEY[state] || state;
}
