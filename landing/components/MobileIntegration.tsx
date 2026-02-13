import React from 'react';
import { ScanLine, Globe, Camera, MapPin, List, Bell, User, Filter } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const MobileIntegration: React.FC = () => {
    const { t } = useLanguage();

    const sampleOTs = [
        { id: '40291', title: 'Orden', status: 'In Progress', progress: 0, location: 'Sin ubicación', date: '7/2/2026' },
        { id: '2', title: 'Orden', status: 'In Progress', progress: 0, location: 'Sin ubicación', date: '1/3/2026' },
        { id: '30', title: 'Orden', status: 'In Progress', progress: 0, location: 'Sin ubicación', date: '14/3/2026' },
        { id: '12', title: 'Orden', status: 'Assigned', progress: 0, location: 'Sin ubicación', date: '25/3/2026' }
    ];

    return (
        <section id="mobile" className="py-20 bg-[#F7FAFC] relative overflow-hidden">
             {/* Abstract background shape */}
             <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-full h-96 bg-[#89C2D9] skew-y-3 opacity-10"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    
                    {/* Phone Mockup */}
                    <div className="w-full lg:w-1/2 flex justify-center">
                        <div className="relative mx-auto border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-2xl">
                            <div className="rounded-[2rem] overflow-hidden w-[272px] h-[572px] bg-white relative flex flex-col">
                                {/* App Header */}
                                <div className="bg-[#89C2D9] p-4 flex items-center justify-between">
                                    <div>
                                        <div className="text-white font-bold">Carlos Ramirez</div>
                                        <div className="text-white text-xs opacity-90">Órdenes Pendientes: 11</div>
                                    </div>
                                    <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center text-white font-semibold">C</div>
                                </div>

                                {/* List of OT cards */}
                                <div className="p-3 overflow-auto flex-1 space-y-3">
                                    {sampleOTs.map((ot) => (
                                        <div key={ot.id} className="relative bg-white rounded-xl shadow p-3 pl-6">
                                            <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-orange-400 rounded-r"></div>
                                            <div className="text-xs text-gray-400">OT #{ot.id}</div>
                                            <div className="font-bold text-gray-800">{ot.title}</div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="text-[11px] bg-gray-100 rounded-full px-2 py-1">{ot.status}</div>
                                                <div className="text-[11px] bg-gray-100 rounded-full px-2 py-1">Progreso: {ot.progress}%</div>
                                            </div>
                                            <div className="flex items-center text-xs text-gray-500 gap-2 mt-3">
                                                <MapPin size={12} /> <span>{ot.location}</span>
                                                <span className="mx-1">·</span>
                                                <span>{ot.date}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* FAB inside mock */}
                                <div className="absolute right-4 bottom-16">
                                    <button className="w-12 h-12 bg-sky-500 text-white rounded-full shadow-lg flex items-center justify-center">
                                        <Filter size={18} />
                                    </button>
                                </div>

                                {/* Bottom Nav */}
                                <div className="border-t px-3 py-2 flex items-center justify-between">
                                    <div className="flex flex-col items-center text-xs text-slate-500">
                                        <List size={18} />
                                        <span>Órdenes</span>
                                    </div>
                                    <div className="flex flex-col items-center text-xs text-slate-500 relative">
                                        <Bell size={18} />
                                        <span>Notificaciones</span>
                                        <div className="absolute -top-2 -right-4 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[11px]">3</div>
                                    </div>
                                    <div className="flex flex-col items-center text-xs text-slate-500">
                                        <User size={18} />
                                        <span>Perfil</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="w-full lg:w-1/2">
                        <div className="inline-block px-3 py-1 bg-blue-100 text-[#4A5568] rounded-full text-xs font-bold mb-4">
                            {t.mobile.badge}
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-[#4A5568] mb-6">
                            {t.mobile.title}
                        </h2>
                        <p className="text-gray-600 text-lg mb-8">
                            {t.mobile.description}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="flex items-start">
                                <div className="bg-white p-3 rounded-lg shadow-sm text-[#89C2D9]">
                                    <ScanLine size={24} />
                                </div>
                                <div className="ml-4">
                                    <h4 className="font-bold text-gray-700">{t.mobile.scanTitle}</h4>
                                    <p className="text-sm text-gray-500 mt-1">{t.mobile.scanDesc}</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="bg-white p-3 rounded-lg shadow-sm text-[#89C2D9]">
                                    <Camera size={24} />
                                </div>
                                <div className="ml-4">
                                    <h4 className="font-bold text-gray-700">{t.mobile.photoTitle}</h4>
                                    <p className="text-sm text-gray-500 mt-1">{t.mobile.photoDesc}</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="bg-white p-3 rounded-lg shadow-sm text-[#89C2D9]">
                                    <Globe size={24} />
                                </div>
                                <div className="ml-4">
                                    <h4 className="font-bold text-gray-700">{t.mobile.noInstallTitle}</h4>
                                    <p className="text-sm text-gray-500 mt-1">{t.mobile.noInstallDesc}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MobileIntegration;