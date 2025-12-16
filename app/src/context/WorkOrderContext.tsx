// crea un contexto para las ordenes de trabajo
import React, { createContext, useContext, useState, ReactNode } from 'react';
type WorkOrderContextType = {
  struct: any;
  setStruct: (s: any) => void;
};
const WorkOrderContext = createContext<WorkOrderContextType | undefined>(undefined);

export const WorkOrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [struct, setStruct] = useState<any>(null);
  return (
    <WorkOrderContext.Provider value={{ struct, setStruct }}>
      {children}
    </WorkOrderContext.Provider>
  );
}
export const useWorkOrder = () => {
  const context = useContext(WorkOrderContext);
    if (context === undefined) {
    throw new Error('useWorkOrder must be used within a WorkOrderProvider');
  }
    return context;
}