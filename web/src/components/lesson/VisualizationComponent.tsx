import { VisualizationContent } from "../../types/course";

interface VisualizationComponentProps {
    content: VisualizationContent;
    onContinue?: () => void;
    isCurrent?: boolean;  // Add this prop
}

export const VisualizationComponent = ({ 
    content,
    onContinue,
    isCurrent = false  // Default to false
}: VisualizationComponentProps) => {
    return (
        <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded-lg min-h-[300px] flex items-center justify-center">
                <div className="text-center">
                    <div className="text-lg font-medium mb-2">Interactive Visualization</div>
                    <div className="text-gray-500 mb-4">
                        {content.data.engine === 'plotly' && 'Plotly visualization will appear here'}
                        {content.data.engine === 'mathbox' && 'MathBox visualization will appear here'}
                        {content.data.engine === 'custom' && 'Custom visualization will appear here'}
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