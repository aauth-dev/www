<script>
	let scrolled = $state(false);

	$effect(() => {
		const onScroll = () => {
			scrolled = window.scrollY > 20;
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});
</script>

<nav
	class="fixed top-0 left-0 right-0 z-50 border-b border-transparent transition-[background-color,backdrop-filter,border-color] duration-300 {scrolled
		? 'bg-[var(--color-bg)]/90 backdrop-blur-md border-[var(--color-border)]'
		: ''}"
>
	<div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
		<a href="/" class="font-bold text-xl tracking-tight text-white no-underline">
			AAuth
		</a>
		<div class="flex items-center gap-6 text-sm">
			<a href="#how-it-works" class="text-[var(--color-text-muted)] hover:text-white transition-colors no-underline">How It Works</a>
			<a href="#specs" class="text-[var(--color-text-muted)] hover:text-white transition-colors no-underline">Specs</a>
			<a href="#get-started" class="text-[var(--color-text-muted)] hover:text-white transition-colors no-underline">Get Started</a>
			<a
				href="https://github.com/dickhardt/AAuth"
				target="_blank"
				rel="noopener"
				class="text-[var(--color-text-muted)] hover:text-white transition-colors no-underline"
			>
				GitHub ↗
			</a>
		</div>
	</div>
</nav>
