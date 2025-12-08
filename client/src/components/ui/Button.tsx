import React from 'react';
import { cn } from '@/utils/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline' | 'ghost';
    isLoading?: boolean;
    children: React.ReactNode;
}

export const Button = ({
    className,
    variant = 'primary',
    isLoading = false,
    children,
    disabled,
    ...props
}: ButtonProps) => {
    const variants = {
        primary: 'bg-[#FF1744] text-white hover:bg-[#D50000] shadow-lg shadow-red-100',
        outline: 'border-2 border-[#FF1744] text-[#FF1744] hover:bg-red-50',
        ghost: 'text-gray-600 hover:bg-gray-100',
    };

    return (
        <button
            className={cn(
                'inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
                variants[variant],
                className
            )}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
};
