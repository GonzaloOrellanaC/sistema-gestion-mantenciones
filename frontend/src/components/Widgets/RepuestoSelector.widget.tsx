import PartSelector, { PartSelector as _PartSelector } from './PartSelector.widget';

// Deprecated compatibility wrapper: re-export the new `PartSelector` as `RepuestoSelector`.
export const RepuestoSelector = PartSelector as unknown as typeof _PartSelector;
export default RepuestoSelector;
