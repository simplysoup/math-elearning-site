import { useState } from "react";
import { VisualizationContent } from "../../types/course";
import { CustomVizFrame } from "./CustomVizFrame";

interface VisualizationComponentProps {
    content: VisualizationContent;
    onContinue?: () => void;
    isCurrent?: boolean;
}

type LinearCombineConfig = {
    kind: "linear-combine";
    title?: string;
    prompt?: string;
    a?: number;
    b?: number;
    x?: number;
    a_min?: number;
    a_max?: number;
    b_min?: number;
    b_max?: number;
    x_min?: number;
    x_max?: number;
};

type CustomCodeConfig = {
    kind: "custom-code";
    code?: string;
    prompt?: string;
};

const W = 560;
const H = 340;
const PAD_L = 44;
const PAD_B = 32;
const PAD_T = 16;
const PAD_R = 16;
const X_MAX = 10;
const Y_MAX = 100;

const toPx = (x: number) => PAD_L + (x / X_MAX) * (W - PAD_L - PAD_R);
const toPy = (y: number) => H - PAD_B - (y / Y_MAX) * (H - PAD_T - PAD_B);
const line = (m: number) => `M ${toPx(0)} ${toPy(0)} L ${toPx(X_MAX)} ${toPy(m * X_MAX)}`;

/** First real visualization: combine like terms, ax + bx.
 * Move the sliders and watch the three lines: y = ax, y = bx, and
 * y = (a + b)x. The point on the bold line is the value at the
 * chosen x. No new dependency — plain SVG, so it works in the
 * existing Vite build and in the Docker image as built. */
export const VisualizationComponent = ({
    content,
    onContinue,
    isCurrent = false,
}: VisualizationComponentProps) => {
    const config = content.data.config as LinearCombineConfig | CustomCodeConfig | undefined;

    // Teacher-written JavaScript, run in a sandboxed iframe (see
    // CustomVizFrame). The frame cannot reach the parent page, the
    // user's session, or the site's API.
    if (content.data.engine === "custom" && config && config.kind === "custom-code") {
        return (
            <div className="space-y-3">
                {config.prompt && (
                    <p className="text-base leading-relaxed">{config.prompt}</p>
                )}
                <CustomVizFrame code={config.code || ""} />
            </div>
        );
    }

    if (content.data.engine !== "custom" || !config || config.kind !== "linear-combine") {
        return (
            <div className="border border-rule p-4 rounded-sm">
                <div className="text-lg font-medium mb-2">Interactive Visualization</div>
                <div className="text-gray-500">
                    This visualization kind ({content.data.engine}) is not supported yet.
                </div>
            </div>
        );
    }

    const [a, setA] = useState(config.a ?? 3);
    const [b, setB] = useState(config.b ?? 2);
    const [x, setX] = useState(config.x ?? 4);
    const total = a + b;
    const yA = a * x;
    const yB = b * x;
    const yTotal = total * x;

    return (
        <div className="space-y-4">
            <div>
                <div className="text-lg font-medium">{config.title ?? "Combine like terms"}</div>
                {config.prompt && <p className="text-gray-600 mt-1">{config.prompt}</p>}
            </div>

            <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full bg-white border border-rule rounded-sm"
                role="img"
                aria-label={`Graph of y equals ${a}x, y equals ${b}x, and y equals ${total}x, with x equal to ${x}`}
            >
                {[0, 20, 40, 60, 80, 100].map((y) => (
                    <g key={y}>
                        <line x1={PAD_L} y1={toPy(y)} x2={W - PAD_R} y2={toPy(y)} stroke="#e5e7eb" />
                        <text x={PAD_L - 8} y={toPy(y) + 4} textAnchor="end" fontSize="11" fill="#6b7280">{y}</text>
                    </g>
                ))}
                {[0, 2, 4, 6, 8, 10].map((v) => (
                    <text key={v} x={toPx(v)} y={H - 10} textAnchor="middle" fontSize="11" fill="#6b7280">{v}</text>
                ))}
                <line x1={PAD_L} y1={toPy(0)} x2={W - PAD_R} y2={toPy(0)} stroke="#9ca3af" />
                <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H - PAD_B} stroke="#9ca3af" />
                <text x={W - PAD_R} y={H - 10} textAnchor="end" fontSize="11" fill="#6b7280">x</text>
                <text x={PAD_L} y={12} textAnchor="middle" fontSize="11" fill="#6b7280">y</text>

                <path d={line(a)} fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="6 4" />
                <path d={line(b)} fill="none" stroke="#16a34a" strokeWidth="2" strokeDasharray="6 4" />
                <path d={line(total)} fill="none" stroke="#111827" strokeWidth="3" />
                <circle cx={toPx(x)} cy={toPy(yTotal)} r="6" fill="#111827" />
                <text x={toPx(x) + 10} y={toPy(yTotal) - 10} fontSize="13" fontWeight="bold" fill="#111827">
                    ({x}, {yTotal})
                </text>
            </svg>

            <div className="flex flex-wrap gap-4 text-sm">
                <span><span className="text-blue-600 font-semibold">— —</span> y = {a}x = {yA}</span>
                <span><span className="text-green-600 font-semibold">— —</span> y = {b}x = {yB}</span>
                <span><span className="font-semibold">——</span> y = {total}x = {yTotal}</span>
            </div>
            <p className="text-gray-700">
                {a}x + {b}x = {yA} + {yB} = {yTotal}. The two dashed lines add up to the bold line — that is why {a}x + {b}x = {total}x.
            </p>

            <div className="space-y-3">
                <label className="block text-sm">
                    <span className="font-medium">a = {a}</span>
                    <input type="range" min={config.a_min ?? 1} max={config.a_max ?? 5} step="1" value={a}
                        onChange={(e) => setA(Number(e.target.value))} className="w-full" aria-label="Coefficient a" />
                </label>
                <label className="block text-sm">
                    <span className="font-medium">b = {b}</span>
                    <input type="range" min={config.b_min ?? 1} max={config.b_max ?? 5} step="1" value={b}
                        onChange={(e) => setB(Number(e.target.value))} className="w-full" aria-label="Coefficient b" />
                </label>
                <label className="block text-sm">
                    <span className="font-medium">x = {x}</span>
                    <input type="range" min={config.x_min ?? 0} max={config.x_max ?? 10} step="1" value={x}
                        onChange={(e) => setX(Number(e.target.value))} className="w-full" aria-label="Value of x" />
                </label>
            </div>

            {isCurrent && onContinue && (
                <button
                    onClick={onContinue}
                    className="px-4 py-2 bg-black text-white rounded hover:bg-gray-700"
                >
                    Continue
                </button>
            )}
        </div>
    );
};
