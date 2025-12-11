
import React, { type ReactNode } from 'react';

interface StatCardProps {
    title: string;
    value: string;
    icon: ReactNode;
    trend?: string;
    trendUp?: boolean; // Keep for backward compatibility if needed, or deprecate
    isPositive?: boolean;
    isNeutral?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp, isPositive, isNeutral }) => {
    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 backdrop-blur-sm transition-all hover:shadow-md hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                    {icon}
                </div>
                <div className="flex items-center gap-1">
                    {trend && (
                        <span className={`text-sm font-medium ${isNeutral ? 'text-gray-500 dark:text-gray-400' :
                            isPositive === false ? 'text-red-500' :
                                isPositive === true ? 'text-emerald-500' :
                                    trendUp ? 'text-emerald-500' : 'text-red-500'
                            } `}>
                            {trend}
                        </span>
                    )}
                </div>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</h3>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
        </div>
    );
};

export default StatCard;
