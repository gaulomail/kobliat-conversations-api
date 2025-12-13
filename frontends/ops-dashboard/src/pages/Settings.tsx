import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Moon, Sun, RefreshCw, Trash2, Shield, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Settings: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const [autoRefresh, setAutoRefresh] = useState(() => localStorage.getItem('autoRefresh') === 'true');
    const [retentionDays, setRetentionDays] = useState('30');
    const [showSuccess, setShowSuccess] = useState('');

    useEffect(() => {
        localStorage.setItem('autoRefresh', String(autoRefresh));
    }, [autoRefresh]);

    const handleClearLogs = () => {
        if (confirm('Are you sure you want to clear all local application data? This will log you out.')) {
            localStorage.clear();
            window.location.href = '/login';
        }
    };

    const handleSave = (section: string) => {
        setShowSuccess(section);
        setTimeout(() => setShowSuccess(''), 2000);
    };

    return (
        <DashboardLayout>
            {/* Animated Background Blob */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />
            </div>

            <div className="flex flex-col h-full relative z-10">
                <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                    <h1 className="text-4xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-gray-600 dark:from-white dark:via-indigo-200 dark:to-gray-400 bg-clip-text text-transparent">
                        System Configuration
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg max-w-2xl leading-relaxed">
                        Fine-tune your dashboard experience with our advanced preference engine.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 items-start">

                    {/* Card 1: Appearance */}
                    <section className="bg-white/70 dark:bg-slate-900/60 p-1 rounded-3xl shadow-xl backdrop-blur-md border border-white/20 dark:border-white/5 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards" style={{ animationDelay: '0ms' }}>
                        <div className="h-full bg-gradient-to-b from-white/50 to-white/20 dark:from-slate-800/50 dark:to-slate-900/20 p-6 rounded-[22px]">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-2xl shadow-lg shadow-indigo-500/30 transform transition-transform hover:scale-110 hover:rotate-3 duration-300">
                                    <Monitor size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Interface</h2>
                                    <p className="text-xs font-medium text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">Visual Customization</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="group relative">
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-200 mb-3">Theme Mode</h3>
                                    <div className="relative p-1 bg-gray-100 dark:bg-slate-950 rounded-xl flex">
                                        <div
                                            className={`absolute inset-y-1 w-1/2 rounded-lg bg-white dark:bg-slate-800 shadow-sm transition-all duration-300 ease-spring ${theme === 'light' ? 'left-1' : 'left-[calc(50%-4px)] translate-x-1'}`}
                                        />
                                        <button
                                            onClick={() => theme !== 'light' && toggleTheme()}
                                            className={`relative z-10 w-1/2 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${theme === 'light' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}
                                        >
                                            <Sun size={16} /> Light
                                        </button>
                                        <button
                                            onClick={() => theme !== 'dark' && toggleTheme()}
                                            className={`relative z-10 w-1/2 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${theme === 'dark' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}
                                        >
                                            <Moon size={16} /> Dark
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Card 2: Behavior */}
                    <section className="bg-white/70 dark:bg-slate-900/60 p-1 rounded-3xl shadow-xl backdrop-blur-md border border-white/20 dark:border-white/5 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards" style={{ animationDelay: '150ms' }}>
                        <div className="h-full bg-gradient-to-b from-white/50 to-white/20 dark:from-slate-800/50 dark:to-slate-900/20 p-6 rounded-[22px]">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3.5 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-2xl shadow-lg shadow-emerald-500/30 transform transition-transform hover:scale-110 hover:-rotate-3 duration-300">
                                    <RefreshCw size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Telemetry</h2>
                                    <p className="text-xs font-medium text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">Data Stream</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-gray-100/50 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                    <div className="space-y-0.5">
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-200">Live Updates</h3>
                                        <p className="text-xs text-gray-500">Poll logs every 5s</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={autoRefresh}
                                            onChange={(e) => {
                                                setAutoRefresh(e.target.checked);
                                                handleSave('refresh');
                                            }}
                                        />
                                        <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500 shadow-inner"></div>
                                    </label>
                                </div>
                                {showSuccess === 'refresh' && (
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in slide-in-from-top-2 text-center font-bold bg-emerald-50 dark:bg-emerald-900/20 py-2 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                                        ✓ Preference Updated
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Card 3: Storage */}
                    <section className="bg-white/70 dark:bg-slate-900/60 p-1 rounded-3xl shadow-xl backdrop-blur-md border border-white/20 dark:border-white/5 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards" style={{ animationDelay: '300ms' }}>
                        <div className="h-full bg-gradient-to-b from-white/50 to-white/20 dark:from-slate-800/50 dark:to-slate-900/20 p-6 rounded-[22px]">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3.5 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-2xl shadow-lg shadow-blue-500/30 transform transition-transform hover:scale-110 hover:rotate-6 duration-300">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Retention</h2>
                                    <p className="text-xs font-medium text-blue-500 dark:text-blue-400 uppercase tracking-wider">Lifecycle Policy</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="relative group">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">Log Expiry</label>
                                    <div className="relative">
                                        <select
                                            value={retentionDays}
                                            onChange={(e) => {
                                                setRetentionDays(e.target.value);
                                                handleSave('retention');
                                            }}
                                            className="w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-950/80 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium text-gray-900 dark:text-gray-100 appearance-none cursor-pointer hover:border-gray-300 dark:hover:border-slate-600"
                                        >
                                            <option value="7">7 Days</option>
                                            <option value="30">30 Days</option>
                                            <option value="90">90 Days</option>
                                            <option value="365">1 Year</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                        </div>
                                    </div>
                                    <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                    Enforced nightly by automated cleaner
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Danger Zone */}
                    <section className="col-span-1 md:col-span-2 lg:col-span-3 mt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards" style={{ animationDelay: '450ms' }}>
                        <div className="relative overflow-hidden p-[1px] rounded-3xl bg-gradient-to-r from-red-200 via-orange-200 to-red-200 dark:from-red-900/40 dark:via-orange-900/40 dark:to-red-900/40">
                            <div className="relative bg-white/90 dark:bg-slate-950/90 p-8 rounded-[23px] backdrop-blur-xl">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />

                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl text-red-500 dark:text-red-400 shadow-inner">
                                            <Trash2 size={32} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Danger Zone</h2>
                                            <p className="text-gray-500 dark:text-gray-400 max-w-md">
                                                Irreversible actions. Resetting brings the application back to its factory default state.
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleClearLogs}
                                        className="group relative px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-all hover:scale-[1.02] active:scale-95 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rotate-12" />
                                        <span className="relative flex items-center gap-3">
                                            <Trash2 size={20} />
                                            Reset Application Data
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Settings;
