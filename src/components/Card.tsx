import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'glass' | 'outlined' | 'elevated';
    border?: boolean;
    hover?: boolean;
}

export default function Card({
    children,
    className = '',
    variant = 'default',
    border = true,
    hover = true,
}: CardProps) {
    // 基本樣式
    const baseClasses = 'rounded-xl overflow-hidden transition-all duration-300';

    // 變體樣式
    const variantClasses = {
        default: 'bg-white',
        glass: 'glass backdrop-blur-md bg-white/70',
        outlined: 'bg-white/50 border border-gray-200',
        elevated: 'bg-white shadow-lg'
    };

    // 邊框樣式
    const borderClasses = border
        ? 'border border-gray-100'
        : '';

    // 懸停效果
    const hoverClasses = hover
        ? 'hover:shadow-lg hover:-translate-y-1'
        : '';

    return (
        <div
            className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${borderClasses}
        ${hoverClasses}
        ${className}
      `}
        >
            {children}
        </div>
    );
}
