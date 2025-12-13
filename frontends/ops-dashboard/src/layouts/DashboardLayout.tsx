import React, { type ReactNode, useState, useRef, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Bell, Search, User, Settings, LogOut, MessageSquare, Terminal, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardLayoutProps {
    children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    // Dropdown States
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);

    // Data States
    const [notifications, setNotifications] = useState<any[]>([]);

    // Refs for click outside
    const userMenuRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    // Fetch Notifications
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/v1/notifications', {
                    headers: { 'X-API-Key': 'kobliat-secret-key' }
                });
                if (response.ok) {
                    const data = await response.json();
                    setNotifications(data);
                }
            } catch (error) {
                console.error('Failed to fetch notifications', error);
            }
        };

        fetchNotifications();
    }, []);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearchResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search Logic
    const searchableItems = [
        { name: 'Service Logs', path: '/service-logs', icon: <Terminal size={14} /> },
        { name: 'Live Chat', path: '/chat', icon: <MessageSquare size={14} /> },
        { name: 'Settings', path: '/settings', icon: <Settings size={14} /> },
    ];

    const filteredItems = searchableItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSearchNav = (path: string) => {
        navigate(path);
        setSearchQuery('');
        setShowSearchResults(false);
    };

    const handleLogout = () => {
        if (confirm("Are you sure you want to logout?")) {
            localStorage.clear();
            window.location.href = '/login';
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300 font-sans text-gray-900 dark:text-gray-100 selection:bg-indigo-500/30">
            <Sidebar />

            {/* Main Content Wrapper - Adjusted for 72px (w-72) sidebar */}
            <div className="ml-72 min-h-screen flex flex-col">
                {/* MUI-like AppBar */}
                <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 sticky top-0 z-20 px-8 flex items-center justify-between shadow-sm transition-colors duration-300">

                    {/* Functional Search Bar */}
                    <div className="flex items-center gap-4 flex-1 max-w-xl relative" ref={searchRef}>
                        <div className="relative group w-full max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search pages..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSearchResults(true);
                                }}
                                onFocus={() => setShowSearchResults(true)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-slate-800 border-none rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
                            />
                        </div>

                        {/* Search Results Dropdown */}
                        {showSearchResults && searchQuery && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                {filteredItems.length > 0 ? (
                                    <div className="p-1">
                                        <div className="text-xs font-semibold text-gray-400 px-3 py-2 uppercase tracking-wide">Quick Jump</div>
                                        {filteredItems.map((item) => (
                                            <button
                                                key={item.path}
                                                onClick={() => handleSearchNav(item.path)}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md text-sm text-gray-700 dark:text-gray-200 transition-colors text-left"
                                            >
                                                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded text-indigo-500">
                                                    {item.icon}
                                                </div>
                                                {item.name}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No results found for "{searchQuery}"
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`p-2 rounded-full transition-colors relative ${showNotifications ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800'}`}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                                    <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>
                                        <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium">{unreadCount} New</span>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-6 text-center text-sm text-gray-500">No notifications</div>
                                        ) : (
                                            notifications.map((notif) => (
                                                <div key={notif.id} className="p-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer border-b border-gray-50 dark:border-slate-800/50 last:border-none flex gap-3">
                                                    <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${notif.color === 'red' ? 'bg-red-500' : notif.color === 'green' ? 'bg-green-500' : notif.color === 'yellow' ? 'bg-amber-400' : 'bg-blue-500'}`} />
                                                    <div>
                                                        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{notif.title}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                                                        <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="p-2 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50 text-center">
                                        <button className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">Mark all as read</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-1"></div>

                        <button
                            onClick={toggleTheme}
                            className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-600" />}
                        </button>

                        {/* User Menu */}
                        <div className="relative pl-2" ref={userMenuRef}>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-3 focus:outline-none group"
                            >
                                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold border-2 border-white dark:border-slate-800 shadow-md group-hover:shadow-lg transition-all">
                                    <User size={18} />
                                </div>
                            </button>

                            {/* User Dropdown */}
                            {showUserMenu && (
                                <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                                    <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Admin User</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">admin@kobliat.com</p>
                                    </div>
                                    <div className="p-1">
                                        <button
                                            onClick={() => navigate('/settings')}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                                        >
                                            <Settings size={16} className="text-gray-400" />
                                            Settings
                                        </button>
                                        <button
                                            onClick={() => navigate('/chat')}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                                        >
                                            <Bot size={16} className="text-gray-400" />
                                            AI Chat
                                        </button>
                                    </div>
                                    <div className="p-1 border-t border-gray-100 dark:border-slate-800">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-8">
                    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
