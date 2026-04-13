<script>
	let { chart } = $props();
	let container = $state();
	let svg = $state('');

	$effect(() => {
		if (!chart) return;
		let cancelled = false;
		(async () => {
			const { default: mermaid } = await import('mermaid');
			mermaid.initialize({
				startOnLoad: false,
				theme: 'base',
				fontFamily: 'JetBrains Mono, monospace',
				sequence: {
					useMaxWidth: true,
					actorMargin: 180,
					messageMargin: 45,
					boxMargin: 12,
					noteMargin: 12,
					mirrorActors: false,
					wrap: true
				},
				themeVariables: {
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
					noteBkgColor: '#1a1a25',
					noteBorderColor: '#2e2e42',
					noteTextColor: '#e4e4ed',
					activationBkgColor: '#2e2e42',
					activationBorderColor: '#55556a',
					sequenceNumberColor: '#e4e4ed'
				}
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
</script>

<div bind:this={container} class="w-full [&_svg]:w-full [&_svg]:h-auto">
	{@html svg}
</div>
