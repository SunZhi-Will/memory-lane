import React from 'react';

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    iconLeft?: React.ReactNode;
    iconRight?: React.ReactNode;
    className?: string;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
}

export default function Button({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    iconLeft,
    iconRight,
    className = '',
    disabled = false,
    type = 'button',
}: ButtonProps) {
    const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center justify-center';

    const variantClasses = {
        primary: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500',
        secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 focus:ring-gray-500',
        outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700 focus:ring-gray-500'
    };

    const sizeClasses = {
        sm: 'text-xs px-3 py-1.5',
        md: 'text-sm px-4 py-2',
        lg: 'text-base px-5 py-2.5'
    };

    const disabledClasses = disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
        >
            {iconLeft && <span className="mr-2">{iconLeft}</span>}
            {children}
            {iconRight && <span className="ml-2">{iconRight}</span>}
        </button>
    );
}
