import React from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const Hero: React.FC = () => {
    const { t } = useLanguage();
    return (
        <section id="hero" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-[#A7E3EB] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-0 left-0 -ml-20 -mt-20 w-[500px] h-[500px] bg-[#89C2D9] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    
                    {/* Text Content */}
                    <div className="text-center lg:text-left">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#E6F6F9] text-[#61A5C2] text-sm font-semibold mb-6">
                            <span className="flex h-2 w-2 rounded-full bg-[#61A5C2] mr-2"></span>
                            {t.hero.badge}
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#4A5568] leading-tight mb-6">
                            {t.hero.title} <span className="text-[#89C2D9]">{t.hero.titleHighlight}</span> {t.hero.titleEnd}
                        </h1>
                        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                            {t.hero.description}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <button className="px-8 py-4 bg-[#89C2D9] hover:bg-[#61A5C2] text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center">
                                {t.hero.ctaDemo}
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </button>
                            <button className="px-8 py-4 bg-white text-[#4A5568] border-2 border-gray-100 hover:border-[#89C2D9] rounded-xl font-bold text-lg transition-all flex items-center justify-center">
                                {t.hero.ctaFeatures}
                            </button>
                        </div>

                        <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-4 text-sm text-gray-500">
                            <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-[#89C2D9] mr-2" />
                                {t.hero.check1}
                            </div>
                            <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-[#89C2D9] mr-2" />
                                {t.hero.check2}
                            </div>
                            <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-[#89C2D9] mr-2" />
                                {t.hero.check3}
                            </div>
                        </div>
                    </div>

                    {/* Image/Visual Content */}
                    <div className="relative">
                        <div className="relative rounded-2xl shadow-2xl overflow-hidden border-4 border-white bg-white">
                             {/* Placeholder for Main UI Shot */}
                             <img 
                                src="/dashboard_landing.png" 
                                alt="Dashboard Interface" 
                                className="w-full h-auto object-cover opacity-90"
                             />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;