import { useEffect, useRef, useState } from "react";

/**
 * Renders teacher-written visualization code inside a sandboxed iframe.
 *
 * The iframe loads the static /viz-host.html page with
 * sandbox="allow-scripts" and nothing else: no allow-same-origin, so
 * the frame gets an opaque origin and cannot read the parent page,
 * the user's session, cookies, localStorage, or the site's API. The
 * parent only passes the code in with postMessage and listens for
 * height / ready / error reports back. The frame's content is never
 * read from the parent side.
 *
 * `runToken` re-runs the code when it changes (the editor's Run
 * button). On the lesson page the code never changes, so it runs
 * once on load.
 */
interface CustomVizFrameProps {
  code: string;
  runToken?: number;
  title?: string;
}

export const CustomVizFrame = ({ code, runToken = 0, title }: CustomVizFrameProps) => {
  const ref = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [height, setHeight] = useState(240);
  const [status, setStatus] = useState<"idle" | "ready" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!ref.current || e.source !== ref.current.contentWindow) return;
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type === "viz-height" && typeof e.data.height === "number") {
        setHeight(Math.min(Math.max(e.data.height, 120), 900));
      } else if (e.data.type === "viz-ready") {
        setStatus("ready");
        setError("");
      } else if (e.data.type === "viz-error") {
        setStatus("error");
        setError(typeof e.data.message === "string" ? e.data.message : "Unknown error");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setStatus("idle");
    setError("");
    ref.current?.contentWindow?.postMessage({ type: "run-viz", code }, "*");
  }, [loaded, code, runToken]);

  return (
    <div>
      <iframe
        ref={ref}
        src="/viz-host.html"
        title={title || "Interactive visualization"}
        sandbox="allow-scripts"
        style={{ height }}
        className="w-full border border-rule rounded-sm bg-white"
        data-viz-status={status}
        data-viz-error={error}
        onLoad={() => setLoaded(true)}
      />
      {status === "error" && (
        <p className="text-sm text-red-600 mt-2">
          This visualization has an error: {error}
        </p>
      )}
    </div>
  );
};
