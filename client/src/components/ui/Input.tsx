"use client";

import React, { useState } from 'react';
import { cn } from '@/utils/utils';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input = ({ label, error, className, type, icon, ...props }: InputProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    return (
        <div className="w-full space-y-2">
            {label && (
                <label className="text-sm font-bold text-gray-700 ml-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF1744] transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    type={isPassword ? (showPassword ? 'text' : 'password') : type}
                    className={cn(
                        "w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-[#FF1744] focus:bg-white transition-all outline-none text-gray-900 placeholder:text-gray-400 font-medium",
                        icon && "pl-12",
                        error && "border-red-500 bg-red-50",
                        className
                    )}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                )}
            </div>
            {error && (
                <p className="text-xs font-bold text-red-500 ml-1 mt-1 animate-in fade-in slide-in-from-top-1 duration-300">
                    {error}
                </p>
            )}
        </div>
    );
};
