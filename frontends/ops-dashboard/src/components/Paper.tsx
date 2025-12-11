import { type ReactNode } from 'react';

interface PaperProps {
    children: ReactNode;
    className?: string;
    elevation?: 0 | 1 | 2 | 3 | 4;
    padding?: boolean;
}

const Paper = ({ children, className = '', elevation = 1, padding = true }: PaperProps) => {
    const shadows = {
        0: 'border border-gray-100 dark:border-slate-800',
        1: 'shadow-sm border border-gray-100 dark:border-slate-800',
        2: 'shadow border-none',
        3: 'shadow-md border-none',
        4: 'shadow-xl border-none'
    };

    return (
        <div className={`bg-white dark:bg-slate-900 rounded-xl transition-shadow duration-300 ${shadows[elevation]} ${padding ? 'p-6' : ''} ${className}`}>
            {children}
        </div>
    );
};

export default Paper;
