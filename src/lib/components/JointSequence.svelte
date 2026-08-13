<script module>
	export const TOP_PAD = 16;
	export const ACTOR_H = 40;
	export const STEP_GAP = 52;
	export const NOTE_GAP = 38;
	export const FIRST_GAP = 44;

	/** Compute the SVG height a JointSequence will render for a given step list. */
	export function computeHeight(steps) {
		let y = TOP_PAD + ACTOR_H + FIRST_GAP;
		for (let i = 1; i < steps.length; i++) {
			y += steps[i].note || steps[i - 1].note ? NOTE_GAP : STEP_GAP;
		}
		return y + STEP_GAP;
	}
</script>

<script>
	import { onMount } from 'svelte';

	/**
	 * @typedef {{from?: string, to?: string, lines?: string[], dashed?: boolean, note?: string}} Step
	 * @typedef {{ participants: string[], steps: Step[], minHeight?: number }} Props
	 */

	/** @type {Props} */
	let { participants, steps, minHeight = 0 } = $props();

	let container = $state();
	let themeVersion = $state(0);

	const themes = {
		dark: {
			bg: 'transparent',
			actorBg: '#12121a',
			actorBorder: '#2e2e42',
			actorText: '#e4e4ed',
			lifeline: '#55556a',
			arrow: '#8888a0',
			arrowText: '#e4e4ed',
			noteBg: '#2e2844',
			noteBorder: '#4b3f7a',
			noteText: '#e4e4ed'
		},
		light: {
			bg: 'transparent',
			actorBg: '#ffffff',
			actorBorder: '#cbd5e1',
			actorText: '#0f172a',
			lifeline: '#64748b',
			arrow: '#475569',
			arrowText: '#0f172a',
			noteBg: '#e0e7ff',
			noteBorder: '#6366f1',
			noteText: '#1e1b4b'
		}
	};

	onMount(() => {
		const mql = window.matchMedia('(prefers-color-scheme: light)');
		const onChange = () => themeVersion++;
		mql.addEventListener('change', onChange);
		return () => mql.removeEventListener('change', onChange);
	});

	$effect(() => {
		if (!container) return;
		themeVersion;
		const isLight = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches;
		const theme = isLight ? themes.light : themes.dark;

		let cancelled = false;
		(async () => {
			const joint = await import('@joint/core');
			if (cancelled || !container) return;

			container.innerHTML = '';

			const W = 1100;
			const ACTOR_W = 180;
			const LEFT_PAD = ACTOR_W / 2 + 20;

			// Actor X positions
			const usable = W - LEFT_PAD * 2;
			const xs = participants.map((_, i) =>
				LEFT_PAD + (participants.length === 1 ? usable / 2 : (usable * i) / (participants.length - 1))
			);
			const actorIndex = Object.fromEntries(participants.map((p, i) => [p, i]));

			// Compute total height based on steps. Use NOTE_GAP whenever either side of the
			// boundary is a note, so the gap before and after a note is symmetric.
			let cursorY = TOP_PAD + ACTOR_H + FIRST_GAP;
			const stepYs = steps.map((s, i) => {
				if (i > 0) {
					const prev = steps[i - 1];
					cursorY += s.note || prev.note ? NOTE_GAP : STEP_GAP;
				}
				return cursorY;
			});
			const H = Math.max(cursorY + STEP_GAP, minHeight);
			// Lifelines stop just past the last message rather than running to the bottom of the
			// box. Diagrams share one height (minHeight) so switching tabs doesn't shift the page;
			// without this a short diagram trails dashed lines through the reserved space.
			const lifelineEnd = Math.min(H - 10, cursorY + STEP_GAP - 10);

			const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
			const paper = new joint.dia.Paper({
				el: container,
				model: graph,
				width: '100%',
				height: H,
				background: { color: theme.bg },
				interactive: false,
				cellViewNamespace: joint.shapes
			});

			// Set responsive viewBox
			const svg = container.querySelector('svg');
			if (svg) {
				svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
				svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
				svg.style.width = '100%';
				svg.style.height = 'auto';
				svg.style.maxHeight = `${H}px`;
			}

			// Lifelines (dashed verticals)
			xs.forEach((x) => {
				const line = new joint.shapes.standard.Link({
					source: { x, y: TOP_PAD + ACTOR_H },
					target: { x, y: lifelineEnd },
					attrs: {
						line: {
							stroke: theme.lifeline,
							strokeWidth: 1,
							strokeDasharray: '4 4',
							targetMarker: null,
							sourceMarker: null
						}
					}
				});
				line.addTo(graph);
			});

			// Actor heads (top)
			participants.forEach((name, i) => {
				const head = new joint.shapes.standard.Rectangle({
					position: { x: xs[i] - ACTOR_W / 2, y: TOP_PAD },
					size: { width: ACTOR_W, height: ACTOR_H },
					attrs: {
						body: {
							fill: theme.actorBg,
							stroke: theme.actorBorder,
							strokeWidth: 1,
							rx: 4,
							ry: 4
						},
						label: {
							text: name,
							fill: theme.actorText,
							fontFamily: 'JetBrains Mono, monospace',
							fontSize: 13
						}
					}
				});
				head.addTo(graph);
			});

			// Derive note span from neighbouring message step (prev preferred, then next).
			function noteSpan(i) {
				const neighbour =
					steps.slice(0, i).reverse().find((s) => s.from && s.to) ||
					steps.slice(i + 1).find((s) => s.from && s.to);
				if (neighbour) {
					const a = actorIndex[neighbour.from];
					const b = actorIndex[neighbour.to];
					if (a != null && b != null) return [Math.min(a, b), Math.max(a, b)];
				}
				return [0, Math.min(1, participants.length - 1)];
			}

			// Messages
			steps.forEach((step, i) => {
				const y = stepYs[i];
				if (step.note) {
					const [aIdx, bIdx] = noteSpan(i);
					const x1 = xs[aIdx];
					const x2 = xs[bIdx];
					const note = new joint.shapes.standard.Rectangle({
						position: { x: x1 - 60, y: y - 16 },
						size: { width: x2 - x1 + 120, height: 32 },
						attrs: {
							body: { fill: theme.noteBg, stroke: theme.noteBorder, rx: 2, ry: 2 },
							label: {
								text: step.note,
								fill: theme.noteText,
								fontFamily: 'JetBrains Mono, monospace',
								fontSize: 11
							}
						}
					});
					note.addTo(graph);
					return;
				}

				const fromX = xs[actorIndex[step.from]];
				const toX = xs[actorIndex[step.to]];
				if (fromX == null || toX == null) return;

				const link = new joint.shapes.standard.Link({
					source: { x: fromX, y },
					target: { x: toX, y },
					attrs: {
						line: {
							stroke: theme.arrow,
							strokeWidth: 1.5,
							strokeDasharray: step.dashed ? '5 4' : 'none',
							targetMarker: {
								type: 'path',
								d: 'M 8 -5 0 0 8 5 z',
								fill: theme.arrow,
								stroke: theme.arrow
							}
						}
					}
				});

				// Label lines stacked above arrow — block centered on arrow midpoint, lines flush-left within block
				const lines = step.lines || [];
				const maxChars = lines.reduce((m, t) => Math.max(m, t.length), 0);
				const blockHalfW = (maxChars * 7.2) / 2; // monospace ~7.2px/char at 12px
				const labels = lines.map((text, idx) => ({
					position: {
						distance: 0.5,
						offset: { x: -blockHalfW, y: -10 - (lines.length - 1 - idx) * 14 }
					},
					attrs: {
						rect: { fill: 'none', stroke: 'none' },
						text: {
							text,
							fill: theme.arrowText,
							fontFamily: 'JetBrains Mono, monospace',
							fontSize: 12,
							textAnchor: 'start'
						}
					}
				}));
				link.labels(labels);
				link.addTo(graph);
			});
		})();

		return () => {
			cancelled = true;
		};
	});
</script>

<div bind:this={container} class="w-full overflow-hidden"></div>

<style>
	div :global(.joint-element),
	div :global(.joint-element *),
	div :global(.joint-link),
	div :global(.joint-link *) {
		cursor: default;
	}
</style>
