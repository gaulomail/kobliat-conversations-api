import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    startIcon?: ReactNode;
    fullWidth?: boolean;
    error?: boolean;
    helperText?: string;
}

const Input = ({
    label,
    startIcon,
    fullWidth = true,
    error = false,
    helperText,
    className = '',
    ...props
}: InputProps) => {
    return (
        <div className={`${fullWidth ? 'w-full' : ''}`}>
            {label && (
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                    {label}
                </label>
            )}
            <div className="relative">
                {startIcon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        {startIcon}
                    </div>
                )}
                <input
                    className={`
                        w-full py-2.5 
                        ${startIcon ? 'pl-10 pr-4' : 'px-4'} 
                        bg-white dark:bg-slate-950/50 
                        border-2 rounded-lg 
                        outline-none transition-all duration-200
                        placeholder-gray-400 dark:placeholder-gray-600
                        text-gray-900 dark:text-white
                        ${error
                            ? 'border-red-500 focus:border-red-600 focus:ring-4 focus:ring-red-500/10'
                            : 'border-gray-200 dark:border-slate-800 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                        }
                        ${className}
                    `}
                    {...props}
                />
            </div>
            {helperText && (
                <p className={`mt-1 text-xs ml-1 ${error ? 'text-red-500' : 'text-gray-500'}`}>
                    {helperText}
                </p>
            )}
        </div>
    );
};

export default Input;
