<script lang="ts">
	import Editor from '#lib/components/Editor.svelte';
	import DocxFlow from '#lib/components/DocxFlow.svelte';
	import { i18n } from '#lib/i18n.svelte.ts';

	type Tab = 'editor' | 'word';
	const tabs: { id: Tab; tone: string; label: 'tabEditor' | 'tabWord' }[] = [
		{ id: 'editor', tone: 'motion', label: 'tabEditor' },
		{ id: 'word', tone: 'control', label: 'tabWord' }
	];

	let tab = $state<Tab>('editor');
	const t = $derived(i18n.t);

	// Arrow keys move between tabs (WAI-ARIA tabs pattern, automatic activation)
	function onTabKey(e: KeyboardEvent) {
		const i = tabs.findIndex((x) => x.id === tab);
		const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
		if (next === undefined) return;
		e.preventDefault();
		tab = tabs[(next + tabs.length) % tabs.length].id;
		document.getElementById(`tab-${tab}`)?.focus();
	}
</script>

<svelte:head>
	<title>text2scratch</title>
	<meta name="description" content="Scratch-Blöcke aus Text erzeugen und in Word-Klausuren einsetzen." />
</svelte:head>

<div class="wrap">
	<header class="top">
		<div class="brand">
			<h1>
				<span class="w-text">text</span><span class="sr">2</span><span class="w-block" aria-hidden="true">scratch</span
				><span class="sr">scratch</span>
			</h1>
			<p class="tagline">{t.tagline}</p>
		</div>
		<div class="lang" role="group" aria-label={t.blockLang}>
			<span class="label">{t.blockLang}</span>
			<div class="seg">
				{#each ['de', 'en'] as const as l}
					<button class:on={i18n.lang === l} aria-pressed={i18n.lang === l} onclick={() => i18n.set(l)}>
						{l.toUpperCase()}
					</button>
				{/each}
			</div>
		</div>
	</header>

	<div class="tabs" role="tablist" tabindex="-1" onkeydown={onTabKey}>
		{#each tabs as x (x.id)}
			<button
				role="tab"
				id="tab-{x.id}"
				aria-selected={tab === x.id}
				aria-controls="panel-{x.id}"
				tabindex={tab === x.id ? 0 : -1}
				class:on={tab === x.id}
				style="--tone: var(--{x.tone}); --tone-edge: var(--{x.tone}-edge)"
				onclick={() => (tab = x.id)}
			>
				{t[x.label]}
			</button>
		{/each}
	</div>

	<main>
		<!-- both panels stay mounted so switching tabs keeps the editor text and the loaded .docx -->
		<div id="panel-editor" role="tabpanel" aria-labelledby="tab-editor" hidden={tab !== 'editor'}>
			<Editor />
		</div>
		<div id="panel-word" role="tabpanel" aria-labelledby="tab-word" hidden={tab !== 'word'}>
			<DocxFlow />
		</div>
	</main>

	<footer class="foot">
		<span>{t.footer}</span>
		<span class="label">scratchblocks 3.6.4 · JSZip</span>
	</footer>
</div>

<style>
	.wrap {
		position: relative;
		z-index: 1;
		max-width: 1240px;
		margin: 0 auto;
		padding: 40px 24px 28px;
		display: flex;
		flex-direction: column;
		gap: 24px;
		min-height: 100vh;
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	.top {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 20px;
		flex-wrap: wrap;
		animation: snap 0.5s both cubic-bezier(0.2, 0.8, 0.2, 1.2);
	}
	h1 {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		font-family: var(--font-display);
		font-weight: 800;
		font-size: clamp(2.4rem, 7vw, 4.4rem);
		font-variation-settings: 'opsz' 96;
		line-height: 1;
		letter-spacing: -0.04em;
		margin: 0;
	}
	/* "scratch" set as a stack block snapping onto "text" */
	.w-block {
		margin-left: 0.12em;
		padding: 0.02em 0.3em 0.1em;
		background: var(--motion);
		color: var(--on-tone);
		border-radius: 0.14em;
		box-shadow: inset 0 -0.07em 0 var(--motion-edge);
		letter-spacing: -0.03em;
	}
	.tagline {
		margin: 12px 0 0;
		color: var(--ink-2);
		font-size: 1.1rem;
		font-weight: 500;
	}
	.lang {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	/* reporter-shaped segmented control */
	.seg {
		display: flex;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: var(--surface);
		padding: 3px;
		box-shadow: inset 0 -2px 0 var(--line);
	}
	.seg button {
		border: 0;
		background: none;
		padding: 0.3em 0.95em;
		border-radius: 999px;
		font-family: var(--font-mono);
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--ink-3);
	}
	.seg button.on {
		background: var(--operators);
		color: var(--on-tone);
		box-shadow: inset 0 -2px 0 var(--operators-edge);
	}

	/* hat-block tabs: dome on the left of the top edge */
	.tabs {
		display: flex;
		gap: 12px;
		padding-top: 14px;
		animation: snap 0.5s 0.08s both cubic-bezier(0.2, 0.8, 0.2, 1.2);
	}
	.tabs button {
		position: relative;
		border: 0;
		background: var(--surface);
		color: var(--ink-2);
		padding: 10px 22px 12px;
		border-radius: 4px 10px 10px 10px;
		font-size: 1rem;
		font-weight: 650;
		box-shadow: inset 0 -3px 0 var(--line);
		transition:
			transform 0.15s ease,
			background 0.15s ease;
	}
	.tabs button::before {
		content: '';
		position: absolute;
		left: 0;
		bottom: 100%;
		width: 64px;
		height: 12px;
		margin-bottom: -1px;
		background: inherit;
		border-radius: 50% 50% 0 0 / 100% 100% 0 0;
	}
	.tabs button:hover:not(.on) {
		transform: translateY(-2px);
		color: var(--ink);
	}
	.tabs button.on {
		background: var(--tone);
		color: var(--on-tone);
		box-shadow: inset 0 -3px 0 var(--tone-edge);
	}
	main {
		flex: 1;
		animation: snap 0.5s 0.16s both cubic-bezier(0.2, 0.8, 0.2, 1.2);
	}
	.foot {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
		font-size: 0.85rem;
		color: var(--ink-3);
		padding-top: 14px;
		border-top: 1px solid var(--line);
	}

	@keyframes snap {
		from {
			opacity: 0;
			transform: translateY(10px) scale(0.99);
		}
	}

	@media (max-width: 600px) {
		.wrap {
			padding: 24px 16px;
		}
		.tabs button {
			flex: 1;
			padding-inline: 12px;
		}
	}
</style>
