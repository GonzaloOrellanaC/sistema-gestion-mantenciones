import React from 'react';

export const WidgetContainer: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <div className={className ? `widget-container ${className}` : 'widget-container'}>
      {children}
    </div>
  );
};
