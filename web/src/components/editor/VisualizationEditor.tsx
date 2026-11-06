import { useRef, useState } from "react";
import { CustomVizFrame } from "../lesson/CustomVizFrame";
import { VIZ_EXAMPLE } from "./vizExample";

interface VisualizationEditorProps {
  code: string;
  onChange: (data: { engine: string; config: { kind: string; code: string } }) => void;
}

const VIZ_API_HELP = `The code runs in a sandboxed frame, in the student's browser.
It gets a viz object and the frame's document.

viz.slider(label, min, max, start, step) — a slider; read its
  current value as slider.value. Plots redraw when it moves.
viz.plot(f, { xMin, xMax, yMin, yMax }) — draws y = f(x) with axes.
viz.text(s) — a line of text under the graph.
viz.clear() — empty the frame.
You can also use document and SVG directly for anything else.`;

const VisualizationEditor = ({ code, onChange }: VisualizationEditorProps) => {
  const [runToken, setRunToken] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const setCode = (next: string) =>
    onChange({ engine: "custom", config: { kind: "custom-code", code: next } });

  const uploadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setCode(reader.result);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">
        Visualization code (JavaScript)
        <textarea
          aria-label="Visualization code"
          value={code}
          rows={12}
          spellCheck={false}
          onChange={(e) => setCode(e.target.value)}
          className="mt-1 w-full px-3 py-2 border border-rule rounded-sm bg-paper font-mono text-sm"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRunToken((n) => n + 1)}
          className="px-4 py-2 bg-ink hover:bg-pencil text-white rounded-sm text-sm font-medium"
        >
          Run preview
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="px-4 py-2 bg-paper hover:bg-gray-100 rounded-sm border border-rule text-sm font-medium"
        >
          Upload .js file
        </button>
        <button
          type="button"
          onClick={() => setCode(VIZ_EXAMPLE)}
          className="px-4 py-2 bg-paper hover:bg-gray-100 rounded-sm border border-rule text-sm font-medium"
        >
          Reset to example
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".js,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadFile(file);
            e.target.value = "";
          }}
        />
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer font-medium">How the viz API works</summary>
        <pre className="mt-2 whitespace-pre-wrap font-mono text-sm bg-gray-50 border border-rule rounded-sm p-3">
          {VIZ_API_HELP}
        </pre>
      </details>
      <CustomVizFrame code={code} runToken={runToken} title="Visualization preview" />
    </div>
  );
};

export default VisualizationEditor;
