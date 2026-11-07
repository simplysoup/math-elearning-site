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
viz.plot(f, { xMin, xMax, yMin, yMax, title }) — draws y = f(x)
  with axes and a grid. title, if given, is a heading above the
  plot. It returns { svg, toPx, toPy }, so you can draw extra
  elements (tangent lines, rectangles, points) in the same
  coordinates.
viz.readout(s) — the current values, rendered large and bold (use
  it for x and f(x), or the slope, or the sum). Put the sentence
  that explains what they mean in viz.text underneath it.
viz.values(rows, headers) — the current values as a small table,
  for when there is more than one (input, output) pair to show
  (e.g. both sides of a limit). rows is an array of arrays of cell
  strings; the first cell of each row is the label. headers, if
  given, labels the value columns. It returns { update(rows) },
  which rebuilds the table — call it from the draw function so
  the values stay live.
viz.autoplay(slider, to, ms) — animate a slider from its current
  value to the target over the given milliseconds, once, right
  after the viz loads, so the reader sees the phenomenon before
  touching anything. The value snaps to the slider's step. It
  stops the moment the reader touches the slider. Call it at
  the end of the code, after draw().
viz.redraw(f) — run f again whenever a slider moves. A plot clears
  its svg on every redraw, so re-add your own elements here, after
  the plot call, and they will be drawn on top each time.
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
