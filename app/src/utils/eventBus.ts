const bus = new EventTarget();

export type WorkOrderUpdatedDetail = {
  id: string;
  workOrder?: any;
};

export function emitWorkOrderUpdated(detail: WorkOrderUpdatedDetail) {
  try {
    const ev = new CustomEvent('workorder:updated', { detail });
    bus.dispatchEvent(ev);
  } catch (e) {
    // safe noop
    console.warn('emitWorkOrderUpdated failed', e);
  }
}

export function onWorkOrderUpdated(cb: (ev: CustomEvent<WorkOrderUpdatedDetail>) => void) {
  const wrapper = (e: Event) => cb(e as CustomEvent<WorkOrderUpdatedDetail>);
  bus.addEventListener('workorder:updated', wrapper as EventListener);
  return () => bus.removeEventListener('workorder:updated', wrapper as EventListener);
}

export default { emitWorkOrderUpdated, onWorkOrderUpdated };
