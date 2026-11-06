// The starting code for a new teacher-written visualization.
// The viz API: viz.slider(label, min, max, start, step),
// viz.plot(f, { xMin, xMax, yMin, yMax }), viz.text(s), viz.clear().
// Anything drawn with viz.plot redraws when a slider moves.
export const VIZ_EXAMPLE = `// Move the sliders and watch the graph change.
const freq = viz.slider('frequency', 1, 5, 2, 1);
const amp = viz.slider('amplitude', 0.5, 2, 1, 0.5);
viz.plot(x => amp.value * Math.sin(freq.value * x), { xMin: 0, xMax: 6.28, yMin: -2, yMax: 2 });
viz.text('A sine wave: y = a · sin(f · x).');
`;
