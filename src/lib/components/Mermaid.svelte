<script>
	import { onMount } from 'svelte';

	let { chart } = $props();
	let container = $state();
	let svg = $state('');
	/** Bumps when `data-theme` on <html> changes so diagrams re-render for light/dark. */
	let themeVersion = $state(0);

	const mermaidThemeDark = {
		background: '#1a1a25',
		primaryColor: '#12121a',
		primaryTextColor: '#e4e4ed',
		primaryBorderColor: '#2e2e42',
		secondaryColor: '#12121a',
		tertiaryColor: '#12121a',
		lineColor: '#55556a',
		textColor: '#e4e4ed',
		actorBkg: '#12121a',
		actorBorder: '#2e2e42',
		actorTextColor: '#e4e4ed',
		actorLineColor: '#55556a',
		signalColor: '#8888a0',
		signalTextColor: '#e4e4ed',
		labelBoxBkgColor: '#1a1a25',
		labelBoxBorderColor: '#2e2e42',
		labelTextColor: '#e4e4ed',
		loopTextColor: '#e4e4ed',
		noteBkgColor: '#2e2844',
		noteBorderColor: '#4b3f7a',
		noteTextColor: '#e4e4ed',
		activationBkgColor: '#2e2e42',
		activationBorderColor: '#55556a',
		sequenceNumberColor: '#e4e4ed'
	};

	const mermaidThemeLight = {
		background: '#eef1f6',
		primaryColor: '#ffffff',
		primaryTextColor: '#0f172a',
		primaryBorderColor: '#d8dee8',
		secondaryColor: '#f8fafc',
		tertiaryColor: '#f8fafc',
		lineColor: '#64748b',
		textColor: '#0f172a',
		actorBkg: '#ffffff',
		actorBorder: '#cbd5e1',
		actorTextColor: '#0f172a',
		actorLineColor: '#64748b',
		signalColor: '#475569',
		signalTextColor: '#0f172a',
		labelBoxBkgColor: '#eef1f6',
		labelBoxBorderColor: '#cbd5e1',
		labelTextColor: '#0f172a',
		loopTextColor: '#0f172a',
		noteBkgColor: '#e0e7ff',
		noteBorderColor: '#6366f1',
		noteTextColor: '#1e1b4b',
		activationBkgColor: '#cbd5e1',
		activationBorderColor: '#94a3b8',
		sequenceNumberColor: '#0f172a'
	};

	onMount(() => {
		const obs = new MutationObserver(() => {
			themeVersion++;
		});
		obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
		return () => obs.disconnect();
	});

	function countSignals(src) {
		return src
			.split('\n')
			.filter((ln) => /->>|-->>|Note /.test(ln)).length;
	}

	$effect(() => {
		if (!chart) return;
		themeVersion;
		const isLight = typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light';
		let cancelled = false;
		(async () => {
			const { default: mermaid } = await import('mermaid');
			const signals = Math.max(countSignals(chart), 1);
			const targetContentH = 350;
			const messageMargin = Math.round(targetContentH / signals);
			mermaid.initialize({
				startOnLoad: false,
				theme: 'base',
				fontFamily: 'JetBrains Mono, monospace',
				sequence: {
					useMaxWidth: true,
					actorMargin: 120,
					messageMargin,
					boxMargin: 8,
					noteMargin: 8,
					mirrorActors: false,
					wrap: false,
					messageFontFamily: 'JetBrains Mono, monospace',
					noteFontFamily: 'JetBrains Mono, monospace',
					actorFontFamily: 'JetBrains Mono, monospace'
				},
				themeVariables: isLight ? mermaidThemeLight : mermaidThemeDark
			});
			const id = 'm' + Math.random().toString(36).slice(2);
			try {
				const { svg: rendered } = await mermaid.render(id, chart);
				if (!cancelled) svg = rendered;
			} catch (e) {
				if (!cancelled) svg = `<pre class="text-red-400 text-xs">${e.message}</pre>`;
			}
		})();
		return () => { cancelled = true; };
	});

	$effect(() => {
		svg;
		if (!container) return;
		requestAnimationFrame(() => {
			const svgEl = container.querySelector('svg');
			if (!svgEl) return;
			svgEl.style.maxWidth = '';
			const vb = svgEl.viewBox?.baseVal;
			if (!vb) return;
			const targetH = Math.max(vb.height, 560);
			// Extend lifelines: any line or path that's clearly vertical and long
			svgEl.querySelectorAll('line').forEach((line) => {
				const y1 = parseFloat(line.getAttribute('y1'));
				const y2 = parseFloat(line.getAttribute('y2'));
				const x1 = parseFloat(line.getAttribute('x1'));
				const x2 = parseFloat(line.getAttribute('x2'));
				if (!isNaN(y1) && !isNaN(y2) && Math.abs(x1 - x2) < 2 && y2 - y1 > 50) {
					line.setAttribute('y2', String(targetH));
				}
			});
			svgEl.querySelectorAll('path').forEach((p) => {
				const d = p.getAttribute('d') || '';
				// Simple vertical path like "M x y L x y2" with tall span
				const m = d.match(/^\s*M\s*(-?[\d.]+)[\s,]+(-?[\d.]+)\s*L\s*(-?[\d.]+)[\s,]+(-?[\d.]+)\s*$/);
				if (m) {
					const x1 = parseFloat(m[1]);
					const y1 = parseFloat(m[2]);
					const x2 = parseFloat(m[3]);
					const y2 = parseFloat(m[4]);
					if (Math.abs(x1 - x2) < 2 && y2 - y1 > 50) {
						p.setAttribute('d', `M ${x1} ${y1} L ${x1} ${targetH}`);
					}
				}
			});
			const targetW = Math.max(vb.width, 1200);
			svgEl.setAttribute('viewBox', `${vb.x} ${vb.y} ${targetW} ${targetH}`);
			svgEl.setAttribute('height', String(targetH));


		});
	});
</script>

<div bind:this={container} class="mermaid-scroll w-full">
	{@html svg}
</div>
