import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  color?: 'orange' | 'blue' | 'green' | 'red';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  color = 'orange',
  size = 'md',
  animated = false,
  className = '',
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const colorClasses = {
    orange: 'bg-orange-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-300">{label}</span>
          {showPercentage && (
            <span className="text-sm text-gray-400">{clampedProgress.toFixed(1)}%</span>
          )}
        </div>
      )}
      
      <div className={`w-full bg-gray-700 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`h-full transition-all duration-300 ease-out ${colorClasses[color]} ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{
            width: `${clampedProgress}%`,
            background: animated
              ? `linear-gradient(90deg, ${colorClasses[color].replace('bg-', '')} 0%, ${colorClasses[color].replace('bg-', '').replace('600', '400')} 50%, ${colorClasses[color].replace('bg-', '')} 100%)`
              : undefined,
          }}
        />
      </div>
    </div>
  );
};