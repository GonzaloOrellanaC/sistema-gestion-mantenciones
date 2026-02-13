import React from 'react';
import { Box, Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const Footer: React.FC = () => {
    const { t } = useLanguage();

    return (
        <footer className="bg-white pt-16 pb-8 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center mb-4">
                            {/* <Box color="white" size={18} /> */}
                            <img src="/sgm-isotype.svg" alt="SGM" className="w-6 h-6" />
                            <span className="font-bold text-xl text-[#4A5568]">SGM</span>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            {t.footer.description}
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-[#4A5568] mb-4">{t.footer.colPlatform}</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><a href="#" className="hover:text-[#89C2D9]">{t.footer.links.features}</a></li>
                            <li><a href="#" className="hover:text-[#89C2D9]">{t.footer.links.mobile}</a></li>
                            <li><a href="#" className="hover:text-[#89C2D9]">{t.footer.links.integrations}</a></li>
                            <li><a href="#" className="hover:text-[#89C2D9]">{t.footer.links.pricing}</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-[#4A5568] mb-4">{t.footer.colCompany}</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><a href="#" className="hover:text-[#89C2D9]">{t.footer.links.about}</a></li>
                            <li><a href="#" className="hover:text-[#89C2D9]">{t.footer.links.cases}</a></li>
                            <li><a href="#" className="hover:text-[#89C2D9]">{t.footer.links.blog}</a></li>
                            <li><a href="#" className="hover:text-[#89C2D9]">{t.footer.links.support}</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-[#4A5568] mb-4">{t.footer.colContact}</h4>
                        <ul className="space-y-3 text-sm text-gray-500">
                            <li className="flex items-center">
                                <Mail size={16} className="mr-2 text-[#89C2D9]" />
                                contacto@omtecnologia.cl
                            </li>
                            <li className="flex items-center">
                                <Phone size={16} className="mr-2 text-[#89C2D9]" />
                                +56 9 1234 5678
                            </li>
                            <li className="flex items-center">
                                <MapPin size={16} className="mr-2 text-[#89C2D9]" />
                                Santiago, Chile
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-sm text-gray-400">
                        &copy; {new Date().getFullYear()} {t.footer.rights}
                    </p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                         <a href="#" className="text-gray-400 hover:text-[#89C2D9] text-sm">{t.footer.links.privacy}</a>
                         <a href="#" className="text-gray-400 hover:text-[#89C2D9] text-sm">{t.footer.links.terms}</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;