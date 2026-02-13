import React from 'react';
import { ClipboardList, Smartphone, PackageSearch, Users, BarChart3, ShieldCheck } from 'lucide-react';
import { COLORS } from '../constants';
import { useLanguage } from '../LanguageContext';

const Features: React.FC = () => {
    const { t } = useLanguage();

    const features = [
        {
            icon: <ClipboardList size={32} color={COLORS.primary} />,
            ...t.features.items[0]
        },
        {
            icon: <Smartphone size={32} color={COLORS.primary} />,
            ...t.features.items[1]
        },
        {
            icon: <PackageSearch size={32} color={COLORS.primary} />,
            ...t.features.items[2]
        },
        {
            icon: <ShieldCheck size={32} color={COLORS.primary} />,
            ...t.features.items[3]
        },
        {
            icon: <BarChart3 size={32} color={COLORS.primary} />,
            ...t.features.items[4]
        },
        {
            icon: <Users size={32} color={COLORS.primary} />,
            ...t.features.items[5]
        }
    ];

    return (
        <section id="features" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-[#89C2D9] font-bold tracking-wide uppercase text-sm mb-2">{t.features.sectionTitle}</h2>
                    <h3 className="text-3xl md:text-4xl font-bold text-[#4A5568]">{t.features.mainTitle}</h3>
                    <p className="mt-4 text-gray-600 text-lg">
                        {t.features.description}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div 
                            key={index} 
                            className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                        >
                            <div className="w-14 h-14 bg-[#E6F6F9] rounded-xl flex items-center justify-center mb-6">
                                {feature.icon}
                            </div>
                            <h4 className="text-xl font-bold text-[#4A5568] mb-3">{feature.title}</h4>
                            <p className="text-gray-500 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;