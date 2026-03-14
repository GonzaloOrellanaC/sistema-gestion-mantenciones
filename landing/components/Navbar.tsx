import React, { useState, useEffect } from 'react';
import { Menu, X, Box, Globe } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const Navbar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { t, language, setLanguage } = useLanguage();
    const [showDemoPopup, setShowDemoPopup] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleLanguage = () => {
        setLanguage(language === 'es' ? 'en' : 'es');
    };

    const openClientAccess = () => {
        window.open('https://app-sgm.omtecnologia.cl', '_blank', 'noopener');
    };

    const navLinks = [
        { name: t.nav.home, href: '#hero' },
        { name: t.nav.features, href: '#features' },
        { name: t.nav.useCases, href: '#use-cases' },
        { name: t.nav.mobile, href: '#mobile' },
        { name: t.nav.dashboard, href: '#dashboard' },
        { name: t.nav.contact, href: '#contact' },
    ];

    return (
        <nav 
            className={`fixed w-full z-50 transition-all duration-300 ${
                scrolled ? 'bg-white/90 backdrop-blur-md shadow-md py-2' : 'bg-transparent py-4'
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo Section */}
                    <div className="flex items-center flex-shrink-0 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
                        {/* <div className="w-10 h-10 bg-gradient-to-br from-[#89C2D9] to-[#61A5C2] rounded-lg flex items-center justify-center mr-3 shadow-lg"> */}
                             {/* <Box color="white" size={24} strokeWidth={2.5} /> */}
                             <img src="/sgm-isotype.svg" alt="SGM" className="w-6 h-6" />
                        {/* </div> */}
                        <span className="font-bold text-2xl tracking-tight text-sgm-text">
                            SGM
                        </span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                className="text-gray-600 hover:text-[#89C2D9] font-medium transition-colors duration-200"
                            >
                                {link.name}
                            </a>
                        ))}
                        
                        {/* Language Toggle */}
                        <button 
                            onClick={toggleLanguage}
                            className="flex items-center text-gray-500 hover:text-[#89C2D9] transition-colors"
                        >
                            <Globe size={20} className="mr-1" />
                            <span className="uppercase font-bold text-sm">{language}</span>
                        </button>

                        <button onClick={openClientAccess} className="bg-[#89C2D9] hover:bg-[#61A5C2] text-white px-6 py-2 rounded-full font-medium transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                            {t.nav.clientAccess}
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center space-x-4">
                         {/* Mobile Language Toggle */}
                         <button 
                            onClick={toggleLanguage}
                            className="flex items-center text-gray-500 hover:text-[#89C2D9] transition-colors"
                        >
                            <Globe size={20} className="mr-1" />
                            <span className="uppercase font-bold text-sm">{language}</span>
                        </button>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-600 hover:text-gray-900 focus:outline-none"
                        >
                            {isOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-white shadow-xl absolute w-full">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#89C2D9] hover:bg-gray-50"
                            >
                                {link.name}
                            </a>
                        ))}
                        <div className="pt-4 pb-2">
                            <button onClick={() => { setIsOpen(false); openClientAccess(); }} className="w-full bg-[#89C2D9] text-white px-4 py-3 rounded-lg font-bold">
                                {t.nav.clientAccess}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Demo popup eliminado, ahora openClientAccess abre una nueva pestaña */}
        </nav>
    );
};

export default Navbar;