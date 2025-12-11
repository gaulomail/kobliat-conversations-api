import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';
import { KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';

const Login: React.FC = () => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (login(code)) {
            navigate('/');
        } else {
            setError('Invalid access code');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 transition-colors duration-300 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-brand-500/10 dark:bg-brand-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute -bottom-[20%] left-[30%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 p-10 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-slate-700/50 w-full max-w-md relative backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-500">
                <div className="flex flex-col items-center mb-8">
                    {/* Kobliat Logo */}
                    <div className="mb-6 relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
                        <img
                            src="/kobliat-favicon.png"
                            alt="Kobliat Logo"
                            className="w-20 h-20 object-contain drop-shadow-2xl relative z-10"
                        />
                    </div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 mb-2">
                        Kobliat Conversations
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-center text-sm font-medium">
                        Operations Dashboard
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-center text-xs mt-2">
                        Enter your access code to continue
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2" htmlFor="code">
                            Access Code
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <KeyRound className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="code"
                                type="password"
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value);
                                    setError('');
                                }}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
                                placeholder="••••••••"
                                autoFocus
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm mt-2 flex items-center gap-1 animate-in slide-in-from-left-2"><ShieldCheck size={14} /> {error}</p>}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all flex items-center justify-center gap-2 group"
                    >
                        <span>Access Dashboard</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 text-center">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        Hint: Standard access code is <code className="bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-gray-400 px-1 py-0.5 rounded font-mono">admin</code>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
