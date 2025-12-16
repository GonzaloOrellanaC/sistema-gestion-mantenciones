// crea un context para los estilos globales de la app
import React, { createContext, useContext, useState, ReactNode } from 'react';
interface StylingContextInterface {
    colorPrimaryDefault: string;
    colorSecondaryDefault: string;
    borderRadiusDefault: number;
    setColorPrimaryDefault: (color: string) => void;
    setColorSecondaryDefault: (color: string) => void;
    setBorderRadiusDefault: (radius: number) => void;
}
const StylingContext = createContext<StylingContextInterface | undefined>(undefined);

export const StylingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [colorPrimaryDefault, setColorPrimaryDefault] = useState<string>('#3880ff'); // valor por defecto de Ionic
    const [colorSecondaryDefault, setColorSecondaryDefault] = useState<string>('#3dc2ff'); // valor por defecto de Ionic
    const [borderRadiusDefault, setBorderRadiusDefault] = useState<number>(4); // valor por defecto
    return (
        <StylingContext.Provider value={{
            colorPrimaryDefault,
            colorSecondaryDefault,
            borderRadiusDefault,
            setColorPrimaryDefault,
            setColorSecondaryDefault,
            setBorderRadiusDefault
        }}>
            {children}
        </StylingContext.Provider>
    );
};

export const useStylingContext = (): StylingContextInterface => {
    const context = useContext(StylingContext);
    if (!context) {
        throw new Error('useStylingContext must be used within a StylingProvider');
    }
    return context;
};
