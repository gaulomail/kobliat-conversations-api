import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, LogOut, Activity, Server, MessageSquare } from 'lucide-react';
import { logout } from '../services/auth';


const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/chat', icon: <MessageSquare size={20} />, label: 'AI Chat' },
        { path: '/logs', icon: <FileText size={20} />, label: 'API Logs' },
        { path: '/service-logs', icon: <Activity size={20} />, label: 'Service Logs' },
        { path: '/services', icon: <Server size={20} />, label: 'Services' },
        { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
    ];

    return (
        <aside className="w-72 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col fixed h-full z-20 shadow-xl transition-colors duration-300">
            {/* Logo Section */}
            <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-white to-gray-50 dark:from-slate-900 dark:to-slate-800 z-10">
                <div className="flex items-center gap-3">
                    <img
                        src="/kobliat-favicon.png"
                        alt="Kobliat Logo"
                        className="w-10 h-10 object-contain drop-shadow-lg"
                    />
                    <div className="flex flex-col">
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400">
                            Kobliat
                        </span>
                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 tracking-wider uppercase">
                            Operations
                        </span>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                <p className="px-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Main Menu</p>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden
                            ${isActive
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-200'
                            }`
                        }
                    >
                        {item.icon}
                        <span>{item.label}</span>
                        {/* Status Indicator for active item */}
                        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-r-full transition-opacity duration-200 ${location.pathname === item.path ? 'opacity-100' : 'opacity-0'}`}></div>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-100 dark:border-slate-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors duration-200"
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
