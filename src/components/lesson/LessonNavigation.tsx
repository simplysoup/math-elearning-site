import { LessonNavigationProps } from "../../types/course";

export const LessonNavigation = ({ 
    currentIndex, 
    totalContents, 
    onPrevious, 
    onContinue 
}: LessonNavigationProps) => {
    return (
        <div className="flex justify-between mt-8">
            <button 
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                disabled={currentIndex === 0}
                onClick={onPrevious}
            >
                Previous
            </button>
            <button 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={onContinue}
            >
                {currentIndex === totalContents - 1 ? 'Complete Lesson' : 'Continue'}
            </button>
        </div>
    );
};