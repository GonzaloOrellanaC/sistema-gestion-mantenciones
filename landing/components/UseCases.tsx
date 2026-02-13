import React from 'react';
import { useLanguage } from '../LanguageContext';

const UseCases: React.FC = () => {
    const { t } = useLanguage();

    const cases = [
        {
            ...t.useCases.items[0],
            image: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        },
        {
            ...t.useCases.items[1],
            image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        },
        {
            ...t.useCases.items[2],
            image: "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        }
    ];

    return (
        <section id="use-cases" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-[#89C2D9] font-bold tracking-wide uppercase text-sm mb-2">{t.useCases.sectionTitle}</h2>
                    <h3 className="text-3xl md:text-4xl font-bold text-[#4A5568]">{t.useCases.mainTitle}</h3>
                    <p className="mt-4 text-gray-600 text-lg max-w-2xl mx-auto">
                        {t.useCases.description}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {cases.map((item, index) => (
                        <div key={index} className="group relative rounded-2xl overflow-hidden shadow-xl cursor-pointer h-[500px]">
                            {/* Background Image */}
                            <img 
                                src={item.image} 
                                alt={item.context} 
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#2D3748] via-[#2D3748]/60 to-transparent opacity-90 transition-opacity duration-300"></div>

                            {/* Content */}
                            <div className="absolute bottom-0 left-0 p-8 w-full transform transition-transform duration-300 translate-y-4 group-hover:translate-y-0">
                                <div className="inline-block px-4 py-1.5 bg-[#89C2D9] text-white text-xs font-bold uppercase tracking-wider rounded-full mb-4 shadow-md">
                                    {item.context}
                                </div>
                                <h4 className="text-2xl font-bold text-white mb-3">{item.title}</h4>
                                <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-300 opacity-0 group-hover:opacity-100">
                                     <p className="text-gray-200 text-sm leading-relaxed pb-2">
                                        {item.description}
                                    </p>
                                </div>
                                <div className="w-12 h-1 bg-[#A7E3EB] rounded-full mt-4 group-hover:w-full transition-all duration-500"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default UseCases;