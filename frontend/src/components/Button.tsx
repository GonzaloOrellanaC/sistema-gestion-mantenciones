import React from 'react';
import { IonButton } from '@ionic/react';

interface ButtonProps extends React.ComponentProps<typeof IonButton> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  
  // Map our custom variants to IonButton props
  let fill: 'solid' | 'outline' | 'clear' | 'default' = 'solid';
  let color: string = 'primary';
  
  switch (variant) {
    case 'primary':
      fill = 'solid';
      color = 'primary';
      break;
    case 'secondary':
      fill = 'solid';
      color = 'secondary';
      break;
    case 'outline':
      fill = 'outline';
      color = 'primary';
      break;
    case 'ghost':
      fill = 'clear';
      color = 'tertiary';
      break;
  }

  return (
    <IonButton
      fill={fill}
      color={color}
      expand={fullWidth ? 'block' : undefined}
      className={`font-medium ${className}`}
      {...props}
    >
      {children}
    </IonButton>
  );
};