import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'contained' | 'outlined' | 'text';
    color?: 'primary' | 'secondary' | 'error' | 'success';
    startIcon?: ReactNode;
    endIcon?: ReactNode;
    fullWidth?: boolean;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const Button = ({
    children,
    variant = 'contained',
    color = 'primary',
    fullWidth = false,
    onClick,
    disabled = false,
    startIcon,
    endIcon,
    className = '',
    size = 'md',
    ...props
}: ButtonProps) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const sizeStyles = {
        sm: "px-3 py-1.5 text-xs rounded-md",
        md: "px-4 py-2 text-sm rounded-lg",
        lg: "px-6 py-3 text-base rounded-xl"
    };

    const variants = {
        contained: {
            primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 dark:shadow-none focus:ring-indigo-500",
            secondary: "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 focus:ring-gray-500",
            error: "bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-200 dark:shadow-none focus:ring-red-500",
            success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 dark:shadow-none focus:ring-emerald-500"
        },
        outlined: {
            primary: "bg-transparent border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 focus:ring-indigo-500",
            secondary: "bg-transparent border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 focus:ring-gray-500",
            error: "bg-transparent border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:ring-red-500",
            success: "bg-transparent border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 focus:ring-emerald-500"
        },
        text: {
            primary: "bg-transparent text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 focus:ring-indigo-500",
            secondary: "bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 focus:ring-gray-500",
            error: "bg-transparent text-red-600 hover:bg-red-50 focus:ring-red-500",
            success: "bg-transparent text-emerald-600 hover:bg-emerald-50 focus:ring-emerald-500"
        }
    };

    return (
        <button
            className={`${baseStyles} ${sizeStyles[size]} ${variants[variant][color]} ${fullWidth ? 'w-full' : ''} ${className}`}
            onClick={onClick}
            disabled={disabled}
            {...props}
        >  {startIcon && <span className="mr-2 -ml-1">{startIcon}</span>}
            {children}
            {endIcon && <span className="ml-2 -mr-1">{endIcon}</span>}
        </button>
    );
};

export default Button;
