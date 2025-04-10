import React from 'react';
import Card from '@/components/Card';

interface FeatureCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    className?: string;
}

export default function FeatureCard({
    title,
    description,
    icon,
    className = '',
}: FeatureCardProps) {
    return (
        <Card
            variant="elevated"
            className={`p-6 ${className}`}
            hover={true}
        >
            <div className="flex flex-col">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4 text-indigo-600">
                    {icon}
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {title}
                </h3>

                <p className="text-gray-600 text-sm leading-relaxed">
                    {description}
                </p>
            </div>
        </Card>
    );
} 