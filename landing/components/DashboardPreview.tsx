import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { COLORS } from '../constants';
import { useLanguage } from '../LanguageContext';

const PIE_COLORS = ['#89C2D9', '#61A5C2', '#2C7A7B', '#A7E3EB'];

const DashboardPreview: React.FC = () => {
    const { t } = useLanguage();

    const data = [
        { name: t.dashboard.chart.months[0], completadas: 40, retrasadas: 24, proyectadas: 60 },
        { name: t.dashboard.chart.months[1], completadas: 30, retrasadas: 13, proyectadas: 50 },
        { name: t.dashboard.chart.months[2], completadas: 50, retrasadas: 8, proyectadas: 65 },
        { name: t.dashboard.chart.months[3], completadas: 78, retrasadas: 5, proyectadas: 85 },
        { name: t.dashboard.chart.months[4], completadas: 89, retrasadas: 2, proyectadas: 90 },
    ];

    const pieData = [
        { name: t.dashboard.chart.types[0], value: 400 },
        { name: t.dashboard.chart.types[1], value: 300 },
        { name: t.dashboard.chart.types[2], value: 300 },
        { name: t.dashboard.chart.types[3], value: 200 },
    ];

    return (
        <section id="dashboard" className="py-20 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
                    
                    {/* Charts Section */}
                    <div className="lg:col-span-3 bg-gray-50 rounded-3xl p-6 md:p-8 shadow-inner border border-gray-100">
                        <div className="mb-8">
                            <h4 className="text-lg font-bold text-[#4A5568] mb-4">{t.dashboard.chartTitle}</h4>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={data}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="proyectadas" fill="#E2E8F0" radius={[4, 4, 0, 0]} name={t.dashboard.chart.proyectadas} />
                                        <Bar dataKey="completadas" fill={COLORS.primary} radius={[4, 4, 0, 0]} name={t.dashboard.chart.completadas} />
                                        <Bar dataKey="retrasadas" fill="#FC8181" radius={[4, 4, 0, 0]} name={t.dashboard.chart.retrasadas} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-4 rounded-2xl shadow-sm">
                                <h5 className="text-sm font-bold text-gray-500 mb-2">{t.dashboard.typesTitle}</h5>
                                <div className="h-40">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={60}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col justify-center">
                                <h5 className="text-sm font-bold text-gray-500 mb-2">{t.dashboard.efficiencyTitle}</h5>
                                <div className="text-4xl font-extrabold text-[#89C2D9]">94.2%</div>
                                <div className="text-sm text-green-500 font-medium">{t.dashboard.vsMonth}</div>
                                <div className="mt-4 w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-[#89C2D9] h-2 rounded-full" style={{ width: '94.2%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Text Section */}
                    <div className="lg:col-span-2">
                        <h2 className="text-3xl md:text-4xl font-bold text-[#4A5568] mb-6">
                            {t.dashboard.mainTitle} <span className="text-[#89C2D9]">{t.dashboard.mainTitleHighlight}</span>
                        </h2>
                        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                            {t.dashboard.description}
                        </p>
                        
                        <ul className="space-y-4">
                            {t.dashboard.list.map((item, i) => (
                                <li key={i} className="flex items-start">
                                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-[#A7E3EB] flex items-center justify-center mt-1">
                                        <span className="text-[#2C7A7B] text-xs font-bold">✓</span>
                                    </div>
                                    <span className="ml-3 text-gray-600">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DashboardPreview;