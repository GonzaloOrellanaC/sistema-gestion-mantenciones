import React, { useMemo, useState } from 'react';
import { useLanguage } from '../LanguageContext';

const Plans: React.FC = () => {
    const { t, language } = useLanguage();
    const [useClp, setUseClp] = useState(false);

    const RATE = 900; // 1 USD = 900 CLP

    const formatClp = (n: number) => new Intl.NumberFormat('es-CL').format(Math.round(n));

    const convertFeatureText = (text: string) => {
        if (!useClp) return text;
        // Replace occurrences like '5 USD' or '100 USD' with CLP
        return text.replace(/(\d+(?:[\.,]\d+)?)\s*USD/gi, (_, num) => {
            const parsed = Number(num.replace(',', '.')) || 0;
            return `${formatClp(parsed * RATE)} CLP`;
        });
    };

    const plans = useMemo(() => t.pricing.plans, [t]);

    const twemojiSrc = (emoji: string) => {
        const codePoints = Array.from(emoji).map(c => c.codePointAt(0)!.toString(16)).join('-');
        return `https://twemoji.maxcdn.com/v/latest/72x72/${codePoints}.png`;
    };

    const FlagImg: React.FC<{emoji: string; alt: string}> = ({ emoji, alt }) => (
        <img src={twemojiSrc(emoji)} alt={alt} className="inline-block ml-2 w-5 h-4 object-contain" />
    );

    const toggleLabel = useClp ? (
        <span className="inline-flex items-center">
            <span>{t.pricing.currencyToggle.toUSD}</span>
            <FlagImg emoji={'🇺🇸'} alt="US flag" />
        </span>
    ) : (
        <span className="inline-flex items-center">
            <span>{t.pricing.currencyToggle.toCLP}</span>
            <FlagImg emoji={'🇨🇱'} alt="Chile flag" />
        </span>
    );

    return (
        <section id="pricing" className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-[#89C2D9] font-bold tracking-wide uppercase text-sm mb-2">{t.pricing.sectionTitle}</h2>
                        <h3 className="text-2xl md:text-3xl font-bold text-[#4A5568]">{t.pricing.mainTitle}</h3>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setUseClp(prev => !prev)}
                            className="inline-flex items-center px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm shadow-sm hover:bg-gray-50"
                        >
                            {toggleLabel}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {plans.map((plan: any) => {
                        const baseUsd = plan.priceUsd || 0;
                        const recurringUsd = plan.recurringUsd || 0;
                        const monthLabel = language === 'es' ? '/ mes' : '/ month';
                        const recurringLabel = language === 'es' ? 'mensual' : 'monthly';

                        const displayedPrice = useClp
                            ? (recurringUsd > 0
                                ? `${formatClp(baseUsd * RATE)} CLP + ${formatClp(recurringUsd * RATE)} CLP ${monthLabel}`
                                : `${formatClp(baseUsd * RATE)} CLP ${monthLabel}`)
                            : (recurringUsd > 0
                                ? `${baseUsd} USD + ${recurringUsd} USD ${recurringLabel}`
                                : `${baseUsd} USD ${monthLabel}`);

                        return (
                            <div key={plan.id} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                                <div style={{marginBottom: 16}}>
                                    <h4 className="text-xl font-bold text-[#4A5568]">{plan.name}</h4>
                                </div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-left">
                                            <div className="text-2xl font-extrabold text-[#89C2D9]">{displayedPrice}</div>
                                            <div className="text-sm text-gray-500">{plan.subtitle}</div>
                                            {plan.note && (
                                                <div className="text-sm text-gray-500 italic mt-1">{plan.note}</div>
                                            )}
                                    </div>
                                </div>

                                <ul className="mt-4 space-y-3">
                                    {plan.features.map((f: string, i: number) => (
                                        <li key={i} className="flex items-start">
                                            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-[#A7E3EB] flex items-center justify-center mt-1">
                                                <span className="text-[#2C7A7B] text-xs font-bold">✓</span>
                                            </div>
                                            <span className="ml-3 text-gray-600">{convertFeatureText(f)}</span>
                                        </li>
                                    ))}
                                </ul>

                            </div>
                        );
                    })}
                </div>

                <p className="mt-6 text-sm text-gray-500 text-center">{t.pricing.disclaimer}</p>
            </div>
        </section>
    );
};

export default Plans;
