import React from 'react';
import { IonButton } from '@ionic/react';
import { useTranslation } from 'react-i18next';

const twemojiSrc = (emoji: string) => {
  const codePoints = Array.from(emoji).map(c => c.codePointAt(0)!.toString(16)).join('-');
  return `https://twemoji.maxcdn.com/v/latest/72x72/${codePoints}.png`;
};

const LanguageToggle: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 20 }) => {
  const { i18n } = useTranslation();

  const currentIsEs = !!(i18n.language && i18n.language.startsWith('es'));

  const toggle = () => {
    const newLang = currentIsEs ? 'en' : 'es';
    i18n.changeLanguage(newLang);
    try { localStorage.setItem('appLanguage', newLang); } catch {}
  };

  return (
    <IonButton fill={'clear'} onClick={toggle} className={className}>
      <img
        src={twemojiSrc(currentIsEs ? '🇨🇱' : '🇺🇸')}
        alt={currentIsEs ? 'ES' : 'EN'}
        style={{ width: size, height: size, marginRight: 8, verticalAlign: 'middle' }}
      />
      <span style={{ fontWeight: 600 }}>{currentIsEs ? 'ES' : 'EN'}</span>
    </IonButton>
  );
};

export default LanguageToggle;
