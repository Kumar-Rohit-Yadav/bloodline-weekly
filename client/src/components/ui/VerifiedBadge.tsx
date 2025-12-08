import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/utils/utils';

interface VerifiedBadgeProps {
    className?: string;
    size?: number;
    showText?: boolean;
}

export const VerifiedBadge = ({ className, size = 14, showText = false }: VerifiedBadgeProps) => {
    return (
        <div className={cn("inline-flex items-center gap-1 text-blue-500", className)}>
            <div className="relative flex items-center justify-center">
                <ShieldCheck size={size} className="fill-blue-50" />
            </div>
            {showText && (
                <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
            )}
        </div>
    );
};
