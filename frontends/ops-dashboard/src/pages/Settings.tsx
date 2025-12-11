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
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage system configurations and preferences.</p>
            </div>

            <div className="space-y-6 max-w-4xl">
                {/* Appearance Section */}
                <section className="bg-white dark:bg-slate-900/50 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <Monitor size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Appearance</h2>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-950/50 rounded-lg border border-gray-100 dark:border-slate-800">
                        <div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-200">Theme Preference</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark modes.</p>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow transition-all"
                        >
                            {theme === 'dark' ? (
                                <>
                                    <Moon size={16} className="text-indigo-500" />
                                    <span className="text-sm font-medium dark:text-gray-200">Dark Mode</span>
                                </>
                            ) : (
                                <>
                                    <Sun size={16} className="text-amber-500" />
                                    <span className="text-sm font-medium text-gray-700">Light Mode</span>
                                </>
                            )}
                        </button>
                    </div>
                </section>

                {/* Dashboard Preferences */}
                <section className="bg-white dark:bg-slate-900/50 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <RefreshCw size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Dashboard Behavior</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-950/50 rounded-lg border border-gray-100 dark:border-slate-800">
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-gray-200">Auto-Refresh Logs</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Automatically refresh main dashboard every 30 seconds.</p>
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
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                        {showSuccess === 'refresh' && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in slide-in-from-top-1 text-right">Preference saved automatically.</p>
                        )}
                    </div>
                </section>

                {/* Data Retention (Mock) */}
                <section className="bg-white dark:bg-slate-900/50 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                            <Shield size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Data Retention Policy</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-slate-950/50 rounded-lg border border-gray-100 dark:border-slate-800">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Log Retention Period</label>
                            <select
                                value={retentionDays}
                                onChange={(e) => {
                                    setRetentionDays(e.target.value);
                                    handleSave('retention');
                                }}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm text-gray-900 dark:text-gray-100"
                            >
                                <option value="7">7 Days</option>
                                <option value="30">30 Days</option>
                                <option value="90">90 Days</option>
                                <option value="365">1 Year</option>
                            </select>
                            {showSuccess === 'retention' && (
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 animate-in fade-in">Policy updated successfully.</p>
                            )}
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-slate-950/50 rounded-lg border border-gray-100 dark:border-slate-800 flex flex-col justify-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-bold text-orange-500">Note:</span> changing this setting will not immediately delete logs. Cleaner runs nightly.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Danger Zone */}
                <section className="bg-red-50 dark:bg-red-900/10 p-6 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                            <Trash2 size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-red-900 dark:text-red-400">Danger Zone</h2>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">Reset Application Data</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Clear local storage, theme preferences, and logout.</p>
                        </div>
                        <button
                            onClick={handleClearLogs}
                            className="px-4 py-2 bg-white dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors"
                        >
                            Reset & Logout
                        </button>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
};

export default Settings;
