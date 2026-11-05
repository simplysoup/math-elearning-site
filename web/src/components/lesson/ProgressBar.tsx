import React from 'react';

interface ProgressBarProps {
    progress: number;
    isComplete?: boolean;
}

// isComplete is accepted for callers that track completion, but the bar
// itself is always the same pencil-red mark; completion shows in the
// lesson, not in the bar's color.
export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
    return (
        <div className="w-full bg-rule h-1 fixed top-0 left-0 z-50">
            <div
                className="h-1 bg-pencil transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
            ></div>
        </div>
    );
};