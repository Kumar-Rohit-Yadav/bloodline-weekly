import React from 'react';
import { cn } from '@/utils/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> { }

export const Card = ({ className, ...props }: CardProps) => (
    <div className={cn('bg-white rounded-3xl border border-gray-100 shadow-sm', className)} {...props} />
);

export const CardHeader = ({ className, ...props }: CardProps) => (
    <div className={cn('p-6 pb-2', className)} {...props} />
);

export const CardContent = ({ className, ...props }: CardProps) => (
    <div className={cn('p-6 pt-0', className)} {...props} />
);

export const CardFooter = ({ className, ...props }: CardProps) => (
    <div className={cn('p-6 pt-0 flex items-center', className)} {...props} />
);
