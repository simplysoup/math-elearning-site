import React from 'react';

interface ProgressBarProps {
    progress: number;
    isComplete?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, isComplete = false }) => {
    return (
        <div className="w-full bg-gray-200 h-2 fixed top-0 left-0 z-50">
            <div 
                className={`h-2 transition-all duration-300 ease-out ${
                    isComplete ? 'bg-green-500' : 'bg-blue-600'
                }`} 
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
            ></div>
        </div>
    );
};