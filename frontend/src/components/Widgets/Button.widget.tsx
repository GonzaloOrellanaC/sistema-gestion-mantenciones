import React from 'react';
import { IonButton } from '@ionic/react';
import './Button.widget.scss';

interface AppButtonProps extends React.ComponentProps<typeof IonButton> {
  variant?: 'primary' | 'secondary';
}

const AppButton: React.FC<AppButtonProps> = ({ variant = 'primary', className = '', children, ...rest }) => {
  const classes = `app-btn ${variant === 'primary' ? 'app-btn-primary' : 'app-btn-secondary'} ${className}`.trim();
  return (
    <IonButton className={classes} {...rest}>
      {children}
    </IonButton>
  );
};

export default AppButton;
