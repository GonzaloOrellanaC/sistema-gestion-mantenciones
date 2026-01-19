import inventoryService from './inventoryService';

// Thin wrapper for clarity and future extension. Export same functions as default from inventoryService.
export const getStock = inventoryService.getStock;
export const reservePart = inventoryService.reservePart;
export const consumePart = inventoryService.consumePart;
export const adjustStock = inventoryService.adjustStock;
export const transferStock = inventoryService.transferStock;
export const listMovements = inventoryService.listMovements;

export default { getStock, reservePart, consumePart, adjustStock, transferStock, listMovements };
