import React from 'react';
import { useLanguage } from '../LanguageContext';

const ContactSection: React.FC = () => {
    const { t } = useLanguage();

    return (
        <section id="contact" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-[#4A5568] rounded-3xl shadow-2xl overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        <div className="p-10 md:p-16 flex flex-col justify-center">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                                {t.contact.title}
                            </h2>
                            <p className="text-gray-300 text-lg mb-8">
                                {t.contact.description}
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center text-gray-300">
                                    <span className="w-8 h-8 rounded-full bg-[#89C2D9] flex items-center justify-center text-[#4A5568] font-bold mr-4">1</span>
                                    {t.contact.step1}
                                </div>
                                <div className="flex items-center text-gray-300">
                                    <span className="w-8 h-8 rounded-full bg-[#89C2D9] flex items-center justify-center text-[#4A5568] font-bold mr-4">2</span>
                                    {t.contact.step2}
                                </div>
                                <div className="flex items-center text-gray-300">
                                    <span className="w-8 h-8 rounded-full bg-[#89C2D9] flex items-center justify-center text-[#4A5568] font-bold mr-4">3</span>
                                    {t.contact.step3}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-10 md:p-16 flex items-center justify-center">
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-[#4A5568] mb-2">{t.nav.contact}</h3>
                                <p className="text-gray-600 mb-4">{t.contact.metaBase}</p>
                                <a href={t.contact.emailHref} className="inline-block bg-[#89C2D9] hover:bg-[#61A5C2] text-white font-bold py-3 px-6 rounded-lg shadow-md">{t.contact.email}</a>
                                <p className="text-sm text-gray-500 mt-3">{t.contact.note}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ContactSection;