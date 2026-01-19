import React from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon } from '@ionic/react';
import { Feature } from '../types';

interface FeatureCardProps {
  feature: Feature;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ feature }) => {
  return (
    <IonCard className="m-0 h-full shadow-sm hover:shadow-lg transition-all duration-300 border border-sgm-variant group bg-white">
      <IonCardHeader>
        <div className="h-12 w-12 rounded-xl bg-sgm-variant flex items-center justify-center mb-4 group-hover:bg-sgm-primary transition-colors duration-300">
          <IonIcon 
            icon={feature.icon} 
            className="text-sgm-primary group-hover:text-white transition-colors duration-300 text-2xl" 
          />
        </div>
        <IonCardTitle className="text-xl font-bold text-sgm-text mb-2">
          {feature.title}
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent className="text-sgm-tertiary/80 leading-relaxed text-sm">
        {feature.description}
      </IonCardContent>
    </IonCard>
  );
};