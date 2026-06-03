<script>
	let mobileOpen = $state(false);
	let scrolled = $state(false);

	$effect(() => {
		const onScroll = () => {
			// Hysteresis: turn on past 60px, off below 30px — prevents flicker
			// when scroll position oscillates around a single threshold.
			const y = window.scrollY;
			if (!scrolled && y > 60) scrolled = true;
			else if (scrolled && y < 30) scrolled = false;
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	function closeMobile() {
		mobileOpen = false;
	}

	const links = [
		{ href: '#why-aauth', label: 'Why AAuth' },
		{ href: '#how-it-works', label: 'How It Works' },
		{ href: '#get-started', label: 'Explore AAuth' },
		{ href: '#community', label: 'Community' },
		{ href: '#events', label: 'Events' }
	];
</script>

<nav
	class="fixed top-0 left-0 right-0 z-[100] border-b transition-[background-color,border-color] duration-300 {scrolled || mobileOpen
		? 'border-[var(--color-border)] bg-[var(--color-bg)]'
		: 'border-transparent'}"
	aria-label="Main"
>
	<a
		href="#events"
		class="flex items-center justify-center gap-2 h-8 px-4 text-xs sm:text-sm font-medium bg-[var(--color-accent)] text-[var(--color-on-accent)] hover:opacity-90 transition-opacity no-underline"
		onclick={closeMobile}
	>
		<span class="truncate">Join us for <span class="font-semibold">AAuth Night</span> in San Francisco.</span>
		<span class="whitespace-nowrap underline underline-offset-2">Find out more</span>
	</a>
	<div class="max-w-7xl mx-auto flex items-center justify-between gap-4 px-5 md:px-8 h-12">
	<a
		href="/"
		class="no-underline relative z-10 shrink-0"
		aria-label="AAuth"
		onclick={closeMobile}
	>
		<svg width="65" height="21" viewBox="0 0 234 76" fill="none" xmlns="http://www.w3.org/2000/svg" class="block">
			<path d="M201.488 0V75H187.426V0H201.488ZM199.486 46.7285H195.629C195.661 43.0501 196.15 39.6647 197.094 36.5723C198.038 33.4473 199.389 30.7454 201.146 28.4668C202.904 26.1556 205.004 24.3652 207.445 23.0957C209.919 21.8262 212.654 21.1914 215.648 21.1914C218.253 21.1914 220.613 21.5658 222.729 22.3145C224.877 23.0306 226.716 24.2025 228.246 25.8301C229.809 27.4251 231.013 29.5247 231.859 32.1289C232.706 34.7331 233.129 37.8906 233.129 41.6016V75H218.969V41.5039C218.969 39.1602 218.627 37.321 217.943 35.9863C217.292 34.6191 216.332 33.6589 215.062 33.1055C213.826 32.5195 212.296 32.2266 210.473 32.2266C208.454 32.2266 206.729 32.6009 205.297 33.3496C203.897 34.0983 202.774 35.14 201.928 36.4746C201.081 37.7767 200.463 39.3066 200.072 41.0645C199.682 42.8223 199.486 44.7103 199.486 46.7285Z" fill="#277346"/>
			<path d="M179.76 22.1699V32.1309H148.998V22.1699H179.76ZM156.615 9.13281H170.678V59.084C170.678 60.6139 170.873 61.7858 171.264 62.5996C171.687 63.4134 172.305 63.9831 173.119 64.3086C173.933 64.6016 174.958 64.748 176.195 64.748C177.074 64.748 177.855 64.7155 178.539 64.6504C179.255 64.5527 179.857 64.4551 180.346 64.3574L180.395 74.709C179.19 75.0996 177.888 75.4089 176.488 75.6367C175.089 75.8646 173.542 75.9785 171.85 75.9785C168.757 75.9785 166.055 75.474 163.744 74.4648C161.465 73.4232 159.708 71.763 158.471 69.4844C157.234 67.2057 156.615 64.2109 156.615 60.5V9.13281Z" fill="#277346"/>
			<path d="M129.076 62.3535V22.168H143.139V75H129.906L129.076 62.3535ZM130.639 51.5137L134.789 51.416C134.789 54.9316 134.382 58.2031 133.568 61.2305C132.755 64.2253 131.534 66.8294 129.906 69.043C128.279 71.224 126.228 72.9329 123.754 74.1699C121.28 75.3743 118.367 75.9766 115.014 75.9766C112.442 75.9766 110.066 75.6185 107.885 74.9023C105.736 74.1536 103.881 72.998 102.318 71.4355C100.788 69.8405 99.584 67.806 98.7051 65.332C97.8587 62.8255 97.4355 59.8145 97.4355 56.2988V22.168H111.498V56.3965C111.498 57.959 111.677 59.2773 112.035 60.3516C112.426 61.4258 112.963 62.3047 113.646 62.9883C114.33 63.6719 115.128 64.1602 116.039 64.4531C116.983 64.7461 118.025 64.8926 119.164 64.8926C122.061 64.8926 124.34 64.3066 126 63.1348C127.693 61.9629 128.881 60.3678 129.564 58.3496C130.281 56.2988 130.639 54.0202 130.639 51.5137Z" fill="#277346"/>
			<path d="M60.9121 16.0645L41.5762 75H26L52.416 3.90625H62.3281L60.9121 16.0645ZM76.9766 75L57.5918 16.0645L56.0293 3.90625H66.0391L92.6016 75H76.9766ZM76.0977 48.5352V60.0098H38.5488V48.5352H76.0977Z" fill="#277346"/>
			<path d="M34.9121 16.0645L15.5762 75H0L26.416 3.90625H36.3281L34.9121 16.0645ZM50.9766 75L31.5918 16.0645L30.0293 3.90625H40.0391L66.6016 75H50.9766ZM50.0977 48.5352V60.0098H12.5488V48.5352H50.0977Z" fill="#40D97B"/>
		</svg>
	</a>

	<div class="hidden md:flex items-center gap-7 lg:gap-8">
		{#each links as link}
			<a
				href={link.href}
				class="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors no-underline"
			>
				{link.label}
			</a>
		{/each}
	</div>

	<div class="flex md:hidden items-center gap-1">
		<button
			type="button"
			onclick={() => (mobileOpen = !mobileOpen)}
			class="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text)] transition-colors"
			aria-expanded={mobileOpen}
			aria-controls="mobile-nav-menu"
			aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
		>
			{#if mobileOpen}
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			{:else}
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			{/if}
		</button>
	</div>
	</div>
</nav>

{#if mobileOpen}
	<button
		type="button"
		class="fixed inset-0 z-[90] bg-black/40 md:hidden cursor-default border-0 p-0"
		onclick={closeMobile}
		aria-label="Close menu"
	></button>
	<div
		id="mobile-nav-menu"
		class="fixed top-[81px] left-0 right-0 z-[95] md:hidden border-b border-[var(--color-border)] bg-[var(--color-bg)] shadow-lg"
	>
		<div class="flex flex-col px-5 py-3 gap-1">
			{#each links as link}
				<a
					href={link.href}
					class="py-2.5 text-base font-medium text-[var(--color-text)] hover:text-[var(--color-accent)] no-underline"
					onclick={closeMobile}
				>
					{link.label}
				</a>
			{/each}
		</div>
	</div>
{/if}
