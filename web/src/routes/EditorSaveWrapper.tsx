import CourseEditorPage from "../pages/CourseEditorPage";
import { ContentBlock } from "../types/editor";

const EditorSaveWrapper = () => {
  const handleSave = (content: ContentBlock[]) => {
    console.log('Saving content:', content);
    // Add your save logic here (API call, etc.)
  };

  return <CourseEditorPage onSave={handleSave} />;
};

export default EditorSaveWrapper;