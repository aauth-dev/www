<script>
	function readThemeFromDocument() {
		if (typeof document === 'undefined') return 'dark';
		return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
	}

	let mobileOpen = $state(false);
	let theme = $state(readThemeFromDocument());

	$effect(() => {
		if (typeof document === 'undefined') return;
		localStorage.setItem('theme', theme);
		document.documentElement.dataset.theme = theme;
	});

	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
	}

	function closeMobile() {
		mobileOpen = false;
	}

	const links = [
		{ href: '#why-aauth', label: 'Why AAuth' },
		{ href: '#how-it-works', label: 'How It Works' },
		{ href: '#get-started', label: 'Explore AAuth' },
		{ href: '#community', label: 'Community' }
	];
</script>

<nav
	class="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between gap-4 px-5 md:px-8 py-3.5 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 backdrop-blur-md"
	aria-label="Main"
>
	<a
		href="/"
		class="font-display text-xl md:text-2xl font-bold tracking-tight text-[var(--color-accent)] no-underline shrink-0"
		onclick={closeMobile}
	>
		AAuth
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
		<button
			type="button"
			onclick={toggleTheme}
			class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text)] transition-colors border border-transparent hover:border-[var(--color-border)]"
			aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
			title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
		>
			{#if theme === 'dark'}
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
					/>
				</svg>
			{:else}
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
					/>
				</svg>
			{/if}
		</button>
	</div>

	<div class="flex md:hidden items-center gap-1">
		<button
			type="button"
			onclick={toggleTheme}
			class="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text)] transition-colors"
			aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
		>
			{#if theme === 'dark'}
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
					/>
				</svg>
			{:else}
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
					/>
				</svg>
			{/if}
		</button>
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
		class="fixed top-[57px] left-0 right-0 z-[95] md:hidden border-b border-[var(--color-border)] bg-[var(--color-bg)] shadow-lg"
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
