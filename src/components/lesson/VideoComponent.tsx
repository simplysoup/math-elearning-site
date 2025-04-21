import { VideoContent } from "../../types/course";

interface VideoComponentProps {
    content: VideoContent;
    onContinue?: () => void;
    isCurrent?: boolean;  // Add this prop
}

export const VideoComponent = ({ 
    content,
    onContinue,
    isCurrent = false  // Default to false
}: VideoComponentProps) => {
    return (
        <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded-lg">
                <div className="aspect-w-16 aspect-h-9 bg-black rounded">
                    <div className="flex items-center justify-center h-full">
                        <div className="text-white text-center">
                            <div className="text-lg font-medium mb-2">Video Content</div>
                            <div className="text-gray-300">
                                {content.data.caption || 'Video player will appear here'}
                            </div>
                            {content.data.duration && (
                                <div className="text-sm text-gray-400 mt-2">
                                    Duration: {content.data.duration} seconds
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {isCurrent && onContinue && (  // Only show if current and callback exists
                <button
                    onClick={onContinue}
                    className="px-4 py-2 bg-black-600 text-white rounded hover:bg-black-700"
                >
                    Continue
                </button>
            )}
        </div>
    );
};